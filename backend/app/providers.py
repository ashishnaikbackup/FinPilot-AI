"""Public-source adapters. All providers return source and freshness metadata.

No unofficial exchange scraping is performed here. NSE/BSE live data requires
an appropriately licensed feed; this module reports that limitation explicitly.
"""
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

import httpx

from .config import settings


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_json(url: str, *, params: dict[str, Any] | None = None,
                   headers: dict[str, str] | None = None) -> Any:
    async with httpx.AsyncClient(timeout=settings.http_timeout_seconds,
                                 follow_redirects=True) as client:
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()


def provider_status() -> dict[str, Any]:
    return {
        "as_of": utc_now(),
        "market_quotes": {
            "status": "not_connected",
            "freshness": "unavailable",
            "message": "No licensed exchange quote feed is configured. Prices are intentionally not fabricated.",
            "official_sources": [
                {"name": "NSE market data products", "url": "https://www.nseindia.com/market-data"},
                {"name": "BSE market data", "url": "https://www.bseindia.com/"},
            ],
        },
        "india_macro": {
            "status": "public_api",
            "freshness": "periodic_not_live",
            "provider": "RBI Database on Indian Economy (DBIE)",
            "url": "https://dev.dbie.rbihub.in/docs/using-the-site",
        },
        "global_macro": {
            "status": "public_api",
            "freshness": "dataset_dependent",
            "provider": "World Bank Indicators API",
            "url": "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392",
        },
        "global_news": {
            "status": "public_discovery",
            "freshness": "publisher_dependent",
            "provider": "GDELT DOC API",
            "url": "https://www.gdeltproject.org/",
            "caveat": "Discovery feed only; verify important claims against original and primary sources.",
        },
        "us_filings": {
            "status": "configured" if settings.sec_user_agent else "needs_contact_user_agent",
            "freshness": "filings_updated_as_disseminated",
            "provider": "US SEC EDGAR",
            "url": "https://www.sec.gov/edgar/sec-api-documentation",
        },
    }


async def search_dbie(query: str, limit: int = 20) -> dict[str, Any]:
    payload = await get_json(
        "https://data-api.dbie.rbihub.in/api/search",
        params={"q": query},
    )
    return {
        "provider": "RBI Database on Indian Economy (DBIE)",
        "source_url": "https://data-api.dbie.rbihub.in/api/search",
        "retrieved_at": utc_now(),
        "freshness": "periodic_not_live",
        "query": query,
        "results": payload,
        "note": "DBIE observations have different frequencies and vintages. Check each table's period, unit and revision notes.",
    }


async def world_bank_indicator(country: str, indicator: str, per_page: int = 12) -> dict[str, Any]:
    country_code = country.upper()
    safe_indicator = quote(indicator, safe=".")
    payload = await get_json(
        f"https://api.worldbank.org/v2/country/{country_code}/indicator/{safe_indicator}",
        params={"format": "json", "per_page": min(max(per_page, 1), 50)},
    )
    rows = payload[1] if isinstance(payload, list) and len(payload) > 1 and isinstance(payload[1], list) else []
    observations = [{
        "date": row.get("date"),
        "value": row.get("value"),
        "country": (row.get("country") or {}).get("value"),
        "indicator": (row.get("indicator") or {}).get("value"),
        "unit": row.get("unit"),
    } for row in rows]
    return {
        "provider": "World Bank Indicators API",
        "source_url": f"https://api.worldbank.org/v2/country/{country_code}/indicator/{safe_indicator}",
        "retrieved_at": utc_now(),
        "freshness": "dataset_dependent",
        "country_code": country_code,
        "indicator_code": indicator,
        "observations": observations,
    }


async def search_global_news(query: str, days: int = 3, limit: int = 15) -> dict[str, Any]:
    payload = await get_json(
        "https://api.gdeltproject.org/api/v2/doc/doc",
        params={
            "query": query,
            "mode": "ArtList",
            "format": "json",
            "sort": "DateDesc",
            "timespan": f"{min(max(days, 1), 7)}d",
            "maxrecords": min(max(limit, 1), 50),
        },
    )
    articles = payload.get("articles", []) if isinstance(payload, dict) else []
    normalized = [{
        "title": item.get("title"),
        "url": item.get("url"),
        "domain": item.get("domain"),
        "source_country": item.get("sourcecountry"),
        "language": item.get("language"),
        "seen_at": item.get("seendate"),
        "image": item.get("socialimage"),
    } for item in articles]
    return {
        "provider": "GDELT DOC",
        "retrieved_at": utc_now(),
        "freshness": "publisher_dependent",
        "query": query,
        "articles": normalized,
        "verification": "discovery_only",
        "note": "GDELT aggregates coverage; it does not certify truth. Verify consequential claims with primary documents and independent reporting.",
    }


async def sec_company_submissions(cik: str) -> dict[str, Any]:
    if not settings.sec_user_agent:
        raise ValueError("SEC_USER_AGENT is not configured. Set a descriptive contact User-Agent on the backend.")
    digits = "".join(ch for ch in cik if ch.isdigit())
    if not digits or len(digits) > 10:
        raise ValueError("CIK must contain up to 10 digits.")
    padded = digits.zfill(10)
    payload = await get_json(
        f"https://data.sec.gov/submissions/CIK{padded}.json",
        headers={"User-Agent": settings.sec_user_agent, "Accept-Encoding": "gzip, deflate"},
    )
    recent = payload.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    filings = []
    for index, form in enumerate(forms[:30]):
        accession = recent.get("accessionNumber", [""] * len(forms))[index]
        primary_doc = recent.get("primaryDocument", [""] * len(forms))[index]
        filings.append({
            "form": form,
            "filing_date": recent.get("filingDate", [None] * len(forms))[index],
            "report_date": recent.get("reportDate", [None] * len(forms))[index],
            "accession_number": accession,
            "primary_document": primary_doc,
            "url": f"https://www.sec.gov/Archives/edgar/data/{int(padded)}/{accession.replace('-', '')}/{primary_doc}" if accession and primary_doc else None,
        })
    return {
        "provider": "US SEC EDGAR",
        "retrieved_at": utc_now(),
        "freshness": "updated_as_filings_are_disseminated",
        "company": payload.get("name"),
        "cik": padded,
        "tickers": payload.get("tickers", []),
        "filings": filings,
    }

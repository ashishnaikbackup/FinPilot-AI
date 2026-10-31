#!/usr/bin/env python3
"""Build public, attribution-rich data snapshots for the static GitHub Pages site.

Only public endpoints are called. Failures are recorded; no market quotes are invented.
"""
import json
import os
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)
NOW = datetime.now(timezone.utc).isoformat()
UA = "FinPilotAI/0.1 (public research dashboard; contact via GitHub repository)"


def fetch_json(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.loads(response.read().decode("utf-8"))


def write(name, payload):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


# World Bank: annual India GDP, current US dollars. This is not a market quote.
wb_url = "https://api.worldbank.org/v2/country/IND/indicator/NY.GDP.MKTP.CD?format=json&per_page=20"
try:
    payload = fetch_json(wb_url)
    rows = payload[1] if isinstance(payload, list) and len(payload) > 1 and isinstance(payload[1], list) else []
    observations = [
        {"date": row.get("date"), "value": row.get("value"), "unit": "current US$"}
        for row in rows if row.get("value") is not None
    ]
    observations.sort(key=lambda item: item["date"])
    write("macro-india-gdp.json", {
        "provider": "World Bank Indicators API",
        "source_url": wb_url,
        "retrieved_at": NOW,
        "freshness": "annual_dataset; subject_to_revision",
        "indicator_code": "NY.GDP.MKTP.CD",
        "indicator_name": "GDP (current US$)",
        "country": "India",
        "unit": "current US$",
        "observations": observations,
        "error": None if observations else "No observations returned by provider",
    })
    macro_ok = bool(observations)
    macro_error = None if macro_ok else "No observations returned by World Bank"
except Exception as exc:
    macro_ok = False
    macro_error = str(exc)[:300]
    write("macro-india-gdp.json", {
        "provider": "World Bank Indicators API", "source_url": wb_url,
        "retrieved_at": NOW, "freshness": "unavailable", "indicator_code": "NY.GDP.MKTP.CD",
        "indicator_name": "GDP (current US$)", "country": "India", "unit": "current US$",
        "observations": [], "error": macro_error,
    })

# GDELT is a discovery index. Its seendate is the index/seen time, not necessarily publisher time.
query = '("India economy" OR "global markets" OR "central bank" OR geopolitics)'
gdelt_url = "https://api.gdeltproject.org/api/v2/doc/doc?" + urllib.parse.urlencode({
    "query": query, "mode": "ArtList", "format": "json", "sort": "DateDesc",
    "timespan": "3d", "maxrecords": "12",
})
try:
    payload = fetch_json(gdelt_url)
    articles = payload.get("articles", []) if isinstance(payload, dict) else []
    normalized = [{
        "title": item.get("title"),
        "url": item.get("url"),
        "domain": item.get("domain"),
        "source_country": item.get("sourcecountry"),
        "seen_at": item.get("seendate"),
        "language": item.get("language"),
    } for item in articles if item.get("title") and item.get("url")]
    write("news-global.json", {
        "provider": "GDELT DOC API", "source_url": gdelt_url,
        "retrieved_at": NOW, "freshness": "rolling_3_day_discovery_index",
        "verification": "discovery_only_not_fact_checked", "articles": normalized,
        "error": None,
    })
    news_ok = True
    news_error = None
except Exception as exc:
    news_ok = False
    news_error = str(exc)[:300]
    write("news-global.json", {
        "provider": "GDELT DOC API", "source_url": gdelt_url,
        "retrieved_at": NOW, "freshness": "unavailable",
        "verification": "discovery_only_not_fact_checked", "articles": [], "error": news_error,
    })

status = {
    "retrieved_at": NOW,
    "refresh_interval": "approximately every 6 hours (GitHub Actions schedule; may be delayed)",
    "india_macro": {
        "status": "available" if macro_ok else "unavailable",
        "provider": "World Bank Indicators API",
        "freshness": "annual_dataset; subject_to_revision",
        "message": "India GDP indicator; not live economic activity",
        "error": macro_error,
    },
    "global_news": {
        "status": "available" if news_ok else "unavailable",
        "provider": "GDELT DOC API",
        "freshness": "rolling_3_day_discovery_index",
        "caveat": "News discovery only. GDELT does not verify truth; seen_at is not publisher publication time.",
        "error": news_error,
    },
    "market_quotes": {
        "status": "not_connected",
        "freshness": "unavailable",
        "message": "No licensed market-data feed. No exchange prices are displayed or fabricated.",
    },
    "sec_filings": {
        "status": "not_in_static_snapshot",
        "provider": "US SEC EDGAR",
        "message": "Company-specific filings can be added as a later static snapshot or secured backend feature.",
    },
}
write("status.json", status)
print(json.dumps({"macro_ok": macro_ok, "news_ok": news_ok, "output": str(OUT)}))

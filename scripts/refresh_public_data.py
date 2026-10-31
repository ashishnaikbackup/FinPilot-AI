#!/usr/bin/env python3
"""Build public, attribution-rich data snapshots for the static GitHub Pages site.

Only public endpoints are called. Failures are recorded; no market quotes are invented.
"""
import json
import urllib.parse
import xml.etree.ElementTree as ET
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

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


def fetch_rss(url, provider, allowed_domains, limit=12):
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml"})
    with urllib.request.urlopen(request, timeout=25) as response:
        root = ET.fromstring(response.read())
    items = root.findall(".//item")
    normalized = []
    for item in items[:limit]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        parsed_link = urlparse(link)
        domain = (parsed_link.hostname or "").lower()
        if not title or parsed_link.scheme != "https" or not domain or not any(domain == allowed or domain.endswith("." + allowed) for allowed in allowed_domains):
            continue
        normalized.append({
            "title": title,
            "url": link,
            "domain": domain,
            "source": provider,
            "source_type": "official_primary_source",
            "published_at": (item.findtext("pubDate") or item.findtext("date") or "").strip() or None,
            "seen_at": NOW,
            "source_country": "India",
        })
    return normalized


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

# Official Indian primary-source updates. Feed availability is checked independently.
official_feeds = [
    ("RBI Press Releases", "https://www.rbi.org.in/pressreleases_rss.xml", ["rbi.org.in"]),
    ("RBI Notifications", "https://www.rbi.org.in/notifications_rss.xml", ["rbi.org.in"]),
    ("Press Information Bureau", "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1", ["pib.gov.in"]),
]
official_articles = []
official_errors = []
official_feed_status = []
for provider, feed_url, domains in official_feeds:
    try:
        items = fetch_rss(feed_url, provider, domains)
        official_articles.extend(items)
        official_feed_status.append({"provider": provider, "source_url": feed_url, "status": "available" if items else "empty", "items": len(items)})
    except Exception as exc:
        error = str(exc)[:240]
        official_errors.append({"provider": provider, "error": error})
        official_feed_status.append({"provider": provider, "source_url": feed_url, "status": "unavailable", "error": error})

# GDELT is a discovery index. Its seendate is the index/seen time, not necessarily publisher time.
query = '("India economy" OR "global markets" OR "central bank" OR geopolitics)'
gdelt_url = "https://api.gdeltproject.org/api/v2/doc/doc?" + urllib.parse.urlencode({
    "query": "India economy OR global markets OR central bank OR geopolitics", "mode": "ArtList", "format": "json", "sort": "DateDesc",
    "timespan": "3d", "maxrecords": "12",
})
try:
    payload = fetch_json(gdelt_url)
    articles = payload.get("articles", []) if isinstance(payload, dict) else []
    normalized = [{
        "title": item.get("title"),
        "url": item.get("url"),
        "domain": urlparse(item.get("url", "")).hostname,
        "source": "GDELT DOC API",
        "source_type": "discovery_unverified",
        "source_country": item.get("sourcecountry"),
        "seen_at": item.get("seendate"),
        "published_at": None,
        "language": item.get("language"),
    } for item in articles if item.get("title") and item.get("url") and urlparse(item.get("url", "")).scheme == "https" and urlparse(item.get("url", "")).hostname]
    write("news-global.json", {
        "provider": "RBI + PIB official RSS and GDELT discovery", "source_url": gdelt_url,
        "retrieved_at": NOW, "freshness": "rolling_3_day_discovery_index",
        "verification": "mixed_official_primary_source_and_unverified_discovery", "articles": official_articles + normalized,
        "official_primary_source_count": len(official_articles),
        "discovery_index_count": len(normalized),
        "official_feed_errors": official_errors,
        "official_feeds": official_feed_status,
        "error": None if normalized else "GDELT returned no articles",
    })
    news_ok = bool(normalized)
    news_error = None if news_ok else "GDELT returned no articles"
except Exception as exc:
    news_ok = False
    news_error = str(exc)[:300]
    write("news-global.json", {
        "provider": "RBI + PIB official RSS and GDELT discovery", "source_url": gdelt_url,
        "retrieved_at": NOW, "freshness": "feed_dependent",
        "verification": "official_primary_source_items_plus_unavailable_discovery", "articles": official_articles, "official_primary_source_count": len(official_articles), "discovery_index_count": 0, "official_feed_errors": official_errors, "official_feeds": official_feed_status, "error": news_error,
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
        "status": "available" if (news_ok or bool(official_articles)) else "unavailable",
        "provider": "RBI + PIB official RSS and GDELT discovery",
        "freshness": "feed_dependent; GDELT rolling 3 days",
        "caveat": "RBI/PIB items link to primary releases. GDELT items are discovery only and not fact-checked; seen_at is not publisher publication time.",
        "official_primary_source_count": len(official_articles),
        "discovery_index_count": len(normalized) if news_ok else 0,
        "official_feed_errors": official_errors,
        "official_feeds": official_feed_status,
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
print(json.dumps({"macro_ok": macro_ok, "macro_error": macro_error, "news_ok": news_ok, "news_error": news_error, "output": str(OUT)}))

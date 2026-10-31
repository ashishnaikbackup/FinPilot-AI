#!/usr/bin/env python3
"""Build public, attribution-rich data snapshots for the static GitHub Pages site.

Only public endpoints are called. Failures are recorded; no market quotes are invented.
"""
import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from feed_utils import parse_feed

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


def fetch_rss(url, provider, allowed_domains, country="India", limit=8):
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"})
    with urllib.request.urlopen(request, timeout=25) as response:
        return parse_feed(response.read(), provider, allowed_domains, country, NOW, limit)


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
    try:
        previous_macro = json.loads((OUT / "macro-india-gdp.json").read_text(encoding="utf-8"))
    except Exception:
        previous_macro = {}
    observations = previous_macro.get("observations", []) if isinstance(previous_macro.get("observations"), list) else []
    write("macro-india-gdp.json", {
        "provider": "World Bank Indicators API", "source_url": wb_url,
        "retrieved_at": previous_macro.get("retrieved_at", NOW) if observations else NOW,
        "last_attempt_at": NOW,
        "freshness": "stale_last_known_good" if observations else "unavailable",
        "indicator_code": "NY.GDP.MKTP.CD",
        "indicator_name": "GDP (current US$)", "country": "India", "unit": "current US$",
        "observations": observations, "error": macro_error,
    })

# Global macro snapshot: annual World Bank indicators, not market prices.
global_countries = "IND;USA;CHN;GBR;DEU;JPN"
global_indicators = "NY.GDP.MKTP.KD.ZG;FP.CPI.TOTL.ZG;SL.UEM.TOTL.ZS;NY.GDP.MKTP.CD"
global_macro_url = f"https://api.worldbank.org/v2/country/{global_countries}/indicator/{global_indicators}?format=json&per_page=1000&source=2"
global_indicator_names = {
    "NY.GDP.MKTP.KD.ZG": "GDP growth (annual %)",
    "FP.CPI.TOTL.ZG": "Inflation, consumer prices (annual %)",
    "SL.UEM.TOTL.ZS": "Unemployment, total (% of labour force)",
    "NY.GDP.MKTP.CD": "GDP (current US$)",
}
try:
    payload = fetch_json(global_macro_url + "&page=1")
    rows = list(payload[1]) if isinstance(payload, list) and len(payload) > 1 and isinstance(payload[1], list) else []
    pages = int((payload[0] or {}).get("pages", 1)) if isinstance(payload, list) and payload and isinstance(payload[0], dict) else 1
    for page in range(2, min(pages, 10) + 1):
        next_payload = fetch_json(global_macro_url + f"&page={page}")
        if isinstance(next_payload, list) and len(next_payload) > 1 and isinstance(next_payload[1], list):
            rows.extend(next_payload[1])
    global_observations = [{
        "country_code": row.get("countryiso3code"),
        "country": (row.get("country") or {}).get("value"),
        "indicator_code": (row.get("indicator") or {}).get("id"),
        "indicator": (row.get("indicator") or {}).get("value"),
        "date": row.get("date"),
        "value": row.get("value"),
        "unit": row.get("unit") or ("%" if (row.get("indicator") or {}).get("id") != "NY.GDP.MKTP.CD" else "current US$"),
        "observation_status": row.get("obs_status"),
    } for row in rows if row.get("date") and row.get("value") is not None and row.get("countryiso3code") and (row.get("indicator") or {}).get("id")]
    global_macro_ok = bool(global_observations)
    global_macro_error = None if global_macro_ok else "No observations returned by World Bank"
    write("macro-global.json", {
        "provider": "World Bank Indicators API",
        "source_url": global_macro_url,
        "retrieved_at": NOW,
        "freshness": "annual_dataset; subject_to_revision",
        "countries": ["India", "United States", "China", "United Kingdom", "Germany", "Japan"],
        "indicators": global_indicator_names,
        "observations": global_observations,
        "error": global_macro_error,
        "caveat": "Annual macroeconomic indicators. Latest available years differ by country and series; not live market data or a forecast.",
    })
except Exception as exc:
    global_macro_ok = False
    global_macro_error = str(exc)[:300]
    try:
        previous_global_macro = json.loads((OUT / "macro-global.json").read_text(encoding="utf-8"))
    except Exception:
        previous_global_macro = {}
    global_observations = previous_global_macro.get("observations", []) if isinstance(previous_global_macro.get("observations"), list) else []
    write("macro-global.json", {
        "provider": "World Bank Indicators API",
        "source_url": global_macro_url,
        "retrieved_at": previous_global_macro.get("retrieved_at", NOW) if global_observations else NOW,
        "last_attempt_at": NOW,
        "freshness": "stale_last_known_good" if global_observations else "unavailable",
        "countries": ["India", "United States", "China", "United Kingdom", "Germany", "Japan"],
        "indicators": global_indicator_names,
        "observations": global_observations,
        "error": global_macro_error,
        "caveat": "Annual macroeconomic indicators. Not live market data.",
    })

# Official Indian primary-source updates. Feed availability is checked independently.
official_feeds = [
    ("RBI Press Releases", "https://www.rbi.org.in/pressreleases_rss.xml", ["rbi.org.in"], "India"),
    ("RBI Notifications", "https://www.rbi.org.in/notifications_rss.xml", ["rbi.org.in"], "India"),
    ("SEBI Press Releases, Circulars and Orders", "https://www.sebi.gov.in/sebirss.xml", ["sebi.gov.in"], "India"),
    ("NSE Announcements", "https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml", ["nseindia.com"], "India"),
    ("NSE Corporate Actions", "https://nsearchives.nseindia.com/content/RSS/Corporate_action.xml", ["nseindia.com"], "India"),
    ("NSE Board Meetings", "https://nsearchives.nseindia.com/content/RSS/Board_Meetings.xml", ["nseindia.com"], "India"),
    ("Press Information Bureau", "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1", ["pib.gov.in"], "India"),
    ("US Federal Reserve Monetary Policy", "https://www.federalreserve.gov/feeds/press_monetary.xml", ["federalreserve.gov"], "United States"),
    ("European Central Bank Press Releases", "https://www.ecb.europa.eu/rss/press.html", ["ecb.europa.eu"], "European Union"),
]
official_articles = []
official_errors = []
official_feed_status = []
for provider, feed_url, domains, country in official_feeds:
    try:
        items = fetch_rss(feed_url, provider, domains, country)
        official_articles.extend(items)
        official_feed_status.append({"provider": provider, "source_url": feed_url, "status": "available" if items else "empty", "items": len(items)})
    except Exception as exc:
        error = str(exc)[:240]
        official_errors.append({"provider": provider, "error": error})
        official_feed_status.append({"provider": provider, "source_url": feed_url, "status": "unavailable", "error": error})

# GDELT is a discovery index. Its seendate is the index/seen time, not necessarily publisher time.
normalized = []
news_stale = False
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
        "provider": "Official RBI/SEBI/NSE/PIB/Fed/ECB RSS and GDELT discovery", "source_url": gdelt_url,
        "retrieved_at": NOW, "freshness": "rolling_3_day_discovery_index",
        "verification": "mixed_official_primary_source_and_unverified_discovery", "articles": official_articles + normalized,
        "official_primary_source_count": len(official_articles),
        "discovery_index_count": len(normalized),
        "discovery_status": "available" if normalized else "unavailable",
        "discovery_error": None if normalized else "GDELT returned no articles",
        "official_feed_errors": official_errors,
        "official_feeds": official_feed_status,
        "error": None if (normalized or official_articles) else "No news source returned items",
    })
    news_ok = bool(normalized)
    news_error = None if news_ok else "GDELT returned no articles"
except Exception as exc:
    news_ok = False
    news_stale = True
    news_error = str(exc)[:300]
    try:
        previous_news = json.loads((OUT / "news-global.json").read_text(encoding="utf-8"))
    except Exception:
        previous_news = {}
    previous_articles = previous_news.get("articles", []) if isinstance(previous_news.get("articles"), list) else []
    current_official_articles = official_articles
    previous_official_articles = [item for item in previous_articles if item.get("source_type") == "official_primary_source"]
    if not current_official_articles:
        official_articles = previous_official_articles
    normalized = [item for item in previous_articles if item.get("source_type") == "discovery_unverified"]
    retained_articles = official_articles + normalized
    write("news-global.json", {
        "provider": "Official RBI/SEBI/NSE/PIB/Fed/ECB RSS and GDELT discovery", "source_url": gdelt_url,
        "retrieved_at": NOW if current_official_articles else (previous_news.get("retrieved_at", NOW) if previous_articles else NOW),
        "last_attempt_at": NOW,
        "freshness": "partial_stale_discovery" if current_official_articles else ("stale_last_known_good" if previous_articles else "unavailable"),
        "verification": "official_primary_sources_plus_stale_or_unavailable_discovery",
        "articles": retained_articles, "official_primary_source_count": len(official_articles),
        "discovery_index_count": len(normalized),
        "discovery_status": "stale" if normalized else "unavailable",
        "discovery_error": news_error, "official_feed_errors": official_errors,
        "official_feeds": official_feed_status, "error": news_error,
    })

status = {
    "retrieved_at": NOW,
    "refresh_interval": "approximately every 6 hours (GitHub Actions schedule; may be delayed)",
    "global_macro": {
        "status": "available" if global_macro_ok else ("stale" if global_observations else "unavailable"),
        "provider": "World Bank Indicators API",
        "freshness": "annual_dataset; subject_to_revision" if global_macro_ok else ("stale_last_known_good" if global_observations else "unavailable"),
        "message": "Six-country macroeconomic comparison; latest observation year varies by series",
        "observation_count": len(global_observations),
        "error": global_macro_error,
    },
    "india_macro": {
        "status": "available" if macro_ok else ("stale" if observations else "unavailable"),
        "provider": "World Bank Indicators API",
        "freshness": "annual_dataset; subject_to_revision" if macro_ok else ("stale_last_known_good" if observations else "unavailable"),
        "message": "India GDP indicator; not live economic activity",
        "error": macro_error,
    },
    "global_news": {
        "status": "partial" if news_stale and official_articles else ("stale" if news_stale else ("available" if (news_ok or bool(official_articles)) else "unavailable")),
        "provider": "Official RBI/SEBI/NSE/PIB/Fed/ECB RSS and GDELT discovery",
        "freshness": "feed_dependent; GDELT rolling 3 days",
        "caveat": "RBI/SEBI/NSE/PIB/Federal Reserve/ECB items link to primary releases. GDELT items are discovery only and not fact-checked; seen_at is not publisher publication time.",
        "official_primary_source_count": len(official_articles),
        "discovery_index_count": len(normalized),
        "discovery_status": "stale" if news_stale and normalized else ("available" if news_ok else "unavailable"),
        "discovery_error": news_error,
        "official_feed_errors": official_errors,
        "official_feeds": official_feed_status,
        "error": None if (news_ok or bool(official_articles)) else news_error,
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

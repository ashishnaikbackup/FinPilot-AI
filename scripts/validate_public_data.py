#!/usr/bin/env python3
"""Validate public snapshots before a GitHub Pages deployment."""
import json
from datetime import datetime
from pathlib import Path\nfrom urllib.parse import urlparse\nimport math

DATA = Path(__file__).resolve().parents[1] / "frontend" / "public" / "data"


def load(name):
    path = DATA / name
    if not path.is_file():
        raise SystemExit(f"Missing required snapshot: {name}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {name}: {exc}") from exc


status = load("status.json")
macro = load("macro-india-gdp.json")
news = load("news-global.json")

for label, payload in [("status", status), ("macro", macro), ("news", news)]:
    timestamp = payload.get("retrieved_at")
    if not timestamp:
        raise SystemExit(f"{label} snapshot has no retrieved_at timestamp")
    try:
        parsed_timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))\n        if parsed_timestamp.tzinfo is None:\n            raise ValueError("timestamp must include a timezone")
    except ValueError as exc:
        raise SystemExit(f"{label} snapshot has invalid retrieved_at: {timestamp}") from exc

if not isinstance(macro.get("observations"), list):
    raise SystemExit("macro observations must be an array")
if not isinstance(news.get("articles"), list):
    raise SystemExit("news articles must be an array")
if status.get("market_quotes", {}).get("status") != "not_connected":
    raise SystemExit("Market quotes must remain explicitly disconnected until licensed data is configured")

for item in news["articles"]:
    if not item.get("title") or not item.get("url"):
        raise SystemExit("Every news item must include a title and source URL")
    if item.get("source_type") == "official_primary_source":
        host = (item.get("domain") or "").lower()
        if not (host == "rbi.org.in" or host.endswith(".rbi.org.in") or host == "pib.gov.in" or host.endswith(".pib.gov.in")):
            raise SystemExit(f"Unexpected domain marked as official primary source: {host}")

print("Public snapshot schema and integrity checks passed.")
print(f"India GDP observations: {len(macro['observations'])}")
print(f"News items: {len(news['articles'])}")
print(f"Official primary-source updates: {news.get('official_primary_source_count', 0)}")

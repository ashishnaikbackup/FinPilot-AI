#!/usr/bin/env python3
"""Merge separately permission-gated provider snapshots into paper-bot input."""
import json
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"frontend/public/data"
def load(name):
    try: return json.loads((DATA/name).read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError): return {}
def main():
    sources=[load("market-quotes-india.json"),load("market-quotes-global.json")]
    instruments=[]; providers=[]; timestamps=[]
    for source in sources:
        if source.get("status")=="available" and isinstance(source.get("instruments"),list):
            instruments.extend(source["instruments"])
            if source.get("provider"): providers.append(source["provider"])
            if source.get("as_of"): timestamps.append(source["as_of"])
    # Deduplicate by market + symbol, preferring the first configured source.
    unique={}
    for item in instruments: unique.setdefault((item.get("market"),item.get("symbol")),item)
    rows=list(unique.values())
    result={"status":"available" if rows else "unavailable","provider":" + ".join(providers) if providers else "No permitted provider connected","as_of":max(timestamps) if timestamps else datetime.now(timezone.utc).isoformat(),"freshness":"end_of_day" if rows else "unavailable","instruments":rows}
    (DATA/"market-quotes.json").write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":result["status"],"instrument_count":len(rows),"providers":providers}))
if __name__=="__main__": main()

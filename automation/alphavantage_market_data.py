#!/usr/bin/env python3
"""Optional Alpha Vantage global-equity daily EOD adapter; no order execution."""
from __future__ import annotations
import json, os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/"automation/config/global-watchlist.json"
OUT=ROOT/"frontend/public/data/market-quotes-global.json"
STATUS=ROOT/"frontend/public/data/global-provider-status.json"
BASE="https://www.alphavantage.co/query"

class ProviderError(RuntimeError): pass

def fetch_daily(symbol: str, key: str) -> list[dict]:
    params=urlencode({"function":"TIME_SERIES_DAILY","symbol":symbol,"outputsize":"compact","apikey":key})
    req=Request(BASE+"?"+params,headers={"User-Agent":"FinPilot-AI/market-data-adapter"})
    try:
        with urlopen(req,timeout=25) as response: payload=json.loads(response.read().decode("utf-8"))
    except HTTPError as exc: raise ProviderError(f"Alpha Vantage HTTP {exc.code}") from exc
    except (URLError,TimeoutError,json.JSONDecodeError) as exc: raise ProviderError(f"Alpha Vantage request failed: {type(exc).__name__}") from exc
    series=payload.get("Time Series (Daily)")
    if not isinstance(series,dict):
        message=payload.get("Note") or payload.get("Information") or payload.get("Error Message") or "Unexpected provider response."
        raise ProviderError(str(message)[:300])
    bars=[]
    for day,row in series.items():
        try:
            bars.append({"timestamp":day,"open":float(row["1. open"]),"high":float(row["2. high"]),"low":float(row["3. low"]),"close":float(row["4. close"]),"volume":int(float(row["5. volume"]))})
        except (KeyError,TypeError,ValueError): continue
    bars.sort(key=lambda x:x["timestamp"])
    return bars

def main():
    token=os.environ.get("ALPHAVANTAGE_API_KEY","").strip()
    public_ok=os.environ.get("GLOBAL_DATA_PUBLIC_DISPLAY_RIGHTS","").lower()=="true"
    now=datetime.now(timezone.utc).isoformat()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    status={"provider":"Alpha Vantage","retrieved_at":now,"status":"waiting_for_credentials","symbols":0,"errors":[]}
    if not token or not public_ok:
        status["status"]="waiting_for_credentials" if not token else "blocked_by_display_rights_gate"
        status["message"]="Set ALPHAVANTAGE_API_KEY and confirm public display/storage rights before publishing global quotes."
        OUT.write_text(json.dumps({"status":"unavailable","provider":"Alpha Vantage","as_of":now,"freshness":"unavailable","instruments":[]},indent=2)+"\n")
        STATUS.write_text(json.dumps(status,indent=2)+"\n")
        print(json.dumps(status)); return
    config=json.loads(CONFIG.read_text(encoding="utf-8")); instruments=[]
    for item in config.get("global_equities",[]):
        try:
            symbol=item["symbol"]; bars=fetch_daily(symbol,token)
            if len(bars)<51: status["errors"].append(f"{symbol}: fewer than 51 daily bars."); continue
            instruments.append({"symbol":symbol,"market":item.get("market","GLOBAL"),"asset_type":item.get("asset_type","equity"),"currency":item.get("currency","USD"),"bars":bars})
        except (KeyError,ValueError,TypeError,ProviderError) as exc: status["errors"].append(f"{item.get('symbol','unknown')}: {str(exc)}")
    as_of=max((bar["timestamp"] for item in instruments for bar in item["bars"]),default=now)
    OUT.write_text(json.dumps({"status":"available" if instruments else "unavailable","provider":"Alpha Vantage (daily EOD; operator entitlement)","as_of":as_of,"freshness":"end_of_day" if instruments else "unavailable","instruments":instruments},indent=2)+"\n")
    status.update(status="available" if instruments else "no_usable_data",symbols=len(instruments),as_of=as_of)
    STATUS.write_text(json.dumps(status,indent=2)+"\n"); print(json.dumps(status))

if __name__=="__main__": main()

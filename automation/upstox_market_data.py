#!/usr/bin/env python3
"""Optional Upstox market-data adapter. Read-only: no order endpoints are called.

It writes a normalised snapshot only when an access token is present and the
operator explicitly confirms that the resulting public Pages data is permitted.
"""
from __future__ import annotations
import json, os, sys
from datetime import datetime, timezone, date
from pathlib import Path
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/"automation/config/market-watchlist.json"
QUOTE_OUT=ROOT/"frontend/public/data/market-quotes-india.json"
OPTIONS_OUT=ROOT/"frontend/public/data/options-chain.json"
STATUS_OUT=ROOT/"frontend/public/data/market-provider-status.json"
CONTRACTS_OUT=ROOT/"frontend/public/data/fno-contracts.json"
BASE="https://api.upstox.com"

class ProviderError(RuntimeError): pass

def api_get(path: str, params: dict, token: str) -> dict:
    url=BASE+path+"?"+urlencode(params)
    req=Request(url,headers={"Accept":"application/json","Authorization":f"Bearer {token}","User-Agent":"FinPilot-AI/market-data-adapter"})
    try:
        with urlopen(req,timeout=25) as response:
            payload=json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise ProviderError(f"Upstox HTTP {exc.code}; check token, endpoint entitlement and rate limits.") from exc
    except (URLError,TimeoutError,json.JSONDecodeError) as exc:
        raise ProviderError(f"Upstox request failed: {type(exc).__name__}") from exc
    if not isinstance(payload,dict) or payload.get("status")!="success":
        raise ProviderError("Upstox returned an unsuccessful or unexpected response.")
    return payload

def candle_bars(instrument_key: str, token: str) -> list[dict]:
    today=date.today().isoformat()
    payload=api_get(f"/v3/historical-candle/{quote(instrument_key,safe='')}/days/1/{today}",{},token)
    rows=payload.get("data",{}).get("candles",[])
    bars=[]
    for row in rows:
        if not isinstance(row,list) or len(row)<6: continue
        stamp=str(row[0])
        # Daily bar for the current session may still be forming. Exclude it.
        if stamp[:10] >= today: continue
        bars.append({"timestamp":stamp,"open":float(row[1]),"high":float(row[2]),"low":float(row[3]),"close":float(row[4]),"volume":int(row[5])})
    bars.sort(key=lambda x:x["timestamp"])
    return bars

def fetch_option_chain(item: dict, token: str) -> dict:
    payload=api_get("/v2/option/chain",{"instrument_key":item["instrument_key"],"expiry_date":item.get("expiry","current_week")},token)
    return {"underlying":item["name"],"instrument_key":item["instrument_key"],"expiry_request":item.get("expiry","current_week"),"retrieved_at":datetime.now(timezone.utc).isoformat(),"contracts":payload.get("data",[])}

def fetch_option_contracts(item: dict, token: str) -> list[dict]:
    payload=api_get("/v2/option/contract",{"instrument_key":item["instrument_key"],"expiry_date":item.get("expiry","current_week")},token)
    rows=payload.get("data",[])
    if not isinstance(rows,list):
        raise ProviderError("Upstox option-contract response did not contain a list.")
    return [row for row in rows if isinstance(row,dict)
            and row.get("instrument_key")
            and row.get("instrument_type") in {"CE","PE"}
            and isinstance(row.get("lot_size"),(int,float))
            and row.get("lot_size",0)>0]

def enrich_chain_with_contracts(chain: dict, contract_rows: list[dict]) -> dict:
    by_key={row["instrument_key"]:row for row in contract_rows if row.get("instrument_key")}
    for strike in chain.get("contracts",[]):
        if not isinstance(strike,dict): continue
        for side_name in ("call_options","put_options"):
            side=strike.get(side_name)
            if not isinstance(side,dict): continue
            metadata=by_key.get(side.get("instrument_key"))
            if metadata:
                side["contract_meta"]={key:metadata.get(key) for key in (
                    "trading_symbol","expiry","strike_price","instrument_type","lot_size",
                    "minimum_lot","freeze_quantity","tick_size","weekly"
                ) if metadata.get(key) is not None}
    return chain

def main() -> int:
    token=os.environ.get("UPSTOX_ACCESS_TOKEN","").strip()
    public_ok=os.environ.get("MARKET_DATA_PUBLIC_DISPLAY_RIGHTS","").lower()=="true"
    QUOTE_OUT.parent.mkdir(parents=True,exist_ok=True)
    now=datetime.now(timezone.utc).isoformat()
    status={"provider":"Upstox","retrieved_at":now,"status":"not_configured","quote_count":0,"option_underlyings":0,"option_contracts":0,"errors":[]}
    if not token or not public_ok:
        if not token:
            status.update(status="waiting_for_credentials",message="Add UPSTOX_ACCESS_TOKEN as a GitHub Actions secret to enable the read-only adapter.")
        else:
            status.update(status="blocked_by_display_rights_gate",message="Public quote/option snapshots are not published until MARKET_DATA_PUBLIC_DISPLAY_RIGHTS=true is explicitly configured after confirming provider terms.")
        unavailable={"status":"unavailable","provider":"Upstox","as_of":now,"freshness":"unavailable","instruments":[]}
        QUOTE_OUT.write_text(json.dumps(unavailable,indent=2)+"\n",encoding="utf-8")
        OPTIONS_OUT.write_text(json.dumps({"provider":"Upstox","retrieved_at":now,"status":"unavailable","underlyings":[]},indent=2)+"\n",encoding="utf-8")
        CONTRACTS_OUT.write_text(json.dumps({"provider":"Upstox","retrieved_at":now,"status":"unavailable","underlyings":[]},indent=2)+"\\n",encoding="utf-8")
        STATUS_OUT.write_text(json.dumps(status,indent=2)+"\n")
        print(json.dumps(status)); return 0
    config=json.loads(CONFIG.read_text(encoding="utf-8"))
    instruments=config.get("india_equities",[])
    normalised=[]
    for item in instruments:
        try:
            key=item["instrument_key"]; symbol=item["symbol"]
            bars=candle_bars(key,token)
            if len(bars)<51:
                status["errors"].append(f"{symbol}: only {len(bars)} completed daily bars; need at least 51.")
                continue
            normalised.append({"symbol":symbol,"market":item.get("market","NSE"),"asset_type":item.get("asset_type","equity"),"currency":"INR","bars":bars})
        except (KeyError,ValueError,TypeError,ProviderError) as exc:
            status["errors"].append(f"{item.get('symbol','unknown')}: {str(exc)}")
    if normalised:
        as_of=max(bar["timestamp"] for item in normalised for bar in item["bars"])
        snapshot={"status":"available","provider":"Upstox API (operator-configured; entitlement must be verified)","as_of":as_of,"freshness":"end_of_day","instruments":normalised}
    else:
        snapshot={"status":"unavailable","provider":"Upstox","as_of":now,"freshness":"unavailable","instruments":[]}
    QUOTE_OUT.write_text(json.dumps(snapshot,indent=2)+"\n",encoding="utf-8")
    chains=[]
    contract_sets=[]
    contract_count=0
    for item in config.get("india_option_underlyings",[]):
        try:
            chain=fetch_option_chain(item,token)
            contracts=fetch_option_contracts(item,token)
            contract_count+=len(contracts)
            chain=enrich_chain_with_contracts(chain,contracts)
            chain["contract_metadata_count"]=len(contracts)
            chains.append(chain)
            contract_sets.append({"underlying":item["name"],"instrument_key":item["instrument_key"],"expiry_request":item.get("expiry","current_week"),"contracts":contracts})
        except (KeyError,ValueError,TypeError,ProviderError) as exc:
            status["errors"].append(f"{item.get('name','underlying')} option chain/contracts: {str(exc)}")
    OPTIONS_OUT.write_text(json.dumps({"provider":"Upstox","retrieved_at":now,"status":"available" if chains else "unavailable","underlyings":chains},indent=2)+"\n",encoding="utf-8")
    CONTRACTS_OUT.write_text(json.dumps({"provider":"Upstox","retrieved_at":now,"status":"available" if contract_sets else "unavailable","underlyings":contract_sets},indent=2)+"\n",encoding="utf-8")
    status.update(status="available" if normalised or chains else "no_usable_data",quote_count=len(normalised),option_underlyings=len(chains),option_contracts=contract_count,as_of=snapshot.get("as_of"))
    STATUS_OUT.write_text(json.dumps(status,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(status))
    return 0

if __name__=="__main__": sys.exit(main())

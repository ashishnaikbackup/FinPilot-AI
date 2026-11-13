#!/usr/bin/env python3
"""Paper-only, defined-risk Indian index options debit-spread simulator."""
from __future__ import annotations
import json, math
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"frontend/public/data"
CHAIN_FILE=DATA/"options-chain.json"
STATE_FILE=ROOT/"automation/state/fno-paper-state.json"
REPORT_FILE=DATA/"fno-paper-bot.json"
STARTING_CASH=100_000.0
RISK_FRACTION=0.01
MAX_POSITIONS=3
FEE_RATE=0.0003
MIN_OI=100
MAX_QUOTE_SPREAD=0.20
STOP_FRACTION=0.50
TARGET_FRACTION=0.60

def ema(values:list[float],period:int)->float|None:
    if len(values)<period:return None
    alpha=2/(period+1); result=sum(values[:period])/period
    for value in values[period:]:result=value*alpha+result*(1-alpha)
    return result

def rsi(values:list[float],period:int=14)->float|None:
    if len(values)<=period:return None
    changes=[values[i]-values[i-1] for i in range(1,len(values))]
    gains=[max(v,0.0) for v in changes]; losses=[max(-v,0.0) for v in changes]
    ag=sum(gains[:period])/period; al=sum(losses[:period])/period
    for g,l in zip(gains[period:],losses[period:]):
        ag=(ag*(period-1)+g)/period; al=(al*(period-1)+l)/period
    return 100.0 if al==0 and ag>0 else 50.0 if al==0 else 100-100/(1+ag/al)

def trend_from_bars(bars:Any)->dict:
    if not isinstance(bars,list) or len(bars)<51:return {"trend":"UNAVAILABLE","reason":"Need at least 51 completed daily bars."}
    try:
        closes=[float(row["close"]) for row in bars]
        if any(not math.isfinite(v) or v<=0 for v in closes):raise ValueError()
        fast,slow,momentum=ema(closes,20),ema(closes,50),rsi(closes)
        if fast is None or slow is None or momentum is None:return {"trend":"UNAVAILABLE","reason":"Insufficient indicator history."}
        if closes[-1]>fast>slow and 52<=momentum<=68:trend="BULLISH"
        elif closes[-1]<fast<slow and 32<=momentum<=48:trend="BEARISH"
        else:trend="NEUTRAL"
        reason={"BULLISH":"Daily close > EMA20 > EMA50 and RSI14 is in the bullish band.","BEARISH":"Daily close < EMA20 < EMA50 and RSI14 is in the bearish band.","NEUTRAL":"Trend/momentum filters are not aligned."}[trend]
        return {"trend":trend,"price":closes[-1],"ema20":round(fast,4),"ema50":round(slow,4),"rsi14":round(momentum,2),"as_of":str(bars[-1].get("timestamp") or bars[-1].get("date") or ""),"reason":reason}
    except (KeyError,TypeError,ValueError,OverflowError):return {"trend":"UNAVAILABLE","reason":"Malformed underlying OHLC bars."}

def _leg(row:dict,kind:str)->dict|None:
    side=row.get("call_options" if kind=="CE" else "put_options")
    if not isinstance(side,dict):return None
    meta,md,greeks=side.get("contract_meta"),side.get("market_data"),side.get("option_greeks")
    if not all(isinstance(v,dict) for v in (meta,md,greeks)):return None
    try:
        lot=int(meta["lot_size"]); freeze=int(meta["freeze_quantity"])
        strike=float(meta.get("strike_price",row["strike_price"])); delta=float(greeks["delta"])
        bid=float(md["bid_price"]); ask=float(md["ask_price"])
        oi=float(md.get("oi",0)); bq=float(md.get("bid_qty",0)); aq=float(md.get("ask_qty",0))
        expiry=str(meta.get("expiry") or row.get("expiry") or ""); key=str(side["instrument_key"])
        if lot<=0 or freeze<lot or strike<=0 or not expiry or not key:return None
        if not all(math.isfinite(v) for v in (delta,bid,ask,oi,bq,aq)) or bid<=0 or ask<bid or bq<=0 or aq<=0 or oi<MIN_OI:return None
        mid=(bid+ask)/2
        if mid<=0 or (ask-bid)/mid>MAX_QUOTE_SPREAD:return None
        return {"key":key,"strike":strike,"delta":delta,"bid":bid,"ask":ask,"lot":lot,"expiry":expiry,"symbol":meta.get("trading_symbol",key)}
    except (KeyError,TypeError,ValueError,OverflowError):return None

def select_spread(chain:dict,trend:str,signal_as_of:str)->dict|None:
    if trend not in {"BULLISH","BEARISH"}:return None
    kind="CE" if trend=="BULLISH" else "PE"; longs=[]; shorts=[]
    for row in chain.get("contracts",[]):
        if not isinstance(row,dict):continue
        leg=_leg(row,kind)
        if not leg:continue
        d=abs(leg["delta"])
        if 0.40<=d<=0.65:longs.append(leg)
        if 0.15<=d<=0.35:shorts.append(leg)
    choices=[]
    for long in longs:
        for short in shorts:
            if long["expiry"]!=short["expiry"] or long["lot"]!=short["lot"]:continue
            if kind=="CE" and long["strike"]>=short["strike"]:continue
            if kind=="PE" and long["strike"]<=short["strike"]:continue
            debit=long["ask"]-short["bid"]; width=abs(short["strike"]-long["strike"])
            if debit<=0 or debit>=width:continue
            score=abs(abs(long["delta"])-0.5)+abs(abs(short["delta"])-0.25)
            choices.append((score,long,short,debit,width))
    if not choices:return None
    _,long,short,debit,width=min(choices,key=lambda x:x[0]); lot=long["lot"]
    return {"underlying":chain.get("underlying","unknown"),"direction":trend,"option_type":kind,"expiry":long["expiry"],"long_key":long["key"],"short_key":short["key"],"long_symbol":long["symbol"],"short_symbol":short["symbol"],"long_strike":long["strike"],"short_strike":short["strike"],"lot_size":lot,"signal_as_of":signal_as_of,"spread_width":width,"max_loss_reference":round(debit*lot,2),"max_profit_reference":round((width-debit)*lot,2),"reason":f"{trend} trend; defined-risk {kind} debit spread using provider lot size."}

def _maps(snapshot:dict)->tuple[dict,dict]:
    chains={}; contracts={}
    for chain in snapshot.get("underlyings",[]):
        if not isinstance(chain,dict):continue
        chains[str(chain.get("underlying",""))]=chain
        for row in chain.get("contracts",[]):
            if not isinstance(row,dict):continue
            for key in ("call_options","put_options"):
                side=row.get(key)
                if isinstance(side,dict) and side.get("instrument_key"):contracts[str(side["instrument_key"])]=side
    return chains,contracts

def _report(status:str,now:str,data:dict,cash:float,positions:list,pending:list,trades:list,signals:list)->dict:
    market_value=sum(float(p.get("last_mark",p["entry_debit"]))*int(p["lot_size"]) for p in positions)
    unrealised=sum((float(p.get("last_mark",p["entry_debit"]))-float(p["entry_debit"]))*int(p["lot_size"]) for p in positions)
    return {"schema_version":1,"status":status,"generated_at":now,"mode":"paper_only_defined_risk_debit_spreads","data":data,"strategy":"EMA20/EMA50 + RSI14 directional filter; one-lot call/put debit verticals","summary":{"cash":round(cash,2),"equity":round(cash+market_value,2),"open_positions":len(positions),"pending_orders":len(pending),"closed_trades":len(trades),"realised_pnl":round(sum(float(t.get("pnl",0)) for t in trades),2),"unrealised_pnl":round(unrealised,2)},"signals":signals,"positions":positions,"pending_orders":pending,"recent_trades":list(reversed(trades[-20:])),"limitations":["India index options only for configured Upstox underlyings; no global derivatives.","Only long debit verticals are simulated; no naked shorts, futures, calendars or credit spreads.","Signals queue from completed daily bars and fill no earlier than a later daily option-chain snapshot using ask/bid quotes.","One lot per spread; estimated fees only; taxes and brokerage are excluded.","Provider lot sizes and freeze limits must be checked against current exchange circulars.","This strategy is educational, unvalidated and not investment advice. No broker connection or real orders."]}

def run_bot(snapshot:Any,state:Any,now:str|None=None)->tuple[dict,dict]:
    timestamp=now or datetime.now(timezone.utc).isoformat()
    state=state if isinstance(state,dict) else {}
    cash=float(state.get("cash",STARTING_CASH)); positions=state.get("positions",[]) if isinstance(state.get("positions"),list) else []
    pending=state.get("pending_orders",[]) if isinstance(state.get("pending_orders"),list) else []; trades=state.get("trades",[]) if isinstance(state.get("trades"),list) else []
    if not isinstance(snapshot,dict) or snapshot.get("status")!="available" or not isinstance(snapshot.get("underlyings"),list) or not snapshot["underlyings"]:
        report=_report("waiting_for_market_data",timestamp,{"status":"unavailable","message":"No permitted option-chain snapshot is available."},cash,positions,pending,trades,[])
        return report,state or {"cash":STARTING_CASH,"positions":[],"pending_orders":[],"trades":[]}
    chains,contracts=_maps(snapshot)
    dates=[str((c.get("underlying_bars") or [{}])[-1].get("timestamp") or (c.get("underlying_bars") or [{}])[-1].get("date") or "") for c in chains.values() if c.get("underlying_bars")]
    as_of=max(dates) if dates else ""
    if not as_of:
        report=_report("waiting_for_market_data",timestamp,{"status":"unavailable","message":"Option chains are present but completed underlying bars are missing."},cash,positions,pending,trades,[])
        return report,state or {"cash":STARTING_CASH,"positions":[],"pending_orders":[],"trades":[]}
    try:
        current=datetime.fromisoformat(timestamp.replace("Z","+00:00")); source=datetime.fromisoformat(as_of.replace("Z","+00:00"))
        if source.tzinfo is None:source=source.replace(tzinfo=timezone.utc)
        if current.tzinfo is None:current=current.replace(tzinfo=timezone.utc)
        if current-source>timedelta(days=10) or source-current>timedelta(hours=6):
            report=_report("waiting_for_market_data",timestamp,{"status":"unavailable","message":"Underlying market snapshot is stale or future-dated."},cash,positions,pending,trades,[])
            return report,state
    except (TypeError,ValueError):
        report=_report("waiting_for_market_data",timestamp,{"status":"unavailable","message":"Underlying snapshot timestamp is invalid."},cash,positions,pending,trades,[])
        return report,state
    if state.get("last_processed_as_of")==as_of:
        trends=[{"underlying":name,**trend_from_bars(chain.get("underlying_bars",[])),"candidate":None,"action":"ALREADY_PROCESSED"} for name,chain in chains.items()]
        return _report("available",timestamp,{"status":"available","provider":snapshot.get("provider","Upstox"),"as_of":as_of,"note":"This daily snapshot was already processed."},cash,positions,pending,trades,trends),state

    signals=[]; trends={}
    for name,chain in chains.items():
        trend=trend_from_bars(chain.get("underlying_bars",[])); trends[name]=trend.get("trend")
        candidate=select_spread(chain,trend.get("trend","NEUTRAL"),trend.get("as_of",""))
        signals.append({"underlying":name,**trend,"candidate":candidate,"action":"QUEUE" if candidate else "WATCH"})

    still_pending=[]
    for order in pending:
        chain=chains.get(order.get("underlying")); trend=next((s for s in signals if s["underlying"]==order.get("underlying")),None)
        if not chain or not trend or trend.get("as_of","")<=str(order.get("signal_as_of","")):
            still_pending.append(order); continue
        if trend.get("trend")!=order.get("direction"):
            continue
        long_side,short_side=contracts.get(order.get("long_key")),contracts.get(order.get("short_key"))
        if not long_side or not short_side:continue
        try:
            lot=int(long_side["contract_meta"]["lot_size"])
            if lot!=int(short_side["contract_meta"]["lot_size"]) or lot!=int(order["lot_size"]):continue
            debit=float(long_side["market_data"]["ask_price"])-float(short_side["market_data"]["bid_price"])
            width=abs(float(order["short_strike"])-float(order["long_strike"]))
            if debit<=0 or debit>=width:continue
            equity=cash+sum(float(p.get("last_mark",p["entry_debit"]))*int(p["lot_size"]) for p in positions)
            fee=(float(long_side["market_data"]["ask_price"])+float(short_side["market_data"]["bid_price"]))*lot*FEE_RATE
            total=debit*lot+fee
            if total>equity*RISK_FRACTION or total>cash or len(positions)>=MAX_POSITIONS:continue
            cash-=total
            positions.append({**order,"entry_debit":round(debit,4),"entry_cost":round(total,2),"last_mark":round(debit,4),"opened_at":as_of,"max_loss":round(total,2),"max_profit":round((width-debit)*lot-fee,2)})
        except (KeyError,TypeError,ValueError,OverflowError):continue
    pending=still_pending

    closed_underlyings=set()
    for position in positions[:]:
        chain=chains.get(position["underlying"])
        if not chain:continue
        long_side,short_side=contracts.get(position["long_key"]),contracts.get(position["short_key"])
        expired=as_of[:10]>=str(position["expiry"])
        if expired:
            bars=chain.get("underlying_bars",[])
            spot=float(bars[-1]["close"]) if bars else float((chain.get("contracts") or [{}])[0].get("underlying_spot_price",0))
            if spot<=0:continue
            if position["option_type"]=="CE":
                intrinsic_long=max(spot-float(position["long_strike"]),0); intrinsic_short=max(spot-float(position["short_strike"]),0)
            else:
                intrinsic_long=max(float(position["long_strike"])-spot,0); intrinsic_short=max(float(position["short_strike"])-spot,0)
            mark=max(0.0,intrinsic_long-intrinsic_short)
        elif long_side and short_side:
            try:mark=max(0.0,float(long_side["market_data"]["bid_price"])-float(short_side["market_data"]["ask_price"]))
            except (KeyError,TypeError,ValueError):continue
        else:continue
        position["last_mark"]=round(mark,4)
        pnl=(mark-float(position["entry_debit"]))*int(position["lot_size"])
        trend=trends.get(position["underlying"],"NEUTRAL")
        trend_exit=(position["direction"]=="BULLISH" and trend=="BEARISH") or (position["direction"]=="BEARISH" and trend=="BULLISH")
        stop=mark<=float(position["entry_debit"])*STOP_FRACTION
        target=float(position.get("max_profit",0))>0 and pnl>=float(position["max_profit"])*TARGET_FRACTION
        if expired or trend_exit or stop or target:
            proceeds=mark*int(position["lot_size"]); fee=proceeds*FEE_RATE; cash+=proceeds-fee
            trades.append({"underlying":position["underlying"],"option_type":position["option_type"],"long_symbol":position["long_symbol"],"short_symbol":position["short_symbol"],"lot_size":position["lot_size"],"entry_debit":position["entry_debit"],"exit_value":round(mark,4),"pnl":round(proceeds-fee-float(position["entry_cost"]),2),"closed_at":timestamp,"reason":"expiry_settlement" if expired else "trend_exit" if trend_exit else "target" if target else "stop"})
            closed_underlyings.add(position["underlying"]); positions.remove(position)

    for signal in signals:
        candidate=signal.get("candidate")
        if not candidate or candidate["underlying"] in closed_underlyings:continue
        if any(p["underlying"]==candidate["underlying"] for p in positions) or any(o["underlying"]==candidate["underlying"] for o in pending):continue
        pending.append(candidate)
    report=_report("available",timestamp,{"status":"available","provider":snapshot.get("provider","Upstox"),"as_of":as_of,"freshness":"end_of_day","underlying_count":len(chains)},cash,positions,pending,trades,signals)
    next_state={"cash":round(cash,2),"positions":positions,"pending_orders":pending,"trades":trades[-500:],"updated_at":timestamp,"last_processed_as_of":as_of}
    return report,next_state

def load_json(path:Path,default:Any)->Any:
    try:return json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError):return default

def main()->None:
    DATA.mkdir(parents=True,exist_ok=True); STATE_FILE.parent.mkdir(parents=True,exist_ok=True)
    snapshot=load_json(CHAIN_FILE,{}); state=load_json(STATE_FILE,{"cash":STARTING_CASH,"positions":[],"pending_orders":[],"trades":[]})
    report,next_state=run_bot(snapshot,state)
    REPORT_FILE.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    STATE_FILE.write_text(json.dumps(next_state,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({"status":report["status"],"open_positions":report["summary"]["open_positions"],"pending_orders":report["summary"]["pending_orders"],"closed_trades":report["summary"]["closed_trades"],"data":report["data"]},ensure_ascii=False))

if __name__=="__main__":main()

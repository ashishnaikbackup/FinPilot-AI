#!/usr/bin/env python3
"""Look-ahead-aware daily-bar backtester for FinPilot's cash-equity strategy.

Signals are calculated using completed bars and orders fill at the next bar open.
If stop and target are both touched in one daily candle, stop is assumed first.
This is an educational simulator, not a broker or execution model.
"""
from __future__ import annotations
import json, math
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "automation" / "data" / "backtest-sample.json"
DEFAULT_OUTPUT = ROOT / "frontend" / "public" / "data" / "backtest-report.json"

def ema(values: list[float], period: int) -> float | None:
    if len(values) < period: return None
    alpha = 2 / (period + 1)
    result = sum(values[:period]) / period
    for value in values[period:]: result = value * alpha + result * (1-alpha)
    return result

def rsi(values: list[float], period: int = 14) -> float | None:
    if len(values) <= period: return None
    changes = [values[i]-values[i-1] for i in range(1,len(values))]
    gains = [max(x,0) for x in changes]; losses=[max(-x,0) for x in changes]
    ag=sum(gains[:period])/period; al=sum(losses[:period])/period
    for g,l in zip(gains[period:],losses[period:]):
        ag=(ag*(period-1)+g)/period; al=(al*(period-1)+l)/period
    return 100.0 if al == 0 and ag > 0 else 50.0 if al == 0 else 100-100/(1+ag/al)

def validate_bars(bars: Any) -> list[dict]:
    if not isinstance(bars,list) or len(bars)<52: raise ValueError("Provide at least 52 ordered OHLC bars.")
    clean=[]; previous=None
    for bar in bars:
        row={k:float(bar[k]) for k in ("open","high","low","close")}
        if not all(math.isfinite(v) and v>0 for v in row.values()): raise ValueError("OHLC values must be finite and positive.")
        if row["high"] < max(row["open"],row["close"],row["low"]) or row["low"] > min(row["open"],row["close"]):
            raise ValueError("Invalid OHLC high/low relationship.")
        stamp=str(bar.get("date") or bar.get("timestamp") or "")
        if not stamp or (previous is not None and stamp <= previous): raise ValueError("Bars must have unique, ascending date/timestamp values.")
        previous=stamp; clean.append({**row,"date":stamp})
    return clean

def backtest(bars: Any, starting_cash: float=1_000_000, fee_rate: float=0.0003, slippage: float=0.001) -> dict:
    data=validate_bars(bars)
    if starting_cash<=0 or fee_rate<0 or slippage<0: raise ValueError("Invalid capital or cost assumptions.")
    cash=float(starting_cash); position=None; trades=[]; curve=[]
    closes=[b["close"] for b in data]
    for i in range(50,len(data)):
        bar=data[i]; prior=closes[:i]  # exclude today's unfinished/current bar from signal computation
        fast=ema(prior,20); slow=ema(prior,50); momentum=rsi(prior)
        signal="BUY" if fast and slow and momentum is not None and prior[-1]>fast>slow and 52<=momentum<=68 else "EXIT" if fast and momentum is not None and (prior[-1]<fast or momentum>75) else "WATCH"
        if position:
            raw_exit = position["stop"] if bar["low"]<=position["stop"] else position["target"] if bar["high"]>=position["target"] else None
            reason="stop" if raw_exit==position["stop"] else "target" if raw_exit==position["target"] else ""
            if raw_exit is None and signal=="EXIT": raw_exit=bar["open"]; reason="trend_exit"
            if raw_exit is not None:
                fill=raw_exit*(1-slippage); proceeds=position["qty"]*fill; fee=proceeds*fee_rate
                pnl=proceeds-fee-position["cost"]; cash+=proceeds-fee
                trades.append({"entry_date":position["date"],"exit_date":bar["date"],"entry_price":position["entry"],"exit_price":round(fill,6),"quantity":position["qty"],"pnl":round(pnl,2),"reason":reason})
                position=None
        # Today's signal only becomes actionable at the next bar's open.
        if position is None and signal=="BUY" and i+1<len(data):
            entry=data[i+1]["open"]*(1+slippage)
            atr_values=[max(data[j]["high"]-data[j]["low"],abs(data[j]["high"]-data[j-1]["close"]),abs(data[j]["low"]-data[j-1]["close"])) for j in range(max(1,i-13),i+1)]
            atr=sum(atr_values[-14:])/len(atr_values[-14:])
            risk=2*atr
            qty=math.floor(min(cash*0.01/risk, cash*0.2/entry))
            cost=qty*entry*(1+fee_rate)
            if qty>0 and cost<=cash:
                cash-=cost; position={"qty":qty,"entry":entry,"cost":cost,"stop":entry-risk,"target":entry+3*risk,"date":data[i+1]["date"]}
        mark=bar["close"]
        curve.append({"date":bar["date"],"equity":round(cash+(position["qty"]*mark if position else 0),2)})
    final_equity=curve[-1]["equity"] if curve else starting_cash
    wins=sum(1 for t in trades if t["pnl"]>0)
    peak=starting_cash; max_dd=0.0
    for point in curve:
        peak=max(peak,point["equity"])
        if peak: max_dd=max(max_dd,(peak-point["equity"])/peak)
    return {"status":"complete","starting_cash":round(starting_cash,2),"ending_equity":round(final_equity,2),"net_return_pct":round((final_equity/starting_cash-1)*100,2),"closed_trades":len(trades),"win_rate_pct":round(wins/len(trades)*100,2) if trades else 0,"max_drawdown_pct":round(max_dd*100,2),"open_position":bool(position),"trades":trades[-100:],"equity_curve":curve,"assumptions":{"signal_timing":"completed close; next session open fill","fee_rate_per_side":fee_rate,"slippage_per_side":slippage,"same_bar_stop_and_target":"stop first","strategy":"EMA20/EMA50 + RSI14; ATR stop 2x; target 3R","warning":"Daily-bar approximation; excludes taxes, corporate actions, survivorship bias and market impact. Past results do not predict future returns."}}

def main():
    payload=json.loads(DEFAULT_INPUT.read_text())
    report=backtest(payload["bars"],payload.get("starting_cash",1_000_000),payload.get("fee_rate",0.0003),payload.get("slippage",0.001))
    DEFAULT_OUTPUT.parent.mkdir(parents=True,exist_ok=True); DEFAULT_OUTPUT.write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({k:report[k] for k in ("status","ending_equity","net_return_pct","closed_trades","max_drawdown_pct")}))
if __name__=="__main__": main()

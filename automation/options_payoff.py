#!/usr/bin/env python3
"""Expiry payoff calculator for a single vanilla option leg; no live chain data."""
from __future__ import annotations
import math

def option_payoff(option_type: str, side: str, strike: float, premium: float, quantity: int, spot_prices: list[float]) -> dict:
    kind=option_type.lower(); direction=side.lower()
    if kind not in {"call","put"} or direction not in {"buy","sell"}: raise ValueError("Use call/put and buy/sell.")
    if not all(math.isfinite(x) for x in (strike,premium)) or strike<=0 or premium<0 or quantity<=0: raise ValueError("Strike, premium and quantity must be valid positive values.")
    if not spot_prices or any(not math.isfinite(x) or x<0 for x in spot_prices): raise ValueError("Provide non-negative expiry spot prices.")
    sign=1 if direction=="buy" else -1
    rows=[]
    for spot in spot_prices:
        intrinsic=max(spot-strike,0) if kind=="call" else max(strike-spot,0)
        pnl=sign*(intrinsic-premium)*quantity
        rows.append({"spot":round(spot,4),"intrinsic_per_unit":round(intrinsic,4),"pnl":round(pnl,2)})
    breakeven=(strike+premium if kind=="call" else strike-premium)
    if direction=="sell": breakeven=breakeven
    max_loss= premium*quantity if direction=="buy" else (None if kind=="call" else max(strike-premium,0)*quantity)
    max_profit= None if direction=="buy" and kind=="call" else (max(strike-premium,0)*quantity if direction=="buy" else premium*quantity)
    return {"option_type":kind,"side":direction,"strike":strike,"premium":premium,"quantity":quantity,"breakeven":round(breakeven,4),"max_loss":round(max_loss,2) if max_loss is not None else "unlimited","max_profit":round(max_profit,2) if max_profit is not None else "unlimited","scenarios":rows,"warning":"Expiry-only intrinsic payoff for one option leg. Excludes lot-size discovery, brokerage, taxes, margin, early exercise, volatility, Greeks and multi-leg margin offsets. Verify contract specifications independently."}

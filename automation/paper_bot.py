#!/usr/bin/env python3
"""Deterministic, paper-only trend engine.

The engine deliberately consumes a validated quote snapshot instead of scraping
exchanges or inventing prices. A licensed/authorised provider adapter can write
frontend/public/data/market-quotes.json using the schema documented in
docs/PAPER_TRADING.md. With no permitted feed, it emits an honest waiting state.
"""
from __future__ import annotations

import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "frontend" / "public" / "data"
QUOTE_FILE = DATA_DIR / "market-quotes.json"
STATE_FILE = ROOT / "automation" / "state" / "paper-bot-state.json"
REPORT_FILE = DATA_DIR / "paper-bot.json"
STARTING_CASH = 1_000_000.0
MAX_POSITIONS = 8
MAX_POSITION_WEIGHT = 0.20
RISK_FRACTION = 0.01
FEE_RATE = 0.0003
SLIPPAGE_RATE = 0.001


def ema(values: list[float], period: int) -> float | None:
    if len(values) < period:
        return None
    alpha = 2 / (period + 1)
    result = sum(values[:period]) / period
    for value in values[period:]:
        result = value * alpha + result * (1 - alpha)
    return result


def rsi(values: list[float], period: int = 14) -> float | None:
    if len(values) <= period:
        return None
    gains = [max(values[i] - values[i - 1], 0.0) for i in range(1, len(values))]
    losses = [max(values[i - 1] - values[i], 0.0) for i in range(1, len(values))]
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    for gain, loss in zip(gains[period:], losses[period:]):
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
    if avg_loss == 0:
        return 100.0 if avg_gain > 0 else 50.0
    return 100 - 100 / (1 + avg_gain / avg_loss)


def atr(bars: list[dict[str, Any]], period: int = 14) -> float | None:
    if len(bars) <= period:
        return None
    ranges = []
    for i in range(1, len(bars)):
        high, low = float(bars[i]["high"]), float(bars[i]["low"])
        previous = float(bars[i - 1]["close"])
        ranges.append(max(high - low, abs(high - previous), abs(low - previous)))
    return sum(ranges[-period:]) / period


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def valid_snapshot(payload: Any) -> tuple[bool, str]:
    if not isinstance(payload, dict):
        return False, "Quote snapshot is missing or malformed."
    if payload.get("status") != "available":
        return False, "No permitted market-data snapshot is available."
    if payload.get("freshness") not in {"live", "delayed", "end_of_day"}:
        return False, "Quote snapshot has no recognised freshness classification."
    if not payload.get("provider") or not payload.get("as_of"):
        return False, "Quote snapshot must identify its provider and as-of timestamp."
    if not isinstance(payload.get("instruments"), list):
        return False, "Quote snapshot instruments must be a list."
    return True, ""


def analyse_instrument(item: dict[str, Any]) -> dict[str, Any] | None:
    symbol = item.get("symbol")
    market = item.get("market", "unknown")
    asset_type = item.get("asset_type", "equity")
    bars = item.get("bars")
    # This first release is long-only cash equity/ETF paper trading. F&O,
    # options, futures, indices and leveraged products are intentionally gated.
    if not isinstance(symbol, str) or asset_type not in {"equity", "etf"}:
        return None
    if not isinstance(bars, list) or len(bars) < 51:
        return None
    try:
        closes = [float(bar["close"]) for bar in bars]
        for bar in bars:
            if any(not math.isfinite(float(bar[k])) for k in ("open", "high", "low", "close")):
                return None
        last = bars[-1]
        price = closes[-1]
        fast, slow = ema(closes, 20), ema(closes, 50)
        momentum, volatility = rsi(closes), atr(bars)
        if price <= 0 or fast is None or slow is None or momentum is None or volatility is None or volatility <= 0:
            return None
        signal = "BUY" if price > fast > slow and 52 <= momentum <= 68 else "WATCH"
        if price < fast or momentum > 75:
            signal = "EXIT"
        return {
            "symbol": symbol,
            "market": market,
            "asset_type": asset_type,
            "currency": item.get("currency", "unknown"),
            "as_of": str(last.get("timestamp") or last.get("date") or ""),
            "price": round(price, 6),
            "ema20": round(fast, 6),
            "ema50": round(slow, 6),
            "rsi14": round(momentum, 2),
            "atr14": round(volatility, 6),
            "signal": signal,
            "reason": (
                "Uptrend confirmed: close above EMA20 above EMA50; RSI is within the strategy entry band."
                if signal == "BUY" else
                "Exit condition: close below EMA20 or RSI above 75."
                if signal == "EXIT" else
                "Trend/momentum entry conditions are not all satisfied."
            ),
        }
    except (KeyError, TypeError, ValueError, OverflowError):
        return None


def run_bot(snapshot: Any, state: Any, now: str | None = None) -> tuple[dict[str, Any], dict[str, Any]]:
    timestamp = now or datetime.now(timezone.utc).isoformat()
    ok, error = valid_snapshot(snapshot)
    if not ok:
        report = {
            "schema_version": 1, "status": "waiting_for_market_data",
            "generated_at": timestamp, "data": {"status": "unavailable", "message": error},
            "mode": "paper_only", "strategy": "EMA20/EMA50 trend + RSI14 filter",
            "summary": {"open_positions": 0, "closed_trades": 0, "cash": STARTING_CASH, "equity": STARTING_CASH, "realised_pnl": 0.0, "unrealised_pnl": 0.0},
            "signals": [], "positions": [], "recent_trades": [],
            "limitations": ["No prices are fabricated.", "No live orders or broker connections.", "F&O is not enabled in this release."]
        }
        return report, state if isinstance(state, dict) else {"cash": STARTING_CASH, "positions": [], "trades": []}

    state = state if isinstance(state, dict) else {}
    cash = float(state.get("cash", STARTING_CASH))
    positions = state.get("positions", []) if isinstance(state.get("positions"), list) else []
    trades = state.get("trades", []) if isinstance(state.get("trades"), list) else []
    analyses = [a for item in snapshot["instruments"] if isinstance(item, dict) if (a := analyse_instrument(item))]
    by_symbol = {a["symbol"]: a for a in analyses}
    snapshot_as_of = str(snapshot.get("as_of") or "")
    # Daily EOD feeds are refreshed once per session. Re-running Actions against
    # the same snapshot must not duplicate entries/exits or churn the journal.
    if snapshot_as_of and state.get("last_processed_as_of") == snapshot_as_of:
        positions = state.get("positions", []) if isinstance(state.get("positions"), list) else []
        trades = state.get("trades", []) if isinstance(state.get("trades"), list) else []
        cash = float(state.get("cash", STARTING_CASH))
        unrealised = sum(float(p.get("quantity", 0)) * (float(p.get("last_price", p.get("entry_price", 0))) - float(p.get("entry_price", 0))) for p in positions)
        equity = cash + sum(float(p.get("quantity", 0)) * float(p.get("last_price", p.get("entry_price", 0))) for p in positions)
        report = {
            "schema_version": 1, "status": "available", "generated_at": timestamp,
            "data": {"status": "available", "provider": snapshot["provider"], "as_of": snapshot_as_of, "freshness": snapshot["freshness"], "instrument_count": len(snapshot["instruments"]), "note": "No new trades: this exact market snapshot has already been processed."},
            "mode": "paper_only", "strategy": "EMA20/EMA50 trend + RSI14 filter; ATR14 stop; 3R target",
            "summary": {"open_positions": len(positions), "closed_trades": len(trades), "cash": round(cash, 2), "equity": round(equity, 2), "realised_pnl": round(sum(float(t.get("pnl", 0)) for t in trades), 2), "unrealised_pnl": round(unrealised, 2)},
            "signals": analyses, "positions": positions, "recent_trades": list(reversed(trades[-20:])),
            "limitations": ["This market snapshot was already processed; no duplicate trades were generated.", "No broker connection or real orders.", "F&O/options/futures remain excluded from paper execution."]
        }
        return report, state
    closed = []

    # Conservative daily-bar exits: if both stop and target are touched, assume
    # the stop was hit first. Stops/targets are checked against supplied OHLC.
    for position in positions[:]:
        analysis = by_symbol.get(position["symbol"])
        if not analysis:
            continue
        source = next((i for i in snapshot["instruments"] if i.get("symbol") == position["symbol"]), {})
        bar = source.get("bars", [])[-1]
        low, high = float(bar["low"]), float(bar["high"])
        stop, target = float(position["stop"]), float(position["target"])
        exit_price = stop if low <= stop else target if high >= target else None
        if analysis["signal"] == "EXIT" and exit_price is None:
            exit_price = analysis["price"]
        if exit_price is not None:
            fill = exit_price * (1 - SLIPPAGE_RATE)
            qty = float(position["quantity"])
            proceeds = qty * fill
            fee = proceeds * FEE_RATE
            pnl = proceeds - fee - float(position["entry_cost"])
            cash += proceeds - fee
            trade = {"symbol": position["symbol"], "side": "LONG", "quantity": qty, "entry_price": position["entry_price"], "exit_price": round(fill, 6), "pnl": round(pnl, 2), "closed_at": timestamp, "reason": "stop" if exit_price == stop else "target" if exit_price == target else "trend_exit"}
            trades.append(trade)
            closed.append(trade)
            positions.remove(position)

    equity_before_entries = cash + sum(float(p["quantity"]) * by_symbol.get(p["symbol"], {}).get("price", float(p["entry_price"])) for p in positions)
    for analysis in analyses:
        if analysis["signal"] != "BUY" or any(p["symbol"] == analysis["symbol"] for p in positions) or len(positions) >= MAX_POSITIONS:
            continue
        risk_per_unit = 2 * analysis["atr14"]
        if risk_per_unit <= 0:
            continue
        quantity_by_risk = (equity_before_entries * RISK_FRACTION) / risk_per_unit
        quantity_by_weight = (equity_before_entries * MAX_POSITION_WEIGHT) / analysis["price"]
        quantity = math.floor(min(quantity_by_risk, quantity_by_weight))
        entry = analysis["price"] * (1 + SLIPPAGE_RATE)
        total = quantity * entry
        fee = total * FEE_RATE
        if quantity <= 0 or total + fee > cash:
            continue
        cash -= total + fee
        positions.append({
            "symbol": analysis["symbol"], "market": analysis["market"], "currency": analysis["currency"],
            "quantity": quantity, "entry_price": round(entry, 6), "entry_cost": round(total + fee, 2),
            "stop": round(entry - risk_per_unit, 6), "target": round(entry + 3 * risk_per_unit, 6),
            "opened_at": timestamp, "last_price": analysis["price"]
        })
    for position in positions:
        if position["symbol"] in by_symbol:
            position["last_price"] = by_symbol[position["symbol"]]["price"]

    unrealised = sum(float(p["quantity"]) * (float(p.get("last_price", p["entry_price"])) - float(p["entry_price"])) for p in positions)
    equity = cash + sum(float(p["quantity"]) * float(p.get("last_price", p["entry_price"])) for p in positions)
    realised = sum(float(t.get("pnl", 0)) for t in trades)
    report = {
        "schema_version": 1, "status": "available", "generated_at": timestamp,
        "data": {"status": "available", "provider": snapshot["provider"], "as_of": snapshot["as_of"], "freshness": snapshot["freshness"], "instrument_count": len(snapshot["instruments"]), "note": "Provider data is not independently verified by FinPilot. Respect its licence and freshness label."},
        "mode": "paper_only", "strategy": "EMA20/EMA50 trend + RSI14 filter; ATR14 stop; 3R target",
        "summary": {"open_positions": len(positions), "closed_trades": len(trades), "cash": round(cash, 2), "equity": round(equity, 2), "realised_pnl": round(realised, 2), "unrealised_pnl": round(unrealised, 2)},
        "signals": analyses, "positions": positions, "recent_trades": list(reversed(trades[-20:])),
        "limitations": ["Paper fills use daily-bar assumptions, slippage and estimated fees.", "No broker connection or real orders.", "F&O/options/futures are excluded until a permitted option-chain and contract-data source is configured.", "This rules-based strategy is educational and has no claim of predictive edge."]
    }
    new_state = {"cash": round(cash, 2), "positions": positions, "trades": trades[-500:], "updated_at": timestamp, "last_processed_as_of": snapshot_as_of}
    return report, new_state


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    snapshot = load_json(QUOTE_FILE, {})
    state = load_json(STATE_FILE, {"cash": STARTING_CASH, "positions": [], "trades": []})
    report, next_state = run_bot(snapshot, state)
    REPORT_FILE.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    STATE_FILE.write_text(json.dumps(next_state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "open_positions": report["summary"]["open_positions"], "closed_trades": report["summary"]["closed_trades"], "data": report["data"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()

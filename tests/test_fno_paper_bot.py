import unittest
from datetime import datetime, timedelta, timezone

from automation.fno_paper_bot import run_bot, select_spread, trend_from_bars


def bullish_bars(count=70):
    start = datetime(2026, 9, 1)
    bars = []
    for i in range(count):
        close = 100 + i * 0.8 + (2 if i % 3 == 0 else -2 if i % 3 == 1 else 0)
        stamp = (start + timedelta(days=i)).date().isoformat()
        bars.append({"timestamp": stamp, "open": close - 0.2, "high": close + 1, "low": close - 1, "close": close, "volume": 10000})
    return bars


def option_side(key, delta, bid, ask, lot=10):
    return {
        "instrument_key": key,
        "contract_meta": {"instrument_key": key, "instrument_type": "CE", "lot_size": lot, "freeze_quantity": lot * 10, "expiry": "2026-11-26", "strike_price": 100 if "100" in key else 110, "trading_symbol": key},
        "market_data": {"bid_price": bid, "ask_price": ask, "bid_qty": 20, "ask_qty": 20, "oi": 500, "volume": 1000},
        "option_greeks": {"delta": delta}
    }


def bullish_snapshot(bars=None, long_ask=5.0, short_bid=2.3, as_of="2026-11-09"):
    bars = bars or bullish_bars()
    contracts = [
        {"strike_price": 100, "expiry": "2026-11-26", "underlying_spot_price": 157, "call_options": option_side("CALL100", 0.50, 4.8, long_ask), "put_options": None},
        {"strike_price": 110, "expiry": "2026-11-26", "underlying_spot_price": 157, "call_options": option_side("CALL110", 0.25, short_bid, 2.5), "put_options": None},
    ]
    # Keep the last bar's timestamp authoritative for idempotency and next-session checks.
    return {"status": "available", "provider": "test-Upstox", "retrieved_at": as_of + "T16:00:00Z", "underlyings": [
        {"underlying": "NIFTY", "instrument_key": "NSE_INDEX|Nifty 50", "underlying_bars": bars, "contracts": contracts}
    ]}


class FnoPaperBotTests(unittest.TestCase):
    def test_requires_market_data_and_never_invents_positions(self):
        report, state = run_bot({"status": "unavailable"}, {}, "2026-11-13T00:00:00Z")
        self.assertEqual(report["status"], "waiting_for_market_data")
        self.assertEqual(report["summary"]["open_positions"], 0)
        self.assertEqual(state["positions"], [])

    def test_bullish_trend_queues_defined_risk_call_spread(self):
        snapshot = bullish_snapshot()
        trend = trend_from_bars(snapshot["underlyings"][0]["underlying_bars"])
        self.assertEqual(trend["trend"], "BULLISH")
        candidate = select_spread(snapshot["underlyings"][0], "BULLISH", trend["as_of"])
        self.assertEqual(candidate["option_type"], "CE")
        self.assertLess(candidate["long_strike"], candidate["short_strike"])
        self.assertGreater(candidate["max_profit_reference"], 0)
        report, state = run_bot(snapshot, {}, "2026-11-13T00:00:00Z")
        self.assertEqual(report["summary"]["open_positions"], 0)
        self.assertEqual(report["summary"]["pending_orders"], 1)
        self.assertEqual(state["pending_orders"][0]["option_type"], "CE")

    def test_pending_spread_fills_only_on_later_snapshot(self):
        first = bullish_snapshot()
        _, state = run_bot(first, {}, "2026-11-13T00:00:00Z")
        bars = bullish_bars() + [{"timestamp": "2026-11-10", "open": 157.2, "high": 160, "low": 156, "close": 158, "volume": 12000}]
        second = bullish_snapshot(bars, long_ask=5.2, short_bid=2.2, as_of="2026-11-10")
        report, next_state = run_bot(second, state, "2026-11-13T01:00:00Z")
        self.assertEqual(len(next_state["positions"]), 1)
        position = next_state["positions"][0]
        self.assertEqual(position["opened_at"], "2026-11-10")
        self.assertAlmostEqual(position["entry_debit"], 3.0)
        self.assertLessEqual(position["max_loss"], 1000)
        self.assertEqual(report["summary"]["open_positions"], 1)

    def test_same_snapshot_is_idempotent(self):
        snapshot = bullish_snapshot()
        _, state = run_bot(snapshot, {}, "2026-11-13T00:00:00Z")
        first_report, first_state = run_bot(snapshot, state, "2026-11-13T01:00:00Z")
        second_report, second_state = run_bot(snapshot, first_state, "2026-11-13T02:00:00Z")
        self.assertEqual(first_state, second_state)
        self.assertEqual(first_report["summary"]["pending_orders"], second_report["summary"]["pending_orders"])
        self.assertIn("already processed", second_report["data"]["note"])

    def test_stale_underlying_snapshot_is_rejected(self):
        snapshot = bullish_snapshot()
        report, state = run_bot(snapshot, {}, "2026-12-01T00:00:00Z")
        self.assertEqual(report["status"], "waiting_for_market_data")
        self.assertEqual(state["positions"], [])


if __name__ == "__main__":
    unittest.main()

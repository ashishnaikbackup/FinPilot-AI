import unittest

from automation.paper_bot import analyse_instrument, ema, rsi, run_bot


class PaperBotTests(unittest.TestCase):
    def test_ema_requires_enough_data(self):
        self.assertIsNone(ema([1, 2, 3], 5))
        self.assertAlmostEqual(ema([1, 2, 3, 4, 5], 3), 4.0)

    def test_rsi_flat_series_is_neutral(self):
        self.assertEqual(rsi([10.0] * 20), 50.0)

    def test_rejects_stale_eod_snapshot(self):
        from automation.paper_bot import valid_snapshot
        payload = {"status": "available", "freshness": "end_of_day", "provider": "test", "as_of": "2026-10-01T00:00:00Z", "instruments": []}
        ok, message = valid_snapshot(payload, "2026-11-13T00:00:00Z")
        self.assertFalse(ok)
        self.assertIn("stale", message.lower())

    def test_rejects_future_snapshot_timestamp(self):
        from automation.paper_bot import valid_snapshot
        payload = {"status": "available", "freshness": "end_of_day", "provider": "test", "as_of": "2026-11-20T00:00:00Z", "instruments": []}
        ok, message = valid_snapshot(payload, "2026-11-13T00:00:00Z")
        self.assertFalse(ok)
        self.assertIn("future", message.lower())

    def test_missing_feed_never_invents_trades(self):
        report, state = run_bot({}, {"cash": 1_000_000, "positions": [], "trades": []}, "2026-11-13T00:00:00Z")
        self.assertEqual(report["status"], "waiting_for_market_data")
        self.assertEqual(report["signals"], [])
        self.assertEqual(report["summary"]["equity"], 1_000_000)
        self.assertEqual(state["positions"], [])

    def test_feed_outage_preserves_existing_virtual_account(self):
        prior = {
            "cash": 750_000,
            "positions": [{"symbol": "ABC", "quantity": 10, "entry_price": 100, "last_price": 110}],
            "pending_orders": [{"symbol": "XYZ"}],
            "trades": [{"symbol": "OLD", "pnl": 500}],
        }
        report, state = run_bot({"status": "unavailable"}, prior, "2026-11-13T00:00:00Z")
        self.assertEqual(report["status"], "waiting_for_market_data")
        self.assertEqual(report["summary"]["open_positions"], 1)
        self.assertEqual(report["summary"]["cash"], 750_000)
        self.assertEqual(report["summary"]["equity"], 751_100)
        self.assertEqual(report["pending_orders"], [{"symbol": "XYZ"}])
        self.assertEqual(state, prior)

    def test_rejects_derivatives(self):
        bars = [{"open": 100+i, "high": 102+i, "low": 99+i, "close": 101+i, "date": str(i)} for i in range(60)]
        self.assertIsNone(analyse_instrument({"symbol": "NIFTY26NOVFUT", "asset_type": "future", "bars": bars}))

    def test_accepts_valid_snapshot_but_reports_signals(self):
        bars = []
        for i in range(70):
            close = 100 + i * 0.8
            bars.append({"open": close - 0.2, "high": close + 1.0, "low": close - 1.0, "close": close, "date": str(i)})
        item = {"symbol": "TEST", "market": "TEST", "asset_type": "equity", "currency": "INR", "bars": bars}
        report, state = run_bot({"status": "available", "freshness": "end_of_day", "provider": "test-fixture", "as_of": "2026-11-12", "instruments": [item]}, {"cash": 1_000_000, "positions": [], "trades": []}, "2026-11-13T00:00:00Z")
        self.assertEqual(report["status"], "available")
        self.assertEqual(len(report["signals"]), 1)
        self.assertEqual(report["signals"][0]["symbol"], "TEST")
        self.assertGreaterEqual(len(state["positions"]), 0)

    def test_buy_signal_is_queued_not_filled_on_signal_close(self):
        bars = []
        for i in range(70):
            close = 100 + i * 0.8 + (2 if i % 3 == 0 else -2 if i % 3 == 1 else 0)
            bars.append({"open": close - 0.2, "high": close + 1.0, "low": close - 1.0, "close": close, "date": f"2026-10-{(i % 28) + 1:02d}"})
        item = {"symbol": "TEST", "market": "TEST", "asset_type": "equity", "currency": "INR", "bars": bars}
        snapshot = {"status": "available", "freshness": "end_of_day", "provider": "test-fixture", "as_of": "2026-11-12", "instruments": [item]}
        report, state = run_bot(snapshot, {"cash": 1_000_000, "positions": [], "trades": []}, "2026-11-13T00:00:00Z")
        self.assertEqual(state["positions"], [])
        self.assertEqual(len(state["pending_orders"]), 1)
        self.assertEqual(report["summary"]["open_positions"], 0)

    def test_pending_buy_fills_at_later_session_open(self):
        bars = []
        for i in range(70):
            close = 100 + i * 0.8 + (2 if i % 3 == 0 else -2 if i % 3 == 1 else 0)
            bars.append({"open": close - 0.2, "high": close + 1.0, "low": close - 1.0, "close": close, "date": f"2026-10-{(i % 28) + 1:02d}"})
        item = {"symbol": "TEST", "market": "TEST", "asset_type": "equity", "currency": "INR", "bars": bars}
        first = {"status": "available", "freshness": "end_of_day", "provider": "test-fixture", "as_of": "2026-11-12", "instruments": [item]}
        _, state = run_bot(first, {"cash": 1_000_000, "positions": [], "trades": []}, "2026-11-13T00:00:00Z")
        next_bar = {"open": 157.4, "high": 159.0, "low": 156.0, "close": 158.0, "date": "2026-11-13"}
        second_item = {**item, "bars": bars + [next_bar]}
        second = {"status": "available", "freshness": "end_of_day", "provider": "test-fixture", "as_of": "2026-11-13", "instruments": [second_item]}
        report, next_state = run_bot(second, state, "2026-11-14T00:00:00Z")
        self.assertEqual(len(next_state["positions"]), 1)
        self.assertGreaterEqual(next_state["positions"][0]["entry_price"], 157.4)
        self.assertLess(next_state["positions"][0]["entry_price"], 158.0)
        self.assertEqual(report["positions"][0]["opened_at"], "2026-11-13")

    def test_stale_pending_entry_is_cancelled_when_signal_turns_exit(self):
        bars = []
        for i in range(70):
            close = 200 - i * 0.8
            bars.append({"open": close + 0.2, "high": close + 1.0, "low": close - 1.0, "close": close, "date": f"2026-10-{(i % 28) + 1:02d}"})
        item = {"symbol": "TEST", "market": "TEST", "asset_type": "equity", "currency": "INR", "bars": bars}
        snapshot = {"status": "available", "freshness": "end_of_day", "provider": "test-fixture", "as_of": "2026-11-13", "instruments": [item]}
        pending = [{"symbol": "TEST", "market": "TEST", "currency": "INR", "risk_per_unit": 4.0, "signal_as_of": "2026-10-13", "created_at": "2026-10-13T00:00:00Z"}]
        _, state = run_bot(snapshot, {"cash": 1_000_000, "positions": [], "pending_orders": pending, "trades": []}, "2026-11-14T00:00:00Z")
        self.assertEqual(state["positions"], [])
        self.assertEqual(state["pending_orders"], [])

    def test_same_snapshot_does_not_duplicate_trades(self):
        bars = []
        for i in range(70):
            close = 100 + i * 0.8
            bars.append({"open": close - 0.2, "high": close + 1.0, "low": close - 1.0, "close": close, "date": f"2026-10-{(i % 28) + 1:02d}"})
        item = {"symbol": "TEST", "market": "TEST", "asset_type": "equity", "currency": "INR", "bars": bars}
        snapshot = {"status": "available", "freshness": "end_of_day", "provider": "test-fixture", "as_of": "2026-11-12", "instruments": [item]}
        first_report, first_state = run_bot(snapshot, {"cash": 1_000_000, "positions": [], "trades": []}, "2026-11-13T00:00:00Z")
        second_report, second_state = run_bot(snapshot, first_state, "2026-11-13T01:00:00Z")
        self.assertEqual(first_state, second_state)
        self.assertEqual(first_report["summary"]["closed_trades"], second_report["summary"]["closed_trades"])
        self.assertIn("already been processed", second_report["data"]["note"])


if __name__ == "__main__":
    unittest.main()

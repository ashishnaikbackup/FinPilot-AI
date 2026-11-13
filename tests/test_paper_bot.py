import unittest

from automation.paper_bot import analyse_instrument, ema, rsi, run_bot


class PaperBotTests(unittest.TestCase):
    def test_ema_requires_enough_data(self):
        self.assertIsNone(ema([1, 2, 3], 5))
        self.assertAlmostEqual(ema([1, 2, 3, 4, 5], 3), 4.0)

    def test_rsi_flat_series_is_neutral(self):
        self.assertEqual(rsi([10.0] * 20), 50.0)

    def test_missing_feed_never_invents_trades(self):
        report, state = run_bot({}, {"cash": 1_000_000, "positions": [], "trades": []}, "2026-11-13T00:00:00Z")
        self.assertEqual(report["status"], "waiting_for_market_data")
        self.assertEqual(report["signals"], [])
        self.assertEqual(report["summary"]["equity"], 1_000_000)
        self.assertEqual(state["positions"], [])

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


if __name__ == "__main__":
    unittest.main()

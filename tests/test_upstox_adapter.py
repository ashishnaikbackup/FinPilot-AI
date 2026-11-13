import unittest
from unittest.mock import patch
from automation.upstox_market_data import candle_bars, ProviderError

class AdapterTests(unittest.TestCase):
    @patch("automation.upstox_market_data.api_get")
    def test_normalises_and_excludes_current_session(self,mock):
        mock.return_value={"status":"success","data":{"candles":[
            ["2026-11-12T00:00:00+05:30",10,12,9,11,100,0],
            ["2026-11-13T00:00:00+05:30",11,13,10,12,120,0]
        ]}}
        # Adapter's system date is the test environment date; patch date for deterministic cutoff.
        from datetime import date
        with patch("automation.upstox_market_data.date") as fake_date:
            fake_date.today.return_value=date(2026,11,13)
            fake_date.side_effect=lambda *args,**kwargs: date(*args,**kwargs)
            rows=candle_bars("NSE_EQ|TEST","token")
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]["close"],11.0)

    @patch("automation.upstox_market_data.api_get")
    def test_api_errors_propagate(self,mock):
        mock.side_effect=ProviderError("bad token")
        with self.assertRaises(ProviderError): candle_bars("NSE_EQ|TEST","token")

if __name__=="__main__": unittest.main()

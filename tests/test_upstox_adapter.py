import unittest
from unittest.mock import patch
from automation.upstox_market_data import candle_bars, fetch_option_contracts, enrich_chain_with_contracts, ProviderError

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
    def test_fetches_verified_option_contract_lot_sizes(self,mock):
        mock.return_value={"status":"success","data":[
            {"instrument_key":"NSE_FO|CALL1","instrument_type":"CE","lot_size":65,"expiry":"2026-11-19"},
            {"instrument_key":"NSE_FO|PUT1","instrument_type":"PE","lot_size":65,"expiry":"2026-11-19"},
            {"instrument_key":"NSE_FO|BAD","instrument_type":"XX","lot_size":0}
        ]}
        item={"name":"NIFTY","instrument_key":"NSE_INDEX|Nifty 50","expiry":"current_week"}
        rows=fetch_option_contracts(item,"token")
        self.assertEqual(len(rows),2)
        self.assertEqual(rows[0]["lot_size"],65)
        mock.assert_called_once_with("/v2/option/contract",{"instrument_key":"NSE_INDEX|Nifty 50","expiry_date":"current_week"},"token")

    def test_enriches_option_chain_with_contract_metadata(self):
        chain={"contracts":[
            {"strike_price":25000,"call_options":{"instrument_key":"NSE_FO|CALL1"},"put_options":{"instrument_key":"NSE_FO|PUT1"}}
        ]}
        metadata=[
            {"instrument_key":"NSE_FO|CALL1","trading_symbol":"NIFTY CE","instrument_type":"CE","lot_size":65,"minimum_lot":65,"freeze_quantity":1800,"tick_size":0.05,"expiry":"2026-11-19"},
            {"instrument_key":"NSE_FO|PUT1","trading_symbol":"NIFTY PE","instrument_type":"PE","lot_size":65,"minimum_lot":65,"expiry":"2026-11-19"}
        ]
        result=enrich_chain_with_contracts(chain,metadata)
        self.assertEqual(result["contracts"][0]["call_options"]["contract_meta"]["lot_size"],65)
        self.assertEqual(result["contracts"][0]["put_options"]["contract_meta"]["instrument_type"],"PE")

    @patch("automation.upstox_market_data.api_get")
    def test_api_errors_propagate(self,mock):
        mock.side_effect=ProviderError("bad token")
        with self.assertRaises(ProviderError): candle_bars("NSE_EQ|TEST","token")

if __name__=="__main__": unittest.main()

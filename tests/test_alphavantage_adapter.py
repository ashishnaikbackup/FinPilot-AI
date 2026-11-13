import io, json, unittest
from unittest.mock import patch
from automation.alphavantage_market_data import fetch_daily, ProviderError

class AlphaVantageTests(unittest.TestCase):
    @patch("automation.alphavantage_market_data.urlopen")
    def test_parses_daily_ohlcv(self,mock):
        payload={"Time Series (Daily)":{"2026-11-12":{"1. open":"10","2. high":"12","3. low":"9","4. close":"11","5. volume":"1234"}}}
        mock.return_value=io.BytesIO(json.dumps(payload).encode())
        rows=fetch_daily("ABC","secret")
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]["close"],11.0)
        self.assertEqual(rows[0]["volume"],1234)
    @patch("automation.alphavantage_market_data.urlopen")
    def test_rate_limit_response_is_not_treated_as_quotes(self,mock):
        mock.return_value=io.BytesIO(json.dumps({"Note":"API rate limit reached"}).encode())
        with self.assertRaises(ProviderError): fetch_daily("ABC","secret")

if __name__=="__main__": unittest.main()

import unittest
from automation.backtest import backtest, validate_bars
from automation.options_payoff import option_payoff

class BacktestTests(unittest.TestCase):
    def sample(self):
        bars=[]
        for i in range(80):
            close=100+i*0.8
            bars.append({"date":f"2026-{(i//28)+1:02d}-{(i%28)+1:02d}","open":close-0.2,"high":close+1,"low":close-1,"close":close})
        return bars
    def test_requires_history(self):
        with self.assertRaises(ValueError): validate_bars([])
    def test_backtest_reports_assumptions(self):
        report=backtest(self.sample())
        self.assertEqual(report["status"],"complete")
        self.assertIn("signal_timing",report["assumptions"])
        self.assertGreaterEqual(report["max_drawdown_pct"],0)
    def test_rejects_bad_ohlc(self):
        bars=self.sample(); bars[0]["high"]=1
        with self.assertRaises(ValueError): validate_bars(bars)

class OptionsTests(unittest.TestCase):
    def test_long_call(self):
        result=option_payoff("call","buy",100,5,50,[90,100,110])
        self.assertEqual([x["pnl"] for x in result["scenarios"]],[-250,-250,250])
        self.assertEqual(result["breakeven"],105)
    def test_short_call_unlimited_loss(self):
        result=option_payoff("call","sell",100,5,25,[150])
        self.assertEqual(result["max_loss"],"unlimited")
    def test_invalid_contract(self):
        with self.assertRaises(ValueError): option_payoff("future","buy",100,5,1,[100])

if __name__=="__main__": unittest.main()

# Backtesting and F&O payoff tools

## Historical backtesting
Run `python automation/backtest.py` after placing a permitted, ordered historical daily OHLC dataset at `automation/data/backtest-sample.json`. Input shape:

```json
{"starting_cash":1000000,"fee_rate":0.0003,"slippage":0.001,"bars":[{"date":"2026-01-01","open":100,"high":103,"low":99,"close":102}]}
```

At least 52 ordered bars are required. The engine computes indicators using only completed prior bars and fills an actionable signal at the next session open. It records net return, win rate, maximum drawdown, trade journal and equity curve. Stop is assumed before target when both are touched in one daily candle.

The sample input is intentionally not populated with fabricated market history. Use a provider/export whose licence permits local storage and backtesting. This initial backtester is single-instrument, long-only, daily-bar and educational; it is not yet a portfolio-grade institutional simulator.

## Options payoff
`automation/options_payoff.py` computes expiry intrinsic P/L and breakeven for one long/short call or put leg. The Options Lab also includes a browser-based multi-leg strategy payoff builder for manually entered calls/puts, premiums, strikes and quantities. It reports scenario P/L, breakevens, net debit/credit and flags unbounded net short-call loss. Quantities are units, not automatically validated exchange lots. Neither tool fetches execution-ready contract metadata, calculates margin, includes taxes/fees, models early exercise or volatility changes, nor produces trade recommendations. Verify contract specifications and lot sizes with the exchange/provider before using any scenario.

## Tests
Run `python -m unittest discover -s tests -v`.

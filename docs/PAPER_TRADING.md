# FinPilot GitHub-native paper trading

## What this release does

The paper bot runs inside GitHub Actions, writes a report into the static website data folder, and uses a deterministic, inspectable strategy. It has no Cloudflare Worker dependency, no broker login, no order execution and no token-entry screen.

The current engine is deliberately **feed-gated**. It does not scrape NSE/BSE, bypass exchange controls, invent quotes or claim that an embedded TradingView chart is a structured quote feed. Until a permitted quote adapter supplies a validated snapshot, the UI says "Waiting for market data" and the bot makes no trades.

## Quote snapshot contract

A permitted provider adapter must write `frontend/public/data/market-quotes.json` before the paper-bot step runs:

```json
{
  "status": "available",
  "provider": "provider name and entitlement",
  "as_of": "2026-11-12T10:00:00Z",
  "freshness": "live",
  "instruments": [
    {
      "symbol": "EXAMPLE",
      "market": "NSE",
      "asset_type": "equity",
      "currency": "INR",
      "bars": [
        {"timestamp": "2026-11-12T10:00:00Z", "open": 100, "high": 102, "low": 99, "close": 101, "volume": 100000}
      ]
    }
  ]
}
```

Provide at least 51 ordered OHLC bars per instrument. This cash-equity engine supports cash equities and ETFs only. Index bars are also consumed by the separate limited F&O simulator described below; futures, naked options, credit spreads, crypto and leveraged cash-equity positions are not handled by this engine. The provider, timestamp and freshness class are mandatory. Never label delayed/EOD data as live.

## Strategy and risk controls

- EMA20/EMA50 trend filter with RSI14 entry band (52–68).
- ATR14-based initial stop at 2 ATR and target at 3R.
- Risk budget is 1% of paper equity per position; maximum notional is 20% per position; maximum eight concurrent positions.
- Long-only; no leverage, shorts, pyramiding or martingale.
- Estimated 0.10% slippage and 0.03% fee per side.
- A signal formed on a completed daily candle is queued and can fill no earlier than the next supplied session's open; it is never filled at the same candle's close.
- Rejects snapshots older than 6 hours for `live`, 48 hours for `delayed` and 10 days for `end_of_day`; future-dated snapshots are rejected.
- A stop gap below the stop level fills at the session open rather than granting the stale stop price. When a daily candle touches both stop and target, the simulator assumes the stop happened first (conservative).
- All trades are hypothetical. The strategy is not validated as profitable and is not investment advice.

## GitHub-only operation

The scheduled GitHub Pages workflow reads the tracked state at `automation/state/paper-bot-state.json`, runs the bot, commits state changes back to the repository with the workflow token, and publishes `paper-bot.json` with the site. The report retains up to 365 session equity points and calculates daily, five-session weekly and 21-session monthly returns when enough history exists; the dashboard plots the virtual-equity curve. This makes the virtual account journal durable across workflow runs instead of relying on the evictable Actions cache. New daily-bar signals are queued and filled at a later session open. GitHub scheduled workflows can be delayed; the report's generated time and source as-of time are authoritative. The tracked state is public repository data: do not put personal financial information, credentials or real account details in it.

No Cloudflare Worker URL or BOT_READ_TOKEN is required. No broker password or provider API key belongs in frontend code, commits, workflow logs or prompts.

## Remaining external dependency

A real India + global cash/F&O feed with the necessary display, storage and derived-data rights is not included. Select a vendor and confirm coverage, latency, exchange segments, display rights and price before connecting it. This is a commercial/data-licensing boundary, not something GitHub Actions can solve. Once selected, implement a server-side GitHub Actions adapter using GitHub Secrets only where the provider permits this deployment model. Never expose credentials in the public Pages bundle.

## Local tests

Run:

```sh
python -m unittest tests.test_paper_bot
```

## Separate F&O paper simulator

A second feed-gated engine, `automation/fno_paper_bot.py`, uses the Upstox option-chain snapshot plus the matching option-contract metadata. It currently considers only defined-risk one-lot debit verticals on the configured Indian index underlyings (NIFTY, BANKNIFTY and FINNIFTY):

- Completed daily index bars provide the EMA20/EMA50 + RSI14 directional filter.
- Bullish setups may queue a CALL debit spread; bearish setups may queue a PUT debit spread.
- The long leg must be nearer the money and the short leg further out of the money, with matching expiry and provider lot size.
- Entries are queued from one completed daily snapshot and can fill only on a later daily option-chain snapshot, using the long-leg ask and short-leg bid.
- Maximum loss is limited to the debit paid for the spread plus estimated fees. The separate virtual account starts at ₹1,00,000 and risks at most 1% of its virtual equity per spread.
- The engine manages stop, target, trend reversal and expiry settlement using provider quotes/underlying bars.

This is a narrow rules-based paper simulator, not the requested full Indian/global F&O platform. It does not model exchange margin, futures, naked shorts, credit spreads, calendars, intraday fills, full taxes/brokerage, or global derivatives. Provider lot-size/freeze metadata must be checked against current exchange circulars. No broker order endpoint is called, and no F&O positions are generated while authorised market data is unavailable.

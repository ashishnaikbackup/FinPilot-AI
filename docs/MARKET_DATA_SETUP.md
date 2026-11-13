# Market data adapter setup

## What is implemented

FinPilot now has an optional, read-only Upstox adapter for India. It can:
- fetch completed daily OHLC candles for configured NSE/BSE equity/ETF instrument keys using Upstox Historical Candle V3;
- fetch an option chain for configured underlyings/expiries using the Upstox Put/Call Option Chain API;
- normalise daily bars for the existing paper-bot strategy;
- record provider errors and source timestamps without inventing data.

It does not place orders, create broker positions or connect to an order endpoint. The adapter is disabled unless credentials and an explicit public-data permission gate are both configured.

## Required GitHub configuration

1. Create/configure a read-only market-data application in your Upstox developer account and review current Upstox API terms, entitlements, exchange data-display and storage rules.
2. In GitHub repository Settings → Secrets and variables → Actions, add:
   - `UPSTOX_ACCESS_TOKEN`: an Upstox access token permitted for these market-data endpoints.
   - `MARKET_DATA_PUBLIC_DISPLAY_RIGHTS`: set to `true` only after confirming that your specific Upstox entitlement permits the intended data and derived output to be published on a public GitHub Pages website. Otherwise leave unset; the adapter will not publish quote snapshots.
3. Edit `automation/config/market-watchlist.json` and add cash equities/ETFs under `india_equities` using exact Upstox instrument keys and symbols. The initial list is empty to avoid guessing instrument identifiers or subscribing to instruments you did not choose.
4. Trigger the workflow manually or wait for the scheduled run.

Never commit tokens, paste them into chat, or place them in frontend environment variables. Do not set the public display gate based on assumption. If your agreement permits private personal use only, this public Pages deployment is not an allowed destination; keep the gate off.

## API coverage and limits

- Upstox Historical Candle V3 returns OHLC history; the adapter excludes the current session's daily bar so it does not trade on an unfinished daily candle.
- The option-chain endpoint requires an underlying instrument key and expiry. Current-week is used by default for NIFTY and BANKNIFTY examples; verify actual exchange expiry/contract details.
- Option-chain output is stored separately from the equity quote snapshot. The current paper bot still excludes F&O from trade execution.
- This adapter currently covers India only. It does not provide global individual-stock data, US options, commodities or crypto.
- The adapter is read-only and intentionally does not use order APIs.

## Provider references

- Upstox Historical Candle V3: https://upstox.com/developer/api-documentation/v3/get-historical-candle-data/
- Upstox Put/Call Option Chain: https://upstox.com/developer/api-documentation/get-pc-option-chain/
- Upstox API overview: https://upstox.com/developer/api-documentation/

## Next provider work

A separate global provider must be selected with exchange coverage, freshness and redistribution rights verified. Free/personal API access does not automatically permit public display. Do not expose a global provider's raw quotes in Pages until the same rights review is complete.

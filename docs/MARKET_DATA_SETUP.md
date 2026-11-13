# Market data adapter setup

## Implemented provider adapters

FinPilot includes two optional, read-only data adapters and a provider merge step.

### India — Upstox
- Fetches completed daily OHLC candles for configured NSE/BSE equity/ETF instrument keys using Upstox Historical Candle V3.
- Fetches option chains for configured underlyings/expiries using the Upstox Put/Call Option Chain API, including LTP, OI, bid/ask and provider Greeks.
- Fetches matching option contracts from the Upstox Option Contracts API and enriches chain rows with provider-supplied lot size, minimum lot, freeze quantity, tick size, trading symbol and expiry metadata.
- Default option-chain underlyings are NIFTY, BANKNIFTY and FINNIFTY. Cash-equity watchlist starts empty to avoid guessing instrument identifiers.

### Global — Alpha Vantage
- Fetches daily EOD OHLCV for configured global equity tickers using TIME_SERIES_DAILY.
- This is not a global real-time feed. Real-time US market data requires a separately entitled paid plan; international coverage depends on the symbol and plan.
- Free/personal API quotas may be too low for broad market scanning. Keep the watchlist small and respect provider limits.

Both adapters:
- require credentials stored as GitHub Actions secrets;
- require an explicit public display/storage rights confirmation before quotes or option chains are published to GitHub Pages;
- never place orders or access trading endpoints;
- write isolated provider snapshots, then a merge step builds the paper-bot input;
- overwrite old snapshots with unavailable status when credentials/rights are missing, preventing stale quotes from silently persisting.

## Required GitHub configuration

In repository Settings → Secrets and variables → Actions, add these only after reviewing provider terms, exchange entitlements, data-display and storage rights:

- `UPSTOX_ACCESS_TOKEN`: Upstox market-data access token.
- `MARKET_DATA_PUBLIC_DISPLAY_RIGHTS`: `true` only if your specific Upstox entitlement permits quote/option-chain and derived output on this public GitHub Pages site.
- `ALPHAVANTAGE_API_KEY`: Alpha Vantage API key.
- `GLOBAL_DATA_PUBLIC_DISPLAY_RIGHTS`: `true` only if your Alpha Vantage plan/agreements permit public display and storage.

If your provider permits personal/private use only, do not enable its public display gate. The adapter intentionally stays disabled in that case.

Edit:
- `automation/config/market-watchlist.json` for India equity/ETF instrument keys and option-chain underlyings/expiries.
- `automation/config/global-watchlist.json` for global ticker symbols, currency and market.

Then run the GitHub Actions workflow manually or wait for the scheduled refresh. Never commit tokens, paste them into chat, or put them in frontend code.

## Important limitations

- Upstox adapter uses completed daily candles, not streaming live ticks. It can feed the existing cash-equity/ETF paper bot with EOD data once configured.
- Upstox option chains and provider-supplied contract lot-size metadata are displayed in Options Lab, but the paper bot still does not trade futures/options. Margin, contract-master freshness validation, multi-leg portfolio risk, expiry settlement, F&O backtesting and the autonomous F&O paper engine remain separate release gates.
- Alpha Vantage adapter is daily EOD only; it does not satisfy the requirement for live global quotes.
- Public Pages can show provider data only if the provider agreement explicitly allows public display and storage. GitHub Secrets protect credentials, not the data after publication.
- No live quote or option-chain data is fabricated when a provider is not configured.

## Official API documentation

- Upstox Historical Candle V3: https://upstox.com/developer/api-documentation/v3/get-historical-candle-data/
- Upstox Put/Call Option Chain: https://upstox.com/developer/api-documentation/get-pc-option-chain/
- Upstox Option Contracts (lot size, freeze quantity, expiry): https://upstox.com/developer/api-documentation/get-option-contracts/
- Alpha Vantage API documentation: https://www.alphavantage.co/documentation/
- Alpha Vantage pricing and usage: https://www.alphavantage.co/premium/

Global real-time coverage, exchange-specific entitlements and public display rights remain provider-plan dependent. Provider accounts and API keys cannot be created or authorised by FinPilot.

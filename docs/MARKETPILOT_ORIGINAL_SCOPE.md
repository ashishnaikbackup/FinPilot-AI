# MarketPilot AI original-scope audit

**Updated:** 13 November 2026  
**Repository:** https://github.com/ashishnaikbackup/FinPilot-AI  
**Website:** https://ashishnaikbackup.github.io/FinPilot-AI/

This audit maps the original MarketPilot AI requests to the current FinPilot AI implementation. "Built" means code exists; it does not mean a live provider is connected or a feature has passed real-market acceptance.

## Original product vision

The requested product is an India-first, global financial intelligence platform with a Groww-like approachable experience. It should support market research, comparisons, analysis, paper trading, reports and beginner-to-professional learning. The later request expanded it to an autonomous, human-like paper trader that scans markets, independently chooses hypothetical trades, explains decisions and produces end-of-day/night reports.

The user's explicit market scope includes:
- Indian cash equities and indices.
- Indian derivatives, especially NIFTY, BANKNIFTY and FINNIFTY, including CALL/PUT opportunities.
- Global equities and international markets.
- ETFs, gold/commodities, mutual funds, SIPs, bonds, REITs/InvITs and other accessible asset classes.
- Portfolio/P&L, risk, comparisons, timing and research suggestions.

The operating constraint is GitHub-first and free-first. Never represent an embedded chart as a FinPilot data feed, label EOD data as live, fabricate quotes/trades, expose credentials, or claim that an unconfigured service is working.

## Acceptance matrix

| Requirement | Current implementation | Status / remaining |
|---|---|---|
| GitHub-only deployment | React/Vite on GitHub Pages; GitHub Actions refresh and build | Built for static/public features. No Cloudflare Worker required. |
| Groww-like accessible dashboard | Responsive market and finance workspaces | Partial product styling/coverage; not a broker app. |
| India macro and official intelligence | World Bank macro; RBI, SEBI, NSE, BSE, PIB feeds | Built as public-source snapshots; not tick-level market intelligence. |
| Global macro/news | World Bank country comparisons, Fed/ECB feeds, GDELT discovery | Built with freshness and verification caveats. |
| India stock data | Read-only Upstox daily-bar adapter | Adapter built; equity watchlist is empty; credentials and public-display/storage rights not configured. |
| Global stock data | Alpha Vantage daily EOD adapter | Adapter built; global watchlist is empty; not a global real-time feed. |
| India option-chain intelligence | Upstox option-chain adapter and Options Lab for configured underlyings | Read-only and rights-gated; default NIFTY/BANKNIFTY only. FINNIFTY and broader derivatives universe are not configured. |
| Greeks, IV, OI and PCR | Displays provider-supplied option-chain fields | Partial; no independent analytics, max pain, IV rank/percentile or full market-wide scanner. |
| Single-leg option payoff | Expiry payoff calculator | Built; manual inputs and no margin/lot validation. |
| Multi-leg options strategy payoffs | Interactive strategy builder added in PR #21 | Pending CI/merge at audit time; manual inputs, expiry-only, no live execution/margin. |
| Human-like autonomous paper trader | Rules-based EMA20/EMA50 + RSI14 + ATR cash-equity/ETF engine | Partial. It is not an LLM agent and does not trade F&O. Next-session fills, stale-feed protection and Git-backed state merged in PR #20. |
| F&O autonomous paper trading | No execution engine yet | Not built. Needs licensed contract data, verified lot sizes, expiry calendar, margin/risk model, bid/ask fills, multi-leg position management and tests. |
| Global paper trading | Cash-equity engine can consume configured provider snapshots | Partial and EOD-only through current Alpha Vantage adapter. No broad exchange coverage or FX-aware portfolio accounting. |
| Opportunity scanner | Rules-based cash-equity signals and research worksheet | Partial. No comprehensive cross-market ranking, fundamentals, event catalysts or verified trade shortlist. |
| Daily/weekly/monthly analysis | Scheduled daily EOD workflow and public data refresh | Partial. Weekly/monthly strategy reports, performance attribution and forecast scorecards remain. |
| End-of-day/night reports | Paper-bot JSON report and dashboard journal; scheduled GitHub Actions | Partial. No email, push, Telegram or guaranteed delivery; GitHub schedule can be delayed. |
| Trade explanations and journal | Signals, reasons, positions, closed trades, P&L and pending entries | Partial; richer decision attribution, skipped-trade reasoning and performance analytics remain. |
| Personal finance / wealth tools | SIP, emergency reserve, goals, debt, browser-local assets and manual paper portfolio | Partial; no private account, secure cloud sync, live holdings, tax-lot accounting or comprehensive net-worth vault. |
| Asset-class research | Learning material and basic opportunity categories | Not complete. Live comparisons for funds, bonds, gold, REITs/InvITs, commodities and international access remain. |
| Beginner-to-professional learning | Basic learning centre and rules-driven mentor | Partial; full structured curriculum, exercises and source-grounded advanced research remain. |
| Source-grounded AI mentor | Rules-based browser mentor | Not generative AI; secure hosted inference, source citations and evidence review are not implemented. |
| Alerts and monitoring | GitHub Actions history and provider status snapshots | Partial; freshness alerts, failed-run notifications and user-configurable watch alerts remain. |

## Hard external blockers

1. **Market-data rights:** GitHub Secrets protect API credentials but do not grant rights to publish, store or redistribute exchange data on a public GitHub Pages website. The configured display-rights gates must remain off unless the specific vendor agreement allows this use.
2. **Provider coverage:** current Upstox integration is daily OHLC plus read-only option chain; current Alpha Vantage integration is global daily EOD. Neither satisfies the original broad, live, global + India cash/F&O requirement.
3. **Free-tier limits:** free API quotas and personal-use entitlements may not permit a broad, frequently refreshed public scanner. GitHub Actions cannot manufacture exchange data or remove vendor licensing restrictions.
4. **Private financial data:** the published site is public and browser-local storage is not a secure private vault. Do not commit personal financial information or real account records.
5. **No real execution:** the bot is paper-only. Broker connectivity and live orders are outside the current scope.

## Next build priorities

1. Complete PR #21 after frontend tests and build pass.
2. Add a rights-compliant, broad India/global provider and configure real watchlists only after entitlement review.
3. Build an F&O paper engine using verified contract master/lot size/expiry/margin data, bid/ask-aware fills, defined-risk strategy limits, and a complete trade journal.
4. Improve the autonomous scanner with multi-timeframe signals, liquidity filters, event/fundamental context, risk-manager checks and explainable skipped-trade reasons.
5. Add daily, weekly and monthly report packages with performance attribution and failure/freshness alerts.
6. Expand asset research across ETFs, mutual funds, gold/commodities, fixed income, REITs/InvITs and legally accessible international instruments.
7. Add secure private financial storage only after authentication, encryption and privacy design are approved.

## Completion rule

A module is complete only when its implementation, tests, data source, permissions, user-visible status and operational workflow are all verified. A provider adapter without credentials and permitted rights is implemented-but-inactive, not a live feature. A paper strategy calculator is not an autonomous paper trader.

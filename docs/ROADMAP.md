# Roadmap

## Phase 1 — Foundation
- [x] Responsive React + TypeScript dashboard
- [x] FastAPI development API
- [x] Architecture, safety and setup documentation
- [x] CI workflow for frontend build and backend tests

## Phase 2 — Public data foundation (in progress; external market widgets added)
- [x] World Bank India GDP public indicator adapter
- [x] Six-country World Bank macro comparison for GDP growth, inflation, unemployment and GDP
- [x] GDELT global news discovery adapter (unverified discovery, not fact-checking)
- [x] Static JSON snapshot generator with provider errors and retrieval timestamps
- [x] GitHub Actions hourly scheduled refresh and GitHub Pages deployment (schedule may be delayed; no hosted backend required)
- [x] Honest no-market-feed status; no fabricated prices
- [x] RBI press-release and notification RSS feeds
- [x] PIB official press-release RSS feed
- [x] SEBI regulator RSS feed
- [x] NSE announcements, corporate actions and board-meeting RSS feeds
- [x] BSE corporate announcements and notices RSS feeds
- [x] Federal Reserve and ECB official press-release feeds
- [x] Distinguish official primary-source releases from GDELT discovery items
- [x] Snapshot schema validation before Pages deployment
- [x] Last-known-good snapshot cache and stale-data labelling on upstream outages
- [x] Weekly Dependabot proposals for npm, pip and GitHub Actions
- [x] Verify the GitHub Pages deployment workflow and built asset paths
- [x] Add TradingView embedded charts, global stock/crypto heatmaps and economic calendar
- [x] Add editable symbol/timeframe controls and India/global market screener links
- [x] Increase typography, form control sizing and responsive market workspace usability
- [ ] Add RBI DBIE table explorer with units, periods, revisions and provenance
- [x] Show scheduled source items and official-feed health in the News Intelligence workspace
- [x] Add heuristic headline grouping, publisher-domain diversity counts and topic-based market-channel prompts in News Intelligence (grouping is not verification or proof of independent reporting)
- [ ] Add source-grounded claim extraction, independent corroboration and claim-level evidence
- [ ] Select a direct market-data provider with explicit public website-display rights
- [ ] Add first-party live/delayed/EOD quote adapter only after provider entitlement is confirmed (TradingView embeds are external widgets, not this adapter)
- [x] Add GitHub-native feed-gated paper-trading engine, scheduled report generation, deterministic tests and dashboard workspace
- [x] Build optional read-only Upstox India EOD/option-chain adapter and Alpha Vantage global EOD adapter with explicit public-display rights gates
- [x] Merge permitted provider snapshots into the paper-bot feed; add Options Lab workspace
- [ ] Configure provider credentials, permitted display/storage rights and real watchlists; without these the bot intentionally remains in waiting state
- [ ] Add real-time global market-data provider and broader exchange coverage
- [x] Add provider status/error snapshots and daily market-data refresh scheduling
- [ ] Add source freshness monitoring and alerts for failed scheduled refreshes

## Phase 3 — India and global research
- [x] Add a candidate research worksheet with bull/base/bear scenarios, fees and risk notes
- [x] Save opportunity research notes locally with JSON export
- [x] Add an official-source IPO/public-issue headline watchlist (not a complete issue calendar)
- [ ] Add structured issue comparisons with offer-document dates, valuation, promoter holdings and risk factors
- [ ] NSE/BSE official filings and corporate actions
- [ ] IPO tracker: DRHP/RHP, dates, valuations, promoter holdings, use of proceeds, risks and official links
- [ ] Government securities, T-bills, SDLs, corporate bonds and deposits
- [ ] Mutual funds and ETFs: costs, benchmark, tracking error, holdings and overlap
- [ ] REITs/InvITs, commodities and legally accessible international investments

## Phase 4 — Personal finance mentor
- [x] Add browser-based rules-driven learning assistant with no local setup or external API dependency
- [ ] Add generative AI only if a secure hosted inference option, privacy terms and budget are explicitly approved
- [ ] Add source-grounded answers, citations, uncertainty labels and a risk-review step
- [x] Cash-flow, emergency reserve and SIP illustration calculators (educational, not forecasts)
- [x] Inflation-aware goal funding planner with a 0% return savings baseline
- [x] Fixed-rate debt payoff estimator with non-amortising-payment warning
- [x] Portfolio concentration flags and local JSON backup restore
- [x] Rules-based financial-stage and goal planner with transparent limitations
- [x] Browser-local asset tracker with asset-class allocation, privacy warning and JSON backup/clear controls
- [x] Manual-price paper portfolio simulator with editable marks, fee-aware illustrative P/L and JSON export (no live quotes or order execution)
- [x] Beginner learning path and official career-resource links
- [ ] Secure budget, emergency fund, net worth and goal tracker with account-based private storage
- [x] Beginner-friendly explainers and structured learning paths
- [x] Finance, banking, risk, compliance and fintech role pathways with official recruitment portals
- [ ] Student income and career roadmap, verified internships and recruitment opportunities
- [ ] Personalized guidance based on user-approved financial inputs

## Phase 5 — Global intelligence and risk
- [ ] Macro/geopolitical/company event analysis with primary-source evidence
- [ ] Bull/base/bear research framework and risk-manager review
- [ ] Scenario simulator, crisis early-warning and forecast scorecard
- [ ] Scam-risk indicators with evidence and uncertainty labels

## Phase 6 — Portfolio and simulation
- [ ] Portfolio tracker with fees, taxes and allocation
- [x] Basic manual-price paper portfolio simulator (user-entered marks, fee-aware illustrative P/L; no live data or execution)
- [x] Deterministic long-only cash-equity/ETF paper simulation with EMA/RSI signals, ATR stops, position sizing, fees/slippage assumptions and conservative daily-bar fills
- [x] Initial single-instrument daily-bar backtester with next-session-open fills, costs, drawdown and explicit limitations
- [ ] Portfolio-grade point-in-time backtesting with corporate actions, survivorship controls and realistic intraday fills
- [x] Add standalone single-leg options expiry payoff and breakeven calculator (manual inputs; no live chain)
- [ ] Add a licensed options-chain/contract-data adapter, exchange lot-size validation, margin and Greeks simulator
- [ ] Read-only broker connectivity after security review

## Phase 7 — Research framework adapters
- [x] Document candidate open-source adapters, licenses and safety boundaries
- [ ] Integrate isolated read-only research adapters only after security, data and license review

Review and isolate third-party projects, dependencies and licenses before integrating:
TradingAgents, AI Hedge Fund, Freqtrade (crypto-specific), Microsoft Qlib, Kronos, AI-Trader and Hummingbot. Do not treat these as interchangeable execution engines.

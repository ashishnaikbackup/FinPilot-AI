# Roadmap

## Phase 1 — Foundation
- [x] Responsive React + TypeScript dashboard
- [x] FastAPI development API
- [x] Architecture, safety and setup documentation
- [x] CI workflow for frontend build and backend tests

## Phase 2 — Public data foundation (in progress)
- [x] World Bank India GDP public indicator adapter
- [x] GDELT global news discovery adapter (unverified discovery, not fact-checking)
- [x] Static JSON snapshot generator with provider errors and retrieval timestamps
- [x] GitHub Actions scheduled refresh and GitHub Pages deployment (no hosted backend required)
- [x] Honest no-market-feed status; no fabricated prices
- [x] RBI press-release and notification RSS feeds
- [x] PIB official press-release RSS feed
- [x] Distinguish official primary-source releases from GDELT discovery items
- [x] Snapshot schema validation before Pages deployment
- [x] Weekly Dependabot proposals for npm, pip and GitHub Actions
- [ ] Verify the published site and scheduled snapshots in GitHub Pages
- [ ] Add RBI DBIE table explorer with units, periods, revisions and provenance
- [ ] Add cross-source event clustering, independent corroboration and claim-level evidence
- [ ] Select a market-data provider with explicit public website-display rights
- [ ] Add live/delayed/EOD quote adapter only after provider entitlement is confirmed
- [ ] Add source freshness monitoring and alerts for failed scheduled refreshes

## Phase 3 — India and global research
- [ ] NSE/BSE official filings and corporate actions
- [ ] IPO tracker: DRHP/RHP, dates, valuations, promoter holdings, use of proceeds, risks and official links
- [ ] Government securities, T-bills, SDLs, corporate bonds and deposits
- [ ] Mutual funds and ETFs: costs, benchmark, tracking error, holdings and overlap
- [ ] REITs/InvITs, commodities and legally accessible international investments

## Phase 4 — Personal finance mentor
- [x] Cash-flow and SIP illustration calculators (educational, not forecasts)
- [x] Browser-local manual asset notes with privacy warning
- [x] Beginner learning path and official career-resource links
- [ ] Secure budget, emergency fund, net worth and goal tracker with account-based private storage
- [ ] Beginner-friendly explainers and structured learning paths
- [ ] Student income and career roadmap, verified internships and recruitment opportunities
- [ ] Personalized guidance based on user-approved financial inputs

## Phase 5 — Global intelligence and risk
- [ ] Macro/geopolitical/company event analysis with primary-source evidence
- [ ] Bull/base/bear research framework and risk-manager review
- [ ] Scenario simulator, crisis early-warning and forecast scorecard
- [ ] Scam-risk indicators with evidence and uncertainty labels

## Phase 6 — Portfolio and simulation
- [ ] Portfolio tracker with fees, taxes and allocation
- [ ] Paper trading and backtesting with look-ahead controls
- [ ] Read-only broker connectivity after security review

## Phase 7 — Research framework adapters
Review and isolate third-party projects, dependencies and licenses before integrating:
TradingAgents, AI Hedge Fund, Freqtrade (crypto-specific), Microsoft Qlib, Kronos, AI-Trader and Hummingbot. Do not treat these as interchangeable execution engines.

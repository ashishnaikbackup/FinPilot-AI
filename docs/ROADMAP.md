# Roadmap

## Phase 1 — Foundation
- [x] Responsive React + TypeScript dashboard
- [x] FastAPI backend and health endpoint
- [x] Architecture, safety and setup documentation
- [x] CI workflow for frontend build and backend tests

## Phase 2 — Public data foundation (in progress)
- [x] RBI DBIE public read-only search adapter
- [x] World Bank macro indicator adapter
- [x] GDELT global news discovery adapter (unverified discovery, not fact-checking)
- [x] SEC EDGAR company-submissions adapter (descriptive User-Agent required)
- [x] Provider status endpoint and honest no-market-feed status
- [x] Dashboard macro chart and news discovery connection
- [ ] Configure SEC_USER_AGENT with a real monitored contact
- [ ] Run CI and fix any integration failures
- [ ] Add RBI DBIE table explorer with units, periods and provenance
- [ ] Add primary-source event verification and news clustering
- [ ] Select a market-data provider with explicit website-display rights
- [ ] Add a live/delayed/EOD quote adapter only after provider entitlement is confirmed

## Phase 3 — India and global research
- [ ] NSE/BSE official filings and corporate actions
- [ ] IPO tracker: DRHP/RHP, dates, valuations, promoter holdings, use of proceeds, risks and official links
- [ ] Government securities, T-bills, SDLs, corporate bonds and deposits
- [ ] Mutual funds and ETFs: costs, benchmark, tracking error, holdings and overlap
- [ ] REITs/InvITs, commodities and legally accessible international investments

## Phase 4 — Personal finance mentor
- [ ] Budget, emergency fund, net worth and goal tracker
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

# Roadmap

## Phase 1 — Foundation
- [x] Responsive React + TypeScript dashboard
- [x] FastAPI development API
- [x] Architecture, safety and setup documentation
- [x] CI workflow for frontend build and backend tests

## Phase 2 — Public data foundation (in progress)
- [x] World Bank India GDP public indicator adapter
- [x] Six-country World Bank macro comparison for GDP growth, inflation, unemployment and GDP
- [x] GDELT global news discovery adapter (unverified discovery, not fact-checking)
- [x] Static JSON snapshot generator with provider errors and retrieval timestamps
- [x] GitHub Actions scheduled refresh and GitHub Pages deployment (no hosted backend required)
- [x] Honest no-market-feed status; no fabricated prices
- [x] RBI press-release and notification RSS feeds
- [x] PIB official press-release RSS feed
- [x] SEBI regulator RSS feed
- [x] NSE announcements, corporate actions and board-meeting RSS feeds
- [x] Federal Reserve and ECB official press-release feeds
- [x] Distinguish official primary-source releases from GDELT discovery items
- [x] Snapshot schema validation before Pages deployment
- [x] Last-known-good snapshot cache and stale-data labelling on upstream outages
- [x] Weekly Dependabot proposals for npm, pip and GitHub Actions
- [ ] Verify the published site and scheduled snapshots in GitHub Pages
- [ ] Add RBI DBIE table explorer with units, periods, revisions and provenance
- [x] Show scheduled source items and official-feed health in the News Intelligence workspace
- [ ] Add cross-source event clustering, independent corroboration and claim-level evidence
- [ ] Select a market-data provider with explicit public website-display rights
- [ ] Add live/delayed/EOD quote adapter only after provider entitlement is confirmed
- [ ] Add source freshness monitoring and alerts for failed scheduled refreshes

## Phase 3 — India and global research
- [x] Add a candidate research worksheet that checks evidence completeness without producing a buy/sell score
- [ ] Add official IPO offer-document calendar and structured issue comparisons
- [ ] NSE/BSE official filings and corporate actions
- [ ] IPO tracker: DRHP/RHP, dates, valuations, promoter holdings, use of proceeds, risks and official links
- [ ] Government securities, T-bills, SDLs, corporate bonds and deposits
- [ ] Mutual funds and ETFs: costs, benchmark, tracking error, holdings and overlap
- [ ] REITs/InvITs, commodities and legally accessible international investments

## Phase 4 — Personal finance mentor
- [ ] Connect a real AI model through a secure server-side provider; do not expose API keys in the browser
- [ ] Add source-grounded answers, citations, uncertainty labels and a risk-review step
- [x] Cash-flow, emergency reserve and SIP illustration calculators (educational, not forecasts)
- [x] Rules-based financial-stage and goal planner with transparent limitations
- [x] Browser-local asset tracker with asset-class allocation, privacy warning and JSON backup/clear controls
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
- [ ] Paper trading and backtesting with look-ahead controls
- [ ] Read-only broker connectivity after security review

## Phase 7 — Research framework adapters
Review and isolate third-party projects, dependencies and licenses before integrating:
TradingAgents, AI Hedge Fund, Freqtrade (crypto-specific), Microsoft Qlib, Kronos, AI-Trader and Hummingbot. Do not treat these as interchangeable execution engines.

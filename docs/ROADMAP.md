# Roadmap

## Phase 1 — Foundation (current)
- [x] Responsive dashboard shell and navigation
- [x] Clear demo-data and no-live-trading disclosures
- [x] FastAPI health endpoint
- [x] Architecture and data integrity rules
- [ ] Install dependencies and run local build checks

## Phase 2 — Reliable market and news data
- Provider abstraction for India/global indices, equities, FX, rates and commodities
- Source/time/freshness metadata on every quote
- Official-source news aggregation and duplicate/event clustering
- Financial calendar and source-linked market snapshots

## Phase 3 — Research opportunities
- IPO tracker: DRHP/RHP, issue dates, valuation, promoters, financials, risks and post-listing review
- Bonds and government securities: YTM, duration, credit quality, liquidity and default risk
- Mutual funds/ETFs: costs, tracking error, benchmark, holdings and overlap
- Deposits, T-bills, G-Secs, REITs/InvITs, commodities and legally accessible international instruments
- Every listing includes eligibility, minimum amount, fees/tax questions, risks and official links

## Phase 4 — AI mentor and learning
- Plain-language financial education and guided learning paths
- Financial foundation, budget, emergency-fund and goal planning
- Student career/income skills, remote role research and verified recruitment calendar
- Answers cite sources and separate evidence from model interpretation

## Phase 5 — Intelligence and risk
- Macro/geopolitical/company event analysis
- Scenario simulator and crisis early-warning signals
- Bull/base/bear analysis, risk checks and forecast scorecard
- Scam-risk signals with evidence, never unsupported accusations

## Phase 6 — Portfolio and simulation
- User-controlled portfolio tracker and performance after fees/tax assumptions
- Paper trading and backtesting with leakage/look-ahead controls
- Read-only broker connectivity only after security and compliance review

## Phase 7 — Research framework adapters
Assess external projects independently; isolate dependencies and preserve their licenses:
- TradingAgents
- AI Hedge Fund
- Freqtrade (crypto-specific)
- Microsoft Qlib
- Kronos
- AI-Trader
- Hummingbot (exchange / market-making tooling)

No copy-paste integration before reviewing license, architecture, security, data assumptions and suitability. Do not use crypto engines as equity or mutual-fund execution systems.

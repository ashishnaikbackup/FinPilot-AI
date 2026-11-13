# FinPilot AI — Expansion Blueprint
**Planning baseline:** 13 November 2026  
**Repository:** https://github.com/ashishnaikbackup/FinPilot-AI  
**Deployment baseline:** GitHub Pages + GitHub Actions, free-first

## 1. Product direction

Expand the existing FinPilot AI into a personal, India-first and global financial research, market-intelligence, portfolio-learning and paper-trading workspace. Preserve the working public dashboard and its provenance-first principles. Build incrementally; do not replace functioning modules without a tested reason.

FinPilot is a research and education product, not a registered investment adviser, broker or exchange. It must not promise returns or present model output as certainty. The first releases remain read-only and paper-trading only.

## 2. What already exists

The current repository already contains:
- React + TypeScript + Vite frontend and a FastAPI adapter backend.
- GitHub Pages deployment and scheduled GitHub Actions data refresh.
- Public macro snapshots (World Bank), official India/global regulator and central-bank feeds, GDELT discovery.
- TradingView embedded charts, stock/crypto heatmaps and economic calendar (external widgets, not FinPilot quote ingestion).
- Personal-finance calculators, learning path, local asset tracker, paper portfolio and research worksheet.
- A browser rules-based learning mentor, not a generative LLM.
- Documentation covering architecture, data sources, audit, deployment and handover.

The largest gap is first-party structured market data: FinPilot currently does not have a licensed native quote API for comprehensive Indian/global cash, F&O, FX, commodity and other instruments. Do not mistake embedded charts or hourly news snapshots for an all-market live feed.

## 3. Product workspaces

### A. Command Center
- India and global market session status, benchmark indices and asset-class overview.
- Market breadth, advance/decline, sector performance, volatility and top movers when supported by the selected data entitlement.
- Watchlists, saved screens, alerts and a clear data freshness indicator on every tile.
- Daily pre-market, intraday and post-market briefings.

### B. India Equities
- NSE/BSE listed-company directory and searchable screener.
- Price/volume, delivery/turnover where licensed, corporate actions, results, filings and announcements.
- Fundamentals: revenue, margins, EPS, cash flow, debt, ROE/ROCE, valuation ratios and peer comparison.
- Technical indicators and multi-timeframe chart analysis.
- Bull/base/bear thesis, valuation assumptions, risks and source links.

### C. Futures & Options Lab
- NIFTY, BANKNIFTY and eligible single-stock derivatives, with contract/expiry metadata.
- Option chain, OI, change in OI, volume, IV, Greeks, PCR, max-pain (explicitly labelled descriptive, not predictive), futures basis and rollover context.
- Expiry calendar, lot size, margin/charges estimator and payoff diagrams.
- Strategy builder for long/short calls and puts, spreads, straddles, strangles, covered positions and hedges.
- Scenario analysis across spot, IV, time decay and expiry; payoff, breakeven, max loss/profit and margin assumptions.
- Paper-trading journal, position sizing, stop/exit rules, drawdown and discipline metrics.
- No live order execution in initial releases. No recommendation should be inferred from OI, PCR or max-pain alone.

### D. Global Markets
- US, UK, EU, Japan, China and other supported exchanges, with per-exchange availability.
- Equities, ETFs, indices, FX, rates, sovereign bonds, commodities, gold, energy, crypto and macro indicators.
- Country/market comparison, currency conversion and jurisdiction-specific accessibility checks.
- Distinguish investable products from reference indicators and instruments unavailable to an India-resident retail investor.

### E. Research & Comparison Engine
- Side-by-side company, ETF, mutual fund, bond, deposit, commodity and asset comparisons.
- Standardised metric definitions, currency/unit normalisation and period alignment.
- Source-backed event timelines and claim-level citations.
- Separate verified facts, derived calculations, analyst interpretation and AI-generated scenarios.
- Bull/base/bear scenarios, counterarguments, missing data and a transparent research status: candidate / watch / insufficient evidence / risk flagged.
- No opaque "AI score" without methodology and validation.

### F. Portfolio & Risk Studio
- Manual holdings first; optional read-only broker/account integrations only after security and provider review.
- Asset allocation, concentration, sector/country/currency exposure and correlation.
- Volatility, drawdown, benchmark comparison, scenario/stress testing and rebalancing education.
- Fees, taxes, liquidity, FX and inflation assumptions.
- Paper portfolio separated visually and technically from real holdings.

### G. News & Event Intelligence
- Official exchange, regulator, issuer, government and central-bank sources first.
- Global reputable publisher discovery as secondary input.
- Deduplicate stories into events; trace claims to primary documents; corroborate consequential claims independently.
- Explain possible transmission channels to sectors/assets as scenarios, not guaranteed price impact.
- Track event outcomes against prior research to measure accuracy.

### H. FinPilot Academy
- Beginner-to-advanced structured curriculum: money basics, inflation, compounding, risk, stocks, funds, bonds, ETFs, gold, valuation, accounting, macroeconomics, technical analysis, derivatives and F&O risk.
- Lessons, worked examples, glossary, quizzes, flashcards, simulated exercises and progress tracking.
- Explain each professional metric in plain language and show how to calculate it.
- Risk-first F&O education and mandatory paper exercises before any real-world action.

### I. Daily Research & Automation
- Scheduled pre-market, intraday (only where feed entitlement supports it), post-market and weekly/monthly reports.
- Watchlist/portfolio event alerts and data-provider health checks.
- Scheduled jobs record source timestamp, retrieval timestamp, status, retries and last-known-good age.
- Alerts are evidence-led and configurable; avoid spam and unsupported trade calls.
- User-controlled timezone, delivery channels, quiet hours and retention.

## 4. Architecture target

Keep the existing frontend and separate provider adapters from business logic.

- Frontend: React + TypeScript + Vite; modular workspaces and reusable chart/table/filter components.
- API: FastAPI with typed schemas, validation, rate limiting and read-only endpoints initially.
- Database: PostgreSQL for instruments, observations, filings, events, research, watchlists and audit metadata. Keep secrets and personal data out of static GitHub Pages.
- Cache/queue: Redis or managed equivalent only when needed; do not add infrastructure before justified.
- Jobs: scheduled ingestion, normalisation, validation, event clustering, report generation and alert dispatch.
- AI gateway: provider-neutral interface for Claude, OpenAI and/or other models; all keys server-side. Add retrieval over approved source records, citations, structured outputs, cost limits, timeout/retry and prompt-injection defenses.
- Observability: structured logs, provider health, freshness SLOs, error reporting, cost tracking and audit trails.
- Deployment: retain GitHub Pages for static public/educational pages. A secure API, database and private user workspace require an always-on backend/database deployment; GitHub Actions alone is not a production real-time streaming service.

## 5. Data provider evaluation

No provider should be selected solely because it advertises "real-time". Before integration, document:
1. Exchange/venue and instrument coverage (especially NSE/BSE cash and F&O).
2. Real-time vs delayed vs EOD status, latency and timestamp semantics.
3. Option-chain depth, Greeks, OI, historical intraday and corporate/fundamental data.
4. Global exchange coverage and asset classes.
5. API/WebSocket limits, uptime, rate limits, historical retention and support.
6. Rights for personal use, web/app display, derived analytics, caching and redistribution.
7. Total cost, free-tier restrictions and whether an individual developer may subscribe.

Initial shortlist for investigation:
- NSE Data & Analytics and BSE market-data products: primary exchange routes; obtain current product, tariff and usage terms.
- TrueData: Indian exchange-data vendor; verify exact NSE/BSE/MCX segment, F&O fields, API entitlement, display rights and current pricing.
- Global providers such as Marketstack and other established market-data APIs: evaluate actual exchange-level real-time/delayed coverage, fundamentals and display rights; do not assume all markets are live.
- TradingView widgets: retain as useful external visualisations, not as a structured quote feed.

Use official/public APIs for macro and filings where terms permit: RBI DBIE, SEBI, NSE/BSE official notices, issuer filings, SEC EDGAR, Federal Reserve, ECB, Treasury, BEA, BLS, IMF and World Bank. Never scrape private endpoints or bypass access controls.

## 6. AI model strategy

Build a model adapter rather than hard-coding one vendor:
- Claude: long-document reading, financial-statement explanation and synthesis.
- OpenAI: structured analysis, tool orchestration and tutoring.
- Optional secondary model for comparison/fallback only after evaluation.

AI must retrieve source records before answering, cite dates and URLs, expose uncertainty, distinguish facts from inference and refuse to invent missing prices or filings. Use deterministic code for calculations (Greeks, payoff, returns, ratios, fees and risk); use LLMs to explain and synthesise, not as the arithmetic source of truth.

## 7. Safety, privacy and compliance gates

- No broker credentials in the browser, GitHub, logs or model prompts.
- No live order execution or unattended trading in initial phases.
- No leverage recommendation, guaranteed-return claims or personalised buy/sell instruction.
- Any future broker API/algo execution requires a separate legal, broker and exchange compliance review. SEBI's retail-algo framework and exchange implementation standards must be checked against current circulars before any such feature.
- NSE/BSE real-time data is a licensed product. Confirm exchange/vendor agreements for web display, storage, derived analytics and redistribution before enabling it.
- Use encryption, least privilege, secure authentication, CSRF/CORS controls, audit logs, backups, deletion/export controls and incident response before storing personal financial records.
- Clearly label stale, delayed, indicative, demo and live data. Never silently substitute stale values for live data.
- No personal financial account connection until explicit opt-in and security review.

## 8. Phased delivery

### Phase 0 — Baseline and design
- Preserve current release; run CI/build/tests and audit current gaps.
- Inventory every existing page, data feed, scheduled workflow and provider adapter.
- Define shared instrument/quote/event/research schemas and freshness labels.
- Produce UI map and acceptance criteria before large refactors.

### Phase 1 — Research foundation
- Native instrument search and watchlists using permitted reference data.
- Better company profiles, fundamentals, peer comparisons and source-grounded research reports.
- Improved news verification, event timeline and daily briefing.
- Add a real AI mentor behind a server-side provider-neutral gateway, with cost/privacy controls.

### Phase 2 — Market data foundation
- Select and integrate one licensed India provider and one global provider after comparison and user approval.
- Structured quote service and WebSocket updates where contract permits.
- Provider health/freshness dashboard, caching, historical storage and failure tests.
- Never expose API keys in the frontend.

### Phase 3 — F&O and paper trading
- Option-chain ingestion where licensed, payoff/Greeks calculators and strategy lab.
- Backtesting with survivorship/look-ahead/bias controls and realistic charges/slippage assumptions.
- Paper trading, trade journal and risk limits; compare simulated outcomes to benchmarks.

### Phase 4 — Portfolio, assets and learning
- Expand asset classes and jurisdiction checks.
- Secure user account, encrypted storage and optional read-only integrations.
- Structured learning paths, quizzes and progress analytics.

### Phase 5 — Production automation
- Reliable scheduler/queue, daily reports, configurable alerts and monitoring.
- Multi-provider failover only where data semantics and entitlements match.
- Security, load, disaster-recovery and compliance review before wider release.

## 9. Definition of done for every data feature

Every displayed datum must include or expose:
- instrument/series identifier, venue and currency/unit;
- value and source/provider;
- source timestamp or reporting period;
- retrieval timestamp in UTC;
- freshness class and entitlement;
- source link and any caveat;
- validation state and last-known-good age.

Every AI research report must include an as-of time, source citations, assumptions, bull/base/bear cases, risks, counterarguments and missing evidence.

## 10. First implementation tasks

1. Audit current GitHub Actions and scheduled refresh behaviour.
2. Create typed domain models for instruments, quotes, option-chain records, events and research reports.
3. Build a provider capability/coverage matrix before choosing paid market-data APIs.
4. Add a daily briefing pipeline using existing official feeds and macro snapshots.
5. Split the large workspace into tested feature modules without breaking the current public site.
6. Add the server-side AI gateway only after a provider and spending limit are approved.

**Current constraint:** a genuinely comprehensive, exchange-licensed real-time India + global F&O platform cannot be promised as completely free. Build the core free-first, make delayed/live status explicit, and activate paid feeds only after reviewing the exact price and licence with the owner.

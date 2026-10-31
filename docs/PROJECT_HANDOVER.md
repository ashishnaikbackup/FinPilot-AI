# FinPilot AI — Project Handover

**Release scope:** GitHub Pages static research and financial-planning workspace  
**Hosting:** GitHub Pages  
**Scheduled operations:** GitHub Actions  
**Budget assumption:** Free-first; no paid API, AI provider or backend hosting configured

## What is delivered

### Public intelligence
- World Bank annual macroeconomic snapshots for India and a six-country comparison (India, US, China, UK and Japan plus Germany).
- Official RSS discovery from RBI, SEBI, NSE, BSE, PIB, the US Federal Reserve and ECB.
- GDELT rolling news discovery, clearly labelled as unverified.
- Provider health, retrieval timestamps, source links, freshness labels, stale-cache handling and pre-deployment data validation.
- Independent RSS feeds fetched concurrently; source ordering remains stable.
- GitHub Actions refreshes and deploys public snapshots approximately hourly (schedule delays are possible).

### Market views
- TradingView embedded advanced chart with editable exchange:ticker symbol and interval.
- Global stock heatmap, crypto heatmap and global economic calendar.
- India, US, ETF and crypto screener links.
- These widgets are externally hosted; stock widgets may be delayed; forex and crypto widgets may be real-time, depending on the market (market-dependent). They are not a FinPilot quote API and do not guarantee every exchange or instrument is live.

### Financial planning and education
- Monthly cash-flow and emergency-reserve planner.
- SIP illustration with explicit assumptions and risk caveats.
- Inflation-aware goal planner, including a 0%-return monthly savings baseline.
- Fixed-rate debt payoff estimator that warns when a payment does not cover monthly interest.
- Browser-based rules-driven financial learning assistant and stage/goal planner. It is not a generative AI model.
- Beginner learning path and official financial education resources.

### Research and portfolio workspace
- IPO/public-issue headline watchlist sourced from official headlines when present; not a complete issue calendar.
- Evidence worksheet with source date, valuation, liquidity, bull/base/bear cases, fees, risks and counterarguments.
- Research notes saved in browser storage with JSON export.
- Manual asset tracker with category allocation, concentration flags, JSON export and restore.
- Local-only storage is not encrypted, synced or a secure vault.

### Career and income
- Official starting links for Goa and India-wide government recruitment, banking, apprenticeships and employment resources.
- Finance, data, risk/compliance and fintech role-family skill pathways.
- Links are not a live vacancy feed; users must check the original notification for eligibility and dates.

## Architecture and operating model

- React + TypeScript + Vite frontend deployed as a static GitHub Pages site.
- GitHub Actions runs frontend/backend CI and scheduled public-data refresh/deployment.
- FastAPI provider adapters remain in the repository for developer/future server-side work; the public site does not call them.
- No local installation is needed to use the published site.
- No paid AI provider, API key, external hosted backend or Ollama dependency is configured.

## Deliberate product boundaries

These are not bugs to conceal; they require permissions, hosting, security review or an explicit budget decision:

1. **Market quotes:** TradingView widgets provide embedded chart and market views, but FinPilot has no first-party quote ingestion API. Data level and instrument coverage vary by exchange; comprehensive real-time NSE/BSE/global feeds require appropriate provider/exchange entitlements.
2. **Generative AI:** not enabled. A real online LLM requires a secure hosted inference provider, server-side secret storage, privacy review, abuse controls and an approved budget. Do not put an API key in frontend code or GitHub Pages.
3. **Private accounts:** no login, cloud-synced financial records or secure user database. Portfolio and research notes stay in the current browser.
4. **Personalised investment advice and trading:** no recommendations, broker connection, order execution, leverage, derivatives or unattended trading.
5. **Research depth:** current macro series are annual; GDELT is discovery-only; official feeds are headline discovery, not a full event-verification engine.
6. **Careers:** official portal directory only, not a live vacancy or eligibility API.
7. **Tax and regulatory treatment:** educational pointers only. Check current official rules or qualified professionals.

## Deployment and verification

1. Ensure repository **Settings → Pages → Build and deployment → Source** is set to **GitHub Actions**.
2. Check [FinPilot GitHub Actions](https://github.com/ashishnaikbackup/FinPilot-AI/actions).
3. Confirm the **FinPilot CI** run succeeds.
4. Confirm **Deploy FinPilot AI frontend** succeeds, including data refresh, snapshot validation, frontend build and Pages deployment.
5. Open [the published site](https://ashishnaikbackup.github.io/FinPilot-AI/) and check the displayed snapshot timestamp and source status.

GitHub scheduled jobs may be delayed or upstream feeds may fail. The site should show stale/unavailable states instead of inventing data.

## Repository references

- [Architecture](ARCHITECTURE.md)
- [Deployment](DEPLOYMENT.md)
- [Data sources and freshness](DATA_SOURCES.md)
- [Roadmap](ROADMAP.md)
- [Open-source adapter review](OPEN_SOURCE_ADAPTER_REVIEW.md)

## Handover recommendation

Treat this as a more capable **free-first research release**, not a fully institutional or real-time terminal. The remaining production decisions are direct licensed market-data coverage, secure backend hosting, private account storage, source-verified event intelligence, live recruitment feeds and hosted generative AI. Keep those decisions independent; do not compromise source integrity or expose private financial information to make a feature appear complete.

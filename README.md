# FinPilot AI

**An India-first, global financial intelligence and wealth-building workspace.**

FinPilot is being built to help a beginner understand markets, economics, personal finance, opportunities, risks and career/income pathways. The product is research-first: it does not promise returns or execute real broker orders. Separate feed-gated rules-based engines simulate cash-equity/ETF trades and a limited set of Indian index-options debit spreads; they are not generative AI agents and do not execute real broker orders.

> **Important:** Educational and research use only. FinPilot is not a SEBI-registered investment adviser and does not replace professional financial, tax or legal advice. No guaranteed returns.

## Current release

- Responsive React + TypeScript dashboard.
- Public data snapshots for India's annual GDP indicator and six-country macro comparison (World Bank), RBI, SEBI, NSE and BSE updates, PIB releases, and Federal Reserve/ECB updates, plus GDELT global news discovery.
- Scheduled refresh and static hosting using GitHub Actions + GitHub Pages. **No Render or paid backend hosting required for the current public dashboard.**
- Explicit source, retrieval time, freshness and caveat labels; official RBI/SEBI/NSE/BSE/PIB/Federal Reserve/ECB items are distinguished from unverified GDELT discovery.
- Working planning modules: cash-flow and emergency-reserve check, inflation-aware goal planner, debt payoff estimator, illustrative SIP calculator, beginner learning path, official career links, a browser-local asset tracker with allocation/concentration checks and JSON import/export, a manual-price paper portfolio simulator with fee-aware illustrative P/L and JSON export, and a research worksheet with locally saved bull/base/bear notes and JSON export.
- Paper Bot: a feed-gated rules-based cash-equity/ETF simulator with next-session-open entries, risk controls, pending-order queue, trade journal, daily JSON report, daily/weekly/monthly paper-account returns and equity curve.
- F&O paper simulator: a separate ₹1 lakh virtual account for one-lot NIFTY/BANKNIFTY/FINNIFTY CALL/PUT debit verticals, using underlying trend, provider bid/ask and lot-size metadata. It is limited to defined-risk debit spreads and remains idle until permitted data is configured. It is not a full F&O engine and never places real orders.
- News Intelligence displays scheduled regulator, exchange and central-bank source items alongside GDELT discovery, with per-feed health when available. It also groups similar headlines heuristically, shows publisher-domain diversity and official-source counts, and suggests topic channels to monitor; grouping is not fact verification or proof of independent reporting.
- The Opportunities workspace includes an official-source IPO/public-issue headline watchlist (not a complete issue calendar). The AI Mentor includes a transparent financial-stage and goal planner plus a browser-based rules-driven learning assistant. It requires no local installation, API key or external AI provider; it is not a generative LLM and cannot verify live market facts. Career pages are official portal links, not a live job feed.
- Options Lab displays provider-supplied India option-chain fields (LTP, OI, bid/ask, IV, Greeks and contract lot-size metadata for NIFTY/BANKNIFTY/FINNIFTY) when authorised data is configured, and includes manual single-/multi-leg expiry payoff scenarios plus a limited defined-risk Indian index-options paper simulator. It does not calculate full exchange margin or support futures, credit spreads or global derivatives.
- Markets workspace now embeds TradingView interactive charts, a global stock heatmap, a crypto heatmap and an economic calendar. Market coverage and quote speed vary by exchange; stock widgets may be delayed, while forex/crypto may be real-time. This is an external display widget, not a FinPilot quote API or a guarantee of real-time exchange data.
- FastAPI adapters remain available for local development and future server-side features; the deployed static site does not depend on them.

## Use the public website (no installation)

Open https://ashishnaikbackup.github.io/FinPilot-AI/. The dashboard and browser-based learning assistant run directly in the browser. No Ollama, Python, Node.js, API key, local server or paid hosting setup is required. The built-in assistant is rules-based educational guidance, not a generative AI model.

## Optional developer setup

Requirements: Node.js 22+, Python 3.11+. This is only for contributors who want to modify and test the source code; it is not needed to use FinPilot.

```bash
python scripts/refresh_public_data.py
cd frontend
npm install
npm run dev
```

The script writes public-source snapshots to `frontend/public/data/`. If a provider is unavailable, it records the error and preserves a cached last-known-good snapshot when one exists, clearly labelling it stale. It never invents values.

## Publish for free with GitHub Pages

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Open **Actions → Deploy FinPilot AI frontend** and run the workflow once (or push a change under `frontend/`).
4. When the workflow succeeds, the site is published at:
   https://ashishnaikbackup.github.io/FinPilot-AI/

The workflow refreshes public data and rebuilds the website approximately hourly (GitHub may delay scheduled runs). A last-known-good cache helps retain useful snapshots during temporary upstream outages; stale data is visibly labelled and its original retrieval time is preserved. The deployment validates timestamp timezones, macro numeric values, HTTPS source URLs and the official-source domain allowlist before publishing. Weekly Dependabot checks propose frontend, backend and GitHub Actions dependency updates as pull requests. Review the changelog and CI result before merging; updates are not silently installed. GitHub scheduled jobs can be delayed, so the UI must always show the snapshot's actual retrieval time. This is periodic data, not a guaranteed real-time service.

## Public data and freshness

| Data | Source | What it means |
|---|---|---|
| India GDP | World Bank Indicators API, `NY.GDP.MKTP.CD` | Annual macroeconomic observation in current US dollars; subject to revision, not a live indicator |
| Official India updates | RBI, SEBI and PIB RSS feeds; NSE announcements, corporate actions and board meetings RSS plus BSE announcements/notices | Primary-source links; feed timestamps and original documents should be checked |
| Global official releases | Federal Reserve monetary-policy RSS and ECB press-release RSS | Primary-source releases, subject to feed availability |
| Global macro comparison | World Bank Indicators API | Annual GDP growth, inflation, unemployment and nominal GDP for India, US, China, UK, Germany and Japan; latest years vary. |
| Global news discovery | GDELT DOC API | Rolling discovery index; not fact-checked and not necessarily the publisher's publication time |
| Embedded charts / heatmaps | TradingView widgets | External chart and market visualisations; real-time, delayed or end-of-day (market-dependent) availability varies by exchange and widget |
| FinPilot quote API | Not connected | FinPilot does not ingest, store or redistribute the embedded widget quotes |

See the [MarketPilot original-scope audit](docs/MARKETPILOT_ORIGINAL_SCOPE.md) for a requirement-by-requirement status against the original vision. See the [Feature Audit](docs/FEATURE_AUDIT.md) for completed, partial and externally blocked requirements. See the [Final Release Checklist](docs/FINAL_RELEASE_CHECKLIST.md) for the release acceptance checks, open maintenance items and explicit scope boundaries. See the [Project Handover](docs/PROJECT_HANDOVER.md) for the delivered scope and release boundaries, [Data Sources](docs/DATA_SOURCES.md) for provider documentation and licensing, and [Open-source Adapter Review](docs/OPEN_SOURCE_ADAPTER_REVIEW.md) for project-by-project reuse and safety decisions.

## Optional local API

The FastAPI backend is retained for development and future server-side features:

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs. The deployed GitHub Pages site currently uses static snapshots and does not call this local API.

## Product roadmap

1. Public-data reliability, timestamps, error handling and data provenance.
2. RBI DBIE explorer and verified official-source news/event intelligence.
3. India and global research: IPOs, stocks, mutual funds, ETFs, bonds, deposits, gold, REITs/InvITs and international access checks.
4. Personal finance: improve the local-only cash-flow, SIP and asset-note tools; add goals and emergency-fund tracking only with clear privacy controls.
5. Career and income: verified internships, remote roles and government recruitment with source dates and eligibility checks.
6. Portfolio tracking, risk analysis, scenario tools and paper trading.
7. Carefully isolated open-source research adapters after security and license review.

## Non-negotiable safety rules

- Never label annual/delayed/end-of-day data as live.
- Every observation needs a provider, retrieval time, source timestamp or period, unit and freshness label.
- Distinguish facts, assumptions, opinions and model-generated scenarios.
- Show bull/base/bear cases, risks, fees, tax considerations, liquidity and counterarguments.
- Verify Indian and overseas eligibility, regulation and tax before describing an instrument as accessible.
- No scraping or bypassing provider terms. No live trading, broker credentials, leverage or unattended execution in the initial product.
- Add authentication and secure storage before handling personal financial records.

## Project structure

```text
FinPilot-AI/
├── frontend/                 # React + TypeScript static dashboard
├── backend/                  # Optional FastAPI development API
├── scripts/                  # Scheduled public data snapshot refresh
├── docs/                     # Architecture, data sources and roadmap
└── .github/workflows/        # CI and GitHub Pages deployment
```

No project-wide license has been selected yet. Third-party code, dependencies and data retain their own licenses and terms.

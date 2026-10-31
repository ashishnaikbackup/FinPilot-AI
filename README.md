# FinPilot AI

**An India-first, global financial intelligence and wealth-building workspace.**

FinPilot is being built to help a beginner understand markets, economics, personal finance, opportunities, risks and career/income pathways. The product is research-first: it does not promise returns, generate automatic buy/sell orders or execute trades.

> **Important:** Educational and research use only. FinPilot is not a SEBI-registered investment adviser and does not replace professional financial, tax or legal advice. No guaranteed returns.

## Current release

- Responsive React + TypeScript dashboard.
- Public data snapshots for India's annual GDP indicator and six-country macro comparison (World Bank), RBI, SEBI, NSE and BSE updates, PIB releases, and Federal Reserve/ECB updates, plus GDELT global news discovery.
- Scheduled refresh and static hosting using GitHub Actions + GitHub Pages. **No Render or paid backend hosting required for the current public dashboard.**
- Explicit source, retrieval time, freshness and caveat labels; official RBI/SEBI/NSE/BSE/PIB/Federal Reserve/ECB items are distinguished from unverified GDELT discovery.
- Working planning modules: cash-flow and emergency-reserve check, illustrative SIP calculator, beginner learning path, official career links, a browser-local asset tracker with category allocation and JSON backup, and an evidence-completeness research worksheet, and an official-source IPO/public-issue headline watchlist.
- News Intelligence displays scheduled regulator, exchange and central-bank source items alongside GDELT discovery, with per-feed health when available.
- The AI Mentor includes a transparent rules-based financial-stage and goal planner; it is not a connected LLM or personalized regulated advisory service. Career pages are official portal links, not a live job feed.
- Exchange quotes remain blank until an appropriately licensed market-data provider is configured.
- FastAPI adapters remain available for local development and future server-side features; the deployed static site does not depend on them.

## Run locally

Requirements: Node.js 22+, Python 3.11+.

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

The workflow refreshes public data and rebuilds the website approximately every six hours. A last-known-good cache helps retain useful snapshots during temporary upstream outages; stale data is visibly labelled and its original retrieval time is preserved. The deployment validates timestamp timezones, macro numeric values, HTTPS source URLs and the official-source domain allowlist before publishing. Weekly Dependabot checks propose frontend, backend and GitHub Actions dependency updates as pull requests. Review the changelog and CI result before merging; updates are not silently installed. GitHub scheduled jobs can be delayed, so the UI must always show the snapshot's actual retrieval time. This is periodic data, not a guaranteed real-time service.

## Public data and freshness

| Data | Source | What it means |
|---|---|---|
| India GDP | World Bank Indicators API, `NY.GDP.MKTP.CD` | Annual macroeconomic observation in current US dollars; subject to revision, not a live indicator |
| Official India updates | RBI, SEBI and PIB RSS feeds; NSE announcements, corporate actions and board meetings RSS | Primary-source links; feed timestamps and original documents should be checked |
| Global official releases | Federal Reserve monetary-policy RSS and ECB press-release RSS | Primary-source releases, subject to feed availability |
| Global macro comparison | World Bank Indicators API | Annual GDP growth, inflation, unemployment and nominal GDP for India, US, China, UK, Germany and Japan; latest years vary. |
| Global news discovery | GDELT DOC API | Rolling discovery index; not fact-checked and not necessarily the publisher's publication time |
| Exchange prices | Not connected | No NIFTY, SENSEX, US index or asset prices are displayed as current until licensing permits it |

See [Data Sources](docs/DATA_SOURCES.md) for official provider documentation and licensing boundaries.

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

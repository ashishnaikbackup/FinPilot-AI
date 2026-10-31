# FinPilot AI

**Your personal AI financial intelligence and wealth-building mentor.**

FinPilot AI is an India-first, global financial research and learning workspace. It is being built in careful phases: start with a useful dashboard and reliable foundations, then add verified market data, research workflows, news intelligence, portfolio tools and paper trading.

> **Important:** This project is an educational and research tool, not a SEBI-registered investment advisory service. It does not provide guaranteed returns, execute trades, or replace professional financial, tax or legal advice. Demo figures are illustrative only.

## Phase 1 — Foundation

- Responsive web dashboard built with React, TypeScript and Vite.
- Python FastAPI backend with a health endpoint.
- Market overview, opportunity watchlist, news intelligence and personal finance widgets using clearly-labelled demo data.
- India-first / global-ready information architecture.
- Beginner-friendly financial mentor principles.
- Safe configuration: secrets belong on the server, never in browser code.
- No live trading, broker credentials, leverage or investment recommendations in this phase.

## Run locally

### Requirements
- Node.js 20+
- Python 3.11+

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API health: http://localhost:8000/api/health

The dashboard now calls the backend for public-source macroeconomic observations and global news discovery. If the backend is offline, the UI shows a connection warning rather than fabricated prices or headlines.

## Public data API

Run the backend and open http://localhost:8000/docs for interactive API documentation.

- GET /api/data/status — provider availability and quote-feed status.
- GET /api/data/india/dbie/search?q=inflation — RBI DBIE public data catalogue search.
- GET /api/data/global/world-bank?country=IND&indicator=NY.GDP.MKTP.CD — World Bank macro indicator observations.
- GET /api/news/global?days=3&limit=8 — GDELT news discovery results; not verified facts.
- GET /api/data/us/sec/0000320193 — SEC company filing history (requires backend SEC_USER_AGENT).

The frontend currently plots annual World Bank GDP observations, not intraday market prices. The market quote tiles intentionally show no value until an exchange-data provider with appropriate website-display rights is configured.

## Environment

Copy backend/.env.example to backend/.env and set a descriptive SEC User-Agent with a contact email. Copy frontend/.env.example to frontend/.env and set VITE_API_BASE_URL to the backend origin. Never put secret API keys in VITE variables.

See docs/DATA_SOURCES.md for provider limitations and official links.

## Deployment

- Deploy `frontend/` as a Vite static site (for example, Cloudflare Pages, Netlify or Vercel).
- Deploy `backend/` as a Python web service (for example, Render).
- Set the frontend's `VITE_API_BASE_URL` to the deployed backend URL when connecting the API.
- Keep provider API keys and private credentials in backend environment variables / deployment secrets only.
- Use HTTPS and authentication before storing personal financial information.

## Planned modules

1. Dashboard and personal finance foundations
2. Indian and global market data with source and freshness labels
3. IPO, mutual fund, ETF, bond, deposit, commodity, REIT/InvIT and international research
4. News and geopolitical intelligence with source verification and impact analysis
5. AI mentor, learning centre and career/income guidance
6. Portfolio tracking, risk analysis, tax-awareness and paper trading
7. Isolated research/backtesting adapters for selected open-source projects

## Data integrity rules

- Every market value must identify its source, timestamp and whether it is live, delayed, end-of-day or illustrative.
- Never describe mock or stale information as real-time.
- Separate facts, assumptions and model-generated scenarios.
- Show risks, fees, tax considerations, liquidity and counterarguments alongside opportunities.
- Verify Indian and overseas eligibility, regulation and tax before presenting an instrument as accessible.
- Do not scrape data or bypass provider licensing and terms.

## Project structure

```text
FinPilot-AI/
├── frontend/                 # React + TypeScript dashboard
├── backend/                  # FastAPI service
├── docs/                     # Architecture and roadmap
├── .gitignore
└── README.md
```

## License

No project-wide license has been selected yet. Third-party dependencies and future integrations retain their own licenses. Do not assume this repository grants rights to reuse third-party code or market data.


## Deployment

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) to publish the frontend on GitHub Pages and deploy the API using the Render Blueprint. See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for provider and freshness details.

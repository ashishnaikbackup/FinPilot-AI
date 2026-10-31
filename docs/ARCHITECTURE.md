# FinPilot AI — Architecture

## Product boundaries
FinPilot is a research, education and personal finance workspace. Phase 1 does not connect to brokers or execute orders. Any eventual regulated advice workflow, broker integration or market-data redistribution requires a separate legal, security and licensing review.

## System layout
- **Frontend:** React + TypeScript + Vite. Presentation components consume typed API/data-provider contracts.
- **Backend:** FastAPI. Provider keys, scheduled ingestion and future authentication stay server-side.
- **Storage (later phase):** PostgreSQL for authenticated user records and normalized market/news metadata. SQLite is acceptable for local experiments only.
- **Jobs (later phase):** scheduled ingestion with retry, rate-limit handling, freshness monitoring and audit records.

## Data provider contract (planned)
Every quote/series should carry:
- instrument identifier and exchange/venue
- value, currency and unit
- provider/source name
- source timestamp and retrieval timestamp (UTC)
- freshness class: live, delayed, end-of-day, indicative or demo
- provider disclaimer / entitlement where applicable

Never silently fall back from live to stale data. Show the freshness class in the UI.

## Research assessment contract (planned)
Each assessment should show:
- thesis and investment horizon
- bull/base/bear cases
- valuation and key assumptions
- fundamental and market evidence with links
- liquidity, volatility, concentration and drawdown risks
- fees, tax and eligibility questions
- counterarguments and missing information
- verdict: research candidate / watch / hold / avoid / insufficient evidence
- generated-at timestamp and confidence rationale

A model must not invent confidence scores or present a scenario as a fact. A risk-review stage can block an opportunity from appearing in a positive shortlist.

## India-first compliance checks
Before presenting an instrument or route as accessible, verify current SEBI, RBI, FEMA/LRS, exchange, issuer, tax and provider requirements from primary sources. Rules change; the product must show jurisdiction and checked date. This architecture is not legal or tax advice.

## Security baseline
- Secrets only in server environment variables.
- Never put provider secrets in VITE_ variables or browser bundles.
- Use HTTPS, authentication, authorization, input validation and audit logs before adding personal financial records.
- Start with read-only integrations; require explicit human review for any external action.
- No unattended live trading, leverage or derivatives in initial phases.

## Planned source hierarchy
Use official sources first: RBI, SEBI, NSE/BSE, issuer filings, MOSPI, Ministry of Finance; and internationally SEC/EDGAR, Federal Reserve, Treasury, BEA, BLS, ECB, IMF, World Bank and relevant national authorities. Use licensed market/news providers for redistribution.

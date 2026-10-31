# FinPilot AI — Data Sources and Freshness

This document records the initial public-source integrations. Provider availability, terms and schemas can change; re-check them before production use.

## Connected public endpoints

| Area | Source | API / access | Freshness and limits |
|---|---|---|---|
| Indian macroeconomics | RBI Database on Indian Economy (DBIE) | Public read-only JSON API, no key | Backend/local adapter only; not currently included in the static public snapshot. Periodic dataset loads, not a live market feed. Tables have different frequencies and units. |
| Global macroeconomics | World Bank Indicators API | Public API | Indicator-specific; many observations are annual or quarterly and may be revised. |
| Official Indian updates | RBI RSS, SEBI RSS, PIB RSS, NSE announcements/corporate actions/board meetings RSS | Public RSS feeds | Regulator, exchange and government primary-source releases. Feed health is recorded separately; open and check the original document. |\n| Global official updates | Federal Reserve monetary-policy RSS, ECB press-release RSS | Public RSS feeds | Central-bank releases; subject to provider feed availability. |
| Global news discovery | GDELT DOC | Public API | Discovery/coverage aggregation. Not a truth-verification service and not a substitute for primary documents. |
| US listed-company filings | SEC EDGAR submissions API | Public JSON API; descriptive User-Agent required | Backend/local adapter only; not currently included in the static public snapshot. Filing updates are disseminated through SEC systems; respect SEC fair-access rules. |

## Market prices: intentionally not faked

FinPilot does not scrape NSE/BSE pages or rely on undocumented exchange endpoints. NSE describes real-time feeds as subscription products and also documents delayed snapshot products. Exchange data redistribution and display can have separate terms. Before enabling live or delayed quotes on the deployed website, choose a provider whose contract explicitly permits:
- the instruments and exchanges we need;
- personal/internal use and public website display (these are not always the same);
- caching, historical storage and derived analytics;
- mobile/web display and the expected number of users;
- redistribution and attribution requirements.

Until then the quote API status is not_connected, and the UI displays no fabricated prices. A provider adapter should return value, currency, source, source_timestamp, retrieved_at, freshness, and entitlement.

## News verification workflow (planned)

1. Discovery service collects candidate coverage and records publisher/domain and publication time.
2. Deduplicate articles into an event cluster.
3. Find primary evidence: regulator filing, central-bank release, government order, court document, issuer announcement or official statistics.
4. Seek independent reputable corroboration for consequential claims.
5. Label each claim as confirmed, disputed, unverified or analysis; store evidence links.
6. Explain possible market channels as scenarios, not certainties.

GDELT is only the discovery connector in Phase 2. Do not show an aggregated headline as verified fact or turn it into a trade signal automatically.

## Official source directory

- RBI press releases RSS: https://www.rbi.org.in/pressreleases_rss.xml
- RBI notifications RSS: https://www.rbi.org.in/notifications_rss.xml
- PIB press releases RSS: https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1\n- SEBI RSS: https://www.sebi.gov.in/sebirss.xml\n- NSE RSS directory: https://www.nseindia.com/static/rss-feed\n- NSE announcements RSS: https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml\n- NSE corporate actions RSS: https://nsearchives.nseindia.com/content/RSS/Corporate_action.xml\n- NSE board meetings RSS: https://nsearchives.nseindia.com/content/RSS/Board_Meetings.xml\n- Federal Reserve monetary policy RSS: https://www.federalreserve.gov/feeds/press_monetary.xml\n- ECB press releases RSS: https://www.ecb.europa.eu/rss/press.html
- RBI DBIE: https://dev.dbie.rbihub.in/docs/using-the-site
- NSE data products: https://www.nseindia.com/static/market-data/real-time-data-subscription
- BSE market data: https://marketdata.bseindia.com/
- SEBI securities market data terms: https://www.sebi.gov.in/legal/circulars/feb-2022/approach-to-securities-market-data-access-and-terms-of-usage-of-data-provided-by-data-sources-in-indian-securities-market_56420.html
- SEC developer resources: https://www.sec.gov/about/developer-resources
- World Bank API: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
- FRED API (API key required): https://fred.stlouisfed.org/docs/api/fred/overview.html
- IMF Data API: https://data.imf.org/en/Resource-Pages/IMF-API
- India Open Government Data: https://www.data.gov.in/

## Environment configuration

Backend (backend/.env):
- FRONTEND_ORIGINS: comma-separated deployed frontend origins.
- SEC_USER_AGENT: descriptive application name and contact email, e.g. FinPilotAI contact@example.com.
- HTTP_TIMEOUT_SECONDS: upstream request timeout.

Frontend (frontend/.env):
- VITE_API_BASE_URL: deployed backend origin. This is public configuration, never a secret.

Never place provider API keys in VITE_ variables.

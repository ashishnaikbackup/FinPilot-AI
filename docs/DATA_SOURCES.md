# FinPilot AI — Data Sources and Freshness

This document records the initial public-source integrations. Provider availability, terms and schemas can change; re-check them before production use.

## Connected public endpoints

| Area | Source | API / access | Freshness and limits |
|---|---|---|---|
| Indian macroeconomics | RBI Database on Indian Economy (DBIE) | Public read-only JSON API, no key | Backend/local adapter only; not currently included in the static public snapshot. Periodic dataset loads, not a live market feed. Tables have different frequencies and units. |
| Global macroeconomics | World Bank Indicators API | Public API | Static snapshot compares India, US, China, UK, Germany and Japan across GDP growth, inflation, unemployment and nominal GDP. Annual observations vary by country and can be revised. |
| Official Indian updates | RBI RSS, SEBI RSS, PIB RSS, NSE announcements/corporate actions/board meetings RSS, BSE corporate announcements/notices RSS | Public RSS feeds | Regulator, exchange and government primary-source releases. Feed health is recorded separately; open and check the original document. |
| Global official updates | Federal Reserve monetary-policy RSS, ECB press-release RSS | Public RSS feeds | Central-bank releases; subject to provider feed availability. |
| Global news discovery | GDELT DOC | Public API | Discovery/coverage aggregation. Not a truth-verification service and not a substitute for primary documents. |
| US listed-company filings | SEC EDGAR submissions API | Public JSON API; descriptive User-Agent required | Backend/local adapter only; not currently included in the static public snapshot. Filing updates are disseminated through SEC systems; respect SEC fair-access rules. |

## Embedded market widgets

The Markets workspace embeds TradingView Web Components: Advanced Real-Time Chart, stock heatmap, crypto heatmap and Economic Calendar. These widgets fetch and render data from TradingView in the visitor's browser; FinPilot does not ingest, store, normalise or redistribute those quote values. The chart selector includes common Indian indices and stocks, US indices, gold and Bitcoin, and accepts a custom `EXCHANGE:TICKER` symbol. Links open broader India/US stock, ETF and crypto screeners.

TradingView describes its widgets as free to embed, but explicitly states that the data level depends on the exchange and that upgrading a TradingView account does not make website widgets real-time; real-time exchange data may require a separate exchange entitlement. Check the provider's [widget data FAQ](https://www.tradingview.com/widget-docs/faq/data/), [widget directory](https://www.tradingview.com/widget/) and [available markets](https://www.tradingview.com/widget-docs/markets/). The embedded widgets are useful live-updating views where supported, not a guarantee of real-time data for every NSE/BSE/global instrument.

## First-party market prices: not connected

FinPilot does not scrape NSE/BSE pages or rely on undocumented exchange endpoints. NSE lists its official corporate RSS categories on its [RSS directory](https://www.nseindia.com/static/rss-feed). NSE describes real-time feeds as subscription products and also documents delayed snapshot products. Exchange data redistribution and display can have separate terms. Before enabling live or delayed quotes on the deployed website, choose a provider whose contract explicitly permits:
- the instruments and exchanges we need;
- personal/internal use and public website display (these are not always the same);
- caching, historical storage and derived analytics;
- mobile/web display and the expected number of users;
- redistribution and attribution requirements.

SEBI circular HO/47/17/12(11)2025 dated 8 May 2026 amended the permitted lag for market-price data shared for investor education and awareness to 30 days (with a separate NISM simulation-lab exception). FinPilot will not ingest or display exchange price data without confirming the current legal basis and permissions for the intended use. The FinPilot quote API status remains `not_connected`; the embedded TradingView widgets are a separate external display path. No prices are fabricated or written into FinPilot snapshots. A provider adapter should return value, currency, source, source_timestamp, retrieved_at, freshness, and entitlement.

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
- PIB press releases RSS: https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1
- SEBI RSS: https://www.sebi.gov.in/sebirss.xml
- NSE RSS directory: https://www.nseindia.com/static/rss-feed
- NSE announcements RSS: https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml
- NSE corporate actions RSS: https://nsearchives.nseindia.com/content/RSS/Corporate_action.xml
- NSE board meetings RSS: https://nsearchives.nseindia.com/content/RSS/Board_Meetings.xml
- NSE official RSS category directory: https://www.nseindia.com/static/rss-feed
- BSE corporate announcements RSS: https://www.bseindia.com/data/xml/announcements.xml
- BSE notices RSS: https://www.bseindia.com/data/xml/notices.xml
- Federal Reserve monetary policy RSS: https://www.federalreserve.gov/feeds/press_monetary.xml
- ECB press releases RSS: https://www.ecb.europa.eu/rss/press.html
- RBI DBIE: https://dev.dbie.rbihub.in/docs/using-the-site
- NSE data products: https://www.nseindia.com/static/market-data/real-time-data-subscription
- BSE market data: https://marketdata.bseindia.com/
- SEBI securities market data terms: https://www.sebi.gov.in/legal/circulars/feb-2022/approach-to-securities-market-data-access-and-terms-of-usage-of-data-provided-by-data-sources-in-indian-securities-market_56420.html
- SEBI May 8, 2026 educational price-data circular (30-day lag; NISM simulation-lab exception): https://www.sebi.gov.in/legal/circulars/may-2026/norms-for-sharing-and-usage-of-price-data-for-educational-purposes_101293.html
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

# FinPilot AI — Requirements and Feature Audit

Audit date: 31 October 2026  
Deployment model: GitHub Pages + GitHub Actions, free-first  
No local installation is required to use the public website.

## Executive summary

FinPilot now has a more usable multi-asset market workspace with externally hosted TradingView charts, heatmaps and an economic calendar. Public macro/news snapshots refresh on an hourly GitHub Actions schedule (subject to GitHub scheduling delays). Personal-finance calculators, browser-local portfolio/research tools, learning guidance and career-resource links remain available.

This is **not** a complete institutional financial terminal. The most important outstanding requirement is a direct, properly licensed, first-party quote service that covers every required exchange and instrument. TradingView embeds display current market information where their exchange coverage permits, but quote speed can be real-time, delayed or end-of-day (market-dependent) depending on market and entitlement. FinPilot does not receive those quotes as structured data.

## Product-quality release pass — 31 October 2026

The frontend received a focused usability and accessibility pass:
- Consolidated the effective interface typography on Inter/system fallbacks and added a small set of shared surface, border, text and accent tokens.
- Added restrained hover feedback and short page/panel entrance transitions; all nonessential motion is disabled for users who request reduced motion.
- Added visible keyboard focus treatment and a skip-to-content link.
- Added navigation landmark labels, active-page semantics, a screen-reader heading for non-overview workspaces, and a mobile navigation backdrop that closes on click or Escape.
- Tightened narrow-screen layout behaviour down to 320–360px widths and improved long-link wrapping and touch target sizing.
- Added page-specific browser titles, search/social sharing metadata and a consistent Inter font stack across headings and controls.
- Made the application crash fallback announce itself to assistive technology, with a labelled error heading and reload action.
- Preserved the existing external market-widget disclosure and did not add a fake quote feed.

This is a source-level implementation pass. Automated CI/build and real-device/browser checks must pass before calling the release fully verified. Embedded TradingView content remains third-party and can fail independently of the FinPilot app.

## Requirement matrix

| Requirement discussed | Status | Delivered / remaining |
|---|---|---|
| GitHub-only hosting and deployment | Complete | GitHub Pages and GitHub Actions; no Render or local server required for the public site. |
| No Ollama or PC installation | Complete | Browser-based site and rules-based learning assistant. |
| India-first and global dashboard | Complete, limited depth | India and global sections, six-country World Bank macro series and global news discovery. |
| Current stock charts | Partial | TradingView embedded chart with editable symbol/timeframe and common NSE/BSE/US/index/commodity/crypto presets. |
| All Indian and global stocks, live prices | Not complete | External screener links and heatmap are available; comprehensive first-party all-symbol live quotes require provider/exchange entitlements and are not included. |
| Live market movers and stock screening | Partial | TradingView screener links and heatmap; no FinPilot-native searchable, sortable all-exchange quote database. |
| Crypto market view | Partial | TradingView crypto heatmap and chart symbol; not a full exchange-aggregated order book or trading service. |
| Forex, commodities, gold and rates | Partial | Gold chart preset and market research links; no complete structured live FX/commodity/rates data service. |
| Global economic calendar | Available via embed | TradingView calendar widget; provider coverage and timestamps are external. |
| India macro and global economic data | Partial | World Bank annual observations for six countries; RBI DBIE search adapter exists in optional backend but is not connected to public Pages UI. |
| Official news and regulator updates | Available | RBI, SEBI, NSE, BSE, PIB, Federal Reserve and ECB RSS plus GDELT discovery. Feed availability varies. |
| Verified news and event impact analysis | Not complete | Current GDELT is discovery only. Cross-source clustering, claim-level corroboration and scored impact analysis remain future work. |
| IPO tracking | Partial | Official-source headline watchlist and research worksheet; not a complete dated IPO calendar or automated DRHP/RHP financial comparison. |
| Mutual funds, ETFs, bonds, T-bills, deposits, REITs/InvITs, property and international assets | Partial | Education and manual research framework exist; complete instrument databases, comparable live yields/fees and jurisdiction checks are not connected. |
| Cash flow and emergency fund planning | Available | Local calculators with assumptions and caveats. |
| SIP and goal planning | Available | Illustrative SIP calculator and inflation-aware goal planner with a 0% return baseline. |
| Debt planning | Available | Fixed-rate debt payoff estimate and non-amortising payment warning. |
| Portfolio tracker and risk checks | Partial | Manual local asset tracker, category allocation, concentration flags and JSON backup/restore. Not a broker-linked or cloud-synced portfolio. |
| Generative AI financial analyst | Not complete | Current mentor is rules-based educational guidance, not a connected LLM. A hosted model requires an approved provider, budget, server-side secrets, privacy and safety controls. |
| Career and income research | Partial | Official Goa/India recruitment and apprenticeship portals plus role-family skill guidance; no live verified job API or automatic eligibility engine. |
| Personalized secure account | Not complete | No login, private cloud database or cross-device sync. Browser-local data is not encrypted by FinPilot. |
| Trading, broker connection and automation | Intentionally excluded | No broker credentials, order execution, leverage, derivatives or unattended trading. |

## Market data: what “live” means here

The Markets workspace uses TradingView's official embeddable widgets:
- Advanced chart with symbol and timeframe selection.
- Global stock heatmap.
- Crypto heatmap.
- Economic calendar.
- Links to India/US stock, ETF and crypto screeners.

The widgets obtain data from TradingView and render independently in the browser. TradingView documents that widget data levels depend on the selected exchange; a paid TradingView account does not automatically upgrade embedded website data to real-time. Some exchange real-time feeds require a separate exchange entitlement. Therefore:
- Do not describe every widget quote as real-time.
- Check the exchange's data-status/entitlement information in the widget.
- Do not scrape NSE/BSE or undocumented endpoints to fill gaps.
- Do not treat the widget as a FinPilot quote API.
- A future first-party quote service must provide instrument, venue, value, currency, source timestamp, retrieval timestamp, freshness class, entitlement and attribution.

## Refresh and freshness

- GitHub Actions is scheduled to refresh public RSS/news and macro snapshots approximately hourly.
- GitHub may delay or skip scheduled runs; this is not a guaranteed real-time feed.
- World Bank macro observations are annual and may be revised. A recent retrieval timestamp does not make the underlying annual statistic current to the minute.
- Official RSS links point to primary documents; check their publication dates.
- GDELT is a discovery index, not fact verification.
- On upstream failures, cached observations must be labelled stale rather than silently presented as fresh.

## Privacy and safety

- Portfolio holdings, research notes and assistant chat are browser-local where implemented; they are not encrypted or synchronised by FinPilot.
- Never enter passwords, broker credentials, bank account numbers, card data or confidential documents.
- No API keys belong in frontend code or GitHub Pages assets.
- No guaranteed returns, automatic buy/sell signals or financial-advice claims.
- Verify tax, regulatory eligibility, fees, liquidity, custody and jurisdiction-specific rules from current primary sources.

## What is required to complete the remaining ambitions

1. **First-party market data:** choose a provider whose contract covers Indian and global exchanges, web display, caching, derived analytics, historical data, user volume and attribution. For real-time NSE/BSE, confirm the relevant exchange/vendor entitlement. Free embedded widgets are not a substitute for this licence.
2. **Secure backend:** deploy a server-side API and database with authentication, access controls, encryption, audit logs, backups, rate limits and monitoring. GitHub Pages alone cannot safely hold private records or provider secrets.
3. **AI research assistant:** select a hosted inference provider only after cost and privacy approval; keep secrets server-side and ground answers in dated source records.
4. **Verified event intelligence:** build event clustering, primary-source extraction, independent corroboration, claim-level citations, uncertainty and a forecast scorecard.
5. **Structured product databases:** connect official/authorised sources for IPOs, mutual funds, ETFs, bonds, deposits, REITs/InvITs, commodities and international access.
6. **Career intelligence:** connect verified recruitment sources with closing dates, age/category/qualification/location criteria and source links; do not infer eligibility from incomplete notices.

These remaining items cannot honestly be marked complete without external providers, permissions, deployment infrastructure or user-approved costs. The current release remains usable as a free-first research and education workspace.

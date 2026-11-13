# FinPilot AI — Final Release Checklist

**Review date:** 13 November 2026  
**Release type:** Free-first public research, education and financial-planning workspace  
**Repository:** https://github.com/ashishnaikbackup/FinPilot-AI  
**Website:** https://ashishnaikbackup.github.io/FinPilot-AI/

## Release decision

The current GitHub Pages release includes public-source financial intelligence, external market visualisations, educational planning tools, browser-local research and portfolio notes, career-resource links, and feed-gated paper-trading simulations.

It is **not** a live institutional terminal, a generative-AI adviser, a broker-connected portfolio, or a real-order trading platform. Full India/global market coverage, full F&O, private account storage and secure AI inference remain deferred because they require licensed data, secure infrastructure, privacy/legal review and/or an approved budget. Do not represent them as delivered.

## Delivered and verified scope

- GitHub-native cash-equity/ETF paper bot with next-session fills, risk controls, Git-backed state, daily/weekly/monthly performance history and report.
- Separate limited Indian index F&O paper simulator for one-lot defined-risk CALL/PUT debit verticals on NIFTY/BANKNIFTY/FINNIFTY, using provider contract metadata and later-snapshot bid/ask fills. It is not a full F&O engine.
- Upstox option-chain/contract metadata and Alpha Vantage global EOD adapters are implemented but remain credential- and public-display-rights-gated; the engines wait without permitted data.

- React + TypeScript + Vite responsive web application.
- Public macro/news snapshots, official-source feeds, retrieval timestamps, source links, provider health and stale-data handling.
- TradingView chart, stock/crypto heatmaps and economic calendar embeds, with external-provider and market-data caveats.
- Cash-flow, emergency-reserve, SIP illustration, inflation-aware goal and debt-payoff calculators.
- Rules-based educational mentor and beginner learning resources.
- Browser-local asset tracker, allocation/concentration checks, research worksheet and JSON backup/restore.
- Manual-price paper portfolio simulator with editable user-entered marks, fee-aware illustrative P/L, local storage and JSON export.
- Heuristic news-event grouping with publisher-domain diversity, official-source counts and topic-channel prompts; not verified event attribution or impact analysis.
- Official career and recruitment resource directory.
- GitHub Actions CI, public-data validation, scheduled refresh and GitHub Pages deployment.
- Accessibility, responsive layout, reduced-motion support, keyboard focus, page metadata and crash fallback improvements.

The 31 October 2026 project review recorded successful frontend/backend/public-data CI checks and a successful Pages build/deployment for the then-current release. The later 31 October paper-portfolio and news-grouping commits do not yet have a confirmed CI/build result in this handover. Scheduled GitHub jobs can be delayed; always rely on the displayed source retrieval timestamps rather than assuming hourly freshness.

## Final manual acceptance checks

- [ ] Open the public website on desktop and mobile; verify navigation and each workspace.
- [ ] Confirm macro/news source timestamps, source links, freshness labels and unavailable/stale states.
- [ ] Confirm TradingView widgets load or show their fallback; do not describe all embedded prices as real-time.
- [ ] Test calculator inputs and zero-return goal baseline.
- [ ] Test local portfolio/research save, JSON export and restore in the same browser.
- [ ] Test paper portfolio creation, manual mark updates, fee-aware P/L and JSON export; verify no order execution or live quote claim.
- [ ] Verify cash Paper Bot shows `waiting_for_market_data` until a permitted timestamped quote snapshot is supplied; then validate next-session entries, position sizing, stops, exits, fees and daily/weekly/monthly report.
- [ ] Verify F&O paper workspace stays idle without permitted option-chain, index bars and contract metadata; with a test feed, validate debit spread selection, lot-size checks, pending fills, max-loss caps, stop/target and expiry settlement.
- [ ] Test heuristic news grouping with repeated headlines, unrelated headlines and malformed/empty source metadata; confirm caveats remain visible.
- [ ] Confirm privacy warnings are visible before entering personal data.
- [ ] Confirm no API keys, passwords, broker credentials or private financial records are committed.
- [ ] Check GitHub Actions for the latest green CI and Pages deployment.

## GitHub maintenance items at handover

There are 13 open pull requests in the repository at this review:
- PR #13: CI least-privilege permissions and bounded job timeouts. Review its checks and merge only when GitHub reports it is mergeable and all required checks pass.
- PRs #1–#12: Dependabot dependency updates. Review changelogs and CI results individually; do not bulk-merge or blindly accept major toolchain changes.

The frontend currently has no committed `package-lock.json`; CI uses `npm install`. Do not create a fake lockfile. Generate and commit a real lockfile only through a normal npm dependency-resolution workflow, then switch CI to `npm ci`.

## Decisions intentionally left open

1. **Project license:** no project-wide license has been selected. Do not add a license without the owner's choice. Third-party dependencies, code and data retain their own terms.
2. **Licensed market data:** no first-party live NSE/BSE/global quote service is connected. Do not scrape exchange sites or imply TradingView embeds are a FinPilot quote API.
3. **Generative AI:** the mentor is rules-based. No local model, Ollama, paid inference API or exposed frontend secret is used.
4. **Private accounts:** no login, cloud sync or encrypted personal-finance vault exists. Browser-local data is not a secure vault.
5. **Advice and execution:** no personalized regulated investment advice, broker credentials or real orders. Only limited cash-equity/ETF and defined-risk Indian index-options paper simulations exist; full F&O, leverage and global derivatives are not implemented.
6. **Research depth:** annual macro data, headline feeds and GDELT discovery do not constitute real-time market intelligence or claim-level news verification.
7. **Career feeds:** official portal links are provided; this is not a live vacancy feed or automated eligibility determination.

## Closeout rule

Keep the deployed release stable. Only reopen development for a reproducible defect, a security issue, a source/data integrity problem, or a clearly scoped improvement that can be delivered without violating the free-first, no-fabricated-data and privacy boundaries. Larger ambitions belong in a separately approved future phase.

## Related documentation

- [Feature audit](FEATURE_AUDIT.md)
- [Project handover](PROJECT_HANDOVER.md)
- [Architecture](ARCHITECTURE.md)
- [Data sources and freshness](DATA_SOURCES.md)
- [Deployment guide](DEPLOYMENT.md)
- [Roadmap](ROADMAP.md)

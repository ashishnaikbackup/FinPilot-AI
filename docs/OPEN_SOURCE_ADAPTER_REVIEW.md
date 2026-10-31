# Open-source research adapter review

**Purpose:** Track candidate upstream projects for possible isolated research adapters. Listing a project does not mean its code is installed, trusted, audited or used in production.

**Review date:** 31 October 2026. Re-check each repository's current license, dependencies, security advisories, model/data terms and upstream changes before any integration.

| Project | Upstream license reported by GitHub | Best-fit role | FinPilot decision |
|---|---|---|---|
| [TradingAgents](https://github.com/TauricResearch/TradingAgents) | Apache-2.0 | Multi-agent financial research and debate workflow | Candidate for a read-only research adapter. Requires model-provider credentials, market-data provider review, prompt-injection controls and evidence citations. Never treat agent consensus as a buy signal. |
| [AI Hedge Fund](https://github.com/virattt/ai-hedge-fund) | MIT | Educational multi-agent equity analysis prototype | Candidate for isolated experimentation and report comparison. Verify current upstream architecture, provider dependencies, data rights and output reliability. |
| [Microsoft Qlib](https://github.com/microsoft/qlib) | MIT | Quantitative research, feature engineering, ML experiments and backtesting | Strong candidate for offline research only. Requires point-in-time datasets, survivorship-bias controls, realistic costs and strict train/test separation. |
| [Kronos](https://github.com/shiyu-coder/Kronos) | MIT | Financial time-series tokenisation and forecasting research | Research-only candidate. Validate the model card, training data provenance, supported instruments, inference cost and out-of-sample performance before use. A forecast is not a recommendation. |
| [Freqtrade](https://github.com/freqtrade/freqtrade) | GPL-3.0 | Crypto strategy backtesting and exchange execution framework | Do not connect to FinPilot's portfolio or any live account in the initial product. Crypto-specific; GPL obligations require legal review before code reuse or distribution. If ever evaluated, isolate in a paper-trading sandbox. |
| [Hummingbot](https://github.com/hummingbot/hummingbot) | Apache-2.0 | Crypto exchange connectors and market-making automation | Not a general stocks/funds engine. No live exchange credentials or unattended execution. Could only be studied later in a separate, isolated sandbox after custody, exchange terms and operational risks are reviewed. |
| [AI-Trader](https://github.com/HKUDS/AI-Trader) | **No license reported by GitHub at review time** | Agent-native automated trading research | Do not copy, modify, redistribute or integrate code until the authors publish a clear license and its scope is reviewed. Repository visibility alone does not grant reuse rights. |

## Non-negotiable integration boundary

1. **Read-only first:** upstream systems may return research artefacts, not orders or account actions.
2. **Provider abstraction:** no source-specific API key or proprietary schema in the frontend. Secrets belong in a secured server-side secret store.
3. **Evidence over consensus:** every material claim needs dated source documents, source links, assumptions and a counterargument. Model output is unverified until checked.
4. **No trading bridge:** do not connect Freqtrade, Hummingbot or any agent to broker/exchange credentials, order endpoints or user assets in the initial release.
5. **Backtest integrity:** use point-in-time data, include fees/slippage/taxes where applicable, avoid look-ahead and survivorship bias, preserve holdout periods, and publish limitations.
6. **License compliance:** review the exact license file and dependency licenses at the pinned commit; do not assume repository-level metadata covers datasets, model weights, APIs or third-party assets.
7. **Security:** pin dependencies, scan vulnerabilities, sandbox untrusted code, restrict network access and treat fetched documents/news as untrusted input.

## Proposed adapter sequence

- First: Qlib offline research pipeline using a legally obtained, point-in-time dataset.
- Second: TradingAgents or AI Hedge Fund as a non-executing research comparison tool, with a model-provider decision and source-grounding tests.
- Third: Kronos only after independent validation against simple baselines and a held-out dataset.
- Deferred: Freqtrade and Hummingbot; they are crypto execution-oriented and outside the initial product's scope.
- Blocked: AI-Trader until a clear upstream license is published.

**Current status:** None of these projects is integrated into the deployed FinPilot application. This document is a review queue, not a statement of endorsement or audited compatibility.

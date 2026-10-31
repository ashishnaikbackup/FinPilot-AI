# GitHub-only deployment guide (no local setup or Render required)

## 1. Enable GitHub Pages

1. Open the repository: https://github.com/ashishnaikbackup/FinPilot-AI
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open **Actions → Deploy FinPilot AI frontend** and choose **Run workflow** if it has not run automatically.
5. After a successful deployment, the public website is:
   https://ashishnaikbackup.github.io/FinPilot-AI/

## 2. How public data reaches the website

The workflow `.github/workflows/pages.yml` runs the Python script `scripts/refresh_public_data.py`, which retrieves:
- World Bank India annual GDP observations.
- GDELT global news discovery results.

It writes JSON snapshots into the frontend build output and deploys them with the static site. In addition to World Bank and GDELT, it checks RBI press-release/notification RSS and the official PIB press-release RSS. A validation step checks timestamps, schema, source URLs and the no-fabricated-quotes invariant before deployment. A scheduled run is configured approximately every six hours. Dependabot checks npm, pip and GitHub Actions dependencies weekly and opens update pull requests; updates are not silently merged. GitHub may delay scheduled runs; always read the timestamp in the snapshot.

No server, Render account, API key or paid hosting is needed for these public snapshots. The public dashboard is static, so it cannot safely store private personal finance data or server-side secrets.

## 3. No local installation required

The public dashboard and browser-based learning assistant run from GitHub Pages. Visitors do not need Python, Node.js, Ollama, an API key or a local server. The assistant uses transparent built-in topic rules; it is not a generative LLM. The optional FastAPI code is retained for developer work only and is not called by the deployed site.

A future generative AI feature would need an active hosted inference provider, a secure server-side secret, privacy review and an approved budget. Do not put provider keys in frontend code or GitHub Pages assets.

## 4. Check a deployment

- In GitHub **Actions**, confirm both the public-data refresh and frontend build/deploy steps succeeded.
- Open the website and check the data-integrity strip for the snapshot load time and source status.
- If a source fails, its dataset should be empty and show as unavailable; the site must not fill in invented values.
- If Pages is not enabled, the workflow may build but GitHub will not publish the website until Pages is configured. A frontend push also triggers the CI checks and the Pages deployment workflow.

## 5. Production boundaries

- GitHub Pages is a public static host. Do not put private records, account balances, passwords, broker tokens or API secrets in the frontend or repository.
- Market quotes are intentionally not connected. A licensed provider must explicitly permit public website display and redistribution before quotes can be enabled.
- GDELT is a discovery index, not a fact-checker.
- Add authentication, privacy controls, secure storage, monitoring and a server-side API before introducing personal financial records or private AI features.

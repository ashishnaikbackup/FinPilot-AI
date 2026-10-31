# Free deployment guide (no Render required)

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

It writes JSON snapshots into the frontend build output and deploys them with the static site. A scheduled run is configured approximately every six hours. GitHub may delay scheduled runs; always read the timestamp in the snapshot.

No server, Render account, API key or paid hosting is needed for these public snapshots. The public dashboard is static, so it cannot safely store private personal finance data or server-side secrets.

## 3. Optional backend

The FastAPI backend is kept for local development and future secured features. It is not required to publish or use the current public dashboard. If a later feature needs authentication, private data storage, user-specific AI workflows or server-side API credentials, we can add a serverless backend (for example, Cloudflare Workers) without using Render. That is a later deployment choice, not a current dependency.

## 4. Check a deployment

- In GitHub **Actions**, confirm both the public-data refresh and frontend build/deploy steps succeeded.
- Open the website and check the data-integrity strip for the snapshot load time and source status.
- If a source fails, its dataset should be empty and show as unavailable; the site must not fill in invented values.
- If Pages is not enabled, the workflow may build but GitHub will not publish the website until Pages is configured.

## 5. Production boundaries

- GitHub Pages is a public static host. Do not put private records, account balances, passwords, broker tokens or API secrets in the frontend or repository.
- Market quotes are intentionally not connected. A licensed provider must explicitly permit public website display and redistribution before quotes can be enabled.
- GDELT is a discovery index, not a fact-checker.
- Add authentication, privacy controls, secure storage, monitoring and a server-side API before introducing personal financial records or private AI features.

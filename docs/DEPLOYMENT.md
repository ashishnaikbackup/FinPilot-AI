# Deployment guide

## Frontend — GitHub Pages

1. Open repository Settings → Pages.
2. Set the build and deployment source to GitHub Actions if it is not already selected.
3. The workflow in .github/workflows/pages.yml builds the frontend from frontend/ and deploys it to:
   https://ashishnaikbackup.github.io/FinPilot-AI/
4. Once the API is deployed, open Settings → Secrets and variables → Actions → Variables and add:
   - Name: VITE_API_BASE_URL
   - Value: the public HTTPS origin of the deployed API, with no trailing slash.
5. Re-run the Pages workflow (Actions → Deploy FinPilot AI frontend → Run workflow) so the frontend is built with the API origin.

Without VITE_API_BASE_URL the site uses localhost for local development and will show the backend-offline state on the public website. That is deliberate; it will not invent data.

## Backend — Render Blueprint

1. Sign in to Render and choose New → Blueprint.
2. Select this GitHub repository and use its render.yaml.
3. Confirm the free web-service plan and create the service.
4. In the service environment settings, set SEC_USER_AGENT to a descriptive app name and monitored contact email, for example FinPilotAI contact@example.com.
5. Wait for deployment and test the service's /api/health and /api/data/status endpoints.
6. Copy the service's HTTPS origin into the GitHub Actions repository variable VITE_API_BASE_URL.
7. Re-run the GitHub Pages workflow.

The Render blueprint allows the GitHub Pages origin in CORS. If you use a custom domain, update FRONTEND_ORIGINS to that exact origin (scheme + hostname, no path).

## Production readiness checklist

- Confirm the API health endpoint.
- Confirm the World Bank macro endpoint and DBIE search endpoint return valid observations/catalogue results.
- Confirm GDELT is only used for discovery and that its indexed timestamp is not represented as the publisher's publication time.
- Keep SEC_USER_AGENT accurate and comply with SEC fair-access guidance.
- Do not enable market prices until the data provider contract explicitly permits display on a public website.
- Add authentication and a persistent database before storing private financial data.
- Enable HTTPS and review CORS, rate limits, logging and dependency updates.

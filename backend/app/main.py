from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .providers import (
    provider_status, search_dbie, world_bank_indicator,
    search_global_news, sec_company_submissions,
)

app = FastAPI(
    title=settings.app_name,
    description="India-first financial research, public data and education API.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"name": "FinPilot AI", "docs": "/docs", "health": "/api/health"}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "finpilot-ai-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": settings.environment,
    }


@app.get("/api/data/status")
def data_status():
    return provider_status()


@app.get("/api/data/india/dbie/search")
async def dbie_search(q: str = Query(min_length=2, max_length=100)):
    try:
        return await search_dbie(q)
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"DBIE source unavailable: {exc}") from exc


@app.get("/api/data/global/world-bank")
async def world_bank(
    country: str = Query(default="IND", min_length=2, max_length=3, pattern="^[A-Za-z]{2,3}$"),
    indicator: str = Query(default="NY.GDP.MKTP.CD", min_length=3, max_length=40),
    per_page: int = Query(default=12, ge=1, le=50),
):
    try:
        return await world_bank_indicator(country, indicator, per_page)
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"World Bank source unavailable: {exc}") from exc


@app.get("/api/news/global")
async def global_news(
    q: str = Query(default="India economy OR global markets OR central bank", min_length=3, max_length=250),
    days: int = Query(default=3, ge=1, le=7),
    limit: int = Query(default=15, ge=1, le=50),
):
    try:
        return await search_global_news(q, days, limit)
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"News discovery source unavailable: {exc}") from exc


@app.get("/api/data/us/sec/{cik}")
async def sec_filings(cik: str):
    try:
        return await sec_company_submissions(cik)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"SEC source unavailable: {exc}") from exc

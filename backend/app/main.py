from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FinPilot AI API",
    description="India-first financial research and education API.",
    version="0.1.0",
)

# Restrict this list to your real deployed frontend origins before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "finpilot-ai-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "foundation",
    }


@app.get("/")
def root():
    return {"name": "FinPilot AI", "docs": "/docs", "health": "/api/health"}

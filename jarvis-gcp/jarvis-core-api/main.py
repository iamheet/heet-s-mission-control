"""
jarvis-core-api — FastAPI entrypoint.

Run:  uvicorn main:app --host 0.0.0.0 --port 8080

On startup it launches the log tailer and the watchdog background loop; on
shutdown it stops them cleanly. All REST/WS endpoints require a JWT (obtain one
from POST /api/auth/login). CORS is restricted to the origins in config.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import auth
from clients.log_tailer import log_tailer
from config import settings
from routers import actions, alerts, logs, metrics, pods
from watchdog.engine import engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("jarvis")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── startup ──
    log.info("Starting jarvis-core-api…")
    await log_tailer.start()
    await engine.start()
    log.info("jarvis-core-api ready. Watchdog=%s, LogSource=%s",
             settings.watchdog_enabled, settings.log_source)
    yield
    # ── shutdown ──
    log.info("Shutting down…")
    await engine.stop()
    await log_tailer.stop()


app = FastAPI(
    title="jarvis-core-api",
    description="Real-time monitoring backend + watchdog agent for the JARVIS dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# routers
app.include_router(auth.router)
app.include_router(metrics.router)
app.include_router(pods.router)
app.include_router(logs.router)
app.include_router(alerts.router)
app.include_router(actions.router)


@app.get("/health", tags=["system"])
async def health():
    """Unauthenticated liveness probe (safe: exposes no data)."""
    return {
        "status": "ok",
        "watchdog": settings.watchdog_enabled,
        "last_cycle": engine.last_cycle,
        "log_source": settings.log_source,
    }

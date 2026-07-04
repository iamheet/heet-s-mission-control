"""GET /api/metrics — Prometheus proxy shaped for the dashboard gauges."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from auth import get_current_user
from clients.prometheus_client import prometheus

router = APIRouter(prefix="/api", tags=["metrics"])


@router.get("/metrics")
async def get_metrics(_: str = Depends(get_current_user)):
    snap = await prometheus.snapshot()
    return {
        "snapshot": snap.model_dump(),
        "gauges": [g.model_dump() for g in snap.gauges()],
    }

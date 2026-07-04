"""GET /api/pods — K8s pod health + aggregate counts for Active Processes."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from auth import get_current_user
from clients.k8s_client import k8s

router = APIRouter(prefix="/api", tags=["pods"])


@router.get("/pods")
async def get_pods(_: str = Depends(get_current_user)):
    resp = await k8s.pods_response()
    return resp.model_dump()

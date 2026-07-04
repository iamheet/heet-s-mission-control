"""
POST /api/actions/{action} — the ONLY way to trigger remediation.

Hard rules:
  • Only names in config.WHITELISTED_ACTIONS are accepted; anything else → 404.
  • Each maps to a specific, pre-defined function. There is NO generic exec /
    shell path — arbitrary commands are never accepted or run, even when
    authenticated.
  • These run only when *you* click them in the dashboard; the watchdog never
    calls them.
"""
from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel

from auth import get_current_user
from clients.k8s_client import k8s
from clients.prometheus_client import prometheus
from config import WHITELISTED_ACTIONS, settings

log = logging.getLogger("jarvis.actions")
router = APIRouter(prefix="/api/actions", tags=["actions"])


class ActionParams(BaseModel):
    # Only used by restart_pod. Other actions ignore these.
    pod: Optional[str] = None
    namespace: Optional[str] = "default"


# ── individual action implementations ────────────────────────────────────────
async def _restart_pod(params: ActionParams) -> dict:
    if not params.pod:
        raise HTTPException(status_code=400, detail="restart_pod requires 'pod' name")

    def _delete() -> str:
        if not k8s._ensure_loaded():
            raise RuntimeError("Kubernetes cluster unavailable")
        # Deleting the pod lets its Deployment/ReplicaSet recreate it — this is
        # the standard safe "restart". We never force-delete or touch controllers.
        k8s._core.delete_namespaced_pod(name=params.pod, namespace=params.namespace)
        return f"Pod {params.namespace}/{params.pod} deleted; controller will recreate it."

    try:
        msg = await asyncio.to_thread(_delete)
        return {"status": "ok", "detail": msg}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"restart_pod failed: {e}")


async def _clear_cache(_: ActionParams) -> dict:
    # Only ever touches a sandboxed cache dir. Never accepts a path from the client.
    cache_dir = os.path.abspath("./cache")
    removed = 0
    if os.path.isdir(cache_dir):
        for entry in os.scandir(cache_dir):
            try:
                if entry.is_file():
                    os.remove(entry.path)
                    removed += 1
            except OSError:
                pass
    return {"status": "ok", "detail": f"Cache flushed ({removed} files removed).",
            "dir": cache_dir}


async def _scan_system(_: ActionParams) -> dict:
    # Read-only: collect a health snapshot and summarise it.
    metrics = await prometheus.snapshot()
    pods = await k8s.pods_response()
    unhealthy = [p.name for p in pods.pods if not (p.phase == "Running" and p.ready)]
    return {
        "status": "ok",
        "detail": "System scan complete.",
        "report": {
            "cpu_pct": round(metrics.cpu_pct, 1),
            "mem_pct": round(metrics.mem_pct, 1),
            "disk_pct": round(metrics.disk_pct, 1),
            "pods_total": len(pods.pods),
            "pods_healthy": pods.aggregates.get("k8s_healthy", 0),
            "pods_unhealthy": unhealthy,
            "metrics_source": metrics.source,
        },
    }


async def _backup_now(_: ActionParams) -> dict:
    # Placeholder: enqueue a backup. Wire this to a K8s CronJob trigger or your
    # backup script (as a Job) rather than running a shell command here.
    log.info("backup_now requested")
    return {"status": "queued",
            "detail": "Backup job requested. Wire this to your backup CronJob/Job."}


_HANDLERS = {
    "restart_pod": _restart_pod,
    "clear_cache": _clear_cache,
    "scan_system": _scan_system,
    "backup_now": _backup_now,
}


@router.get("")
async def list_actions(_: str = Depends(get_current_user)):
    """List the whitelisted actions (for the dashboard's Quick Actions grid)."""
    return {"actions": WHITELISTED_ACTIONS}


@router.post("/{action}")
async def run_action(
    params: ActionParams,
    action: str = Path(..., description="One of the whitelisted action names"),
    _: str = Depends(get_current_user),
):
    if action not in WHITELISTED_ACTIONS:
        # Do not reveal internals; just reject anything not on the allow-list.
        raise HTTPException(status_code=404, detail="Unknown action")
    handler = _HANDLERS.get(action)
    if handler is None:  # allow-list/handler drift guard
        raise HTTPException(status_code=501, detail="Action not implemented")
    log.info("Executing whitelisted action: %s", action)
    return await handler(params)

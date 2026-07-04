"""
Alerts API.

  GET  /api/alerts             — current active alerts + recent history
  POST /api/alerts/{id}/ack    — acknowledge an alert
  WS   /ws/alerts              — live push of watchdog findings & resolutions
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect

from auth import authenticate_ws, get_current_user
from schemas import alerts_ws
from watchdog.engine import engine

log = logging.getLogger("jarvis.ws.alerts")
router = APIRouter()


@router.get("/api/alerts", tags=["alerts"])
async def get_alerts(_: str = Depends(get_current_user)):
    return {
        "active": [a.model_dump() for a in engine.store.get_active()],
        "recent": engine.store.recent(50),
        "last_cycle": engine.last_cycle,
    }


@router.post("/api/alerts/{alert_id}/ack", tags=["alerts"])
async def acknowledge_alert(alert_id: str, _: str = Depends(get_current_user)):
    alert = engine.store.acknowledge(alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found or already resolved")
    return alert.model_dump()


@router.websocket("/ws/alerts")
async def ws_alerts(ws: WebSocket, token: str = Query(default="")):
    if authenticate_ws(token) is None:
        await ws.close(code=4401)
        return

    await alerts_ws.connect(ws)
    try:
        # send current active alerts on connect
        for alert in engine.store.get_active():
            await ws.send_json({"type": "alert", "alert": alert.model_dump()})
        # keep the socket open; watchdog pushes via alerts_ws.broadcast().
        # we read (and ignore) to detect disconnects promptly.
        while True:
            try:
                await asyncio.wait_for(ws.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                await ws.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.debug("ws/alerts closed: %s", e)
    finally:
        await alerts_ws.disconnect(ws)

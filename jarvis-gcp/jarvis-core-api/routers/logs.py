"""WS /ws/logs — live, level-classified, secret-scrubbed log stream."""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from auth import authenticate_ws
from clients.log_tailer import log_tailer

log = logging.getLogger("jarvis.ws.logs")
router = APIRouter()


@router.websocket("/ws/logs")
async def ws_logs(ws: WebSocket, token: str = Query(default="")):
    # authenticate BEFORE accepting the socket
    if authenticate_ws(token) is None:
        await ws.close(code=4401)  # unauthorized
        return

    await ws.accept()
    queue = log_tailer.subscribe()
    try:
        # 1) replay recent history so the panel isn't empty on connect
        for msg in log_tailer.recent(50):
            await ws.send_json(msg.model_dump(mode="json"))
        # 2) stream new lines
        while True:
            msg = await queue.get()
            await ws.send_json(msg.model_dump(mode="json"))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.debug("ws/logs closed: %s", e)
    finally:
        log_tailer.unsubscribe(queue)

"""
Shared Pydantic schemas + WebSocket connection manager.

Keeping the wire shapes here means the dashboard frontend has one place to look
for the JSON contract, and the mock-data seeds on the frontend already match
these field names.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Metrics ───────────────────────────────────────────────────────────────
class GaugeMetric(BaseModel):
    id: str
    label: str
    value: float          # percentage 0..100
    caption: str          # e.g. "13.2 / 32 GB"


class MetricsSnapshot(BaseModel):
    cpu_pct: float = 0
    cpu_cores: int = 0
    mem_pct: float = 0
    mem_used_gb: float = 0
    mem_total_gb: float = 0
    disk_pct: float = 0
    disk_used_gb: float = 0
    disk_total_gb: float = 0
    net_up_mbps: float = 0
    net_down_mbps: float = 0
    gpu_pct: Optional[float] = None
    gpu_name: Optional[str] = None
    ts: str = ""
    source: str = "prometheus"  # or "unavailable"

    def gauges(self) -> List[GaugeMetric]:
        """Shape metrics into the five dashboard gauge widgets."""
        g = [
            GaugeMetric(id="cpu", label="CPU", value=round(self.cpu_pct, 1),
                        caption=f"{self.cpu_cores} Core"),
            GaugeMetric(id="mem", label="MEMORY", value=round(self.mem_pct, 1),
                        caption=f"{self.mem_used_gb:.1f} / {self.mem_total_gb:.0f} GB"),
            GaugeMetric(id="net", label="NETWORK", value=round(min(self.net_down_mbps, 100), 1),
                        caption=f"↑ {self.net_up_mbps:.1f} MB/s   ↓ {self.net_down_mbps:.1f} MB/s"),
            GaugeMetric(id="storage", label="STORAGE", value=round(self.disk_pct, 1),
                        caption=f"{self.disk_used_gb:.0f} / {self.disk_total_gb:.0f} GB"),
        ]
        if self.gpu_pct is not None:
            g.insert(3, GaugeMetric(id="gpu", label="GPU", value=round(self.gpu_pct, 1),
                                    caption=self.gpu_name or "GPU"))
        return g


# ── Pods ──────────────────────────────────────────────────────────────────
class ContainerStatus(BaseModel):
    name: str
    ready: bool
    restart_count: int
    state: str                      # running | waiting | terminated
    reason: Optional[str] = None    # e.g. CrashLoopBackOff, OOMKilled


class PodInfo(BaseModel):
    name: str
    namespace: str
    phase: str                      # Running | Pending | Failed | Succeeded
    ready: bool
    restart_count: int
    containers: List[ContainerStatus] = []
    age_seconds: int = 0


class PodsResponse(BaseModel):
    pods: List[PodInfo]
    aggregates: Dict[str, int]      # docker_running, k8s_healthy, services_active, jobs_running
    source: str = "k8s"
    ts: str = ""


# ── Logs ──────────────────────────────────────────────────────────────────
class LogLevel(str, Enum):
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    ERROR = "ERROR"


class LogMessage(BaseModel):
    timestamp: str
    level: LogLevel
    source: str
    message: str


# ── Alerts ──────────────────────────────────────────────────────────────────
class Severity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class Finding(BaseModel):
    """Raw output of a detection rule."""
    rule: str
    severity: Severity
    target: str
    detail: Dict[str, Any] = {}
    first_seen: str = ""

    def key(self) -> str:
        """Stable identity for dedup: rule + target."""
        return f"{self.rule}::{self.target}"


class Alert(BaseModel):
    """A finding enriched with persona message + lifecycle state."""
    id: str
    rule: str
    severity: Severity
    target: str
    detail: Dict[str, Any] = {}
    message: str            # human, JARVIS-voice
    status: AlertStatus = AlertStatus.NEW
    first_seen: str
    last_seen: str
    notified_at: Optional[str] = None
    resolved_at: Optional[str] = None


# ── WebSocket manager ────────────────────────────────────────────────────────
class WSManager:
    """Tracks connected WebSocket clients for one channel and broadcasts JSON."""

    def __init__(self) -> None:
        self._clients: List[Any] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws) -> None:
        await ws.accept()
        async with self._lock:
            self._clients.append(ws)

    async def disconnect(self, ws) -> None:
        async with self._lock:
            if ws in self._clients:
                self._clients.remove(ws)

    async def broadcast(self, payload: dict) -> None:
        """Send to all clients; drop any that error out."""
        async with self._lock:
            targets = list(self._clients)
        dead = []
        for ws in targets:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    if ws in self._clients:
                        self._clients.remove(ws)

    @property
    def count(self) -> int:
        return len(self._clients)


# Shared broadcast channels (imported by routers + watchdog notifier)
logs_ws = WSManager()
alerts_ws = WSManager()

"""
Watchdog engine — the "JARVIS is watching" background loop.

Every WATCHDOG_INTERVAL_SECONDS it:
  1. Pulls a fresh metrics + pods + recent-logs snapshot.
  2. Runs every registered detection rule (plus the async service/TLS checks).
  3. Diffs findings against the active-alert store:
       • brand-new finding      → create alert, render persona message, notify.
       • still-active finding    → update last_seen; re-notify only after cooldown
                                    or on severity escalation.
       • previously-active, now
         absent                  → mark resolved, emit a "Health Check Passed".
  4. Persists alert lifecycle to SQLite so state survives restarts.

The engine NEVER remediates automatically — it only observes and reports.
"""
from __future__ import annotations

import asyncio
import json
import logging
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Optional

from config import settings
from clients.k8s_client import k8s
from clients.log_tailer import log_tailer
from clients.prometheus_client import prometheus
from schemas import Alert, AlertStatus, Finding, Severity, utcnow_iso
from watchdog import notifier, persona, rules

log = logging.getLogger("jarvis.watchdog")

_SEVERITY_RANK = {Severity.INFO: 0, Severity.WARNING: 1, Severity.CRITICAL: 2}


def _now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


class AlertStore:
    """Active-alert bookkeeping + SQLite persistence for lifecycle/dedup."""

    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        self.active: Dict[str, Alert] = {}   # key -> Alert (new/acknowledged)
        self._counter = 0
        self._init_db()
        self._load_active()

    def _conn(self) -> sqlite3.Connection:
        c = sqlite3.connect(self.db_path)
        c.row_factory = sqlite3.Row
        return c

    def _init_db(self) -> None:
        with self._conn() as c:
            c.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id TEXT PRIMARY KEY,
                    alert_key TEXT,
                    rule TEXT, severity TEXT, target TEXT,
                    detail TEXT, message TEXT, status TEXT,
                    first_seen TEXT, last_seen TEXT,
                    notified_at TEXT, resolved_at TEXT
                )
            """)

    def _load_active(self) -> None:
        with self._conn() as c:
            rows = c.execute(
                "SELECT * FROM alerts WHERE status != 'resolved'"
            ).fetchall()
        for r in rows:
            alert = Alert(
                id=r["id"], rule=r["rule"], severity=Severity(r["severity"]),
                target=r["target"], detail=json.loads(r["detail"] or "{}"),
                message=r["message"], status=AlertStatus(r["status"]),
                first_seen=r["first_seen"], last_seen=r["last_seen"],
                notified_at=r["notified_at"], resolved_at=r["resolved_at"],
            )
            self.active[f"{alert.rule}::{alert.target}"] = alert

    def _persist(self, key: str, alert: Alert) -> None:
        with self._conn() as c:
            c.execute("""
                INSERT INTO alerts (id, alert_key, rule, severity, target, detail,
                    message, status, first_seen, last_seen, notified_at, resolved_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                ON CONFLICT(id) DO UPDATE SET
                    severity=excluded.severity, detail=excluded.detail,
                    message=excluded.message, status=excluded.status,
                    last_seen=excluded.last_seen, notified_at=excluded.notified_at,
                    resolved_at=excluded.resolved_at
            """, (alert.id, key, alert.rule, alert.severity.value, alert.target,
                  json.dumps(alert.detail), alert.message, alert.status.value,
                  alert.first_seen, alert.last_seen, alert.notified_at, alert.resolved_at))

    def next_id(self) -> str:
        self._counter += 1
        return f"al_{int(_now_ts())}_{self._counter}"

    def get_active(self) -> List[Alert]:
        return list(self.active.values())

    def acknowledge(self, alert_id: str) -> Optional[Alert]:
        for alert in self.active.values():
            if alert.id == alert_id:
                alert.status = AlertStatus.ACKNOWLEDGED
                self._persist(f"{alert.rule}::{alert.target}", alert)
                return alert
        return None

    def recent(self, limit: int = 50) -> List[dict]:
        with self._conn() as c:
            rows = c.execute(
                "SELECT * FROM alerts ORDER BY last_seen DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(r) for r in rows]


class WatchdogEngine:
    def __init__(self) -> None:
        self.store = AlertStore(settings.alert_db_path)
        self.history = rules.RollingHistory()
        self._task: Optional[asyncio.Task] = None
        self._running = False
        self.last_cycle: Optional[str] = None

    async def start(self) -> None:
        if not settings.watchdog_enabled:
            log.info("Watchdog disabled via config")
            return
        if self._task is None:
            self._running = True
            self._task = asyncio.create_task(self._loop())
            log.info("Watchdog started (every %ss)", settings.watchdog_interval_seconds)

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _loop(self) -> None:
        # small initial delay so clients + tailer are up first
        await asyncio.sleep(3)
        while self._running:
            try:
                await self._cycle()
            except asyncio.CancelledError:
                raise
            except Exception as e:
                log.error("Watchdog cycle error: %s", e, exc_info=True)
            await asyncio.sleep(settings.watchdog_interval_seconds)

    async def _cycle(self) -> None:
        metrics = await prometheus.snapshot()
        pods = await k8s.list_pods() or []
        recent_logs = log_tailer.recent(150)

        snap = rules.Snapshot(metrics, pods, recent_logs, self.history)

        # sync rules
        findings: List[Finding] = []
        for fn in rules.all_rules():
            try:
                findings.extend(fn(snap))
            except Exception as e:
                log.error("rule %s failed: %s", getattr(fn, "__name__", fn), e)

        # async network rules
        try:
            findings.extend(await rules.service_down(self.history))
            findings.extend(await rules.tls_expiring(self.history))
        except Exception as e:
            log.error("async rule failed: %s", e)

        await self._reconcile(findings)
        self.last_cycle = utcnow_iso()

    async def _reconcile(self, findings: List[Finding]) -> None:
        current = {f.key(): f for f in findings}
        first_in_batch = True

        # 1) new + still-active findings
        for key, f in current.items():
            existing = self.store.active.get(key)
            if existing is None:
                alert = Alert(
                    id=self.store.next_id(), rule=f.rule, severity=f.severity,
                    target=f.target, detail=f.detail,
                    message=persona.render(f, use_name=first_in_batch),
                    status=AlertStatus.NEW,
                    first_seen=f.first_seen or utcnow_iso(), last_seen=utcnow_iso(),
                    notified_at=utcnow_iso(),
                )
                self.store.active[key] = alert
                self.store._persist(key, alert)
                await notifier.notify(alert, f)
                first_in_batch = False
            else:
                escalated = _SEVERITY_RANK[f.severity] > _SEVERITY_RANK[existing.severity]
                existing.last_seen = utcnow_iso()
                existing.detail = f.detail
                cooldown_over = self._cooldown_elapsed(existing)
                if escalated or cooldown_over:
                    existing.severity = f.severity
                    existing.message = persona.render(f, use_name=first_in_batch)
                    existing.notified_at = utcnow_iso()
                    existing.status = AlertStatus.NEW
                    await notifier.notify(existing, f)
                    first_in_batch = False
                self.store._persist(key, existing)

        # 2) resolved: was active, no longer present
        for key in list(self.store.active.keys()):
            if key not in current:
                alert = self.store.active.pop(key)
                alert.status = AlertStatus.RESOLVED
                alert.resolved_at = utcnow_iso()
                alert.last_seen = utcnow_iso()
                # rebuild a minimal finding for the resolved-message renderer
                f = Finding(rule=alert.rule, severity=alert.severity,
                            target=alert.target, detail=alert.detail)
                alert.message = persona.render_resolved(f)
                self.store._persist(key, alert)
                await notifier.notify_resolved(alert)

    def _cooldown_elapsed(self, alert: Alert) -> bool:
        if not alert.notified_at:
            return True
        try:
            last = datetime.fromisoformat(alert.notified_at)
        except ValueError:
            return True
        elapsed = (datetime.now(timezone.utc) - last).total_seconds()
        return elapsed >= settings.alert_cooldown_minutes * 60


engine = WatchdogEngine()

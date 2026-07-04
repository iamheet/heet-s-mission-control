"""
Detection rules.

A rule is a callable that receives the current `Snapshot` (metrics + pods +
recent logs + rolling history) and returns a list of Findings. Register new
rules with the @rule decorator — the engine runs every registered rule each
cycle, so adding monitoring is a one-function change.

Rules are deliberately stateless about *notification* (that's the engine's job);
they only describe what is wrong right now. For rules that need history (e.g.
"CPU > 90% for 2 minutes", "restarts increasing"), the engine passes a
RollingHistory the rule can consult.
"""
from __future__ import annotations

import re
import socket
import ssl
from datetime import datetime, timezone
from typing import Callable, List

from config import settings
from schemas import Finding, MetricsSnapshot, PodInfo, Severity, utcnow_iso

# ── rule registry ──
RuleFn = Callable[["Snapshot"], List[Finding]]
_REGISTRY: List[RuleFn] = []


def rule(fn: RuleFn) -> RuleFn:
    _REGISTRY.append(fn)
    return fn


def all_rules() -> List[RuleFn]:
    return list(_REGISTRY)


class Snapshot:
    """Everything the rules need for one evaluation cycle."""

    def __init__(self, metrics: MetricsSnapshot, pods: List[PodInfo],
                 recent_logs, history: "RollingHistory") -> None:
        self.metrics = metrics
        self.pods = pods
        self.recent_logs = recent_logs  # list[LogMessage]
        self.history = history


class RollingHistory:
    """Small time-series memory for sustained-condition and rate rules."""

    def __init__(self) -> None:
        self.cpu: list[tuple[float, float]] = []          # (ts, pct)
        self.net_egress: list[tuple[float, float]] = []   # (ts, mbps)
        self.pod_restarts: dict[str, list[tuple[float, int]]] = {}
        self.pod_not_ready_since: dict[str, float] = {}
        self.service_down_since: dict[str, float] = {}

    @staticmethod
    def _now() -> float:
        return datetime.now(timezone.utc).timestamp()

    def _trim(self, series: list[tuple[float, float]], window_s: float) -> None:
        cutoff = self._now() - window_s
        while series and series[0][0] < cutoff:
            series.pop(0)

    def record_cpu(self, pct: float) -> None:
        self.cpu.append((self._now(), pct))
        self._trim(self.cpu, 15 * 60)

    def cpu_sustained_above(self, threshold: float, minutes: float) -> bool:
        cutoff = self._now() - minutes * 60
        window = [p for t, p in self.cpu if t >= cutoff]
        # need enough samples to cover the window and all above threshold
        return len(window) >= 2 and all(p > threshold for p in window)

    def record_egress(self, mbps: float) -> None:
        self.net_egress.append((self._now(), mbps))
        self._trim(self.net_egress, 60 * 60)

    def egress_baseline(self) -> float:
        if len(self.net_egress) < 5:
            return 0.0
        vals = [v for _, v in self.net_egress]
        return sum(vals) / len(vals)


# ── individual rules ─────────────────────────────────────────────────────────
_now_ts = lambda: datetime.now(timezone.utc).timestamp()


@rule
def pod_crash_looping(s: Snapshot) -> List[Finding]:
    out = []
    for p in s.pods:
        crashloop = any(
            c.reason == "CrashLoopBackOff" for c in p.containers
        )
        # track restart growth
        hist = s.history.pod_restarts.setdefault(p.name, [])
        hist.append((_now_ts(), p.restart_count))
        cutoff = _now_ts() - settings.pod_restart_window_minutes * 60
        while hist and hist[0][0] < cutoff:
            hist.pop(0)
        growth = hist[-1][1] - hist[0][1] if len(hist) >= 2 else 0

        if crashloop or growth > settings.pod_restart_threshold:
            out.append(Finding(
                rule="pod_crash_looping", severity=Severity.CRITICAL,
                target=p.name,
                detail={"crashloop": crashloop, "restart_growth": growth,
                        "restart_count": p.restart_count, "namespace": p.namespace},
                first_seen=utcnow_iso(),
            ))
    return out


@rule
def pod_not_ready(s: Snapshot) -> List[Finding]:
    out = []
    threshold_s = settings.pod_not_ready_minutes * 60
    seen_keys = set()
    for p in s.pods:
        if p.phase in ("Succeeded",):
            continue
        not_ready = (not p.ready) or any(not c.ready for c in p.containers)
        seen_keys.add(p.name)
        if not_ready:
            since = s.history.pod_not_ready_since.setdefault(p.name, _now_ts())
            duration = _now_ts() - since
            if duration >= threshold_s:
                out.append(Finding(
                    rule="pod_not_ready", severity=Severity.WARNING,
                    target=p.name,
                    detail={"ready": False,
                            "duration_minutes": round(duration / 60, 1),
                            "namespace": p.namespace},
                    first_seen=utcnow_iso(),
                ))
        else:
            s.history.pod_not_ready_since.pop(p.name, None)
    # clear stale entries for pods that vanished
    for gone in set(s.history.pod_not_ready_since) - seen_keys:
        s.history.pod_not_ready_since.pop(gone, None)
    return out


@rule
def oom_killed(s: Snapshot) -> List[Finding]:
    out = []
    for p in s.pods:
        for c in p.containers:
            if c.reason == "OOMKilled":
                out.append(Finding(
                    rule="oom_killed", severity=Severity.CRITICAL,
                    target=f"{p.name}/{c.name}",
                    detail={"namespace": p.namespace, "container": c.name},
                    first_seen=utcnow_iso(),
                ))
    return out


@rule
def cpu_sustained_high(s: Snapshot) -> List[Finding]:
    if s.metrics.source == "unavailable":
        return []
    s.history.record_cpu(s.metrics.cpu_pct)
    if s.history.cpu_sustained_above(settings.cpu_warn_pct, settings.cpu_sustained_minutes):
        return [Finding(
            rule="cpu_sustained_high", severity=Severity.WARNING, target="node",
            detail={"cpu_pct": round(s.metrics.cpu_pct, 1),
                    "minutes": settings.cpu_sustained_minutes},
            first_seen=utcnow_iso(),
        )]
    return []


@rule
def memory_pressure(s: Snapshot) -> List[Finding]:
    if s.metrics.source == "unavailable":
        return []
    pct = s.metrics.mem_pct
    if pct >= settings.mem_crit_pct:
        sev = Severity.CRITICAL
    elif pct >= settings.mem_warn_pct:
        sev = Severity.WARNING
    else:
        return []
    return [Finding(
        rule="memory_pressure", severity=sev, target="node",
        detail={"mem_pct": round(pct, 1), "used_gb": round(s.metrics.mem_used_gb, 1),
                "total_gb": round(s.metrics.mem_total_gb, 1)},
        first_seen=utcnow_iso(),
    )]


@rule
def disk_almost_full(s: Snapshot) -> List[Finding]:
    if s.metrics.source == "unavailable":
        return []
    pct = s.metrics.disk_pct
    if pct >= settings.disk_crit_pct:
        sev = Severity.CRITICAL
    elif pct >= settings.disk_warn_pct:
        sev = Severity.WARNING
    else:
        return []
    return [Finding(
        rule="disk_almost_full", severity=sev, target="node",
        detail={"disk_pct": round(pct, 1), "used_gb": round(s.metrics.disk_used_gb),
                "total_gb": round(s.metrics.disk_total_gb)},
        first_seen=utcnow_iso(),
    )]


_SSH_FAIL = re.compile(r"(?i)(failed password|authentication failure|invalid user|failed publickey)")
_IP = re.compile(r"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})")


@rule
def auth_failure_spike(s: Snapshot) -> List[Finding]:
    """Scan recent log lines for a burst of failed SSH/sudo attempts."""
    hits = [m for m in s.recent_logs if _SSH_FAIL.search(m.message)]
    if len(hits) < settings.auth_fail_threshold:
        return []
    ips = set()
    for m in hits:
        found = _IP.search(m.message)
        if found:
            ips.add(found.group(1))
    return [Finding(
        rule="auth_failure_spike", severity=Severity.CRITICAL, target="ssh",
        detail={"count": len(hits), "window_minutes": settings.auth_fail_window_minutes,
                "source_ips": sorted(ips)[:5]},
        first_seen=utcnow_iso(),
    )]


@rule
def unusual_outbound_traffic(s: Snapshot) -> List[Finding]:
    if s.metrics.source == "unavailable":
        return []
    egress = s.metrics.net_up_mbps
    baseline = s.history.egress_baseline()
    s.history.record_egress(egress)
    if baseline > 0 and egress > baseline * settings.net_egress_multiplier:
        return [Finding(
            rule="unusual_outbound_traffic", severity=Severity.WARNING, target="network",
            detail={"egress_mbps": round(egress, 1), "baseline_mbps": round(baseline, 1),
                    "multiplier": settings.net_egress_multiplier},
            first_seen=utcnow_iso(),
        )]
    return []


# service_down and tls_expiring do network I/O — they're async and invoked
# separately by the engine (not through the sync registry).
async def service_down(history: RollingHistory) -> List[Finding]:
    import httpx
    out: List[Finding] = []
    urls = settings.healthcheck_url_list
    if not urls:
        return out
    async with httpx.AsyncClient() as client:
        for url in urls:
            down = False
            try:
                r = await client.get(url, timeout=8)
                down = r.status_code >= 500
            except Exception:
                down = True
            if down:
                since = history.service_down_since.setdefault(url, _now_ts())
                if _now_ts() - since >= settings.service_down_minutes * 60:
                    out.append(Finding(
                        rule="service_down", severity=Severity.CRITICAL, target=url,
                        detail={"duration_minutes": round((_now_ts() - since) / 60, 1)},
                        first_seen=utcnow_iso(),
                    ))
            else:
                history.service_down_since.pop(url, None)
    return out


async def tls_expiring(history: RollingHistory) -> List[Finding]:
    import asyncio
    out: List[Finding] = []
    for hostport in settings.tls_host_list:
        host, _, port = hostport.partition(":")
        port = int(port or 443)

        def _check() -> int | None:
            try:
                ctx = ssl.create_default_context()
                with socket.create_connection((host, port), timeout=8) as sock:
                    with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                        cert = ssock.getpeercert()
                not_after = cert["notAfter"]
                expiry = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(
                    tzinfo=timezone.utc)
                return (expiry - datetime.now(timezone.utc)).days
            except Exception:
                return None

        days = await asyncio.to_thread(_check)
        if days is not None and days <= settings.tls_expiry_warn_days:
            out.append(Finding(
                rule="tls_expiring", severity=Severity.WARNING, target=hostport,
                detail={"days_remaining": days},
                first_seen=utcnow_iso(),
            ))
    return out

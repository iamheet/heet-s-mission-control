"""
JARVIS persona — turns a structured Finding into a short, human, first-person
message. Deterministic and fast (no LLM call in v1).

Design for the future upgrade: `render()` is the single entry point. To swap in
richer phrasing later, implement an async LLM renderer with the same signature
and call it from here behind a config flag — nothing else changes. The
`_TEMPLATES` dict keeps rule-specific phrasing declarative.
"""
from __future__ import annotations

from typing import Callable, Dict

from config import settings
from schemas import Finding, Severity

# Whether to prefix the owner's name. The engine sets this True only for the
# first alert in a batch, so JARVIS doesn't say "Heet" on every line.
Renderer = Callable[[Finding], str]


def _d(f: Finding, key: str, default="") -> object:
    return f.detail.get(key, default)


# Each template returns the *body* (name prefix is added separately).
_TEMPLATES: Dict[str, Renderer] = {
    "pod_crash_looping": lambda f: (
        f"the pod {f.target} is crash-looping"
        f"{' (' + str(_d(f, 'restart_growth')) + ' restarts in the last few minutes)' if _d(f, 'restart_growth') else ''}. "
        f"It keeps dying on startup, so whatever it serves is effectively down. "
        f"I'd check its logs before it burns more restarts."
    ),
    "pod_not_ready": lambda f: (
        f"the pod {f.target} has been stuck not-ready for about "
        f"{_d(f, 'duration_minutes')} minutes. Its readiness probe isn't passing, "
        f"so traffic won't reach it yet. Worth a look — this smells like the "
        f"Ollama ready-state issue."
    ),
    "oom_killed": lambda f: (
        f"{f.target} was just OOMKilled — the kernel killed it for using too much "
        f"memory. It'll restart, but if it keeps happening you'll want to raise its "
        f"memory limit or find the leak."
    ),
    "cpu_sustained_high": lambda f: (
        f"CPU has been sitting above {settings.cpu_warn_pct:.0f}% for the last "
        f"{_d(f, 'minutes')} minutes (currently {_d(f, 'cpu_pct')}%). Nothing's on "
        f"fire yet, but the node has no headroom right now."
    ),
    "memory_pressure": lambda f: (
        f"memory usage is at {_d(f, 'mem_pct')}% "
        f"({_d(f, 'used_gb')} of {_d(f, 'total_gb')} GB). "
        + ("This is close to OOM territory — something will get killed soon if it climbs."
           if f.severity == Severity.CRITICAL else
           "It's been high for a few minutes; worth a look before it gets worse.")
    ),
    "disk_almost_full": lambda f: (
        f"disk is {_d(f, 'disk_pct')}% full "
        f"({_d(f, 'used_gb')} of {_d(f, 'total_gb')} GB). "
        + ("Critically low — writes will start failing shortly. Clear space now."
           if f.severity == Severity.CRITICAL else
           "Getting tight. Might be time to clean up logs or old images.")
    ),
    "auth_failure_spike": lambda f: (
        f"I'm seeing repeated failed SSH attempts against this server — "
        f"{_d(f, 'count')} in the last {_d(f, 'window_minutes')} minutes"
        + (f" from {', '.join(_d(f, 'source_ips'))}" if _d(f, 'source_ips') else "")
        + ". This looks like a brute-force attempt, not normal traffic. "
        f"You may want to block the source and check your SSH config."
    ),
    "unusual_outbound_traffic": lambda f: (
        f"outbound traffic just spiked to {_d(f, 'egress_mbps')} MB/s — about "
        f"{_d(f, 'multiplier')}x the recent average of {_d(f, 'baseline_mbps')} MB/s. "
        f"Could be a legit transfer, but if you're not expecting it, it's worth "
        f"confirming nothing's exfiltrating data."
    ),
    "service_down": lambda f: (
        f"the health check for {f.target} has been failing for "
        f"{_d(f, 'duration_minutes')} minutes — it's either returning 5xx or timing "
        f"out. That endpoint is effectively down."
    ),
    "tls_expiring": lambda f: (
        f"the TLS certificate for {f.target} expires in {_d(f, 'days_remaining')} days. "
        f"Worth renewing now so nothing breaks when it lapses."
    ),
}

# Recovery messages (used when an alert resolves)
_RESOLVED: Dict[str, str] = {
    "pod_crash_looping": "{target} has stabilized — no more crash-looping. Health check passed.",
    "pod_not_ready": "{target} is ready again and taking traffic. That one's cleared.",
    "cpu_sustained_high": "CPU has settled back to normal. We're good.",
    "memory_pressure": "Memory pressure has eased off. Back within safe limits.",
    "disk_almost_full": "Disk space recovered — no longer in the danger zone.",
    "service_down": "{target} is responding again. Service is back up.",
}

_SEVERITY_OPENER = {
    Severity.INFO: "",
    Severity.WARNING: "",
    Severity.CRITICAL: "",
}


def render(finding: Finding, use_name: bool = False) -> str:
    """Produce the human message for a new/active finding."""
    tmpl = _TEMPLATES.get(finding.rule)
    body = tmpl(finding) if tmpl else (
        f"{finding.rule} triggered on {finding.target} ({finding.severity.value})."
    )
    name = settings.owner_name
    if finding.severity == Severity.CRITICAL and use_name:
        return f"{name} — {body}"
    if use_name:
        return f"{name}, {body}"
    # capitalize first letter of the body when there's no name prefix
    return body[:1].upper() + body[1:]


def render_resolved(finding: Finding) -> str:
    tmpl = _RESOLVED.get(finding.rule)
    if tmpl:
        return tmpl.format(target=finding.target)
    return f"{finding.rule} on {finding.target} has cleared. Health check passed."


def short_summary(finding: Finding) -> str:
    """One-line summary for the email subject."""
    friendly = finding.rule.replace("_", " ")
    return f"{friendly} on {finding.target}"

"""
Notifier — the single outbound path for alerts.

  • Always broadcasts the alert to /ws/alerts (dashboard updates instantly).
  • For warning/critical, also emails via Gmail SMTP.

Everything is scrubbed of secrets before it leaves the process. SMTP is blocking,
so it runs in a worker thread; a failed email never breaks the watchdog loop.
"""
from __future__ import annotations

import logging
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.utils import formatdate

from config import settings
from schemas import Alert, Severity, alerts_ws
from scrub import scrub
from watchdog import persona

log = logging.getLogger("jarvis.notifier")


async def broadcast_alert(alert: Alert) -> None:
    """Push an alert (new or lifecycle change) to all /ws/alerts clients."""
    payload = alert.model_dump()
    payload["message"] = scrub(payload.get("message", ""))
    await alerts_ws.broadcast({"type": "alert", "alert": payload})


async def notify(alert: Alert, finding) -> None:
    """Full notify path for a NEW alert: broadcast + (maybe) email."""
    await broadcast_alert(alert)
    if alert.severity in (Severity.WARNING, Severity.CRITICAL) and settings.smtp_enabled:
        await asyncio.to_thread(_send_email, alert, finding)


async def notify_resolved(alert: Alert) -> None:
    """A previously-flagged issue cleared — tell the dashboard."""
    await alerts_ws.broadcast({"type": "resolved", "alert": alert.model_dump()})


def _send_email(alert: Alert, finding) -> None:
    if not (settings.smtp_user and settings.smtp_password and settings.smtp_to):
        log.warning("SMTP enabled but credentials/recipient missing; skipping email")
        return

    subject = f"JARVIS Alert: {scrub(persona.short_summary(finding))}"
    body = (
        f"Severity: {alert.severity.value.upper()}\n"
        f"Target:   {alert.target}\n"
        f"Rule:     {alert.rule}\n"
        f"Time:     {alert.first_seen}\n\n"
        f"{scrub(alert.message)}\n\n"
        f"— JARVIS, watching {settings.owner_name}'s server\n"
    )
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = settings.smtp_to
    msg["Date"] = formatdate(localtime=True)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
        log.info("Sent alert email: %s", subject)
    except Exception as e:
        # Never leak credentials in the error; never crash the loop.
        log.error("Failed to send alert email (%s): %s", type(e).__name__, e)

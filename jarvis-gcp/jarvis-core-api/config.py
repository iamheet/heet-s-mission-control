"""
Central configuration for jarvis-core-api.

Every tunable — thresholds, secrets, URLs — is read from the environment (or a
.env file) with a sensible default, so you can adjust behaviour without editing
code. Import the singleton `settings` anywhere.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _csv(value: str) -> List[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # ── Auth ──
    jarvis_admin_user: str = "heet"
    jarvis_admin_password_hash: str = ""
    jarvis_admin_password: str = "changeme"
    jwt_secret: str = "please-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 720

    # ── CORS ──
    allowed_origins: str = "http://localhost:5173"

    # ── Prometheus ──
    prometheus_url: str = "http://localhost:9090"
    prometheus_timeout: int = 8

    # ── Kubernetes ──
    kubeconfig_path: str = "/etc/rancher/k3s/k3s.yaml"

    # ── Logs ──
    log_source: str = "mock"  # kubectl | journalctl | mock
    log_buffer_size: int = 500
    auth_log_path: str = "/var/log/auth.log"

    # ── Watchdog ──
    watchdog_enabled: bool = True
    watchdog_interval_seconds: int = 12
    alert_cooldown_minutes: int = 30
    alert_db_path: str = "./jarvis_alerts.db"
    owner_name: str = "Heet"

    # ── Detection thresholds ──
    cpu_warn_pct: float = 90
    cpu_sustained_minutes: int = 2
    mem_warn_pct: float = 90
    mem_crit_pct: float = 97
    disk_warn_pct: float = 85
    disk_crit_pct: float = 95
    pod_restart_threshold: int = 3
    pod_restart_window_minutes: int = 10
    pod_not_ready_minutes: int = 2
    auth_fail_threshold: int = 5
    auth_fail_window_minutes: int = 5
    net_egress_multiplier: float = 3
    service_down_minutes: int = 1
    tls_expiry_warn_days: int = 14
    healthcheck_urls: str = ""
    tls_hosts: str = ""

    # ── Email ──
    smtp_enabled: bool = False
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_to: str = ""

    # ── Derived helpers ──
    @property
    def origins_list(self) -> List[str]:
        return _csv(self.allowed_origins)

    @property
    def healthcheck_url_list(self) -> List[str]:
        return _csv(self.healthcheck_urls)

    @property
    def tls_host_list(self) -> List[str]:
        return _csv(self.tls_hosts)


# Whitelisted remediation actions. The key is the action name accepted at
# POST /api/actions/{action}; the value is a short human description. The actual
# implementation lives in routers/actions.py — this is the allow-list gate.
WHITELISTED_ACTIONS = {
    "restart_pod": "Restart a specific Kubernetes pod (deletes it so the "
    "controller recreates it).",
    "clear_cache": "Flush the application cache directory.",
    "scan_system": "Run a read-only system health scan and return a report.",
    "backup_now": "Trigger an on-demand backup job.",
}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

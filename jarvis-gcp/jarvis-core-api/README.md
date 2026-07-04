# jarvis-core-api

Real-time monitoring backend + proactive **watchdog agent** for the JARVIS
Mission OS dashboard. Runs on your GCP VM (`heet-mission-os`) alongside the
existing K3s single-node cluster, Prometheus, and Grafana, and feeds the
dashboard live data over REST + WebSocket.

Two halves:

1. **REST / WebSocket API** — clean JSON for the dashboard's gauges, pods,
   logs, and alerts, plus a whitelisted actions endpoint.
2. **Watchdog agent** — a background loop that watches the system every ~12s and
   raises *human-readable* alerts in a JARVIS voice ("Heet, memory's been over
   90% for 4 minutes…"), pushed to the dashboard instantly and emailed for
   warning/critical severities.

---

## Quick start

```bash
cd jarvis-gcp/jarvis-core-api
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env — at minimum set JWT_SECRET and an admin password (see Auth below)

uvicorn main:app --host 0.0.0.0 --port 8080
```

Open **http://localhost:8080/docs** for interactive Swagger docs. `GET /health`
is unauthenticated; everything else needs a token.

> **Local dev with no cluster:** the defaults (`LOG_SOURCE=mock`,
> `PROMETHEUS_URL=http://localhost:9090`) let the whole service boot on a laptop.
> Prometheus/K8s calls degrade gracefully to `source: "unavailable"` instead of
> erroring, and logs stream synthetic lines so `/ws/logs` works.

---

## Auth

Single admin user (you). Generate a password hash and a JWT secret:

```bash
python -c "from auth import hash_password; print(hash_password('your-strong-password'))"
python -c "import secrets; print(secrets.token_hex(32))"
```

Put them in `.env` as `JARVIS_ADMIN_PASSWORD_HASH` and `JWT_SECRET`. Then log in:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -d "username=heet&password=your-strong-password"
# → { "access_token": "eyJ…", "token_type": "bearer", ... }
```

Use the token as `Authorization: Bearer <token>` on REST calls, and as
`?token=<token>` on WebSocket URLs (browsers can't set WS headers).

---

## Pointing it at your existing setup

| What | Env var | Notes |
|------|---------|-------|
| Prometheus | `PROMETHEUS_URL` | e.g. `http://localhost:9090`. PromQL lives in `clients/prometheus_client.py` — tune label selectors to your exporters. |
| K3s | `KUBECONFIG_PATH` | Default `/etc/rancher/k3s/k3s.yaml`. Leave blank to use in-cluster auth if you deploy this as a pod. |
| Logs | `LOG_SOURCE` | `kubectl` (all pod containers), `journalctl` (systemd), or `mock`. |
| Auth log | `AUTH_LOG_PATH` | Used by the brute-force rule when `LOG_SOURCE=journalctl`. |
| Email | `SMTP_*` | Gmail SMTP. Use a Gmail **App Password**, not your account password. Set `SMTP_ENABLED=true`. |

All detection thresholds are env vars too (see `.env.example` / `config.py`) — tune
sensitivity without touching code.

---

## Endpoints (how the dashboard connects)

| Method | Path | Feeds dashboard widget |
|--------|------|------------------------|
| `POST` | `/api/auth/login` | — (get a token first) |
| `GET`  | `/api/metrics` | The 5 gauge rings (`gauges[]`) + raw `snapshot` |
| `GET`  | `/api/pods` | Active Processes aggregates + pod list |
| `WS`   | `/ws/logs?token=…` | Live Logs panel |
| `GET`  | `/api/alerts` | Recent Notifications / current alerts |
| `WS`   | `/ws/alerts?token=…` | Instant alert push (AI Assistant + Notifications) |
| `POST` | `/api/alerts/{id}/ack` | Acknowledge an alert |
| `GET`  | `/api/actions` | Quick Actions grid (lists whitelisted actions) |
| `POST` | `/api/actions/{action}` | Execute one whitelisted action |

### Response shapes

`GET /api/metrics` → matches the frontend gauge seed exactly:

```json
{
  "snapshot": { "cpu_pct": 63.2, "mem_used_gb": 13.2, "mem_total_gb": 32, ... },
  "gauges": [
    { "id": "cpu", "label": "CPU", "value": 63.2, "caption": "8 Core" },
    { "id": "mem", "label": "MEMORY", "value": 41.3, "caption": "13.2 / 32 GB" },
    ...
  ]
}
```

`WS /ws/logs` streams `{ timestamp, level, source, message }` where `level` is
one of `INFO | SUCCESS | WARNING | ERROR` — the same union the dashboard's
`LogRow` already uses.

`WS /ws/alerts` pushes `{ "type": "alert" | "resolved" | "ping", "alert": {…} }`.
Each `alert` carries the JARVIS-voice `message`, `severity`, `status`
(`new → acknowledged → resolved`), and `target`.

---

## The watchdog

Runs every `WATCHDOG_INTERVAL_SECONDS` (default 12). Each cycle it pulls
metrics + pods + recent logs, runs every rule in `watchdog/rules.py`, and:

- **new finding** → creates an alert, renders a human message via
  `watchdog/persona.py`, pushes to `/ws/alerts`, and emails if warning/critical.
- **still active** → re-notifies only after the cooldown (`ALERT_COOLDOWN_MINUTES`,
  default 30) or on severity escalation — no spam.
- **cleared** → marks it resolved and emits a "Health Check Passed" message.

Alert lifecycle (`new → acknowledged → resolved`) is persisted to SQLite
(`ALERT_DB_PATH`) so it survives restarts.

### Detection rules (in `watchdog/rules.py`)

pod crash-looping · pod not-ready (catches the Ollama ready-state bug) ·
OOMKilled · sustained high CPU · memory pressure · disk almost full ·
failed-login / SSH brute-force spike · unusual outbound traffic · service/endpoint
down · TLS cert expiring soon.

**Add a rule:** write a function that takes a `Snapshot` and returns
`list[Finding]`, decorate it with `@rule`. That's it — the engine runs it every
cycle.

### JARVIS persona

`watchdog/persona.py` is deterministic template text (fast, no LLM). To upgrade
to richer phrasing later, implement an LLM renderer with the same `render()`
signature and call it behind a config flag — the rest of the pipeline is
unchanged.

---

## Safety guarantees

- **No generic shell/exec endpoint.** `/api/actions/{action}` only accepts the
  fixed allow-list in `config.WHITELISTED_ACTIONS`; anything else is a 404. Each
  maps to a specific, pre-defined function.
- **The watchdog never remediates automatically** — it only observes and
  reports. Any action runs only when *you* trigger it from the dashboard.
- **Secrets are scrubbed** (`scrub.py`) from every log line before it is stored,
  streamed, or emailed (JWTs, API keys, passwords, bearer tokens, AWS keys, …).
- **Auth required everywhere** except `/health`. CORS is restricted to
  `ALLOWED_ORIGINS`.

---

## Deploy notes

- Run behind your existing Nginx with a WebSocket-upgrade location for `/ws/`.
- If deploying as a K8s pod, leave `KUBECONFIG_PATH` blank and grant the pod a
  ServiceAccount with read access to pods/services/jobs (+ `delete pods` only if
  you want `restart_pod` to work).
- Point the dashboard's API base at this service and flip its data source from
  the local simulation to these endpoints.

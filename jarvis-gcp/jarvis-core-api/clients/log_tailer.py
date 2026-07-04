"""
Log tailer.

Runs a single background subprocess (`kubectl logs -f` across all pods, or
`journalctl -f`) and fans each new line out to:
  1) a bounded ring buffer the watchdog reads for its log-based rules, and
  2) a set of async subscriber queues the /ws/logs endpoint drains per client.

Every line is scrubbed of secrets and auto-classified INFO/SUCCESS/WARNING/ERROR
before it leaves this module. In "mock" mode it emits synthetic lines so the
whole stack is runnable on a laptop with no cluster.
"""
from __future__ import annotations

import asyncio
import logging
import re
from collections import deque
from typing import Deque, List, Set

from config import settings
from schemas import LogLevel, LogMessage, utcnow_iso
from scrub import scrub

log = logging.getLogger("jarvis.logs")

# keyword → level classification (checked most-severe first)
_ERROR = re.compile(r"(?i)\b(error|fail|failed|fatal|exception|panic|refused|denied|crashloop|oomkilled)\b")
_WARN = re.compile(r"(?i)\b(warn|warning|deprecat|retry|timeout|slow|high|throttl|degraded)\b")
_SUCCESS = re.compile(r"(?i)\b(success|succeeded|started|ready|healthy|completed|deployed|ok|pass|passed)\b")


def classify(message: str) -> LogLevel:
    if _ERROR.search(message):
        return LogLevel.ERROR
    if _WARN.search(message):
        return LogLevel.WARNING
    if _SUCCESS.search(message):
        return LogLevel.SUCCESS
    return LogLevel.INFO


class LogTailer:
    def __init__(self) -> None:
        self.buffer: Deque[LogMessage] = deque(maxlen=settings.log_buffer_size)
        self._subscribers: Set[asyncio.Queue] = set()
        self._task: asyncio.Task | None = None
        self._proc: asyncio.subprocess.Process | None = None

    # ── subscription API for /ws/logs ──
    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=200)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    def recent(self, n: int = 100) -> List[LogMessage]:
        return list(self.buffer)[-n:]

    def _emit(self, source: str, raw: str) -> None:
        clean = scrub(raw.strip())
        if not clean:
            return
        msg = LogMessage(
            timestamp=utcnow_iso(), level=classify(clean),
            source=source, message=clean,
        )
        self.buffer.append(msg)
        for q in list(self._subscribers):
            try:
                q.put_nowait(msg)
            except asyncio.QueueFull:
                pass  # slow client — drop rather than block the tailer

    # ── lifecycle ──
    async def start(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._proc and self._proc.returncode is None:
            try:
                self._proc.terminate()
            except ProcessLookupError:
                pass
        if self._task:
            self._task.cancel()

    async def _run(self) -> None:
        mode = settings.log_source
        try:
            if mode == "kubectl":
                cmd = ["kubectl", "logs", "-f", "--all-containers=true",
                       "--max-log-requests=20", "--prefix=true",
                       "--all-namespaces", "--tail=20"]
                await self._run_subprocess("k8s", cmd)
            elif mode == "journalctl":
                cmd = ["journalctl", "-f", "-n", "20", "--no-pager", "-o", "short-iso"]
                await self._run_subprocess("system", cmd)
            else:
                await self._run_mock()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            log.error("log tailer crashed (%s), falling back to mock: %s", mode, e)
            await self._run_mock()

    async def _run_subprocess(self, source: str, cmd: list[str]) -> None:
        log.info("Tailing logs via: %s", " ".join(cmd))
        self._proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT,
        )
        assert self._proc.stdout
        while True:
            line = await self._proc.stdout.readline()
            if not line:
                break
            self._emit(source, line.decode(errors="replace"))

    async def _run_mock(self) -> None:
        """Synthetic log stream for local dev (LOG_SOURCE=mock)."""
        samples = [
            ("k8s", "container mission-os-api started successfully"),
            ("k8s", "readiness probe passed for ollama-tech-tier"),
            ("system", "prometheus scrape completed in 42ms"),
            ("k8s", "WARNING high memory usage detected on node-3"),
            ("k8s", "AI model response generated in 412ms"),
            ("system", "database backup completed · 2.1 GB"),
            ("k8s", "ERROR failed to pull image for job cleanup-cron"),
            ("system", "health check passed · all endpoints ready"),
        ]
        i = 0
        while True:
            src, text = samples[i % len(samples)]
            self._emit(src, text)
            i += 1
            await asyncio.sleep(3.5)


log_tailer = LogTailer()

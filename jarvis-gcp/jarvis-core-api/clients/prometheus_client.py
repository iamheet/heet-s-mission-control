"""
Prometheus HTTP API client.

Queries the instant-vector endpoint for the handful of node_exporter series the
dashboard needs, and shapes them into a MetricsSnapshot. If Prometheus is
unreachable, returns a snapshot marked source="unavailable" rather than raising,
so the API degrades gracefully instead of 500-ing.
"""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from config import settings
from schemas import MetricsSnapshot, utcnow_iso

log = logging.getLogger("jarvis.prometheus")

# PromQL for each series. Written for standard node_exporter metric names.
# Tune these if your exporter uses different labels/instances.
QUERIES = {
    # CPU busy % = 100 - idle rate
    "cpu": '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)',
    "cpu_cores": 'count(count(node_cpu_seconds_total) by (cpu))',
    "mem_total": "node_memory_MemTotal_bytes",
    "mem_avail": "node_memory_MemAvailable_bytes",
    "disk_total": 'node_filesystem_size_bytes{mountpoint="/",fstype!="rootfs"}',
    "disk_avail": 'node_filesystem_avail_bytes{mountpoint="/",fstype!="rootfs"}',
    # bytes/sec over the default interface, excluding loopback
    "net_rx": 'sum(rate(node_network_receive_bytes_total{device!="lo"}[2m]))',
    "net_tx": 'sum(rate(node_network_transmit_bytes_total{device!="lo"}[2m]))',
    # optional GPU (nvidia dcgm exporter). Missing series → None, handled below.
    "gpu": "avg(DCGM_FI_DEV_GPU_UTIL)",
}


class PrometheusClient:
    def __init__(self, base_url: Optional[str] = None) -> None:
        self.base_url = (base_url or settings.prometheus_url).rstrip("/")
        self.timeout = settings.prometheus_timeout

    async def _instant(self, client: httpx.AsyncClient, promql: str) -> Optional[float]:
        """Run one instant query; return the first scalar value or None."""
        try:
            r = await client.get(
                f"{self.base_url}/api/v1/query",
                params={"query": promql},
                timeout=self.timeout,
            )
            r.raise_for_status()
            data = r.json()
            result = data.get("data", {}).get("result", [])
            if not result:
                return None
            return float(result[0]["value"][1])
        except (httpx.HTTPError, KeyError, ValueError, IndexError) as e:
            log.debug("prometheus query failed (%s): %s", promql[:40], e)
            return None

    async def snapshot(self) -> MetricsSnapshot:
        """Fetch all series concurrently and build a MetricsSnapshot."""
        try:
            async with httpx.AsyncClient() as client:
                import asyncio

                keys = list(QUERIES.keys())
                results = await asyncio.gather(
                    *(self._instant(client, QUERIES[k]) for k in keys)
                )
                vals = dict(zip(keys, results))
        except Exception as e:  # network/DNS failure at the client level
            log.warning("Prometheus unreachable at %s: %s", self.base_url, e)
            return MetricsSnapshot(ts=utcnow_iso(), source="unavailable")

        # If we got literally nothing back, mark unavailable.
        if all(v is None for v in vals.values()):
            return MetricsSnapshot(ts=utcnow_iso(), source="unavailable")

        gb = 1024 ** 3
        mem_total = (vals.get("mem_total") or 0) / gb
        mem_avail = (vals.get("mem_avail") or 0) / gb
        mem_used = max(0.0, mem_total - mem_avail)
        mem_pct = (mem_used / mem_total * 100) if mem_total else 0

        disk_total = (vals.get("disk_total") or 0) / gb
        disk_avail = (vals.get("disk_avail") or 0) / gb
        disk_used = max(0.0, disk_total - disk_avail)
        disk_pct = (disk_used / disk_total * 100) if disk_total else 0

        mbps = 1_000_000  # bytes/s → MB/s (decimal, matches dashboard captions)
        gpu = vals.get("gpu")

        return MetricsSnapshot(
            cpu_pct=max(0.0, min(100.0, vals.get("cpu") or 0)),
            cpu_cores=int(vals.get("cpu_cores") or 0),
            mem_pct=mem_pct,
            mem_used_gb=mem_used,
            mem_total_gb=mem_total,
            disk_pct=disk_pct,
            disk_used_gb=disk_used,
            disk_total_gb=disk_total,
            net_up_mbps=(vals.get("net_tx") or 0) / mbps,
            net_down_mbps=(vals.get("net_rx") or 0) / mbps,
            gpu_pct=gpu if gpu is not None else None,
            gpu_name="NVIDIA GPU" if gpu is not None else None,
            ts=utcnow_iso(),
            source="prometheus",
        )


prometheus = PrometheusClient()

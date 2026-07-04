"""
Kubernetes (K3s) client.

Wraps the official `kubernetes` Python client. The client's calls are blocking,
so every public method runs them in a thread via asyncio.to_thread to keep the
event loop responsive. Degrades gracefully (empty list, source="unavailable")
if the cluster can't be reached.
"""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import List, Optional

from config import settings
from schemas import ContainerStatus, PodInfo, PodsResponse, utcnow_iso

log = logging.getLogger("jarvis.k8s")


class K8sClient:
    def __init__(self) -> None:
        self._core = None
        self._batch = None
        self._loaded = False

    def _ensure_loaded(self) -> bool:
        """Lazily load kube config + build API clients. Returns success."""
        if self._loaded and self._core is not None:
            return True
        try:
            from kubernetes import client, config as kube_config

            path = settings.kubeconfig_path
            if path and os.path.exists(path):
                kube_config.load_kube_config(config_file=path)
            else:
                # running inside the cluster as a pod
                kube_config.load_incluster_config()
            self._core = client.CoreV1Api()
            self._batch = client.BatchV1Api()
            self._loaded = True
            return True
        except Exception as e:
            log.warning("Could not load kube config: %s", e)
            self._loaded = False
            return False

    # ── blocking worker (runs in a thread) ──
    def _list_pods_sync(self) -> Optional[List[PodInfo]]:
        if not self._ensure_loaded():
            return None
        try:
            raw = self._core.list_pod_for_all_namespaces(watch=False)
        except Exception as e:
            log.warning("list_pod_for_all_namespaces failed: %s", e)
            return None

        pods: List[PodInfo] = []
        now = datetime.now(timezone.utc)
        for p in raw.items:
            statuses = p.status.container_statuses or []
            containers: List[ContainerStatus] = []
            total_restarts = 0
            all_ready = bool(statuses)
            for cs in statuses:
                total_restarts += cs.restart_count or 0
                if not cs.ready:
                    all_ready = False
                state, reason = "unknown", None
                st = cs.state
                if st and st.running:
                    state = "running"
                elif st and st.waiting:
                    state, reason = "waiting", st.waiting.reason
                elif st and st.terminated:
                    state, reason = "terminated", st.terminated.reason
                containers.append(ContainerStatus(
                    name=cs.name, ready=bool(cs.ready),
                    restart_count=cs.restart_count or 0, state=state, reason=reason,
                ))

            start = p.status.start_time
            age = int((now - start).total_seconds()) if start else 0
            pods.append(PodInfo(
                name=p.metadata.name,
                namespace=p.metadata.namespace,
                phase=p.status.phase or "Unknown",
                ready=all_ready,
                restart_count=total_restarts,
                containers=containers,
                age_seconds=age,
            ))
        return pods

    def _count_jobs_sync(self) -> int:
        if not self._ensure_loaded():
            return 0
        try:
            jobs = self._batch.list_job_for_all_namespaces(watch=False)
            return sum(1 for j in jobs.items if (j.status.active or 0) > 0)
        except Exception:
            return 0

    def _count_services_sync(self) -> int:
        if not self._ensure_loaded():
            return 0
        try:
            svcs = self._core.list_service_for_all_namespaces(watch=False)
            return len(svcs.items)
        except Exception:
            return 0

    # ── async public API ──
    async def list_pods(self) -> Optional[List[PodInfo]]:
        return await asyncio.to_thread(self._list_pods_sync)

    async def pods_response(self) -> PodsResponse:
        pods = await self.list_pods()
        if pods is None:
            return PodsResponse(pods=[], aggregates={
                "docker_running": 0, "k8s_healthy": 0,
                "services_active": 0, "jobs_running": 0,
            }, source="unavailable", ts=utcnow_iso())

        jobs = await asyncio.to_thread(self._count_jobs_sync)
        services = await asyncio.to_thread(self._count_services_sync)
        healthy = sum(1 for p in pods if p.phase == "Running" and p.ready)
        running_containers = sum(
            1 for p in pods for c in p.containers if c.state == "running"
        )
        aggregates = {
            "docker_running": running_containers,
            "k8s_healthy": healthy,
            "services_active": services,
            "jobs_running": jobs,
        }
        return PodsResponse(pods=pods, aggregates=aggregates, source="k8s", ts=utcnow_iso())


k8s = K8sClient()

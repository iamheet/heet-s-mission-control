import { createServerFn } from "@tanstack/react-start";

export interface ClusterMetrics {
  cpu: number;
  memory: number;
  disk: number;
  networkRxBytesPerSec: number;
  containerCount: number;
  uptimeSeconds: number;
  podCount: number;
}

const QUERIES: Record<keyof ClusterMetrics, string> = {
  cpu: '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
  memory:
    "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100",
  disk: '100 - (node_filesystem_avail_bytes{mountpoint="/",fstype!="tmpfs"} / node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"} * 100)',
  networkRxBytesPerSec:
    'sum(rate(node_network_receive_bytes_total{device!="lo"}[5m]))',
  containerCount: "count(container_last_seen)",
  uptimeSeconds: "node_time_seconds - node_boot_time_seconds",
  podCount:
    'count(container_last_seen{container!="POD",container!=""})',
};

async function queryPrometheus(
  baseUrl: string,
  promql: string
): Promise<number | null> {
  try {
    const url = `${baseUrl}/api/v1/query?query=${encodeURIComponent(promql)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "success") return null;
    const result = json.data?.result;
    if (!result || result.length === 0) return null;
    const val = parseFloat(result[0].value[1]);
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

export const getClusterMetrics = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClusterMetrics | null> => {
    const env =
      typeof process !== "undefined"
        ? process.env
        : ({} as Record<string, string | undefined>);
    const prometheusUrl =
      env.PROMETHEUS_URL ||
      env.VITE_PROMETHEUS_URL ||
      "http://prometheus-svc:9090";

    const keys = Object.keys(QUERIES) as (keyof ClusterMetrics)[];
    const results = await Promise.all(
      keys.map((k) => queryPrometheus(prometheusUrl, QUERIES[k]))
    );

    const anySuccess = results.some((r) => r !== null);
    if (!anySuccess) return null;

    const metrics: ClusterMetrics = {
      cpu: round(results[0] ?? 0),
      memory: round(results[1] ?? 0),
      disk: round(results[2] ?? 0),
      networkRxBytesPerSec: round(results[3] ?? 0),
      containerCount: Math.round(results[4] ?? 0),
      uptimeSeconds: Math.round(results[5] ?? 0),
      podCount: Math.round(results[6] ?? 0),
    };

    return metrics;
  }
);

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

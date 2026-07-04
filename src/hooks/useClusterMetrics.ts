import { useState, useEffect, useRef, useCallback } from "react";
import { getClusterMetrics, type ClusterMetrics } from "@/lib/metrics.api";

const POLL_INTERVAL = 15_000;

export interface ClusterMetricsState {
  data: ClusterMetrics | null;
  isLive: boolean;
  lastUpdated: Date | null;
  error: string | null;
  refresh: () => void;
}

export function useClusterMetrics(): ClusterMetricsState {
  const [data, setData] = useState<ClusterMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const metrics = await getClusterMetrics();
      if (metrics) {
        setData(metrics);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError("Prometheus unreachable");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    timerRef.current = setInterval(fetchMetrics, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchMetrics]);

  return {
    data,
    isLive: data !== null,
    lastUpdated,
    error,
    refresh: fetchMetrics,
  };
}

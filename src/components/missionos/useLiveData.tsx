/**
 * JARVIS Mission OS — live data provider (client-side simulation).
 *
 * Seeds every stream from mockData.ts, then mutates on timers so the dashboard
 * feels alive: gauges/health random-walk around their seed, logs stream in,
 * notifications age, the clock ticks, processes drift.
 *
 * SSR-safe: initial state === the static seeds (so server & first client render
 * match — no hydration mismatch). All mutation happens in useEffect, which only
 * runs in the browser.
 *
 * ── Wiring real metrics later ──
 * Replace the body of the interval callbacks with a fetch to your GCP VM /
 * Prometheus / K3s API and setState the response. The component contract
 * (shape of the context value) stays identical, so no card needs to change.
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  GAUGES,
  HEALTH_STATS,
  LOGS,
  LOG_ACCENT,
  NOTIFICATIONS,
  PROCESSES,
  type Gauge,
  type HealthStat,
  type LogLevel,
  type LogRow,
  type Notification,
  type ProcessTile,
} from "./mockData";

/* ── deterministic-ish PRNG (avoids Math.random ban in some runtimes; here we
   ARE in the browser inside effects, but a seeded walk keeps motion smooth) ── */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000; // 0..1
  };
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Random-walk a value a few points, gently pulled back toward its seed. */
function walk(current: number, seed: number, rng: () => number, spread = 4) {
  const drift = (rng() - 0.5) * 2 * spread;
  const pull = (seed - current) * 0.15; // mean-reversion
  return Math.round(clamp(current + drift + pull));
}

/* ── log stream pool: JARVIS keeps emitting new events ── */
const LOG_POOL: Array<{ level: LogLevel; message: string }> = [
  { level: "INFO", message: "Container mission-os-api heartbeat OK" },
  { level: "SUCCESS", message: "Autoscaler added replica · node-2" },
  { level: "INFO", message: "AI model response generated" },
  { level: "WARNING", message: "Latency spike on edge-gateway" },
  { level: "SUCCESS", message: "Health check passed · all pods ready" },
  { level: "INFO", message: "Prometheus scrape completed" },
  { level: "WARNING", message: "High memory usage detected on node-3" },
  { level: "ERROR", message: "Failed login attempt detected" },
  { level: "SUCCESS", message: "Cache warmed · 1.4k keys" },
  { level: "INFO", message: "K3s reconcile loop finished" },
];

const NOTIF_POOL: Array<Omit<Notification, "time">> = [
  { text: "Deployment Successful", icon: "Rocket", accent: "green" },
  { text: "Container Restarted", icon: "RefreshCw", accent: "cyan" },
  { text: "Health Check Passed", icon: "HeartPulse", accent: "purple" },
  { text: "New User Login", icon: "UserPlus", accent: "amber" },
  { text: "Backup Completed", icon: "RefreshCw", accent: "green" },
  { text: "Scaling Event Triggered", icon: "Rocket", accent: "cyan" },
];

function fmtClock(d: Date) {
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function fmtAgo(sec: number) {
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

/* ── context shape ── */
export type LiveState = {
  gauges: Gauge[];
  health: HealthStat[];
  processes: ProcessTile[];
  logs: LogRow[];
  notifications: Notification[];
  clock: string;
};

const LiveContext = createContext<LiveState | null>(null);

export function useLiveData(): LiveState {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLiveData must be used within <LiveDataProvider>");
  return ctx;
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  // initial state = static seeds → identical on server & first client paint
  const [gauges, setGauges] = useState<Gauge[]>(GAUGES);
  const [health, setHealth] = useState<HealthStat[]>(HEALTH_STATS);
  const [processes, setProcesses] = useState<ProcessTile[]>(PROCESSES);
  const [logs, setLogs] = useState<LogRow[]>(LOGS);
  const [clock, setClock] = useState<string>("--:--:--");
  // notifications tracked with an age (seconds) so relative time keeps ticking
  const [notifAges, setNotifAges] = useState<number[]>(() =>
    NOTIFICATIONS.map((_, i) => 120 + i * 300),
  );
  const [notifPool, setNotifPool] = useState<Array<Omit<Notification, "time">>>(NOTIFICATIONS);

  const rng = useRef(makeRng(0xa11ce));
  const logSeed = useRef(3);

  useEffect(() => {
    const r = rng.current;

    // 1) metrics random-walk — every 2s, smooth via useAnimatedNumber in the UI
    const mTimer = setInterval(() => {
      setGauges((prev) => prev.map((g) => ({ ...g, value: walk(g.value, findSeed(GAUGES, g.id), r) })));
      setHealth((prev) =>
        prev.map((h) => ({ ...h, value: walk(h.value, findSeedByLabel(HEALTH_STATS, h.label), r) })),
      );
    }, 2000);

    // 2) processes drift occasionally — every 5s
    const pTimer = setInterval(() => {
      setProcesses((prev) =>
        prev.map((p) => {
          if (r() > 0.4) return p; // most tiles hold steady
          const base = parseInt(p.count, 10) || 0;
          const next = clamp(base + (r() > 0.5 ? 1 : -1), 0, 99);
          return { ...p, count: next.toString().padStart(2, "0") };
        }),
      );
    }, 5000);

    // 3) log stream — new entry every ~3.5s, newest on top, cap at 8
    const lTimer = setInterval(() => {
      const pick = LOG_POOL[Math.floor(r() * LOG_POOL.length)];
      logSeed.current = (logSeed.current + 1) % 60;
      const now = new Date();
      const row: LogRow = { time: fmtClock(now), level: pick.level, message: pick.message };
      setLogs((prev) => [row, ...prev].slice(0, 8));
    }, 3500);

    // 4) notifications age every second; a fresh one arrives every ~12s
    const nTimer = setInterval(() => {
      setNotifAges((prev) => prev.map((a) => a + 1));
      if (r() > 0.92) {
        const pick = NOTIF_POOL[Math.floor(r() * NOTIF_POOL.length)];
        setNotifPool((prev) => [pick, ...prev].slice(0, 4));
        setNotifAges((prev) => [0, ...prev].slice(0, 4));
      }
    }, 1000);

    // 5) clock ticks every second
    const cTimer = setInterval(() => setClock(fmtClock(new Date())), 1000);
    setClock(fmtClock(new Date())); // set immediately on mount

    return () => {
      clearInterval(mTimer);
      clearInterval(pTimer);
      clearInterval(lTimer);
      clearInterval(nTimer);
      clearInterval(cTimer);
    };
  }, []);

  const notifications: Notification[] = notifPool.map((n, i) => ({
    ...n,
    time: fmtAgo(notifAges[i] ?? 0),
  }));

  const value: LiveState = { gauges, health, processes, logs, notifications, clock };
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

/* helpers to look up a stream's seed value */
function findSeed(list: Gauge[], id: string) {
  return list.find((g) => g.id === id)?.value ?? 50;
}
function findSeedByLabel(list: HealthStat[], label: string) {
  return list.find((h) => h.label === label)?.value ?? 50;
}

export { LOG_ACCENT };

import { Panel, Metric, SectionHeader, StatusDot, Sparkline } from "./primitives";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { seededSpark } from "./rand";
import { ShieldCheck, UserCheck } from "lucide-react";
import { useSimulation } from "./regionTheme";
import { useIsMobile } from "@/hooks/use-mobile";

const spark = (seed: number, n = 24, base = 50, amp = 30) => seededSpark(seed, n, base, amp);

const ALERTS_BY_REGION: Record<string, { s: string; t: string; target: string }[]> = {
  "us-east-1": [
    { s: "ok",   t: "prometheus scrape: healthy",     target: "observe" },
    { s: "ok",   t: "nginx upstream: 200 OK",          target: "infra" },
    { s: "ok",   t: "tls certificate: 84d remaining",  target: "infra" },
    { s: "ok",   t: "all k8s pods: running nominal",   target: "k8s" },
  ],
  "eu-west-1": [
    { s: "ok",   t: "prometheus scrape: healthy",       target: "observe" },
    { s: "warn", t: "node-2 mem 78% — scaling active",  target: "k8s" },
    { s: "ok",   t: "tls certificate: 84d remaining",   target: "infra" },
    { s: "warn", t: "latency p95 elevated: 67ms",       target: "observe" },
  ],
  "ap-south-1": [
    { s: "warn", t: "cpu load 83% — auto-scale engaged",  target: "observe" },
    { s: "warn", t: "mem pressure: 78% — review k8s",     target: "k8s" },
    { s: "warn", t: "p95 latency: 121ms — review nginx",  target: "infra" },
    { s: "ok",   t: "tls certificate: 84d remaining",     target: "infra" },
  ],
};

export function Overview() {
  const [pulse, setPulse] = useState(0);
  const { theme, metrics, regionId, simSpeed } = useSimulation();

  useEffect(() => {
    // Pulse every 2.2s / simSpeed so the ID card beacon reacts to speed
    const interval = Math.max(400, 2200 / simSpeed);
    const i = setInterval(() => setPulse(p => p + 1), interval);
    return () => clearInterval(i);
  }, [simSpeed]);

  const alerts = ALERTS_BY_REGION[regionId] ?? ALERTS_BY_REGION["us-east-1"];

  const triggerHighlight = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.dispatchEvent(new CustomEvent("highlight-section", { detail: { id: targetId } }));
    }
  };

  return (
    <section className="relative">
      <NetworkBackdrop color={'var(--primary)'} />
      <div className="relative">
        <SectionHeader
          id="overview"
          kicker="// section 01"
          title="Mission Control Overview"
          desc="Real-time operational telemetry across cloud infrastructure, deployment lines, and monitoring systems."
        />

        <div className="grid grid-cols-12 gap-4">
          {/* Main metrics — driven by region profile */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            <Metric
              label="Infra Health"
              value={metrics.infraHealth}
              suffix="%"
              decimals={2}
              accent={metrics.infraHealth > 99 ? "success" : metrics.infraHealth > 97 ? "warning" : "warning"}
              spark={spark(1, 24, metrics.infraHealth - 3, 4)}
            />
            <Metric
              label="Containers Running"
              value={metrics.containers}
              accent="cyan"
              spark={spark(2, 24, metrics.containers - 8, 10)}
            />
            <Metric
              label="Deploy Success Rate"
              value={metrics.deploySuccess}
              suffix="%"
              decimals={1}
              accent={metrics.deploySuccess > 98 ? "success" : "warning"}
              spark={spark(3, 24, metrics.deploySuccess - 3, 5)}
            />
            <Metric
              label="Avg Latency"
              value={metrics.latencyMs}
              suffix="ms"
              accent={metrics.latencyMs < 40 ? "success" : metrics.latencyMs < 80 ? "warning" : "warning"}
              spark={spark(4, 24, metrics.latencyMs - 10, 15)}
            />
            <Metric
              label="Monitoring Probes"
              value={metrics.probes}
              accent="cyan"
              spark={spark(5, 24, metrics.probes - 10, 8)}
            />
            <Metric
              label="Requests / min"
              value={metrics.requestsPerMin}
              accent={regionId === "ap-south-1" ? "warning" : regionId === "eu-west-1" ? "warning" : "cyan"}
              spark={spark(6, 24, metrics.requestsPerMin - 200, 300)}
            />
          </div>

          {/* Operator ID Card */}
          <div className="col-span-12 lg:col-span-4">
            <OperatorCard pulse={pulse} />
          </div>

          {/* Throughput sparkline */}
          <div className="col-span-12 lg:col-span-8">
            <Panel title="Cluster Request Throughput" id="throughput-panel" badge={<span className="text-success flex items-center gap-1.5"><StatusDot /> live sync</span>}>
              <Sparkline
                key={regionId}
                data={spark(99, 64, metrics.requestsPerMin / 100, metrics.requestsPerMin / 80)}
                h={120}
                color={'var(--throughput)'}
              />
            </Panel>
          </div>

          {/* Active Alerts — region-specific */}
          <div className="col-span-12 lg:col-span-4">
            <Panel title="Active Alerts &amp; Diagnostic Logs" id="alerts-panel">
              <div className="text-[10px] text-muted-foreground/60 font-mono mb-2 uppercase tracking-wider select-none">
                CLICK LOG TO AUDIT SOURCE
              </div>
              <motion.ul
                key={regionId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-2.5 font-mono text-xs"
              >
                {alerts.map((a, i) => (
                  <li
                    key={i}
                    onClick={() => triggerHighlight(a.target)}
                    className="flex items-center justify-between gap-3 text-muted-foreground border border-border/20 bg-black/15 rounded p-2.5 cursor-pointer transition-all duration-300 group"
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--badge-border)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--badge-text)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "";
                      (e.currentTarget as HTMLElement).style.color = "";
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <StatusDot s={a.s as any} />
                      <span className="truncate">{a.t}</span>
                    </div>
                    <span
                      className="text-[9px] text-muted-foreground/30 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: 'var(--badge-text)' }}
                    >
                      AUDIT ↗
                    </span>
                  </li>
                ))}
              </motion.ul>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

function OperatorCard({ pulse }: { pulse: number }) {
  const { theme } = useSimulation();
  const isMobile = useIsMobile();
  return (
    <div className="glass rounded-lg p-5 relative overflow-hidden h-full border flex flex-col justify-between group transition-all duration-500"
      style={{ borderColor: 'var(--badge-border)' }}>
      <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-cyan/5 to-purple/5 z-0" />
      {/* blur-3xl glow: desktop only */}
      {!isMobile && (
        <div
          className="absolute -top-12 -right-12 h-44 w-44 rounded-full blur-3xl transition-colors duration-500"
          style={{ background: `var(--primary-22)` }}
        />
      )}
      <div className="relative z-10 select-none">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--badge-text)' }}>
          <span>// operator credential</span>
          <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-success" /> SECURE</span>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-md grid place-items-center text-3xl font-extrabold text-background font-display select-none"
              style={{ background: `linear-gradient(135deg, var(--primary), var(--secondary))` }}>
              H
            </div>
            {/* Pulse ring: desktop only — fires a new FM animation on every pulse interval */}
            {!isMobile && (
              <motion.span
                key={pulse}
                className="absolute -inset-1.5 rounded-md pointer-events-none z-10"
                style={{ border: `1px solid var(--primary)` }}
                initial={{ opacity: 0.8, scale: 0.95 }}
                animate={{ opacity: 0, scale: 1.35 }}
                transition={{ duration: 1.8 }}
              />
            )}
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-black/60 border border-border/40 grid place-items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-foreground font-display">HEET CHOKSHI</div>
            <div className="text-xs text-muted-foreground/90 font-medium">Software &amp; DevOps Engineer</div>
            <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">Ahmedabad, Gujarat, India · IST</div>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-6 select-none flex items-center justify-between">
        <div className="font-mono text-[10px] border bg-success/10 px-3 py-1.5 rounded flex items-center gap-2 tracking-widest font-semibold text-success border-success/30">
          <UserCheck size={12} /> AVAILABLE FOR OPPORTUNITIES
        </div>
      </div>
      <div className="relative z-10 mt-5 pt-4 border-t border-border/10 grid grid-cols-3 gap-2 font-mono text-[9px] text-muted-foreground/75 select-none">
        <div className="rounded border border-border/40 bg-black/10 p-2 text-center">
          <div className="font-bold text-xs font-display" style={{ color: 'var(--badge-text)' }}>~6m</div>
          experience
        </div>
        <div className="rounded border border-border/40 bg-black/10 p-2 text-center">
          <div className="font-bold text-xs font-display" style={{ color: 'var(--badge-text)' }}>{theme.metrics.containers}</div>
          containers
        </div>
        <div className="rounded border border-border/40 bg-black/10 p-2 text-center">
          <div className="font-bold text-xs font-display" style={{ color: 'var(--badge-text)' }}>3</div>
          live apps
        </div>
      </div>
    </div>
  );
}

function NetworkBackdrop({ color }: { color: string }) {
  const isMobile = useIsMobile();
  // Mobile: render nothing — 14 motion.circle infinite animations is the
  // single biggest remaining source of FM overhead on the mission screen.
  if (isMobile) return null;
  const nodes = Array.from({ length: 14 }, (_, i) => ({
    x: 5 + ((i * 73) % 90),
    y: 10 + ((i * 41) % 80),
    r: 2 + (i % 3),
  }));
  return (
    <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
      {nodes.map((a, i) => nodes.slice(i + 1).map((b, j) => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 30) return null;
        return <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="0.08" opacity="0.3" />;
      }))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i} cx={n.x} cy={n.y} r={n.r / 7} fill={color}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2.2 + (i % 3), repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </svg>
  );
}

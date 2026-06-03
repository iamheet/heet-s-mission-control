import { Panel, Metric, SectionHeader, StatusDot, Sparkline } from "./primitives";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { seededSpark } from "./rand";

const spark = (seed: number, n = 24, base = 50, amp = 30) => seededSpark(seed, n, base, amp);

export function Overview() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => { const i = setInterval(() => setPulse(p => p + 1), 1800); return () => clearInterval(i); }, []);
  return (
    <section className="relative">
      <NetworkBackdrop />
      <div className="relative">
        <SectionHeader id="overview" kicker="// section 01" title="Mission Control Overview" desc="Real-time operational telemetry across infrastructure, deployments and monitoring planes." />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            <Metric label="Infra Health" value={99.97} suffix="%" decimals={2} accent="success" spark={spark(1, 24, 95, 5)} />
            <Metric label="Containers Running" value={47} accent="cyan" spark={spark(2, 24, 40, 10)} />
            <Metric label="Deploy Success Rate" value={98.4} suffix="%" decimals={1} accent="success" spark={spark(3, 24, 95, 6)} />
            <Metric label="System Uptime" value={742} suffix="d" accent="purple" spark={spark(4, 24, 700, 50)} />
            <Metric label="Monitoring Probes" value={128} accent="cyan" spark={spark(5, 24, 120, 10)} />
            <Metric label="Cloud Services" value={14} accent="warning" spark={spark(6, 24, 12, 4)} />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <OperatorCard pulse={pulse} />
          </div>
          <div className="col-span-12 lg:col-span-8">
            <Panel title="Cluster Throughput" badge={<span className="text-success">+ live</span>}>
              <Sparkline data={spark(99, 64, 60, 40)} h={120} color="var(--cyan)" />
            </Panel>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <Panel title="Active Alerts">
              <ul className="space-y-2 font-mono text-xs">
                {[
                  { s: "ok", t: "prometheus scrape: healthy" },
                  { s: "ok", t: "nginx upstream: 200" },
                  { s: "warn", t: "node-2 mem 78%" },
                  { s: "ok", t: "tls cert: 84d left" },
                ].map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <StatusDot s={a.s as any} /> <span>{a.t}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

function OperatorCard({ pulse }: { pulse: number }) {
  return (
    <div className="glass rounded-lg p-5 relative overflow-hidden h-full">
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-purple/20 blur-3xl" />
      <div className="font-mono text-[10px] uppercase tracking-widest text-cyan">// operator</div>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative">
          <div className="h-14 w-14 rounded-md bg-gradient-to-br from-cyan/40 to-purple/60 grid place-items-center text-2xl font-bold text-background">H</div>
          <motion.span key={pulse} className="absolute -inset-1 rounded-md border border-cyan/60" initial={{ opacity: 0.6, scale: 1 }} animate={{ opacity: 0, scale: 1.4 }} transition={{ duration: 1.8 }} />
        </div>
        <div>
          <div className="text-lg font-semibold">HEET CHOKSHI</div>
          <div className="text-xs text-muted-foreground">Software & DevOps Engineer</div>
          <div className="text-[11px] text-muted-foreground font-mono">Ahmedabad, India · IST</div>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs flex items-center gap-2 text-success">
        <StatusDot s="ok" /> AVAILABLE FOR OPPORTUNITIES
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] text-muted-foreground">
        <div className="rounded border border-border/60 p-2"><div className="text-foreground">2y+</div>experience</div>
        <div className="rounded border border-border/60 p-2"><div className="text-foreground">14</div>tech stack</div>
        <div className="rounded border border-border/60 p-2"><div className="text-foreground">3</div>systems</div>
      </div>
    </div>
  );
}

function NetworkBackdrop() {
  const nodes = Array.from({ length: 14 }, (_, i) => ({
    x: 5 + ((i * 73) % 90),
    y: 10 + ((i * 41) % 80),
    r: 2 + (i % 3),
  }));
  return (
    <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
      {nodes.map((a, i) => nodes.slice(i + 1).map((b, j) => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 30) return null;
        return <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--cyan)" strokeWidth="0.08" opacity="0.4" />;
      }))}
      {nodes.map((n, i) => (
        <motion.circle key={i} cx={n.x} cy={n.y} r={n.r / 8} fill="var(--cyan)"
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </svg>
  );
}

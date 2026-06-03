import { motion } from "framer-motion";
import { SectionHeader, Panel } from "./primitives";
import { useEffect, useState } from "react";

function useSeries(n = 60, base = 50, amp = 30) {
  const [data, setData] = useState(() =>
    Array.from({ length: n }, (_, i) => base + Math.sin(i / 3) * amp + (Math.random() - 0.5) * amp * 0.6)
  );
  useEffect(() => {
    const i = setInterval(() => {
      setData(prev => {
        const next = prev.slice(1);
        const last = prev[prev.length - 1];
        const v = Math.max(0, Math.min(100, last + (Math.random() - 0.5) * 14));
        return [...next, v];
      });
    }, 800);
    return () => clearInterval(i);
  }, []);
  return data;
}

function Chart({ data, color, area = true }: { data: number[]; color: string; area?: boolean }) {
  const w = 300, h = 90;
  const step = w / (data.length - 1);
  const max = 100, min = 0;
  const norm = (v: number) => h - ((v - min) / (max - min)) * h;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${norm(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: h }}>
      <defs>
        <linearGradient id={`g-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={0} x2={w} y1={h * p} y2={h * p} stroke="var(--grid-line)" strokeWidth="0.5" />
      ))}
      {area && <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#g-${color})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

const CHARTS = [
  { t: "CPU Usage", c: "var(--cyan)", u: "%" },
  { t: "Memory Usage", c: "var(--purple)", u: "%" },
  { t: "Network Traffic", c: "var(--success)", u: "MB/s" },
  { t: "Response Time", c: "var(--warning)", u: "ms" },
  { t: "Error Rate", c: "var(--destructive)", u: "%" },
  { t: "Container Health", c: "var(--cyan)", u: "%" },
];

export function Observability() {
  return (
    <section>
      <SectionHeader id="observe" kicker="// section 04" title="Observability Center" desc="Grafana-inspired live dashboards streaming from production probes." />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHARTS.map(c => <ChartCard key={c.t} title={c.t} color={c.c} unit={c.u} />)}
      </div>
    </section>
  );
}
function ChartCard({ title, color, unit }: { title: string; color: string; unit: string }) {
  const data = useSeries();
  const last = data[data.length - 1];
  return (
    <Panel title={title} badge={<motion.span key={Math.round(last)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-foreground tabular-nums">{last.toFixed(1)}{unit}</motion.span>}>
      <Chart data={data} color={color} />
    </Panel>
  );
}

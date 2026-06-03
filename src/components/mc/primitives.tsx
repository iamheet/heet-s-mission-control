import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export function Panel({ title, badge, children, className = "" }: { title?: string; badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-cyan led" /> {title}</span>
          {badge}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function SectionHeader({ id, kicker, title, desc }: { id: string; kicker: string; title: string; desc?: string }) {
  return (
    <div id={id} className="mb-6 scroll-mt-24">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan">{kicker}</div>
      <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">{title}</h2>
      {desc && <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{desc}</p>}
    </div>
  );
}

export function AnimatedNumber({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now(); const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{v.toFixed(decimals)}{suffix}</span>;
}

export function Metric({ label, value, suffix, decimals = 0, accent = "cyan", spark }: { label: string; value: number; suffix?: string; decimals?: number; accent?: "cyan" | "purple" | "success" | "warning"; spark?: number[] }) {
  const accentVar = { cyan: "var(--cyan)", purple: "var(--purple)", success: "var(--success)", warning: "var(--warning)" }[accent];
  return (
    <div className="glass rounded-lg p-4 relative overflow-hidden">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums" style={{ color: accentVar }}>
        <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
      </div>
      {spark && <Sparkline data={spark} color={accentVar} />}
    </div>
  );
}

export function Sparkline({ data, color = "var(--cyan)", h = 32 }: { data: number[]; color?: string; h?: number }) {
  const w = 120;
  const max = Math.max(...data), min = Math.min(...data);
  const norm = (v: number) => h - ((v - min) / Math.max(0.0001, max - min)) * h;
  const step = w / (data.length - 1);
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${norm(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" preserveAspectRatio="none" style={{ height: h }}>
      <motion.path d={d} fill="none" stroke={color} strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity="0.15" />
    </svg>
  );
}

export function StatusDot({ s = "ok" }: { s?: "ok" | "warn" | "err" }) {
  const c = s === "ok" ? "bg-success text-success" : s === "warn" ? "bg-warning text-warning" : "bg-destructive text-destructive";
  return <span className={`inline-block h-2 w-2 rounded-full led ${c}`} />;
}

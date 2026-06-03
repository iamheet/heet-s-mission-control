import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export function Panel({ title, badge, children, className = "" }: { title?: string; badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`glass rounded-lg overflow-hidden relative group ${className}`}
    >
      {/* hover sheen */}
      <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "linear-gradient(120deg, transparent 30%, oklch(0.78 0.16 210 / 0.06) 50%, transparent 70%)" }} />
      {title && (
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-cyan led" /> {title}</span>
          {badge}
        </div>
      )}
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

export function SectionHeader({ id, kicker, title, desc }: { id: string; kicker: string; title: string; desc?: string }) {
  return (
    <div id={id} className="mb-8 scroll-mt-24">
      <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }}
        className="font-mono text-[11px] uppercase tracking-[0.4em] text-cyan flex items-center gap-3">
        <span className="h-px w-8 bg-cyan/60" />{kicker}
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: 0.05 }}
        className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
        {title}
      </motion.h2>
      {desc && (
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: 0.15 }}
          className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl">{desc}</motion.p>
      )}
    </div>
  );
}

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
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
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="glass rounded-lg p-4 relative overflow-hidden group"
    >
      <span className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ background: accentVar }} />
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center justify-between">
        <span>{label}</span>
        <motion.span className="h-1 w-1 rounded-full" style={{ background: accentVar, boxShadow: `0 0 8px ${accentVar}` }}
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
      </div>
      <div className="mt-1.5 text-2xl md:text-3xl font-semibold tabular-nums text-glow-cyan" style={{ color: accentVar }}>
        <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
      </div>
      {spark && <Sparkline data={spark} color={accentVar} />}
    </motion.div>
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

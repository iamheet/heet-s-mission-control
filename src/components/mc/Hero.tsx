import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { mulberry32 } from "./rand";

const ORBITS = [
  { r: 18, dur: 28, items: [
    { l: "AWS EC2", c: "var(--cyan)" },
    { l: "S3", c: "var(--cyan)" },
    { l: "Route53", c: "var(--cyan)" },
  ]},
  { r: 30, dur: 44, items: [
    { l: "Docker", c: "var(--purple)" },
    { l: "Kubernetes", c: "var(--purple)" },
    { l: "Nginx", c: "var(--purple)" },
    { l: "GitHub Actions", c: "var(--purple)" },
  ]},
  { r: 42, dur: 64, items: [
    { l: "Prometheus", c: "var(--success)" },
    { l: "Grafana", c: "var(--success)" },
    { l: "Postgres", c: "var(--success)" },
    { l: "Redis", c: "var(--success)" },
    { l: "OpenAI", c: "var(--success)" },
  ]},
];

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 80, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 80, damping: 18 });
  const tx = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), { stiffness: 60, damping: 20 });
  const ty = useSpring(useTransform(my, [-0.5, 0.5], [-12, 12]), { stiffness: 60, damping: 20 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <section ref={ref} className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* scene */}
      <motion.div
        className="absolute inset-0"
        style={{ perspective: 1400 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        >
          <OrbitScene />
        </motion.div>
      </motion.div>

      {/* scanline + grid sweep */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent opacity-60"
        animate={{ y: ["0%", "100vh"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* copy */}
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 md:px-6 w-full">
        <motion.div style={{ x: tx, y: ty }} className="max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-mono text-[11px] uppercase tracking-[0.4em] text-cyan flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-success led" />
            heet · os — mission control online
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-6 text-[clamp(2.6rem,8vw,7rem)] font-semibold leading-[0.95] tracking-tight"
            style={{ background: "linear-gradient(180deg, oklch(0.99 0.02 240) 30%, oklch(0.72 0.16 230) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            HEET<br />CHOKSHI
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="mt-4 text-lg md:text-2xl text-foreground/85">
            Software &amp; DevOps Engineer
          </motion.div>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mt-6 space-y-1.5 font-mono text-sm md:text-base text-muted-foreground">
            {["building production systems", "automating deployments", "monitoring infrastructure"].map((s, i) => (
              <motion.li key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.12 }}>
                <span className="text-cyan">▸</span> {s}
              </motion.li>
            ))}
          </motion.ul>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}
            className="mt-10 flex flex-wrap items-center gap-3">
            <a href="#overview" className="glass rounded-md px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-foreground hover:text-cyan transition-colors glow-cyan">
              ↳ enter mission control
            </a>
            <a href="#contact" className="rounded-md border border-border/60 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-cyan/40 transition-colors">
              open channel
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* bottom fade into next section */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-32 bg-gradient-to-b from-transparent to-background" />

      {/* scroll hint */}
      <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground flex flex-col items-center gap-2"
        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
        scroll
        <span className="h-6 w-px bg-cyan/60" />
      </motion.div>
    </section>
  );
}

function OrbitScene() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative aspect-square w-[min(120vh,120vw)] max-w-[1200px]">
        {/* core */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.85 0.2 220 / 0.7), oklch(0.5 0.2 240 / 0.2) 60%, transparent)" }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-cyan led" />

        {ORBITS.map((o, i) => (
          <div key={i} className="absolute inset-0 grid place-items-center">
            {/* ring */}
            <div
              className="absolute rounded-full border"
              style={{
                width: `${o.r * 2}%`, height: `${o.r * 2}%`,
                borderColor: "oklch(0.7 0.1 230 / 0.18)",
              }}
            />
            {/* orbiting items */}
            <motion.div
              className="absolute"
              style={{ width: `${o.r * 2}%`, height: `${o.r * 2}%` }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: o.dur, repeat: Infinity, ease: "linear" }}
            >
              {o.items.map((it, k) => {
                const angle = (k / o.items.length) * 360;
                return (
                  <div
                    key={it.l}
                    className="absolute left-1/2 top-1/2"
                    style={{ transform: `rotate(${angle}deg) translate(${o.r}%) rotate(-${angle}deg)` }}
                  >
                    <motion.div
                      animate={{ rotate: i % 2 === 0 ? -360 : 360 }}
                      transition={{ duration: o.dur, repeat: Infinity, ease: "linear" }}
                      className="-translate-x-1/2 -translate-y-1/2"
                    >
                      <Node label={it.l} color={it.c} />
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Node({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md glass px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest"
      style={{ boxShadow: `0 0 16px ${color}33, 0 0 2px ${color}66` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="text-foreground/90">{label}</span>
    </div>
  );
}

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * 3D Parallax Tilt Card
 * Desktop: full mouse-tracking spring tilt + spotlight glow.
 * Mobile:  renders a plain div — zero motion values, zero listeners, zero springs.
 */
export function TiltCard({ children, className = "", style = {} }: { children: ReactNode; className?: string; style?: any }) {
  const isMobile = useIsMobile();
  // Mobile: skip entirely — plain wrapper, zero cost
  if (isMobile) {
    return <div className={`relative ${className}`} style={style}>{children}</div>;
  }
  return <TiltCardDesktop className={className} style={style}>{children}</TiltCardDesktop>;
}

function TiltCardDesktop({ children, className = "", style = {} }: { children: ReactNode; className?: string; style?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [2, -2]), { stiffness: 120, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-2, 2]), { stiffness: 120, damping: 25 });
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);
  const [hovering, setHovering] = useState(false);
  const backgroundGlow = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(180px circle at ${gx}px ${gy}px, color-mix(in oklch, var(--rp) 8%, transparent), transparent 80%)`
  );
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
    glowX.set(e.clientX - r.left);
    glowY.set(e.clientY - r.top);
  };
  const onLeave = () => { setHovering(false); x.set(0); y.set(0); };
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }}
      className={`relative ${className}`}
    >
      <div style={{ transform: "translateZ(8px)", transformStyle: "preserve-3d" }} className="h-full w-full">
        {children}
      </div>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-lg z-10 transition-opacity duration-300"
        style={{ background: backgroundGlow, opacity: hovering ? 1 : 0 }}
      />
    </motion.div>
  );
}

export function Panel({ title, badge, children, className = "", id }: { title?: string; badge?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  const [telemetry, setTelemetry] = useState({ statA: "LDR.SYS // OK", statB: "SYS_TEMP // 36.4C" });
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (title) {
      const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const sysId = (hash % 100).toString().padStart(2, "0");
      const load = (12 + (hash % 40)).toString();
      const code = ["NOMINAL", "ACTIVE", "SECURE", "STABLE", "ROUTING"][hash % 5];
      setTelemetry({
        statA: `SYS.${sysId} // ${code}`,
        statB: `CORE_LOAD // ${load}%`
      });
    }
  }, [title]);

  useEffect(() => {
    if (!id) return;
    const handleHighlight = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.id === id) {
        setHighlighted(true);
        setTimeout(() => setHighlighted(false), 2200);
      }
    };
    window.addEventListener("highlight-section", handleHighlight);
    return () => window.removeEventListener("highlight-section", handleHighlight);
  }, [id, title]);

  return (
    <div id={id} className="scroll-mt-24">
      <TiltCard className="group h-full">
        <div 
          className={`glass rounded-lg overflow-hidden relative flex flex-col h-full border ${
            highlighted 
              ? "r-border r-glow scale-[1.015]" 
              : "border-border/30"
          } ${className}`}
          style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Neon Border top-glow */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[color:var(--rp)]/35 to-transparent group-hover:via-[color:var(--rp)]/70 transition-all duration-500 z-20"
            style={{ background: `linear-gradient(90deg, transparent, color-mix(in oklch, var(--rp) 35%, transparent), transparent)` }}
          />
          
          {title && (
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-black/20 select-none">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full r-led" /> 
                {title}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-muted-foreground/40 hidden sm:inline font-mono">{telemetry.statA}</span>
                {badge}
              </div>
            </div>
          )}
          
          <div className="p-4 flex-1 flex flex-col relative z-10">{children}</div>

          {title && (
            <div className="border-t border-border/10 px-4 py-1.5 flex items-center justify-between gap-2 font-mono text-[8px] text-muted-foreground/30 bg-black/10 select-none">
              <span className="truncate">MON_UPLINK // ACTIVE</span>
              <span className="shrink-0">{telemetry.statB}</span>
            </div>
          )}
        </div>
      </TiltCard>
    </div>
  );
}

export function SectionHeader({ id, kicker, title, desc }: { id: string; kicker: string; title: string; desc?: string }) {
  const [isActive, setIsActive] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleActiveChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsActive(customEvent.detail?.id === id);
    };
    window.addEventListener("active-section-change", handleActiveChange);
    return () => window.removeEventListener("active-section-change", handleActiveChange);
  }, [id]);

  return (
    <div id={id} className="mb-10 scroll-mt-24 relative select-none">
      <div className="absolute -left-4 top-0 bottom-0 w-px"
        style={{ background: `linear-gradient(to bottom, color-mix(in oklch, var(--rp) 40%, transparent), color-mix(in oklch, var(--rs) 20%, transparent), transparent)` }}
      />
      <div className="pl-4">
        <motion.div
          animate={{ opacity: 1, x: 0, color: isActive ? "var(--rp)" : "oklch(0.78 0.16 210 / 0.7)" }}
          initial={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="font-mono text-[9px] uppercase tracking-[0.3em] flex items-center gap-2"
        >
          <motion.span
            className="h-px r-bg"
            style={{ background: "var(--rp)" }}
            animate={{ width: isActive ? 36 : 24, opacity: isActive ? 0.9 : 0.4 }}
            transition={{ duration: 0.4 }}
          />
          {kicker}
        </motion.div>
        {/* Mobile: plain h2 with CSS class swap — no textShadow paint on every isActive change */}
        {isMobile ? (
          <h2 className={`mt-3 text-3xl md:text-5xl font-medium tracking-tight text-foreground ${isActive ? "r-text" : ""}`}>
            {title}
          </h2>
        ) : (
          <motion.h2
            animate={{
              opacity: 1, y: 0,
              textShadow: isActive
                ? "0 0 20px color-mix(in oklch, var(--rp) 35%, transparent), 0 0 2px color-mix(in oklch, var(--rp) 50%, transparent)"
                : "0 2px 16px oklch(0 0 0 / 0.3)"
            }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-3 text-3xl md:text-5xl font-medium tracking-tight text-foreground transition-all duration-500"
          >
            {title}
          </motion.h2>
        )}
        {desc && (
          <motion.p
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-sm md:text-base text-muted-foreground/90 max-w-3xl leading-relaxed"
          >
            {desc}
          </motion.p>
        )}
      </div>
    </div>
  );
}

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const observe = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Large rootMargin ensures content is pre-rendered well before entering view
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "500px 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const cleanup = observe();
    return cleanup;
  }, [observe]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

export function AnimatedNumber({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; 
    const start = performance.now(); 
    const dur = 1500;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4); // Quartic ease out
      setV(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{v.toFixed(decimals)}{suffix}</span>;
}

export function Metric({ label, value, suffix, decimals = 0, accent = "cyan", spark }: { label: string; value: number; suffix?: string; decimals?: number; accent?: "cyan" | "purple" | "success" | "warning"; spark?: number[] }) {
  const isMobile = useIsMobile();
  const accentVar = { cyan: "var(--rp)", purple: "var(--purple)", success: "var(--success)", warning: "var(--warning)" }[accent];
  const glowTextClass = isMobile ? "" : ({ cyan: "r-text-glow", purple: "text-glow-purple", success: "text-glow-success", warning: "text-glow-warning" }[accent]);
  return (
    <TiltCard className="group h-full">
      <div className="glass rounded-lg p-4 relative overflow-hidden h-full border border-border/30">
        {/* Hover glow: desktop only — blur-2xl on a span inside every metric card adds up on mobile */}
        {!isMobile && (
          <span className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full blur-2xl opacity-20 group-hover:opacity-50 transition-opacity"
            style={{ background: accentVar }} />
        )}
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80 flex items-center justify-between">
          <span>{label}</span>
          {/* LED pulse dot: on mobile use a static dot — saves one FM animation per metric card */}
          {isMobile
            ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: accentVar, opacity: 0.7 }} />
            : <motion.span className="h-1.5 w-1.5 rounded-full led" style={{ background: accentVar }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }} />
          }
        </div>
        <div className={`mt-2 text-2xl md:text-3xl font-semibold tracking-tight tabular-nums ${glowTextClass}`} style={{ color: accentVar }}>
          {/* AnimatedNumber runs a rAF loop per metric. On mobile show static value. */}
          {isMobile
            ? <span>{value.toFixed(decimals)}{suffix}</span>
            : <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
          }
        </div>
        {spark && (
          <div className="mt-4 pt-1 border-t border-border/10">
            <Sparkline data={spark} color={accentVar} />
          </div>
        )}
      </div>
    </TiltCard>
  );
}

export function Sparkline({ data, color = "var(--rp)", h = 36 }: { data: number[]; color?: string; h?: number }) {
  const isMobile = useIsMobile();
  const w = 150;
  const max = Math.max(...data), min = Math.min(...data);
  const norm = (v: number) => h - ((v - min) / Math.max(0.0001, max - min)) * h;
  const step = w / (data.length - 1);
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${norm(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: h }}>
      {/* Mobile: static path — no pathLength animation (saves FM + layout per sparkline) */}
      {isMobile
        ? <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
        : <motion.path d={d} fill="none" stroke={color} strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
      }
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity="0.08" />
    </svg>
  );
}

export function StatusDot({ s = "ok" }: { s?: "ok" | "warn" | "err" }) {
  const c = s === "ok" ? "bg-success text-success" : s === "warn" ? "bg-warning text-warning" : "bg-destructive text-destructive";
  return <span className={`inline-block h-2 w-2 rounded-full led ${c}`} />;
}

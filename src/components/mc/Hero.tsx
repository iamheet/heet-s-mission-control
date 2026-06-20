import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Command, Terminal as TerminalIcon, Cpu, Globe, Database, Layers, ShieldCheck, Activity } from "lucide-react";
import { useSimulation, type RegionTheme } from "./regionTheme";
import { useIsMobile } from "@/hooks/use-mobile";

export function Hero() {
  const { theme, regionId, simSpeed } = useSimulation();
  const isMobile = useIsMobile();

  const [metrics, setMetrics] = useState(theme.metrics);

  useEffect(() => {
    setMetrics(theme.metrics);
    const interval = Math.max(800, 2000 / simSpeed);
    const i = setInterval(() => {
      setMetrics((prev) => ({
        ...theme.metrics,
        cpu: Math.max(0, Math.min(100, theme.metrics.cpu + Math.floor(Math.random() * 7 - 3))),
        memory: Math.max(0, Math.min(100, theme.metrics.memory + Math.floor(Math.random() * 5 - 2))),
        latencyMs: Math.max(0, theme.metrics.latencyMs + Math.floor(Math.random() * 15 - 7)),
      }));
    }, interval);
    return () => clearInterval(i);
  }, [theme.metrics, simSpeed]);

  return (
    <section className="relative min-h-[96vh] flex items-center overflow-hidden pt-12">

      {/* ── CINEMATIC ATMOSPHERE ─────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden">

        {/* Layer 1: Main Region Bloom — skip on mobile (blur-[140px] is a compositor killer) */}
        {!isMobile && (
          <motion.div
            key={`hero-bloom-1-${regionId}`}
            className="absolute rounded-full blur-[140px] md:blur-[240px]"
            style={{
              top: "10%", right: "-10%",
              width: "75vw", height: "75vh",
              background: `radial-gradient(circle, color-mix(in oklch, var(--rp) 24%, transparent), transparent 72%)`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Mobile bloom replacement — flat radial, no filter */}
        {isMobile && (
          <div
            className="absolute rounded-full"
            style={{
              top: "5%", right: "-15%",
              width: "80vw", height: "60vw",
              background: `radial-gradient(circle, color-mix(in oklch, var(--rp) 14%, transparent) 0%, transparent 70%)`,
              opacity: 0.6,
            }}
          />
        )}

        {/* Layer 2: Secondary Ambient Wash — desktop only */}
        {!isMobile && (
          <motion.div
            key={`hero-bloom-2-${regionId}`}
            className="absolute rounded-full blur-[120px] md:blur-[180px]"
            style={{
              bottom: "10%", left: "-15%",
              width: "55vw", height: "55vh",
              background: `radial-gradient(circle, color-mix(in oklch, var(--rs) 14%, transparent), transparent 68%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 2.5, delay: 0.4 }}
          />
        )}

        {/* Layer 3: Cinematic Light Rays — desktop only */}
        {!isMobile && (
          <motion.div
            key={`hero-rays-${regionId}`}
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            transition={{ duration: 3, delay: 0.8 }}
          >
            <div
              className="absolute top-[-20%] right-[10%] w-[1px] h-[150%] rotate-[-25deg] blur-[4px]"
              style={{ background: `linear-gradient(to bottom, var(--rp), transparent)` }}
            />
            <div
              className="absolute top-[-10%] right-[25%] w-[2px] h-[130%] rotate-[-20deg] blur-[6px] opacity-40"
              style={{ background: `linear-gradient(to bottom, var(--rs), transparent)` }}
            />
            <div
              className="absolute top-[-30%] right-[15%] w-[1px] h-[160%] rotate-[-30deg] blur-[2px] opacity-60"
              style={{ background: `linear-gradient(to bottom, #fff, transparent)` }}
            />
          </motion.div>
        )}

        {/* HUD Elements — skip grain & scanline on mobile (paint cost) */}
        {!isMobile && <div className="absolute inset-0 hudo-grid opacity-[0.05]" />}
        {!isMobile && <div className="absolute inset-0 scanline opacity-[0.015]" />}
        {!isMobile && (
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
          />
        )}

        {/* Cinematic Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 65% 50%, transparent 25%, oklch(0.08 0.02 260 / 0.75) 100%)`,
          }}
        />

        {/* Fade to page content */}
        <div className="absolute bottom-0 inset-x-0 h-80 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* ── MAIN CONTENT GRID ───────────────────────────────────────────── */}
      <div className="relative z-20 mx-auto max-w-[1600px] px-4 sm:px-6 md:px-12 w-full py-10 sm:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">

          {/* ── LEFT COLUMN: IDENTITY & COMMANDS (6/12) ────────────────── */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-6 sm:space-y-8 lg:space-y-12">
            
            {/* HUD Status Header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`hud-header-${regionId}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-6"
              >
                <div className="flex items-center gap-3 font-mono">
                  <span className="h-2 w-2 rounded-full r-led animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.6em] font-bold r-text-glow r-text">
                    {theme.hero.regionCode}
                  </span>
                </div>
                <div className="h-px w-16 bg-border/40" />
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/40">
                  <TerminalIcon size={10} />
                  <span>{theme.hero.operationLabel}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Typography Core */}
            <div className="space-y-8 w-full">
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[clamp(2.5rem,15vw,7.8rem)] font-bold leading-[0.85] tracking-tighter font-display r-text-glow"
                  style={{
                    background: `linear-gradient(170deg, #fff 35%, color-mix(in oklch, var(--rp) 85%, transparent) 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  HEET<br />CHOKSHI
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="flex items-center gap-3 sm:gap-5"
                >
                  <div className="h-px w-10 sm:w-16 r-bar shadow-glow" />
                  <span className="text-lg sm:text-2xl md:text-3xl font-medium font-display text-foreground/80 tracking-tight">
                    Software & DevOps Engineer
                  </span>
                </motion.div>
              </div>

              {/* Tagline / System Capabilities */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl"
              >
                {[
                  { icon: Globe, text: "Cloud Infrastructure" },
                  { icon: Cpu, text: "Automation Systems" },
                  { icon: Command, text: "Site Reliability" },
                  { icon: TerminalIcon, text: "AI Observability" }
                ].map((item, i) => (
                  <div key={item.text} className="flex items-center gap-3 group">
                    <item.icon size={12} className="text-muted-foreground/30 group-hover:r-text transition-colors duration-500" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 group-hover:text-foreground/70 transition-colors duration-500">
                      {item.text}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Call to Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-wrap items-center gap-8 pt-6"
            >
              <a
                href="#overview"
                className="group relative flex items-center gap-4 bg-foreground/5 hover:bg-foreground/10 px-10 py-5 border border-white/10 hover:border-white/20 transition-all duration-500 r-glow-hover"
              >
                <div className="absolute inset-0 r-glow opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
                <span className="font-mono text-[11px] uppercase tracking-[0.4em] font-bold r-text-glow r-text">
                  ↳ Start Mission
                </span>
                <div className="h-1 w-1 rounded-full r-led" />
              </a>

              <a
                href="#contact"
                className="group flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground/80 transition-all duration-300"
              >
                <span className="text-foreground/20 group-hover:r-text transition-colors">//</span>
                Uplink Channel
              </a>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: VISUAL SYSTEM + SUBJECT (6/12) ──────────── */}
          <div className="lg:col-span-6 flex justify-center items-center order-first lg:order-last relative">
            <div className="relative w-full aspect-square max-w-[620px] flex items-center justify-center">

              {/* Orbital System Overlay (Holographic) */}
              <div className="relative z-10 w-full h-full scale-[1.05]">
                <OrbitalSystem theme={theme} regionId={regionId} isMobile={isMobile} metrics={metrics} />
              </div>

              {/* Floating ID Tag (HUD Detail) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`id-tag-${regionId}`}
                  className="absolute top-1/4 -right-2 sm:-right-4 font-mono text-[7px] sm:text-[8px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-muted-foreground/30 border-l r-border pl-2 sm:pl-3 py-1 hidden sm:block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                >
                  PILOT_REF: {theme.shortLabel}<br />
                  BIO_SIG: ACTIVE
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* Cinematic Scroll Prompt — CSS animation instead of Framer Motion infinite */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <div className="h-12 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
        <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-muted-foreground/20">Observe System</span>
        <ArrowDown size={14} className="text-muted-foreground/20 hero-scroll-bounce" />
      </motion.div>
    </section>
  );
}

// ─── Orbital System Visual Identity ───────────────────────────────────────────
//
// MOBILE PERFORMANCE PROFILE (< 768px):
//   Before: ~14 Framer Motion infinite animations, blur-[80px] core, SVG filter on every node
//   After:  3 CSS animations, no blur, no SVG filter, no packet pulses, no counter-rotations
//   FPS estimate before: ~18-24 fps (mid-range Android)
//   FPS estimate after:  ~55-60 fps
//
// Desktop is unchanged — all effects remain at full fidelity.

// Mobile static snapshot — zero animation, zero filter, zero JS.
// Renders the same visual shape as the full OrbitalSystem but as a
// completely inert SVG: 1 gradient circle core + 2 rings + 6 hex nodes.
// Paint cost: one-time rasterise at mount, never repaints.
const ORBIT_R = 130;

function OrbitalSystemMobile() {
  const NODES = [
    { label: "AWS",    angle: -90 },
    { label: "K8S",    angle: -30 },
    { label: "DOCKER", angle:  30 },
    { label: "IAM",    angle:  90 },
    { label: "PROM",   angle: 150 },
    { label: "GH",     angle: 210 },
  ];
  return (
    <div className="relative w-full aspect-square max-w-[550px] flex items-center justify-center select-none pointer-events-none">
      <div
        className="absolute w-1/2 h-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, color-mix(in oklch, var(--rp) 35%, transparent) 0%, transparent 70%)",
          opacity: 0.35,
        }}
      />
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full relative z-10"
        overflow="visible"
      >
        <defs>
          <radialGradient id="mobileCore" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="35%" stopColor="var(--rp)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Static outer ring */}
        <circle cx="200" cy="200" r="170" fill="none" stroke="var(--rp)" strokeWidth="0.5" strokeOpacity="0.12" strokeDasharray="2 12" />

        {/* Rotating outer arc */}
        <g style={{ transformOrigin: "200px 200px", animation: "orbitalOuterSpin 90s linear infinite", willChange: "transform" }}>
          <circle cx="200" cy="200" r="170" fill="none" stroke="var(--rp)" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="40 120" />
          {[0, 90, 180, 270].map(deg => (
            <line key={deg} x1="200" y1="30" x2="200" y2="46" stroke="var(--rp)" strokeWidth="1" strokeOpacity="0.4" transform={`rotate(${deg}, 200, 200)`} />
          ))}
        </g>

        {/* Rotating hex frames only — no labels inside */}
        <g style={{ transformOrigin: "200px 200px", animation: "orbitalInnerSpin 50s linear infinite", willChange: "transform" }}>
          <circle cx="200" cy="200" r={ORBIT_R} fill="none" stroke="var(--rp)" strokeWidth="0.5" strokeOpacity="0.18" strokeDasharray="80 40" />
          {NODES.map(({ label, angle }) => {
            const rad = (angle * Math.PI) / 180;
            const nx = 200 + ORBIT_R * Math.cos(rad);
            const ny = 200 + ORBIT_R * Math.sin(rad);
            return (
              <g key={label} transform={`translate(${nx - 18}, ${ny - 18})`}>
                {/* Filled backdrop for contrast */}
                <circle cx="18" cy="18" r="16" fill="oklch(0.13 0.02 260 / 0.85)" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--rp)" strokeWidth="1.2" strokeOpacity="0.5" />
              </g>
            );
          })}
        </g>

        {/* Static label layer — always upright, never rotates */}
        {NODES.map(({ label, angle }) => {
          const rad = (angle * Math.PI) / 180;
          const nx = 200 + ORBIT_R * Math.cos(rad);
          const ny = 200 + ORBIT_R * Math.sin(rad);
          return (
            <text
              key={`label-${label}`}
              x={nx}
              y={ny + 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--rp)"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
              opacity="0.9"
            >
              {label}
            </text>
          );
        })}

        {/* Core */}
        <circle cx="200" cy="200" r="44" fill="url(#mobileCore)" opacity="0.8" />
        <circle
          cx="200" cy="200" r="28"
          fill="none" stroke="var(--rp)" strokeWidth="0.8" strokeDasharray="3 6" strokeOpacity="0.4"
          style={{ transformOrigin: "200px 200px", animation: "orbitalRingSpin 12s linear infinite", willChange: "transform" }}
        />
      </svg>
    </div>
  );
}

function OrbitalSystem({ theme, regionId, isMobile, metrics }: { theme: RegionTheme; regionId: string; isMobile: boolean; metrics: { cpu: number; memory: number; latencyMs: number } }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // On mobile: render the zero-cost static snapshot instead
  if (isMobile) return <OrbitalSystemMobile />;

  const speeds = {
    subtle:   { inner: 50, outer: 90, pulse: 6.5, data: 4 },
    moderate: { inner: 35, outer: 70, pulse: 5,   data: 3 },
    intense:  { inner: 22, outer: 45, pulse: 3.5, data: 2 },
  }[theme.hero.glowIntensity] || { inner: 40, outer: 80, pulse: 6, data: 3 };

  const services = [
    { label: "AWS",    icon: Globe,       angle: 0 },
    { label: "K8S",    icon: Layers,      angle: 60 },
    { label: "DOCKER", icon: Database,    angle: 120 },
    { label: "IAM",    icon: ShieldCheck, angle: 180 },
    { label: "PROM",   icon: Activity,    angle: 240 },
    { label: "GH",     icon: Command,     angle: 300 },
  ];

  return (
    <div className="relative w-full aspect-square max-w-[550px] flex items-center justify-center select-none pointer-events-none">
      <motion.div
        key={`visual-atmosphere-${regionId}`}
        className="absolute w-1/2 h-1/2 rounded-full blur-[80px]"
        style={{ background: `radial-gradient(circle, var(--rp) 45%, transparent 75%)`, opacity: 0.3 }}
        animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: speeds.pulse, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg viewBox="0 0 400 400" className="w-full h-full relative z-10 overflow-visible">
        <defs>
          <radialGradient id="systemCore" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="30%" stopColor="var(--rp)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="systemGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <symbol id="hex-frame" viewBox="0 0 40 46">
            <path d="M20 0L37.32 10V30L20 40L2.68 30V10L20 0Z" className="r-fill opacity-10" />
            <path d="M20 2L35.58 11V29L20 38L4.42 29V11L20 2Z" fill="none" stroke="var(--rp)" strokeWidth="1.5" className="r-stroke opacity-30" />
          </symbol>
        </defs>

        <g stroke="var(--primary-08)" fill="none" strokeWidth="0.8">
          <circle cx="200" cy="200" r="185" strokeDasharray="2 12" />
          <circle cx="200" cy="200" r="145" strokeDasharray="80 40" opacity="0.3" />
          <circle cx="200" cy="200" r="105" strokeDasharray="4 8" opacity="0.5" />
        </g>

        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: speeds.outer, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <path d="M 200,15 A 185,185 0 0,1 385,200" stroke="var(--rp)" strokeWidth="1.5" opacity="0.15" strokeDasharray="5 15" />
          <path d="M 200,385 A 185,185 0 0,1 15,200" stroke="var(--rp)" strokeWidth="1.5" opacity="0.15" strokeDasharray="5 15" />
          <g fill="var(--rp)" fontSize="7" className="font-mono opacity-40 uppercase tracking-[0.4em] font-bold">
            <text x="200" y="8" textAnchor="middle">{theme.hero.coordinates}</text>
            <text x="200" y="398" textAnchor="middle">
              SYS_TIME: {isMounted ? `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}` : "--:--"}_UTC
            </text>
          </g>
          {[0, 90, 180, 270].map(deg => (
            <line key={deg} x1="200" y1="10" x2="200" y2="25" stroke="var(--rp)" strokeWidth="1" opacity="0.4" transform={`rotate(${deg}, 200, 200)`} />
          ))}
        </motion.g>

        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: speeds.inner, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          {services.map((service, i) => {
            const rad = (service.angle * Math.PI) / 180;
            const nx = Math.round((200 + 145 * Math.cos(rad)) * 1e4) / 1e4;
            const ny = Math.round((200 + 145 * Math.sin(rad)) * 1e4) / 1e4;
            return (
              <g key={service.label}>
                <line x1="200" y1="200" x2={nx} y2={ny} stroke="var(--rp)" strokeWidth="0.5" opacity="0.08" strokeDasharray="4 6" />
                <g transform={`translate(${nx - 20}, ${ny - 23})`}>
                  <use href="#hex-frame" width="40" height="46" filter="url(#systemGlow)" />
                  <motion.g animate={{ rotate: 360 }} transition={{ duration: speeds.inner, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "20px 23px" }}>
                    <service.icon size={12} className="r-text opacity-40" x="14" y="17" />
                  </motion.g>
                  <motion.g animate={{ rotate: 360 }} transition={{ duration: speeds.inner, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "20px 23px" }}>
                    <text x="20" y="62" textAnchor="middle" fill="var(--rp)" fontSize="8" className="font-mono opacity-60 font-bold tracking-widest uppercase">{service.label}</text>
                  </motion.g>
                </g>
                <motion.circle r="1.8" fill="var(--rp)" filter="url(#systemGlow)"
                  animate={{ cx: [200, nx], cy: [200, ny], opacity: [0, 1, 0] }}
                  transition={{ duration: speeds.data, repeat: Infinity, delay: i * 0.7, ease: "easeInOut" }}
                />
              </g>
            );
          })}
        </motion.g>

        <motion.g
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: speeds.pulse, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle cx="200" cy="200" r="45" fill="url(#systemCore)" opacity="0.8" filter="url(#systemGlow)" />
          <circle cx="200" cy="200" r="30" fill="none" stroke="var(--rp)" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.4" />
          <motion.circle cx="200" cy="200" r="22" fill="none" stroke="var(--rp)" strokeWidth="1.5" strokeDasharray="15 35"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "200px 200px" }}
          />
        </motion.g>
      </svg>

      <AnimatePresence mode="wait">
        <motion.div
          key={`metrics-hud-${regionId}`}
          className="absolute -bottom-8 right-0 font-mono text-[9px] space-y-2 text-right pointer-events-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.5, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
        >
          <div className="flex flex-col gap-1 border-r-2 r-border pr-4">
            <div className="r-text font-bold">NODE_STATUS: ONLINE</div>
            <div className="text-muted-foreground/60">LOAD: {metrics.cpu}%</div>
            <div className="text-muted-foreground/60">MEM: {metrics.memory}%</div>
            <div className="text-muted-foreground/60">PING: {metrics.latencyMs}ms</div>
          </div>
          <div className="text-[7px] uppercase tracking-widest text-muted-foreground/30">
            Authenticated as: USER_ROOT
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Globe, Sliders, ChevronDown, FileDown, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useSimulation, REGION_THEMES, REGION_ORDER, type SimSpeed } from "./regionTheme";

const SPEEDS: { val: SimSpeed; label: string; desc: string }[] = [
  { val: 0.1, label: "PAUSED", desc: "No updates" },
  { val: 1,   label: "1X",     desc: "Slow updates" },
  { val: 2,   label: "2X",     desc: "Normal updates" },
  { val: 5,   label: "5X",     desc: "Rapid updates" },
];

export const NAV_ITEMS = [
  { id: "mission", label: "Mission Control" },
  { id: "infra",   label: "Infrastructure" },
  { id: "projects",label: "Project Systems" },
  { id: "operator",label: "Operator Profile" },
  { id: "terminal",label: "Terminal & Contact" },
];

interface TopBarProps {
  activeScreen: string;
  onScreenChange: (id: string) => void;
}

export function TopBar({ activeScreen, onScreenChange }: TopBarProps) {
  const [time, setTime] = useState("");
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { regionId, theme, simSpeed, setRegion, setSimSpeed } = useSimulation();

  // Close on outside click
  useEffect(() => {
    if (!showConfig) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowConfig(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showConfig]);

  useEffect(() => {
    const t = () => setTime(new Date().toUTCString().split(" ").slice(4, 5)[0] + " UTC");
    t();
    const i = setInterval(t, 1000);
    return () => clearInterval(i);
  }, []);

  // Track page scroll progress percentage
  useEffect(() => {
    const handleScrollProgress = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) setScrollProgress((window.scrollY / totalHeight) * 100);
    };
    // passive: true — lets the browser scroll without waiting for this handler
    window.addEventListener("scroll", handleScrollProgress, { passive: true });
    handleScrollProgress();
    return () => window.removeEventListener("scroll", handleScrollProgress);
  }, []);

  const handleSpeedChange = (speedVal: SimSpeed) => {
    setShowConfig(false);
    setSimSpeed(speedVal);
    window.dispatchEvent(new CustomEvent("sim-speed-change", { detail: { speed: speedVal } }));
  };

  const handleRegionChange = (rid: typeof regionId) => {
    setShowConfig(false);
    setRegion(rid);
    window.dispatchEvent(new CustomEvent("region-change", { detail: { region: rid } }));
  };

  // Derive status badge color from theme status
  const statusBadge = {
    healthy:   { color: "var(--success)", label: "NOMINAL", pulse: true },
    moderate:  { color: 'var(--primary)',    label: "MODERATE", pulse: false },
    "high-load": { color: 'var(--primary)',  label: "HIGH LOAD", pulse: false },
  }[theme.status];

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/30 select-none">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-3 sm:px-6 py-2.5 font-mono text-xs">

        {/* Brand logo */}
        <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
            <Logo variant="navbar" size={18} className="fill-none sm:size-5" style={{ color: 'var(--reactor-core)' }} />
            <span className="text-foreground font-bold tracking-widest text-[10px] sm:text-[11px]">HEET·OS</span>
            <span className="text-muted-foreground/45 hidden md:inline text-[10px]">// mission-control</span>
          </div>
        </div>

        {/* Desktop sliding nav */}
        <nav className="hidden lg:flex items-center gap-1.5 text-muted-foreground relative">
          {NAV_ITEMS.map(s => {
            const isHovered = hoveredNav === s.id;
            const isActive = activeScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onScreenChange(s.id)}
                onMouseEnter={() => setHoveredNav(s.id)}
                onMouseLeave={() => setHoveredNav(null)}
                className={`relative px-4 py-1.5 text-[10.5px] uppercase tracking-wider transition-all duration-300 z-10 cursor-pointer ${
                  isActive ? "font-bold text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                }`}
                style={{ color: isActive ? 'var(--reactor-core)' : undefined }}
              >
                {s.label}
                {isHovered && (
                  <motion.span
                    layoutId="topbar-nav-glow"
                    className="absolute inset-0 rounded bg-white/5 border-b z-[-1]"
                      style={{ borderColor: `var(--primary-40)` }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                {isActive && (
                  <motion.span
                    layoutId="topbar-nav-active-pill"
                    className="absolute inset-0 rounded border-b-2 z-[-2]"
                    style={{
                      background: `var(--primary-18)`,
                      borderColor: `var(--primary)`,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Resume + HUD Controls + Status + Time */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* JARVIS Button */}
          <Link
            to="/mission-os"
            className="relative flex items-center gap-1.5 rounded border px-2 sm:px-3 py-1.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300 overflow-hidden group shrink-0"
            style={{
              borderColor: "color-mix(in oklch, var(--rp) 50%, transparent)",
              background: "color-mix(in oklch, var(--rp) 8%, transparent)",
              color: "var(--rp)",
              boxShadow: "0 0 12px color-mix(in oklch, var(--rp) 20%, transparent)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "color-mix(in oklch, var(--rp) 18%, transparent)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px color-mix(in oklch, var(--rp) 40%, transparent)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "color-mix(in oklch, var(--rp) 8%, transparent)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 12px color-mix(in oklch, var(--rp) 20%, transparent)";
            }}
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklch, var(--rp) 10%, transparent), transparent)" }} />
            <Sparkles size={11} className="animate-pulse" />
            <span className="hidden sm:inline">JARVIS</span>
          </Link>

          {/* Resume Download */}
          <a
            href="/resume/Heet_Chokshi_Resume.pdf"
            target="_blank"
            download="Heet_Chokshi_Resume.pdf"
            className="flex items-center gap-1.5 rounded border border-purple/40 hover:border-purple/70 bg-purple/10 px-2 sm:px-2.5 py-1.5 text-[9px] sm:text-[10px] text-purple hover:text-white transition-all cursor-pointer font-mono font-bold led shrink-0"
          >
            <FileDown size={11} className="text-purple led" /> 
            <span className="hidden sm:inline">RESUME</span>
          </a>

          {/* HUD Controls dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 rounded border bg-black/25 px-2 sm:px-2.5 py-1.5 text-[9px] sm:text-[10px] transition-colors cursor-pointer shrink-0"
              style={{
                borderColor: showConfig ? 'var(--badge-border)' : "oklch(0.27 0.03 260 / 40%)",
                color: showConfig ? 'var(--badge-text)' : "oklch(0.65 0.03 255)",
              }}
            >
              <Sliders size={12} style={{ color: 'var(--reactor-core)' }} className="led" />
              <span className="hidden sm:inline">HUD Controls</span>
              <ChevronDown size={10} className={`transition-transform duration-200 ${showConfig ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showConfig && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 glass w-72 p-4 border shadow-glow rounded-md z-30 font-mono text-[9px]"
                  style={{ borderColor: 'var(--badge-border)', boxShadow: 'var(--glow-shadow)' }}
                  onClick={() => setShowConfig(false)}
                >
                  <div className="space-y-5">

                    {/* ── Server Region ───────────────────────────────── */}
                    <div>
                      <div
                        className="uppercase font-bold tracking-widest border-b border-border/10 pb-1.5 mb-2.5 flex items-center gap-1.5"
                        style={{ color: 'var(--badge-text)' }}
                      >
                        <Globe size={11} /> // SERVER REGION
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {REGION_ORDER.map(rid => {
                          const t = REGION_THEMES[rid];
                          const isActive = rid === regionId;
                          return (
                            <button
                              key={rid}
                              onClick={() => handleRegionChange(rid)}
                              className="flex items-center justify-between px-2.5 py-2 rounded border cursor-pointer transition-all duration-250 text-left"
                              style={{
                                borderColor: isActive ? 'var(--badge-border)' : "oklch(0.27 0.03 260 / 35%)",
                                background: isActive ? 'var(--badge-bg)' : "transparent",
                                color: isActive ? 'var(--badge-text)' : "oklch(0.55 0.02 260)",
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <span>{t.flag}</span>
                                <span className="font-bold">{t.label}</span>
                                <span
                                  className="text-[7px] px-1.5 py-0.5 rounded font-bold tracking-widest"
                                    style={{
                                    background: isActive ? 'var(--primary-22)' : "transparent",
                                    color: isActive ? 'var(--badge-text)' : "oklch(0.4 0.02 260)",
                                    border: `1px solid ${isActive ? 'var(--badge-border)' : "transparent"}`,
                                  }}
                                >
                                  {t.statusLabel}
                                </span>
                              </span>
                              <span className="text-[8px] opacity-50">{rid}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Live metrics snapshot for active region */}
                      <motion.div
                        key={regionId}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 grid grid-cols-2 gap-1.5"
                      >
                        {[
                          { label: "CPU", value: `${REGION_THEMES[regionId].metrics.cpu}%` },
                          { label: "MEM", value: `${REGION_THEMES[regionId].metrics.memory}%` },
                          { label: "LATENCY", value: `${REGION_THEMES[regionId].metrics.latencyMs}ms` },
                          { label: "RPS", value: `${(REGION_THEMES[regionId].metrics.requestsPerMin / 60).toFixed(0)}/s` },
                        ].map(m => (
                          <div
                            key={m.label}
                            className="flex justify-between px-2 py-1.5 rounded"
                            style={{
                              background: `var(--primary-08)`,
                              border: `1px solid var(--primary-28)`,
                            }}
                          >
                            <span className="text-muted-foreground/60">{m.label}</span>
                            <span className="font-bold" style={{ color: 'var(--badge-text)' }}>{m.value}</span>
                          </div>
                        ))}
                      </motion.div>
                    </div>

                    {/* ── Simulation Speed ────────────────────────────── */}
                    <div>
                      <div
                        className="uppercase font-bold tracking-widest border-b border-border/10 pb-1.5 mb-2.5 flex items-center gap-1.5"
                        style={{ color: 'var(--badge-text)' }}
                      >
                        <Cpu size={11} /> // SIMULATION SPEED
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {SPEEDS.map(s => {
                          const isActive = simSpeed === s.val;
                          return (
                            <button
                              key={s.val}
                              onClick={() => handleSpeedChange(s.val)}
                              title={s.desc}
                              className="py-1.5 rounded border cursor-pointer text-center font-bold transition-all duration-200"
                              style={{
                                borderColor: isActive ? 'var(--badge-border)' : "oklch(0.27 0.03 260 / 35%)",
                                background: isActive ? 'var(--badge-bg)' : "transparent",
                                color: isActive ? 'var(--badge-text)' : "oklch(0.5 0.02 260)",
                                boxShadow: isActive ? 'var(--glow-shadow)' : "none",
                              }}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 text-center" style={{ color: `var(--badge-text)` }}>
                        {SPEEDS.find(s => s.val === simSpeed)?.desc ?? ""}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* System status + time */}
          <div className="hidden md:flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-[10px]">
              <span
                className="h-1.5 w-1.5 rounded-full led"
                style={{
                  background: statusBadge.color,
                  animation: statusBadge.pulse ? "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" : "none",
                }}
              />
              <span style={{ color: statusBadge.color }}>{statusBadge.label}</span>
            </span>
            <span className="text-muted-foreground/60">{time}</span>
          </div>
        </div>
      </div>

      {/* Mobile horizontal nav */}
      <nav className="flex lg:hidden items-center gap-1 overflow-x-auto px-4 py-2 border-t border-border/20 scrollbar-none bg-black/10 select-none">
        {NAV_ITEMS.map(s => {
          const isActive = activeScreen === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onScreenChange(s.id)}
              className={`relative shrink-0 px-3 py-1.5 text-[9.5px] uppercase tracking-wider transition-colors duration-200 z-10 cursor-pointer ${
                isActive ? "font-bold text-foreground" : "text-muted-foreground/60"
              }`}
              style={{ color: isActive ? 'var(--reactor-core)' : undefined }}
            >
              {s.label}
              {isActive && (
                <motion.span
                  layoutId="topbar-nav-active-mobile"
                  className="absolute inset-0 rounded border-b z-[-1]"
                  style={{ background: `var(--primary-18)`, borderColor: `var(--primary)` }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Scroll progress line — region accent colored */}
      <div
        className="absolute bottom-0 left-0 h-[1.5px]"
        style={{
          width: `${scrollProgress}%`,
          background: `linear-gradient(90deg, var(--reactor-core), var(--reactor-ring))`,
          transition: "width 0.1s ease-out",
        }}
      />
    </header>
  );
}

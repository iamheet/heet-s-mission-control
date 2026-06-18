import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BootSequence } from "@/components/mc/BootSequence";
import { TopBar } from "@/components/mc/TopBar";
import { Hero } from "@/components/mc/Hero";
import { AmbientBackdrop } from "@/components/mc/AmbientBackdrop";
import { Overview } from "@/components/mc/Overview";
import { InfraMap } from "@/components/mc/InfraMap";
import { Deployment } from "@/components/mc/Deployment";
import { Observability } from "@/components/mc/Observability";
import { TechMatrix } from "@/components/mc/TechMatrix";
import { History } from "@/components/mc/History";
import { Systems } from "@/components/mc/Systems";
import { Kubernetes } from "@/components/mc/Kubernetes";
import { Terminal } from "@/components/mc/Terminal";
import { Contact } from "@/components/mc/Contact";
import { RecruiterBriefing } from "@/components/mc/RecruiterBriefing";
import { JarvisAssistant } from "@/components/mc/JarvisAssistant";
import { Briefcase, Activity, Server, Database, Command, UserCheck, LayoutDashboard } from "lucide-react";
import {
  SimMetaContext, SimThemeContext,
  REGION_THEMES, applyRegionVars,
  type RegionId, type SimSpeed,
} from "@/components/mc/regionTheme";
import { RegionTransition } from "@/components/mc/RegionTransition";
import { useIsMobile } from "@/hooks/use-mobile";

// Memoized screen components — prevent re-render when parent Home() re-renders
// due to regionId/simSpeed/activeScreen state changes.
const MissionScreen = memo(function MissionScreen() {
  return (
    <div className="space-y-12 pb-20">
      <Hero />
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12"><Overview /></div>
        <div className="lg:col-span-6"><Deployment /></div>
        <div className="lg:col-span-6"><Observability /></div>
      </div>
    </div>
  );
});

const InfraScreen = memo(function InfraScreen() {
  return (
    <div className="space-y-12 pb-20">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7"><InfraMap /></div>
        <div className="lg:col-span-5"><Kubernetes /></div>
      </div>
    </div>
  );
});

const ProjectsScreen = memo(function ProjectsScreen() {
  return (
    <div className="space-y-12 pb-20">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12"><Systems /></div>
        <div className="lg:col-span-12"><History /></div>
      </div>
    </div>
  );
});

const OperatorScreen = memo(function OperatorScreen({ onBriefing }: { onBriefing: () => void }) {
  return (
    <div className="space-y-12 pb-20">
      <TechMatrix />
      <div className="relative group overflow-hidden rounded-xl border r-border r-bg p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-500 hover:border-cyan/60">
        <div className="absolute inset-0 hudo-grid opacity-10 pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-64 h-64 r-bg blur-[100px] rounded-full group-hover:opacity-20 transition-colors" />
        <div className="relative z-10 space-y-3 text-center md:text-left">
          <h3 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-tight text-white group-hover:r-text-glow transition-all">Personnel Dossier</h3>
          <p className="text-sm md:text-base text-muted-foreground/80 max-w-xl font-mono leading-relaxed">
            Access authorized records for Heet Chokshi. Includes specialized technical evaluations, cross-platform architecture audits, and secure communication vectors.
          </p>
        </div>
        <button
          onClick={onBriefing}
          className="relative z-10 flex items-center gap-4 rounded border r-border r-bg-md hover:bg-[color:var(--rp)] hover:text-black transition-all duration-500 group/btn shadow-glow shrink-0 active:scale-95 px-10 py-5 font-mono font-bold tracking-[0.2em] r-text"
        >
          <Briefcase size={20} className="group-hover/btn:animate-bounce" />
          EXECUTE_BRIEFING.EXT
        </button>
      </div>
    </div>
  );
});

const TerminalScreen = memo(function TerminalScreen() {
  return (
    <div className="grid lg:grid-cols-12 gap-8 pb-20">
      <div className="lg:col-span-7"><Terminal /></div>
      <div className="lg:col-span-5"><Contact /></div>
    </div>
  );
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HEET·OS — DevOps Mission Control · Heet Chokshi" },
      { name: "description", content: "Mission Control for Heet Chokshi — Software & DevOps Engineer. Live infrastructure, deployments and observability dashboards." },
      { property: "og:title", content: "HEET·OS — DevOps Mission Control" },
      { property: "og:description", content: "Production cloud platform operated by Heet Chokshi — AWS · Docker · Kubernetes · Nginx · Prometheus · Grafana." },
    ],
  }),
  component: Home,
});

function RegionVarsApplier({ regionId }: { regionId: RegionId }) {
  useEffect(() => {
    const theme = REGION_THEMES[regionId];
    // On mobile: skip the 800ms CSS transition duration — apply instantly
    // so the 12-property :root transition doesn't run (already disabled in CSS
    // but this also prevents the JS-side applyRegionVars call from setting
    // --theme-transition which RegionTransition reads)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    applyRegionVars(theme, isMobile ? 0 : 800);
  }, [regionId]);
  return null;
}

function Home() {
  const [booted, setBooted] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [activeScreen, setActiveScreen] = useState<string>("mission");
  const [regionId, setRegionId] = useState<RegionId>("ap-south-1");
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (booted && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [activeScreen, booted]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }
  }, []);

  // Preload ElevenLabs greeting during boot sequence
  useEffect(() => {
    import("@/components/mc/jarvisTTS").then((jarvisTTS) => {
      const greetingText = jarvisTTS.getCurrentGreetingText();
      jarvisTTS.preloadGreeting(greetingText);
    });
  }, []);

  const handleBootComplete = () => {
    setBooted(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as any });
    }
  };

  // Stable memoized context values — these only create new objects when their
  // actual dependencies change, not on every Home() render.
  const metaValue = useMemo(() => ({
    regionId,
    simSpeed,
    setRegion: setRegionId,
    setSimSpeed,
  }), [regionId, simSpeed]);

  const themeValue = useMemo(() => ({
    regionId,
    theme: REGION_THEMES[regionId],
    metrics: REGION_THEMES[regionId].metrics,
  }), [regionId]);

  // Mobile: instant opacity-only swap (no scale, no spring, no AnimatePresence exit)
  // Desktop: full opacity+scale transition
  const pageVariants = isMobile
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 } };
  const pageTransition = isMobile
    ? { duration: 0.15 }
    : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as any };

  return (
    <SimMetaContext.Provider value={metaValue}>
      <SimThemeContext.Provider value={themeValue}>
        <RegionVarsApplier regionId={regionId} />
        <RegionTransition />
        <AnimatePresence>
          {!booted && <BootSequence onDone={handleBootComplete} />}
        </AnimatePresence>

        <AmbientBackdrop />

        <div className={booted ? "relative min-h-screen flex flex-col" : "pointer-events-none opacity-0"}>
          <TopBar activeScreen={activeScreen} onScreenChange={setActiveScreen} />

          <main className="flex-1 w-full mx-auto max-w-[1600px] px-3 sm:px-4 md:px-6 py-4 sm:py-6 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="w-full min-h-[80vh]"
              >
                {/* SCREEN NAVIGATION BREADCRUMB */}
                <div className="flex items-center gap-2 sm:gap-3 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.3em] text-muted-foreground/30 mb-8 select-none">
                  <span className="flex items-center gap-1.5 sm:gap-2"><Command size={10} /> MISSION_OS</span>
                  <span className="opacity-50">/</span>
                  <span className="font-bold flex items-center gap-1.5 sm:gap-2 r-text truncate">
                    {activeScreen === "mission"  && <><LayoutDashboard size={10} className="shrink-0" /> MISSION_CONTROL</>}
                    {activeScreen === "infra"    && <><Server size={10} className="shrink-0" /> INFRASTRUCTURE_PLANE</>}
                    {activeScreen === "projects" && <><Database size={10} className="shrink-0" /> PROJECT_SYSTEMS</>}
                    {activeScreen === "operator" && <><UserCheck size={10} className="shrink-0" /> OPERATOR_PROFILE</>}
                    {activeScreen === "terminal" && <><Activity size={10} className="shrink-0" /> TERMINAL_STATION</>}
                  </span>
                </div>

                {activeScreen === "mission"  && <MissionScreen />}
                {activeScreen === "infra"    && <InfraScreen />}
                {activeScreen === "projects" && <ProjectsScreen />}
                {activeScreen === "operator" && <OperatorScreen onBriefing={() => setShowBriefing(true)} />}
                {activeScreen === "terminal" && <TerminalScreen />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* JARVIS AI Voice Assistant */}
          <JarvisAssistant onScreenChange={setActiveScreen} booted={booted} />

          <div className="fixed bottom-6 left-6 z-[90] font-mono text-xs select-none">
            <button
              onClick={() => setShowBriefing(true)}
              className="flex items-center gap-2 rounded-full border border-purple/50 bg-black/60 px-3 py-2 sm:px-4 sm:py-2.5 text-foreground hover:text-purple hover:border-purple transition-all duration-300 shadow-glow focus:outline-none focus:ring-1 focus:ring-purple"
              style={{ boxShadow: "0 0 15px oklch(0.7 0.22 295 / 0.15)" }}
            >
              <Briefcase size={14} className="text-purple led animate-pulse" />
              <span className="font-bold tracking-widest text-[9px] sm:text-[10px] uppercase">OS_DOSSIER</span>
            </button>
          </div>

          <AnimatePresence>
            {showBriefing && <RecruiterBriefing onClose={() => setShowBriefing(false)} />}
          </AnimatePresence>
        </div>
      </SimThemeContext.Provider>
    </SimMetaContext.Provider>
  );
}

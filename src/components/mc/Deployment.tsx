import { motion } from "framer-motion";
import { SectionHeader, Panel, StatusDot } from "./primitives";
import { useEffect, useState, useRef } from "react";
import { Play, RotateCw } from "lucide-react";
import { useSimulation } from "./regionTheme";
import { useIsMobile } from "@/hooks/use-mobile";

const STAGES = ["Git Push", "GitHub Actions", "Docker Build", "Deploy Host", "Health Check", "Production"];

const BUILD_FLOW_LOGS: Record<number, string[]> = {
  0: [
    "[git] commit: 7a3f9c1 · author: Heet Chokshi",
    "[git] push origin main · secure connection established",
    "[git] hook: repository payload validated at github server"
  ],
  1: [
    "[actions] workflow ci.yml triggered on agent runner-03",
    "[actions] ▸ checkout branch main · 0.4s [OK]",
    "[actions] ▸ setup-node v20 · 1.1s [OK]",
    "[actions] ▸ caching npm registry store · hits: 45/48"
  ],
  2: [
    "[docker] FROM node:20-alpine AS installer",
    "[docker] layer cache hit · 8/11 steps matched",
    "[docker] build command: npm run build · compiling bundle...",
    "[docker] bundle hash: f3249c12a8b9",
    "[docker] image created: heet/app:7a3f9c1 · size: 142MB"
  ],
  3: [
    "[deploy] shipping container image to docker hub registry",
    "[deploy] target host: ec2-prod-1.ap-south-1.amazonaws.com",
    "[deploy] docker pull heet/app:7a3f9c1 on server nod-1",
    "[nginx] config test: test is successful · reload initiated"
  ],
  4: [
    "[health] checking endpoint host: /healthz...",
    "[health] response code: 200 OK · latency: 74ms",
    "[health] cluster response consensus achieved · ready for live route"
  ],
  5: [
    "[deploy] ✓ rollout complete · total duration: 23.7s",
    "[deploy] state: ACTIVE // ALL SYSTEMS NOMINAL // SSL OK"
  ]
};

export function Deployment() {
  const [currentStep, setCurrentStep] = useState(5); // Default to done
  const [logs, setLogs] = useState<string[]>([
    "[deploy] pipeline ready for trigger.",
    "awaiting mission control payload...",
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { theme, simSpeed } = useSimulation();

  // Listen to HEET.AI trigger event
  useEffect(() => {
    const handleTrigger = () => {
      triggerRelease();
    };
    window.addEventListener("trigger-deployment", handleTrigger);
    return () => window.removeEventListener("trigger-deployment", handleTrigger);
  }, [isRunning, simSpeed]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const triggerRelease = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentStep(0);
    setLogs(["[deploy] initializing pipeline trigger...", "[git] checking workspace tree..."]);
    
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms / simSpeed));

    for (let step = 0; step < STAGES.length; step++) {
      setCurrentStep(step);
      const stepLogs = BUILD_FLOW_LOGS[step] || [];
      
      for (const logLine of stepLogs) {
        await delay(500);
        setLogs((prev) => [...prev, logLine]);
      }
      await delay(1200);
    }
    
    setIsRunning(false);
  };

  return (
    <section>
      <SectionHeader 
        id="deploy" 
        kicker="// section 03" 
        title="Deployment Center" 
        desc="Automated CI/CD release deck. Run manual deployment to audit rollout telemetry." 
      />
      
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Pipeline steppers */}
        <div className="lg:col-span-12">
          <Panel 
            title="Pipeline Rollout Rails" 
            badge={
              <span className={isRunning ? "r-text animate-pulse flex items-center gap-1" : "text-success flex items-center gap-1"}>
                <StatusDot s={isRunning ? "warn" : "ok"} /> <span className="hidden sm:inline">{isRunning ? "processing" : "stable"}</span>
              </span>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5 pb-2 pt-2 select-none">
              {STAGES.map((stageName, i) => {
                const isFinished = i < currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={stageName} className="w-full min-w-0">
                    <div
                      className="relative rounded border px-2 py-2 font-mono text-[8px] w-full transition-all duration-400 leading-tight"
                      style={{
                        borderColor: isCurrent
                          ? 'var(--pipeline-active)'
                          : isFinished
                          ? 'var(--pipeline-finished)'
                          : "oklch(0.27 0.03 260 / 40%)",
                        background: isCurrent
                          ? 'color-mix(in oklch, var(--pipeline-active) 12%, transparent)'
                          : isFinished
                          ? 'color-mix(in oklch, var(--pipeline-active) 5%, transparent)'
                          : "transparent",
                        color: isCurrent
                          ? 'var(--pipeline-active)'
                          : isFinished
                          ? "oklch(0.88 0.01 240)"
                          : "oklch(0.60 0.02 260)",
                      }}
                    >
                      <div className="font-semibold">
                        <span>{stageName}</span>
                      </div>
                      {isCurrent && (
                        <motion.div
                          layoutId="pipeline-active-pulse"
                          className="absolute -inset-px rounded pointer-events-none"
                          style={{ border: `1px solid var(--pipeline-active)`, boxShadow: 'var(--glow-shadow)' }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deploy Trigger Button HUD */}
            <div className="mt-4 pt-4 border-t border-border/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="font-mono text-[9px] text-muted-foreground/60 select-none">
                SIMULATION_SPEED: {simSpeed}x // ACTION_REQUIRED: TRIGGER_RELEASE
              </div>
              
              <button
                onClick={triggerRelease}
                disabled={isRunning}
                className="flex items-center gap-2 rounded border px-4 py-2 font-mono text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 cursor-pointer"
                style={{
                  borderColor: 'var(--pipeline-active)',
                  background: 'color-mix(in oklch, var(--pipeline-active) 10%, transparent)',
                  color: 'var(--pipeline-active)',
                  boxShadow: isRunning ? "none" : 'var(--glow-shadow)',
                }}
              >
                {isRunning ? (
                  <>
                    <RotateCw size={12} className="animate-spin" style={{ color: 'var(--pipeline-active)' }} /> Running Build...
                  </>
                ) : (
                  <>
                    <Play size={12} style={{ color: 'var(--pipeline-active)' }} /> Trigger Manual Release
                  </>
                )}
              </button>
            </div>
          </Panel>
        </div>

        {/* Pipeline parameters info */}
        <div className="lg:col-span-4">
          <Panel title="Release Metadata Parameters">
            <div className="font-mono text-xs space-y-2">
              <Row k="branch_head" v="main" />
              <Row k="active_commit" v="7a3f9c1 feat: scale nginx nodes" />
              <Row k="dns_endpoint" v="sheet-app.ap-south-1.aws" />
              <Row k="docker_tag" v="heet/app:7a3f9c1" />
              <Row k="uptime_target" v="99.97%" />
              <Row k="release_status" v={<span className="text-success font-semibold tracking-wider">✓ NOMINAL</span>} />
            </div>
          </Panel>
        </div>

        {/* Dynamic Build Logs Console output */}
        <div className="lg:col-span-12">
          <Panel title="CI/CD Build System Output logs" badge={<span className="text-muted-foreground font-mono">tail -f build.log</span>}>
            <div className="rounded bg-black/55 border border-border/40 p-4 font-mono text-[11px] h-60 overflow-y-auto flex flex-col gap-1 shadow-inner relative">
              <div className="absolute inset-0 hudo-grid opacity-5 pointer-events-none" />
              {logs.map((logLine, i) => {
                const isErr = logLine.includes("[error]") || logLine.includes("[warn]");
                const isOk = logLine.includes("[health]") || logLine.includes("✓") || logLine.includes("[OK]");
                const textColor = isErr ? "text-warning" : isOk ? "text-success" : "text-foreground/80";
                return (
                  // Static div on mobile — each log line was a separate FM animation
                  <div key={i + logLine} className={`${textColor} leading-relaxed`}>
                    <span className="text-muted-foreground/45 select-none mr-2">›</span> {logLine}
                  </div>
                );
              })}
              {isRunning && (
                // Static cursor on mobile — FM opacity blink is a full re-render per tick
                <span className="r-text text-sm mt-1 select-none deploy-cursor-blink">▌</span>
              )}
              <div ref={logsEndRef} />
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-4 border-b border-border/10 pb-1.5 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground/60 shrink-0">{k}</span>
      <span className="text-foreground font-semibold truncate text-left sm:text-right">{v}</span>
    </div>
  );
}

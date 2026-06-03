import { motion } from "framer-motion";
import { SectionHeader, Panel, StatusDot } from "./primitives";
import { useEffect, useState } from "react";

const STAGES = ["Git Push", "GitHub Actions", "Docker Build", "Deploy", "Health Check", "Production"];
const LOGS = [
  "[git] push origin main · 7a3f9c1",
  "[actions] workflow ci.yml triggered",
  "[actions] ▸ checkout · 0.4s",
  "[actions] ▸ setup-node 20 · 1.1s",
  "[docker] FROM node:20-alpine",
  "[docker] layer cache hit · 8/11",
  "[docker] image heet/app:7a3f9c1 · 142MB",
  "[deploy] pulling on prod-1 (ec2)",
  "[nginx] reload · graceful",
  "[health] /healthz → 200 OK (84ms)",
  "[deploy] ✓ rollout complete · 23.7s",
];

export function Deployment() {
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const i = setInterval(() => setStep(s => (s + 1) % (STAGES.length + 1)), 1200);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    let n = 0;
    const i = setInterval(() => {
      setLines(prev => [...prev.slice(-9), LOGS[n % LOGS.length]]);
      n++;
    }, 700);
    return () => clearInterval(i);
  }, []);
  return (
    <section>
      <SectionHeader id="deploy" kicker="// section 03" title="Deployment Center" desc="CI/CD pipeline streaming live build, image and rollout telemetry." />
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <Panel title="pipeline · main" badge={<span className="text-success">● running</span>}>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
              {STAGES.map((s, i) => {
                const active = i <= step - 1;
                const current = i === step - 1;
                return (
                  <div key={s} className="flex items-center gap-2 min-w-fit">
                    <div className={`relative rounded-md border px-3 py-2 font-mono text-[11px] ${active ? "border-cyan/60 bg-cyan/10 text-foreground" : "border-border/60 text-muted-foreground"}`}>
                      <div className="flex items-center gap-2">
                        <StatusDot s={active ? "ok" : "warn"} />
                        {s}
                      </div>
                      {current && <motion.div layoutId="pulse" className="absolute inset-0 rounded-md border border-cyan glow-cyan" />}
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className="relative h-px w-6 bg-border overflow-hidden">
                        {active && <motion.div className="absolute inset-y-0 left-0 w-full bg-cyan" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ transformOrigin: "left" }} transition={{ duration: 0.6 }} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel title="last deploy · prod">
            <div className="font-mono text-xs space-y-1">
              <Row k="commit" v="7a3f9c1 feat: scale nginx workers" />
              <Row k="branch" v="main" />
              <Row k="duration" v="23.7s" />
              <Row k="image" v="heet/app:7a3f9c1" />
              <Row k="status" v={<span className="text-success">✓ success</span>} />
            </div>
          </Panel>
        </div>
        <div className="lg:col-span-5">
          <Panel title="actions · build.log" badge={<span className="text-muted-foreground">tail -f</span>}>
            <div className="rounded bg-black/40 border border-border/60 p-3 font-mono text-[12px] h-56 overflow-hidden">
              {lines.map((l, i) => (
                <motion.div key={i + l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-foreground/80">
                  <span className="text-muted-foreground">›</span> {l}
                </motion.div>
              ))}
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-cyan">▌</motion.span>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{k}</span><span className="text-foreground truncate">{v}</span></div>;
}

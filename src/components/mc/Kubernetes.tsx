import { motion } from "framer-motion";
import { SectionHeader, Panel } from "./primitives";
import { useState } from "react";

const NODES = [
  { id: "node-1", pods: ["nginx", "app-v3", "redis"] },
  { id: "node-2", pods: ["app-v3", "worker", "exporter"] },
  { id: "node-3", pods: ["postgres", "app-v3", "cron"] },
];

export function Kubernetes() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <section>
      <SectionHeader id="k8s" kicker="// section 08" title="Kubernetes Operations" desc="Live cluster: 3 nodes · 9 pods · ingress routing traffic through services." />
      <Panel title="cluster · heet-prod" badge={<span className="text-success">● Ready</span>}>
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 font-mono text-xs">
            <div className="rounded border border-cyan/60 bg-cyan/10 px-3 py-1.5">Ingress</div>
            <Arrow />
            <div className="rounded border border-purple/60 bg-accent/20 px-3 py-1.5">Service</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {NODES.map(n => (
              <div key={n.id} className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                  <span className="text-cyan">▣ {n.id}</span>
                  <span className="text-success">Ready</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {n.pods.map((p, i) => {
                    const k = `${n.id}-${p}-${i}`;
                    return (
                      <motion.div key={k}
                        onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)}
                        whileHover={{ scale: 1.1 }}
                        className={`relative aspect-square rounded grid place-items-center font-mono text-[9px] text-center border ${hover === k ? "border-purple bg-purple/20" : "border-cyan/40 bg-cyan/5"}`}>
                        <motion.div className="absolute inset-0 rounded"
                          animate={{ boxShadow: ["0 0 0 0 var(--cyan)", "0 0 0 4px transparent"] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
                        <span>{p}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </section>
  );
}
function Arrow() {
  return <svg width="24" height="10" viewBox="0 0 24 10"><motion.path d="M2 5 H22 M18 1 L22 5 L18 9" stroke="var(--cyan)" strokeWidth="1" fill="none" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} /></svg>;
}

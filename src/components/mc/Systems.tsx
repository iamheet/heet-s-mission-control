import { motion } from "framer-motion";
import { SectionHeader, Panel, StatusDot } from "./primitives";

type Sys = {
  name: string; tag: string; desc: string; nodes: string[]; color: string;
};
const SYSTEMS: Sys[] = [
  { name: "CryptoNexusAI", tag: "ai-trading-intel", desc: "AI-powered crypto market intelligence platform", color: "var(--cyan)",
    nodes: ["Users", "Nginx", "Docker", "Next.js", "OpenAI API"] },
  { name: "GrandStay", tag: "hotel-platform", desc: "Hotel booking and property management system", color: "var(--purple)",
    nodes: ["Users", "Nginx", "Node.js API", "MongoDB", "S3 Media"] },
  { name: "LearnWithH", tag: "edu-platform", desc: "Realtime learning platform on Supabase", color: "var(--success)",
    nodes: ["Users", "CDN", "Next.js", "Supabase Auth", "Postgres"] },
];

export function Systems() {
  return (
    <section>
      <SectionHeader id="systems" kicker="// section 07" title="Production Systems" desc="Operational software running in production. Each system shown as a live request flow." />
      <div className="grid lg:grid-cols-3 gap-4">
        {SYSTEMS.map(s => <SystemCard key={s.name} s={s} />)}
      </div>
    </section>
  );
}

function SystemCard({ s }: { s: Sys }) {
  return (
    <Panel title={s.name} badge={<span className="flex items-center gap-1.5 text-success"><StatusDot /> live</span>}>
      <div className="font-mono text-[11px] text-muted-foreground">{s.tag}</div>
      <div className="text-sm text-foreground mt-1">{s.desc}</div>
      <div className="mt-4 space-y-2">
        {s.nodes.map((n, i) => (
          <div key={n} className="relative">
            <div className="rounded-md border border-border/60 bg-card/60 px-3 py-2 font-mono text-xs flex items-center justify-between">
              <span>{n}</span>
              <span style={{ color: s.color }}>▮▮▮</span>
            </div>
            {i < s.nodes.length - 1 && (
              <div className="relative my-1 h-4 mx-auto w-px bg-border overflow-hidden">
                <motion.div className="absolute left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full"
                  style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }}
                  animate={{ top: ["-10%", "110%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3, ease: "linear" }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] text-muted-foreground">
        <div className="rounded border border-border/60 p-2"><div className="text-success">200</div>health</div>
        <div className="rounded border border-border/60 p-2"><div className="text-foreground">99.9%</div>uptime</div>
        <div className="rounded border border-border/60 p-2"><div className="text-foreground">{Math.round(60 + Math.random() * 80)}ms</div>p95</div>
      </div>
    </Panel>
  );
}

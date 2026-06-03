import { motion } from "framer-motion";
import { SectionHeader } from "./primitives";
import { useState } from "react";

const NODES = [
  { id: "internet", label: "Internet", x: 50, y: 8, desc: "Public edge traffic" },
  { id: "nginx", label: "Nginx", x: 50, y: 22, desc: "Reverse proxy · TLS termination" },
  { id: "ec2", label: "AWS EC2", x: 50, y: 36, desc: "t3.medium · ap-south-1" },
  { id: "docker", label: "Docker", x: 50, y: 50, desc: "Container runtime · 47 active" },
  { id: "apps", label: "Applications", x: 25, y: 66, desc: "Next.js · Node services" },
  { id: "dbs", label: "Databases", x: 50, y: 66, desc: "Postgres · MongoDB · MySQL" },
  { id: "obs", label: "Monitoring", x: 75, y: 66, desc: "Prometheus · Grafana" },
];
const EDGES = [
  ["internet", "nginx"], ["nginx", "ec2"], ["ec2", "docker"],
  ["docker", "apps"], ["docker", "dbs"], ["docker", "obs"],
];

export function InfraMap() {
  const [hover, setHover] = useState<string | null>(null);
  const byId = Object.fromEntries(NODES.map(n => [n.id, n]));
  return (
    <section>
      <SectionHeader id="infra" kicker="// section 02" title="Infrastructure Map" desc="Live topology of the production environment. Packets flow continuously across the stack." />
      <div className="glass rounded-lg p-4">
        <div className="relative aspect-[16/10] w-full">
          <svg viewBox="0 0 100 80" className="absolute inset-0 h-full w-full">
            {EDGES.map(([a, b], i) => {
              const A = byId[a], B = byId[b];
              return (
                <g key={i}>
                  <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--cyan)" strokeOpacity="0.35" strokeWidth="0.25" />
                  <motion.circle r="0.6" fill="var(--cyan)" className="led"
                    animate={{ cx: [A.x, B.x], cy: [A.y, B.y], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25, ease: "linear" }} />
                </g>
              );
            })}
            {NODES.map((n) => {
              const active = hover === n.id;
              return (
                <g key={n.id} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                  <circle cx={n.x} cy={n.y} r={active ? 4.5 : 3.5} fill="var(--card)" stroke={active ? "var(--purple)" : "var(--cyan)"} strokeWidth="0.4" />
                  <circle cx={n.x} cy={n.y} r={1.2} fill={active ? "var(--purple)" : "var(--cyan)"} />
                  <text x={n.x} y={n.y + 7} textAnchor="middle" fontSize="2.2" fill="currentColor" className="font-mono fill-foreground">{n.label}</text>
                </g>
              );
            })}
          </svg>
          {hover && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 glass rounded-md px-3 py-2 font-mono text-xs">
              <div className="text-cyan">{byId[hover].label}</div>
              <div className="text-muted-foreground">{byId[hover].desc}</div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

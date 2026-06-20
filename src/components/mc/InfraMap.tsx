import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader, StatusDot } from "./primitives";
import { useState } from "react";
import { Server, Shield, Globe, Cpu, Database, Activity, Terminal } from "lucide-react";
import { useSimulation, REGION_THEMES, REGION_ORDER } from "./regionTheme";
import { useJarvisHighlight } from "@/hooks/useJarvisHighlight";

interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  desc: string;
  stat: string;
  load: number;
  type: "edge" | "proxy" | "host" | "container" | "app" | "db" | "ops";
}

const NODES: NodeData[] = [
  { id: "internet", label: "Internet Edge", x: 50, y: 10, desc: "Public ingress traffic", stat: "1.4k requests/sec", load: 24, type: "edge" },
  { id: "nginx", label: "Nginx Gateway", x: 50, y: 24, desc: "Reverse proxy · SSL termination", stat: "HTTP/2, gzip enabled", load: 38, type: "proxy" },
  { id: "ec2", label: "AWS EC2 Host", x: 50, y: 38, desc: "t3.medium · ap-south-1a", stat: "vCPU Load: 0.62", load: 45, type: "host" },
  { id: "docker", label: "Docker Runtime", x: 50, y: 52, desc: "Container engine · 47 active", stat: "Bridge network active", load: 58, type: "container" },
  { id: "apps", label: "Apps Layer", x: 20, y: 68, desc: "CryptoNexusAI · Next.js", stat: "Port 3000 · Nominal", load: 32, type: "app" },
  { id: "dbs", label: "Databases", x: 50, y: 68, desc: "Postgres · MongoDB · Redis", stat: "Connections: 42", load: 28, type: "db" },
  { id: "obs", label: "Observability", x: 80, y: 68, desc: "Prometheus · Grafana", stat: "Scraping 128 targets", load: 15, type: "ops" },
];

const EDGES = [
  { from: "internet", to: "nginx" },
  { from: "nginx", to: "ec2" },
  { from: "ec2", to: "docker" },
  { from: "docker", to: "apps" },
  { from: "docker", to: "dbs" },
  { from: "docker", to: "obs" },
];

/** Per-region load offsets applied to base node loads */
const REGION_LOAD_OFFSETS: Record<string, number> = {
  "us-east-1": 0,
  "eu-west-1": 18,
  "ap-south-1": 36,
};

export function InfraMap() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const { theme, regionId, setRegion, simSpeed } = useSimulation();

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));
  const loadOffset = REGION_LOAD_OFFSETS[regionId] ?? 0;

  const getNodeIcon = (type: string, active: boolean) => {
    const color = active ? 'var(--reactor-core)' : "oklch(0.65 0.03 255)";
    const style = { color };
    switch (type) {
      case "edge": return <Globe size={10} style={style} className="led" />;
      case "proxy": return <Shield size={10} style={style} className="led" />;
      case "host": return <Server size={10} style={style} className="led" />;
      case "container": return <Cpu size={10} style={style} className="led" />;
      case "db": return <Database size={10} style={style} className="led" />;
      case "app": return <Terminal size={10} style={style} className="led" />;
      default: return <Activity size={10} style={style} className="led" />;
    }
  };

  const statusDotColor = {
    "healthy": "var(--success)",
    "moderate": 'var(--primary)',
    "high-load": 'var(--primary)',
  }[theme.status];

  const highlighted = useJarvisHighlight("infra");
  return (
    <section style={highlighted ? { outline: "1.5px solid color-mix(in oklch, var(--rp) 70%, transparent)", outlineOffset: "8px", boxShadow: "0 0 20px color-mix(in oklch, var(--rp) 20%, transparent)", borderRadius: "0.75rem", transition: "all 0.4s ease" } : { transition: "all 0.4s ease" }}>
      <SectionHeader
        id="infra"
        kicker="// section 05"
        title="Infrastructure Topology"
        desc="Interactive network schematic of the cloud platform. Select a region to update the operational theme across all dashboard systems."
      />

      {/* ─── Region Selector ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5 select-none">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60">
          ACTIVE REGION //
        </span>
        {REGION_ORDER.map((rid) => {
          const t = REGION_THEMES[rid];
          const isActive = rid === regionId;
          return (
            <button
              key={rid}
              onClick={() => setRegion(rid)}
              className="relative flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer focus:outline-none"
                style={{
                  borderColor: isActive ? 'var(--badge-border)' : "oklch(0.27 0.03 260 / 40%)",
                  background: isActive ? 'var(--badge-bg)' : "oklch(0 0 0 / 0%)",
                  color: isActive ? 'var(--badge-text)' : "oklch(0.65 0.03 255)",
                  boxShadow: isActive ? 'var(--glow-shadow)' : "none",
                }}
            >
              {/* Active border ring */}
              {isActive && (
                  <motion.span
                  layoutId="region-active-ring"
                  className="absolute -inset-px rounded pointer-events-none"
                  style={{ border: `1px solid var(--primary)`, opacity: 0.6 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <span className="text-base leading-none">{t.flag}</span>
              <span>{t.shortLabel}</span>
              <span className="hidden sm:inline text-[8px] opacity-60">— {t.label}</span>

              {/* Status badge */}
              <span
                className="ml-1 rounded px-1.5 py-0.5 text-[7px] font-bold tracking-widest hidden sm:inline"
                style={{
                  background: isActive ? 'var(--primary-22)' : "transparent",
                  color: isActive ? 'var(--badge-text)' : "oklch(0.4 0.02 260)",
                  border: `1px solid ${isActive ? 'var(--badge-border)' : "transparent"}`,
                }}
              >
                {t.statusLabel}
              </span>
            </button>
          );
        })}

        {/* Meaning tag */}
        <motion.div
          key={regionId}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-auto font-mono text-[9px] hidden md:flex items-center gap-2"
            style={{ color: 'var(--badge-text)' }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full led"
              style={{ background: 'var(--primary)' }}
          />
          {theme.statusMeaning}
        </motion.div>
      </div>

      {/* ─── Main Panel ──────────────────────────────────────────────────── */}
      <div
        className="glass rounded-lg p-5 border relative overflow-hidden group transition-all duration-500"
        style={{ borderColor: 'var(--badge-border)' }}
      >
        {/* Region glow sweep */}
        <motion.div
          key={regionId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, var(--primary-18) 0%, transparent 65%)`,
            }}
        />

        {/* Network diagram grid layout */}
        <div className="absolute inset-0 hudo-grid opacity-10 pointer-events-none" />

        {/* Main Canvas Node Schema */}
        <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full select-none">
          <svg viewBox="0 0 100 80" className="absolute inset-0 h-full w-full">
            {/* Draw active connection cables */}
            {EDGES.map((edge, i) => {
              const fromNode = nodeMap[edge.from];
              const toNode = nodeMap[edge.to];
              const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;

              return (
                <g key={i}>
                  {/* Outer glow cable path */}
                  <line
                    x1={fromNode.x} y1={fromNode.y}
                    x2={toNode.x} y2={toNode.y}
                    stroke={isHighlighted ? 'var(--packet-fill)' : `var(--node-stroke)`}
                    strokeWidth={isHighlighted ? "0.4" : "0.22"}
                    style={{ transition: "stroke 0.4s ease, stroke-width 0.3s ease" }}
                  />

                  {/* Flowing packet pulse */}
                  <motion.circle
                    r="0.5"
                    fill={'var(--packet-fill)'}
                    className="led"
                    animate={{
                      cx: [fromNode.x, toNode.x],
                      cy: [fromNode.y, toNode.y],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 1.8 / Math.max(0.1, simSpeed),
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "linear"
                    }}
                  />
                </g>
              );
            })}

            {/* Render Nodes as SVG structures */}
            {NODES.map((node) => {
              const active = hoveredNode === node.id;
              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer"
                >
                  {/* Glow circle overlay on hover */}
                  <circle
                    cx={node.x} cy={node.y}
                    r={active ? 5.5 : 4.5}
                    fill="var(--card)"
                    stroke={active ? 'var(--reactor-core)' : 'var(--node-stroke)'}
                    strokeWidth="0.35"
                    style={{ transition: "all 0.3s ease" }}
                  />

                  {/* Central status node */}
                  <circle
                    cx={node.x} cy={node.y}
                    r="1.2"
                    fill={active ? 'var(--reactor-core)' : 'var(--node-fill)'}
                    className="led"
                    style={{ transition: "fill 0.4s ease" }}
                  />

                  {/* Node label text */}
                  <text
                    x={node.x} y={node.y + 6.8}
                    textAnchor="middle"
                    fontSize="1.9"
                    className="font-mono fill-foreground/80 font-bold uppercase tracking-wider"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Diagnostic popup — desktop only, floats over diagram */}
          <div
            className="hidden md:block absolute top-4 right-4 glass rounded border bg-black/50 p-4 font-mono text-[9px] w-56 lg:w-64 pointer-events-none select-none z-20"
            style={{ borderColor: 'var(--badge-border)', boxShadow: 'var(--glow-shadow)' }}
          >
              <div
              className="text-[10px] uppercase tracking-widest font-bold border-b border-border/40 pb-1 flex items-center justify-between"
              style={{ color: 'var(--badge-text)' }}
            >
              <span>SYSTEM DIAGNOSTICS</span>
              <span className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full led"
                  style={{ background: statusDotColor }}
                />
                {theme.flag} {theme.shortLabel}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {hoveredNode ? (
                <motion.div
                  key={hoveredNode}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3.5 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="p-1 rounded border"
                      style={{
                        background: 'var(--badge-bg)',
                        borderColor: 'var(--badge-border)',
                      }}
                    >
                      {getNodeIcon(nodeMap[hoveredNode].type, true)}
                    </span>
                    <div>
                      <div className="text-[10px] text-foreground font-bold uppercase">{nodeMap[hoveredNode].label}</div>
                        <div className="text-muted-foreground/60 text-[8px]">{nodeMap[hoveredNode].desc}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground/80">
                      <span>METRIC STAT:</span>
                      <span className="text-foreground">{nodeMap[hoveredNode].stat}</span>
                    </div>

                    {/* Visual CPU/Load bar */}
                    <div>
                      <div className="flex justify-between text-muted-foreground/80">
                        <span>LOAD FACTOR:</span>
                        <span className="font-bold" style={{ color: 'var(--badge-text)' }}>
                          {Math.min(95, nodeMap[hoveredNode].load + loadOffset)}%
                        </span>
                      </div>
                      <div className="h-1 w-full bg-muted/30 rounded-full mt-1 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, var(--reactor-core), var(--reactor-ring))`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(95, nodeMap[hoveredNode].load + loadOffset)}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-muted-foreground/50 leading-relaxed text-center py-4"
                >
                  HOVER ANY NETWORK NODE IN THE SCHEMATIC TO RUN PACKET TRACE &amp; FETCH DIAGNOSTIC TELEMETRY LOGS
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile diagnostic — shown below diagram */}
        <div className="md:hidden mt-3 glass rounded border p-3 font-mono text-[9px] select-none" style={{ borderColor: 'var(--badge-border)' }}>
          <div className="text-[9px] uppercase tracking-widest font-bold pb-1 mb-1 border-b border-border/30" style={{ color: 'var(--badge-text)' }}>
            DIAGNOSTICS — {theme.flag} {theme.shortLabel}
          </div>
          <div className="text-muted-foreground/50 text-center py-2">
            {hoveredNode
              ? `${nodeMap[hoveredNode].label} · Load: ${Math.min(95, nodeMap[hoveredNode].load + loadOffset)}%`
              : "TAP A NODE TO INSPECT"}
          </div>
        </div>

        {/* ─── Region status footer */}
        <motion.div
          key={regionId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 pt-3 border-t border-border/10 flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] select-none"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full led" style={{ background: 'var(--primary)' }} />
                      <span className="text-muted-foreground/60">REGION:</span>
              <span style={{ color: 'var(--badge-text)' }}>{theme.flag} {theme.label} ({theme.id})</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-muted-foreground/60">STATUS:</span>
              <span
                className="px-2 py-0.5 rounded font-bold tracking-widest text-[8px]"
                style={{
                  color: 'var(--badge-text)',
                  background: 'var(--badge-bg)',
                  border: `1px solid var(--badge-border)`,
                }}
              >
                {theme.statusLabel}
              </span>
            </div>
          </div>
          <span className="text-muted-foreground/40">
            UPLINK: ACTIVE // THEME: {theme.status.toUpperCase().replace("-", "_")}
          </span>
        </motion.div>
      </div>
    </section>
  );
}

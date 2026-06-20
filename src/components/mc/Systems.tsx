import { motion } from "framer-motion";
import { SectionHeader, Panel, StatusDot } from "./primitives";
import { useState, useEffect } from "react";
import { Activity, Users, Send, Database } from "lucide-react";
import { useJarvisHighlight } from "@/hooks/useJarvisHighlight";

interface Sys {
  name: string;
  tag: string;
  desc: string;
  nodes: string[];
  color: string;
  url?: string;
  statusText?: string;
}

export const SYSTEMS: Sys[] = [
  { 
    name: "Mission OS", 
    tag: "devops-control-deck", 
    desc: "Mission OS is an interactive DevOps Mission Control platform. It visualizes cloud infrastructure, deployment workflows, observability systems, AI-assisted navigation, and production environments.", 
    color: "var(--rp)",
    nodes: ["Users", "React / Vite Client", "Terminal Command Bus", "Metrics Aggregator", "Local Browser"],
    url: "https://iamheet.in",
    statusText: "LIVE"
  },
  { 
    name: "CryptoNexusAI", 
    tag: "ai-market-intelligence", 
    desc: "AI-powered cryptocurrency analytics platform featuring OpenAI integration, Dockerized deployment, AWS EC2 hosting, and Nginx reverse proxy configuration.", 
    color: "var(--purple)",
    nodes: ["Users", "Nginx Gate Proxy", "AWS EC2 Host", "Docker Container", "OpenAI API"],
    url: "https://crypto-nexus.in",
    statusText: "LIVE"
  },
  { 
    name: "Royal Stay", 
    tag: "booking-reservation", 
    desc: "Hotel booking platform built using React.js, Node.js, JWT authentication, MongoDB, and deployed on Microsoft Azure.", 
    color: "var(--success)",
    nodes: ["Users", "JWT Auth Gate", "Node Express API", "MongoDB Atlas", "Azure App Host"],
    url: "https://royalstay.me",
    statusText: "LIVE"
  },
];

export function Systems() {
  const highlighted = useJarvisHighlight("systems");
  return (
    <section style={highlighted ? { outline: "1.5px solid color-mix(in oklch, var(--rp) 70%, transparent)", outlineOffset: "8px", boxShadow: "0 0 20px color-mix(in oklch, var(--rp) 20%, transparent)", borderRadius: "0.75rem", transition: "all 0.4s ease" } : { transition: "all 0.4s ease" }}>
      <SectionHeader 
        id="systems" 
        kicker="// section 07" 
        title="Production Systems" 
        desc="Operational application structures. Audit incoming traffic lines and live service latencies." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SYSTEMS.map(s => <SystemCard key={s.name} s={s} />)}
      </div>

      {/* Additional Projects Section */}
      <div className="mt-4">
        <Panel title="Secondary Systems Registry" badge={<span className="text-muted-foreground font-mono text-[9px]">// additional projects</span>}>
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded border border-border/40 bg-black/10 p-4 font-mono text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:r-border transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success led" />
                  LearnWithH
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed max-w-3xl">
                  Financial blogging platform built using React.js, Supabase authentication, and PostgreSQL database.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 bg-black/20 border border-border/30 px-2.5 py-1 rounded">
                  react.js · supabase · postgresql
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function SystemCard({ s }: { s: Sys }) {
  const cardId = `project-${s.name.toLowerCase().replace(/\s+/g, "-")}`;
  const highlighted = useJarvisHighlight(cardId);
  const [latency, setLatency] = useState(75);
  const [rps, setRps] = useState(25);
  const [simSpeed, setSimSpeed] = useState(1);

  // Listen to sim speed changes
  useEffect(() => {
    const handleSpeed = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.speed === "number") {
        setSimSpeed(customEvent.detail.speed);
      }
    };
    window.addEventListener("sim-speed-change", handleSpeed);
    return () => window.removeEventListener("sim-speed-change", handleSpeed);
  }, []);

  // Fluctuating metric simulation
  useEffect(() => {
    const i = setInterval(() => {
      setLatency(prev => {
        const delta = (Math.random() - 0.5) * 8;
        return Math.max(45, Math.min(220, Math.round(prev + delta)));
      });
      setRps(prev => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.max(10, Math.min(85, Math.round(prev + delta)));
      });
    }, 3500 / Math.max(0.1, simSpeed));
    return () => clearInterval(i);
  }, [simSpeed]);

  return (
    <div style={highlighted ? { outline: `2px solid ${s.color}`, boxShadow: `0 0 28px color-mix(in oklch, ${s.color} 35%, transparent)`, borderRadius: "0.75rem", transition: "all 0.4s ease" } : { transition: "all 0.4s ease" }}>
    <Panel
      title={s.name} 
      badge={
        <div className="flex items-center gap-2 sm:gap-3">
          {s.url && (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] r-text hover:text-white border r-border r-bg px-2 py-0.5 rounded transition-all font-bold tracking-wider cursor-pointer"
            >
              {s.statusText || "LIVE"} ↗
            </a>
          )}
          <span className="flex items-center gap-1.5 text-success font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-glow-success select-none">
            <StatusDot /> <span className="hidden sm:inline">live sync</span>
          </span>
        </div>
      }
    >
      <div className="font-mono text-[10px] text-muted-foreground/60 select-none">
        TAG: {s.tag} // UPLINK: NOMINAL
      </div>
      <div className="text-xs text-foreground/80 mt-2 leading-relaxed min-h-[36px]">{s.desc}</div>
      
      {/* Interactive Request Flow Visualizer */}
      <div className="mt-5 space-y-2 select-none relative">
        {s.nodes.map((nodeName, idx) => (
          <div key={nodeName} className="relative">
            <div className="rounded border border-border/40 bg-black/10 px-3 py-2 font-mono text-[11px] flex items-center justify-between hover:r-border transition-colors">
              <span className="flex items-center gap-1.5 text-muted-foreground/85">
                {idx === 0 ? <Users size={11} className="r-text led" /> : 
                 idx === s.nodes.length - 1 ? <Database size={11} style={{ color: s.color }} className="led" /> : 
                 <Send size={10} className="opacity-40" />}
                {nodeName}
              </span>
              <span style={{ color: s.color }} className="font-bold text-[9px] tracking-widest r-text-glow">
                {idx === 0 ? "ENTRY" : idx === s.nodes.length - 1 ? "STORE" : "SYS"}
              </span>
            </div>
            
            {/* Pulsing signal dot passing down */}
            {idx < s.nodes.length - 1 && (
              <div className="relative my-1.5 h-6 mx-auto w-[1px] bg-gradient-to-b from-border/50 to-transparent">
                <motion.div 
                  className="absolute left-1/2 -translate-x-1/2 h-2 w-2 rounded-full led"
                  style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                  animate={{ top: ["-10%", "110%"], opacity: [0, 1, 0] }}
                  transition={{ 
                    duration: 1.4 / Math.max(0.1, simSpeed), 
                    repeat: Infinity, 
                    delay: idx * 0.25, 
                    ease: "linear" 
                  }} 
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Real-time fluctuating telemetry */}
      <div className="mt-5 grid grid-cols-3 gap-2 font-mono text-[9px] text-muted-foreground/50 select-none">
        <div className="rounded border border-border/40 p-2 sm:p-2.5 bg-black/15">
          <div className="text-muted-foreground/30 text-[7px] sm:text-[8px] uppercase tracking-wider">THROUGHPUT</div>
          <div className="text-foreground font-bold text-[10px] sm:text-[11px] mt-0.5 tabular-nums r-text-glow">{rps} rps</div>
        </div>
        <div className="rounded border border-border/40 p-2 sm:p-2.5 bg-black/15">
          <div className="text-muted-foreground/30 text-[7px] sm:text-[8px] uppercase tracking-wider">LATENCY</div>
          <div className="text-foreground font-bold text-[10px] sm:text-[11px] mt-0.5 tabular-nums r-text-glow">{latency}ms</div>
        </div>
        <div className="rounded border border-border/40 p-2 sm:p-2.5 bg-black/15">
          <div className="text-muted-foreground/30 text-[7px] sm:text-[8px] uppercase tracking-wider">UPTIME</div>
          <div className="text-success font-bold text-[10px] sm:text-[11px] mt-0.5 tabular-nums text-glow-success">99.98%</div>
        </div>
      </div>
    </Panel>
    </div>
  );
}

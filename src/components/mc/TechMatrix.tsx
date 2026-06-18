import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader, Panel } from "./primitives";
import { useState } from "react";
import { Cpu, Terminal, Network, Star } from "lucide-react";

type Tech = { 
  name: string; 
  xp: string; 
  use: string; 
  role: string; 
  projects: string[];
  pct: number;
  cat: "infra" | "code" | "db"
};

const TECH: Tech[] = [
  { name: "AWS", xp: "6m", use: "Daily", role: "EC2 · VPC · S3 · IAM · Route53", projects: ["CryptoNexusAI"], pct: 90, cat: "infra" },
  { name: "Docker", xp: "6m", use: "Daily", role: "Containerization · Multi-stage builds", projects: ["All systems"], pct: 92, cat: "infra" },
  { name: "Kubernetes", xp: "6m", use: "Weekly", role: "Pod orchestration · Ingress · Ingress controller · HPA", projects: ["Internal cluster"], pct: 85, cat: "infra" },
  { name: "Linux Administration", xp: "6m", use: "Daily", role: "Ubuntu server configuration · SSH · Patching", projects: ["All hosts"], pct: 88, cat: "infra" },
  { name: "Nginx Gateway", xp: "6m", use: "Daily", role: "Reverse proxy · TLS termination · Load balancer", projects: ["All networks"], pct: 85, cat: "infra" },
  { name: "GitHub Actions", xp: "6m", use: "Daily", role: "Continuous Integration & continuous deployment workflows", projects: ["All applications"], pct: 92, cat: "infra" },
  { name: "Prometheus Monitoring", xp: "6m", use: "Weekly", role: "Time-series scraper · alerting rules", projects: ["Telemetry center"], pct: 84, cat: "infra" },
  { name: "Grafana Charts", xp: "6m", use: "Weekly", role: "SLO dashboards · crosshair visualization", projects: ["Telemetry center"], pct: 82, cat: "infra" },
  
  { name: "Node.js Platform", xp: "6m", use: "Daily", role: "REST APIs · microservices logic", projects: ["Royal Stay", "LearnWithH"], pct: 90, cat: "code" },
  { name: "Next.js Framework", xp: "6m", use: "Daily", role: "Fullstack server side rendering", projects: ["CryptoNexusAI"], pct: 88, cat: "code" },
  { name: "React Library", xp: "6m", use: "Daily", role: "Interactive dashboard logic", projects: ["Mission OS"], pct: 92, cat: "code" },
  { name: "OpenAI Models", xp: "Hands-on", use: "Daily", role: "LLM completions · semantic indexing", projects: ["CryptoNexusAI"], pct: 80, cat: "code" },

  { name: "MongoDB Core", xp: "6m", use: "Weekly", role: "NoSQL document collections", projects: ["Royal Stay"], pct: 86, cat: "db" },
  { name: "MySQL Server", xp: "6m", use: "Weekly", role: "Relational database administration", projects: ["Internal systems"], pct: 82, cat: "db" },
  { name: "PostgreSQL DB", xp: "6m", use: "Weekly", role: "Relational queries · triggers", projects: ["LearnWithH"], pct: 85, cat: "db" },
  { name: "Supabase Core", xp: "Hands-on", use: "Daily", role: "Auth · Realtime Postgres websocket channels", projects: ["LearnWithH"], pct: 88, cat: "db" },
];

export function TechMatrix() {
  const [activeTab, setActiveTab] = useState<"all" | "infra" | "code" | "db">("all");
  const [activeTech, setActiveTech] = useState<Tech>(TECH[0]);

  const filteredTech = TECH.filter(t => activeTab === "all" || t.cat === activeTab);

  return (
    <section>
      <SectionHeader 
        id="stack" 
        kicker="// section 05" 
        title="Technology Matrix" 
        desc="Operational tools catalog. Filter by category, or hover elements to fetch diagnostic descriptions." 
      />
      
      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-6 overflow-x-auto scrollbar-none select-none">
        {[
          { id: "all", label: "ALL MODULES", icon: <Cpu size={12} /> },
          { id: "infra", label: "CLOUD & INFRA", icon: <Network size={12} /> },
          { id: "code", label: "LOGIC & FRAMEWORKS", icon: <Terminal size={12} /> },
          { id: "db", label: "DATABASES & AI", icon: <Star size={12} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              // Set first filtered item as active tech
              const filtered = TECH.filter(t => tab.id === "all" || t.cat === tab.id);
              if (filtered.length > 0) setActiveTech(filtered[0]);
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] uppercase tracking-wider rounded border cursor-pointer transition-all duration-300 ${
              activeTab === tab.id 
                ? "r-chip r-text-glow shadow-glow" 
                : "border-border/30 hover:r-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Module grid */}
        <div className="lg:col-span-8">
          <Panel title={`Module Grid · ${filteredTech.length} Active`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              <AnimatePresence mode="popLayout">
                {filteredTech.map(t => {
                  const isActive = activeTech.name === t.name;
                  return (
                    <motion.button
                      key={t.name}
                      onMouseEnter={() => setActiveTech(t)}
                      onFocus={() => setActiveTech(t)}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -2 }}
                      className={`text-left rounded border px-3 py-3.5 font-mono text-xs transition-all duration-300 cursor-pointer ${
                        isActive 
                          ? "r-chip shadow-glow" 
                          : "border-border/40 bg-card/15 hover:r-border hover:bg-black/20"
                      }`}
                    >
                      <div className="text-foreground font-bold tracking-tight">{t.name}</div>
                      <div className="text-[9px] text-muted-foreground/60 mt-1 uppercase tracking-widest">{t.use}</div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </Panel>
        </div>

        {/* Detailed readout card */}
        <div className="lg:col-span-4">
          <Panel title={`Module Readout // ${activeTech.name}`} badge={<span className="r-text font-mono">{activeTech.xp}</span>}>
            <div className="space-y-4 font-mono text-xs pt-1 select-none">
              <Row k="experience" v={activeTech.xp} />
              <Row k="usage_rate" v={activeTech.use} />
              <Row k="assigned_role" v={activeTech.role} />
              <Row k="projects_list" v={activeTech.projects.join(" · ")} />
              
              <div className="pt-3 border-t border-border/10">
                <div className="text-muted-foreground/50 text-[9px] uppercase tracking-widest mb-1.5 flex justify-between items-center">
                  <span>MODULE PROFICIENCY</span>
                  <span className="r-text font-bold">{activeTech.pct}%</span>
                </div>
                
                {/* Skill bar */}
                <div className="h-1.5 w-full rounded-full bg-muted/20 overflow-hidden relative">
                  <motion.div 
                    key={activeTech.name} 
                    initial={{ width: 0 }} 
                    animate={{ width: `${activeTech.pct}%` }} 
                    transition={{ duration: 0.8, ease: "easeOut" }} 
                    className="h-full r-bar led" 
                  />
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/10 pb-2">
      <span className="text-muted-foreground/60">{k}</span>
      <span className="text-foreground text-right font-medium">{v}</span>
    </div>
  );
}

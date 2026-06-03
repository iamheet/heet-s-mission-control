import { motion } from "framer-motion";
import { SectionHeader, Panel } from "./primitives";
import { useState } from "react";

type Tech = { name: string; xp: string; use: string; role: string; projects: string[] };
const TECH: Tech[] = [
  { name: "AWS", xp: "2y", use: "Daily", role: "EC2 · VPC · S3 · IAM", projects: ["CryptoNexusAI", "GrandStay"] },
  { name: "Docker", xp: "2y", use: "Daily", role: "Containerization · multi-stage builds", projects: ["All systems"] },
  { name: "Kubernetes", xp: "1y", use: "Weekly", role: "Pod orchestration · ingress · HPA", projects: ["Internal cluster"] },
  { name: "Linux", xp: "3y", use: "Daily", role: "Ubuntu server administration", projects: ["All systems"] },
  { name: "Nginx", xp: "2y", use: "Daily", role: "Reverse proxy · TLS · load balancing", projects: ["All systems"] },
  { name: "GitHub Actions", xp: "2y", use: "Daily", role: "CI/CD pipelines · automation", projects: ["All systems"] },
  { name: "Prometheus", xp: "1y", use: "Weekly", role: "Metrics scraping · alerting", projects: ["Observability"] },
  { name: "Grafana", xp: "1y", use: "Weekly", role: "Dashboards · SLO visualization", projects: ["Observability"] },
  { name: "Node.js", xp: "3y", use: "Daily", role: "API services · tooling", projects: ["GrandStay", "LearnWithH"] },
  { name: "Next.js", xp: "2y", use: "Daily", role: "Full-stack web apps", projects: ["CryptoNexusAI"] },
  { name: "React", xp: "3y", use: "Daily", role: "UI engineering", projects: ["All apps"] },
  { name: "MongoDB", xp: "2y", use: "Weekly", role: "Document datastore", projects: ["GrandStay"] },
  { name: "MySQL", xp: "2y", use: "Weekly", role: "Relational datastore", projects: ["Internal"] },
  { name: "PostgreSQL", xp: "1y", use: "Weekly", role: "Relational + extensions", projects: ["LearnWithH"] },
  { name: "Supabase", xp: "1y", use: "Daily", role: "Auth · Postgres · realtime", projects: ["LearnWithH"] },
  { name: "OpenAI", xp: "1y", use: "Daily", role: "LLM orchestration · embeddings", projects: ["CryptoNexusAI"] },
];

export function TechMatrix() {
  const [active, setActive] = useState<Tech>(TECH[0]);
  return (
    <section>
      <SectionHeader id="stack" kicker="// section 05" title="Technology Matrix" desc="Operational stack — hover any module to inspect its role in the platform." />
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <Panel title={`stack · ${TECH.length} modules`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {TECH.map(t => {
                const a = active.name === t.name;
                return (
                  <motion.button
                    key={t.name}
                    onMouseEnter={() => setActive(t)}
                    onFocus={() => setActive(t)}
                    whileHover={{ y: -3 }}
                    className={`text-left rounded-md border px-3 py-3 font-mono text-xs transition-colors ${a ? "border-cyan/70 bg-cyan/10 glow-cyan" : "border-border/60 bg-card/40 hover:border-cyan/40"}`}
                  >
                    <div className="text-foreground">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">{t.use}</div>
                  </motion.button>
                );
              })}
            </div>
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel title={`module · ${active.name}`} badge={<span className="text-cyan">{active.xp}</span>}>
            <div className="space-y-3 font-mono text-xs">
              <Row k="experience" v={active.xp} />
              <Row k="usage" v={active.use} />
              <Row k="role" v={active.role} />
              <Row k="projects" v={active.projects.join(" · ")} />
              <div className="pt-2">
                <div className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1">proficiency</div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div key={active.name} initial={{ width: 0 }} animate={{ width: active.use === "Daily" ? "92%" : "70%" }} transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-cyan to-purple" />
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
  return <div className="flex justify-between gap-4 border-b border-border/40 pb-1.5"><span className="text-muted-foreground">{k}</span><span className="text-foreground text-right">{v}</span></div>;
}

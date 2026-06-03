import { motion } from "framer-motion";
import { SectionHeader, Panel } from "./primitives";

const LOGS = [
  ["INFO", "joined Softedge Infotech as Software & DevOps Engineer"],
  ["OK", "provisioned AWS infrastructure (EC2, VPC, IAM, S3)"],
  ["OK", "built CI/CD pipelines on GitHub Actions for 6+ services"],
  ["OK", "containerized legacy applications with Docker"],
  ["OK", "configured Nginx · reverse proxy, TLS, load balancing"],
  ["OK", "managed Ubuntu Linux servers · hardening & patching"],
  ["OK", "deployed Prometheus + Grafana monitoring stack"],
  ["OK", "automated deployments · 90% reduction in release time"],
  ["INFO", "mentored junior engineers on DevOps practices"],
];

export function History() {
  return (
    <section>
      <SectionHeader id="history" kicker="// section 06" title="Mission History" desc="Operational record streamed from systemd journal." />
      <Panel title="journalctl -u career.service --since '2y ago'" badge={<span className="text-muted-foreground">live tail</span>}>
        <div className="rounded bg-black/40 border border-border/60 p-3 font-mono text-[12px] space-y-1">
          <div className="text-cyan mb-2">┌─ softedge-infotech · Software & DevOps Engineer</div>
          {LOGS.map(([lvl, msg], i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="flex gap-3">
              <span className="text-muted-foreground">2024-{String((i % 12) + 1).padStart(2, "0")}-{String(((i * 7) % 28) + 1).padStart(2, "0")}</span>
              <span className={lvl === "OK" ? "text-success" : "text-cyan"}>[{lvl}]</span>
              <span className="text-foreground/90">{msg}</span>
            </motion.div>
          ))}
          <div className="text-muted-foreground mt-2">└─ end of stream · awaiting next opportunity ▌</div>
        </div>
      </Panel>
    </section>
  );
}

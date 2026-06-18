import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader, Panel } from "./primitives";
import { useState } from "react";
import { Search, Terminal, Filter } from "lucide-react";

interface LogLine {
  lvl: "OK" | "INFO" | "WARN";
  msg: string;
  date: string;
}

const HISTORICAL_LOGS: LogLine[] = [
  { lvl: "INFO", date: "2025-10-06", msg: "Joined Softedge Infotech as Software & DevOps Engineer" },
  { lvl: "OK",   date: "2025-11-14", msg: "Managed AWS EC2 deployments and configured Nginx reverse proxies" },
  { lvl: "OK",   date: "2026-03-10", msg: "Built Docker containers and multi-stage Dockerfiles" },
  { lvl: "OK",   date: "2026-04-05", msg: "Created CI/CD pipelines using GitHub Actions and administered Linux servers" },
  { lvl: "OK",   date: "2026-05-12", msg: "Monitored infrastructure using Prometheus and Grafana" },
  { lvl: "OK",   date: "2026-05-28", msg: "Worked with Kubernetes deployments" },
  { lvl: "OK",   date: "2026-06-01", msg: "Developed full-stack features using React.js and Node.js" },
  { lvl: "OK",   date: "2026-06-02", msg: "Integrated MySQL and MongoDB databases" },
  { lvl: "INFO", date: "2026-06-03", msg: "System uplink nominal. Awaiting next software or DevOps mission" },
];

export function History() {
  const [search, setSearch] = useState("");
  const [filterLvl, setFilterLvl] = useState<"ALL" | "OK" | "INFO">("ALL");

  const filteredLogs = HISTORICAL_LOGS.filter(log => {
    const matchesSearch = log.msg.toLowerCase().includes(search.toLowerCase()) || 
                          log.date.includes(search) || 
                          log.lvl.toLowerCase().includes(search.toLowerCase());
    const matchesLvl = filterLvl === "ALL" || log.lvl === filterLvl;
    return matchesSearch && matchesLvl;
  });

  return (
    <section>
      <SectionHeader 
        id="history" 
        kicker="// section 06" 
        title="Mission History" 
        desc="Operational chronology and achievements. Audit the journal logs using queries or level filters." 
      />
      
      <Panel title="journalctl -u career.service --since '6m ago'" badge={<span className="text-muted-foreground font-mono">live logs tail</span>}>
        {/* Terminal toolbar header */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-b border-border/20 pb-3 mb-4 select-none">
          {/* Level filters */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <Filter size={11} className="text-muted-foreground/45 mr-1" />
            {(["ALL", "OK", "INFO"] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLvl(lvl)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono border cursor-pointer transition-colors ${
                  filterLvl === lvl 
                    ? "r-chip r-text-glow shadow-glow" 
                    : "border-border/30 hover:r-border text-muted-foreground/60 hover:text-foreground"
                }`}
              >
                [{lvl}]
              </button>
            ))}
          </div>

          {/* Search bar inside the terminal console */}
          <div className="flex items-center gap-2 bg-black/40 border border-border/40 rounded px-2.5 py-1.5 w-full md:w-64 self-end md:self-auto">
            <Search size={11} className="text-muted-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter logs (e.g. aws, docker)..."
              className="bg-transparent border-none outline-none font-mono text-[10px] text-foreground flex-1 placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        {/* Logs Output */}
        <div className="rounded bg-black/55 border border-border/40 p-4 font-mono text-[11.5px] min-h-[300px] max-h-[450px] overflow-y-auto flex flex-col gap-2 relative shadow-inner">
          <div className="absolute inset-0 hudo-grid opacity-5 pointer-events-none" />
          
          <div className="r-text mb-2 border-b border-border/10 pb-1.5 select-none flex items-center gap-2">
            <Terminal size={12} className="r-text-glow" />
            <span>┌─ softedge-infotech · Software &amp; DevOps Engineer</span>
          </div>
          
          <div className="space-y-1.5 flex-1">
            <AnimatePresence mode="popLayout">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, i) => (
                  <motion.div 
                    key={log.date + log.msg} 
                    initial={{ opacity: 0, x: -6 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="flex flex-col sm:flex-row gap-1.5 sm:gap-4 leading-relaxed"
                  >
                    <span className="text-muted-foreground/50 select-none">{log.date}</span>
                    <span className={log.lvl === "OK" ? "text-success font-semibold" : "r-text font-semibold"}>
                      [{log.lvl}]
                    </span>
                    <span className="text-foreground/90">{log.msg}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-muted-foreground/30 text-center py-12 select-none">
                  NO LOG ROWS MATCHED CURRENT SEARCH QUERY OR LEVEL FILTERS
                </div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="text-muted-foreground/40 mt-3 pt-2 border-t border-border/10 select-none">
            └─ end of stream · system idling · awaiting new connection ▌
          </div>
        </div>
      </Panel>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { SectionHeader, Panel } from "./primitives";
import { Terminal as TermIcon, Play, CornerDownLeft } from "lucide-react";
import { useJarvisHighlight } from "@/hooks/useJarvisHighlight";

const HEET_ASCII_LOGO = `
 ██████╗ ███████╗██╗   ██╗ ██████╗ ██████╗  ██████╗
 ██╔══██╗██╔════╝██║   ██║██╔═══██╗██╔══██╗██╔════╝
 ██║  ██║█████╗  ██║   ██║██║   ██║██████╔╝╚█████╗ 
 ██║  ██║██╔══╝  ╚██╗ ██╔╝██║   ██║██╔═══╝  ╚═══██╗
 ██████╔╝███████╗ ╚████╔╝ ╚██████╔╝██║     ██████╔╝
 ╚═════╝ ╚══════╝  ╚═══╝   ╚═════╝ ╚═╝     ╚═════╝ 
`;

const SKILLS_TABLE = `
+--------------------+------------+-------------------------------------+
| CATEGORY / MODULE  | EXPOSURE   | TOOLS & LANGUAGES                   |
+--------------------+------------+-------------------------------------+
| Cloud & Containers | Hands-on   | AWS EC2, Microsoft Azure, Docker,   |
|                    |            | Kubernetes                          |
| CI/CD & Net        | Hands-on   | GitHub Actions, Nginx, DNS          |
| Observability      | Hands-on   | Prometheus, Grafana                 |
| Backend & Database | Hands-on   | Node.js, Express.js, MongoDB,       |
|                    |            | MySQL, PostgreSQL, Supabase         |
| Frontend           | Hands-on   | React.js, Next.js                   |
| Languages          | Hands-on   | JavaScript, TypeScript, Python,     |
|                    |            | SQL, Bash                           |
| Tools & APIs       | Hands-on   | Git, GitHub, Postman, VS Code,      |
|                    |            | OpenAI API, GitHub Copilot          |
+--------------------+------------+-------------------------------------+
`;

const PROJECTS_GRID = `
+------------------+-----------------------+-----------------------------+
| PROJECT NAME     | ENVIRONMENT           | CAPABILITIES                |
+------------------+-----------------------+-----------------------------+
| Mission OS       | React · Framer Motion | DevOps Mission Control      |
| CryptoNexusAI    | Next.js · OpenAI · AWS| AI crypto market analytics  |
| Royal Stay       | Node · MongoDB · Azure| Hotel booking & reservation |
+------------------+-----------------------+-----------------------------+
`;

const RESPONSES: Record<string, string[]> = {
  help: [
    "AVAILABLE COMMANDS:",
    "  help           · list all available console commands",
    "  about          · output operator profile details & ASCII art logo",
    "  skills         · print detailed skills matrix table",
    "  projects       · display production systems registry",
    "  monitoring     · query Prometheus observability status logs",
    "  infrastructure · fetch active AWS EC2 & Docker runtime statistics",
    "  contact        · output encrypted communication uplink targets",
    "  resume         · trigger resume PDF download gate",
    "  clear          · wipe terminal feed cache"
  ],
  about: [
    HEET_ASCII_LOGO,
    "OPERATOR DOSSIER // HEET CHOKSHI",
    "------------------------------------------------------------------",
    "ROLE: Software & DevOps Engineer",
    "LOCATION: Ahmedabad, Gujarat, India (IST)",
    "BACKGROUND: Software & DevOps Engineer with professional experience at Softedge Infotech.",
    "MISSION: Deploying on AWS EC2, configuring Nginx proxies, and building actions pipelines."
  ],
  skills: [
    "FETCHING MODULE CAPABILITY MATRIX...",
    SKILLS_TABLE
  ],
  projects: [
    "FETCHING PRODUCTION APPLICATION VAULTS...",
    PROJECTS_GRID
  ],
  monitoring: [
    "[prometheus] scrape status: NOMINAL // 128 targets up",
    "[grafana] alerts: stable // 4 monitoring rules active",
    "[loki] logs pipeline: indexing 14-day retention cycle"
  ],
  infrastructure: [
    "[aws] ec2 ap-south-1a: 3 instances active [vCPU Load: 0.42]",
    "[nginx] edge proxy: TLS/SSL nominal, HTTP/2 compression ok",
    "[docker] engine: running 47 container blocks [health: 99.97%]"
  ],
  contact: [
    "COMMUNICATION LINK GATEWAYS:",
    "  email    · iamheetchokshi@gmail.com",
    "  github   · github.com/iamheet",
    "  linkedin · linkedin.com/in/iamheetchokshi",
    "  phone    · +91 90996 66950",
    "  resume   · download cv file in Section 10"
  ],
  resume: [
    "INITIATING SECURE RESUME UPLINK PROTOCOL...",
    "Document: Heet_Chokshi_Resume.pdf",
    "URL: /resume/Heet_Chokshi_Resume.pdf",
    "Status: Transmitting document stream. Opening in new tab..."
  ]
};

const COMMANDS = ["help", "about", "skills", "projects", "monitoring", "infrastructure", "contact", "resume", "clear"];

export function Terminal() {
  const [lines, setLines] = useState<{ t: "in" | "out"; s: string }[]>([
    { t: "out", s: "heet-os console v2.4.1 // secure terminal gateway" },
    { t: "out", s: "type 'help' or select a command chip below to initialize database." },
  ]);
  const [val, setVal] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on logs
  useEffect(() => {
    if (!logsContainerRef.current) return;
    const el = logsContainerRef.current;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (isAtBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [lines]);

  // Listen to external Kubernetes / system event logs
  useEffect(() => {
    const handleLogs = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.text === "string") {
        setLines(prev => [...prev, { t: "out", s: customEvent.detail.text }]);
      }
    };
    window.addEventListener("terminal-output", handleLogs);
    return () => window.removeEventListener("terminal-output", handleLogs);
  }, []);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();

    // Save to history
    setHistory(prev => [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, 30));
    setHistoryIdx(-1);

    if (lower === "clear") {
      setLines([]);
      return;
    }

    if (lower === "resume") {
      if (typeof window !== "undefined") {
        window.open("/resume/Heet_Chokshi_Resume.pdf", "_blank");
      }
    }

    const output = RESPONSES[lower] ?? [`command not found: ${trimmed}`, "type 'help' to review directory of commands."];
    setLines(prev => [
      ...prev,
      { t: "in", s: trimmed },
      ...output.map(s => ({ t: "out" as const, s }))
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx < history.length) {
        setHistoryIdx(nextIdx);
        setVal(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const prevIdx = historyIdx - 1;
      if (prevIdx >= 0) {
        setHistoryIdx(prevIdx);
        setVal(history[prevIdx]);
      } else {
        setHistoryIdx(-1);
        setVal("");
      }
    }
  };

  const highlighted = useJarvisHighlight("terminal");
  return (
    <section style={highlighted ? { outline: "1.5px solid color-mix(in oklch, var(--rp) 70%, transparent)", outlineOffset: "8px", boxShadow: "0 0 20px color-mix(in oklch, var(--rp) 20%, transparent)", borderRadius: "0.75rem", transition: "all 0.4s ease" } : { transition: "all 0.4s ease" }}>
      <SectionHeader
        id="terminal"
        kicker="// section 10"
        title="Operator Terminal"
        desc="Interactive shell environment. Run diagnostic commands to query Heet's project databases."
      />

      <Panel title="heet@mission-control:~$" badge={<span className="text-success font-mono text-[9px] uppercase font-bold tracking-widest text-glow-success select-none animate-pulse">● online</span>}>
        {/* Terminal logs window */}
        <div ref={logsContainerRef} className="rounded bg-black/60 border border-border/40 p-4 font-mono text-[11.5px] h-80 overflow-y-auto flex flex-col gap-1 relative shadow-inner select-text">
          <div className="absolute inset-0 hudo-grid opacity-5 pointer-events-none" />

          {lines.map((l, i) => {
            const isIn = l.t === "in";

            // Format ASCII logo or grids differently
            const isLogo = l.s.includes("██");
            const isTable = l.s.includes("+-") || l.s.includes("|");

            return (
              <div
                key={i}
                className={`${isIn ? "r-text" : "text-foreground/90"
                  } leading-relaxed whitespace-pre-wrap ${(isLogo || isTable) ? "text-[8px] sm:text-[10px] leading-tight font-bold font-mono overflow-x-auto select-all" : ""
                  }`}
              >
                {isIn ? (
                  <div className="select-none flex items-center gap-1.5">
                    <span className="text-muted-foreground/60">heet@os ~</span>
                    <span className="r-text">$</span>
                    <span className="text-foreground font-semibold">{l.s}</span>
                  </div>
                ) : (
                  l.s
                )}
              </div>
            );
          })}

          {/* Terminal Input Form */}
          <form
            onSubmit={e => { e.preventDefault(); executeCommand(val); setVal(""); }}
            className="flex items-center gap-1.5 mt-2 select-none"
          >
            <span className="text-muted-foreground/60">heet@os ~</span>
            <span className="r-text font-bold">$</span>
            <input
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-foreground caret-(--rp) font-mono"
              placeholder="type commands here (e.g. about, skills)..."
            />
            <button type="submit" className="text-muted-foreground/45 hover:r-text p-1 rounded hover:bg-white/5 transition-colors cursor-pointer">
              <CornerDownLeft size={12} />
            </button>
          </form>
        </div>

        {/* Quick command tags / chips */}
        <div className="mt-4 pt-4 border-t border-border/10 select-none">
          <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-2 font-mono flex items-center gap-1.5">
            <TermIcon size={12} className="r-text" /> QUICK_COMMAND_HUDS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMANDS.map(cmd => (
              <button
                key={cmd}
                onClick={() => executeCommand(cmd)}
                className="flex items-center gap-1 px-3 py-1 rounded border border-border/40 hover:r-border r-bg hover:r-bg-md text-muted-foreground hover:text-foreground font-mono text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer"
              >
                <Play size={8} className="r-text" /> {cmd}
              </button>
            ))}
          </div>
        </div>
      </Panel>
    </section>
  );
}

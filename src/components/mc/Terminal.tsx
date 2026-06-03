import { useEffect, useRef, useState } from "react";
import { SectionHeader, Panel } from "./primitives";

const RESPONSES: Record<string, string[]> = {
  help: ["available commands:", "  help · about · skills · projects · contact · resume · monitoring · infrastructure · clear"],
  about: [
    "Heet Chokshi — Software & DevOps Engineer",
    "Based in Ahmedabad, India.",
    "Builds, operates and observes production cloud systems.",
  ],
  skills: ["AWS · Docker · Kubernetes · Linux · Nginx · GitHub Actions", "Prometheus · Grafana · Node.js · Next.js · React", "MongoDB · MySQL · PostgreSQL · Supabase · OpenAI"],
  projects: ["▸ CryptoNexusAI  — AI crypto intelligence", "▸ GrandStay      — hotel platform", "▸ LearnWithH     — edu platform (Supabase)"],
  contact: ["email   · heet@example.com", "github  · github.com/heet", "linkedin· linkedin.com/in/heet"],
  resume: ["resume binary located at /artifacts/heet-cv.pdf", "use [download resume] link in §10."],
  monitoring: ["prometheus: 128 targets up", "grafana: 7 dashboards · 4 alert rules", "loki: log retention 14d"],
  infrastructure: ["aws ec2 ap-south-1 · 3 instances", "nginx (TLS, gzip, http/2)", "docker 47 containers · 99.97% health"],
};

export function Terminal() {
  const [lines, setLines] = useState<{ t: "in" | "out"; s: string }[]>([
    { t: "out", s: "heet-os terminal · type 'help' to list commands" },
  ]);
  const [val, setVal] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const run = (cmd: string) => {
    const c = cmd.trim().toLowerCase();
    if (!c) return;
    if (c === "clear") { setLines([]); return; }
    const out = RESPONSES[c] ?? [`command not found: ${c}`, "type 'help' for the list of commands"];
    setLines(prev => [...prev, { t: "in", s: cmd }, ...out.map(s => ({ t: "out" as const, s }))]);
  };

  return (
    <section>
      <SectionHeader id="terminal" kicker="// section 09" title="Operator Terminal" desc="Direct shell access. Try: about · skills · projects · monitoring · infrastructure." />
      <Panel title="heet@mission-control:~$" badge={<span className="text-success">interactive</span>}>
        <div className="rounded bg-black/50 border border-border/60 p-3 font-mono text-[12px] h-72 overflow-y-auto">
          {lines.map((l, i) => (
            <div key={i} className={l.t === "in" ? "text-cyan" : "text-foreground/85"}>
              {l.t === "in" ? <><span className="text-muted-foreground">heet@os ~</span> $ {l.s}</> : l.s}
            </div>
          ))}
          <form onSubmit={e => { e.preventDefault(); run(val); setVal(""); }} className="flex items-center gap-1 mt-1">
            <span className="text-muted-foreground">heet@os ~</span><span className="text-cyan">$</span>
            <input
              autoFocus
              value={val}
              onChange={e => setVal(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground caret-cyan"
              placeholder="type a command…"
            />
          </form>
          <div ref={endRef} />
        </div>
      </Panel>
    </section>
  );
}

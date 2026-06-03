import { useEffect, useState } from "react";

export function TopBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const t = () => setTime(new Date().toUTCString().split(" ").slice(4, 5)[0] + " UTC");
    t();
    const i = setInterval(t, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-2.5 font-mono text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-cyan to-purple grid place-items-center text-background font-bold">H</div>
            <span className="text-foreground font-semibold tracking-widest">HEET·OS</span>
            <span className="text-muted-foreground hidden sm:inline">/ mission-control</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-5 text-muted-foreground">
          {["overview", "infra", "deploy", "observe", "stack", "systems", "k8s", "terminal", "contact"].map(s => (
            <a key={s} href={`#${s}`} className="hover:text-foreground transition-colors">{s}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success led" /> all-systems-nominal</span>
          <span className="text-muted-foreground">{time}</span>
        </div>
      </div>
    </header>
  );
}

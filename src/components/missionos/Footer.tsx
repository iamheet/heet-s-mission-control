import { CircuitBoard, Cpu } from "lucide-react";
import { ACCENT, neon } from "./theme";

export function Footer() {
  return (
    <footer className="mt-4 flex items-center justify-center gap-4 py-4 text-cyan-300/70">
      <CircuitBoard size={16} className="opacity-60" />
      <span className="h-px w-24 bg-gradient-to-r from-transparent to-cyan-400/40" />
      <Cpu size={13} className="opacity-70" />
      <span
        className="font-display text-xs font-semibold uppercase tracking-[0.5em] text-cyan-300"
        style={neon(ACCENT.cyan, 6)}
      >
        JARVIS OS 2040
      </span>
      <Cpu size={13} className="opacity-70" />
      <span className="h-px w-24 bg-gradient-to-l from-transparent to-cyan-400/40" />
      <CircuitBoard size={16} className="opacity-60" />
    </footer>
  );
}

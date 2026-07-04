import { useEffect, useRef, useState } from "react";
import { Panel, PanelHeader } from "./primitives";
import { TERMINAL_LINES, TERMINAL_PROMPT } from "./mockData";

/**
 * Types the deploy log line-by-line, holds when finished, then restarts —
 * a lightweight "live console" effect. Timers are client-only (useEffect),
 * so SSR renders the fully-typed state below via the initial `revealed`.
 */
export function TerminalCard() {
  // start fully revealed for SSR/first paint, then the effect drives the loop
  const [revealed, setRevealed] = useState(TERMINAL_LINES.length);
  const step = useRef(0);

  useEffect(() => {
    setRevealed(0); // begin the typing cycle once mounted
    const timer = setInterval(() => {
      step.current += 1;
      const total = TERMINAL_LINES.length;
      // reveal lines 1..total, hold for ~6 ticks, then reset
      if (step.current <= total) {
        setRevealed(step.current);
      } else if (step.current > total + 6) {
        step.current = 0;
        setRevealed(0);
      }
    }, 550);
    return () => clearInterval(timer);
  }, []);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader lead="TERMINAL" caption="Command Center" />

      <div className="flex-1 rounded-lg border border-[rgba(0,229,255,0.12)] bg-[#03050A] p-3 font-mono text-[11px] leading-relaxed">
        {/* window dots */}
        <div className="mb-2 flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>

        {TERMINAL_LINES.slice(0, revealed).map((line, i) => {
          if (line.kind === "cmd") {
            return (
              <div key={i} className="text-slate-300">
                <span className="text-cyan-400">&gt; {TERMINAL_PROMPT}</span>{" "}
                <span className="text-slate-200">{line.text}</span>
              </div>
            );
          }
          if (line.kind === "info") {
            return (
              <div key={i} className="text-cyan-300/90">
                {line.text}
              </div>
            );
          }
          return (
            <div key={i} className="text-[#00FFB3]">
              <span className="text-[#00FFB3]">✓</span> {line.text}
            </div>
          );
        })}

        {/* prompt + blinking cursor only when the log has finished (or before it starts) */}
        {revealed >= TERMINAL_LINES.length && (
          <div className="text-cyan-400">
            &gt; {TERMINAL_PROMPT}{" "}
            <span className="mo-blink inline-block h-3.5 w-2 translate-y-0.5 bg-cyan-300" />
          </div>
        )}
      </div>
    </Panel>
  );
}

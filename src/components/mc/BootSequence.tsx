import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";

const STEPS = [
  "Loading Infrastructure...",
  "Loading Monitoring Stack...",
  "Loading Kubernetes Cluster...",
  "Loading Deployment Systems...",
  "Loading Operator Profile...",
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [granted, setGranted] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (i < STEPS.length) {
      const t = setTimeout(() => setI(i + 1), 420);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setGranted(true), 250);
    const t2 = setTimeout(() => setShowButton(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [i]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background scanline"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-full max-w-xl px-8 flex flex-col justify-center">
        <Logo variant="loader" size={100} className="mx-auto mb-8 text-cyan" />
        <div className="font-mono text-xs text-muted-foreground mb-6 flex items-center gap-2 justify-center">
          <span className="h-2 w-2 rounded-full bg-success led" />
          HEET-OS v2.4.1 • boot sequence
        </div>
        <div className="space-y-2 font-mono text-sm">
          {STEPS.map((s, idx) => (
            <motion.div
              key={s}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: idx < i ? 1 : idx === i ? 0.7 : 0.2, x: 0 }}
              className="flex items-center justify-between"
            >
              <span className="text-foreground/90">
                <span className="text-cyan">›</span> {s}
              </span>
              <span className={idx < i ? "text-success" : "text-muted-foreground"}>
                {idx < i ? "[ OK ]" : idx === i ? "[ .. ]" : "[ -- ]"}
              </span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {granted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 rounded-md border border-success/40 bg-success/10 p-3 font-mono text-success text-center text-glow-cyan"
            >
              ▣ ACCESS GRANTED — WELCOME, OPERATOR
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex justify-center"
            >
              <button
                onClick={onDone}
                className="w-full py-3.5 rounded border border-success/60 bg-success/10 text-success hover:bg-success/20 active:scale-95 transition-all duration-300 font-mono font-bold tracking-[0.2em] text-xs uppercase shadow-glow cursor-pointer"
                style={{ boxShadow: "0 0 15px oklch(0.7 0.2 140 / 0.15)" }}
              >
                INITIALIZE_SYSTEM.EXE
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

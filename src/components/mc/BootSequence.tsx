import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
    if (i < STEPS.length) {
      const t = setTimeout(() => setI(i + 1), 420);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setGranted(true), 250);
    const t2 = setTimeout(() => onDone(), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [i, onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background scanline"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-full max-w-xl px-8">
        <div className="font-mono text-xs text-muted-foreground mb-6 flex items-center gap-2">
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
      </div>
    </motion.div>
  );
}

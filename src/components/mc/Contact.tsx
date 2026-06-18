import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader, Panel, StatusDot } from "./primitives";
import { useState, useEffect } from "react";
import { Mail, Send, Radio, Lock, RefreshCw, CheckCircle } from "lucide-react";

const CHANNELS = [
  { k: "email", v: "iamheetchokshi@gmail.com", href: "mailto:iamheetchokshi@gmail.com" },
  { k: "github", v: "github.com/iamheet", href: "https://github.com/iamheet" },
  { k: "linkedin", v: "linkedin.com/in/iamheetchokshi", href: "https://www.linkedin.com/in/iamheetchokshi/" },
  { k: "phone", v: "+91 90996 66950", href: "tel:+919099666950" },
  { k: "resume", v: "download · Heet_Chokshi_Resume.pdf", href: "/resume/Heet_Chokshi_Resume.pdf" },
];

export function Contact() {
  const [textVal, setTextVal] = useState("");
  const [transmitState, setTransmitState] = useState<"idle" | "encrypting" | "routing" | "transmitting" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);

  // Listen to sim speed
  useEffect(() => {
    const handleSpeed = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.speed === "number") {
        setSimSpeed(customEvent.detail.speed);
      }
    };
    window.addEventListener("sim-speed-change", handleSpeed);
    return () => window.removeEventListener("sim-speed-change", handleSpeed);
  }, []);

  const dispatchTerminalLog = (msg: string) => {
    window.dispatchEvent(new CustomEvent("terminal-output", { detail: { text: msg } }));
  };

  const handleTransmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textVal.trim() || transmitState !== "idle") return;

    setTransmitState("encrypting");
    setProgress(15);
    dispatchTerminalLog("[comm] Initializing encrypted communication tunnel...");
    
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms / simSpeed));

    await delay(800);
    setTransmitState("routing");
    setProgress(50);
    dispatchTerminalLog("[comm] Segmenting message payload into 256-bit GPG packets.");
    dispatchTerminalLog("[comm] Selecting telemetry route: Local client -> AWS ap-south-1 Edge.");
    
    await delay(1000);
    setTransmitState("transmitting");
    setProgress(85);
    dispatchTerminalLog("[comm] Transmitting telemetry payload burst over UDP websocket channels...");
    
    await delay(1200);
    setTransmitState("done");
    setProgress(100);
    dispatchTerminalLog("✓ [comm] Payload delivered. Operator mailbox updated successfully.");

    await delay(2500);
    setTransmitState("idle");
    setProgress(0);
    setTextVal("");
  };

  return (
    <section>
      <SectionHeader 
        id="contact" 
        kicker="// section 10" 
        title="Communication Channel" 
        desc="Establish encrypted connection channels. Transmit messages directly to Heet's core interface." 
      />
      
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Core links */}
        <div className="lg:col-span-4">
          <Panel title="Direct Channels">
            <ul className="divide-y divide-border/20 font-mono">
              {CHANNELS.map(c => (
                <li key={c.k}>
                  <a 
                    href={c.href} 
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    className="flex items-center justify-between py-3.5 group hover:px-1 transition-all"
                  >
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 w-16 sm:w-24 shrink-0 select-none">
                      {c.k}
                    </span>
                    <span className="flex-1 text-xs text-foreground/80 group-hover:r-text transition-colors truncate">
                      {c.v}
                    </span>
                    <span className="text-muted-foreground/45 group-hover:r-text group-hover:translate-x-0.5 transition-all text-sm select-none">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Message Payload Transmitter Form */}
        <div className="lg:col-span-5">
          <Panel title="Transmitter Console">
            <form onSubmit={handleTransmit} className="space-y-3.5 font-mono text-xs select-none">
              <div className="flex items-center justify-between text-[8px] text-muted-foreground/40 pb-1 border-b border-border/10">
                <span>COMM_STATION: AP_S1 // CIPHER: AES_256</span>
                <span>STATUS: {transmitState.toUpperCase()}</span>
              </div>

              <div>
                <textarea
                  value={textVal}
                  onChange={e => setTextVal(e.target.value)}
                  disabled={transmitState !== "idle"}
                  placeholder="Type encrypted message payload here (e.g. scheduling briefings, mission offers)..."
                  className="w-full h-24 rounded border border-border/40 bg-black/25 hover:r-border focus:r-border outline-none p-3 text-foreground font-mono placeholder:text-muted-foreground/30 resize-none disabled:opacity-40 transition-colors"
                />
              </div>

              {/* Progress bar loader */}
              {transmitState !== "idle" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] r-text opacity-70">
                    <span>
                      {transmitState === "encrypting" ? "ENCRYPTING PACKETS..." :
                       transmitState === "routing" ? "ESTABLISHING SATELLITE PATH..." :
                       transmitState === "transmitting" ? "DISPATCHING UDP BURST..." : "PAYLOAD DEIVERED!"}
                    </span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full r-bar led"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[8px] text-muted-foreground/40">ACTION: ENCRYPT_AND_TRANSMIT</span>
                
                <button
                  type="submit"
                  disabled={!textVal.trim() || transmitState !== "idle"}
                  className="flex items-center gap-2 rounded border r-border hover:r-border r-bg-md hover:r-bg-md px-4 py-2 font-mono text-[9px] uppercase tracking-widest r-text disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 cursor-pointer shadow-glow"
                >
                  <AnimatePresence mode="wait">
                    {transmitState === "idle" ? (
                      <motion.span key="idle" className="flex items-center gap-1.5">
                        <Lock size={11} className="led r-text" /> Transmit Payload
                      </motion.span>
                    ) : transmitState === "done" ? (
                      <motion.span key="done" className="flex items-center gap-1.5 text-success">
                        <CheckCircle size={11} className="led text-success" /> Transmitted!
                      </motion.span>
                    ) : (
                      <motion.span key="running" className="flex items-center gap-1.5">
                        <RefreshCw size={11} className="animate-spin led r-text" /> Routing...
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </form>
          </Panel>
        </div>

        {/* Biometric signal radar */}
        <div className="lg:col-span-3">
          <Panel title="Biometric Signal">
            <div className="flex flex-col items-center text-center py-5 select-none">
              <div className="relative h-20 w-20 flex items-center justify-center">
                {/* Concentric ripples */}
                {[0, 1, 2].map(i => (
                  <motion.span 
                    key={i} 
                    className="absolute inset-0 rounded-full border border-success/40"
                    animate={{ scale: [0.6, 1.7], opacity: [0.8, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }} 
                  />
                ))}
                
                <span className="absolute h-4 w-4 rounded-full bg-success led" />
                <Radio size={14} className="text-background relative z-10 animate-pulse" />
              </div>
              
              <div className="mt-4 font-mono text-[9px] text-success border border-success/30 bg-success/5 px-2.5 py-1 rounded flex items-center gap-2 tracking-widest font-semibold text-glow-success">
                <StatusDot /> UPLINK_ONLINE
              </div>
              <div className="mt-2 text-[8px] text-muted-foreground/50 font-mono uppercase tracking-wider">
                response latency · &lt; 24h
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Footer credits */}
      <footer className="mt-12 border-t border-border/20 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[9px] text-muted-foreground/45 select-none">
        <span>© {new Date().getFullYear()} HEET·OS — ALL TRADEMARKS OPERATED BY HEET CHOKSHI</span>
        <span className="flex items-center gap-3">
          <span>BUILD: STABLE_V2.4</span>
          <span className="h-3 w-px bg-border/20" />
          <span>REGION: AWS_AP_SOUTH_1</span>
        </span>
      </footer>
    </section>
  );
}

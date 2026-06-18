import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { X, ChevronRight, Terminal, Send } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

interface Msg {
  sender: "jarvis" | "user";
  text: string;
  partial?: boolean;
}

// ─── Timing logger ─────────────────────────────────────────────────────────
const T0 = performance.now();
function stamp(label: string) {
  const ms = (performance.now() - T0).toFixed(1);
  console.log(`[JARVIS TIMING] +${ms}ms — ${label}`);
}

// ─── Time-aware greeting ───────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Knowledge base ────────────────────────────────────────────────────────
const KNOWLEDGE: Record<string, string[]> = {
  welcome: [
    `${getGreeting()}. Welcome to Heet Chokshi's portfolio.`,
    "I am JARVIS, online and ready to assist you.",
    "I can walk you through his cloud engineering work, outline his full-stack projects, or open his contact panel.",
    "How may I assist you today?",
  ],
  infra: [
    "Routing network packet streams...",
    "The cloud environment runs on AWS EC2 with VPC configurations, Route53, and Nginx reverse proxies.",
    "Docker handles container runtime duties. Metrics are scraped via Prometheus and visualized in Grafana.",
    "Navigating to the Infrastructure Topology map now.",
  ],
  deploy: [
    "Initiating build pipeline simulation...",
    "Heet's CI/CD stack relies on GitHub Actions — automating testing, container image builds, and deployments.",
    "Live deployment sequence triggered. Watch the pipeline steps and build logs compile in real time.",
  ],
  monitoring: [
    "Accessing Prometheus telemetry database...",
    "The observability plane is powered by Prometheus probes scraping system statistics every 15 seconds.",
    "Grafana consolidates these into time-series dashboards monitoring container health and system loads.",
    "Navigating to the Observability Center now.",
  ],
  projects: [
    "Retrieving application dossiers...",
    "Mission OS — Interactive DevOps Mission Control. Live at iamheet.in.",
    "CryptoNexusAI — AI crypto analytics with OpenAI integration, Docker, and AWS EC2. Live at crypto-nexus.in.",
    "Royal Stay — Hotel booking platform on React, Node, MongoDB, hosted on Azure. Live at royalstay.me.",
    "LearnWithH — Financial blogging platform on React and Supabase.",
  ],
  hire: [
    "Compiling qualifications dossier.",
    "Heet Chokshi is a Software and DevOps Engineer with professional experience at Softedge Infotech.",
    "He specializes in containerization, CI/CD automation, cloud infrastructure, Linux administration, observability, and full-stack development.",
    "Available for new opportunities. Email: iamheetchokshi@gmail.com",
  ],
};

const SUGGESTIONS = [
  { id: "infra",      label: "Explain Infrastructure",       scroll: "infra"    },
  { id: "deploy",     label: "Trigger Deployment Pipeline",  scroll: "deploy",  triggerDeploy: true },
  { id: "monitoring", label: "Explain Observability Stack",  scroll: "observe"  },
  { id: "projects",   label: "Explore Projects",             scroll: "systems"  },
  { id: "hire",       label: "Why Hire Heet?",               scroll: "overview" },
];

// ─── Speech synthesis helper ───────────────────────────────────────────────
// Pre-warms the engine and returns a cancellable speak function.
// On browsers/devices where speechSynthesis is blocked (autoplay policy),
// the function silently no-ops — text streaming continues unaffected.

let voicesLoaded = false;

function preloadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  stamp("preloadVoices() called");
  const existing = window.speechSynthesis.getVoices();
  stamp(`preloadVoices() — getVoices() returned ${existing.length} voices immediately`);
  if (existing.length > 0) {
    voicesLoaded = true;
    stamp("preloadVoices() — voices already available, no wait needed");
    return;
  }
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    const v = window.speechSynthesis.getVoices();
    voicesLoaded = true;
    stamp(`voiceschanged event fired — ${v.length} voices now available`);
  }, { once: true });
}

function getBestVoice(): SpeechSynthesisVoice | null {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  stamp(`getBestVoice() — ${voices.length} voices available`);
  const preferred = [
    "Google UK English Male",
    "Google US English",
    "Microsoft Guy Online (Natural)",
    "Microsoft David Desktop",
    "Alex",
  ];
  for (const name of preferred) {
    const v = voices.find(v => v.name === name);
    if (v) {
      stamp(`getBestVoice() — selected preferred voice: "${v.name}"`);
      return v;
    }
  }
  const fallback = voices.find(v => v.lang.startsWith("en")) ?? voices[0] ?? null;
  stamp(`getBestVoice() — fallback voice: "${fallback?.name ?? "none"}"`);
  return fallback;
}

function speakText(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    stamp("speakText() — BLOCKED: speechSynthesis not available");
    return null;
  }
  try {
    stamp(`speakText() — calling cancel() then speak() for: "${text.slice(0, 40)}..."`);
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate   = 1.05;
    utter.pitch  = 0.95;
    utter.volume = 1;
    const voice = getBestVoice();
    if (voice) utter.voice = voice;
    utter.onstart = () => stamp(`speechSynthesis — onstart fired (actual audio began): "${text.slice(0, 40)}..."`);
    utter.onend   = () => {
      stamp(`speechSynthesis — onend fired: "${text.slice(0, 40)}..."`);
      onEnd?.();
    };
    utter.onerror = (e) => stamp(`speechSynthesis — onerror: ${e.error}`);
    stamp(`speakText() — speechSynthesis.speak() called`);
    window.speechSynthesis.speak(utter);
    stamp(`speakText() — speak() returned (queued, not yet speaking)`);
    return utter;
  } catch (e) {
    stamp(`speakText() — exception: ${e}`);
    return null;
  }
}

// ─── Typewriter helper ─────────────────────────────────────────────────────
// Streams characters of `text` into `onChar` at ~charDelay ms per char.
// Returns a cancel function.
function typewriter(
  text: string,
  onChar: (partial: string) => void,
  onDone: () => void,
  charDelay = 22,
): () => void {
  let i = 0;
  let cancelled = false;
  const step = () => {
    if (cancelled) return;
    i++;
    onChar(text.slice(0, i));
    if (i < text.length) {
      setTimeout(step, charDelay);
    } else {
      onDone();
    }
  };
  setTimeout(step, charDelay);
  return () => { cancelled = true; };
}

// ─── Component ────────────────────────────────────────────────────────────
export function MissionAI() {
  const [isOpen,     setIsOpen]     = useState(false);
  const [messages,   setMessages]   = useState<Msg[]>([]);
  const [isTyping,   setIsTyping]   = useState(false);
  const [streamText, setStreamText] = useState("");
  const [inputText,  setInputText]  = useState("");
  const [backendUp,  setBackendUp]  = useState(false);
  const chatEndRef   = useRef<HTMLDivElement>(null);
  const cancelRef    = useRef<(() => void)[]>([]);
  const hasGreeted   = useRef(false);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Check if backend is available on mount and when panel opens
  useEffect(() => {
    const check = () =>
      fetch(`${BACKEND_URL}/status`)
        .then(r => { if (r.ok) setBackendUp(true); else setBackendUp(false); })
        .catch(() => setBackendUp(false));
    check();
  }, [isOpen]);

  // Pre-warm speech engine as early as possible
  useEffect(() => {
    stamp("component mounted");
    preloadVoices();
  }, []);

  // Auto-open and greet after 1.5s — user sees JARVIS speaking on arrival
  useEffect(() => {
    stamp("auto-open timer registered (1500ms)");
    const t = setTimeout(() => {
      if (!hasGreeted.current) {
        stamp("auto-open timer fired — opening panel");
        setIsOpen(true);
        hasGreeted.current = true;
        // Small extra delay so panel open animation starts before speech
        setTimeout(() => {
          stamp("runLines(welcome) called after panel-open delay");
          runLines(KNOWLEDGE.welcome);
        }, 180);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText, isTyping]);

  // Cancel all in-flight typewriters + stop speech
  const cancelAll = useCallback(() => {
    cancelRef.current.forEach(fn => fn());
    cancelRef.current = [];
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStreamText("");
    setIsTyping(false);
  }, []);

  // Stream an array of lines: typewriter + voice simultaneously per line
  const runLines = useCallback((lines: string[]) => {
    stamp(`runLines() called — ${lines.length} lines queued`);
    cancelAll();
    setIsTyping(true);

    let lineIdx = 0;

    const nextLine = () => {
      if (lineIdx >= lines.length) {
        stamp("runLines() — all lines complete");
        setIsTyping(false);
        setStreamText("");
        return;
      }
      const line = lines[lineIdx++];
      stamp(`runLines() — starting line ${lineIdx}: "${line.slice(0, 40)}..."`);

      // Start voice immediately — runs in parallel with typewriter
      speakText(line);

      // Typewriter streams the text character by character
      stamp(`runLines() — typewriter started for line ${lineIdx}`);
      setStreamText("");
      const cancelTW = typewriter(
        line,
        (partial) => setStreamText(partial),
        () => {
          stamp(`runLines() — typewriter complete for line ${lineIdx}: text fully rendered`);
          // Line complete — commit to messages, clear stream buffer
          setMessages(prev => [...prev, { sender: "jarvis", text: line }]);
          setStreamText("");
          // Pause 280ms between lines then start next
          const t = setTimeout(nextLine, 280);
          cancelRef.current.push(() => clearTimeout(t));
        },
        22,
      );
      cancelRef.current.push(cancelTW);
    };

    nextLine();
  }, [cancelAll]);

  const handleSuggestion = (
    id: string,
    label: string,
    scrollId: string,
    triggerDeploy?: boolean,
  ) => {
    setMessages(prev => [...prev, { sender: "user", text: label }]);

    const el = document.getElementById(scrollId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.dispatchEvent(new CustomEvent("highlight-section", { detail: { id: scrollId } }));
    }
    if (triggerDeploy) {
      window.dispatchEvent(new CustomEvent("trigger-deployment"));
    }

    runLines(KNOWLEDGE[id] ?? ["Query acknowledged. Accessing systems."]);
  };

  const handleClose = () => {
    cancelAll();
    setIsOpen(false);
  };

  // Send free-text to backend, stream the response token by token
  const askBackend = useCallback(async (question: string) => {
    if (!question.trim()) return;
    setMessages(prev => [...prev, { sender: "user", text: question }]);
    setInputText("");
    cancelAll();
    setIsTyping(true);
    setStreamText("");

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      if (!res.ok || !res.body) throw new Error("bad response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setStreamText(full);
      }

      setMessages(prev => [...prev, { sender: "jarvis", text: full }]);
      setStreamText("");
      speakText(full);
    } catch {
      const err = "Backend offline. Run: python main.py in the backend folder.";
      setMessages(prev => [...prev, { sender: "jarvis", text: err }]);
      setStreamText("");
    } finally {
      setIsTyping(false);
    }
  }, [cancelAll]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    askBackend(inputText);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90] font-mono text-xs select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: 20  }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="glass w-[calc(100vw-3rem)] sm:w-80 md:w-96 rounded-lg overflow-hidden border r-border shadow-glow mb-4 flex flex-col h-[420px] relative"
          >
            <div className="absolute inset-0 hudo-grid pointer-events-none opacity-[0.04]" />

            {/* Header */}
            <div className="flex items-center justify-between bg-black/40 border-b border-border/40 px-4 py-2.5 z-10 relative shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full r-led animate-pulse" />
                <span className="text-[11px] font-bold r-text-glow uppercase tracking-widest r-text">
                  JARVIS // AI ASSISTANT
                </span>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5">
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`rounded-md px-3 py-2 max-w-[85%] border leading-relaxed text-[11px] ${
                    m.sender === "user"
                      ? "r-bg-md r-border text-foreground"
                      : "bg-black/30 border-border/40 text-foreground/90"
                  }`}>
                    {m.sender === "jarvis" && (
                      <div className="text-[8px] r-text opacity-60 uppercase tracking-widest mb-0.5">JARVIS</div>
                    )}
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {/* Live streaming line — appears while typewriter runs */}
              {streamText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="rounded-md px-3 py-2 max-w-[85%] border bg-black/30 border-border/40 text-foreground/90 leading-relaxed text-[11px]">
                    <div className="text-[8px] r-text opacity-60 uppercase tracking-widest mb-0.5">JARVIS</div>
                    {streamText}
                    <span className="inline-block w-[2px] h-[12px] ml-[1px] align-middle r-bg animate-pulse" />
                  </div>
                </motion.div>
              )}

              {/* Wave indicator — only when typing but no stream text yet */}
              {isTyping && !streamText && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-black/30 border border-border/40 rounded-md px-3 py-2 flex items-center gap-2">
                    <span className="text-[8px] r-text opacity-60 uppercase tracking-widest">JARVIS</span>
                    <div className="flex items-end gap-[3px] h-3">
                      {[0,1,2,3,4].map(b => (
                        <span key={b} className="w-[2px] rounded-full"
                          style={{
                            animation: "jarvisWave 1s ease-in-out infinite",
                            animationDelay: `${b * 0.12}s`,
                            height: "6px",
                            background: "var(--rp)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Suggestions + input */}
            <div className="bg-black/40 border-t border-border/40 p-2.5 z-10 relative shrink-0">
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-1.5 px-1">
                SELECT MISSION SECTOR
              </div>
              <div className="flex flex-col gap-1 max-h-[90px] overflow-y-auto mb-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSuggestion(s.id, s.label, s.scroll, s.triggerDeploy)}
                    disabled={isTyping}
                    className="flex items-center justify-between text-left rounded border border-border/40 px-2.5 py-1.5 bg-card/25 hover:r-border hover:r-bg text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none group"
                  >
                    <span className="truncate text-[10px]">{s.label}</span>
                    <ChevronRight size={11} className="shrink-0 text-muted-foreground/40 group-hover:r-text transition-colors" />
                  </button>
                ))}
              </div>

              {/* Free-text input box */}
              <form onSubmit={handleInputSubmit} className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    disabled={isTyping}
                    placeholder={backendUp ? "Ask JARVIS anything..." : "Backend offline — run python main.py"}
                    className="w-full bg-black/40 border border-border/40 rounded px-2.5 py-1.5 text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-[color:var(--rp)] transition-colors disabled:opacity-40"
                  />
                  <span
                    className={`absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${backendUp ? "bg-success" : "bg-destructive"}`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTyping || !inputText.trim()}
                  className="p-1.5 rounded border border-border/40 hover:r-border hover:r-bg text-muted-foreground hover:r-text transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Send size={11} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <div className="flex items-center justify-end gap-3">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-md border r-border px-3 py-2 text-foreground/80 max-w-[200px] shadow-glow bg-black/40 hidden md:block"
          >
            <div className="text-[9px] r-text opacity-70 uppercase tracking-widest font-bold mb-0.5">// JARVIS ONLINE</div>
            <div className="text-[10px] text-muted-foreground/60">Click to open console</div>
          </motion.div>
        )}

        <button
          onClick={() => {
            setIsOpen(o => !o);
            if (!isOpen && !hasGreeted.current) {
              hasGreeted.current = true;
              setTimeout(() => runLines(KNOWLEDGE.welcome), 180);
            }
          }}
          className="relative h-12 w-12 rounded-full flex items-center justify-center bg-black/85 border r-border hover:r-glow focus:outline-none group transition-all duration-300"
          style={{ boxShadow: "0 0 16px color-mix(in oklch, var(--rp) 14%, transparent)" }}
        >
          <span className="absolute h-5 w-5 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-300 led"
            style={{ background: "linear-gradient(135deg, var(--rp), var(--rs))" }}
          />
          <span className="relative z-10">
            <Terminal size={14} className="r-text r-text-glow" />
          </span>
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success border border-background" />
        </button>
      </div>

      <style>{`
        @keyframes jarvisWave {
          0%, 100% { height: 3px; opacity: 0.4; }
          50%       { height: 12px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

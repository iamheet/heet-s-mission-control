import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { Panel, PanelHeader, Waveform, LiveDot } from "./primitives";
import { ACCENT } from "./theme";
import * as jarvisTTS from "@/components/mc/jarvisTTS";

// ── Types ──────────────────────────────────────────────────────────────────
type VoiceState = "idle" | "listening" | "speaking" | "processing";
type Msg = { id: string; role: "user" | "jarvis"; text: string };

const uid = () => Math.random().toString(36).slice(2, 8);

// ── Minimal KB for the missionos Jarvis panel ─────────────────────────────
const KB: Record<string, { keywords: string[]; response: string }> = {
  identity:    { keywords: ["who", "heet", "about", "introduce", "yourself"], response: "I am Jarvis, Heet Chokshi's AI assistant. He is a Software & DevOps Engineer specializing in AWS, Docker, Kubernetes, and full-stack development. Currently open to new opportunities." },
  skills:      { keywords: ["skills", "tech", "stack", "tools", "languages"], response: "Heet's stack: TypeScript, React, Next.js, Node.js on the frontend and backend. Infrastructure: AWS, Docker, Kubernetes, Nginx, GitHub Actions, Prometheus, Grafana." },
  devops:      { keywords: ["devops", "cicd", "pipeline", "docker", "kubernetes", "aws"], response: "Heet automates CI/CD pipelines with GitHub Actions — every commit triggers build, test, containerize, and zero-downtime deploy to AWS EC2 behind Nginx." },
  projects:    { keywords: ["project", "built", "portfolio", "cryptonexus", "royalstay"], response: "Heet built: Mission OS (this portfolio), CryptoNexusAI (AI crypto analytics on AWS), Royal Stay (hotel booking on Azure), and LearnWithH (Supabase blog)." },
  contact:     { keywords: ["contact", "email", "hire", "linkedin", "github", "reach"], response: "Reach Heet at iamheetchokshi@gmail.com, LinkedIn: linkedin.com/in/iamheetchokshi, GitHub: github.com/iamheet. He is actively open to roles." },
  experience:  { keywords: ["experience", "work", "job", "softedge", "company"], response: "Heet worked at Softedge Infotech as a Software & DevOps Engineer — cloud architecture on AWS, CI/CD automation, Docker containerization, and Prometheus/Grafana monitoring." },
  education:   { keywords: ["education", "degree", "mca", "bca", "college"], response: "Heet holds a Master of Computer Applications (MCA) with focus on algorithms, systems design, and network security." },
  greeting:    { keywords: ["hello", "hi", "hey", "good morning", "good evening"], response: "Hello! Jarvis online. Ask me about Heet's skills, projects, DevOps experience, or how to contact him." },
};

function localEngine(query: string): string {
  const lower = query.toLowerCase();
  for (const entry of Object.values(KB)) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.response;
  }
  return `I don't have a specific answer for "${query}", but Heet is skilled in AWS, Docker, React, and CI/CD. Ask me about his projects, skills, or contact info.`;
}

// ── Component ──────────────────────────────────────────────────────────────
export function AIAssistantCard() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: uid(), role: "jarvis", text: "Jarvis online. Ask me anything about Heet's skills, projects, or experience." },
  ]);
  const [input, setInput] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const pendingRef = useRef<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Init TTS + voice on mount ────────────────────────────────────────────
  useEffect(() => {
    jarvisTTS.setMountTime();
    jarvisTTS.initVoice(() => {});

    const unlock = () => {
      setHasInteracted(true);
      if (pendingRef.current) {
        speakText(pendingRef.current);
        pendingRef.current = null;
      }
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // ── Speech recognition setup ─────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setLiveTranscript(interim || final);
      if (final) { setLiveTranscript(""); handleQuery(final.trim()); }
    };
    rec.onerror = () => { setVoiceState("idle"); isListeningRef.current = false; };
    rec.onend   = () => { isListeningRef.current = false; setVoiceState(vs => vs === "listening" ? "idle" : vs); };
    recognitionRef.current = rec;
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Speak helper ─────────────────────────────────────────────────────────
  const speakText = useCallback((text: string) => {
    if (isMuted) return;
    setVoiceState("speaking");
    jarvisTTS.speak(
      text,
      () => setVoiceState("speaking"),
      () => setVoiceState("idle"),
      () => setVoiceState("idle"),
    );
  }, [isMuted]);

  // ── Handle query ─────────────────────────────────────────────────────────
  const handleQuery = useCallback((query: string) => {
    if (!query.trim()) return;
    jarvisTTS.stop();
    setVoiceState("processing");
    setMessages(prev => [...prev, { id: uid(), role: "user", text: query }]);

    setTimeout(() => {
      const response = localEngine(query);
      setMessages(prev => [...prev, { id: uid(), role: "jarvis", text: response }]);
      setVoiceState("idle");
      if (hasInteracted) speakText(response);
      else pendingRef.current = response;
    }, 400);
  }, [hasInteracted, speakText]);

  // ── Mic toggle ───────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (isListeningRef.current) {
      recognitionRef.current?.stop();
      isListeningRef.current = false;
      setVoiceState("idle");
    } else {
      jarvisTTS.stop();
      try { recognitionRef.current?.start(); } catch {}
      isListeningRef.current = true;
      setVoiceState("listening");
      setLiveTranscript("");
    }
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    handleQuery(input);
    setInput("");
  };

  const stateColor = {
    idle:       ACCENT.cyan,
    listening:  ACCENT.red,
    speaking:   ACCENT.green,
    processing: ACCENT.amber,
  }[voiceState];

  const stateLabel = {
    idle:       "READY",
    listening:  "LISTENING",
    speaking:   "SPEAKING",
    processing: "THINKING",
  }[voiceState];

  return (
    <Panel className="flex h-full flex-col" padded>
      <PanelHeader
        lead="JARVIS"
        rest="AI ASSISTANT"
        caption="ElevenLabs Voice · Live"
        action={
          <div className="flex items-center gap-2">
            <LiveDot accent={voiceState === "speaking" ? "green" : voiceState === "listening" ? "red" : "cyan"} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: stateColor }}>
              {stateLabel}
            </span>
            <button
              onClick={() => { setIsMuted(m => { if (!m) jarvisTTS.stop(); return !m; }); }}
              className="ml-1 rounded border border-white/10 p-1 text-slate-500 hover:text-cyan-300 transition-colors"
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          </div>
        }
      />

      {/* Waveform — active when speaking or listening */}
      <div className="mb-3">
        <Waveform
          bars={28}
          height={22}
          accent={voiceState === "speaking" ? "green" : voiceState === "listening" ? "red" : "cyan"}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0" style={{ maxHeight: 180 }}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed"
              style={
                msg.role === "user"
                  ? { background: `${ACCENT.cyan}18`, border: `1px solid ${ACCENT.cyan}40`, color: "#e2e8f0" }
                  : { background: "rgba(14,22,35,0.9)", border: "1px solid rgba(0,229,255,0.15)", color: "#cbd5e1" }
              }
            >
              {msg.role === "jarvis" && (
                <div className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT.cyan }}>
                  JARVIS
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {voiceState === "processing" && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3 py-2 flex items-center gap-1.5" style={{ background: "rgba(14,22,35,0.9)", border: "1px solid rgba(0,229,255,0.15)" }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: ACCENT.cyan, animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {liveTranscript && (
          <div className="flex justify-end">
            <div className="rounded-xl px-3 py-1.5 text-[10px] italic" style={{ background: `${ACCENT.red}15`, border: `1px solid ${ACCENT.red}30`, color: "#fca5a5" }}>
              "{liveTranscript}"
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input row */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={toggleMic}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200"
          style={{
            borderColor: voiceState === "listening" ? ACCENT.red : `${ACCENT.cyan}50`,
            background: voiceState === "listening" ? `${ACCENT.red}20` : `${ACCENT.cyan}10`,
            boxShadow: voiceState === "listening" ? `0 0 14px ${ACCENT.red}50` : `0 0 8px ${ACCENT.cyan}20`,
          }}
        >
          {voiceState === "listening"
            ? <MicOff size={14} style={{ color: ACCENT.red }} />
            : <Mic size={14} style={{ color: ACCENT.cyan }} />
          }
          {voiceState === "listening" && (
            <span className="absolute inset-0 rounded-full animate-ping border" style={{ borderColor: `${ACCENT.red}60` }} />
          )}
        </button>

        <input
          value={input}
          onChange={e => setInput(e.target.value.slice(0, 150))}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask Jarvis..."
          disabled={voiceState === "listening" || voiceState === "processing"}
          className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none transition-colors disabled:opacity-40"
          style={{ borderColor: "rgba(0,229,255,0.2)", background: "rgba(0,229,255,0.04)" }}
          onFocus={e => (e.target.style.borderColor = `${ACCENT.cyan}60`)}
          onBlur={e => (e.target.style.borderColor = "rgba(0,229,255,0.2)")}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || voiceState === "listening" || voiceState === "processing"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 disabled:opacity-30"
          style={{ borderColor: `${ACCENT.cyan}50`, background: `${ACCENT.cyan}15`, color: ACCENT.cyan }}
        >
          <Send size={13} />
        </button>
      </div>
    </Panel>
  );
}

/**
 * Scoped keyframes + the circuit-grid overlay for JARVIS Mission OS.
 * Rendered once at the page root as a <style> tag so the dashboard is fully
 * self-contained (nothing leaks into the app's global stylesheet).
 */
export function MissionOSStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* fonts — scoped to the dashboard so global app typography is untouched */
.mo-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
.mo-root .font-display { font-family: 'Orbitron', 'Rajdhani', ui-sans-serif, sans-serif; }
.mo-root .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

/* ── Background stack ─────────────────────────────────────────────────── */
/* base gradient: dark blue-black with a faint lift toward the top */
.mo-bg-gradient {
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(11,20,46,0.9) 0%, rgba(5,8,22,0) 60%),
    linear-gradient(180deg, #060a1c 0%, #050816 55%, #04060f 100%);
}
/* soft radial light blobs (cyan + purple), blurred, GPU-cheap */
.mo-bg-lights::before,
.mo-bg-lights::after {
  content: "";
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  opacity: 0.4;
  will-change: transform, opacity;
}
.mo-bg-lights::before {
  width: 46vw; height: 46vw; left: -10vw; top: -12vw;
  background: radial-gradient(circle, rgba(0,229,255,0.18), transparent 70%);
  animation: mo-float 16s ease-in-out infinite;
}
.mo-bg-lights::after {
  width: 42vw; height: 42vw; right: -12vw; bottom: -14vw;
  background: radial-gradient(circle, rgba(139,92,246,0.16), transparent 70%);
  animation: mo-float 20s ease-in-out infinite reverse;
}
@keyframes mo-float {
  0%, 100% { transform: translate3d(0,0,0); }
  50%      { transform: translate3d(2vw, 2vh, 0); }
}

/* faint circuit / grid overlay */
.mo-grid {
  background-image:
    linear-gradient(rgba(0,229,255,0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,255,0.055) 1px, transparent 1px),
    radial-gradient(rgba(139,92,246,0.05) 1px, transparent 1px);
  background-size: 52px 52px, 52px 52px, 52px 52px;
  background-position: 0 0, 0 0, 26px 26px;
  -webkit-mask-image: radial-gradient(120% 90% at 50% 0%, #000 55%, transparent 100%);
          mask-image: radial-gradient(120% 90% at 50% 0%, #000 55%, transparent 100%);
}

/* twinkling starfield — layered tiny dots, opacity-only animation */
.mo-stars {
  background-image:
    radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 28% 68%, rgba(0,229,255,0.6), transparent),
    radial-gradient(1px 1px at 47% 14%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 63% 82%, rgba(139,92,246,0.6), transparent),
    radial-gradient(1px 1px at 78% 36%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 88% 60%, rgba(0,229,255,0.5), transparent),
    radial-gradient(1px 1px at 35% 90%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 55% 48%, rgba(255,255,255,0.4), transparent);
  animation: mo-twinkle 5.5s ease-in-out infinite;
}
@keyframes mo-twinkle { 0%,100% { opacity: 0.35; } 50% { opacity: 0.9; } }

/* rotating rings */
@keyframes mo-spin { to { transform: rotate(360deg); } }
.mo-spin-slow { animation: mo-spin 18s linear infinite; }
.mo-spin-rev  { animation: mo-spin 12s linear infinite reverse; }

/* audio waveform bars */
@keyframes mo-wave {
  0%, 100% { transform: scaleY(0.28); opacity: 0.55; }
  50%      { transform: scaleY(1);    opacity: 1; }
}
.mo-wavebar {
  height: 100%;
  transform-origin: bottom;
  animation-name: mo-wave;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

/* breathing glow */
@keyframes mo-breathe {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.06); }
}
.mo-breathe { animation: mo-breathe 2.6s ease-in-out infinite; }

/* dashed line flow (network arcs / pipeline connectors) */
@keyframes mo-dash { to { stroke-dashoffset: -18; background-position: 24px 0; } }
.mo-dash { animation: mo-dash 1s linear infinite; }

/* pulsing map hotspot */
@keyframes mo-ping { 0% { transform: scale(0.6); opacity: 0.7; } 100% { transform: scale(2.4); opacity: 0; } }
.mo-ping-dot { transform-origin: center; transform-box: fill-box; animation: mo-ping 2.2s ease-out infinite; }

/* body-scan vertical sweep */
@keyframes mo-scan { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { transform: translateY(158px); opacity: 0; } }
.mo-scan { animation: mo-scan 3.4s ease-in-out infinite; }

/* terminal cursor blink */
@keyframes mo-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
.mo-blink { animation: mo-blink 1s steps(1) infinite; }

/* radar conic sweep (globe + status widgets) */
@keyframes mo-sweep { to { transform: rotate(360deg); } }
.mo-sweep { animation: mo-sweep 4s linear infinite; transform-origin: center; }

/* new-row slide-in (live logs / notifications) */
@keyframes mo-slidein {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mo-slidein { animation: mo-slidein 0.4s ease-out; }

/* orbiting satellite dot along a ring */
@keyframes mo-orbit { to { transform: rotate(360deg); } }
.mo-orbit { animation: mo-orbit 9s linear infinite; transform-origin: center; }

.mo-root ::-webkit-scrollbar { width: 6px; height: 6px; }
.mo-root ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.22); border-radius: 999px; }
.mo-root ::-webkit-scrollbar-thumb:hover { background: rgba(0,229,255,0.38); }
.mo-root ::-webkit-scrollbar-track { background: transparent; }

@media (prefers-reduced-motion: reduce) {
  .mo-root *, .mo-root *::before, .mo-root *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
}
`,
      }}
    />
  );
}

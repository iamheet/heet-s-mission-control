import { useMemo } from "react";
import { Triangle } from "lucide-react";
import { Panel, Waveform } from "./primitives";
import { ACCENT, neon } from "./theme";

/** Deterministic scattered particle field (no Math.random — index-seeded). */
function useParticles(n: number) {
  return useMemo(() => {
    const pts: Array<{ x: number; y: number; r: number; o: number }> = [];
    for (let i = 0; i < n; i++) {
      // golden-angle spiral keeps them evenly distributed inside the disc
      const a = i * 2.399963;
      const rad = 0.5 * Math.sqrt(i / n);
      pts.push({
        x: 50 + Math.cos(a) * rad * 90,
        y: 50 + Math.sin(a) * rad * 90,
        r: 0.4 + (i % 3) * 0.25,
        o: 0.15 + ((i * 7) % 10) / 40,
      });
    }
    return pts;
  }, [n]);
}

export function JarvisCore() {
  const particles = useParticles(90);

  return (
    <Panel className="flex h-full flex-col items-center justify-center overflow-hidden">
      <div className="relative my-2 grid h-[250px] w-[250px] place-items-center">
        {/* particle globe */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="mo-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={ACCENT.cyan} stopOpacity="0.28" />
              <stop offset="55%" stopColor={ACCENT.purple} stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id="mo-orbit-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={ACCENT.cyan} />
              <stop offset="100%" stopColor={ACCENT.purple} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#mo-core-glow)" />
          {particles.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#7DD3FC" opacity={p.o} />
          ))}
          {/* longitude / latitude hint lines */}
          <g fill="none" stroke="url(#mo-orbit-stroke)" strokeOpacity="0.2" strokeWidth="0.4">
            <ellipse cx="50" cy="50" rx="46" ry="18" />
            <ellipse cx="50" cy="50" rx="30" ry="46" />
            <line x1="4" y1="50" x2="96" y2="50" />
          </g>
          {/* radar conic sweep */}
          <g className="mo-sweep" style={{ transformOrigin: "50px 50px" }}>
            <path d="M50 50 L50 4 A46 46 0 0 1 82 18 Z" fill={ACCENT.cyan} opacity="0.06" />
          </g>
        </svg>

        {/* concentric rings */}
        <span
          className="mo-spin-slow absolute inset-0 rounded-full"
          style={{ border: `1.5px solid ${ACCENT.cyan}44`, borderTopColor: ACCENT.cyan }}
        />
        <span
          className="mo-spin-rev absolute inset-[22px] rounded-full"
          style={{ border: `1.5px dashed ${ACCENT.purple}66`, borderRightColor: ACCENT.purple }}
        />
        <span
          className="mo-spin-slow absolute inset-[44px] rounded-full"
          style={{ border: `1.5px solid ${ACCENT.cyan}3a`, borderBottomColor: ACCENT.cyan }}
        />
        <span
          className="mo-spin-rev absolute inset-[66px] rounded-full"
          style={{ border: `1px solid ${ACCENT.purple}55` }}
        />

        {/* orbiting satellite dot */}
        <span className="mo-orbit absolute inset-0">
          <span
            className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full"
            style={{ background: ACCENT.cyan, boxShadow: `0 0 10px ${ACCENT.cyan}` }}
          />
        </span>

        {/* arc reactor core */}
        <div className="relative grid h-20 w-20 place-items-center">
          <span
            className="mo-breathe absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${ACCENT.cyan}55, transparent 70%)`,
            }}
          />
          <Triangle
            size={34}
            className="relative"
            style={{ color: ACCENT.cyan, filter: `drop-shadow(0 0 10px ${ACCENT.cyan})` }}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* labels */}
      <h3
        className="font-display text-xl font-bold uppercase tracking-[0.2em] text-white"
        style={neon(ACCENT.cyan, 8)}
      >
        JARVIS AI CORE
      </h3>
      <div className="mt-1 flex items-center gap-2">
        <span
          className="h-2 w-2 animate-pulse rounded-full"
          style={{ background: ACCENT.green, boxShadow: `0 0 8px ${ACCENT.green}` }}
        />
        <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: ACCENT.green }}>
          Active
        </span>
      </div>

      {/* waveform + listening */}
      <div className="mt-5 flex w-full items-center justify-center gap-3 px-6">
        <Waveform bars={22} height={22} className="w-40" />
        <span className="animate-pulse text-xs font-medium tracking-wide" style={{ color: ACCENT.cyan }}>
          Listening...
        </span>
      </div>
    </Panel>
  );
}

import { Panel, PanelHeader } from "./primitives";
import { ACCENT, neon } from "./theme";
import { useAnimatedNumber, useMounted } from "./hooks";
import { useLiveData } from "./useLiveData";

/** Faint cyan wireframe body-scan silhouette with a moving scan line. */
function BodyScan() {
  return (
    <div className="pointer-events-none absolute bottom-0 right-1 top-6 w-24 opacity-60">
      <svg viewBox="0 0 80 160" className="h-full w-full">
        <g fill="none" stroke={ACCENT.cyan} strokeWidth="1" strokeOpacity="0.5">
          <circle cx="40" cy="20" r="11" />
          <path d="M40 31 L40 92" />
          <path d="M40 40 L15 70 M40 40 L65 70" />
          <path d="M40 92 L24 150 M40 92 L56 150" />
          <path d="M22 60 H58" strokeOpacity="0.3" />
        </g>
        {/* node dots */}
        {[
          [40, 20], [40, 45], [15, 70], [65, 70], [40, 92], [24, 150], [56, 150],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill={ACCENT.cyan} opacity="0.8" />
        ))}
        {/* horizontal scan line */}
        <rect x="6" y="0" width="68" height="2" fill={ACCENT.cyan} opacity="0.7" className="mo-scan" />
      </svg>
    </div>
  );
}

function HealthRow({ label, value, accent }: { label: string; value: number; accent: keyof typeof ACCENT }) {
  const mounted = useMounted();
  const target = mounted ? value : 0;
  const shown = useAnimatedNumber(target, 900);
  const c = ACCENT[accent];
  return (
    <div className="relative">
      <div className="flex items-center gap-2.5">
        <span className="h-3 w-3 rounded-[3px]" style={{ background: c, boxShadow: `0 0 6px ${c}88` }} />
        <span className="flex-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">{label}</span>
        <span className="text-sm font-bold tabular-nums text-white" style={neon(c, 6)}>
          {shown}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
          style={{
            width: `${target}%`,
            background: `linear-gradient(90deg, ${c}88, ${c})`,
            boxShadow: `0 0 10px ${c}aa`,
          }}
        />
      </div>
    </div>
  );
}

export function SystemHealthCard() {
  const { health } = useLiveData();
  return (
    <Panel className="relative h-full overflow-hidden">
      <PanelHeader lead="SYSTEM" rest="HEALTH" caption="Real-time Performance Overview" />
      <BodyScan />
      <div className="relative z-10 space-y-4 pr-16">
        {health.map((s) => (
          <HealthRow key={s.label} label={s.label} value={s.value} accent={s.accent} />
        ))}
      </div>
    </Panel>
  );
}

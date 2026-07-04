import { Panel } from "./primitives";
import { ACCENT, type AccentKey, neon } from "./theme";
import { useAnimatedNumber, useMounted } from "./hooks";

const SIZE = 120;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function GaugeWidget({
  label,
  value,
  accent,
  caption,
}: {
  label: string;
  value: number;
  accent: AccentKey;
  caption: string;
}) {
  const mounted = useMounted();
  const shown = useAnimatedNumber(mounted ? value : 0, 900);
  const color = ACCENT[accent];
  const offset = C * (1 - (mounted ? value : 0) / 100);
  const gid = `mo-gauge-${label.toLowerCase().replace(/[^a-z]/g, "")}`;

  return (
    <Panel className="flex flex-col items-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6B7C99]">{label}</div>

      <div className="relative my-3 grid place-items-center" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)",
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-2xl font-bold tabular-nums text-white" style={neon(color, 8)}>
            {shown}%
          </span>
        </div>
      </div>

      <div className="text-center text-[10px] font-medium tracking-wide text-[#6B7C99]">{caption}</div>
    </Panel>
  );
}

import { ChevronRight, Signal } from "lucide-react";
import { Panel, PanelHeader } from "./primitives";
import { HOTSPOTS, NETWORK_ARCS, type Hotspot } from "./mockData";
import { ACCENT } from "./theme";

const W = 340;
const H = 170;

/** Rough scatter of dots suggesting continents (normalised 0–1 clusters). */
const CONTINENTS: Array<[number, number, number]> = [
  // [cx, cy, radius] in normalised space
  [0.24, 0.42, 0.1], // N. America
  [0.3, 0.68, 0.06], // S. America
  [0.48, 0.34, 0.06], // Europe
  [0.52, 0.62, 0.09], // Africa
  [0.66, 0.5, 0.11], // Asia
  [0.8, 0.78, 0.05], // Oceania
];

function buildDotMap(): Array<{ x: number; y: number }> {
  const dots: Array<{ x: number; y: number }> = [];
  const cols = 46;
  const rows = 22;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nx = c / (cols - 1);
      const ny = r / (rows - 1);
      const inside = CONTINENTS.some(([cx, cy, rad]) => {
        const dx = (nx - cx) * 1.0;
        const dy = (ny - cy) * 1.6; // squash vertically
        return Math.sqrt(dx * dx + dy * dy) < rad;
      });
      if (inside) dots.push({ x: nx * W, y: ny * H });
    }
  }
  return dots;
}

const DOTS = buildDotMap();

function arcPath(a: Hotspot, b: Hotspot): string {
  const x1 = a.x * W;
  const y1 = a.y * H;
  const x2 = b.x * W;
  const y2 = b.y * H;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.35; // lift the arc
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

export function GlobalNetworkCard() {
  return (
    <Panel className="h-full">
      <PanelHeader lead="GLOBAL" rest="NETWORK" caption="Live Infrastructure" />

      {/* World map */}
      <div className="relative overflow-hidden rounded-lg border border-cyan-400/10 bg-[#04060B]/60">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
          {/* dot silhouette */}
          {DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={0.9} fill="#22D3EE" opacity={0.18} />
          ))}

          {/* connection arcs */}
          {NETWORK_ARCS.map(([aId, bId], i) => {
            const a = HOTSPOTS.find((h) => h.id === aId)!;
            const b = HOTSPOTS.find((h) => h.id === bId)!;
            return (
              <path
                key={i}
                d={arcPath(a, b)}
                fill="none"
                stroke={ACCENT.cyan}
                strokeWidth={1}
                strokeOpacity={0.5}
                strokeDasharray="4 5"
                className="mo-dash"
                style={{ animationDelay: `${i * 300}ms` }}
              />
            );
          })}

          {/* hotspots */}
          {HOTSPOTS.map((h) => {
            const c = ACCENT[h.accent];
            return (
              <g key={h.id}>
                <circle cx={h.x * W} cy={h.y * H} r={6} fill={c} opacity={0.18} className="mo-ping-dot" />
                <circle cx={h.x * W} cy={h.y * H} r={2.4} fill={c} style={{ filter: `drop-shadow(0 0 4px ${c})` }} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hotspot list */}
      <div className="mt-3 space-y-2">
        {HOTSPOTS.map((h) => {
          const c = ACCENT[h.accent];
          return (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 transition-colors hover:border-cyan-400/25"
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
                style={{ background: `${c}1f`, border: `1px solid ${c}55` }}
              >
                <Signal size={13} style={{ color: c }} />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-xs font-semibold text-slate-200">{h.name}</div>
                <div className="text-[10px] font-medium" style={{ color: c }}>
                  {h.traffic}
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-600" />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

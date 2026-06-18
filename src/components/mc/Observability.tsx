import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader, Panel } from "./primitives";
import { useEffect, useState, useRef, useId } from "react";
import { Maximize2, Minimize2, Grid } from "lucide-react";
import { useSimulation } from "./regionTheme";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * useSeries — generates a live time-series for an observability chart.
 * @param base   Starting base value (derived from region metric profile)
 * @param speed  Simulation speed multiplier
 * @param n      Number of data points
 * @param amp    Maximum deviation amplitude per tick
 */
function makeSeries(n: number, base: number, amp: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const v = base + Math.sin(i / 3.4) * amp * 0.7;
    return Math.max(2, Math.min(98, v));
  });
}

function useSeries(base = 50, speed = 1, n = 60, amp = 12) {
  const isMobile = useIsMobile();
  const [data, setData] = useState<number[]>(() => makeSeries(n, base, amp));

  useEffect(() => {
    setData(makeSeries(n, base, amp));
  }, [base, n, amp]);

  useEffect(() => {
    // Mobile: slow all chart intervals to 5s regardless of simSpeed.
    // This cuts 6 concurrent setState calls from ~480ms (speed=5) down to one every 5s.
    const interval = isMobile ? 5000 : 2400 / Math.max(0.1, speed);
    const i = setInterval(() => {
      setData(prev => {
        const next = prev.slice(1);
        const last = prev[prev.length - 1];
        const drift = (base - last) * 0.08;
        const v = Math.max(2, Math.min(98, last + drift + (Math.random() - 0.5) * amp));
        return [...next, v];
      });
    }, interval);
    return () => clearInterval(i);
  }, [base, speed, amp, isMobile]);

  return data;
}

interface ChartProps {
  data: number[];
  color: string;
  unit: string;
  alarmLimit?: number;
}

function Chart({ data, color, unit, alarmLimit = 80 }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; val: number } | null>(null);

  const gid = `g-${useId().replace(/:/g, "")}`;

  const w = 300;
  const h = 100;
  const step = w / (data.length - 1);
  const max = 100, min = 0;
  const norm = (v: number) => h - ((v - min) / (max - min)) * h;

  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${norm(v).toFixed(1)}`).join(" ");

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const clientX = e.clientX - r.left;
    const clientY = e.clientY - r.top;
    
    // Map client X back to data index
    const relativeX = clientX / r.width;
    const dataIdx = Math.max(0, Math.min(data.length - 1, Math.round(relativeX * (data.length - 1))));
    
    // Snap coordinates
    const snapX = dataIdx * step;
    const snapY = norm(data[dataIdx]);
    
    setMousePos({
      x: snapX,
      y: snapY,
      val: data[dataIdx]
    });
  };

  return (
    <div className="relative select-none">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`} 
        className="w-full relative overflow-visible cursor-crosshair" 
        preserveAspectRatio="none" 
        style={{ height: h }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1={0} x2={w} y1={h * p} y2={h * p} stroke="var(--grid-line)" strokeWidth="0.4" strokeDasharray="4 4" />
        ))}

        {/* Alarm limit threshold */}
        {alarmLimit && (
          <g>
            <line x1={0} x2={w} y1={norm(alarmLimit)} y2={norm(alarmLimit)} stroke="var(--destructive)" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.6" />
            <text x="4" y={norm(alarmLimit) - 2} fontSize="5" className="fill-destructive/80 font-mono tracking-wider font-bold">ALM_LIMIT {alarmLimit}%</text>
          </g>
        )}

        {/* Area fill */}
        <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${gid})`} />
        
        {/* Draw line */}
        <path d={d} fill="none" stroke={color} strokeWidth="1.2" />

        {/* Crosshair indicator lines on hover */}
        {mousePos && (
          <g>
            <line x1={mousePos.x} x2={mousePos.x} y1={0} y2={h} stroke="var(--rp)" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1={0} x2={w} y1={mousePos.y} y2={mousePos.y} stroke="var(--rp)" strokeOpacity="0.3" strokeWidth="0.5" />
            
            {/* Snap point circle */}
            {typeof mousePos.x === 'number' && typeof mousePos.y === 'number' && (
              <circle cx={mousePos.x} cy={mousePos.y} r="2.2" fill={color} className="led" />
            )}
          </g>
        )}
      </svg>

      {/* Numerical Hover coordinate display */}
      {mousePos && (
        <div className="absolute top-1 left-2 glass border r-border px-2 py-0.5 rounded font-mono text-[8px] r-text pointer-events-none z-10 flex items-center gap-1.5 shadow-glow">
          <span>VAL:</span>
          <span className="font-bold r-text-glow text-foreground">{mousePos.val.toFixed(1)}{unit}</span>
        </div>
      )}
    </div>
  );
}

const CHART_LABELS = [
  { t: "CPU Cluster Load",           u: "%",    alarm: 80, ampScale: 8  },
  { t: "RAM Node Allocation",        u: "%",    alarm: 85, ampScale: 6  },
  { t: "Inbound Network Traffic",    u: "MB/s", alarm: 75, ampScale: 10 },
  { t: "API P95 Response Latency",   u: "ms",   alarm: 90, ampScale: 12 },
  { t: "HTTP Error Core Rate",       u: "%",    alarm: 10, ampScale: 4  },
  { t: "K8s Micro Container Health", u: "%",    alarm: 99, ampScale: 5  },
];

export function Observability() {
  const [focusChart, setFocusChart] = useState<string | null>(null);
  const { theme, metrics, simSpeed } = useSimulation();

  // Map chart labels to region-aware colors AND base values
  const CHARTS = CHART_LABELS.map((entry, i) => ({
    ...entry,
    c: `var(--rc${i})`,
    base: metrics.chartBases[i] ?? 50,
  }));

  return (
    <section>
      <SectionHeader 
        id="observe" 
        kicker="// section 04" 
        title="Observability Center" 
        desc="Grafana dashboard metrics. Hover over graphs to invoke diagnostic coordinate crosshairs, or click on a graph to toggle focus mode." 
      />
      
      {/* HUD Layout Controls */}
      <div className="flex items-center justify-between mb-4 select-none">
        <div className="font-mono text-[9px] text-muted-foreground/60">
          PROBES: ACTIVE // AGENT: DETACHED // FREQ: 15s
        </div>
        
        {focusChart && (
          <button
            onClick={() => setFocusChart(null)}
            className="flex items-center gap-1.5 rounded border r-border r-bg px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            <Grid size={11} /> Grid View
          </button>
        )}
      </div>

      {/* Grid or Focus view layout */}
      <AnimatePresence mode="wait">
        {focusChart ? (
          <motion.div
            key="focus"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {CHARTS.filter(c => c.t === focusChart).map(c => (
              <FocusedChartCard 
                key={c.t} 
                title={c.t} 
                color={c.c} 
                unit={c.u} 
                alarm={c.alarm}
                base={c.base}
                speed={simSpeed}
                onClose={() => setFocusChart(null)} 
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {CHARTS.map(c => (
              <div 
                key={c.t} 
                onClick={() => setFocusChart(c.t)}
                className="cursor-pointer"
              >
                <ChartCard title={c.t} color={c.c} unit={c.u} alarm={c.alarm} base={c.base} speed={simSpeed} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ChartCard({ title, color, unit, alarm, base = 50, speed = 1 }: { title: string; color: string; unit: string; alarm: number; base?: number; speed?: number }) {
  const data = useSeries(base, speed);
  const last = data[data.length - 1];
  return (
    <Panel 
      title={title} 
      id={title.toLowerCase().replace(/\s+/g, "-")}
      badge={
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-foreground font-semibold tabular-nums">
          <Maximize2 size={10} className="text-muted-foreground/30 group-hover:r-text transition-colors mr-1" />
          {last.toFixed(1)}{unit}
        </span>
      }
    >
      <div className="pt-2">
        <Chart data={data} color={color} unit={unit} alarmLimit={alarm} />
      </div>
    </Panel>
  );
}

function FocusedChartCard({ title, color, unit, alarm, base = 50, speed = 1, onClose }: { title: string; color: string; unit: string; alarm: number; base?: number; speed?: number; onClose: () => void }) {
  const data = useSeries(base, speed);
  const last = data[data.length - 1];
  return (
    <Panel 
      title={`Telemetry Focus // ${title}`} 
      id={title.toLowerCase().replace(/\s+/g, "-")}
      badge={
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-foreground font-bold tabular-nums">
            CURRENT: {last.toFixed(1)}{unit}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-muted-foreground hover:text-foreground border border-border/40 p-1 rounded bg-black/20 hover:bg-black/40 transition-all cursor-pointer"
          >
            <Minimize2 size={12} />
          </button>
        </div>
      }
    >
      <div className="pt-4 pb-2">
        <Chart data={data} color={color} unit={unit} alarmLimit={alarm} />
      </div>
      <div className="mt-4 pt-4 border-t border-border/10 font-mono text-[10px] text-muted-foreground/60 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded border border-border/10 p-2.5 bg-black/10">
          <div className="text-muted-foreground/40 text-[8px]">PROBE_ID</div>
          <div className="text-foreground font-semibold mt-0.5">PRB_CORE_NODE_4</div>
        </div>
        <div className="rounded border border-border/10 p-2.5 bg-black/10">
          <div className="text-muted-foreground/40 text-[8px]">MAX_RECORDED</div>
          <div className="text-foreground font-semibold mt-0.5">{(Math.max(...data)).toFixed(1)}{unit}</div>
        </div>
        <div className="rounded border border-border/10 p-2.5 bg-black/10">
          <div className="text-muted-foreground/40 text-[8px]">MIN_RECORDED</div>
          <div className="text-foreground font-semibold mt-0.5">{(Math.min(...data)).toFixed(1)}{unit}</div>
        </div>
        <div className="rounded border border-border/10 p-2.5 bg-black/10">
          <div className="text-muted-foreground/40 text-[8px]">AVG_INTEGRAL</div>
          <div className="text-foreground font-semibold mt-0.5">{(data.reduce((a,b)=>a+b, 0)/data.length).toFixed(1)}{unit}</div>
        </div>
      </div>
    </Panel>
  );
}

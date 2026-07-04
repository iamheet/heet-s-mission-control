import { type ReactNode } from "react";
import { X } from "lucide-react";
import { ACCENT, type AccentKey, neon } from "./theme";

/* ────────────────────────────────────────────────────────────────────────
   Panel — the base glass card. Cyan glass, thin cyan border, soft outer
   glow, and corner-bracket accents that light up on hover.
──────────────────────────────────────────────────────────────────────── */
export function Panel({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={[
        "group relative rounded-2xl border border-[rgba(0,229,255,0.16)]",
        "bg-[rgba(14,22,35,0.72)] backdrop-blur-md",
        "shadow-[0_0_0_1px_rgba(0,229,255,0.04),0_18px_40px_-24px_rgba(0,0,0,0.9),0_0_28px_-6px_rgba(0,229,255,0.10)]",
        "transition-all duration-300 ease-out will-change-transform",
        "hover:-translate-y-[3px] hover:border-[rgba(0,229,255,0.42)]",
        "hover:shadow-[0_0_0_1px_rgba(0,229,255,0.10),0_24px_50px_-24px_rgba(0,0,0,0.95),0_0_40px_-4px_rgba(0,229,255,0.20)]",
        padded ? "p-6" : "",
        className,
      ].join(" ")}
    >
      <CornerBrackets />
      {children}
    </div>
  );
}

/** Four L-shaped corner brackets, invisible until the parent .group hovers. */
function CornerBrackets() {
  const base =
    "pointer-events-none absolute h-3.5 w-3.5 border-[#00E5FF]/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100";
  return (
    <>
      <span className={`${base} left-2 top-2 border-l border-t`} />
      <span className={`${base} right-2 top-2 border-r border-t`} />
      <span className={`${base} bottom-2 left-2 border-b border-l`} />
      <span className={`${base} bottom-2 right-2 border-b border-r`} />
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   PanelHeader — two-tone title (accent word + white word), caption, and an
   optional right-side action (close icon or "View All" link).
──────────────────────────────────────────────────────────────────────── */
export function PanelHeader({
  lead,
  rest,
  caption,
  action,
}: {
  lead: string;
  rest?: string;
  caption?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h3
          className="font-display text-[13px] font-bold uppercase tracking-[0.22em]"
          style={neon(ACCENT.cyan, 6)}
        >
          <span style={{ color: ACCENT.cyan }}>{lead}</span>
          {rest ? <span className="ml-1.5 text-white">{rest}</span> : null}
        </h3>
        {caption ? (
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#6B7C99]">{caption}</p>
        ) : null}
      </div>
      {action ?? <CollapseButton />}
    </div>
  );
}

export function CollapseButton() {
  return (
    <button
      type="button"
      className="rounded-md border border-white/10 p-1 text-slate-500 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
      aria-label="Collapse"
    >
      <X size={13} />
    </button>
  );
}

export function ViewAllLink({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80 transition-colors hover:text-cyan-200"
    >
      View All
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   LiveDot — pulsing "live" indicator dot.
──────────────────────────────────────────────────────────────────────── */
export function LiveDot({ accent = "green", size = 8 }: { accent?: AccentKey; size?: number }) {
  const c = ACCENT[accent];
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <span
        className="absolute inset-0 animate-ping rounded-full opacity-60"
        style={{ background: c }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, background: c, boxShadow: `0 0 8px ${c}` }}
      />
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Waveform — animated audio bars (CSS keyframe `mo-wave`, staggered delay).
──────────────────────────────────────────────────────────────────────── */
export function Waveform({
  bars = 28,
  accent = "cyan",
  height = 26,
  className = "",
}: {
  bars?: number;
  accent?: AccentKey;
  height?: number;
  className?: string;
}) {
  const c = ACCENT[accent];
  return (
    <div
      className={`flex items-center gap-[3px] ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="mo-wavebar flex-1 rounded-full"
          style={{
            background: `linear-gradient(to top, ${c}, ${c}55)`,
            animationDelay: `${(i % 7) * 90}ms`,
            animationDuration: `${900 + (i % 5) * 120}ms`,
          }}
        />
      ))}
    </div>
  );
}

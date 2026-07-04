import { AudioLines, Bell, Bookmark, Clock, LogOut, Radar, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { OWNER, SYSTEM } from "./mockData";
import { useLiveData } from "./useLiveData";
import { ACCENT, neon } from "./theme";

/** Hexagonal glowing logo mark. */
function HexLogo() {
  return (
    <div className="relative grid h-10 w-10 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <polygon
          points="50,4 91,27 91,73 50,96 9,73 9,27"
          fill="rgba(34,211,238,0.08)"
          stroke={ACCENT.cyan}
          strokeWidth="4"
          style={{ filter: `drop-shadow(0 0 6px ${ACCENT.cyan})` }}
        />
      </svg>
      <Radar size={16} className="relative text-cyan-300" />
    </div>
  );
}

function IconButton({ children, dot }: { children: React.ReactNode; dot?: boolean }) {
  return (
    <button
      type="button"
      className="relative grid h-9 w-9 place-items-center rounded-full border border-cyan-400/20 bg-white/[0.03] text-slate-300 transition-all hover:border-cyan-400/50 hover:text-cyan-300"
    >
      {children}
      {dot ? (
        <span
          className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full"
          style={{ background: ACCENT.pink, boxShadow: `0 0 6px ${ACCENT.pink}` }}
        />
      ) : null}
    </button>
  );
}

export function Navbar() {
  const { clock } = useLiveData();
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[72px] border-b border-[rgba(0,229,255,0.14)] bg-[rgba(5,8,22,0.72)] backdrop-blur-xl">
      <div className="mo-grid pointer-events-none absolute inset-0 opacity-[0.3]" />
      <div className="relative flex h-full items-center gap-4 px-5">
        {/* Product mark */}
        <div className="flex items-center gap-3">
          <HexLogo />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
              {SYSTEM.product}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-cyan-300/80">
              {SYSTEM.version}
            </div>
          </div>
        </div>

        <div className="h-9 w-px bg-cyan-400/15" />

        {/* Control center */}
        <div className="flex items-center gap-3">
          <Radar size={22} className="text-cyan-300" style={{ filter: `drop-shadow(0 0 5px ${ACCENT.cyan})` }} />
          <div className="leading-tight">
            <div className="font-display text-base font-bold uppercase tracking-[0.15em] text-white" style={neon(ACCENT.cyan, 5)}>
              {SYSTEM.center}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400/70">
              {SYSTEM.centerCaption}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mx-auto hidden w-full max-w-xl items-center gap-2 rounded-full border border-cyan-400/20 bg-white/[0.03] px-4 py-2 text-slate-400 transition-colors focus-within:border-cyan-400/50 lg:flex">
          <Search size={15} className="text-cyan-300/70" />
          <input
            className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
            placeholder="Search Anything..."
          />
          <kbd className="rounded border border-cyan-400/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300/80">
            ⌘K
          </kbd>
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          {/* live clock */}
          <div className="hidden items-center gap-1.5 rounded-full border border-[rgba(0,229,255,0.18)] bg-white/[0.03] px-3 py-1.5 xl:flex">
            <Clock size={12} className="text-cyan-300/70" />
            <span
              className="font-mono text-xs font-semibold tabular-nums text-cyan-200"
              style={neon(ACCENT.cyan, 5)}
            >
              {clock}
            </span>
          </div>

          {/* return to portfolio */}
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-cyan-300/90 transition-all hover:border-cyan-400/60 hover:text-cyan-200"
            title="Return to Mission Control"
          >
            <LogOut size={13} />
            <span className="hidden md:inline">Exit</span>
          </Link>

          <div className="h-9 w-px bg-cyan-400/15" />

          <IconButton>
            <AudioLines size={16} />
          </IconButton>
          <IconButton dot>
            <Bell size={16} />
          </IconButton>
          <IconButton>
            <Bookmark size={16} />
          </IconButton>

          <div className="h-9 w-px bg-cyan-400/15" />

          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={OWNER.avatar}
                alt={OWNER.name}
                className="h-9 w-9 rounded-full border border-cyan-400/40 object-cover"
              />
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-[#05070D]"
                style={{ background: ACCENT.green, boxShadow: `0 0 6px ${ACCENT.green}` }}
              />
            </div>
            <div className="hidden leading-tight md:block">
              <div className="text-xs font-bold tracking-wide text-white">{OWNER.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-cyan-300/80">{OWNER.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

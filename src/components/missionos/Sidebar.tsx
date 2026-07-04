import { useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  Cloud,
  Cpu,
  FolderTree,
  GitBranch,
  LayoutDashboard,
  Settings,
  Target,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "./mockData";
import { ACCENT, neon } from "./theme";

const ICONS: Record<string, LucideIcon> = {
  Cpu,
  LayoutDashboard,
  Bot,
  GitBranch,
  Cloud,
  Boxes,
  Activity,
  BarChart3,
  FolderTree,
  Workflow,
  Settings,
};

export function Sidebar() {
  const [active, setActive] = useState("core");

  return (
    <aside className="fixed left-0 top-[72px] z-40 flex h-[calc(100vh-72px)] w-[240px] flex-col p-3">
      {/* floating glass panel */}
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(0,229,255,0.16)] bg-[rgba(14,22,35,0.55)] backdrop-blur-xl shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9),0_0_30px_-10px_rgba(0,229,255,0.15)]">
        <div className="mo-grid pointer-events-none absolute inset-0 opacity-[0.25]" />

        {/* Nav list */}
        <nav className="relative flex-1 space-y-1.5 overflow-y-auto px-3 py-4 [scrollbar-width:none]">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={[
                  "group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all duration-300",
                  isActive
                    ? "bg-[rgba(0,229,255,0.08)] border border-[rgba(0,229,255,0.28)]"
                    : "border border-transparent hover:bg-white/[0.03] hover:border-[rgba(0,229,255,0.12)]",
                ].join(" ")}
                style={isActive ? { boxShadow: `inset 0 0 20px ${ACCENT.cyan}14` } : undefined}
              >
                {/* active left border */}
                {isActive && (
                  <span
                    className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                    style={{ background: ACCENT.cyan, boxShadow: `0 0 10px ${ACCENT.cyan}` }}
                  />
                )}
                <span
                  className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300",
                    isActive
                      ? "border-[rgba(0,229,255,0.5)] bg-[rgba(0,229,255,0.1)] text-[#00E5FF]"
                      : "border-white/10 bg-white/[0.02] text-slate-400 group-hover:text-[#00E5FF] group-hover:border-[rgba(0,229,255,0.3)]",
                  ].join(" ")}
                  style={isActive ? { boxShadow: `0 0 14px ${ACCENT.cyan}55` } : undefined}
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0 leading-tight">
                  <span
                    className={[
                      "block truncate font-display text-[11px] font-bold uppercase tracking-[0.12em]",
                      isActive ? "text-white" : "text-slate-300",
                    ].join(" ")}
                  >
                    {item.title}
                  </span>
                  <span className="block truncate text-[9px] tracking-wide text-[#6B7C99]">
                    {item.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Pinned radar status widget */}
        <div className="relative border-t border-[rgba(0,229,255,0.12)] px-4 py-6">
          <div className="mx-auto grid h-24 w-24 place-items-center">
            <div className="relative h-24 w-24">
              {/* concentric rotating rings */}
              <span className="mo-spin-slow absolute inset-0 rounded-full border border-[rgba(0,229,255,0.28)]" />
              <span className="mo-spin-rev absolute inset-2 rounded-full border border-dashed border-[rgba(0,229,255,0.35)]" />
              <span className="mo-spin-slow absolute inset-5 rounded-full border border-[rgba(0,255,179,0.35)]" />
              {/* sweep */}
              <span
                className="mo-sweep absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, ${ACCENT.green}2e 40deg, transparent 80deg)`,
                }}
              />
              <span className="absolute inset-0 grid place-items-center">
                <Target
                  size={20}
                  className="text-[#00FFB3]"
                  style={{ filter: `drop-shadow(0 0 6px ${ACCENT.green})` }}
                />
              </span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#6B7C99]">
              Jarvis Status
            </div>
            <div
              className="mt-1 font-display text-lg font-bold uppercase tracking-[0.22em] text-[#00FFB3]"
              style={neon(ACCENT.green, 10)}
            >
              Online
            </div>
            <div className="text-[9px] text-[#6B7C99]">All Systems Operational</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

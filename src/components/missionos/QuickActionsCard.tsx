import {
  DatabaseBackup,
  Rocket,
  RotateCw,
  ScanLine,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Panel, PanelHeader } from "./primitives";
import { QUICK_ACTIONS } from "./mockData";
import { ACCENT } from "./theme";

const ICONS: Record<string, LucideIcon> = {
  Rocket,
  ScanLine,
  DatabaseBackup,
  Trash2,
  RotateCw,
  Sparkles,
};

export function QuickActionsCard() {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader lead="QUICK" rest="ACTIONS" caption="Execute Commands" />

      <div className="grid flex-1 grid-cols-3 gap-2.5">
        {QUICK_ACTIONS.map((a) => {
          const Icon = ICONS[a.icon] ?? Rocket;
          const c = ACCENT[a.accent];
          return (
            <button
              key={a.id}
              type="button"
              className="group/qa flex flex-col items-center justify-center gap-2 rounded-lg border bg-white/[0.02] py-4 transition-all hover:-translate-y-0.5"
              style={{ borderColor: `${c}33` }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 16px ${c}33`)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-md"
                style={{ background: `${c}18`, border: `1px solid ${c}44` }}
              >
                <Icon size={16} style={{ color: c }} />
              </span>
              <span className="text-[10px] font-medium tracking-wide text-slate-300">{a.label}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

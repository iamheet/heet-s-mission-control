import { HeartPulse, RefreshCw, Rocket, UserPlus, type LucideIcon } from "lucide-react";
import { Panel, PanelHeader, ViewAllLink } from "./primitives";
import { useLiveData } from "./useLiveData";
import { ACCENT } from "./theme";

const ICONS: Record<string, LucideIcon> = { Rocket, RefreshCw, HeartPulse, UserPlus };

export function NotificationsCard() {
  const { notifications } = useLiveData();
  return (
    <Panel>
      <PanelHeader lead="RECENT" rest="NOTIFICATIONS" action={<ViewAllLink />} />
      <div className="space-y-1.5">
        {notifications.map((n, i) => {
          const Icon = ICONS[n.icon] ?? Rocket;
          const c = ACCENT[n.accent];
          return (
            <div
              key={`${n.text}-${i}`}
              className={`flex items-center gap-2.5 rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2 transition-colors hover:border-cyan-400/20 ${i === 0 ? "mo-slidein" : ""}`}
            >
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                style={{ background: `${c}1c`, border: `1px solid ${c}44` }}
              >
                <Icon size={12} style={{ color: c }} />
              </span>
              <span className="flex-1 truncate text-[11px] font-medium text-slate-200">{n.text}</span>
              <span className="shrink-0 text-[9px] text-[#6B7C99]">{n.time}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

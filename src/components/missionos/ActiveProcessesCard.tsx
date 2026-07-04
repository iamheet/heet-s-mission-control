import { Boxes, Cog, Container, Server, type LucideIcon } from "lucide-react";
import { Panel, PanelHeader, ViewAllLink } from "./primitives";
import { useLiveData } from "./useLiveData";
import { ACCENT, neon } from "./theme";

const ICONS: Record<string, LucideIcon> = { Container, Boxes, Server, Cog };

export function ActiveProcessesCard() {
  const { processes } = useLiveData();
  return (
    <Panel>
      <PanelHeader lead="ACTIVE" rest="PROCESSES" action={<ViewAllLink />} />
      <div className="grid grid-cols-2 gap-2.5">
        {processes.map((p) => {
          const Icon = ICONS[p.icon] ?? Container;
          const c = ACCENT[p.accent];
          return (
            <div
              key={p.label}
              className="relative flex flex-col gap-1 rounded-lg border bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
              style={{ borderColor: `${c}33` }}
            >
              <Icon size={15} style={{ color: c }} />
              <span
                className="font-display text-2xl font-bold leading-none text-white transition-all duration-300"
                style={neon(c, 8)}
              >
                {p.count}
              </span>
              <span className="text-[10px] leading-tight text-[#6B7C99]">{p.label}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

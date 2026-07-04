import {
  ChevronRight,
  FlaskConical,
  GitCommit,
  Hammer,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { Panel, PanelHeader } from "./primitives";
import { PIPELINE, PIPELINE_META, type PipelineStage } from "./mockData";
import { ACCENT } from "./theme";

const ICONS: Record<string, LucideIcon> = { GitCommit, Hammer, FlaskConical, Rocket };

function Node({ stage }: { stage: PipelineStage }) {
  const Icon = ICONS[stage.icon] ?? GitCommit;
  const c = ACCENT[stage.accent];
  const isActive = stage.state === "active";
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div
        className={`relative grid h-12 w-12 place-items-center rounded-full border-2 ${isActive ? "mo-breathe" : ""}`}
        style={{ borderColor: c, background: `${c}18`, boxShadow: `0 0 12px ${c}55` }}
      >
        <Icon size={18} style={{ color: c }} />
      </div>
      <div className="mt-2 text-xs font-bold uppercase tracking-wide text-white">{stage.title}</div>
      <div className="text-[10px]" style={{ color: c }}>
        {stage.status}
      </div>
    </div>
  );
}

export function PipelineCard() {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader lead="DEVOPS" rest="PIPELINE" caption="CI/CD Overview" />

      <div className="flex items-start justify-between px-1 pt-2">
        {PIPELINE.map((stage, i) => (
          <div key={stage.id} className="flex flex-1 items-start">
            <Node stage={stage} />
            {i < PIPELINE.length - 1 && (
              <div className="mt-6 h-px flex-1 self-start" style={{ minWidth: 12 }}>
                <div
                  className="mo-dash h-px w-full"
                  style={{
                    background: `repeating-linear-gradient(to right, ${ACCENT.cyan}88 0 6px, transparent 6px 12px)`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
        <div className="leading-tight">
          <div className="text-xs font-semibold text-white">{PIPELINE_META.project}</div>
          <div className="font-mono text-[10px] text-slate-500">{PIPELINE_META.detail}</div>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-cyan-400/40 bg-cyan-400/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-300 transition-colors hover:bg-cyan-400/15"
        >
          View Pipeline
          <ChevronRight size={13} />
        </button>
      </div>
    </Panel>
  );
}

import { Panel, PanelHeader, ViewAllLink } from "./primitives";
import { LOG_ACCENT, type LogLevel } from "./mockData";
import { useLiveData } from "./useLiveData";
import { ACCENT } from "./theme";

function LevelPill({ level }: { level: LogLevel }) {
  const c = ACCENT[LOG_ACCENT[level]];
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
      style={{ color: c, background: `${c}1c`, border: `1px solid ${c}44` }}
    >
      {level}
    </span>
  );
}

export function LiveLogsCard() {
  const { logs } = useLiveData();
  return (
    <Panel>
      <PanelHeader
        lead="LIVE"
        rest="LOGS"
        action={
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: ACCENT.green, boxShadow: `0 0 6px ${ACCENT.green}` }}
            />
            <ViewAllLink />
          </div>
        }
      />
      <div className="max-h-[210px] space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {logs.map((log, i) => (
          <div
            key={`${log.time}-${log.message}`}
            className={`flex items-start gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5 ${i === 0 ? "mo-slidein" : ""}`}
          >
            <span className="mt-0.5 shrink-0 font-mono text-[9px] text-[#6B7C99]">{log.time}</span>
            <LevelPill level={log.level} />
            <span className="text-[10px] leading-snug text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

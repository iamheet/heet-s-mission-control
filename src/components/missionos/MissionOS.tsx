/**
 * JARVIS Mission OS — single-page AI command-center dashboard.
 *
 * Layout (CSS grid): fixed 72px navbar + fixed 230px sidebar; the main region
 * is a 12-col-ish grid. Rows 1–2 sit left of a ~22% right column; row 3 spans
 * full width beneath. Tuned to stay intact down to a 1280px viewport.
 */
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { GlobalNetworkCard } from "./GlobalNetworkCard";
import { JarvisCore } from "./JarvisCore";
import { AIAssistantCard } from "./AIAssistantCard";
import { SystemHealthCard } from "./SystemHealthCard";
import { GaugeWidget } from "./GaugeWidget";
import { ActiveProcessesCard } from "./ActiveProcessesCard";
import { LiveLogsCard } from "./LiveLogsCard";
import { NotificationsCard } from "./NotificationsCard";
import { PipelineCard } from "./PipelineCard";
import { TerminalCard } from "./TerminalCard";
import { QuickActionsCard } from "./QuickActionsCard";
import { MissionOSStyles } from "./styles";
import { LiveDataProvider, useLiveData } from "./useLiveData";

export function MissionOS() {
  return (
    <LiveDataProvider>
      <Dashboard />
    </LiveDataProvider>
  );
}

function Dashboard() {
  const { gauges } = useLiveData();
  return (
    <div className="mo-root mo-bg-gradient relative min-h-screen overflow-x-hidden bg-[#050816] text-slate-200 antialiased">
      <MissionOSStyles />
      {/* layered background: radial lights → twinkling stars → circuit grid */}
      <div className="mo-bg-lights pointer-events-none fixed inset-0 z-0" />
      <div className="mo-stars pointer-events-none fixed inset-0 z-0 opacity-70" />
      <div className="mo-grid pointer-events-none fixed inset-0 z-0 opacity-60" />

      <Navbar />
      <Sidebar />

      {/* Main region — offset by navbar + sidebar. min-width keeps the dense
          HUD proportions from collapsing before 1280px. */}
      <main className="relative z-10 ml-[240px] mt-[72px] min-w-[1060px] px-6 py-6">
        <div className="mx-auto max-w-[1760px] space-y-6">
          {/* ── Rows 1 & 2 (left) beside the right column ── */}
          <div className="flex gap-6">
            <div className="min-w-0 flex-1 space-y-6">
              {/* Row 1 — 22 / 34 / 22 / 22 */}
              <div className="grid grid-cols-[1.05fr_1.6fr_1.05fr_1.05fr] gap-6">
                <GlobalNetworkCard />
                <JarvisCore />
                <AIAssistantCard />
                <SystemHealthCard />
              </div>

              {/* Row 2 — five gauges */}
              <div className="grid grid-cols-5 gap-6">
                {gauges.map((g) => (
                  <GaugeWidget
                    key={g.id}
                    label={g.label}
                    value={g.value}
                    accent={g.accent}
                    caption={g.caption}
                  />
                ))}
              </div>
            </div>

            {/* Right column ~22% */}
            <div className="w-[312px] shrink-0 space-y-6 2xl:w-[352px]">
              <ActiveProcessesCard />
              <LiveLogsCard />
              <NotificationsCard />
            </div>
          </div>

          {/* Row 3 — three equal columns */}
          <div className="grid grid-cols-3 gap-6">
            <PipelineCard />
            <TerminalCard />
            <QuickActionsCard />
          </div>

          <Footer />
        </div>
      </main>
    </div>
  );
}

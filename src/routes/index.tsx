import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BootSequence } from "@/components/mc/BootSequence";
import { TopBar } from "@/components/mc/TopBar";
import { Hero } from "@/components/mc/Hero";
import { AmbientBackdrop } from "@/components/mc/AmbientBackdrop";
import { Reveal } from "@/components/mc/primitives";
import { Overview } from "@/components/mc/Overview";
import { InfraMap } from "@/components/mc/InfraMap";
import { Deployment } from "@/components/mc/Deployment";
import { Observability } from "@/components/mc/Observability";
import { TechMatrix } from "@/components/mc/TechMatrix";
import { History } from "@/components/mc/History";
import { Systems } from "@/components/mc/Systems";
import { Kubernetes } from "@/components/mc/Kubernetes";
import { Terminal } from "@/components/mc/Terminal";
import { Contact } from "@/components/mc/Contact";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HEET·OS — DevOps Mission Control · Heet Chokshi" },
      { name: "description", content: "Mission Control for Heet Chokshi — Software & DevOps Engineer. Live infrastructure, deployments and observability dashboards." },
      { property: "og:title", content: "HEET·OS — DevOps Mission Control" },
      { property: "og:description", content: "Production cloud platform operated by Heet Chokshi — AWS · Docker · Kubernetes · Nginx · Prometheus · Grafana." },
    ],
  }),
  component: Home,
});

function Home() {
  const [booted, setBooted] = useState(false);
  const sections = [Overview, InfraMap, Deployment, Observability, TechMatrix, History, Systems, Kubernetes, Terminal, Contact];
  return (
    <>
      <AnimatePresence>{!booted && <BootSequence onDone={() => setBooted(true)} />}</AnimatePresence>
      <AmbientBackdrop />
      <div className={booted ? "" : "pointer-events-none opacity-0"}>
        <TopBar />
        <Hero />
        <main className="mx-auto max-w-[1600px] px-4 md:px-6 py-8 space-y-24 md:space-y-32">
          {sections.map((Section, i) => (
            <Reveal key={i}>
              <Section />
            </Reveal>
          ))}
        </main>
      </div>
    </>
  );
}

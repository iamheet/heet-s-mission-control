import { createFileRoute } from "@tanstack/react-router";
import { MissionOS } from "@/components/missionos/MissionOS";

export const Route = createFileRoute("/mission-os")({
  head: () => ({
    meta: [
      { title: "JARVIS Mission OS — AI Command Center" },
      {
        name: "description",
        content:
          "JARVIS Mission OS — a dark futuristic AI command-center dashboard for Heet Chokshi's cloud infrastructure.",
      },
    ],
    links: [
      // Futuristic display fonts for this dashboard (Inter / JetBrains already
      // loaded globally in __root; Orbitron + Rajdhani added here).
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800;900&family=Rajdhani:wght@500;600;700&display=swap",
      },
    ],
  }),
  component: MissionOS,
});

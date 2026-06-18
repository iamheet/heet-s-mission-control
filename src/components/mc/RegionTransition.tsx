import { useEffect, useState } from "react";
import { useSimulation } from "./regionTheme";

export function RegionTransition() {
  const { regionId } = useSimulation();
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Trigger a sweep overlay when the region changes
    setVisible(true);
    setKey((k) => k + 1);

    // Read the transition duration from CSS var (e.g. '800ms') and fall back to 800
    let ms = 800;
    try {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--theme-transition") || "800ms";
      const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
      if (!Number.isNaN(n)) ms = n;
    } catch (e) {
      // ignore
    }

    const timeout = window.setTimeout(() => setVisible(false), ms + 120);
    return () => window.clearTimeout(timeout);
  }, [regionId]);

  if (!visible) return null;

  return (
    <div
      key={key}
      className="region-sweep pointer-events-none fixed inset-0 z-[80]"
      aria-hidden="true"
    />
  );
}

export default RegionTransition;

import { useEffect, useState } from "react";

/**
 * Returns true while Jarvis is actively speaking about this section during a tour.
 * Turns on when jarvis-highlight fires with { id, active: true }
 * Turns off when jarvis-highlight fires with { id, active: false }
 */
export function useJarvisHighlight(id: string): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const { id: targetId, active: isActive } = (e as CustomEvent).detail;
      if (targetId === id) {
        setActive(isActive !== false);
      }
    };
    window.addEventListener("jarvis-highlight", handler);
    return () => window.removeEventListener("jarvis-highlight", handler);
  }, [id]);

  return active;
}

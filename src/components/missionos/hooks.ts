import { useEffect, useRef, useState } from "react";

/** True once the component has mounted — used to trigger on-load animations. */
export function useMounted(delay = 60): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setM(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return m;
}

/** Animate an integer from 0 → target over `duration` ms (ease-out). */
export function useCountUp(target: number, duration = 1400, start = true): number {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  const startTs = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    // performance.now() is allowed in the browser runtime; avoids Date.now().
    const tick = (ts: number) => {
      if (startTs.current === null) startTs.current = ts;
      const p = Math.min(1, (ts - startTs.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // cubic ease-out
      setVal(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      startTs.current = null;
    };
  }, [target, duration, start]);

  return val;
}

/**
 * Eases the displayed integer toward `target` whenever `target` changes.
 * On first mount it animates 0 → target (same feel as useCountUp); on every
 * later change it tweens smoothly from the currently-shown value to the new
 * one — used for live metrics that keep updating.
 */
export function useAnimatedNumber(target: number, duration = 700): number {
  const [val, setVal] = useState(0);
  const valRef = useRef(0);
  valRef.current = val; // always mirror the latest rendered value
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const from = valRef.current;
    const delta = target - from;
    if (delta === 0) return;
    let startTs: number | null = null;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + delta * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return val;
}

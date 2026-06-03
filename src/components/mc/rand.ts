// Deterministic PRNG so SSR and client produce identical numbers — fixes hydration.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededSpark(seed: number, n = 24, base = 50, amp = 30) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => base + Math.sin(i / 2) * amp * 0.5 + r() * amp * 0.4);
}

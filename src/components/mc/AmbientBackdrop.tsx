import { useEffect, useRef, useState } from "react";
import { mulberry32 } from "./rand";
import { useSimulation } from "./regionTheme";

/**
 * Global ambient layer — floating particles, drifting gradients, vignette.
 *
 * Mobile performance profile (< 768px):
 *  - Canvas skipped entirely: zero rAF loop, zero GPU canvas compositing
 *  - Aurora divs removed: no blur-3xl on fixed elements
 *  - Only a cheap static radial vignette remains
 *  - Mouse tracking: never runs on mobile
 *  - visibilitychange: pauses rAF when tab is hidden (desktop)
 *
 * Desktop:
 *  - 12 particles at up to 60 fps
 *  - Aurora blur-3xl divs with slow CSS drift
 *  - Mouse parallax on particles
 */
export function AmbientBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const targetMouse = useRef({ x: 0.5, y: 0.5 });
  const { theme } = useSimulation();

  // Client-only guard — the component uses <canvas> and browser APIs that don't
  // exist during SSR. We render `null` on the server and first client pass, then
  // flip to the real UI after mount so both sides agree during hydration.
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    // Skip canvas entirely on mobile — eliminates the rAF loop and GPU canvas layer
    if (isMobile) return;

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0;
    const r = mulberry32(7);
    const N = 12;

    const particles = Array.from({ length: N }, () => ({
      x: r(), y: r(),
      vx: (r() - 0.5) * 0.00004,
      vy: (r() - 0.5) * 0.00004,
      s: 0.4 + r() * 0.8,
      primary: r() < 0.65,
      a: 0.05 + r() * 0.15,
      p: r() * Math.PI * 2,
    }));

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const onMove = (e: MouseEvent) => {
      targetMouse.current.x = e.clientX / window.innerWidth;
      targetMouse.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const hueCache = { h1: 210, h2: 240, lastUpdate: -Infinity };
    let raf = 0;
    let running = true;

    // Pause rAF when tab is hidden — prevents GPU work on backgrounded tabs
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      } else {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const tick = (t: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      mouse.current.x += (targetMouse.current.x - mouse.current.x) * 0.08;
      mouse.current.y += (targetMouse.current.y - mouse.current.y) * 0.08;

      if (t - hueCache.lastUpdate > 500) {
        const root = document.documentElement;
        hueCache.h1 = parseFloat(getComputedStyle(root).getPropertyValue("--region-particle-hue") || "210");
        hueCache.h2 = parseFloat(getComputedStyle(root).getPropertyValue("--region-particle-hue2") || "240");
        hueCache.lastUpdate = t;
      }

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const h1 = hueCache.h1;
      const h2 = hueCache.h2;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) p.y = 1.05;
        if (p.y > 1.05) p.y = -0.05;

        const px = p.x * w + (mx - 0.5) * 12;
        const py = p.y * h + (my - 0.5) * 12;
        const tw = 0.7 + Math.sin(t / 800 + p.p) * 0.3;
        const hue = p.primary ? h1 : h2;
        ctx.beginPath();
        ctx.arc(px, py, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `oklch(0.78 0.18 ${hue} / ${p.a * tw})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isMobile]);

  // During SSR and first client render, return null so both sides agree.
  if (!mounted) return null;

  return (
    <>
      {/* Aurora gradients — desktop only. blur-3xl on fixed elements is the
          single largest GPU cost on mobile; hidden via CSS display after mount. */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
        style={isMobile ? { display: "none" } : undefined}
      >
        <div
          className="absolute -top-40 -left-40 h-[60vh] w-[60vw] rounded-full opacity-25 blur-3xl aurora-1"
          style={{ background: `radial-gradient(circle, color-mix(in oklch, var(--rp) 55%, transparent) 0%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/3 -right-40 h-[55vh] w-[55vw] rounded-full opacity-18 blur-3xl aurora-2"
          style={{ background: `radial-gradient(circle, color-mix(in oklch, var(--rs) 45%, transparent) 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[50vh] w-[50vw] rounded-full opacity-12 blur-3xl aurora-3"
          style={{ background: `radial-gradient(circle, color-mix(in oklch, var(--rp) 35%, transparent) 0%, transparent 70%)` }}
        />
      </div>
      {/* Canvas — desktop only (skipped on mobile via early return in useEffect) */}
      <canvas ref={ref} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      {/* Vignette — cheap radial, no filter, always shown */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse at center, transparent 65%, oklch(0.08 0.02 260 / 0.5) 100%)" }}
      />
    </>
  );
}

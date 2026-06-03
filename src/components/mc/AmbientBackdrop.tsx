import { useEffect, useRef } from "react";
import { mulberry32 } from "./rand";

/**
 * Global ambient layer — floating particles, drifting gradients, vignette.
 * Fixed, pointer-events-none. Sits behind all content.
 * Canvas only animates on client to avoid SSR mismatches.
 */
export function AmbientBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0;
    const r = mulberry32(7);
    const N = 70;
    const particles = Array.from({ length: N }, (_, i) => ({
      x: r(), y: r(),
      vx: (r() - 0.5) * 0.00025,
      vy: (r() - 0.5) * 0.00025,
      s: 0.4 + r() * 1.6,
      h: r() < 0.65 ? 210 : 295, // cyan or purple
      a: 0.25 + r() * 0.55,
      p: r() * Math.PI * 2,
    }));

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // connecting lines
      for (let i = 0; i < N; i++) {
        const a = particles[i];
        for (let j = i + 1; j < N; j++) {
          const b = particles[j];
          const dx = (a.x - b.x) * w, dy = (a.y - b.y) * h;
          const d = Math.hypot(dx, dy);
          if (d < 140) {
            ctx.strokeStyle = `oklch(0.78 0.16 ${a.h} / ${(1 - d / 140) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }
      // particles
      const mx = mouse.current.x, my = mouse.current.y;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -0.05) p.x = 1.05; if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) p.y = 1.05; if (p.y > 1.05) p.y = -0.05;
        const px = p.x * w + (mx - 0.5) * 18;
        const py = p.y * h + (my - 0.5) * 18;
        const tw = 0.6 + Math.sin(t / 700 + p.p) * 0.4;
        ctx.beginPath();
        ctx.arc(px, py, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `oklch(0.78 0.18 ${p.h} / ${p.a * tw})`;
        ctx.shadowColor = `oklch(0.78 0.2 ${p.h} / 0.9)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      {/* drifting aurora gradients */}
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[60vh] w-[60vw] rounded-full opacity-40 blur-3xl aurora-1"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.2 240 / 0.5), transparent 70%)" }} />
        <div className="absolute top-1/3 -right-40 h-[55vh] w-[55vw] rounded-full opacity-30 blur-3xl aurora-2"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.24 295 / 0.5), transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/3 h-[50vh] w-[50vw] rounded-full opacity-25 blur-3xl aurora-3"
          style={{ background: "radial-gradient(circle, oklch(0.7 0.2 200 / 0.45), transparent 70%)" }} />
      </div>
      <canvas ref={ref} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      {/* vignette */}
      <div className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, oklch(0.08 0.02 260 / 0.6) 100%)" }} />
    </>
  );
}

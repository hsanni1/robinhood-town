import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const COLORS = ["#00c805", "#ffd500", "#ff5caa", "#627eea", "#f7931a", "#9945ff"];

/**
 * Lightweight canvas confetti burst. Exposes an imperative `fire()` via ref
 * so any part of the game (battle win, quest claim) can trigger it.
 */
const Confetti = forwardRef(function Confetti(_props, ref) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const raf = useRef(null);

  useImperativeHandle(ref, () => (opts = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    const originX = opts.x ?? width / 2;
    const originY = opts.y ?? height / 3;
    const count = opts.count ?? 90;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      particles.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 4 + Math.random() * 5,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        life: 0,
        maxLife: 60 + Math.random() * 40,
      });
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    }
    resize();
    window.addEventListener("resize", resize);

    function loop() {
      ctx.clearRect(0, 0, width, height);
      particles.current = particles.current.filter((p) => p.life < p.maxLife);
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.rot += p.vr;
        p.life += 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = "#0b0b0b";
        ctx.lineWidth = 1;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      raf.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
});

export default Confetti;

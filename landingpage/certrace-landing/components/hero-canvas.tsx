"use client";

import { useEffect, useRef } from "react";

// Supplier nodes scattered across the field, all routing into one hub —
// the visual thesis of the product: many sources, one platform.
const NODES = [
  { x: 0.08, y: 0.18 },
  { x: 0.16, y: 0.55 },
  { x: 0.07, y: 0.78 },
  { x: 0.26, y: 0.3 },
  { x: 0.3, y: 0.72 },
  { x: 0.42, y: 0.12 },
  { x: 0.45, y: 0.5 },
  { x: 0.55, y: 0.82 },
  { x: 0.62, y: 0.1 },
  { x: 0.78, y: 0.16 },
  { x: 0.92, y: 0.3 },
  { x: 0.94, y: 0.62 },
  { x: 0.82, y: 0.8 },
  { x: 0.68, y: 0.62 },
];

const HUB = { x: 0.66, y: 0.38 };

function quadPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      // dotted grid
      const step = 56;
      ctx.fillStyle = "rgba(17,17,17,0.045)";
      for (let gx = step / 2; gx < width; gx += step) {
        for (let gy = step / 2; gy < height; gy += step) {
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
      }

      const hub = { x: HUB.x * width, y: HUB.y * height };

      NODES.forEach((node, i) => {
        const nx = node.x * width + Math.sin(t * 0.0004 + i * 1.7) * 7;
        const ny = node.y * height + Math.cos(t * 0.00035 + i * 2.3) * 7;
        const start = { x: nx, y: ny };

        // curved route into the hub
        const mx = (nx + hub.x) / 2;
        const my = (ny + hub.y) / 2;
        const dx = hub.x - nx;
        const dy = hub.y - ny;
        const len = Math.max(1, Math.hypot(dx, dy));
        const bend = Math.min(80, len * 0.22) * (i % 2 === 0 ? 1 : -1);
        const ctrl = { x: mx - (dy / len) * bend, y: my + (dx / len) * bend };

        ctx.strokeStyle = "rgba(17,17,17,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(ctrl.x, ctrl.y, hub.x, hub.y);
        ctx.stroke();

        // data pulse travelling along the route, with a short trail
        const p = (t * 0.00009 + i * 0.137) % 1;
        for (let k = 0; k < 5; k++) {
          const pk = p - k * 0.012;
          if (pk < 0) continue;
          const pos = quadPoint(start, ctrl, hub, pk);
          const alpha = 0.5 * (1 - k / 5);
          ctx.fillStyle =
            i % 3 === 0
              ? `rgba(16,185,129,${alpha})`
              : `rgba(17,17,17,${alpha * 0.55})`;
          const s = 3.5 - k * 0.5;
          ctx.fillRect(pos.x - s / 2, pos.y - s / 2, s, s);
        }

        // supplier node
        const nodePulse = 0.22 + 0.1 * Math.sin(t * 0.002 + i);
        ctx.fillStyle = `rgba(17,17,17,${nodePulse})`;
        ctx.fillRect(nx - 3, ny - 3, 6, 6);
        ctx.strokeStyle = "rgba(17,17,17,0.08)";
        ctx.strokeRect(nx - 7, ny - 7, 14, 14);
      });

      // hub
      const hubPulse = 0.55 + 0.25 * Math.sin(t * 0.0025);
      ctx.fillStyle = `rgba(17,17,17,${hubPulse})`;
      ctx.fillRect(hub.x - 6, hub.y - 6, 12, 12);

      for (let ring = 0; ring < 2; ring++) {
        const phase = (((t * 0.0005 - ring * 0.5) % 1) + 1) % 1;
        const r = 12 + phase * 34;
        ctx.strokeStyle = `rgba(16,185,129,${0.35 * (1 - phase)})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(hub.x - r, hub.y - r, r * 2, r * 2);
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
    />
  );
}

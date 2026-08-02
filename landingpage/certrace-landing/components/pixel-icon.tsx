"use client";

import { useEffect, useRef } from "react";

export type PixelType =
  | "scatter"
  | "globe"
  | "funnel"
  | "leaf"
  | "steps"
  | "signal"
  | "people"
  | "shield"
  | "bars"
  | "doc";

const PEOPLE_FRAMES = [
  [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
  ],
  [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0],
  ],
];

const LEAF = [
  [0, 0, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 0, 1, 1, 0],
  [0, 1, 1, 0, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
];

const SHIELD = [
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1, 0, 1, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
];

const DOC = [
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 0, 0, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
];

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  size: number,
  t: number,
  matrix: number[][],
  bobAmp = 0.4,
) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const cell = Math.floor(size / cols);
  const offsetX = Math.floor((size - cols * cell) / 2);
  const offsetY = Math.floor((size - rows * cell) / 2);
  const bob = Math.sin(t * 0.012) * cell * bobAmp;

  matrix.forEach((row, y) => {
    row.forEach((on, x) => {
      if (!on) return;
      const alpha = 0.5 + 0.5 * Math.sin(t * 0.001 + y * 0.3);
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(
        offsetX + x * cell,
        offsetY + y * cell + bob,
        cell - 1,
        cell - 1,
      );
    });
  });
}

function drawGlobe(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const cell = size / 12;
  const pulse = 0.6 + 0.4 * Math.sin(t * 0.003);

  ctx.fillStyle = `rgba(0,0,0,${pulse})`;
  const core = cell * 1.4;
  ctx.fillRect(cx - core / 2, cy - core / 2, core, core);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + t * 0.0015;
    const nx = cx + Math.cos(angle) * radius;
    const ny = cy + Math.sin(angle) * radius;
    const alpha = 0.3 + ((Math.sin(angle * 2 + t * 0.002) + 1) / 2) * 0.5;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(
      Math.round(nx / cell) * cell - cell / 2,
      Math.round(ny / cell) * cell - cell / 2,
      cell,
      cell,
    );
    for (let j = 1; j < 5; j++) {
      const sx = cx + (j / 5) * (nx - cx);
      const sy = cy + (j / 5) * (ny - cy);
      const lineAlpha = (0.06 + (j / 5) * 0.1) * pulse;
      ctx.fillStyle = `rgba(0,0,0,${lineAlpha})`;
      ctx.fillRect(
        Math.round(sx / cell) * cell,
        Math.round(sy / cell) * cell,
        cell * 0.7,
        cell * 0.7,
      );
    }
  }
}

function drawFunnel(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const cell = Math.floor(size / 12);
  const diamond = [
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  const rows = diamond.length;
  const offsetX = size / 2 - (diamond[0].length * cell) / 2;
  const offsetY = size / 2 - (rows * cell) / 2;
  const progress = (t % 2400) / 2400;

  diamond.forEach((row, y) => {
    row.forEach((on, x) => {
      if (!on) return;
      const mid = Math.floor(rows / 2);
      let intensity: number;
      if (y < mid) {
        intensity = Math.max(0, 1 - Math.min(1, progress * rows * 1.4 - y));
      } else if (y === mid) {
        intensity = 0.5 + 0.4 * Math.sin(t * 0.008);
      } else {
        intensity = Math.max(0, Math.min(1, progress * rows * 1.4 - (y - mid)));
      }
      const alpha = Math.max(0.12, 0.85 * intensity);
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(offsetX + x * cell, offsetY + y * cell, cell - 1, cell - 1);
    });
  });
}

function drawScatter(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const cell = Math.floor(size / 6);
  const offsetX = Math.floor((size - 5 * (cell + 2)) / 2);
  const offsetY = Math.floor((size - 4 * (cell + 2)) / 2);
  const phase = t * 0.0008;

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const alpha =
        0.1 +
        ((Math.sin(phase + ((5 * row + col) / 20) * Math.PI * 2) + 1) / 2) *
          0.65;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(
        offsetX + col * (cell + 2),
        offsetY + row * (cell + 2),
        cell,
        cell,
      );
    }
  }
}

function drawBars(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const barWidth = Math.floor(size / 12) * 2;
  const barGap = Math.floor(size / 12);
  const offsetX = Math.floor((size - (3 * barWidth + 2 * barGap)) / 2);
  const maxHeight = size * 0.7;
  const pulse = 0.12 * Math.sin(t * 0.0015);
  const heights = [0.45, 0.75, 0.55];

  heights.forEach((h, i) => {
    const height =
      Math.max(0.1, h + pulse * (i % 2 === 0 ? 1 : -1)) * maxHeight;
    const x = offsetX + i * (barWidth + barGap);
    const y = size - height - barGap;
    const steps = Math.floor(height / barGap);
    for (let step = 0; step < steps; step++) {
      const alpha = 0.15 + 0.7 * (1 - step / steps);
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(x, y + step * barGap, barWidth, barGap - 1);
    }
  });
}

function drawSteps(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const cell = Math.floor(size / 10);
  const cols = 4;
  const stepWidth = cell * 2;
  const offsetX = Math.floor((size - cols * (stepWidth + 2)) / 2);
  const progress = (t % 2800) / 2800;

  for (let i = 0; i < cols; i++) {
    const height = cell * (2 + i * 2);
    const lit = progress * (cols + 1) > i + 0.5;
    const baseY = size - cell;
    const blocks = Math.floor(height / cell);
    for (let b = 0; b < blocks; b++) {
      const alpha = lit
        ? 0.25 + 0.6 * (1 - b / blocks)
        : 0.1 + 0.08 * (1 - b / blocks);
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(
        offsetX + i * (stepWidth + 2),
        baseY - (b + 1) * cell,
        stepWidth,
        cell - 1,
      );
    }
  }
}

function drawSignal(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const cx = size / 2;
  const cy = size / 2;
  const cell = Math.floor(size / 12);
  const pulse = 0.6 + 0.4 * Math.sin(t * 0.004);

  ctx.fillStyle = `rgba(0,0,0,${pulse})`;
  ctx.fillRect(cx - cell, cy - cell, cell * 2 - 1, cell * 2 - 1);

  for (let ring = 1; ring <= 3; ring++) {
    const ringPhase = ((t * 0.0012 - ring * 0.33) % 1 + 1) % 1;
    const alpha = Math.max(0, 0.5 * (1 - ringPhase)) * (ring === 1 ? 1 : 0.8);
    const r = cell * (1 + ring * 1.4) * (0.7 + ringPhase * 0.5);
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = Math.max(1, cell * 0.4);
    ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
  }
}

export function PixelIcon({
  type,
  size = 40,
}: {
  type: PixelType;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (t: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;

      switch (type) {
        case "scatter":
          drawScatter(ctx, size, t);
          break;
        case "globe":
          drawGlobe(ctx, size, t);
          break;
        case "funnel":
          drawFunnel(ctx, size, t);
          break;
        case "leaf":
          drawMatrix(ctx, size, t, LEAF, 0.3);
          break;
        case "steps":
          drawSteps(ctx, size, t);
          break;
        case "signal":
          drawSignal(ctx, size, t);
          break;
        case "people":
          drawMatrix(
            ctx,
            size,
            t,
            PEOPLE_FRAMES[Math.floor(t / 400) % PEOPLE_FRAMES.length],
          );
          break;
        case "shield":
          drawMatrix(ctx, size, t, SHIELD, 0.2);
          break;
        case "bars":
          drawBars(ctx, size, t);
          break;
        case "doc":
          drawMatrix(ctx, size, t, DOC, 0.2);
          break;
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [type, size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}

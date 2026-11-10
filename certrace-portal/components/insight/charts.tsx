"use client";

/* ════════════════════════════════════════════════════════════
   INSIGHT CHARTS — drawn by hand, at their own size

   No chart library: three shapes are all the analysis tabs need, and each is
   short enough to read.

     AreaChart  one or two lines over time, a soft fill under the first, a
                dark bubble that follows the pointer — the "analytics" chart
     Donut      a ring with its centre labelled, parts listed beside it
  
   THE SVG IS MEASURED, NOT SCALED. The viewBox is the container's real width
   in CSS pixels, so a 10px axis label is ten pixels on a phone and on a wide
   monitor — a stretched viewBox would shrink every label with the drawing.

   A LINE WITH NO VALUE IS NOT DRAWN. `null` breaks the line: a gap is a gap,
   never a zero, because zero is a claim about a plant.

   COLOUR IS NEVER ALONE. Every series is named in the legend and in the
   bubble; the default line is dashed as well as grey.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { cn, toneChip } from "@/components/ui";

/* ── Width ───────────────────────────────────────────────────── */
export function useWidth(): [
  React.RefObject<HTMLDivElement | null>,
  number | null,
] {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState<number | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/* ── A smooth line that never overshoots ────────────────────────
   Monotone cubic (Fritsch–Carlson). A plain Catmull-Rom curve dips under zero
   between two small points next to a large one, which on an emissions chart
   reads as a month of negative emissions. This one stays between its points. */
function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0].x},${pts[0].y}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx.push(pts[i + 1].x - pts[i].x);
    m.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x || 1));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i += 1)
    t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i += 1) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i];
    d += ` C${pts[i].x + h / 3},${pts[i].y + (t[i] * h) / 3} ${pts[i + 1].x - h / 3},${pts[i + 1].y - (t[i + 1] * h) / 3} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

/** Axis top and step that land on round numbers: 0, 250, 500, 750, 1000. */
export function niceScale(
  max: number,
  ticks = 4,
): { top: number; step: number } {
  if (!(max > 0) || !Number.isFinite(max)) return { top: 1, step: 1 / ticks };
  const raw = max / ticks;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  const step =
    (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10) *
    pow;
  return { top: step * Math.ceil(max / step), step };
}

/* ── Area chart ──────────────────────────────────────────────── */
export type AreaSeries = {
  key: string;
  label: string;
  color: string;
  values: (number | null)[];
  /** the line is dashed — the EU default, a target, anything that is a reference rather than a reading. A string is the dash pattern. */
  dashed?: boolean | string;
  /** the first series carries the fill by default */
  fill?: boolean;
};

export function AreaChart({
  labels,
  series,
  height = 250,
  format,
  unit,
  projectedFrom,
  ariaLabel,
  emptyText,
}: {
  labels: string[];
  series: AreaSeries[];
  height?: number;
  /** one value, as the bubble and the axis print it */
  format: (n: number, compact?: boolean) => string;
  unit?: string;
  /** index from which the points are carried forward, not measured */
  projectedFrom?: number;
  ariaLabel: string;
  emptyText: string;
}) {
  const [ref, width] = useWidth();
  const [hover, setHover] = React.useState<number | null>(null);
  const uid = React.useId().replace(/:/g, "");

  const all = series
    .flatMap((s) => s.values)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const has = all.length > 0 && labels.length > 0;
  const { top, step } = niceScale(has ? Math.max(...all) : 0, 4);
  const PAD = { l: 52, r: 14, t: 14, b: 28 };
  const w = Math.max(width ?? 320, 240);
  const h = height;
  const innerW = w - PAD.l - PAD.r;
  const innerH = h - PAD.t - PAD.b;
  const n = labels.length;
  const x = (i: number) =>
    PAD.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PAD.t + innerH - (v / top) * innerH;
  const ticks = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  );

  /* About six labels, however many months there are. */
  const every = Math.max(
    1,
    Math.ceil(n / Math.max(2, Math.floor(innerW / 64))),
  );

  const segs = (s: AreaSeries) => {
    const runs: { i: number; x: number; y: number }[][] = [];
    let cur: { i: number; x: number; y: number }[] = [];
    s.values.forEach((v, i) => {
      if (v == null || !Number.isFinite(v)) {
        if (cur.length) runs.push(cur);
        cur = [];
      } else cur.push({ i, x: x(i), y: y(v) });
    });
    if (cur.length) runs.push(cur);
    return runs;
  };

  const projX =
    projectedFrom != null && projectedFrom > 0 && projectedFrom < n
      ? x(projectedFrom - 0.5)
      : null;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const rel = ((e.clientX - r.left) / r.width) * innerW;
    setHover(
      n <= 1
        ? 0
        : Math.min(n - 1, Math.max(0, Math.round((rel / innerW) * (n - 1)))),
    );
  };

  const bubbleLeft =
    hover != null ? Math.min(Math.max(x(hover) - 70, 4), w - 150) : 0;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {!has ? (
        <div className="grid h-full place-items-center rounded-xl border border-dashed border-black/10 text-[12.5px] text-black/40">
          {emptyText}
        </div>
      ) : (
        <>
          <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            role="img"
            aria-label={ariaLabel}
            className="block overflow-visible"
          >
            <defs>
              {series.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`${uid}-${s.key}`}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.13" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              ))}
              {projX != null && (
                <>
                  <clipPath id={`${uid}-m`}>
                    <rect x={0} y={0} width={projX} height={h} />
                  </clipPath>
                  <clipPath id={`${uid}-p`}>
                    <rect x={projX} y={0} width={w - projX} height={h} />
                  </clipPath>
                </>
              )}
            </defs>

            {ticks.map((tv) => (
              <g key={tv}>
                <line
                  x1={PAD.l}
                  x2={w - PAD.r}
                  y1={y(tv)}
                  y2={y(tv)}
                  stroke="rgba(17,17,17,0.07)"
                  strokeDasharray={tv === 0 ? undefined : "3 4"}
                />
                <text
                  x={PAD.l - 10}
                  y={y(tv) + 3.5}
                  textAnchor="end"
                  fontSize={10.5}
                  fill="rgba(17,17,17,0.4)"
                  className="tabular-nums"
                >
                  {format(tv, true)}
                </text>
              </g>
            ))}

            {projX != null && (
              <rect
                x={projX}
                y={PAD.t}
                width={w - PAD.r - projX}
                height={innerH}
                fill="rgba(17,17,17,0.04)"
              />
            )}

            {labels.map((l, i) =>
              i % every === 0 || i === n - 1 ? (
                <text
                  key={`${l}-${i}`}
                  x={x(i)}
                  y={h - 8}
                  textAnchor={
                    i === 0 ? "start" : i === n - 1 ? "end" : "middle"
                  }
                  fontSize={10.5}
                  fill="rgba(17,17,17,0.4)"
                >
                  {l}
                </text>
              ) : null,
            )}

            {series.map((s, si) =>
              segs(s).map((run, ri) => {
                const line = monotonePath(run);
                const base = y(0);
                const area = `${line} L${run[run.length - 1].x},${base} L${run[0].x},${base} Z`;
                const body = (clip?: string, dashed?: boolean, opacity = 1) => (
                  <g
                    clipPath={clip ? `url(#${clip})` : undefined}
                    opacity={opacity}
                  >
                    {(si === 0 || s.fill) && !s.dashed && (
                      <path d={area} fill={`url(#${uid}-${s.key})`} />
                    )}
                    <path
                      d={line}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={s.dashed ? 1.6 : 2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={
                        typeof s.dashed === "string"
                          ? s.dashed
                          : dashed || s.dashed
                            ? "5 4"
                            : undefined
                      }
                    />
                  </g>
                );
                return (
                  <g key={`${s.key}-${ri}`}>
                    {projX == null ? (
                      body()
                    ) : (
                      <>
                        {body(`${uid}-m`)}
                        {body(`${uid}-p`, true, 0.6)}
                      </>
                    )}
                  </g>
                );
              }),
            )}

            {hover != null && (
              <g pointerEvents="none">
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={PAD.t}
                  y2={PAD.t + innerH}
                  stroke="rgba(17,17,17,0.2)"
                />
                {series.map((s) => {
                  const v = s.values[hover];
                  return v == null ? null : (
                    <circle
                      key={s.key}
                      cx={x(hover)}
                      cy={y(v)}
                      r={4}
                      fill="#fff"
                      stroke={s.color}
                      strokeWidth={2}
                    />
                  );
                })}
              </g>
            )}

            <rect
              x={PAD.l}
              y={PAD.t}
              width={innerW}
              height={innerH}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>

          {hover != null && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-[140px] rounded-xl bg-[#111] px-3.5 py-3 text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)]"
              style={{ left: bubbleLeft }}
            >
              <div className="text-[12px] text-white/70">{labels[hover]}</div>
              {series.map((s) => (
                <div
                  key={s.key}
                  className="mt-1 flex items-center gap-2 text-[12.5px] tabular-nums"
                >
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="text-white/75">{s.label}</span>
                  <span className="ml-auto pl-3">
                    {s.values[hover] == null
                      ? "—"
                      : `${format(s.values[hover] as number)}${unit ? ` ${unit}` : ""}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Donut ───────────────────────────────────────────────────── */
export type DonutPart = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export function Donut({
  parts,
  centre,
  sub,
  size = 188,
  thickness = 26,
  ariaLabel,
}: {
  parts: DonutPart[];
  centre: string;
  sub?: string;
  size?: number;
  thickness?: number;
  ariaLabel: string;
}) {
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = parts.filter((p) => p.value > 0).length > 1 ? 3 : 0;
  let acc = 0;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(17,17,17,0.06)"
          strokeWidth={thickness}
        />
        {total > 0 &&
          parts.map((p) => {
            if (!(p.value > 0)) return null;
            const len = (p.value / total) * c;
            const dash = Math.max(0, len - gap);
            const off = -acc;
            acc += len;
            return (
              <circle
                key={p.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={p.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={off}
              />
            );
          })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-[family-name:var(--font-plex)] text-[26px] font-light leading-none tracking-tight text-[#111] tabular-nums">
            {centre}
          </div>
          {sub && (
            <div className="mt-1.5 max-w-[110px] text-[11px] leading-tight text-black/45">
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** A change as an arrow and a number, in the portal's chip shape. `good` says whether the direction is the one the reader wants. */
export function DeltaChip({
  value,
  good,
  suffix = "%",
  className,
}: {
  value: number | null;
  good: boolean | null;
  suffix?: string;
  className?: string;
}) {
  if (value == null || !Number.isFinite(value)) return null;
  const down = value < 0;
  const tone =
    good == null ? toneChip.muted : good ? toneChip.ok : toneChip.err;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] tabular-nums",
        tone,
        className,
      )}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {down ? (
          <path d="M7 7l10 10M17 9v8H9" />
        ) : (
          <path d="M7 17 17 7M9 7h8v8" />
        )}
      </svg>
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

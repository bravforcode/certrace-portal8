"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET F — SEE TREND OVER TIME

   The one widget where a drawn-in animation genuinely aids comprehension
   (it shows DIRECTION of change) rather than being decorative — so the line
   draws left-to-right over ~600ms, and nothing else on this card moves.

   The country-default reference line is the point of the chart, not a
   decoration: it anchors the trend against "what we would be charged if we
   did nothing", which is the same comparison Widget E turns into money.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Card, cn } from "@/components/ui";
import type { SeeTrendPoint } from "@/lib/cbam/see-trend";
import { useT } from "@/lib/i18n";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

const W = 560;
const H = 180;
const PAD = { top: 16, right: 12, bottom: 26, left: 44 };

export function SeeTrend({
  points,
  defaultSee,
}: {
  points: SeeTrendPoint[];
  defaultSee: number | null;
}) {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const pathRef = React.useRef<SVGPathElement | null>(null);
  const [drawn, setDrawn] = React.useState(false);

  React.useEffect(() => {
    if (reduced || points.length < 2) {
      setDrawn(true);
      return;
    }
    setDrawn(false);
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, [points.length, reduced]);

  if (points.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">
          {t("SEE over time")}
        </h2>
        <p className="mt-3 text-[13px] text-black/40">
          {t(
            "No submitted months with production yet — the trend appears once a month is in.",
          )}
        </p>
      </Card>
    );
  }

  const maxY =
    Math.max(defaultSee ?? 0, ...points.map((p) => p.seeTotal)) * 1.15 || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left +
    (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / maxY) * innerH;

  const linePath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.seeTotal).toFixed(1)}`,
    )
    .join(" ");
  const defaultY = defaultSee != null ? y(defaultSee) : null;

  const latest = points[points.length - 1];
  const first = points[0];
  const direction = points.length > 1 ? latest.seeTotal - first.seeTotal : 0;

  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">
          {t("SEE over time")}
        </h2>
        {points.length > 1 && (
          <span
            className={cn(
              "text-[12px]",
              direction < 0
                ? "text-[#047857]"
                : direction > 0
                  ? "text-[#b45309]"
                  : "text-black/40",
            )}
          >
            {direction < 0
              ? "↓ improving"
              : direction > 0
                ? "↑ rising"
                : "level"}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={t("Specific embedded emissions per month")}
      >
        {/* y-axis ticks */}
        {[0, maxY / 2, maxY].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(v) + 3}
              textAnchor="end"
              fontSize={9}
              fill="rgba(0,0,0,0.35)"
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* the country-default reference line — thinner, dashed, muted */}
        {defaultY != null && (
          <>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={defaultY}
              y2={defaultY}
              stroke="#b45309"
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.7}
            />
            <text
              x={W - PAD.right}
              y={defaultY - 5}
              textAnchor="end"
              fontSize={9}
              fill="#b45309"
            >
              EU default {defaultSee!.toFixed(2)}
            </text>
          </>
        )}

        {/* the trend itself */}
        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke="#111"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            reduced || points.length < 2
              ? undefined
              : {
                  strokeDasharray: 2000,
                  strokeDashoffset: drawn ? 0 : 2000,
                  transition: "stroke-dashoffset 600ms ease-out",
                }
          }
        />
        {points.map((p, i) => (
          <circle
            key={p.month}
            cx={x(i)}
            cy={y(p.seeTotal)}
            r={2.5}
            fill="#111"
          >
            <title>{`${p.monthLabel} — ${p.seeTotal.toFixed(4)} tCO₂e/t`}</title>
          </circle>
        ))}

        {/* x labels — first and last only, so twelve months never collide */}
        <text x={PAD.left} y={H - 8} fontSize={9} fill="rgba(0,0,0,0.35)">
          {first.monthLabel}
        </text>
        {points.length > 1 && (
          <text
            x={W - PAD.right}
            y={H - 8}
            textAnchor="end"
            fontSize={9}
            fill="rgba(0,0,0,0.35)"
          >
            {latest.monthLabel}
          </text>
        )}
      </svg>

      <p className="mt-2 text-[11.5px] text-black/40">
        {t(
          "Direct + indirect, per tonne. Months with no production are omitted rather than plotted as zero.",
        )}
      </p>
    </Card>
  );
}

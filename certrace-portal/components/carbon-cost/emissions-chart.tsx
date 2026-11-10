"use client";

/* ════════════════════════════════════════════════════════════
   EMBEDDED EMISSIONS, MONTH BY MONTH — the four lines

   WHAT THE FOUR ARE, and why these four. A CBAM figure is not one number, it
   is a sum of three with very different provenance, and the whole negotiation
   an exporter is preparing for turns on which of the three is carrying the
   weight:

     Direct      what this installation burned and processed. Meter readings.
     Indirect    the electricity it bought. A grid factor, or a contract.
     Precursor   what was already embedded in the inputs, as declared by the
                 suppliers who made them — the "verified data" half.
     Total       the three added up. This is the number on the report.

   Drawn together, the shape of the year answers "where would a tonne of
   carbon most cheaply come out" without anybody having to read a table. The
   EU default rides on top as a dashed rule, because every one of these lines
   is only interesting relative to it.

   ── A LINE WITH NOTHING BEHIND IT IS NOT DRAWN ─────────────────
   The precursor series is omitted when no supplier has returned a verified
   figure, and the default rule is omitted when the good's category has none
   on file. In both cases the legend prints "—" against the name instead. This
   is the point of the whole component: a precursor line resting on the axis
   would say this good is made of nothing bought in, and a reader who believes
   that stops chasing their chain. Absent and zero are different claims, and
   only one of them is true.

   ── THE PRECURSOR LINE IS FLAT ON PURPOSE ──────────────────────
   A precursor contribution is declared once for the reporting period, not
   month by month — see lib/cbam/carbon-scope.ts. The footnote says so, where
   a reader who notices a line that never moves will be looking.

   ── ONE WORKSPACE AT A TIME ────────────────────────────────────
   Per-tonne intensities for different goods are not comparable — a tonne of
   ferro-chromium and a tonne of pig iron are different things — so several
   products overlaid on one axis would be a coincidence, not a trend. When the
   scope holds more than one, the card says which one is drawn.

   ── PROJECTED MONTHS DO NOT LOOK LIKE MEASURED ONES ────────────
   With the projection switched on, the months of the reporting year with no
   submitted figure are drawn at the year-to-date rate. That is a made-up
   number sharing an axis with meter readings, which is the single most
   dangerous thing a chart on a compliance screen can do — so it is marked
   FOUR ways at once, and none of them is redundant:

     · a shaded band behind every projected month, so the region is visible
       before any line is traced
     · the line segments themselves dashed, and at reduced opacity, so a
       segment read on its own still reads as provisional
     · hollow markers instead of filled ones on the total
     · the word "Projected" printed on the band, and a fifth legend entry
       carrying the same dashed swatch

   Colour ALONE would not do it: about one man in twelve cannot rely on hue,
   and the whole point of the distinction is that it must not be missable.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Card, cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { EmissionsChartData } from "@/lib/cbam/carbon-scope";
import { monthNameShown, type VerificationWorkspace } from "@/lib/workspace";

/* ── The chart draws at ITS OWN SIZE, not at a fixed one scaled to fit ──
   A fixed viewBox stretched to the container is the usual way to make an SVG
   responsive, and it is wrong for a chart with words on it: every label scales
   with the drawing, so a 9px axis figure that is correct on a 720px card is
   4px on a 340px phone — present, unreadable, and worse than absent because
   the axis looks labelled.

   So the viewBox is MEASURED and the user units are CSS pixels. `fontSize={9}`
   then means nine actual pixels at every width, the padding stays the padding,
   and only the plot area gets narrower — which is the thing that should get
   narrower. The height drops a little on a phone so the card does not eat the
   whole screen. */
const MIN_W = 300;
const PAD = { top: 18, right: 16, bottom: 30, left: 52 };

function useMeasuredWidth(): [
  React.RefObject<HTMLDivElement | null>,
  number | null,
] {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

/* Design-system inks. Total is the page's own black because it is the figure
   that goes on the report; the three components take the brand blue and the
   two status hues already used for "good" and "watch this" elsewhere, so the
   palette on this chart is the palette on every other screen. */
const SERIES = {
  total: { label: "Total", color: "#111", width: 2 },
  direct: { label: "Direct", color: "#3C7ACB", width: 1.5 },
  indirect: { label: "Indirect", color: "#047857", width: 1.5 },
  precursor: { label: "Precursor", color: "#b45309", width: 1.5 },
} as const;

type Key = keyof typeof SERIES;

/* The projected treatment. A NEUTRAL band rather than a tinted one: three of
   the four series already own a hue, and a coloured region behind them turns
   into mud on whichever one it happens to sit closest to. Grey says "this
   part of the chart is a different KIND of thing" without competing with
   anything drawn on top of it. */
const PROJECTED_BAND = "rgba(17,17,17,0.045)";
const PROJECTED_DASH = "5 3";
const PROJECTED_OPACITY = 0.45;

/* "—" for anything that is not a number, NaN included. A compliance screen
   printing "NaN" reads as a broken product; printing a dash reads as "nothing
   here yet", which is what it is. lib/cbam/carbon-scope.ts already collapses
   the two, and this is the second line of the same defence. */
const fmt = (v: number | null | undefined) =>
  v == null || !Number.isFinite(v) ? "—" : v.toFixed(3);

export function EmissionsChart({
  data,
  workspace,
  unit = "tCO₂e/t",
}: {
  data: EmissionsChartData;
  workspace: VerificationWorkspace;
  unit?: string;
}) {
  const t = useT();
  const { points, precursorPerTonne, defaultSee, projectedCount } = data;

  /* The legend's own figures are the LATEST MEASURED month's, not an average
     and never a projected one — the question a reader brings to a trend is
     "where is it now", and a projected month is not now. Without the
     `!projected` test, switching the projection on would silently rewrite the
     four readout figures to the assumption they are built from, which is the
     assumption being read back as evidence.

     The latest month that actually produced a total: a month the engine
     refused sits in `points` (it is a real month with real production) but has
     no figures, and reading the legend off it would blank four numbers that
     the month before had. */
  const latest =
    [...points].reverse().find((p) => p.total != null && !p.projected) ?? null;

  /* Narrowed once, here, so the plot below is written against numbers rather
     than against nullable numbers it has to re-check at every use. */
  const plottable = points.flatMap((p) =>
    p.direct != null && p.indirect != null && p.total != null
      ? [
          {
            month: p.month,
            direct: p.direct,
            indirect: p.indirect,
            total: p.total,
            projected: p.projected,
          },
        ]
      : [],
  );
  const measuredCount = plottable.filter((p) => !p.projected).length;
  const skipped = points.filter((p) => !p.projected).length - measuredCount;
  const values: Record<Key, number | null> = {
    total: latest?.total ?? null,
    direct: latest?.direct ?? null,
    indirect: latest?.indirect ?? null,
    precursor: precursorPerTonne,
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">
          {t("Embedded emissions, month by month")}
        </h2>
        <p className="font-mono text-[11px] text-black/35">
          {t(workspace.productName)} · {workspace.installationName} ·{" "}
          {workspace.year}
        </p>
      </div>
      <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-black/45">
        {t(
          "Per tonne: your site, its electricity and the materials you bought.",
        )}
        {data.multiple &&
          " " +
            t(
              "Several products selected. Showing the first — per-tonne figures only compare within one product.",
            )}
      </p>

      <Legend
        values={values}
        defaultSee={defaultSee}
        unit={unit}
        projected={projectedCount > 0}
      />

      {/* Only months the engine could actually work out are plottable. One
          whose fuel row it refused stays a real submitted month everywhere
          else in the product — it is not deleted here, it is just not a point,
          because a point needs a value. The count below says how many were
          left out, so a reader whose chart is shorter than their year is told
          why rather than left to wonder. */}
      {plottable.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-black/10 px-4 py-8 text-center text-[13px] leading-relaxed text-black/40">
          {points.length === 0
            ? t("No submitted month yet.")
            : t(
                "The submitted months could not be worked out. Check Monthly data for missing readings.",
              )}
        </p>
      ) : plottable.length === 1 ? (
        <p className="mt-5 rounded-xl border border-dashed border-black/10 px-4 py-8 text-center text-[13px] leading-relaxed text-black/40">
          {t("One month in. A second gives the lines a direction.")}
        </p>
      ) : (
        <>
          <Plot
            points={plottable}
            defaultSee={defaultSee}
            precursorPerTonne={precursorPerTonne}
            unit={unit}
          />
          {skipped > 0 && (
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#b45309]">
              {skipped === 1
                ? t("1 month is not plotted — a reading is missing.")
                : t("{count} months are not plotted — readings are missing.", {
                    count: skipped,
                  })}
            </p>
          )}
        </>
      )}
    </Card>
  );
}

/* THE LEGEND IS ALSO THE READOUT. Four names with four current values, which
   is what makes "the box just says —" a complete answer rather than a gap: a
   series that is not drawn still has a row here, still says what it would
   measure, and says plainly that it has nothing yet. */
function Legend({
  values,
  defaultSee,
  unit,
  projected,
}: {
  values: Record<Key, number | null>;
  defaultSee: number | null;
  unit: string;
  projected: boolean;
}) {
  const t = useT();
  const keys: Key[] = ["total", "direct", "indirect", "precursor"];
  const SERIES_LABEL: Record<Key, string> = {
    total: t("Total"),
    direct: t("Direct"),
    indirect: t("Indirect"),
    precursor: t("Precursor"),
  };

  return (
    /* Five columns normally, six once the projected key joins them — a fixed
       five would drop that sixth entry onto a row of its own, where a legend
       key reads as a stray statistic rather than as part of the key above it. */
    <dl
      className={cn(
        "mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3",
        projected ? "lg:grid-cols-6" : "lg:grid-cols-5",
      )}
    >
      {keys.map((k) => (
        <div key={k} className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-black/40">
            <span
              aria-hidden
              className={cn(
                "inline-block h-[2px] w-3.5 flex-none rounded-full",
                values[k] == null && "opacity-30",
              )}
              style={{ background: SERIES[k].color }}
            />
            {t(SERIES_LABEL[k])}
          </dt>
          <dd
            className={cn(
              "mt-1 font-mono text-[15px] tabular-nums",
              values[k] == null ? "text-black/25" : "text-[#111]",
            )}
          >
            {fmt(values[k])}
          </dd>
          <dd className="mt-0.5 text-[10.5px] text-black/35">
            {values[k] == null
              ? k === "precursor"
                ? t("No verified data yet")
                : t("Not entered yet")
              : unit}
          </dd>
        </div>
      ))}
      <div className="min-w-0">
        <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-black/40">
          <span
            aria-hidden
            className="inline-block h-0 w-3.5 flex-none border-t border-dashed border-black/45"
          />
          {t("EU default")}
        </dt>
        <dd
          className={cn(
            "mt-1 font-mono text-[15px] tabular-nums",
            defaultSee == null ? "text-black/25" : "text-[#111]",
          )}
        >
          {fmt(defaultSee)}
        </dd>
        <dd className="mt-0.5 text-[10.5px] text-black/35">
          {defaultSee == null
            ? t("None on file for this good")
            : t("what a buyer assumes")}
        </dd>
      </div>
      {/* The fifth entry only exists while there is something projected on the
          chart. A permanent "Projected —" row would be a legend key for a
          treatment that is not on screen. */}
      {projected && (
        <div className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-black/40">
            <span
              aria-hidden
              className="inline-block h-3 w-3.5 flex-none rounded-sm"
              style={{ background: PROJECTED_BAND }}
            />
            {t("Projected")}
          </dt>
          <dd className="mt-1 font-mono text-[15px] tabular-nums text-black/45">
            {t("assumed")}
          </dd>
          <dd className="mt-0.5 text-[10.5px] text-black/35">
            {t("at the year-to-date rate")}
          </dd>
        </div>
      )}
    </dl>
  );
}

type PlottablePoint = {
  month: string;
  direct: number;
  indirect: number;
  total: number;
  projected: boolean;
};

function Plot({
  points,
  defaultSee,
  precursorPerTonne,
  unit,
}: {
  points: PlottablePoint[];
  defaultSee: number | null;
  precursorPerTonne: number | null;
  unit: string;
}) {
  const t = useT();
  const [wrapRef, measured] = useMeasuredWidth();

  const W = Math.max(MIN_W, Math.round(measured ?? 720));
  const H = W < 480 ? 200 : 240;

  const maxY =
    Math.max(
      defaultSee ?? 0,
      precursorPerTonne ?? 0,
      ...points.map((p) => p.total),
    ) * 1.15 || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left +
    (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / maxY) * innerH;

  /* ── ONE SEGMENT AT A TIME, not one path per series ─────────────
     A single <path> can only carry one stroke, and the line has to change
     appearance partway along it — at whichever month the readings stop. Runs
     could be pre-grouped instead, but a projected month is not always at the
     END of the year: a workspace with January and March submitted gets a
     projected February BETWEEN two measured months, and grouping would have
     to handle an arbitrary number of runs anyway.

     A JOINING SEGMENT COUNTS AS PROJECTED. The line from the last measured
     month to the first projected one is already leaving the evidence behind,
     so it takes the provisional treatment rather than being drawn solid up to
     a point that is not. */
  const segments = (get: (p: PlottablePoint) => number) =>
    points.slice(0, -1).map((p, i) => ({
      d: `M ${x(i).toFixed(1)} ${y(get(p)).toFixed(1)} L ${x(i + 1).toFixed(1)} ${y(get(points[i + 1])).toFixed(1)}`,
      projected: p.projected || points[i + 1].projected,
      key: `${p.month}-${points[i + 1].month}`,
    }));

  const drawn: { key: Key; segs: ReturnType<typeof segments> }[] = [
    { key: "total", segs: segments((p) => p.total) },
    { key: "direct", segs: segments((p) => p.direct) },
    { key: "indirect", segs: segments((p) => p.indirect) },
    ...(precursorPerTonne != null
      ? [{ key: "precursor" as Key, segs: segments(() => precursorPerTonne) }]
      : []),
  ];

  const defaultY = defaultSee != null ? y(defaultSee) : null;

  /* The shaded region behind the projected months. Half a step out on each
     side so the band meets its neighbours rather than stopping at the marker,
     and clamped to the plot area so a band at either end does not bleed into
     the axis labels. */
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const bands = points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.projected)
    .map(({ i }) => {
      const from = Math.max(PAD.left, x(i) - step / 2);
      const to = Math.min(W - PAD.right, x(i) + step / 2);
      return { x: from, width: Math.max(0, to - from), key: points[i].month };
    });
  const firstProjected = points.findIndex((p) => p.projected);

  return (
    <div ref={wrapRef}>
      {/* role="img" with a real label: the lines carry the meaning and a screen
          reader gets nothing from the paths. The legend above carries the
          numbers themselves, as text, which is the actual accessible route to
          this data — the chart is the fast path, not the only one. */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="mt-4 w-full"
        role="img"
        aria-label={t(
          "Embedded emissions per tonne, by submitted month, in {unit}.",
          { unit },
        )}
      >
        {/* Behind the gridlines, so a projected month is a region the chart
            sits ON rather than a rectangle drawn over it. */}
        {bands.map((b) => (
          <rect
            key={b.key}
            x={b.x}
            y={PAD.top}
            width={b.width}
            height={innerH}
            fill={PROJECTED_BAND}
          />
        ))}

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
              x={PAD.left - 8}
              y={y(v) + 3}
              textAnchor="end"
              fontSize={9}
              fill="rgba(0,0,0,0.35)"
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {defaultY != null && (
          <>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={defaultY}
              y2={defaultY}
              stroke="rgba(0,0,0,0.45)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text
              x={W - PAD.right}
              y={defaultY - 5}
              textAnchor="end"
              fontSize={9}
              fill="rgba(0,0,0,0.45)"
            >
              {t("EU default")} {defaultSee!.toFixed(2)}
            </text>
          </>
        )}

        {drawn.map(({ key, segs }) =>
          segs.map((s) => (
            <path
              key={`${key}-${s.key}`}
              d={s.d}
              fill="none"
              stroke={SERIES[key].color}
              strokeWidth={SERIES[key].width}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...(s.projected
                ? {
                    strokeDasharray: PROJECTED_DASH,
                    opacity: PROJECTED_OPACITY,
                  }
                : {})}
            />
          )),
        )}

        {/* Markers on the total only. A dot on every series at every month is
            four times the ink for the same four numbers the legend already
            prints, and it is the total a reader traces. Projected months get a
            HOLLOW marker: same position, visibly not the same kind of point. */}
        {points.map((p, i) => (
          <circle
            key={p.month}
            cx={x(i)}
            cy={y(p.total)}
            r={2.5}
            fill={p.projected ? "#fff" : "#111"}
            stroke={p.projected ? "#111" : "none"}
            strokeWidth={p.projected ? 1 : 0}
            opacity={p.projected ? 0.55 : 1}
          >
            <title>
              {p.projected
                ? t(
                    "{month} — projected {total} {unit} at the year-to-date rate",
                    {
                      month: monthNameShown(p.month),
                      total: p.total.toFixed(4),
                      unit,
                    },
                  )
                : t(
                    "{month} — total {total} {unit} (direct {direct}, indirect {indirect})",
                    {
                      month: monthNameShown(p.month),
                      total: p.total.toFixed(4),
                      unit,
                      direct: p.direct.toFixed(4),
                      indirect: p.indirect.toFixed(4),
                    },
                  )}
            </title>
          </circle>
        ))}

        {/* The word on the band. Only on the FIRST projected month, and only
            when there is room for it — repeated over every month it would be
            eight copies of one label, and squeezed into a 24px band on a phone
            it would be an unreadable smear. */}
        {firstProjected >= 0 && step > 34 && (
          <text
            x={x(firstProjected) - step / 2 + 4}
            y={PAD.top + 10}
            fontSize={8.5}
            fill="rgba(0,0,0,0.35)"
          >
            {t("Projected")}
          </text>
        )}

        <text x={PAD.left} y={H - 9} fontSize={9} fill="rgba(0,0,0,0.35)">
          {monthNameShown(points[0].month)}
        </text>
        <text
          x={W - PAD.right}
          y={H - 9}
          textAnchor="end"
          fontSize={9}
          fill="rgba(0,0,0,0.35)"
        >
          {monthNameShown(points[points.length - 1].month)}
        </text>
      </svg>

      <p className="mt-2 text-[11.5px] leading-relaxed text-black/40">
        {t("Months without production are left out.")}
        {precursorPerTonne != null &&
          " " +
            t("The precursor line is level: it is declared once for the year.")}
        {firstProjected >= 0 &&
          " " +
            t(
              "Shaded months are not readings. They carry the year-to-date rate forward.",
            )}
      </p>
    </div>
  );
}

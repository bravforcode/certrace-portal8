"use client";

/* ════════════════════════════════════════════════════════════
   CARBON & COST — THE TOP OF THE TAB

   Six figures, the year drawn month by month, what the certificates cost with
   your own data against what the EU default would make them cost, and where the
   carbon sits. The reference dashboards decide the layout (figures first, the
   chart beside one card that answers the question, then the ring); the look is
   the portal's: Plex Light figures, white cards on the warm canvas, ink and the
   four status colours, one card on ink.

   THE INK CARD IS THE ANSWER. Everything else is a part of it: the chart is why
   the figure is low, the ring is what it is made of, the table is where.

   LIKE WITH LIKE. The EU default has no electricity in it for steel and
   aluminium (Annex I states the direct figure; Annex II keeps them out of the
   certificate bill), so the dark line is the CHARGEABLE figure — direct plus
   precursors, electricity only where it counts — and the tile beside it still
   shows the whole of what is embedded. Both are said on screen.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Chip, cn } from "@/components/ui";
import {
  DeltaChip,
  Donut,
  AreaChart,
  type AreaSeries,
} from "@/components/insight/charts";
import { MiniBars, Panel, StatTile } from "@/components/insight/kit";
import { useFormat, useT } from "@/lib/i18n";
import type {
  MonthPoint,
  PricedRow,
  Totals,
} from "@/lib/cbam/carbon-cost-model";
import { shortMonth, useMoney } from "./money";

type Money = ReturnType<typeof useMoney>;

/* The portal's own chart inks (components/carbon-cost/emissions-chart.tsx): ink for the figure that goes on the report, blue / green /
   amber for the three things it is made of. The default is a dashed grey reference, never a reading. */
export const COLORS = {
  direct: "#3C7ACB",
  indirect: "#047857",
  precursor: "#b45309",
  ink: "#111111",
  def: "rgba(17,17,17,0.42)",
};

/* ── The six figures ─────────────────────────────────────────── */
export function KpiGrid({
  totals,
  series,
  money,
  rows,
}: {
  totals: Totals;
  series: MonthPoint[];
  money: Money;
  rows: PricedRow[];
}) {
  const t = useT();
  const embedded = totals.embeddedT;
  const share = (n: number) =>
    embedded && embedded > 0 ? (n / embedded) * 100 : null;
  const allCounted =
    rows.length > 0 && rows.every((r) => r.facts.indirectCounted);
  const noneCounted =
    rows.length > 0 && rows.every((r) => !r.facts.indirectCounted);
  const defaultPct =
    totals.precursorT > 0
      ? (totals.precursorDefaultT / totals.precursorT) * 100
      : 0;
  const gap = totals.gapPct;
  const bars = (pick: (p: MonthPoint) => number) =>
    series.length > 1 ? <MiniBars values={series.map(pick)} /> : undefined;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
      <StatTile
        value={money.t(embedded)}
        unit="tCO₂e"
        label={t("Total embedded emissions")}
        sub={
          gap != null
            ? gap >= 0
              ? t("below the EU default")
              : t("above the EU default")
            : t("No EU default on file yet")
        }
        chip={
          gap != null ? <DeltaChip value={-gap} good={gap >= 0} /> : undefined
        }
        bars={bars((p) => p.actualT)}
      />
      <StatTile
        value={money.t(embedded != null ? totals.directT : null)}
        unit="tCO₂e"
        label={t("Direct")}
        sub={t("Fuel burned and process emissions")}
        chip={
          share(totals.directT) != null ? (
            <Chip tone="info" filled pulse={false}>
              {money.pct(share(totals.directT), 0)} {t("of the total")}
            </Chip>
          ) : undefined
        }
        bars={bars((p) => p.directT)}
      />
      <StatTile
        value={money.t(embedded != null ? totals.indirectT : null)}
        unit="tCO₂e"
        label={t("Indirect")}
        sub={
          noneCounted
            ? t("Electricity: reported, not charged for steel and aluminium")
            : allCounted
              ? t("Electricity: counts toward the certificate bill")
              : t("Electricity: charged for some goods, not for others")
        }
        chip={
          share(totals.indirectT) != null ? (
            <Chip tone="ok" filled pulse={false}>
              {money.pct(share(totals.indirectT), 0)} {t("of the total")}
            </Chip>
          ) : undefined
        }
        bars={bars((p) => p.indirectT)}
      />
      <StatTile
        value={
          totals.precursorT > 0
            ? money.t(totals.precursorT)
            : embedded != null
              ? "0"
              : "—"
        }
        unit="tCO₂e"
        label={t("Precursors")}
        sub={
          totals.precursorT > 0
            ? t("What the bought-in inputs already carry")
            : t("Nothing bought in carries emissions here")
        }
        chip={
          totals.precursorT > 0 ? (
            <Chip tone={defaultPct > 0 ? "warn" : "ok"} filled pulse={false}>
              {money.pct(defaultPct, 0)} {t("on a default value")}
            </Chip>
          ) : undefined
        }
        bars={bars((p) => p.precursorT)}
      />
      <StatTile
        value={money.full(totals.costActualEur)}
        tone={totals.costActualEur != null ? "ok" : "muted"}
        label={t("Cost with your data")}
        sub={
          totals.savingPct != null
            ? t("below the EU default")
            : totals.pricedRows === 0
              ? t("Needs a certificate price and a year from 2026")
              : undefined
        }
        chip={
          totals.savingPct != null ? (
            <DeltaChip value={-totals.savingPct} good />
          ) : undefined
        }
      />
      <StatTile
        dark
        value={money.full(totals.costDefaultEur)}
        label={t("Cost on the EU default")}
        sub={t("What an importer pays when nobody gives them a real figure")}
      />
    </div>
  );
}

/* ── The year, month by month ────────────────────────────────── */
export function EmissionsChartCard({
  series,
  rows,
}: {
  series: MonthPoint[];
  rows: PricedRow[];
}) {
  const t = useT();
  const { locale, number } = useFormat();
  const [show, setShow] = React.useState({
    direct: false,
    indirect: false,
    precursor: false,
    total: false,
  });
  const withYear = new Set(series.map((p) => p.month.slice(0, 4))).size > 1;
  const labels = series.map((p) => shortMonth(p.month, locale, withYear));
  const firstProjected = series.findIndex((p) => p.projected);

  const all: AreaSeries[] = [
    {
      key: "chargeable",
      label: t("Your data"),
      color: COLORS.ink,
      values: series.map((p) => p.chargeableT),
    },
    {
      key: "def",
      label: t("EU default"),
      color: COLORS.def,
      dashed: true,
      values: series.map((p) => p.defaultT),
    },
    ...(show.total
      ? [
          {
            key: "total",
            label: t("Total embedded"),
            color: COLORS.ink,
            dashed: "1 4",
            values: series.map((p) => p.actualT),
          },
        ]
      : []),
    ...(show.direct
      ? [
          {
            key: "direct",
            label: t("Direct"),
            color: COLORS.direct,
            values: series.map((p) => p.directT),
          },
        ]
      : []),
    ...(show.indirect
      ? [
          {
            key: "indirect",
            label: t("Indirect"),
            color: COLORS.indirect,
            values: series.map((p) => p.indirectT),
          },
        ]
      : []),
    ...(show.precursor
      ? [
          {
            key: "precursor",
            label: t("Precursors"),
            color: COLORS.precursor,
            values: series.map((p) => p.precursorT),
          },
        ]
      : []),
  ];

  const toggle = (k: keyof typeof show) =>
    setShow((s) => ({ ...s, [k]: !s[k] }));
  const items: { k: keyof typeof show; label: string; color: string }[] = [
    { k: "total", label: t("Total embedded"), color: COLORS.ink },
    { k: "direct", label: t("Direct"), color: COLORS.direct },
    { k: "indirect", label: t("Indirect"), color: COLORS.indirect },
    { k: "precursor", label: t("Precursors"), color: COLORS.precursor },
  ];
  const mixed =
    rows.some((r) => !r.facts.indirectCounted) &&
    rows.some((r) => r.facts.indirectCounted);

  return (
    <Panel
      title={t("Emissions month by month")}
      caption="tCO₂e"
      sub={t("On the tonnes made, against the EU default for the same tonnes")}
      action={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-black/55">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-[3px] w-4 rounded"
              style={{ background: COLORS.ink }}
            />
            {t("Your data")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-[2px] w-4"
              style={{
                background: `repeating-linear-gradient(90deg,${COLORS.def} 0 4px,transparent 4px 7px)`,
              }}
            />
            {t("EU default")}
          </span>
          {items.map((it) => (
            <button
              key={it.k}
              type="button"
              data-lock="allow"
              aria-pressed={show[it.k]}
              onClick={() => toggle(it.k)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-colors",
                show[it.k]
                  ? "border-transparent bg-[#111] text-white"
                  : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    show[it.k] && it.k === "total" ? "#fff" : it.color,
                }}
              />
              {it.label}
            </button>
          ))}
        </div>
      }
    >
      <AreaChart
        labels={labels}
        series={all}
        format={(n, compact) =>
          compact
            ? number(n, { notation: "compact", maximumFractionDigits: 1 })
            : number(Math.round(n))
        }
        unit="tCO₂e"
        projectedFrom={firstProjected >= 0 ? firstProjected : undefined}
        ariaLabel={t("Embedded emissions by month against the EU default")}
        emptyText={t("No submitted months to draw yet")}
        height={224}
      />
      <p className="mt-3 text-[11.5px] leading-relaxed text-black/40">
        {mixed
          ? t(
              "The dark line is what the certificate bill is raised on. Electricity counts only for goods where the rules charge it.",
            )
          : t(
              "The dark line is what the certificate bill is raised on: direct plus precursors, and electricity only where the rules charge it.",
            )}{" "}
        {t(
          "Precursors are declared once for the year, so they move with production, not with the month.",
        )}
        {firstProjected >= 0 && (
          <>
            {" "}
            {t(
              "The shaded months are carried forward at this year's rate, not measured.",
            )}
          </>
        )}
      </p>
    </Panel>
  );
}

/* ── The card on ink ─────────────────────────────────────────── */
export function CostHeroCard({
  totals,
  rows,
  money,
  scopeLabel,
}: {
  totals: Totals;
  rows: PricedRow[];
  money: Money;
  scopeLabel: string;
}) {
  const t = useT();
  const actual = totals.costActualEur;
  const def = totals.costDefaultEur;
  const ratio =
    actual != null && def != null && def > 0
      ? Math.min(100, (actual / def) * 100)
      : null;
  const euRows = rows.filter((r) => r.costActualEur != null);
  const euTonnes = euRows.reduce((a, r) => a + r.costTonnes, 0);
  const prices = [
    ...new Map(
      rows.filter((r) => r.price).map((r) => [r.facts.year, r.price!]),
    ).entries(),
  ].sort((a, b) => a[0] - b[0]);
  const claimed = totals.claimedEur != null && totals.claimedEur > 0;

  return (
    <div className="min-w-0 rounded-2xl border border-[#111] bg-[#111] p-5 text-white">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-[family-name:var(--font-plex)] text-[16px] font-light tracking-tight">
          {t("What your data saves")}
        </h2>
        <span className="max-w-[55%] truncate text-[11px] uppercase tracking-[0.08em] text-white/40">
          {scopeLabel}
        </span>
      </div>

      <div className="mt-4 font-[family-name:var(--font-plex)] text-[32px] font-light leading-none tracking-tight tabular-nums">
        {money.full(totals.savingEur)}
      </div>
      <div className="mt-2.5 text-[13px] text-white/55">
        {totals.savingPct != null
          ? t("{pct} less than the EU default", {
              pct: money.pct(totals.savingPct, 0),
            })
          : t("Not enough to compare yet")}
      </div>

      <div className="mt-5 space-y-3.5">
        <div>
          <div className="flex items-baseline justify-between text-[12.5px]">
            <span className="text-white/75">{t("With your data")}</span>
            <span className="tabular-nums">{money.full(actual)}</span>
          </div>
          <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${ratio ?? 0}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between text-[12.5px]">
            <span className="text-white/45">{t("On the EU default")}</span>
            <span className="tabular-nums text-white/55">
              {money.full(def)}
            </span>
          </div>
          <div className="mt-2 h-[3px] rounded-full bg-white/30" />
        </div>
      </div>

      <dl className="mt-5 divide-y divide-white/10 border-t border-white/10 text-[12px]">
        <div className="flex items-center justify-between gap-3 py-2.5">
          <dt className="text-white/45">{t("Tonnes the bill is on")}</dt>
          <dd className="whitespace-nowrap tabular-nums">
            {money.t(euTonnes)} t
          </dd>
        </div>
        {prices.map(([y, p]) => (
          <div
            key={y}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <dt className="text-white/45">
              {t("Certificate price {year}", { year: y })}
            </dt>
            <dd className="whitespace-nowrap tabular-nums">
              €{p.eurPerTonne.toFixed(2)}{" "}
              <span className="text-white/35">· {p.label}</span>
            </dd>
          </div>
        ))}
        {claimed && (
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-white/45">
              {t("Carbon price paid at home, if accepted")}
            </dt>
            <dd className="whitespace-nowrap tabular-nums text-[#4ade80]">
              −{money.full(totals.claimedEur)}
            </dd>
          </div>
        )}
      </dl>
      {claimed && (
        <p className="mt-3 text-[11.5px] leading-relaxed text-white/35">
          {t(
            "Shown as claimed and never subtracted: the EU has not settled whether it accepts it.",
          )}
        </p>
      )}
    </div>
  );
}

/* ── What it is made of ──────────────────────────────────────── */
export function BreakdownCard({
  totals,
  money,
}: {
  totals: Totals;
  money: Money;
}) {
  const t = useT();
  const total = totals.embeddedT ?? 0;
  const parts = [
    {
      key: "direct",
      label: t("Direct"),
      value: totals.directT,
      color: COLORS.direct,
      hint: t("Fuel and process"),
    },
    {
      key: "indirect",
      label: t("Indirect"),
      value: totals.indirectT,
      color: COLORS.indirect,
      hint: t("Electricity"),
    },
    {
      key: "precursor",
      label: t("Precursors"),
      value: totals.precursorT,
      color: COLORS.precursor,
      hint: t("Bought-in inputs"),
    },
  ];
  const top = parts.reduce((a, b) => (b.value > a.value ? b : a), parts[0]);
  const defaultPct =
    totals.precursorT > 0
      ? (totals.precursorDefaultT / totals.precursorT) * 100
      : 0;
  return (
    <Panel
      title={t("What it is made of")}
      sub={t("Share of the total embedded emissions")}
    >
      <Donut
        parts={parts}
        centre={total > 0 ? money.pct((top.value / total) * 100, 0) : "—"}
        sub={total > 0 ? top.label : t("No data yet")}
        ariaLabel={t(
          "Direct, indirect and precursor emissions as a share of the total",
        )}
      />
      <ul className="mt-6 space-y-4">
        {parts.map((p) => {
          const pct = total > 0 ? (p.value / total) * 100 : 0;
          return (
            <li key={p.key}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="inline-flex min-w-0 items-center gap-2 text-black/75">
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="truncate">{t(p.label)}</span>
                  <span className="hidden truncate text-[11.5px] text-black/35 sm:inline">
                    {p.hint}
                  </span>
                </span>
                <span className="flex-none tabular-nums text-black/80">
                  {money.t(p.value)}{" "}
                  <span className="text-black/35">tCO₂e</span>
                </span>
              </div>
              <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-black/[0.07]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: p.color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {totals.precursorT > 0 && (
        <p className="mt-5 rounded-xl border border-black/[0.07] bg-[#faf9f7] px-3.5 py-3 text-[12px] leading-relaxed text-black/55">
          {defaultPct > 0
            ? t(
                "{pct} of the precursor emissions rest on a default value, which carries a mark-up. A verified figure from that supplier usually lowers it.",
                { pct: money.pct(defaultPct, 0) },
              )
            : t(
                "Every precursor figure comes from a supplier, none from a default value.",
              )}
        </p>
      )}
    </Panel>
  );
}

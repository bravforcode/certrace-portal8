"use client";

/* ════════════════════════════════════════════════════════════
   SUPPLY CHAIN — THE TOP OF THE TAB

   Four figures that answer "who is in it, are they on track, where is it
   failing, how much of it have we actually got", then three reads of the same
   thing: health by aspect, the chain by state, and — the point of the page —
   where it worries us and what the emissions depend on.

   Every figure comes from lib/cbam/supply-chain-model.ts, which keeps the
   aspects a score is made of next to the score, so nothing here is a verdict
   with no reasons.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Chip, cn, type Tone } from "@/components/ui";
import { Donut } from "@/components/insight/charts";
import { Panel, StatTile, TONE_HEX } from "@/components/insight/kit";
import { useT, type TFunction } from "@/lib/i18n";
import {
  STATE_LABEL,
  type ChainState,
  type ChainSummary,
  type Concern,
} from "@/lib/cbam/supply-chain-model";

export const STATE_TONE: Record<ChainState, Tone> = {
  completed: "info",
  on_track: "ok",
  attention: "warn",
  at_risk: "err",
  not_started: "muted",
};
export const STATE_COLOR: Record<ChainState, string> = {
  completed: "#1d4ed8",
  on_track: "#047857",
  attention: "#b45309",
  at_risk: "#dc2626",
  not_started: "#b9b7b0",
};

export function StateChip({
  state,
  className,
}: {
  state: ChainState;
  className?: string;
}) {
  const t = useT();
  return (
    <Chip
      tone={STATE_TONE[state]}
      filled
      pulse={false}
      className={cn("whitespace-nowrap", className)}
    >
      {t(STATE_LABEL[state])}
    </Chip>
  );
}

const pct = (n: number | null, dp = 0): string =>
  n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(dp)}%`;
const scoreTone = (v: number | null): Tone =>
  v == null ? "muted" : v >= 75 ? "ok" : v >= 50 ? "warn" : "err";

/* ── The four figures ────────────────────────────────────────── */
export function ChainTiles({
  s,
  onFilter,
  active,
}: {
  s: ChainSummary;
  onFilter: (state: ChainState | null) => void;
  active: ChainState | null;
}) {
  const t = useT();
  const good = s.byState.on_track + s.byState.completed;
  const worry = s.byState.at_risk;
  const ended =
    s.months.done + s.months.late + s.months.send + s.months.waiting;
  const answered = s.months.done + s.precursorsAnswered;
  const asked = ended + s.precursors;
  const coverage = asked > 0 ? (answered / asked) * 100 : null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
      <StatTile
        value={s.total}
        label={t("In your supply chain")}
        sub={t("Suppliers that fill in monthly, and what you buy in")}
        lines={[
          {
            label: t("Suppliers"),
            value: `${s.plants} · ${t("{n} your own", { n: s.ownPlants })}`,
          },
          { label: t("Precursors"), value: s.precursors },
        ]}
      />
      <StatTile
        tone="ok"
        value={good}
        label={t("On track")}
        sub={t("Answering on time, data in order")}
        onClick={() => onFilter(active === "on_track" ? null : "on_track")}
        active={active === "on_track"}
        lines={[
          { label: t("Completed"), value: s.byState.completed },
          {
            label: t("Average health"),
            value: s.avgScore != null ? `${Math.round(s.avgScore)}/100` : "—",
            tone: scoreTone(s.avgScore),
          },
          { label: t("Answered on time"), value: pct(s.onTimePct) },
        ]}
      />
      <StatTile
        tone={worry > 0 ? "err" : "muted"}
        value={worry}
        label={t("At risk")}
        sub={t("Late, failing a check, or nobody to ask")}
        onClick={() => onFilter(active === "at_risk" ? null : "at_risk")}
        active={active === "at_risk"}
        lines={[
          {
            label: t("Need attention"),
            value: s.byState.attention,
            tone: s.byState.attention > 0 ? "warn" : undefined,
          },
          {
            label: t("Months past the deadline"),
            value: s.months.late,
            tone: s.months.late > 0 ? "err" : undefined,
          },
          {
            label: t("Months ready to send"),
            value: s.months.send,
            tone: s.months.send > 0 ? "warn" : undefined,
          },
        ]}
      />
      <StatTile
        tone={scoreTone(coverage)}
        value={pct(coverage)}
        label={t("Data coverage")}
        sub={t("Months in and suppliers answered, of what is due")}
        lines={[
          { label: t("Suppliers answered"), value: pct(s.responsePct) },
          {
            label: t("On verified data"),
            value: pct(s.verifiedPct),
            tone: scoreTone(s.verifiedPct),
          },
          {
            label: t("On a default value"),
            value: pct(s.defaultPct),
            tone: (s.defaultPct ?? 0) > 0 ? "warn" : undefined,
          },
        ]}
      />
    </div>
  );
}

/* ── Health, aspect by aspect ────────────────────────────────── */
const ASPECT_HELP: Record<string, string> = {
  timeliness: "Months answered by their deadline, of those answered or late",
  coverage: "Months in, of the months that have ended",
  completeness: "How complete the product reports are",
  contact: "An email to send the monthly link to",
  response: "How far each invitation has got: sent, opened, answered",
  basis: "Verified figure, figure without a report, or a default value",
  checks:
    "The four checks on a verification report: accreditation, scope, period, file",
};

export function AspectsPanel({ s }: { s: ChainSummary }) {
  const t = useT();
  const groups: { of: "plant" | "precursor"; title: string }[] = [
    { of: "plant", title: t("Suppliers") },
    { of: "precursor", title: t("Precursors") },
  ];
  return (
    <Panel
      title={t("Health, aspect by aspect")}
      caption="0–100"
      sub={t("What each score is made of, across the whole chain")}
    >
      <div className="grid gap-x-10 gap-y-7 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.of}>
            <h3 className="mb-3 text-[11px] uppercase tracking-[0.08em] text-black/40">
              {g.title}
            </h3>
            <ul className="space-y-4">
              {s.aspects
                .filter((a) =>
                  g.of === "plant" ? a.of === "plant" : a.of === "precursor",
                )
                .map((a) => {
                  const tone = scoreTone(a.value);
                  return (
                    <li key={a.key}>
                      <div className="flex items-baseline justify-between gap-3 text-[13px]">
                        <span
                          className="min-w-0 truncate text-black/75"
                          title={t(ASPECT_HELP[a.key] ?? "")}
                        >
                          {t(a.label)}
                        </span>
                        <span
                          className={cn(
                            "flex-none tabular-nums",
                            tone === "ok"
                              ? "text-[#047857]"
                              : tone === "warn"
                                ? "text-[#b45309]"
                                : tone === "err"
                                  ? "text-[#dc2626]"
                                  : "text-black/35",
                          )}
                        >
                          {a.value == null ? "—" : Math.round(a.value)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-black/[0.07]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${a.value ?? 0}%`,
                            background: TONE_HEX[tone],
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-snug text-black/35">
                        {t(ASPECT_HELP[a.key] ?? "")}
                      </p>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── The chain by state ──────────────────────────────────────── */
export function StatePanel({
  s,
  onFilter,
  active,
}: {
  s: ChainSummary;
  onFilter: (state: ChainState | null) => void;
  active: ChainState | null;
}) {
  const t = useT();
  const order: ChainState[] = [
    "at_risk",
    "attention",
    "on_track",
    "completed",
    "not_started",
  ];
  const parts = order.map((k) => ({
    key: k,
    label: t(STATE_LABEL[k]),
    value: s.byState[k],
    color: STATE_COLOR[k],
  }));
  const healthy =
    s.total > 0
      ? ((s.byState.on_track + s.byState.completed) / s.total) * 100
      : null;
  return (
    <Panel
      title={t("The chain by state")}
      sub={t("Everyone in it, in one count")}
    >
      <Donut
        parts={parts}
        centre={healthy != null ? `${Math.round(healthy)}%` : "—"}
        sub={t("healthy")}
        ariaLabel={t("Parties in the supply chain by state")}
      />
      <ul className="mt-6 space-y-1">
        {parts.map((p) => (
          <li key={p.key}>
            <button
              type="button"
              onClick={() => onFilter(active === p.key ? null : p.key)}
              aria-pressed={active === p.key}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors hover:bg-black/[0.03]",
                active === p.key && "bg-black/[0.05]",
              )}
            >
              <span className="inline-flex items-center gap-2 text-black/75">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: p.color }}
                />
                {p.label}
              </span>
              <span className="tabular-nums text-black/80">
                {p.value}
                <span className="ml-2 text-black/35">
                  {s.total > 0
                    ? `${Math.round((p.value / s.total) * 100)}%`
                    : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ── Where it worries us ─────────────────────────────────────── */
export function concernText(c: Concern, t: TFunction): string {
  const p = c.detail ?? "";
  switch (c.kind) {
    case "late_months":
      return c.n === 1
        ? t("1 month past the deadline and still unanswered")
        : t("{n} months past the deadline and still unanswered", {
            n: c.n ?? 0,
          });
    case "no_contact":
      return t("No email on file to send the monthly link to");
    case "months_to_send":
      return c.n === 1
        ? t("1 month ready to send: nobody has been asked yet")
        : t("{n} months ready to send: nobody has been asked yet", {
            n: c.n ?? 0,
          });
    case "low_completeness":
      return t("Its reports are only {n}% complete", { n: c.n ?? 0 });
    case "precursor_late":
      return t("{product}: the year has ended and the figure is still not in", {
        product: p,
      });
    case "precursor_not_sent":
      return t("{product}: not invited yet", { product: p });
    case "precursor_stale":
      return t("{product}: invited {n} days ago, no answer", {
        product: p,
        n: c.n ?? 0,
      });
    case "precursor_default":
      return c.n != null
        ? t(
            "{product}: on a default value, carrying {n}% of the precursor emissions",
            { product: p, n: c.n },
          )
        : t("{product}: on a default value", { product: p });
    case "precursor_checks":
      return t("{product}: the verification report fails a check", {
        product: p,
      });
    case "precursor_unverified":
      return t("{product}: a figure with no verification report behind it", {
        product: p,
      });
  }
}

const SEV: Record<Concern["severity"], { tone: Tone; label: string }> = {
  high: { tone: "err", label: "High" },
  medium: { tone: "warn", label: "Medium" },
  low: { tone: "muted", label: "Low" },
};

export function ConcernsPanel({
  concerns,
  hrefFor,
}: {
  concerns: Concern[];
  hrefFor?: (c: Concern) => string | null;
}) {
  const t = useT();
  const [all, setAll] = React.useState(false);
  const shown = all ? concerns : concerns.slice(0, 7);
  const counts = {
    high: concerns.filter((c) => c.severity === "high").length,
    medium: concerns.filter((c) => c.severity === "medium").length,
  };
  return (
    <Panel
      title={t("Where it worries us")}
      sub={t("Most serious first")}
      action={
        <div className="flex items-center gap-2 text-[12px] text-black/50">
          {counts.high > 0 && (
            <Chip tone="err" filled pulse={false}>
              {counts.high} {t("High")}
            </Chip>
          )}
          {counts.medium > 0 && (
            <Chip tone="warn" filled pulse={false}>
              {counts.medium} {t("Medium")}
            </Chip>
          )}
        </div>
      }
    >
      {concerns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 px-4 py-10 text-center text-[13px] text-black/40">
          {t("Nothing worries us in the chain right now.")}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-black/[0.06]">
            {shown.map((c) => {
              const href = hrefFor?.(c) ?? null;
              const body = (
                <>
                  <span
                    className="mt-[7px] h-2 w-2 flex-none rounded-full"
                    style={{
                      background:
                        c.severity === "high"
                          ? "#dc2626"
                          : c.severity === "medium"
                            ? "#b45309"
                            : "#c7c5be",
                    }}
                    aria-label={t(SEV[c.severity].label)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-black/85">
                      {c.name}
                    </span>
                    <span className="block text-[12.5px] leading-snug text-black/50">
                      {concernText(c, t)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex-none text-[10px] uppercase tracking-[0.12em] text-black/30">
                    {c.party === "plant" ? t("Plant") : t("Precursor")}
                  </span>
                </>
              );
              return (
                <li key={c.id}>
                  {href ? (
                    <Link
                      href={href}
                      className="flex items-start gap-3 rounded-lg py-3 transition-colors hover:bg-[#fafaf8]"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 py-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {concerns.length > 7 && (
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              className="mt-3 text-[12px] uppercase tracking-[0.08em] text-black/45 hover:text-black"
            >
              {all
                ? t("Show fewer")
                : t("Show all {n}", { n: concerns.length })}
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

/* ── What the emissions depend on ────────────────────────────── */
export function ConcentrationPanel({ s }: { s: ChainSummary }) {
  const t = useT();
  const top = s.concentration.slice(0, 6);
  const max = Math.max(0.01, ...top.map((c) => c.share));
  const basisTone: Record<string, Tone> = {
    verified: "ok",
    unverified: "warn",
    default: "err",
  };
  const basisLabel: Record<string, string> = {
    verified: "Verified",
    unverified: "No report",
    default: "Default value",
  };
  return (
    <Panel
      title={t("What the emissions depend on")}
      sub={t("Share of the bought-in emissions each supplier carries")}
    >
      {top.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 px-4 py-10 text-center text-[13px] text-black/40">
          {t("No bought-in input carries emissions yet.")}
        </p>
      ) : (
        <ul className="space-y-4">
          {top.map((c) => (
            <li key={c.id}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate text-black/80">
                  {c.name} <span className="text-black/35">· {c.product}</span>
                </span>
                <span className="flex-none tabular-nums text-black/80">
                  {Math.round(c.share * 100)}%
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-black/[0.05]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(c.share / max) * 100}%`,
                      background: STATE_COLOR[c.state],
                    }}
                  />
                </div>
                <Chip
                  tone={basisTone[c.basis]}
                  filled
                  pulse={false}
                  className="whitespace-nowrap"
                >
                  {t(basisLabel[c.basis])}
                </Chip>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-[11.5px] leading-relaxed text-black/40">
        {t(
          "The bar is coloured by that supplier's state. A big share on a default value is the quickest place to lower the bill.",
        )}
      </p>
    </Panel>
  );
}

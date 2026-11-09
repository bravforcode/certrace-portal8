"use client";

/* ════════════════════════════════════════════════════════════
   THE DASHBOARD — ITS PANELS

   Six figures; the year against the EU default beside Cera; how far each report
   has got and what is still open; what needs you and the dates that matter; who
   the exporter relies on; what just happened. Laid out after the reference
   dashboards, drawn in the portal's own look (components/insight/kit.tsx).

   EVERY FIGURE IS A DOOR. A number that cannot be opened is a number the reader
   has to go and find somewhere else, which is the same as not having shown it.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, ChevronRight, FileUp, Layers, Paperclip, Send, ShieldAlert, Users } from "lucide-react";
import { Chip, cn, type Tone } from "@/components/ui";
import { CeraMark } from "@/components/cera/cera-mark";
import { useCera } from "@/components/cera/cera-provider";
import { AreaChart, DeltaChip } from "@/components/insight/charts";
import { MiniBars, Panel, StatTile, TONE_HEX } from "@/components/insight/kit";
import { concernText } from "@/components/supply-chain/overview";
import { shortMonth, useMoney } from "@/components/carbon-cost/money";
import { COLORS } from "@/components/carbon-cost/overview";
import { useFormat, useT, type TFunction } from "@/lib/i18n";
import { monthlySeries, totalsOf } from "@/lib/cbam/carbon-cost-model";
import { keyDates, type DashboardData, type TabTally } from "@/lib/cbam/dashboard-data";
import { TAB_LABEL } from "@/lib/readiness";
import { monthNameLong } from "@/lib/workspace";
import type { ActionItem, ActionItemType } from "@/lib/cbam/action-queue";
import type { ActivityEvent, ActivityKind } from "@/lib/cbam/activity-feed";

type Money = ReturnType<typeof useMoney>;
const scoreTone = (v: number | null): Tone => (v == null ? "muted" : v >= 75 ? "ok" : v >= 50 ? "warn" : "err");

function LinkTile({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block min-w-0 [&>div]:transition-colors [&>div:hover]:border-black/15 [&>div:hover]:bg-[#fafaf8]">
      {children}
    </Link>
  );
}

/* A month named in a sentence is named when the sentence is drawn, in the language then on screen — not when the figures were read,
   which may have been before the reader switched language. */
function monthIn(vars: Record<string, string | number>, iso: string | undefined): Record<string, string | number> {
  return iso && typeof vars.month === "string" ? { ...vars, month: monthNameLong(iso) } : vars;
}

/* ── The six figures ─────────────────────────────────────────── */
export function HomeTiles({ d, money, live }: { d: DashboardData; money: Money; live: boolean }) {
  const t = useT();
  const { date } = useFormat();
  const totals = totalsOf(d.carbon.rows);
  const series = monthlySeries(d.carbon.rows);
  const c = d.company;
  const monthsPct = c.monthsOf > 0 ? Math.round((c.monthsIn / c.monthsOf) * 100) : 0;
  const gap = totals.gapPct;
  const chainBad = d.chain.byState.at_risk;
  const l = (path: string) => (live ? path : "#");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
      <LinkTile href={l("/reports")}>
        <StatTile
          value={d.daysToDeadline}
          tone={d.daysToDeadline <= 30 ? "warn" : "muted"}
          label={t("Days to get your figures to buyers")}
          sub={t("Your buyers file their first CBAM declaration on {date} and need your verified figures before then.", { date: date(d.deadline, { day: "numeric", month: "long", year: "numeric" }) })}
        />
      </LinkTile>
      <LinkTile href={l("/workspaces")}>
        <StatTile
          value={`${c.monthsIn}/${c.monthsOf}`}
          label={t("Months in")}
          sub={t("{pct}% of the months your reports carry are submitted", { pct: monthsPct })}
          bars={series.length > 1 ? <MiniBars values={series.map((p) => p.tonnes)} /> : undefined}
          chip={d.asks.late > 0 ? <Chip tone="err" filled pulse={false}>{t("{n} past the deadline", { n: d.asks.late })}</Chip> : undefined}
        />
      </LinkTile>
      <LinkTile href={l("/reports")}>
        <StatTile
          value={`${c.packagesReady}/${c.packagesTotal}`}
          tone={c.packagesTotal > 0 && c.packagesReady === c.packagesTotal ? "ok" : "muted"}
          label={t("Packages ready")}
          sub={t("Report packages that can go to a verifier")}
          chip={c.blocked > 0 ? <Chip tone="err" filled pulse={false}>{t("{n} blocked", { n: c.blocked })}</Chip> : undefined}
        />
      </LinkTile>
      <LinkTile href={l("/carbon-cost")}>
        <StatTile
          value={money.t(totals.embeddedT)}
          unit="tCO₂e"
          label={t("Embedded emissions")}
          sub={gap != null ? (gap >= 0 ? t("below the EU default") : t("above the EU default")) : t("No EU default on file yet")}
          chip={gap != null ? <DeltaChip value={-gap} good={gap >= 0} /> : undefined}
          bars={series.length > 1 ? <MiniBars values={series.map((p) => p.actualT)} /> : undefined}
        />
      </LinkTile>
      <LinkTile href={l("/carbon-cost")}>
        <StatTile
          value={money.full(totals.costActualEur)}
          tone={totals.costActualEur != null ? "ok" : "muted"}
          label={t("Certificate cost with your data")}
          sub={totals.costDefaultEur != null ? t("{amount} on the EU default", { amount: money.full(totals.costDefaultEur) }) : t("Needs a certificate price and a year from 2026")}
          chip={totals.savingPct != null ? <DeltaChip value={-totals.savingPct} good /> : undefined}
        />
      </LinkTile>
      <LinkTile href={l("/supply-chain")}>
        <StatTile
          value={d.chain.avgScore != null ? Math.round(d.chain.avgScore) : "—"}
          unit="/100"
          tone={scoreTone(d.chain.avgScore)}
          label={t("Supply chain health")}
          sub={t("{n} in your chain, {m} on track", { n: d.chain.total, m: d.chain.byState.on_track + d.chain.byState.completed })}
          chip={chainBad > 0 ? <Chip tone="err" filled pulse={false}>{t("{n} at risk", { n: chainBad })}</Chip> : <Chip tone="ok" filled pulse={false}>{t("None at risk")}</Chip>}
        />
      </LinkTile>
    </div>
  );
}

/* ── The year against the EU default ─────────────────────────── */
export function HomeChart({ d, money, live }: { d: DashboardData; money: Money; live: boolean }) {
  const t = useT();
  const { locale, number } = useFormat();
  const series = monthlySeries(d.carbon.rows);
  const withYear = new Set(series.map((p) => p.month.slice(0, 4))).size > 1;
  const totals = totalsOf(d.carbon.rows);
  return (
    <Panel
      title={t("Emissions against the EU default")}
      caption="tCO₂e"
      sub={t("What your goods carry each month, and what the EU would assume for the same tonnes")}
      action={
        live ? (
          <Link href="/carbon-cost" className="inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.08em] text-black/45 hover:text-black">
            {t("Open Carbon & Cost")} <ChevronRight size={13} strokeWidth={1.6} />
          </Link>
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <span className="font-[family-name:var(--font-plex)] text-[26px] font-light leading-none tracking-tight tabular-nums text-[#111]">{money.t(totals.chargeableT)}</span>
        <span className="text-[13px] text-black/45">tCO₂e {t("charged")}</span>
        {totals.gapPct != null && <DeltaChip value={-totals.gapPct} good={totals.gapPct >= 0} />}
        <span className="ml-auto flex items-center gap-4 text-[12px] text-black/55">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded bg-[#111]" />
            {t("Your data")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[2px] w-4" style={{ background: `repeating-linear-gradient(90deg,${COLORS.def} 0 4px,transparent 4px 7px)` }} />
            {t("EU default")}
          </span>
        </span>
      </div>
      <AreaChart
        labels={series.map((p) => shortMonth(p.month, locale, withYear))}
        series={[
          { key: "mine", label: t("Your data"), color: COLORS.ink, values: series.map((p) => p.chargeableT) },
          { key: "def", label: t("EU default"), color: COLORS.def, dashed: true, values: series.map((p) => p.defaultT) },
        ]}
        format={(n, compact) => (compact ? number(n, { notation: "compact", maximumFractionDigits: 1 }) : number(Math.round(n)))}
        unit="tCO₂e"
        ariaLabel={t("Embedded emissions by month against the EU default")}
        emptyText={t("No submitted months to draw yet")}
        height={204}
      />
    </Panel>
  );
}

/* ── Cera ─────────────────────────────────────────────────────── */
export function CeraCard({ d, money }: { d: DashboardData; money: Money }) {
  const t = useT();
  const cera = useCera();
  const [typed, setTyped] = React.useState("");
  const totals = totalsOf(d.carbon.rows);
  const worst = d.chain.concerns[0];
  const lines: string[] = [];
  const overdue = d.actions.filter((a) => a.daysUntilDue < 0).length;
  if (overdue > 0) lines.push(overdue === 1 ? t("1 item is overdue.") : t("{n} items are overdue.", { n: overdue }));
  if (worst) lines.push(`${worst.name}: ${concernText(worst, t)}`);
  if (totals.savingEur != null && totals.savingPct != null) lines.push(t("Your own data saves {amount} against the EU default.", { amount: money.full(totals.savingEur) }));
  if (lines.length === 0) lines.push(t("Nothing is late and nothing worries me. A good time to look ahead."));

  const ask = (q: string) => {
    cera.show();
    cera.send(q);
  };
  const questions = [
    d.asks.late > 0 || d.chain.byState.at_risk > 0 ? t("Who is late and what should I chase first?") : t("What should I do next?"),
    t("Which suppliers should I get verified figures from?"),
    t("What's new in CBAM?"),
  ];

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#111] bg-[#111] p-5 text-white">
      <button type="button" onClick={() => cera.show()} className="flex items-center gap-3 text-left">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
          <CeraMark className="h-[19px] w-auto" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">{t("Cera Intelligence")}</div>
          <div className="font-[family-name:var(--font-plex)] text-[16px] font-light tracking-tight">{t("What stands out today")}</div>
        </div>
      </button>

      <ul className="mt-4 space-y-2.5">
        {lines.map((l, i) => (
          <li key={i} className="flex items-start gap-3 text-[13px] leading-snug text-white/80">
            <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-white/60" />
            {l}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <div className="flex flex-wrap gap-2">
          {questions.map((q) => (
            <button key={q} type="button" onClick={() => ask(q)} className="rounded-full border border-white/15 px-3.5 py-1.5 text-left text-[12px] text-white/75 transition-colors hover:border-white/40 hover:text-white">
              {q}
            </button>
          ))}
        </div>
        {/* Typing here asks in the popup, not the full page — the dashboard stays in view behind the answer. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = typed.trim();
            if (!q) return cera.show();
            setTyped("");
            ask(q);
          }}
          className="mt-4 flex w-full items-center gap-2 rounded-xl bg-white py-1.5 pl-4 pr-1.5"
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={t("Ask about your data…")}
            aria-label={t("Ask about your data…")}
            style={{ outline: "none", borderRadius: 0 }}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-black/80 placeholder:text-black/45 focus:outline-none focus-visible:outline-none"
          />
          <button type="submit" aria-label={t("Send")} className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#111] text-white transition-colors hover:bg-[#333]">
            <Send size={13} strokeWidth={1.6} />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── How far each report has got ─────────────────────────────── */
export function SitesPanel({ d, live }: { d: DashboardData; live: boolean }) {
  const t = useT();
  const rows = d.company.sites.flatMap((s) => s.years.map((y) => ({ site: s, y })));
  return (
    <Panel
      title={t("How far each report has got")}
      sub={t("By installation and reporting year; the tick is where the year should be by now")}
      action={live ? <Link href="/workspaces" className="inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.08em] text-black/45 hover:text-black">{t("Open Verification")} <ChevronRight size={13} strokeWidth={1.6} /></Link> : undefined}
    >
      {rows.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-black/40">{t("No report yet.")}</p>
      ) : (
        <ul className="space-y-5">
          {rows.slice(0, 7).map(({ site, y }) => {
            /* The tick is where the year would be if every month had been answered on time: months elapsed of the year, for a year in
               progress; the whole bar for a year that is over. */
            const now = d.now;
            const expected = y.year < now.getFullYear() ? 100 : y.year > now.getFullYear() ? 0 : Math.min(100, Math.round((now.getMonth() / 12) * 100));
            const tone: Tone = y.packageReady ? "ok" : y.blocked > 0 ? "err" : y.percent >= expected ? "ok" : "warn";
            return (
              <li key={`${site.id}-${y.year}`}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="min-w-0 truncate text-black/80">
                    {site.name} <span className="text-black/35">· {y.year}</span>
                  </span>
                  <span className="flex flex-none items-center gap-3">
                    <span className="font-mono text-[11px] text-black/35">{y.monthsIn}/{y.monthsOf} {t("months")}</span>
                    <span className="tabular-nums text-black/75">{y.percent}%</span>
                  </span>
                </div>
                <div className="relative mt-2 h-[4px] rounded-full bg-black/[0.07]">
                  <div className="h-full rounded-full" style={{ width: `${y.percent}%`, background: TONE_HEX[tone] }} />
                  {expected > 0 && expected < 100 && <span aria-hidden className="absolute -top-[3px] h-[10px] w-[2px] rounded bg-black/40" style={{ left: `${expected}%` }} />}
                </div>
                <div className="mt-1.5 text-[11.5px] text-black/40">
                  {y.packageReady ? t("Package ready to send") : y.blocked > 0 ? t("{n} blocked, {m} items holding the package", { n: y.blocked, m: y.holding }) : t("{m} items holding the package", { m: y.holding })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ── What each part of the filing looks like across the estate ── */
export function CompliancePanel({ tabs }: { tabs: TabTally[] }) {
  const t = useT();
  return (
    <Panel title={t("Compliance status")} sub={t("Each part of the filing, across every product report")}>
      {tabs.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-black/40">{t("No report yet.")}</p>
      ) : (
        <ul className="divide-y divide-black/[0.06]">
          {tabs.map((x) => {
            const done = x.complete === x.total;
            const chip = done ? { tone: "ok" as Tone, label: t("Complete") } : x.blocked > 0 ? { tone: "err" as Tone, label: t("{n} blocked", { n: x.blocked }) } : x.notStarted === x.total ? { tone: "muted" as Tone, label: t("Not started") } : { tone: "warn" as Tone, label: t("{n} to do", { n: x.total - x.complete }) };
            return (
              <li key={x.tab} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] text-black/80">{t(TAB_LABEL[x.tab])}</span>
                  <span className="block text-[11.5px] text-black/35">
                    {t("{n} of {m} reports complete", { n: x.complete, m: x.total })}
                  </span>
                </span>
                <Chip tone={chip.tone} filled pulse={false} className="whitespace-nowrap">
                  {chip.label}
                </Chip>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ── What needs you ───────────────────────────────────────────── */
const TYPE_ICON: Record<ActionItemType, typeof Calendar> = { monthly_data: Calendar, precursor_invite: Users, mmd_draft: Layers, document_unbound: Paperclip, precursor_deadline: ShieldAlert };
const TYPE_LABEL: Record<ActionItemType, string> = { monthly_data: "Monthly data", precursor_invite: "Precursor", mmd_draft: "Monitoring plan", document_unbound: "Document", precursor_deadline: "Precursor deadline" };

function dueLabel(n: number, t: TFunction): { text: string; tone: "err" | "warn" } {
  const a = Math.abs(n);
  if (n < 0) return { text: a === 1 ? t("1 day overdue") : t("{n} days overdue", { n: a }), tone: "err" };
  if (n === 0) return { text: t("Needs attention"), tone: "warn" };
  return { text: n === 1 ? t("Due in 1 day") : t("Due in {n} days", { n }), tone: "warn" };
}

export function NeedsYouPanel({ items, live }: { items: ActionItem[]; live: boolean }) {
  const t = useT();
  const [all, setAll] = React.useState(false);
  const shown = all ? items : items.slice(0, 5);
  const overdue = items.filter((i) => i.daysUntilDue < 0).length;
  return (
    <Panel
      title={t("Needs you")}
      sub={t("Late or about to be, most overdue first")}
      action={items.length > 0 ? <Chip tone={overdue > 0 ? "err" : "warn"} filled pulse={false}>{items.length === 1 ? t("1 item") : t("{n} items", { n: items.length })}</Chip> : undefined}
    >
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] px-4 py-4">
          <CheckCircle2 size={18} strokeWidth={1.5} className="flex-none text-[#047857]" />
          <p className="text-[13px] text-[#047857]">{t("Nothing needs attention right now.")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.06]">
          {shown.map((item, i) => {
            const Icon = TYPE_ICON[item.type];
            const due = dueLabel(item.daysUntilDue, t);
            const inner = (
              <>
                <span className={cn("grid h-9 w-9 flex-none place-items-center rounded-lg border", due.tone === "err" ? "border-[rgba(220,38,38,0.18)] bg-[#fef2f2] text-[#dc2626]" : "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]")}>
                  <Icon size={16} strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-black/80">{item.say ? t(item.say.key, monthIn(item.say.vars, /\/monthly\/(\d{4}-\d{2})/.exec(item.deepLink)?.[1])) : t(item.label)}</span>
                  <span className="block truncate text-[11.5px] text-black/40">
                    {t(TYPE_LABEL[item.type])} · {t(item.workspaceLabel)}
                  </span>
                </span>
                <span className={cn("flex-none whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.06em]", due.tone === "err" ? "text-[#dc2626]" : "text-[#b45309]")}>{due.text}</span>
              </>
            );
            return (
              <li key={`${item.workspaceId}-${item.type}-${i}`}>
                {live ? (
                  <Link href={item.deepLink} className="flex items-center gap-3 py-3 transition-colors hover:bg-[#fafaf8]">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 py-3">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {items.length > 5 && (
        <button type="button" data-lock="allow" onClick={() => setAll((v) => !v)} className="mt-3 text-[12px] uppercase tracking-[0.08em] text-black/45 hover:text-black">
          {all ? t("Show fewer") : t("Show all {count}", { count: items.length })}
        </button>
      )}
    </Panel>
  );
}

/* ── The dates that matter ────────────────────────────────────── */
export function DatesPanel({ d }: { d: DashboardData }) {
  const t = useT();
  const { date } = useFormat();
  const list = keyDates(d.now).slice(0, 5);
  const days = (iso: string) => Math.ceil((new Date(`${iso}T23:59:59`).getTime() - d.now.getTime()) / 86_400_000);
  const who: Record<string, string> = { you: "You", buyers: "Your buyers", both: "You and your buyers" };
  return (
    <Panel title={t("Dates that matter")} sub={t("From the CBAM regulation as amended in 2025")}>
      <ol className="relative space-y-5 border-l border-black/10 pl-5">
        {list.map((k, i) => (
          <li key={k.date} className="relative">
            <span aria-hidden className={cn("absolute -left-[26px] top-[5px] h-2.5 w-2.5 rounded-full border-2 border-white", i === 0 ? "bg-[#111]" : "bg-black/25")} />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-[13px] text-black/85">{date(`${k.date}T12:00:00`, { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="font-mono text-[11px] text-black/40">{t("in {n} days", { n: days(k.date) })}</span>
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-black/55">{t(k.key, { year: d.now.getFullYear() })}</p>
            <span className="mt-1.5 inline-block text-[10px] uppercase tracking-[0.12em] text-black/30">{t(who[k.who])}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* ── Who the exporter relies on ───────────────────────────────── */
export function ChainPanel({ d, live }: { d: DashboardData; live: boolean }) {
  const t = useT();
  const top = d.chain.concerns.slice(0, 5);
  const states: { k: keyof DashboardData["chain"]["byState"]; label: string; color: string }[] = [
    { k: "at_risk", label: "At risk", color: "#dc2626" },
    { k: "attention", label: "Needs attention", color: "#b45309" },
    { k: "on_track", label: "On track", color: "#047857" },
    { k: "completed", label: "Completed", color: "#1d4ed8" },
    { k: "not_started", label: "Not started", color: "#b9b7b0" },
  ];
  return (
    <Panel
      title={t("Supply chain")}
      sub={t("Where it worries us")}
      action={live ? <Link href="/supply-chain" className="inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.08em] text-black/45 hover:text-black">{t("Open Supply Chain")} <ChevronRight size={13} strokeWidth={1.6} /></Link> : undefined}
    >
      <div className="mb-4 flex h-[6px] overflow-hidden rounded-full bg-black/[0.06]" role="img" aria-label={t("Parties in the supply chain by state")}>
        {states.map((s) => (
          <span key={s.k} style={{ width: `${d.chain.total > 0 ? (d.chain.byState[s.k] / d.chain.total) * 100 : 0}%`, background: s.color }} />
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-black/50">
        {states.map((s) => (
          <span key={s.k} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {t(s.label)} · {d.chain.byState[s.k]}
          </span>
        ))}
      </div>
      {top.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 px-4 py-8 text-center text-[13px] text-black/40">{t("Nothing worries us in the chain right now.")}</p>
      ) : (
        <ul className="divide-y divide-black/[0.06]">
          {top.map((c) => (
            <li key={c.id} className="flex items-start gap-3 py-2.5">
              <span className="mt-[7px] h-2 w-2 flex-none rounded-full" style={{ background: c.severity === "high" ? "#dc2626" : c.severity === "medium" ? "#b45309" : "#c7c5be" }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-black/85">{c.name}</span>
                <span className="block text-[12px] leading-snug text-black/50">{concernText(c, t)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ── What just happened ───────────────────────────────────────── */
const KIND_ICON: Record<ActivityKind, typeof FileUp> = { supplier_submitted: Send, document_uploaded: FileUp, mmd_finalised: Layers, month_submitted: Calendar };

function ago(iso: string, t: TFunction, date: ReturnType<typeof useFormat>["date"], now: Date): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.round((now.getTime() - then) / 60_000);
  if (mins < 1) return t("just now");
  if (mins < 60) return t("{n}m ago", { n: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t("{n}h ago", { n: hours });
  const days = Math.round(hours / 24);
  if (days < 30) return t("{n}d ago", { n: days });
  return date(iso);
}

export function ActivityPanel({ events, d, live }: { events: ActivityEvent[]; d: DashboardData; live: boolean }) {
  const t = useT();
  const { date } = useFormat();
  return (
    <Panel title={t("Recent activity")} sub={t("The last things that changed across your reports")}>
      {events.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-black/40">{t("Nothing has happened yet.")}</p>
      ) : (
        <ul className="divide-y divide-black/[0.06]">
          {events.slice(0, 6).map((e, i) => {
            const Icon = KIND_ICON[e.kind];
            const inner = (
              <>
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-black/[0.08] bg-[#faf9f7] text-black/45">
                  <Icon size={14} strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-black/80">{e.say ? t(e.say.key, monthIn(e.say.vars, typeof e.say.vars.month === "string" && /^\d{4}-\d{2}$/.test(e.say.vars.month) ? e.say.vars.month : undefined)) : t(e.label)}</span>
                  <span className="block truncate text-[11.5px] text-black/40">{t(e.workspaceLabel)}</span>
                </span>
                <span className="flex-none font-mono text-[11px] text-black/35">{ago(e.at, t, date, d.now)}</span>
              </>
            );
            return (
              <li key={`${e.at}-${i}`}>
                {live ? (
                  <Link href={e.deepLink} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-[#fafaf8]">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 py-2.5">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

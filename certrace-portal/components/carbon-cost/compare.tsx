"use client";

/* ════════════════════════════════════════════════════════════
   CARBON & COST — THE COMPARISON

   The same figures read three ways — by installation, by product, by reporting
   year — and, under each row, broken down by one of the other two. That is the
   whole of "compare across every installation, every year and every product":
   not three tables but one that turns.

   Each row answers the four things a reader triages on:
     how much       tonnes made and tCO₂e carried, split direct / electricity / precursor
     how it stands  against the EU default (the gap, in %)
     what it costs  with your data, and on the default
     how sure       official, part-year, precursors unverified, or no data

   A row with no cost says WHY in its tooltip (before 2026 there are no
   certificates; no production yet; no default on file for the good).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronRight, ExternalLink } from "lucide-react";
import { Chip, cn, toneChip, type Tone } from "@/components/ui";
import { Panel, ScoreBar, SearchPill, TH, TablePager, paginate } from "@/components/insight/kit";
import { Segmented } from "@/components/insight/kit";
import { useT } from "@/lib/i18n";
import { DIMS, groupRows, type CostReason, type Dim, type Group, type PricedRow } from "@/lib/cbam/carbon-cost-model";
import type { useMoney } from "./money";

type Money = ReturnType<typeof useMoney>;
type SortKey = "name" | "tonnes" | "embedded" | "gap" | "cost" | "saving";

const REASON_ORDER: CostReason[] = ["no_data", "partial_year", "unverified_data", "official"];

function worstReason(rows: PricedRow[]): CostReason {
  if (rows.length === 0) return "no_data";
  if (rows.every((r) => r.facts.reason === "no_data")) return "no_data";
  const present = new Set(rows.map((r) => r.facts.reason));
  if (present.has("partial_year") || present.has("no_data")) return "partial_year";
  if (present.has("unverified_data")) return "unverified_data";
  return "official";
}

export function StatusChip({ reason }: { reason: CostReason }) {
  const t = useT();
  const map: Record<CostReason, { tone: Tone; label: string }> = {
    official: { tone: "ok", label: t("Official") },
    partial_year: { tone: "warn", label: t("Part year") },
    unverified_data: { tone: "warn", label: t("Not verified") },
    no_data: { tone: "muted", label: t("No data yet") },
  };
  return (
    <Chip tone={map[reason].tone} filled pulse={false} className="whitespace-nowrap">
      {map[reason].label}
    </Chip>
  );
}

const dimLabel = (d: Dim, t: ReturnType<typeof useT>) => (d === "installation" ? t("Installation") : d === "product" ? t("Product") : t("Reporting year"));
const defaultThen = (by: Dim): Dim => (by === "installation" ? "product" : by === "product" ? "year" : "installation");

function costWhy(rows: PricedRow[], t: ReturnType<typeof useT>): string {
  const note = rows.map((r) => r.costNote).find((n) => n != null);
  if (note === "before_2026") return t("CBAM certificates start with 2026 imports, so earlier years have no cost.");
  if (note === "no_production") return t("No production counted yet, so there is no figure to price.");
  if (note === "no_default") return t("No EU default is on file for this good.");
  if (note === "no_price") return t("No certificate price is on file for this year. Add one in the prices table below.");
  return "";
}

export function CompareCard({
  rows,
  by,
  onBy,
  then,
  onThen,
  money,
  onPick,
  linkable,
}: {
  rows: PricedRow[];
  by: Dim;
  onBy: (d: Dim) => void;
  then: Dim | null;
  onThen: (d: Dim | null) => void;
  money: Money;
  /** a row was clicked: narrow the page to it */
  onPick: (dim: Dim, key: string) => void;
  /** real rows open their product report; sample rows do not */
  linkable: boolean;
}) {
  const t = useT();
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 1 | -1 }>({ key: "cost", dir: -1 });
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(6);

  const second = then && then !== by ? then : defaultThen(by);
  const groups = React.useMemo(() => groupRows(rows, by, second), [rows, by, second]);

  const value = (g: Group, k: SortKey): number | string => {
    const x = g.totals;
    switch (k) {
      case "name":
        return g.label.toLowerCase();
      case "tonnes":
        return x.tonnes;
      case "embedded":
        return x.embeddedT ?? -1;
      case "gap":
        return x.gapPct ?? -1e9;
      case "cost":
        return x.costActualEur ?? -1;
      case "saving":
        return x.savingEur ?? -1e12;
    }
  };

  const filtered = groups
    .filter((g) => !query.trim() || `${g.label} ${g.hint ?? ""} ${g.children.map((c) => c.label).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      const va = value(a, sort.key);
      const vb = value(b, sort.key);
      return (typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)) * sort.dir;
    });
  const view = paginate(filtered, page, size);

  const th = (key: SortKey, label: string, right = false) => (
    <th scope="col" className={cn("px-2.5 py-3", TH, right ? "text-right" : "text-left")}>
      <button type="button" onClick={() => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "name" ? 1 : -1 }))} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap hover:text-black", right && "flex-row-reverse")}>
        {label}
        <ArrowUpDown size={11} strokeWidth={1.6} className={cn(sort.key === key ? "text-black" : "text-black/25")} />
      </button>
    </th>
  );

  const toggleOpen = (k: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const renderRow = (g: Group, child = false): React.ReactNode => {
    const x = g.totals;
    const isOpen = open.has(`${by}:${g.key}`);
    const reason = worstReason(g.rows);
    const monthsPct = x.monthsPossible > 0 ? (x.months / x.monthsPossible) * 100 : 0;
    const total = x.embeddedT ?? 0;
    const seg = (n: number) => (total > 0 ? `${(n / total) * 100}%` : "0%");
    const single = g.rows.length === 1 ? g.rows[0] : null;
    return (
      <>
        <tr className={cn("border-t border-black/[0.05] transition-colors hover:bg-[#fafaf8]", child && "bg-[#faf9f7]")}>
          <td className={cn("px-2.5 py-3", child && "pl-11")}>
            <div className="flex items-center gap-2">
              {!child && g.children.length > 0 ? (
                <button type="button" aria-expanded={isOpen} aria-label={t("Show the breakdown")} onClick={() => toggleOpen(`${by}:${g.key}`)} className="grid h-6 w-6 flex-none place-items-center rounded-md text-black/40 hover:bg-black/[0.05] hover:text-black">
                  <ChevronRight size={14} strokeWidth={1.7} className={cn("transition-transform", isOpen && "rotate-90")} />
                </button>
              ) : (
                !child && <span className="w-6 flex-none" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => onPick(g.dim, g.key)} className="max-w-[170px] truncate text-left text-[13.5px] text-black/85 hover:underline" title={t("Look at this one only")}>
                    {t(g.label)}
                  </button>
                  {linkable && single && (
                    <Link href={`/workspaces/${single.facts.id}`} aria-label={t("Open")} title={t("Open")} className="flex-none text-black/30 hover:text-black">
                      <ExternalLink size={12} strokeWidth={1.7} />
                    </Link>
                  )}
                </div>
                <div className="truncate font-mono text-[11px] text-black/35">{g.hint ?? `${g.rows.length} ${g.rows.length === 1 ? t("product report") : t("product reports")}`}</div>
              </div>
            </div>
          </td>
          <td className="px-2.5 py-3 text-right text-[13px] tabular-nums text-black/70">{money.t(x.tonnes)}</td>
          <td className="px-2.5 py-3">
            <div className="text-right text-[13px] tabular-nums text-black/80">{money.t(x.embeddedT)}</div>
            <div className="mt-1.5 flex h-[3px] min-w-[84px] overflow-hidden rounded-full bg-black/[0.07]" title={`${t("Direct")} ${money.t(x.directT)} · ${t("Indirect")} ${money.t(x.indirectT)} · ${t("Precursors")} ${money.t(x.precursorT)}`}>
              <span style={{ width: seg(x.directT), background: "#3C7ACB" }} />
              <span style={{ width: seg(x.indirectT), background: "#047857" }} />
              <span style={{ width: seg(x.precursorT), background: "#b45309" }} />
            </div>
          </td>
          <td className="px-2.5 py-3 text-right">
            {x.gapPct == null ? (
              <span className="text-black/30">—</span>
            ) : (
              <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11.5px] tabular-nums", x.gapPct >= 2 ? toneChip.ok : x.gapPct <= -2 ? toneChip.err : toneChip.muted)}>
                {x.gapPct >= 0 ? "−" : "+"}
                {money.pct(Math.abs(x.gapPct), 0)}
              </span>
            )}
          </td>
          <td className="whitespace-nowrap px-2.5 py-3 text-right text-[13px] tabular-nums text-black/85" title={x.costActualEur == null ? costWhy(g.rows, t) : undefined}>
            {money.full(x.costActualEur)}
            {x.assumedRows > 0 && x.costActualEur != null && (
              <span className="ml-1 text-[#b45309]" title={t("Assumes all the tonnes made were shipped to the EU: no EU volume entered.")}>
                *
              </span>
            )}
          </td>
          <td className="whitespace-nowrap px-2.5 py-3 text-right text-[13px] tabular-nums text-black/50" title={x.costDefaultEur == null ? costWhy(g.rows, t) : undefined}>
            {money.full(x.costDefaultEur)}
          </td>
          <td className="px-2.5 py-3">
            <StatusChip reason={reason} />
            <div className="mt-1.5">
              <ScoreBar width={52} value={monthsPct} tone={reason === "official" ? "ok" : reason === "no_data" ? "muted" : "warn"} />
            </div>
          </td>
        </tr>
        {!child && isOpen && g.children.map((c) => <React.Fragment key={`${g.key}/${c.key}`}>{renderRow(c, true)}</React.Fragment>)}
      </>
    );
  };

  return (
    <Panel
      title={t("Compare")}
      sub={t("Every installation, product and reporting year, side by side")}
      className="!p-0"
      bodyClassName="!px-0 !pb-0 !pt-3"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <SearchPill value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder={t("Search a name, product or year")} className="w-full sm:w-64" />
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pb-3 sm:px-6">
        <div className="flex items-center gap-2 text-[12px] text-black/45">
          <span>{t("Compare by")}</span>
          <Segmented<Dim> value={by} onChange={(d) => { onBy(d); onThen(null); setPage(1); setOpen(new Set()); }} options={DIMS.map((d) => ({ value: d, label: dimLabel(d, t) }))} ariaLabel={t("Compare by")} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead className="border-b border-black/[0.07] bg-[#faf9f7]">
            <tr>
              {th("name", dimLabel(by, t))}
              {th("tonnes", t("Made (t)"), true)}
              {th("embedded", t("Embedded (tCO₂e)"), true)}
              {th("gap", t("vs EU default"), true)}
              {th("cost", t("Cost, your data"), true)}
              <th scope="col" className={cn("px-2.5 py-3 text-right", TH)}>
                {t("Cost, EU default")}
              </th>
              <th scope="col" className={cn("px-2.5 py-3 text-left", TH)}>
                {t("Status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {view.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[13px] text-black/40">
                  {t("Nothing matches that.")}
                </td>
              </tr>
            ) : (
              view.rows.map((g) => <React.Fragment key={g.key}>{renderRow(g)}</React.Fragment>)
            )}
          </tbody>
        </table>
      </div>
      <TablePager page={view.page} pageCount={view.pageCount} size={size} onPage={setPage} onSize={(n) => { setSize(n); setPage(1); }} total={filtered.length} />
    </Panel>
  );
}

/* ── Bars: your data against the default, per group ──────────── */
export function CostBarsCard({ rows, by, money }: { rows: PricedRow[]; by: Dim; money: Money }) {
  const t = useT();
  const groups = groupRows(rows, by, null).filter((g) => g.totals.costDefaultEur != null);
  const shown = groups.slice(0, 8);
  const max = Math.max(1, ...shown.map((g) => g.totals.costDefaultEur ?? 0));
  return (
    <Panel title={t("Your data against the EU default")} caption={t("Certificate cost, by {dim}", { dim: dimLabel(by, t).toLowerCase() })}
      action={
        <div className="flex items-center gap-4 text-[12px] text-black/55">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#111]" />{t("With your data")}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-black/20" />{t("On the EU default")}</span>
        </div>
      }
    >
      {shown.length === 0 ? (
        <div className="grid h-40 place-items-center rounded-xl border border-dashed border-black/10 text-[12.5px] text-black/40">{t("No cost to draw yet")}</div>
      ) : (
        <ul className="space-y-5">
          {shown.map((g) => {
            const a = g.totals.costActualEur ?? 0;
            const d = g.totals.costDefaultEur ?? 0;
            return (
              <li key={g.key}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="min-w-0 truncate text-black/80">{t(g.label)}</span>
                  <span className="flex-none text-[12px] tabular-nums text-[#047857]">{g.totals.savingPct != null ? `−${money.pct(g.totals.savingPct, 0)}` : ""}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-black/[0.04]">
                      <div className="h-full rounded-full bg-[#111]" style={{ width: `${(a / max) * 100}%` }} />
                    </div>
                    <span className="w-24 flex-none text-right text-[12px] tabular-nums text-black/80">{money.compact(a)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-black/[0.04]">
                      <div className="h-full rounded-full bg-black/20" style={{ width: `${(d / max) * 100}%` }} />
                    </div>
                    <span className="w-24 flex-none text-right text-[12px] tabular-nums text-black/45">{money.compact(d)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export { REASON_ORDER };

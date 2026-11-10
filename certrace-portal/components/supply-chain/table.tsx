"use client";

/* ════════════════════════════════════════════════════════════
   SUPPLY CHAIN — THE LIST

   Everyone in the chain, two lists in one table: the plants that answer a
   monthly link and the
   suppliers of what is bought in (asked once, for a verified figure).

   WHAT A ROW SAYS AT A GLANCE
     plant       the twelve months as twelve small squares — answered, late,
                 waiting, ready to send, not yet — so a late run reads as a
                 shape; then the score, and the state
     precursor   how far the invitation has got, what the figure rests on, the
                 four report checks as four dots, and its share of the emissions
   and opening a row shows the score taken apart and its worries.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronRight, ExternalLink } from "lucide-react";
import { Chip, FilterChip, cn, type Tone } from "@/components/ui";
import {
  Panel,
  ScoreBar,
  SearchPill,
  Segmented,
  TH,
  TONE_HEX,
  TablePager,
  paginate,
} from "@/components/insight/kit";
import { useFormat, useT } from "@/lib/i18n";
import {
  CHAIN_STATES,
  STATE_LABEL,
  type ChainState,
  type MonthCell,
  type PlantHealth,
  type PrecursorHealth,
} from "@/lib/cbam/supply-chain-model";
import { StateChip, STATE_COLOR, concernText } from "./overview";

export type Tab = "plants" | "precursors";

const CELL_COLOR: Record<MonthCell, string> = {
  done: "#047857",
  late: "#dc2626",
  waiting: "#60a5fa",
  send: "#facc15",
  later: "rgba(17,17,17,0.10)",
};
const CELL_LABEL: Record<MonthCell, string> = {
  done: "Answered",
  late: "Past the deadline",
  waiting: "Waiting",
  send: "Ready to send",
  later: "Not yet",
};
const CELL_RANK: Record<MonthCell, number> = {
  late: 0,
  send: 1,
  waiting: 2,
  done: 3,
  later: 4,
};

/** The twelve months of the latest year, one square each; where a plant has several reports the worst of them shows. */
function MonthStrip({ h, locale }: { h: PlantHealth; locale: string }) {
  const year = Math.max(...h.facts.years, 0);
  const by = new Map<string, MonthCell>();
  for (const m of h.facts.months) {
    if (m.year !== year) continue;
    const cur = by.get(m.month);
    if (!cur || CELL_RANK[m.cell] < CELL_RANK[cur]) by.set(m.month, m.cell);
  }
  return (
    <span
      className="inline-flex items-center gap-[3px]"
      role="img"
      aria-label={`${year}`}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const key = `${year}-${String(i + 1).padStart(2, "0")}`;
        const cell = by.get(key) ?? "later";
        const name = new Date(year, i, 1).toLocaleDateString(locale, {
          month: "long",
        });
        return (
          <span
            key={key}
            title={`${name} ${year}`}
            className="h-[14px] w-[9px] rounded-[3px]"
            style={{ background: CELL_COLOR[cell] }}
          />
        );
      })}
    </span>
  );
}

function Checks({ h }: { h: PrecursorHealth }) {
  const t = useT();
  const c = h.facts.checks;
  if (!c) return <span className="text-[12px] text-black/30">—</span>;
  const items: [string, boolean][] = [
    [t("Accreditation valid"), c.accreditation],
    [t("Scope covers the good"), c.scope],
    [t("Period covered"), c.period],
    [t("File on record"), c.file],
  ];
  return (
    <span
      className="inline-flex items-center gap-1.5"
      role="img"
      aria-label={t("The four report checks")}
    >
      {items.map(([label, ok]) => (
        <span
          key={label}
          title={`${label}: ${ok ? t("passed") : t("failed")}`}
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: ok ? "#047857" : "#dc2626" }}
        />
      ))}
    </span>
  );
}

const BASIS_TONE: Record<string, Tone> = {
  verified: "ok",
  unverified: "warn",
  default: "err",
};
const BASIS_LABEL: Record<string, string> = {
  verified: "Verified",
  unverified: "No report",
  default: "Default value",
};
const PHASE_LABEL: Record<string, string> = {
  not_sent: "Not invited",
  sent: "Invited",
  opened: "Opened",
  submitted: "Answered",
};
const PHASE_TONE: Record<string, Tone> = {
  not_sent: "muted",
  sent: "info",
  opened: "info",
  submitted: "ok",
};

type SortKey = "name" | "score" | "state" | "share" | "activity";

export function ChainTable({
  tab,
  onTab,
  plants,
  precursors,
  state,
  onState,
  linkable,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  plants: PlantHealth[];
  precursors: PrecursorHealth[];
  state: ChainState | null;
  onState: (s: ChainState | null) => void;
  linkable: boolean;
}) {
  const t = useT();
  const { locale, date } = useFormat();
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "state",
    dir: 1,
  });
  const [open, setOpen] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(6);

  const stateRank = (s: ChainState) => CHAIN_STATES.indexOf(s);
  const list = (tab === "plants" ? plants : precursors) as (
    | PlantHealth
    | PrecursorHealth
  )[];
  const counts = CHAIN_STATES.reduce(
    (a, s) => ({ ...a, [s]: list.filter((x) => x.state === s).length }),
    {} as Record<ChainState, number>,
  );

  const nameOf = (x: PlantHealth | PrecursorHealth) =>
    "months" in x.facts ? x.facts.name : x.facts.company || x.facts.product;
  const textOf = (x: PlantHealth | PrecursorHealth) =>
    "months" in x.facts
      ? `${x.facts.name} ${x.facts.company} ${x.facts.contact?.name ?? ""} ${x.facts.products.join(" ")}`
      : `${x.facts.company} ${x.facts.installation} ${x.facts.product} ${x.facts.feeds} ${x.facts.cnCode} ${x.facts.country}`;

  const rows = list
    .filter((x) => (state ? x.state === state : true))
    .filter(
      (x) =>
        !query.trim() ||
        textOf(x).toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      const v = (x: PlantHealth | PrecursorHealth): number | string => {
        switch (sort.key) {
          case "name":
            return nameOf(x).toLowerCase();
          case "score":
            return x.score ?? -1;
          case "share":
            return "months" in x.facts ? 0 : (x.facts.contribution ?? -1);
          case "activity":
            return x.lastActivity ?? "";
          default:
            return stateRank(x.state);
        }
      };
      const va = v(a);
      const vb = v(b);
      const c =
        typeof va === "string"
          ? va.localeCompare(vb as string)
          : (va as number) - (vb as number);
      return (c || (a.score ?? 0) - (b.score ?? 0)) * sort.dir;
    });
  const view = paginate(rows, page, size);

  const th = (key: SortKey, label: string, right = false) => (
    <th
      scope="col"
      className={cn("px-3 py-3", TH, right ? "text-right" : "text-left")}
    >
      <button
        type="button"
        onClick={() =>
          setSort((s) =>
            s.key === key
              ? { key, dir: (s.dir * -1) as 1 | -1 }
              : { key, dir: key === "name" ? 1 : key === "state" ? 1 : -1 },
          )
        }
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap hover:text-black",
          right && "flex-row-reverse",
        )}
      >
        {label}
        <ArrowUpDown
          size={11}
          strokeWidth={1.6}
          className={cn(sort.key === key ? "text-black" : "text-black/25")}
        />
      </button>
    </th>
  );
  const plainTh = (label: string, right = false) => (
    <th
      scope="col"
      className={cn("px-3 py-3", TH, right ? "text-right" : "text-left")}
    >
      {label}
    </th>
  );

  const lastSeen = (iso: string | null) =>
    iso ? date(iso, { day: "numeric", month: "short" }) : "—";

  const detail = (x: PlantHealth | PrecursorHealth) => (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-[11px] uppercase tracking-[0.08em] text-black/40">
            {t("The score, taken apart")}
          </h4>
          <ul className="space-y-3">
            {x.aspects.map((a) => (
              <li key={a.key}>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="text-black/65">{t(a.label)}</span>
                  <span className="tabular-nums text-black/75">
                    {a.value == null
                      ? t("Not measured yet")
                      : Math.round(a.value)}
                  </span>
                </div>
                <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-black/[0.07]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${a.value ?? 0}%`,
                      background:
                        a.value == null
                          ? "transparent"
                          : a.value >= 75
                            ? TONE_HEX.ok
                            : a.value >= 50
                              ? TONE_HEX.warn
                              : TONE_HEX.err,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-[11px] uppercase tracking-[0.08em] text-black/40">
            {t("What worries us")}
          </h4>
          {x.concerns.length === 0 ? (
            <p className="text-[12.5px] text-black/40">{t("Nothing.")}</p>
          ) : (
            <ul className="space-y-2.5">
              {x.concerns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-2 text-[12.5px] leading-snug text-black/65"
                >
                  <span
                    className="mt-[6px] h-1.5 w-1.5 flex-none rounded-full"
                    style={{
                      background:
                        c.severity === "high"
                          ? "#dc2626"
                          : c.severity === "medium"
                            ? "#b45309"
                            : "#c7c5be",
                    }}
                  />
                  {concernText(c, t)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {linkable && (
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-black/[0.06] pt-4 text-[12px] uppercase tracking-[0.08em]">
          {"months" in x.facts ? (
            <Link
              href={`/workspaces/${x.facts.reportIds[0]}/monthly`}
              className="inline-flex items-center gap-1.5 text-black/50 hover:text-black"
            >
              {t("Open monthly data")}{" "}
              <ExternalLink size={11} strokeWidth={1.6} />
            </Link>
          ) : (
            <Link
              href={`/workspaces/${x.facts.workspaceId}/precursors`}
              className="inline-flex items-center gap-1.5 text-black/50 hover:text-black"
            >
              {t("Open the precursor")}{" "}
              <ExternalLink size={11} strokeWidth={1.6} />
            </Link>
          )}
          <Link
            href="/smart-links"
            className="inline-flex items-center gap-1.5 text-black/50 hover:text-black"
          >
            {t("Smart links")} <ExternalLink size={11} strokeWidth={1.6} />
          </Link>
        </div>
      )}
    </div>
  );

  const plantRow = (h: PlantHealth) => {
    const f = h.facts;
    const isOpen = open === f.id;
    return (
      <React.Fragment key={f.id}>
        <tr className="border-t border-black/[0.05] transition-colors hover:bg-[#fafaf8]">
          <td className="px-3 py-3.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={t("Show the detail")}
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="grid h-6 w-6 flex-none place-items-center rounded-md text-black/40 hover:bg-black/[0.05] hover:text-black"
              >
                <ChevronRight
                  size={14}
                  strokeWidth={1.7}
                  className={cn("transition-transform", isOpen && "rotate-90")}
                />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="max-w-[210px] truncate text-[13.5px] text-black/85">
                    {f.name}
                  </span>
                  {f.own && (
                    <span className="rounded-full border border-black/10 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-black/40">
                      {t("Own site")}
                    </span>
                  )}
                </div>
                <div className="truncate text-[11.5px] text-black/40">
                  {f.own
                    ? f.products.map((x) => t(x)).join(" · ")
                    : f.company || f.products.map((x) => t(x)).join(" · ")}
                </div>
              </div>
            </div>
          </td>
          <td className="px-3 py-3.5">
            <MonthStrip h={h} locale={locale} />
            <div className="mt-1.5 font-mono text-[10.5px] text-black/35">
              {h.counts.done}/{h.facts.months.length - h.counts.later}{" "}
              {t("answered")}
              {h.counts.late > 0 && (
                <span className="text-[#dc2626]">
                  {" "}
                  · {h.counts.late} {t("late")}
                </span>
              )}
            </div>
          </td>
          <td className="px-3 py-3.5">
            <ScoreBar
              value={h.score}
              tone={
                h.score == null
                  ? "muted"
                  : h.score >= 75
                    ? "ok"
                    : h.score >= 50
                      ? "warn"
                      : "err"
              }
            />
          </td>
          <td className="px-3 py-3.5">
            <StateChip state={h.state} />
          </td>
          <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono text-[12px] text-black/50">
            {lastSeen(h.lastActivity)}
          </td>
        </tr>
        {isOpen && (
          <tr className="bg-[#faf9f7]">
            <td colSpan={5} className="px-6 py-5">
              {detail(h)}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const precursorRow = (h: PrecursorHealth) => {
    const f = h.facts;
    const isOpen = open === f.id;
    return (
      <React.Fragment key={f.id}>
        <tr className="border-t border-black/[0.05] transition-colors hover:bg-[#fafaf8]">
          <td className="px-3 py-3.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={t("Show the detail")}
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="grid h-6 w-6 flex-none place-items-center rounded-md text-black/40 hover:bg-black/[0.05] hover:text-black"
              >
                <ChevronRight
                  size={14}
                  strokeWidth={1.7}
                  className={cn("transition-transform", isOpen && "rotate-90")}
                />
              </button>
              <div className="min-w-0">
                <div className="max-w-[210px] truncate text-[13.5px] text-black/85">
                  {f.company || f.installation}
                </div>
                <div className="truncate text-[11.5px] text-black/40">
                  {f.product} · {f.country}
                </div>
              </div>
            </div>
          </td>
          <td className="px-3 py-3.5">
            <Chip
              tone={PHASE_TONE[f.phase]}
              filled
              pulse={false}
              className="whitespace-nowrap"
            >
              {t(PHASE_LABEL[f.phase])}
            </Chip>
            <div className="mt-1.5 font-mono text-[10.5px] text-black/35">
              {h.late ? (
                <span className="text-[#dc2626]">
                  {t("past the year's end")}
                </span>
              ) : h.waitingDays != null ? (
                t("{n} days ago", { n: h.waitingDays })
              ) : f.phase === "submitted" ? (
                lastSeen(f.submittedAt)
              ) : (
                "—"
              )}
            </div>
          </td>
          <td className="px-3 py-3.5">
            <Chip
              tone={BASIS_TONE[f.basis]}
              filled
              pulse={false}
              className="whitespace-nowrap"
            >
              {t(BASIS_LABEL[f.basis])}
            </Chip>
            <div className="mt-1.5">
              <Checks h={h} />
            </div>
          </td>
          <td className="px-3 py-3.5 text-right">
            <div className="text-[13px] tabular-nums text-black/80">
              {f.contribution != null
                ? `${Math.round(f.contribution * 100)}%`
                : "—"}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-black/35">
              {f.feeds}
            </div>
          </td>
          <td className="px-3 py-3.5">
            <ScoreBar
              value={h.score}
              tone={
                h.score == null
                  ? "muted"
                  : h.score >= 75
                    ? "ok"
                    : h.score >= 50
                      ? "warn"
                      : "err"
              }
            />
          </td>
          <td className="px-3 py-3.5">
            <StateChip state={h.state} />
          </td>
        </tr>
        {isOpen && (
          <tr className="bg-[#faf9f7]">
            <td colSpan={6} className="px-6 py-5">
              {detail(h)}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <Panel
      title={t("Everyone in the chain")}
      sub={
        tab === "plants"
          ? t(
              "The plants that fill in your months — your own sites and your suppliers'",
            )
          : t("Suppliers of what you buy in, each asked once a year")
      }
      className="!p-0"
      bodyClassName="!px-0 !pb-0 !pt-3"
      action={
        <SearchPill
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder={t("Search a name or a product")}
          className="w-full sm:w-72"
        />
      }
    >
      <div className="space-y-3 px-5 pb-3 sm:px-6">
        <Segmented<Tab>
          value={tab}
          onChange={(v) => {
            onTab(v);
            setPage(1);
            setOpen(null);
          }}
          ariaLabel={t("Which list")}
          options={[
            { value: "plants", label: `${t("Suppliers")} · ${plants.length}` },
            {
              value: "precursors",
              label: `${t("Precursors")} · ${precursors.length}`,
            },
          ]}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            active={state == null}
            onClick={() => {
              onState(null);
              setPage(1);
            }}
          >
            {t("All")} · {list.length}
          </FilterChip>
          {CHAIN_STATES.map((s) => (
            <FilterChip
              key={s}
              active={state === s}
              onClick={() => {
                onState(state === s ? null : s);
                setPage(1);
              }}
            >
              <span
                className="mr-1.5 h-1.5 w-1.5 rounded-full"
                style={{ background: STATE_COLOR[s] }}
              />
              {t(STATE_LABEL[s])} · {counts[s]}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead className="border-b border-black/[0.07] bg-[#faf9f7]">
            {tab === "plants" ? (
              <tr>
                {th("name", t("Plant"))}
                {plainTh(t("Months"))}
                {th("score", t("Health"))}
                {th("state", t("Status"))}
                {th("activity", t("Last activity"), true)}
              </tr>
            ) : (
              <tr>
                {th("name", t("Supplier"))}
                {plainTh(t("Invitation"))}
                {plainTh(t("Data and report checks"))}
                {th("share", t("Share of emissions"), true)}
                {th("score", t("Health"))}
                {th("state", t("Status"))}
              </tr>
            )}
          </thead>
          <tbody>
            {view.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-[13px] text-black/40"
                >
                  {list.length === 0
                    ? tab === "plants"
                      ? t(
                          "No plants yet. They appear with the first product report.",
                        )
                      : t(
                          "No precursor suppliers yet. Add them in a product report's Precursors tab.",
                        )
                    : t("Nothing matches that.")}
                </td>
              </tr>
            ) : tab === "plants" ? (
              view.rows.map((h) => plantRow(h as PlantHealth))
            ) : (
              view.rows.map((h) => precursorRow(h as PrecursorHealth))
            )}
          </tbody>
        </table>
      </div>

      {tab === "plants" && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-black/[0.05] px-5 py-3 text-[11.5px] text-black/45 sm:px-6">
          <span className="text-black/30">{t("Each square is a month")}</span>
          {(Object.keys(CELL_COLOR) as MonthCell[]).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span
                className="h-[10px] w-[7px] rounded-[2px]"
                style={{ background: CELL_COLOR[c] }}
              />
              {t(CELL_LABEL[c])}
            </span>
          ))}
        </div>
      )}
      <TablePager
        page={view.page}
        pageCount={view.pageCount}
        size={size}
        onPage={setPage}
        onSize={(n) => {
          setSize(n);
          setPage(1);
        }}
        total={rows.length}
      />
    </Panel>
  );
}

"use client";

/* ════════════════════════════════════════════════════════════
   CARBON & COST — what is in the goods, and how that compares

   THE PAGE ASKS TWO QUESTIONS AND ANSWERS BOTH AT A CHOSEN SCOPE:

     1 · How much carbon is embedded in what I make?
     2 · How does that compare to what a buyer would otherwise assume — the
         EU default value they must use when nobody gives them a real figure?

   Everything on the screen serves one of those two, in this order:

     · the two pickers — which reporting year, and what inside it
     · whether the answer is official yet, and if not, what is missing
     · the four lines, month by month, with the EU default across them
     · the two figures — measured, or carried to a full year if you ask
     · what each precursor contributes, once you have named one product

   ── WHY THE PICKERS ARE AT THE TOP AND NOT BURIED ──────────────
   Both headline figures were once portfolio-wide and only portfolio-wide.
   That is a fine first answer and a useless second one: no buyer purchases a
   portfolio and no verifier signs one off, so an exporter preparing for
   either conversation needs the product. The pickers change every figure
   below them at once, which is why they sit above them all rather than on the
   one card that used to have them.

   TWO PICKERS, NOT ONE, and the year comes first. The single dropdown summed
   every workspace across every year into one tonne count, and a tonne count
   with no reporting period behind it is not a CBAM figure at all — the
   regulation is written in years, a verifier signs a year, a buyer asks about
   a year. See lib/cbam/carbon-scope.ts.

   ── OFFICIAL, OR NOT ───────────────────────────────────────────
   The same arithmetic means two different things depending on what went into
   it: four submitted months scaled up and twelve verified months both print
   as a tonne count, and only one of them can be sent to a buyer. So the
   figures never appear without their standing beside them, naming which of
   the two things is missing — a part of the year, or the verified precursor
   figures behind it — because those are fixed on two different screens.

   ── THE PROJECTION IS A SWITCH, NOT A SECTION ──────────────────
   It used to be a permanent second pair of cards headed PROJECTED FULL YEAR,
   and on the overwhelmingly common visit both of them read "nothing to
   project from yet" — a card whose normal state is a sentence explaining its
   own absence. It is now a control beside the pickers that changes the two
   cards already on screen, and it is only offered where a projection means
   anything: ONE product, PART WAY through its year. A finished year has
   nothing to extrapolate, an empty one has no rate to carry forward, and
   several products at once would scale each on a pooled ratio that carries
   the busiest product's intensity across the quietest one's empty months.

   ── WHAT WAS REMOVED, AND WHY ──────────────────────────────────
   Five blocks came off this page before those. Every one of them was a card
   whose normal state was a sentence explaining that it had nothing to show:
   COST AVOIDANCE, AGAINST THE DEFAULT (now the dashed rule ON the chart,
   where it is read against something), BUYER-READY STATUS, COST BY BUYER and
   EMISSION INTENSITY BY QUARTER (replaced, not deleted: it is the Total line
   of the chart, now monthly and beside the three components it is made of) —
   and the DEFERRED-FORECAST NOTICE, a dashed box explaining that a multi-year
   forecast is not shown. A permanent paragraph about a feature that does not
   exist is not a disclosure, it is furniture; the reason it does not exist is
   still recorded in the PHASE_IN_FACTORS comment in lib/cbam/cost-exposure.ts,
   which is what any future author would read before adding one.

   NOTHING THAT COULD COMPUTE WAS REMOVED. Every deleted block was reporting
   its own absence; the modules behind them (cost-exposure, buyer-projection,
   dashboard-aggregates) are untouched and still drive the dashboard widgets
   that have the context to make them mean something.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Coins, TrendingUp } from "lucide-react";
import { cn, EmptyState, PageHeader } from "@/components/ui";
import { Select } from "@/components/controls";
import { useClientData } from "@/components/workspace/chrome";
import { useFormat, useT, type TFunction } from "@/lib/i18n";
import { listWorkspaces, type VerificationWorkspace } from "@/lib/workspace";
import type { WorkspaceSEE } from "@/lib/workspace-see";
import { precursorContribution } from "@/lib/precursor-suppliers";
import {
  emissionsChartData,
  isSingleProduct,
  reportingYears,
  scopeFigures,
  scopeOptions,
  scopeProduction,
  scopeProjection,
  seeMapFor,
  workspacesInScope,
  workspacesInYear,
  SCOPE_ALL,
  type ScopeOption,
} from "@/lib/cbam/carbon-scope";
import { CarbonCostKpiHeader, StandingChip, standingDetail } from "@/components/carbon-cost/kpi-header";
import { EmissionsChart } from "@/components/carbon-cost/emissions-chart";
import { PrecursorBreakdown } from "@/components/carbon-cost/precursor-breakdown";

type Data = {
  workspaces: VerificationWorkspace[];
  seeByWorkspace: Map<string, WorkspaceSEE>;
  years: number[];
};

function build(): Data {
  const workspaces = listWorkspaces();
  return { workspaces, seeByWorkspace: seeMapFor(workspaces), years: reportingYears(workspaces) };
}

export default function CarbonCostPage() {
  const t = useT();
  const { number } = useFormat();
  const [data] = useClientData(build);
  /* null until the first client read tells us which years exist — the newest
     one is then the landing state, because the year an exporter is working on
     is overwhelmingly the current one. Held as state rather than derived so a
     later choice sticks when the store is re-read. */
  const [year, setYear] = React.useState<number | null>(null);
  const [scope, setScope] = React.useState<string>(SCOPE_ALL);
  /* What the reader ASKED for, which is not always what is shown: a scope
     that cannot be projected renders measured figures whatever this says. The
     preference is kept rather than reset, so moving from a part-year product
     to a finished one and back does not lose the switch. */
  const [wantProjection, setWantProjection] = React.useState(false);

  const activeYear = year != null && data?.years.includes(year) ? year : (data?.years[0] ?? null);
  const inYear = React.useMemo(
    () => (data && activeYear != null ? workspacesInYear(data.workspaces, activeYear) : []),
    [data, activeYear],
  );
  const options = React.useMemo(() => scopeOptions(inYear), [inYear]);
  /* The pickers' own wording, done HERE rather than in the module that
     computed the scopes — see ScopeOption's comment for why. A product's name
     and an installation's name pass through untouched in both languages;
     everything that is a phrase goes through t(). */
  const optionRows = React.useMemo(() => options.map((o) => ({ value: o.value, label: optionLabel(o, t), hint: optionHint(o, t) })), [options, t]);

  /* A scope that no longer resolves — the workspace was archived in another
     tab, or the year moved under it — falls back to "all products in this
     year" rather than showing an empty page under a product's name. */
  const resolved = React.useMemo(() => {
    if (inYear.length === 0) return null;
    const chosen = workspacesInScope(inYear, scope);
    return chosen.length > 0 ? { value: scope, workspaces: chosen } : { value: SCOPE_ALL, workspaces: inYear };
  }, [inYear, scope]);

  const figures = React.useMemo(
    () => (data && resolved ? scopeFigures(resolved.workspaces, data.seeByWorkspace) : null),
    [data, resolved],
  );

  const standing = figures?.standing ?? null;
  const canProject = Boolean(standing?.projectable);
  const projecting = wantProjection && canProject;
  const projection = React.useMemo(() => (figures && canProject ? scopeProjection(figures) : null), [figures, canProject]);

  const scopeLabel = React.useMemo(() => {
    if (!resolved) return "";
    return optionRows.find((o) => o.value === resolved.value)?.label ?? t("All products");
  }, [optionRows, resolved, t]);

  /* The chart draws ONE workspace — per-tonne figures for different goods are
     not comparable (see the chart's own header). When the scope holds several,
     it draws the first one that HAS something to draw, and the card says it is
     showing one of them.

     "First that has data" rather than plainly "first" is the whole difference
     between a useful default and a broken-looking one: an estate where two
     products are untouched and the third has eight months in would otherwise
     open on an empty chart saying "no submitted months yet" while eight months
     of readings sat one selection away. Falls back to the first in scope when
     nothing has data, so the empty state still names a real product. */
  const chartWorkspace = React.useMemo(() => {
    if (!data || !resolved) return null;
    const withData = resolved.workspaces.find((w) => {
      const see = data.seeByWorkspace.get(w.id);
      return see != null && see.months.some((m) => m.counted && m.productionTonnes > 0);
    });
    return withData ?? resolved.workspaces[0] ?? null;
  }, [data, resolved]);

  const chart =
    data && chartWorkspace
      ? emissionsChartData(
          chartWorkspace,
          data.seeByWorkspace.get(chartWorkspace.id)!,
          (resolved?.workspaces.length ?? 0) > 1,
          projecting,
        )
      : null;

  /* THE PRECURSOR BREAKDOWN IS A ONE-PRODUCT ANSWER. It is a recipe — how
     much of a tonne of THIS good came out of each thing bought in — and
     several recipes stacked under one heading is a list of unrelated tables
     that happen to share a page. On "All products" it was also the longest
     thing on the screen by a wide margin, so the page ended in five cards of
     other people's chains rather than in the figures it exists for. Name a
     product and it appears. */
  const showPrecursors = Boolean(resolved && isSingleProduct(resolved.value));

  /* The production summary under the pickers, worded here for the same reason
     the picker rows are. `number()` follows the interface language too, so a
     tonne count is grouped the way the reader expects. */
  const production = figures ? scopeProduction(figures) : null;
  const productionLine = !production
    ? ""
    : production.kind === "none"
      ? t("No months submitted yet")
      : production.kind === "started"
        ? production.months === 1
          ? t("1 month started, none submitted yet")
          : t("{count} months started, none submitted yet", { count: production.months })
        : production.months === 1
          ? t("{tonnes} t from 1 submitted month", { tonnes: number(production.tonnes, { maximumFractionDigits: 0 }) })
          : t("{tonnes} t from {count} submitted months", {
              tonnes: number(production.tonnes, { maximumFractionDigits: 0 }),
              count: production.months,
            });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Carbon & Cost")}
        title={t("What your numbers are worth")}
        lead={t(
          "How much carbon is embedded in what you make, and how far that sits under the EU default a buyer would otherwise have to assume. Pick a year, then a product to negotiate with — or read the whole year at once.",
        )}
      />

      {data === null ? null : data.workspaces.length === 0 || activeYear == null ? (
        <EmptyState
          icon={<Coins size={28} strokeWidth={1.25} />}
          title={t("Nothing to show yet")}
          body={t("This page fills itself in once you have a verification workspace with at least one submitted month of production.")}
        />
      ) : (
        <>
          {/* ── The scope, and what it currently covers ─────────
              Pickers left, state right: what you CHOOSE and what that choice
              turns out to BE are two different jobs, and putting them at
              opposite ends of one line keeps the reader from hunting for the
              second among the first. Stacks on a phone, where "opposite ends"
              is four inches and there are no ends. */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-[28rem] lg:flex-none">
                <Select
                  value={String(activeYear)}
                  onChange={(v) => setYear(Number(v))}
                  options={data.years.map((y) => ({
                    value: String(y),
                    label: t("{year} reporting year", { year: y }),
                    hint: undefined,
                  }))}
                  ariaLabel={t("Reporting year")}
                />
                <Select
                  value={resolved?.value ?? SCOPE_ALL}
                  onChange={setScope}
                  options={optionRows}
                  ariaLabel={t("Which products these figures cover")}
                  searchable={optionRows.length > 8}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {standing && <StandingChip standing={standing} />}
                <ProjectionToggle on={projecting} enabled={canProject} onToggle={() => setWantProjection((v) => !v)} />
              </div>
            </div>

            {figures && standing && (
              <p className="max-w-3xl text-[12.5px] leading-relaxed text-black/45">
                {standingDetail(standing, t)} <span className="font-mono text-[11.5px] text-black/35">{productionLine}</span>
              </p>
            )}
          </div>

          {chart && chartWorkspace && <EmissionsChart data={chart} workspace={chartWorkspace} />}

          {figures && (
            <CarbonCostKpiHeader figures={figures} projection={projection} projecting={projecting} scopeLabel={scopeLabel} />
          )}

          {/* One product, and only where a chain actually contributes
              something — a precursor table with no rows is the same empty
              card this page just lost five of. */}
          {showPrecursors &&
            resolved?.workspaces.map((w) => {
              const result = precursorContribution(w);
              if (result.byNode.length === 0) return null;
              return <PrecursorBreakdown key={w.id} workspace={w} result={result} />;
            })}
        </>
      )}
    </div>
  );
}

/* ── The projection switch ──────────────────────────────────────
   A FILTER, in the shape every other filter in the portal uses: pressed is
   filled, unpressed is outlined, and `aria-pressed` says which so it is not
   only the fill that carries the state.

   DISABLED RATHER THAN HIDDEN. A control that vanishes when it does not apply
   makes the reader wonder whether they imagined it, and gives them nowhere to
   read WHY — which is the more useful half of the answer here, because "your
   year is already complete" and "you have not submitted a month yet" are
   opposite problems with opposite next steps. The reason rides on the title,
   where a disabled control is the only place it can go. */
function ProjectionToggle({ on, enabled, onToggle }: { on: boolean; enabled: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={!enabled}
      onClick={onToggle}
      title={
        enabled
          ? t("Carry the months you have submitted across the rest of the year, at the same rate. An assumption, not a forecast.")
          : t("A projection is only offered for one product part-way through its year — a finished year has nothing to extrapolate, and an empty one has no rate to carry forward.")
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors",
        on
          ? "border-black bg-[#111] text-white hover:bg-[#333]"
          : "border-black/12 text-black/55 hover:border-black/30 hover:bg-black/[0.03] hover:text-black",
        !enabled && "cursor-not-allowed opacity-40 hover:border-black/12 hover:bg-transparent hover:text-black/55",
      )}
    >
      <TrendingUp size={13} strokeWidth={1.5} />
      {t("Project full year")}
    </button>
  );
}

/* ── The picker rows, worded ────────────────────────────────────
   A proper noun is handed through untouched; a phrase goes through t(). Kept
   out of the component so the two are a single expression each and the memo
   above stays readable. */
function optionLabel(o: ScopeOption, t: TFunction): string {
  return o.label.kind === "all" ? t("All products") : o.label.name;
}

function optionHint(o: ScopeOption, t: TFunction): string {
  if (o.hint.kind === "name") return o.hint.name;
  if (o.hint.kind === "installation_products")
    return t("Everything made here · {count} products", { count: o.hint.count });
  return o.hint.count === 1 ? t("1 product") : t("{count} products, added together", { count: o.hint.count });
}

"use client";

/* ════════════════════════════════════════════════════════════
   CARBON & COST — what your goods carry, and what that costs

   Two questions, answered at any slice of the estate:

     1 · How much carbon is embedded in what I make — direct, electricity,
         bought-in — and how does that compare with what the EU would assume?
     2 · What do the certificates cost with my own data, and what would they
         have cost on the EU default if nobody had given the buyer a real
         figure? Per tonne, per piece, beside the energy and the price.

   THE SLICE is three filters — reporting year, installation, product — and the
   comparison table turns the same figures by installation, product or year.
   Nothing on the page is stored here: every figure is read, each time, from the
   stores the rest of the portal writes (lib/cbam/carbon-cost-read.ts), and the
   page re-reads when another window changes one.

   WHY THE COST IS NOT 2.5 % OF THE EMISSIONS. See lib/cbam/carbon-cost-model.ts:
   the certificate bill is the emissions minus the free allocation an EU
   producer gets (CBAM factor × benchmark). For a Thai scrap-EAF good the
   benchmark is tiny, so nearly all of the emissions are payable.

   Only the account's own product reports are shown. Without any reports, the
   page shows its empty state rather than a made-up estate.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, TrendingUp } from "lucide-react";
import {
  ButtonLink,
  EmptyState,
  FilterChip,
  PageHeader,
  cn,
} from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { Select } from "@/components/controls";
import { Segmented } from "@/components/insight/kit";
import { useT } from "@/lib/i18n";
import { useStoreSync } from "@/lib/use-store-sync";
import { getWorkspace } from "@/lib/workspace";
import { workspaceSEE } from "@/lib/workspace-see";
import { precursorContribution } from "@/lib/precursor-suppliers";
import {
  emissionsChartData,
  type ScopeStanding,
} from "@/lib/cbam/carbon-scope";
import {
  monthlySeries,
  priceFacts,
  totalsOf,
  CURRENCIES,
  type CostFacts,
  type Currency,
  type Dim,
} from "@/lib/cbam/carbon-cost-model";
import { costEnv, readCostFacts } from "@/lib/cbam/carbon-cost-read";
import {
  StandingChip,
  standingDetail,
} from "@/components/carbon-cost/kpi-header";
import { EmissionsChart } from "@/components/carbon-cost/emissions-chart";
import { PrecursorBreakdown } from "@/components/carbon-cost/precursor-breakdown";
import {
  BreakdownCard,
  CostHeroCard,
  EmissionsChartCard,
  KpiGrid,
} from "@/components/carbon-cost/overview";
import { CompareCard, CostBarsCard } from "@/components/carbon-cost/compare";
import {
  UnitCostCard,
  type UnitBasis,
} from "@/components/carbon-cost/unit-costs";
import { AssumptionsCard } from "@/components/carbon-cost/assumptions";
import {
  CURRENCY_SYMBOL,
  useMoney,
  usePersistedCurrency,
} from "@/components/carbon-cost/money";

const ALL = "all";
export default function CarbonCostPage() {
  const t = useT();
  const { data, isError, refetch } = useQuery({
    queryKey: ["carbon-cost", "v2"],
    queryFn: () => ({ facts: readCostFacts(), env: costEnv() }),
  });
  useStoreSync(() => void refetch());

  const [currency, setCurrency] = usePersistedCurrency();
  const [year, setYear] = React.useState<string>(ALL);
  const [inst, setInst] = React.useState<string>(ALL);
  const [product, setProduct] = React.useState<string>(ALL);
  const [by, setBy] = React.useState<Dim>("installation");
  const [then, setThen] = React.useState<Dim | null>(null);
  const [project, setProject] = React.useState(false);
  const [basis, setBasis] = React.useState<UnitBasis>("tonne");

  const facts: CostFacts[] = React.useMemo(() => data?.facts ?? [], [data]);

  const years = React.useMemo(
    () => [...new Set(facts.map((f) => f.year))].sort((a, b) => b - a),
    [facts],
  );
  const installations = React.useMemo(
    () => [
      ...new Map(
        facts.map((f) => [f.installationId, f.installationName]),
      ).entries(),
    ],
    [facts],
  );
  const products = React.useMemo(
    () => [
      ...new Map(
        facts
          .filter((f) => inst === ALL || f.installationId === inst)
          .map((f) => [f.productId, f.productName]),
      ).entries(),
    ],
    [facts, inst],
  );

  /* A filter whose choice no longer exists (an archived report) falls back to "all" rather than leaving the
     page empty under a name it can no longer find. */
  const yearOk = year === ALL || years.includes(Number(year));
  const instOk = inst === ALL || installations.some(([id]) => id === inst);
  const productOk = product === ALL || products.some(([id]) => id === product);
  const yearV = yearOk ? year : ALL;
  const instV = instOk ? inst : ALL;
  const productV = productOk ? product : ALL;

  const env = data?.env ?? costEnv();
  const money = useMoney(currency, env.rates);

  const scoped = React.useMemo(
    () =>
      facts.filter(
        (f) =>
          (yearV === ALL || f.year === Number(yearV)) &&
          (instV === ALL || f.installationId === instV) &&
          (productV === ALL || f.productId === productV),
      ),
    [facts, yearV, instV, productV],
  );
  const canProject = scoped.some(
    (f) => f.monthsCounted > 0 && f.monthsCounted < 12,
  );
  const projecting = project && canProject;
  const rows = React.useMemo(
    () => scoped.map((f) => priceFacts(f, env, projecting)),
    [scoped, env, projecting],
  );
  const totals = React.useMemo(() => totalsOf(rows), [rows]);
  const series = React.useMemo(() => monthlySeries(rows), [rows]);

  const scopeLabel = [
    yearV === ALL ? t("All years") : yearV,
    instV === ALL ? null : installations.find(([id]) => id === instV)?.[1],
    productV === ALL ? null : products.find(([id]) => id === productV)?.[1],
  ]
    .filter(Boolean)
    .join(" · ");

  const standing: ScopeStanding = React.useMemo(() => {
    const present = new Set(rows.map((r) => r.facts.reason));
    const reason =
      rows.length === 0 || [...present].every((r) => r === "no_data")
        ? "no_data"
        : present.has("partial_year") || present.has("no_data")
          ? "partial_year"
          : present.has("unverified_data")
            ? "unverified_data"
            : "official";
    return {
      official: rows.length > 0 && reason === "official",
      reason,
      monthsCounted: totals.months,
      monthsPossible: totals.monthsPossible,
      monthsEntered: totals.months,
      projectable: false,
      products: rows.length,
    };
  }, [rows, totals]);

  const pick = (dim: Dim, key: string) => {
    if (dim === "installation") {
      setInst(key);
      setProduct(ALL);
    } else if (dim === "product") setProduct(key);
    else setYear(key);
  };

  /* One real product report in view: its month-by-month intensity chart and its precursor breakdown are still the best way to see them. */
  const single = rows.length === 1 ? rows[0].facts.id : null;
  const singleDetail = React.useMemo(() => {
    if (!single) return null;
    const w = getWorkspace(single);
    if (!w) return null;
    const see = workspaceSEE(w);
    return {
      workspace: w,
      chart: emissionsChartData(w, see, false, false),
      precursors: precursorContribution(w),
    };
  }, [single, data]);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (data === null || data === undefined) return <LoadingState />;

  const filterSelect = (
    value: string,
    onChange: (v: string) => void,
    all: string,
    opts: [string, string][],
    label: string,
  ) => (
    <Select
      value={value}
      onChange={onChange}
      options={[
        { value: ALL, label: all, hint: undefined },
        ...opts.map(([v, l]) => ({ value: v, label: l, hint: undefined })),
      ]}
      ariaLabel={label}
      searchable={opts.length > 8}
    />
  );

  const nothing = facts.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("Analysis")}
        title={t("Carbon & Cost")}
        lead={t(
          "What your goods carry, and what that costs: with your own data, and on the EU default.",
        )}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Segmented<Currency>
          value={currency}
          onChange={setCurrency}
          ariaLabel={t("Currency")}
          options={CURRENCIES.map((c) => ({
            value: c,
            label: `${CURRENCY_SYMBOL[c]} ${c}`,
          }))}
        />
        <FilterChip
          active={projecting}
          onClick={() => canProject && setProject((v) => !v)}
          title={
            canProject
              ? t(
                  "Carry the submitted months across the year at the same rate. An assumption, not a forecast.",
                )
              : t("Every product in view already has its full year.")
          }
        >
          <TrendingUp size={12} strokeWidth={1.6} className="mr-1.5" />
          {t("Full-year estimate")}
        </FilterChip>
      </div>

      {nothing ? (
        <EmptyState
          icon={<Coins size={28} strokeWidth={1.25} />}
          title={t("Nothing to show yet")}
          body={t(
            "This fills in once a product report has one submitted month.",
          )}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ButtonLink href="/workspaces/new">
                {t("New product report")}
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3 lg:max-w-3xl">
              {filterSelect(
                yearV,
                setYear,
                t("All reporting years"),
                years.map((y) => [
                  String(y),
                  t("{year} reporting year", { year: y }),
                ]),
                t("Reporting year"),
              )}
              {filterSelect(
                instV,
                (v) => {
                  setInst(v);
                  setProduct(ALL);
                },
                t("All installations"),
                installations.map(([id, n]) => [id, n]),
                t("Installation"),
              )}
              {filterSelect(
                productV,
                setProduct,
                t("All products"),
                products.map(([id, n]) => [id, n]),
                t("Product"),
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StandingChip standing={standing} />
              <p className="max-w-3xl text-[12.5px] leading-relaxed text-black/45">
                {rows.length === 0
                  ? t("No product report matches these filters.")
                  : standingDetail(standing, t)}
                {projecting && (
                  <>
                    {" "}
                    {t(
                      "Figures are carried to a full year at this year's rate.",
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          <KpiGrid totals={totals} series={series} money={money} rows={rows} />

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
            <EmissionsChartCard series={series} rows={rows} />
            <CostHeroCard
              totals={totals}
              rows={rows}
              money={money}
              scopeLabel={scopeLabel}
            />
          </div>

          <CompareCard
            rows={rows}
            by={by}
            onBy={setBy}
            then={then}
            onThen={setThen}
            money={money}
            onPick={pick}
            linkable
          />

          <div className="grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)] [&>*]:min-w-0">
            <BreakdownCard totals={totals} money={money} />
            <CostBarsCard rows={rows} by={by} money={money} />
          </div>

          <AssumptionsCard
            rows={rows}
            env={env}
            money={money}
            editable
            onSaved={() => void refetch()}
          />

          <UnitCostCard
            rows={rows}
            env={env}
            money={money}
            basis={basis}
            onBasis={setBasis}
            onSaved={() => void refetch()}
          />

          {singleDetail && (
            <section
              className={cn("space-y-3")}
              aria-label={t("This product in detail")}
            >
              <h2 className="text-[15px] font-medium text-black/80">
                {t("This product in detail")}
              </h2>
              <EmissionsChart
                data={singleDetail.chart}
                workspace={singleDetail.workspace}
              />
              {singleDetail.precursors.byNode.length > 0 && (
                <PrecursorBreakdown
                  workspace={singleDetail.workspace}
                  result={singleDetail.precursors}
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

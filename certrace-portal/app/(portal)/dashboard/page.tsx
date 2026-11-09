"use client";

/* ════════════════════════════════════════════════════════════
   THE DASHBOARD — where the company stands, on one screen

   Six figures (how far in, what it means in tonnes and in baht, how healthy the
   chain is); the year drawn against the EU default beside Cera; how far each
   report has got and what is still open; what needs you and the dates that
   matter; who the exporter relies on; what just happened. Each panel is the
   short form of a tab, and says so with a link to it.

   Nothing is computed here: lib/cbam/dashboard-data.ts reads the same stores,
   through the same functions, as the tabs underneath, so this page cannot say
   something they do not. It re-reads when it opens and whenever another window
   changes a store.

   SAMPLE NUMBERS — shared with Carbon & Cost and Supply Chain — show a made-up
   estate while the account has nothing in it yet. Never written anywhere.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FlaskConical, LayoutGrid, Plus } from "lucide-react";
import { Button, EmptyState, FilterChip, PageHeader } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { USER } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { useProfile, useSessionUser } from "@/lib/profile";
import { useSampleMode } from "@/lib/sample-mode";
import { useStoreSync } from "@/lib/use-store-sync";
import { readDashboard, sampleDashboard } from "@/lib/cbam/dashboard-data";
import { CURRENCY_SYMBOL, useMoney, usePersistedCurrency } from "@/components/carbon-cost/money";
import { Segmented } from "@/components/insight/kit";
import { ActivityPanel, CeraCard, ChainPanel, CompliancePanel, DatesPanel, HomeChart, HomeTiles, NeedsYouPanel, SitesPanel } from "@/components/home/panels";
import { CURRENCIES, type Currency } from "@/lib/cbam/carbon-cost-model";

export default function DashboardPage() {
  const t = useT();
  /* The greeting is the first line a signed-in exporter reads; USER.name is a fixture, and greeting someone by a stranger's name undermines
     every number under it. Profile first — it is what Settings edits. Then the session, which is all a fresh browser has before the local
     profile is written. The fixture is last, and only the demo ever reaches it. */
  const { profile, stored } = useProfile();
  const sessionUser = useSessionUser();
  const firstName = (stored ? profile.firstName.trim() : "") || sessionUser?.firstName?.trim() || profile.firstName.trim() || USER.name.split(" ")[0];

  const { data, isError, refetch } = useQuery({ queryKey: ["dashboard", "v2"], queryFn: () => readDashboard(), staleTime: 0, refetchOnMount: "always", refetchInterval: 5000 });
  useStoreSync(() => void refetch());

  const [currency, setCurrency] = usePersistedCurrency();
  const sample = useSampleMode(data ? data.hasFigures || data.company.reports > 0 : null);
  const view = React.useMemo(() => (sample.on ? sampleDashboard() : (data ?? null)), [sample.on, data]);
  const money = useMoney(currency, view?.carbon.env.rates ?? { THB: 38, EUR: 1, CNY: 7.8, INR: 95 });

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data || !view || !sample.ready) return <LoadingState />;

  const live = !sample.on;
  const empty = view.company.reports === 0 && view.carbon.rows.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("Overview")}
        title={t("Good afternoon, {name}.", { name: firstName })}
        lead={t("Where your company stands.")}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
            <Segmented<Currency> value={currency} onChange={setCurrency} ariaLabel={t("Currency")} options={CURRENCIES.map((c) => ({ value: c, label: `${CURRENCY_SYMBOL[c]} ${c}` }))} />
            <FilterChip active={sample.on} onClick={() => sample.set(!sample.on)} title={t("Show made-up figures so you can see the page. Your own data is not touched.")}>
              <FlaskConical size={12} strokeWidth={1.6} className="mr-1.5" />
              {t("Sample numbers")}
            </FilterChip>
            <Link href="/workspaces/new">
              <Button>
                <Plus size={15} strokeWidth={1.5} /> {t("New product report")}
              </Button>
            </Link>
          </div>

      {sample.on && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[rgba(180,83,9,0.35)] bg-[#fffbeb] px-5 py-3.5 text-[12.5px] text-[#b45309]">
          <span>
            <strong className="font-medium">{t("Sample numbers.")}</strong>{" "}
            {sample.auto ? t("Nothing has been submitted yet, so this shows a made-up estate to give you the picture. Your own data is not touched.") : t("This is a made-up estate. Your own data is not touched.")}
          </span>
          <button type="button" data-lock="allow" onClick={() => sample.set(false)} className="rounded-lg border border-black/15 bg-white px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-black/60 hover:border-black/30 hover:text-black">
            {t("Use my own data")}
          </button>
        </div>
      )}

      {empty ? (
        <EmptyState
          icon={<LayoutGrid size={28} strokeWidth={1.25} />}
          title={t("No product reports yet")}
          body={t("Make one and this page fills in.")}
          action={<FilterChip onClick={() => sample.set(true)}>{t("Preview with sample numbers")}</FilterChip>}
        />
      ) : (
        <>
          <HomeTiles d={view} money={money} live={live} />

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
            <HomeChart d={view} money={money} live={live} />
            <CeraCard d={view} money={money} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
            <SitesPanel d={view} live={live} />
            <CompliancePanel tabs={view.tabs} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
            <NeedsYouPanel items={view.actions} live={live} />
            <DatesPanel d={view} />
          </div>

          <div className="grid gap-3 xl:grid-cols-2 [&>*]:min-w-0">
            <ChainPanel d={view} live={live} />
            <ActivityPanel events={view.activity} d={view} live={live} />
          </div>
        </>
      )}
    </div>
  );
}

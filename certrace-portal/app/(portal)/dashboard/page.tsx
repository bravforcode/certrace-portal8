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

   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { USER } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { useProfile, useSessionUser } from "@/lib/profile";
import { useStoreSync } from "@/lib/use-store-sync";
import { readDashboard } from "@/lib/cbam/dashboard-data";
import {
  CURRENCY_SYMBOL,
  useMoney,
  usePersistedCurrency,
} from "@/components/carbon-cost/money";
import { Segmented } from "@/components/insight/kit";
import {
  ActivityPanel,
  CeraCard,
  ChainPanel,
  CompliancePanel,
  DatesPanel,
  HomeChart,
  HomeTiles,
  NeedsYouPanel,
  SitesPanel,
} from "@/components/home/panels";
import { CURRENCIES, type Currency } from "@/lib/cbam/carbon-cost-model";
import { InstallationDirectory } from "@/components/factory/installation-directory";
import { FactoryMap } from "@/components/factory/factory-map";
import { useActiveInstallation } from "@/lib/active-installation";
import { currentYear } from "@/lib/year-range";

export default function DashboardPage() {
  const t = useT();
  /* The greeting is the first line a signed-in exporter reads; USER.name is a fixture, and greeting someone by a stranger's name undermines
     every number under it. Profile first — it is what Settings edits. Then the session, which is all a fresh browser has before the local
     profile is written. The fixture is last, and only the demo ever reaches it. */
  const { profile, stored } = useProfile();
  const sessionUser = useSessionUser();
  const firstName =
    (stored ? profile.firstName.trim() : "") ||
    sessionUser?.firstName?.trim() ||
    profile.firstName.trim() ||
    USER.name.split(" ")[0];

  const { data, isError, refetch } = useQuery({
    queryKey: ["dashboard", "v2"],
    queryFn: () => readDashboard(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 5000,
  });
  useStoreSync(() => void refetch());

  const [currency, setCurrency] = usePersistedCurrency();
  const money = useMoney(
    currency,
    data?.carbon.env.rates ?? { THB: 38, EUR: 1, CNY: 7.8, INR: 95 },
  );

  const { active } = useActiveInstallation();
  const [year, setYear] = React.useState(currentYear);
  const [picked, setPicked] = React.useState<string | null>(null);
  const mapId = picked ?? active?.id ?? null;

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) return <LoadingState />;

  const empty = data.company.reports === 0 && data.carbon.rows.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("Overview")}
        title={t("Good afternoon, {name}.", { name: firstName })}
        lead={t("Where your company stands.")}
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
        <Link href="/workspaces/new">
          <Button>
            <Plus size={15} strokeWidth={1.5} /> {t("New product report")}
          </Button>
        </Link>
      </div>

      <InstallationDirectory year={year} selectedId={mapId} onShowOnMap={setPicked} />
      {mapId && (
        <FactoryMap installationId={mapId} year={year} onInstallationChange={setPicked} onYearChange={setYear} />
      )}

      {empty ? (
        <EmptyState
          icon={<LayoutGrid size={28} strokeWidth={1.25} />}
          title={t("No product reports yet")}
          body={t("Make one and this page fills in.")}
        />
      ) : (
        <>
          <HomeTiles d={data} money={money} live />

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
            <HomeChart d={data} money={money} live />
            <CeraCard d={data} money={money} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
            <SitesPanel d={data} live />
            <CompliancePanel tabs={data.tabs} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
            <NeedsYouPanel items={data.actions} live />
            <DatesPanel d={data} />
          </div>

          <div className="grid gap-3 xl:grid-cols-2 [&>*]:min-w-0">
            <ChainPanel d={data} live />
            <ActivityPanel events={data.activity} d={data} live />
          </div>
        </>
      )}
    </div>
  );
}

"use client";

/* ════════════════════════════════════════════════════════════
   SUPPLY CHAIN — who is in it, how healthy each part is, where it worries us

   The portal already lists every ask (Smart Links) and every chain (the
   Precursors tab of each report). This is the read ABOVE them: one page that
   says who the exporter depends on, whether each is answering, whether what they
   gave can be relied on, and which few of them to pick up the phone to.

   Two kinds of party, scored on different things (lib/cbam/supply-chain-model.ts):
     plants      the installations that fill in the monthly link
     precursors  the suppliers of what is bought in — each asked once a year

   Nothing is stored here. The page re-reads the portal's own stores each time it
   opens and whenever another window changes one: a plant answering its link is
   a changed square here the next time anyone looks.

   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Network } from "lucide-react";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useT } from "@/lib/i18n";
import { useStoreSync } from "@/lib/use-store-sync";
import {
  plantHealth,
  precursorHealth,
  summarise,
  type ChainState,
  type Concern,
} from "@/lib/cbam/supply-chain-model";
import { readPlants, readPrecursors } from "@/lib/cbam/supply-chain-read";
import {
  AspectsPanel,
  ChainTiles,
  ConcentrationPanel,
  ConcernsPanel,
  StatePanel,
} from "@/components/supply-chain/overview";
import { ChainTable, type Tab } from "@/components/supply-chain/table";

export default function SupplyChainPage() {
  const t = useT();
  const { data, isError, refetch } = useQuery({
    queryKey: ["supply-chain", "v1"],
    queryFn: () => ({ plants: readPlants(), precursors: readPrecursors() }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 5000,
  });
  useStoreSync(() => void refetch());

  const [tab, setTab] = React.useState<Tab>("plants");
  const [state, setState] = React.useState<ChainState | null>(null);

  const now = new Date();
  const plantFacts = React.useMemo(() => data?.plants ?? [], [data]);
  const precursorFacts = React.useMemo(() => data?.precursors ?? [], [data]);
  const plants = React.useMemo(() => plantFacts.map(plantHealth), [plantFacts]);
  const precursors = precursorFacts.map((f) => precursorHealth(f, now));
  const summary = summarise(plants, precursors);

  const hrefFor = (c: Concern): string | null => {
    if (c.party === "plant") {
      const p = plants.find((x) => x.facts.id === c.partyId);
      return p ? `/workspaces/${p.facts.reportIds[0]}/monthly` : null;
    }
    const p = precursors.find((x) => x.facts.id === c.partyId);
    return p ? `/workspaces/${p.facts.workspaceId}/precursors` : null;
  };

  const filterFromTile = (s: ChainState | null) => setState(s);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) return <LoadingState />;

  const empty = plantFacts.length === 0 && precursorFacts.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("Analysis")}
        title={t("Supply Chain")}
        lead={t(
          "Who is in your supply chain, how healthy each part is, and where it worries us.",
        )}
      />
      {empty ? (
        <EmptyState
          icon={<Network size={28} strokeWidth={1.25} />}
          title={t("Nobody in your supply chain yet")}
          body={t(
            "Plants appear with the first product report, and precursor suppliers when you add them to its chain.",
          )}
          action={
            <ButtonLink href="/workspaces/new">
              {t("New product report")}
            </ButtonLink>
          }
        />
      ) : (
        <>
          <ChainTiles s={summary} onFilter={filterFromTile} active={state} />

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
            <AspectsPanel s={summary} />
            <StatePanel s={summary} onFilter={filterFromTile} active={state} />
          </div>

          <div className="grid gap-3 xl:grid-cols-2 [&>*]:min-w-0">
            <ConcernsPanel concerns={summary.concerns} hrefFor={hrefFor} />
            <ConcentrationPanel s={summary} />
          </div>

          <ChainTable
            tab={tab}
            onTab={setTab}
            plants={plants}
            precursors={precursors}
            state={state}
            onState={setState}
            linkable
          />
        </>
      )}
    </div>
  );
}

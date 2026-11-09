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

   SAMPLE NUMBERS work as on Carbon & Cost and the Dashboard: a made-up chain,
   never written anywhere, shown while the account has nobody in it yet.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Network } from "lucide-react";
import { ButtonLink, EmptyState, FilterChip, PageHeader } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useT } from "@/lib/i18n";
import { useSampleMode } from "@/lib/sample-mode";
import { useStoreSync } from "@/lib/use-store-sync";
import { plantHealth, precursorHealth, summarise, type ChainState, type Concern } from "@/lib/cbam/supply-chain-model";
import { readPlants, readPrecursors } from "@/lib/cbam/supply-chain-read";
import { samplePlants, samplePrecursors } from "@/lib/cbam/supply-chain-sample";
import { AspectsPanel, ChainTiles, ConcentrationPanel, ConcernsPanel, StatePanel } from "@/components/supply-chain/overview";
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

  const hasFigures = data ? data.plants.some((p) => p.months.some((m) => m.cell === "done" || m.cell === "late" || m.cell === "waiting")) || data.precursors.some((p) => p.phase !== "not_sent") : null;
  const sample = useSampleMode(hasFigures);

  const now = React.useMemo(() => new Date(), [data, sample.on]); // eslint-disable-line react-hooks/exhaustive-deps
  const plantFacts = React.useMemo(() => (sample.on ? samplePlants() : (data?.plants ?? [])), [sample.on, data]);
  const precursorFacts = React.useMemo(() => (sample.on ? samplePrecursors(now) : (data?.precursors ?? [])), [sample.on, data, now]);
  const plants = React.useMemo(() => plantFacts.map(plantHealth), [plantFacts]);
  const precursors = React.useMemo(() => precursorFacts.map((f) => precursorHealth(f, now)), [precursorFacts, now]);
  const summary = React.useMemo(() => summarise(plants, precursors), [plants, precursors]);

  const hrefFor = (c: Concern): string | null => {
    if (sample.on) return null;
    if (c.party === "plant") {
      const p = plants.find((x) => x.facts.id === c.partyId);
      return p ? `/workspaces/${p.facts.reportIds[0]}/monthly` : null;
    }
    const p = precursors.find((x) => x.facts.id === c.partyId);
    return p ? `/workspaces/${p.facts.workspaceId}/precursors` : null;
  };

  const filterFromTile = (s: ChainState | null) => setState(s);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data || !sample.ready) return <LoadingState />;

  const empty = plantFacts.length === 0 && precursorFacts.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("Analysis")}
        title={t("Supply Chain")}
        lead={t("Who is in your supply chain, how healthy each part is, and where it worries us.")}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
            <FilterChip active={sample.on} onClick={() => sample.set(!sample.on)} title={t("Show made-up figures so you can see the page. Your own data is not touched.")}>
              <FlaskConical size={12} strokeWidth={1.6} className="mr-1.5" />
              {t("Sample numbers")}
            </FilterChip>
          </div>

      {sample.on && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[rgba(180,83,9,0.35)] bg-[#fffbeb] px-5 py-3.5 text-[12.5px] text-[#b45309]">
          <span>
            <strong className="font-medium">{t("Sample numbers.")}</strong>{" "}
            {sample.auto ? t("Nobody has been asked for anything yet, so this shows a made-up supply chain to give you the picture. Your own data is not touched.") : t("This is a made-up supply chain. Your own data is not touched.")}
          </span>
          <button type="button" data-lock="allow" onClick={() => sample.set(false)} className="rounded-lg border border-black/15 bg-white px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-black/60 hover:border-black/30 hover:text-black">
            {t("Use my own data")}
          </button>
        </div>
      )}

      {empty ? (
        <EmptyState
          icon={<Network size={28} strokeWidth={1.25} />}
          title={t("Nobody in your supply chain yet")}
          body={t("Plants appear with the first product report, and precursor suppliers when you add them to its chain.")}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ButtonLink href="/workspaces/new">{t("New product report")}</ButtonLink>
              <FilterChip onClick={() => sample.set(true)}>{t("Preview with sample numbers")}</FilterChip>
            </div>
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

          <ChainTable tab={tab} onTab={setTab} plants={plants} precursors={precursors} state={state} onState={setState} linkable={!sample.on} />
        </>
      )}
    </div>
  );
}

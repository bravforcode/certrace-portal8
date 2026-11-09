"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   PRODUCT REPORT · CARBON PRICE — what was paid for this good's emissions at home

   The carbon price paid in the country of origin used to be a card inside the
   installation's Readiness, opened one product at a time. It is a fact about one
   product report — the claim is per good, per year, against that good's emissions
   — so it has its own tab beside Precursors, and Readiness no longer carries it.

   Zero is a valid and complete answer. It is recorded, not left blank.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { LoadingState } from "@/components/query-state";
import { CarbonPriceCard } from "@/components/workspace/readiness-sections";
import { useWorkspace } from "@/components/workspace/provider";
import { useAnnualCoverage, useCarbonPrice, useInvalidateWorkspaceData, useWorkspaceSEE } from "@/lib/workspace-data-query";
import { annualScopeFor, CARBON_PRICE_KEY } from "@/lib/workspace-evidence";

export default function CarbonPricePage() {
  const { workspace, refresh } = useWorkspace();
  const { data: price } = useCarbonPrice(workspace.id);
  const { data: see = null } = useWorkspaceSEE(workspace);
  const invalidate = useInvalidateWorkspaceData(workspace.id);
  const scope = React.useMemo(
    () => annualScopeFor(workspace.id, workspace.periodStart, workspace.periodEnd, (price?.amountPerTonne ?? 0) > 0),
    [workspace.id, workspace.periodStart, workspace.periodEnd, price],
  );
  const coverage = useAnnualCoverage(workspace.id, scope);
  const priceEvidenced = Boolean(coverage.data?.find((r) => r.key === CARBON_PRICE_KEY.key)?.covered);

  const changed = () => {
    invalidate();
    refresh();
  };

  // The card scrolls itself to the top of the tab when a readiness link asks for the receipt.
  if (!price) return <LoadingState />;
  return <CarbonPriceCard workspace={workspace} price={price} see={see} priceEvidenced={priceEvidenced} onEvidenceChange={changed} refresh={changed} />;
}

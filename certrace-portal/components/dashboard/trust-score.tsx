"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET D — COMPLIANCE TRUST SCORE

   ── WHY THIS RENDERS A DEPENDENCY NOTICE RATHER THAN A NUMBER ──
   The prompt pack is explicit: "Do not redefine how the score is calculated
   here if it's already specified elsewhere in the product — this widget
   only needs to surface it. If no calculation exists yet, flag as a
   dependency rather than inventing one."

   A trust score DOES exist — `trustScoreFor` in lib/compliance-intelligence.ts
   — but it is scoped to a DECLARATION: it reads a `ReviewRollup` (supplier
   submissions keyed by `declId`, lib/exporter-review.ts) and `ComplianceFacts`
   from the declarations engine, and it is rendered only by
   components/declaration-workflow.tsx. This dashboard aggregates over
   WORKSPACES, which are a different spine with a different supplier model
   and no ReviewRollup to read.

   So for a workspace there is no calculation to surface, and the two honest
   options were: invent a workspace-level formula (which the pack forbids),
   or say so. This says so, names the dependency precisely enough to act on,
   and takes up the slot Widget D owns in the layout so the row composes
   correctly when the real calculation lands.
   ════════════════════════════════════════════════════════════ */

import { Info } from "lucide-react";
import { Card } from "@/components/ui";
import { useT } from "@/lib/i18n";

export function TrustScoreWidget() {
  const t = useT();
  return (
    <Card className="p-6">
      <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">
        {t("Compliance trust score")}
      </h2>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[rgba(29,78,216,0.16)] bg-[#eff6ff] px-4 py-3.5">
        <Info
          size={15}
          strokeWidth={1.5}
          className="mt-0.5 flex-none text-[#1d4ed8]"
        />
        <div className="min-w-0 text-[12.5px] leading-relaxed text-[#1d4ed8]">
          <p className="font-medium">
            {t("Waiting on a product-report-level calculation.")}
          </p>
          <p className="mt-1 text-[#1d4ed8]/80">
            {t(
              "A trust score exists for declarations, but it reads a declaration’s supplier-review rollup — a product report has no equivalent. Rather than invent a second, differently-defined score for this page, this widget stays empty until one calculation covers both.",
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

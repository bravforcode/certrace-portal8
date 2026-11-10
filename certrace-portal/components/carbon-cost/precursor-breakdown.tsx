"use client";

/* ════════════════════════════════════════════════════════════
   PRECURSOR CONTRIBUTION BREAKDOWN

   Renders lib/precursor-suppliers.ts's precursorContribution() directly.
   Only DEPTH-1 (root) precursors are listed — the engine's own comment on
   `walk()` is explicit that an upstream tier already reaches the finished
   good through its parent's effectiveSee, so flattening every depth into one
   sorted list would double-count a sub-tier's contribution against its
   parent's. A root with children still shows the correct rolled-up figure.

   Scrap is not omitted, per the spec this was built against — it sorts to
   the bottom on its own (its contribution is 0, by construction) and is
   labeled as excluded rather than dropped from the table.

   IT IS DRAWN FOR ONE PRODUCT AT A TIME, and the page is what enforces that
   (see the `showPrecursors` gate in app/(portal)/carbon-cost/page.tsx). This
   card is a RECIPE — how much of a tonne of this good came out of each thing
   bought in — and several recipes under one heading is a stack of unrelated
   tables that happen to share a page. On "All products" it was also the
   longest thing on the screen by a wide margin, so the page ended in five
   other chains rather than in the figures it exists for.
   ════════════════════════════════════════════════════════════ */

import { Card } from "@/components/ui";
import { StateChip } from "@/components/workspace/chrome";
import { useT } from "@/lib/i18n";
import type { PrecursorResult } from "@/lib/precursor-suppliers";
import type { VerificationWorkspace } from "@/lib/workspace";

export function PrecursorBreakdown({
  workspace,
  result,
}: {
  workspace: VerificationWorkspace;
  result: PrecursorResult;
}) {
  const t = useT();
  const roots = [...result.byNode.filter((n) => n.depth === 1)].sort(
    (a, b) => b.contribution - a.contribution,
  );
  const maxContribution = Math.max(...roots.map((n) => n.contribution), 0.0001);
  const incomplete = result.incomplete.length > 0;

  if (result.byNode.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">
          {t("Precursors — {product}", { product: workspace.productName })}
        </h2>
        {incomplete ? (
          <span className="rounded-full border border-[#f4d9a8] bg-[#fef3e2] px-2.5 py-1 text-[10.5px] uppercase tracking-[0.06em] text-[#92620d]">
            {result.incomplete.length === 1
              ? t("Incomplete — 1 row missing data")
              : t("Incomplete — {count} rows missing data", {
                  count: result.incomplete.length,
                })}
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-[0.08em] text-black/35">
            {t("{value} tCO₂e/t total", { value: result.perTonne.toFixed(4) })}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {roots.map((n) => {
          const excluded = n.isScrap;
          const width = excluded
            ? 0
            : Math.max(2, (n.contribution / maxContribution) * 100);
          return (
            <div key={n.id}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate text-black/75">
                  {n.name || n.precursorName || t("Unnamed precursor")}
                </span>
                <span className="flex-none font-mono text-black/50">
                  {excluded
                    ? t("excluded (scrap — zero-rated)")
                    : `${n.contribution.toFixed(4)} tCO₂e/t`}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                {!excluded && (
                  <div
                    className="h-full rounded-full bg-[#111]"
                    style={{ width: `${width}%` }}
                  />
                )}
              </div>
              {!n.complete && (
                <div className="mt-1 text-[11px] text-[#b45309]">
                  {t("Missing a quantity, installation, or emissions figure.")}
                </div>
              )}
              {n.dataOrigin === "default_value" && !excluded && (
                <div className="mt-1">
                  <StateChip
                    state="incomplete"
                    className="px-1.5 py-0.5 text-[9.5px]"
                  />
                  <span className="ml-1.5 text-[11px] text-black/35">
                    {t("on a default value, not yet verified")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {incomplete && (
        <p className="mt-4 border-t border-black/[0.06] pt-3 text-[11.5px] leading-relaxed text-[#92620d]">
          {result.incomplete.length === 1
            ? t(
                "Not final — 1 precursor still needs a quantity, site or emissions figure.",
              )
            : t(
                "Not final — {count} precursors still need a quantity, site or emissions figure.",
                { count: result.incomplete.length },
              )}
        </p>
      )}
    </Card>
  );
}

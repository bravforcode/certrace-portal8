/* ════════════════════════════════════════════════════════════
   WORKSPACE → DOES ITS PRODUCT COUNT INDIRECT EMISSIONS

   The actual rule — Parameters_Constants!C89:C106 of the EU Communication
   template, transcribed verbatim as `indirectRelevantDefinitive` on each
   AggregatedGood in lib/cbam/template-reference.ts, read through
   `indirectApplies()` — already exists and is already tested
   ("indirect emissions are excluded for steel, aluminium and hydrogen",
   lib/cbam/__tests__/template-reference.test.ts). It also already covers
   more than the one exception this platform's own catalogue currently
   surfaces: cement, nitric acid, urea and mixed fertilisers all report
   indirect emissions too, alongside sintered ore — none of that has to be
   re-derived or kept in sync by hand here.

   RESOLUTION PATH, AND WHY IT ISN'T template-reference.ts's OWN
   categoryForCn(). That function matches by EXACT 8-digit CN code against
   the 569-row transcription of the workbook's own table — correct, but
   built to the workbook's granularity, not this platform's simplified
   catalogue's. A real gap found while wiring this up: lib/config.ts's own
   "al-plate" entry carries CN "7606 11 00", and the workbook's table has
   neighbouring subheadings ("76061130", "76061150", …) but not that exact
   one, so an exact match silently comes back empty for a real aluminium
   product. lib/config.ts's own `aggregatedGoodsCategory()` is the function
   this platform already relies on everywhere else (the Tree page, the
   precursor chain) precisely because it resolves by LONGEST CN PREFIX
   rather than exact match, and it is what actually covers this catalogue
   completely. So the category is resolved that way, then mapped across to
   template-reference.ts's id scheme, then answered by the real rule.
   ════════════════════════════════════════════════════════════ */

import {
  aggregatedGoodsCategory,
  getCatalogProduct,
  type AggregatedGoodsCategory,
} from "../config";

/** Annex II to Regulation (EU) 2023/956, as amended by 2025/2083: the goods
    for which ONLY direct emissions are taken into account — iron and steel
    (everything in chapters 72 and 73 except agglomerated iron ore, 2601 12 00),
    aluminium, hydrogen, and, since 2083, electricity. Every other good in
    scope — cement, calcined clay, ammonia, nitric acid, urea, mixed
    fertilisers and sintered ore — also reports indirect emissions.

    It is stated here against the aggregated goods category rather than looked
    up in lib/cbam/template-reference.ts. That file is a verbatim transcription
    of the Commission's communication template v2.1.1 (December 2024), which
    still marks ammonia as direct-only; Annex II does not list ammonia, and the
    published default values carry an indirect figure for it. The regulation is
    what a verifier is held to, so the regulation is what this reads. */
const DIRECT_ONLY: Record<AggregatedGoodsCategory, boolean> = {
  "Sintered ore": false,
  "Pig iron": true,
  "Ferro-alloys": true,
  "Direct reduced iron": true,
  "Crude steel": true,
  "Iron or steel products": true,
  "Unwrought aluminium": true,
  "Aluminium products": true,
  Hydrogen: true,
  "Calcined clay": false,
  "Cement clinker": false,
  Cement: false,
  "Aluminous cement": false,
  Ammonia: false,
  "Nitric acid": false,
  Urea: false,
  "Mixed fertilisers": false,
};

/** true when this workspace's product counts indirect (electricity)
    emissions toward its SEE at all. A product that cannot be resolved to a
    catalogue entry resolves to true: never silently drop a real evidence
    requirement because a lookup came back empty. */
export const categoryRequiresIndirect = (
  category: AggregatedGoodsCategory,
): boolean => !DIRECT_ONLY[category];

export function workspaceRequiresIndirectEmissions(productId: string): boolean {
  const product = getCatalogProduct(productId);
  if (!product) return true;
  return !DIRECT_ONLY[aggregatedGoodsCategory(product)];
}

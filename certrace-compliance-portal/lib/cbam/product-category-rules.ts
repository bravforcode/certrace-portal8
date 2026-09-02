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

import { aggregatedGoodsCategory, getCatalogProduct, type AggregatedGoodsCategory } from "../config";
import { indirectApplies } from "./template-reference";

/** lib/config.ts's AggregatedGoodsCategory ↔ template-reference.ts's
    AggregatedGood.id — the same eight iron/steel/aluminium categories,
    named two different ways in two files transcribed from two different
    sources (this platform's own catalogue vs. the EU workbook verbatim).
    Verified 1:1 against AGGREGATED_GOODS's real ids, not guessed. */
const CATEGORY_TO_GOOD_ID: Record<AggregatedGoodsCategory, string> = {
  "Sintered ore": "sintered_ore",
  "Pig iron": "pig_iron",
  "Ferro-alloys": "alloys",
  "Direct reduced iron": "direct_reduced_iron",
  "Crude steel": "crude_steel",
  "Iron or steel products": "iron_or_steel_products",
  "Unwrought aluminium": "unwrought_aluminium",
  "Aluminium products": "aluminium_products",
};

/** true when this workspace's product counts indirect (electricity)
    emissions toward its SEE at all. A product that cannot be resolved to a
    catalogue entry resolves to true, the same conservative default
    `indirectApplies` itself uses for an unknown good: never silently drop a
    real evidence requirement because a lookup came back empty. */
export function workspaceRequiresIndirectEmissions(productId: string): boolean {
  const product = getCatalogProduct(productId);
  if (!product) return true;
  const category = aggregatedGoodsCategory(product);
  return indirectApplies(CATEGORY_TO_GOOD_ID[category]);
}

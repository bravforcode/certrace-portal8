/* ════════════════════════════════════════════════════════════
   workspaceRequiresIndirectEmissions — the convenience wrapper around
   lib/cbam/template-reference.ts's already-existing, already-tested
   indirectApplies()/categoryForCn(). Nothing about the RULE is re-tested
   here (that's template-reference.test.ts's job); this only checks the
   product-id → CN-code → category chain resolves correctly, and that an
   unresolvable product fails conservatively (indirect required) rather
   than silently.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

const { workspaceRequiresIndirectEmissions } = await import(
  "../product-category-rules"
);
const { PRODUCT_CATALOG } = await import("../../config");

test("a steel product (rebar) does not require indirect emissions", () => {
  const rebar = PRODUCT_CATALOG.find((p) => p.id === "rebar");
  assert.ok(rebar, "fixture assumes the catalogue still carries 'rebar'");
  assert.equal(workspaceRequiresIndirectEmissions(rebar!.id), false);
});

test("Sintered Ore is the one iron & steel exception that DOES require indirect emissions", () => {
  const ironore = PRODUCT_CATALOG.find((p) => p.id === "ironore");
  assert.ok(
    ironore,
    "fixture assumes the catalogue still carries 'ironore' (Sintered ore, CN 2601 12 00)",
  );
  assert.equal(workspaceRequiresIndirectEmissions(ironore!.id), true);
});

test("every aluminium product in the catalogue also does not require indirect emissions", () => {
  const aluminium = PRODUCT_CATALOG.filter((p) => p.category === "Aluminium");
  assert.ok(
    aluminium.length > 0,
    "fixture assumes the catalogue carries aluminium products",
  );
  for (const p of aluminium) {
    assert.equal(
      workspaceRequiresIndirectEmissions(p.id),
      false,
      `${p.id} (${p.cnCode}) should not require indirect emissions`,
    );
  }
});

test("an unresolvable product id fails conservatively — indirect emissions stay required rather than silently dropped", () => {
  assert.equal(
    workspaceRequiresIndirectEmissions("not-a-real-product-id"),
    true,
  );
});

/* Annex II is CN-level for heading 7202: ferro-manganese (7202 1),
   ferro-chromium (7202 4) and ferro-nickel (7202 6) are direct-only; the
   subheadings the Annex lists after "Except:" count indirect. */
const { indirectCounts } = await import("../product-category-rules");
const { aggregatedGoodsCategory } = await import("../../config");

const counts = (
  cnCode: string,
  category: "Iron & Steel" | "Aluminium" | "Cement" = "Iron & Steel",
) => indirectCounts(aggregatedGoodsCategory({ cnCode, category }), cnCode);

test("ferro-manganese (7202 11) is direct-only", () => {
  assert.equal(counts("72021100"), false);
});

test("ferro-silicon (7202 2) counts indirect emissions", () => {
  assert.equal(counts("72022100"), true);
});

test("ferro-chromium (7202 41) is direct-only", () => {
  assert.equal(counts("72024100"), false);
});

test("ferro-nickel (7202 60) is direct-only", () => {
  assert.equal(counts("72026000"), false);
});

test("sintered ore (2601 12 00) counts indirect emissions", () => {
  assert.equal(counts("26011200"), true);
});

test("cement counts indirect emissions", () => {
  assert.equal(counts("25232900", "Cement"), true);
});

test("unwrought aluminium is direct-only", () => {
  assert.equal(counts("76011000", "Aluminium"), false);
});

test("a ferro-alloy with no usable CN fails conservatively", () => {
  assert.equal(indirectCounts("Ferro-alloys", ""), true);
});

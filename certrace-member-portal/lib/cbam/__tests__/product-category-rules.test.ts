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

const { workspaceRequiresIndirectEmissions } = await import("../product-category-rules");
const { PRODUCT_CATALOG } = await import("../../config");

test("a steel product (rebar) does not require indirect emissions", () => {
  const rebar = PRODUCT_CATALOG.find((p) => p.id === "rebar");
  assert.ok(rebar, "fixture assumes the catalogue still carries 'rebar'");
  assert.equal(workspaceRequiresIndirectEmissions(rebar!.id), false);
});

test("Sintered Ore is the one iron & steel exception that DOES require indirect emissions", () => {
  const ironore = PRODUCT_CATALOG.find((p) => p.id === "ironore");
  assert.ok(ironore, "fixture assumes the catalogue still carries 'ironore' (Sintered ore, CN 2601 12 00)");
  assert.equal(workspaceRequiresIndirectEmissions(ironore!.id), true);
});

test("every aluminium product in the catalogue also does not require indirect emissions", () => {
  const aluminium = PRODUCT_CATALOG.filter((p) => p.category === "Aluminium");
  assert.ok(aluminium.length > 0, "fixture assumes the catalogue carries aluminium products");
  for (const p of aluminium) {
    assert.equal(workspaceRequiresIndirectEmissions(p.id), false, `${p.id} (${p.cnCode}) should not require indirect emissions`);
  }
});

test("an unresolvable product id fails conservatively — indirect emissions stay required rather than silently dropped", () => {
  assert.equal(workspaceRequiresIndirectEmissions("not-a-real-product-id"), true);
});

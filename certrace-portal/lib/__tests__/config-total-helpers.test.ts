/* regulationOf/jurisdictionOf must be total — the declaration workflow renders
   off them and used to assert getRegulation(...)!, which would crash on any
   regulation/jurisdiction id not in the catalog. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { regulationOf, jurisdictionOf } from "../config";

test("regulationOf / jurisdictionOf never return undefined for an unknown id", () => {
  assert.ok(regulationOf("not-a-real-regulation"), "regulation falls back");
  assert.ok(jurisdictionOf("ZZ"), "jurisdiction falls back");
});

test("known ids still resolve to themselves", () => {
  assert.equal(regulationOf("cbam").id, "cbam");
  assert.equal(jurisdictionOf("TH").code, "TH");
});

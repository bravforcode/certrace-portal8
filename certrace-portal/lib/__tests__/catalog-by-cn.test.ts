import test from "node:test";
import assert from "node:assert/strict";
import { catalogByCn } from "../config";

// A CN cell may hold the code as the declaration prints it, as bare digits or with dots; all name the same good.
test("catalogByCn finds a good however its CN code is spaced", () => {
  const spaced = catalogByCn("7208 38 00");
  assert.ok(spaced, "7208 38 00 is in CBAM scope");
  assert.equal(catalogByCn("72083800")?.id, spaced.id);
  assert.equal(catalogByCn("7208.38.00")?.id, spaced.id);
});

// A heading ("7208") is not a good: picking by it would guess one of many.
test("catalogByCn matches nothing for a partial or unknown code", () => {
  assert.equal(catalogByCn("7208"), undefined);
  assert.equal(catalogByCn("0101 21 00"), undefined);
  assert.equal(catalogByCn(""), undefined);
});

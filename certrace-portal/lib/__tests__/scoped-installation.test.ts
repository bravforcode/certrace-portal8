import test from "node:test";
import assert from "node:assert/strict";
import { resolveScoped } from "../scoped-installation";

const opts = [
  { id: "sup", name: "Supplier", self: false, supplierId: "s1" },
  { id: "own", name: "Rayong", self: true },
  { id: "oem", name: "OEM plant", self: false },
];

/* A shared link must open the same installation for every teammate, so the
   URL outranks whatever this browser last stored. */
test("URL wins over stored choice", () => {
  assert.equal(resolveScoped(opts, "oem", "sup")?.id, "oem");
});

/* A stale link or a removed installation must still land on a real site,
   never on an empty page. */
test("unknown URL id falls back to stored, then self, then first", () => {
  assert.equal(resolveScoped(opts, "gone", "sup")?.id, "sup");
  assert.equal(resolveScoped(opts, null, "gone")?.id, "own");
  assert.equal(resolveScoped([opts[0]!], null, null)?.id, "sup");
  assert.equal(resolveScoped([], "x", "y"), null);
});

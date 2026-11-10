import test from "node:test";
import assert from "node:assert/strict";
import { draftInstallation, emptyInstallation } from "../installations";
import { installationSheetStatus } from "../workbook/status";

// The workbook's Installation tab must stay editable for a site the exporter
// has not saved yet (their own site, synthesised from the org profile): the
// first edit creates the record, so the seed carries the reference and link,
// but never a name copied from the org profile. An unsaved site reads untouched.
test("a scoped site with no saved record is seeded with its reference, not a name", () => {
  const d = draftInstallation({ id: "TH-RAYONG-01", self: false, supplierId: "sup-1" }, null);
  assert.equal(d.id, "TH-RAYONG-01");
  assert.equal(d.name, "");
  assert.equal(d.supplierId, "sup-1");
  assert.equal(d.self, false);
  assert.equal(d.street, emptyInstallation().street);
  assert.equal(d.country, emptyInstallation().country);
});

test("the unsaved own site reads untouched in the tab until a name is entered", () => {
  const seed = draftInstallation({ id: "TH-RAYONG-01", self: false }, null);
  assert.equal(installationSheetStatus(seed), "untouched");
});

test("a saved record is returned as stored, never overwritten by the seed", () => {
  const stored = { ...emptyInstallation(), id: "TH-RAYONG-01", name: "Stored name", street: "1 Moo 2" };
  const d = draftInstallation({ id: "TH-RAYONG-01", self: false }, stored);
  assert.equal(d, stored);
});

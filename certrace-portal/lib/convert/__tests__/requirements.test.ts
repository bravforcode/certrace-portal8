import test from "node:test";
import assert from "node:assert/strict";
import { liveRequirements, readiness, REQUIREMENT_SOURCES } from "../requirements";
import { STANDARDS, getStandard } from "../../convert-standards";
import type { Sheet } from "../../workspace-sheets";
import { emptyInstallation, installationRole, type Installation } from "../../installations";
import { cbamCellKey, cbamFieldsFor } from "../../cbam/template-fields";

const sheet = (id: string, rows: Record<string, string>[]): Sheet => ({
  id, code: "", name: id, cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});
const eu = getStandard("eu-cbam")!;

test("every catalogue requirement has a source", () => {
  for (const s of STANDARDS) for (const r of s.requirements) assert.ok(REQUIREMENT_SOURCES[r.id], r.id);
});
test("goods is complete when products rows have all required columns", () => {
  const reqs = liveRequirements(eu, {
    installation: null,
    sheets: [sheet("products", [{ cn: "7217", item: "Wire", qty: "1", unit: "t" }])],
  });
  assert.equal(reqs.find((r) => r.id === "goods")!.state, "complete");
  assert.equal(reqs.find((r) => r.id === "direct")!.state, "missing");
});
// For an OEM plant the exporter types the data in; sending a supplier form would go nowhere.
test("OEM turns smart-link fixes into fill-in links", () => {
  const oem = { ...emptyInstallation(false), id: "p2", name: "OEM", role: "oem" } as Installation;
  const r = liveRequirements(eu, { installation: oem, sheets: [] }).find((x) => x.id === "precursors")!;
  assert.equal(r.fix, "fill-in");
  assert.equal(r.href, "/convert/fill/precursors?installation=p2&from=eu-cbam");
});
test("supplier installations route fill-in to smart links", () => {
  const sup = { ...emptyInstallation(false), id: "p3", name: "Mill", supplierId: "s1" } as Installation;
  const r = liveRequirements(eu, { installation: sup, sheets: [] }).find((x) => x.id === "goods")!;
  assert.equal(r.fix, "smart-link");
  assert.equal(r.href, "/convert/fill/goods?installation=p3&from=eu-cbam");
});
test("readiness is the share of complete requirements", () => {
  const reqs = liveRequirements(eu, { installation: null, sheets: [] });
  assert.equal(readiness(reqs), 0);
});
// Export must never ship a declaration built on missing data, but customers
// must still be able to browse Convert to see what is missing.
test("readiness is 100 only when every requirement is complete", () => {
  const reqs = [
    { id: "a", state: "complete" },
    { id: "b", state: "missing" },
  ] as Parameters<typeof readiness>[0];
  assert.ok(readiness(reqs) < 100);
  assert.equal(readiness(reqs.slice(0, 1)), 100);
});

test("a requirement with one complete and one untouched source is in progress at 50%", () => {
  const r = liveRequirements(eu, {
    installation: null,
    sheets: [sheet("materials", [{ step: "1", item: "Coil", qty: "2", unit: "t" }])],
  }).find((x) => x.id === "direct")!;
  assert.equal(r.state, "in-progress");
  assert.equal(r.progress, 50);
});
test("installation requirement links to its fill form with the id encoded", () => {
  const oem = { ...emptyInstallation(false), id: "p 2", name: "OEM", role: "oem" } as Installation;
  const r = liveRequirements(eu, { installation: oem, sheets: [] }).find((x) => x.id === "installation")!;
  assert.equal(r.href, "/convert/fill/installation?installation=p%202&from=eu-cbam");
});
// Fill in returns to the regulation it was opened from, so the user keeps working there.
test("fill links name the standard they were opened from", () => {
  const own = { ...emptyInstallation(true), id: "p1", name: "Own" } as Installation;
  const r = liveRequirements(eu, { installation: own, sheets: [] }).find((x) => x.id === "goods")!;
  assert.equal(r.href, "/convert/fill/goods?installation=p1&from=eu-cbam");
});
// The report is built from the CBAM template fields; finished legacy sheets alone are not enough.
test("with CBAM answers loaded, a requirement is complete only when its CBAM fields are", () => {
  const products = [sheet("products", [{ cn: "7217", item: "Wire", qty: "1", unit: "t" }])];
  const empty = liveRequirements(eu, { installation: null, sheets: products, cells: {} }).find((x) => x.id === "goods")!;
  assert.equal(empty.state, "in-progress");
  assert.equal(empty.progress, 0);
  const full: Record<string, string> = {};
  for (const f of cbamFieldsFor("goods")) full[cbamCellKey(f)] = f.options?.[0] ?? "1";
  const done = liveRequirements(eu, { installation: null, sheets: [], cells: full }).find((x) => x.id === "goods")!;
  assert.equal(done.state, "complete");
  assert.equal(done.progress, 100);
  const none = liveRequirements(eu, { installation: null, sheets: [], cells: {} }).find((x) => x.id === "direct")!;
  assert.equal(none.state, "missing");
});
test("installationRole defaults to own, supplier when a supplierId is set, and honours an explicit role", () => {
  assert.equal(installationRole({ supplierId: "" }), "own");
  assert.equal(installationRole({ supplierId: "s1" }), "supplier");
  assert.equal(installationRole({ role: "oem", supplierId: "" }), "oem");
});
test("supplier installations lead with Smart Link but open the same form", () => {
  const sup = { ...emptyInstallation(false), id: "p3", name: "Mill", supplierId: "s1" } as Installation;
  const r = liveRequirements(eu, { installation: sup, sheets: [] }).find((x) => x.id === "precursors")!;
  assert.equal(r.fix, "smart-link");
  assert.equal(r.href, "/convert/fill/precursors?installation=p3&from=eu-cbam");
});

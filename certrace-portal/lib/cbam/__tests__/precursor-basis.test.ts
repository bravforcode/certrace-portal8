/* Default or actual, per direct precursor — Implementing Regulation (EU)
   2025/2547, Annex II A.1(2), (4), (5) and Annex IV items 22/23/28/35.

   What is pinned here: the default value comes from the EU table (and the
   HIGHEST value when the origin is unknown); an actual value is used only once
   it is complete and admissible, and the default stands in until then; the
   verifier's sectoral scope is matched by sector, not by the regulation's
   category name; the field registry is the Annex IV list with tags and
   required/optional; and the 20 % cap of the transitional period is gone. */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}
const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage };
g.localStorage = storage;

const { createWorkspace } = await import("../../workspace");
const { emptySupplier, getSupplier, precursorContribution, precursorSubmissionGaps, saveSupplier } = await import("../../precursor-suppliers");
const { defaultFor, admissibility, commitPrecursor, supplierGaps, defaultExposure } = await import("../precursor-basis");
const { actualFields, defaultFields, basisCompleteness, sectorParamsFor, needsIndirect, writeField, ACCREDITATION_SECTORS } = await import("../precursor-fields");
const { rateSheet } = await import("../eu-rates");

const mkWs = (year = 2026) => createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "fasteners", productionRoute: "scrap_eaf", country: "TH", year });
const STEEL_CN = "7207 11 90"; // semi-finished steel — a direct precursor of a fastener

test("a default value is the EU table's value for the CN code, the country and the year", () => {
  const d = defaultFor("7208 39 00", "TH", 2026)!;
  const sheet = rateSheet({ cn: "7208 39 00", country: "TH", year: 2026 })!;
  assert.equal(d.total, sheet.defaultValue);
  assert.equal(d.source, "country");
  assert.ok(d.markup > 0, "the mark-up is in the figure");
  assert.ok(defaultFor("7208 39 00", "TH", 2028)!.total > d.total, "the mark-up rises with the year");
});

test("an unidentified origin takes the HIGHEST default for the CN code (Annex IV to the Regulation)", () => {
  const own = defaultFor("7208 39 00", "TH", 2026)!;
  const unknown = defaultFor("7208 39 00", "", 2026, { unknownOrigin: true })!;
  assert.equal(unknown.source, "unknown_origin");
  assert.ok(unknown.total >= own.total, "never lower than a named country's value");
  assert.equal(unknown.splitKnown, false);
});

test("the registry carries an Annex IV tag, an owner and a requirement on every field", () => {
  for (const f of [...actualFields({ cnCode: STEEL_CN, catalogProductId: undefined, country: "TH" }), ...defaultFields()]) {
    assert.ok(f.tag, `${f.key} has a tag`);
    assert.ok(["exporter", "precursor"].includes(f.owner));
    assert.ok(["required", "optional"].includes(f.need));
    if (f.need === "optional" && f.input !== "file") assert.ok(f.whyOptional || f.hint, `${f.key} says why it is optional`);
  }
  const keys = actualFields({ cnCode: STEEL_CN, country: "TH" }).map((f) => f.key);
  for (const k of ["cnCode", "precursorName", "country", "quantityUsedT", "name", "installationName", "specificEmbeddedDirectTco2PerT", "verifierName", "verifierAccreditationNumber", "file:report"]) {
    assert.ok(keys.includes(k), `${k} is asked`);
  }
  const report = actualFields({ cnCode: STEEL_CN, country: "TH" }).find((f) => f.key === "file:report")!;
  assert.equal(report.need, "required", "an accredited verification report is a condition of using actual data (A.1(4))");
  const registry = actualFields({ cnCode: STEEL_CN, country: "TH" }).find((f) => f.key === "installationUniqueId")!;
  assert.equal(registry.need, "optional", "the CBAM Registry identifier is asked only 'if available'");
});

test("indirect emissions are required only for goods outside Annex II", () => {
  assert.equal(needsIndirect({ cnCode: "7207 11 90" }), false, "steel counts direct only");
  assert.equal(needsIndirect({ cnCode: "2523 29 00" }), true, "cement counts indirect");
  const steel = actualFields({ cnCode: "7207 11 90", country: "TH" }).find((f) => f.key === "specificEmbeddedIndirectTco2PerT")!;
  const cement = actualFields({ cnCode: "2523 29 00", country: "TH" }).find((f) => f.key === "specificEmbeddedIndirectTco2PerT")!;
  assert.equal(steel.need, "optional");
  assert.equal(cement.need, "required");
});

test("sector parameters follow Annex IV point 2", () => {
  const crude = sectorParamsFor("Crude steel").map((p) => p.key);
  for (const k of ["scrapUsedTPerT", "preConsumerScrapPct", "mnPct", "crPct", "niPct", "otherAlloyPct"]) assert.ok(crude.includes(k), k);
  assert.deepEqual(sectorParamsFor("Cement").map((p) => p.key), ["clinkerRatioPct"]);
  assert.equal(sectorParamsFor("Cement clinker").length, 0, "N.a. in the Annex");
});

test("default basis: the row takes the EU value and needs only the good and the quantity", () => {
  storage.clear();
  const ws = mkWs();
  const row = commitPrecursor(
    { ...emptySupplier(ws.id, null), precursorName: "Billet", cnCode: STEEL_CN, country: "TH", valueBasis: "default", quantityUsedT: 100 },
    ws,
  );
  assert.equal(row.dataOrigin, "default_value");
  assert.equal(row.seeTco2ePerT, defaultFor(STEEL_CN, "TH", 2026)!.total);
  assert.deepEqual(precursorSubmissionGaps(row), [], "nothing else is asked of an exporter who uses a default");
});

/* An actual row, complete and covering the year. */
const verified = (ws: ReturnType<typeof mkWs>, over: Record<string, unknown> = {}) => ({
  ...emptySupplier(ws.id, null),
  precursorName: "Billet",
  cnCode: STEEL_CN,
  country: "TH",
  valueBasis: "actual" as const,
  reportingPeriodBasis: "default_period" as const,
  quantityUsedT: 100,
  name: "Chonburi Foundry",
  installationName: "Works 2",
  reportingPeriodStart: "2026-01-01",
  reportingPeriodEnd: "2026-12-31",
  specificEmbeddedDirectTco2PerT: 0.31,
  verifierName: "SGS Thailand",
  verifierAccreditationNumber: "TH-ACC-1",
  verifierAccreditationBody: "TLAS",
  verifierAccreditationIssuingCountry: "TH",
  verifierAccreditationExpiryDate: "2027-12-31",
  verificationSectoralScope: "Iron and steel",
  verifierReasonableAssurance: true,
  verificationReportIssueDate: "2027-03-01",
  verificationReportFileId: "ev-1",
  // Annex IV point 2, crude steel: alloy content, scrap per tonne, pre-consumer share
  sectorParams: { mnPct: "0.5", crPct: "0.1", niPct: "0.1", otherAlloyPct: "0.2", scrapUsedTPerT: "1.05", preConsumerScrapPct: "10" },
  ...over,
});

test("actual basis: until the precursor's data is in, the default stands in and nothing unverified is used", () => {
  storage.clear();
  const ws = mkWs();
  const pending = commitPrecursor(verified(ws, { verifierName: "", verificationReportFileId: undefined, specificEmbeddedDirectTco2PerT: 0.31 }), ws);
  const a = admissibility(pending, ws);
  assert.equal(a.usable, false);
  assert.equal(pending.dataOrigin, "default_value");
  assert.equal(pending.seeTco2ePerT, defaultFor(STEEL_CN, "TH", 2026)!.total, "the number in use is the default, not the half-entered figure");
});

test("actual basis: complete, accredited and covering the year → the actual figure is used", () => {
  storage.clear();
  const ws = mkWs();
  const row = commitPrecursor(verified(ws), ws);
  assert.equal(admissibility(row, ws).state, "actual");
  assert.equal(row.dataOrigin, "supplier_verified");
  assert.ok(Math.abs((row.seeTco2ePerT ?? 0) - 0.31) < 1e-9);
  assert.ok((row.seeTco2ePerT ?? 99) < defaultFor(STEEL_CN, "TH", 2026)!.total, "a verified figure beats the marked-up default here");
});

test("the verifier's scope is matched by sector — 'Iron and steel' covers a crude-steel precursor", () => {
  storage.clear();
  const ws = mkWs();
  const row = commitPrecursor(verified(ws, { catalogProductId: "billet", verificationSectoralScope: "Iron and steel" }), ws);
  assert.equal(admissibility(row, ws).usable, true);
  const wrong = commitPrecursor(verified(ws, { verificationSectoralScope: "Cement" }), ws);
  assert.equal(admissibility(wrong, ws).usable, false, "a cement accreditation does not cover steel");
});

test("Annex II A.1(4)(b): a report that does not cover the reporting year is not usable", () => {
  storage.clear();
  const ws = mkWs();
  const row = commitPrecursor(verified(ws, { reportingPeriodStart: "2025-01-01", reportingPeriodEnd: "2025-12-31" }), ws);
  const a = admissibility(row, ws);
  assert.equal(a.state, "not_admissible");
  assert.ok(a.reasons.some((r) => r.includes("does not cover")));
  assert.equal(row.dataOrigin, "default_value");
});

test("Annex II A.1(4)(a): an accreditation that had expired when the report was issued is not usable", () => {
  storage.clear();
  const ws = mkWs();
  const row = commitPrecursor(verified(ws, { verifierAccreditationExpiryDate: "2026-12-31", verificationReportIssueDate: "2027-03-01" }), ws);
  assert.equal(admissibility(row, ws).usable, false);
  assert.equal(row.dataOrigin, "default_value");
});

test("a statement without reasonable assurance never makes a figure usable", () => {
  storage.clear();
  const ws = mkWs();
  const row = commitPrecursor(verified(ws, { verifierReasonableAssurance: false }), ws);
  assert.equal(admissibility(row, ws).usable, false);
  assert.ok(supplierGaps(row).some((g) => g.toLowerCase().includes("reasonable assurance")));
});

test("the supplier's form is gated on the supplier's own fields only", () => {
  storage.clear();
  const ws = mkWs();
  const row = { ...verified(ws), quantityUsedT: undefined, reportingPeriodBasis: undefined, verifierName: "" };
  const gaps = supplierGaps(row as never);
  assert.deepEqual(gaps, ["Name of the verifier"], "the exporter's blank quantity does not block the supplier");
  // …and the sector parameters of Annex IV point 2 ARE the supplier's to give.
  const noSector = supplierGaps({ ...verified(ws), sectorParams: undefined } as never);
  assert.ok(noSector.includes("Manganese (Mn)") && noSector.includes("Scrap used to produce 1 t"));
  const c = basisCompleteness(row as never, { report: true });
  assert.ok(c.exporter.answered < c.exporter.total, "…but it is still the exporter's outstanding item");
});

test("a precursor made inside the EU needs no verifier: zero by construction", () => {
  storage.clear();
  const ws = mkWs();
  const row = commitPrecursor({ ...emptySupplier(ws.id, null), precursorName: "Billet", cnCode: STEEL_CN, country: "DE", valueBasis: "actual", quantityUsedT: 10, reportingPeriodBasis: "default_period" }, ws);
  assert.equal(admissibility(row, ws).usable, true);
  assert.equal(row.seeTco2ePerT, 0);
});

test("a direct precursor's own figure is a leaf even when old upstream tiers still exist", () => {
  storage.clear();
  const ws = mkWs();
  const parent = commitPrecursor({ ...emptySupplier(ws.id, null), precursorName: "Billet", cnCode: STEEL_CN, country: "TH", valueBasis: "default", quantityUsedT: 100 }, ws);
  // An older tier recorded under it before the Precursors tab existed.
  saveSupplier({ ...emptySupplier(ws.id, parent.id), precursorName: "Pig iron", seeTco2ePerT: 9.9, quantityUsedT: 50 });
  const result = precursorContribution(ws);
  const node = result.byNode.find((n) => n.id === parent.id)!;
  assert.equal(node.see, parent.seeTco2ePerT, "the old tier no longer feeds the number");
  assert.ok(getSupplier(ws.id, parent.id));
});

test("there is no 20 % cap: a chain wholly on defaults is reported, not blocked", () => {
  storage.clear();
  const ws = mkWs();
  commitPrecursor({ ...emptySupplier(ws.id, null), precursorName: "Billet", cnCode: STEEL_CN, country: "TH", valueBasis: "default", quantityUsedT: 100 }, ws);
  const result = precursorContribution(ws);
  assert.equal(result.overDefaultCap, false);
  const exposure = defaultExposure(ws);
  assert.equal(exposure.onDefault, 1);
  assert.ok(exposure.markup > 0);
});

/* ── The country of production cannot be identified ────────────────
   2025/2621 Article 1(5): where a country of production cannot be identified for a
   precursor, the Annex IV default values are used. And an ACTUAL value needs the very
   thing that is missing — Annex IV item 23(c) asks for the country of origin (item 22(c)
   asks for it only "where known") and item 28 for the operator and installation of
   origin; Annex II A.1(4) lets third-country data in only from that operator's
   verification report. So no country → default, and the highest one. */
test("ticking 'cannot be identified' clears the country and puts the row on the default value", () => {
  storage.clear();
  const ws = mkWs();
  const base = { ...emptySupplier(ws.id, null), precursorName: "Billet", cnCode: STEEL_CN, country: "TH", valueBasis: "actual" as const };
  const ticked = writeField(base, "originUnknown", true);
  assert.equal(ticked.originUnknown, true);
  assert.equal(ticked.country, "");
  assert.equal(ticked.valueBasis, "default", "the choice moves with the tick, in the same step");
  assert.equal(writeField(ticked, "originUnknown", false).originUnknown, false);
});

test("an actual row with an unidentified country is settled onto the Annex IV default — even with a complete, verified report", () => {
  storage.clear();
  const ws = mkWs();
  const row = commitPrecursor(verified(ws, { originUnknown: true, country: "" }), ws);
  assert.equal(row.valueBasis, "default");
  assert.equal(row.dataOrigin, "default_value");
  const annexIv = defaultFor(STEEL_CN, "", 2026, { unknownOrigin: true })!;
  assert.equal(row.seeTco2ePerT, annexIv.total, "the 1.8-style figure the supplier supplied is NOT taken");
  assert.equal(admissibility({ ...row, valueBasis: "actual" }, ws).usable, false);
  assert.ok(annexIv.total >= defaultFor(STEEL_CN, "TH", 2026)!.total, "and it is the highest value, not a named country's");
});

test("the good is fixed once the precursor is added: CN code and name are locked, in both bases", () => {
  for (const f of [...defaultFields(), ...actualFields({ cnCode: STEEL_CN, country: "TH" })]) {
    if (f.key === "cnCode" || f.key === "precursorName") assert.equal(f.locked, true, `${f.key} (${f.tag}) is locked`);
    else assert.notEqual(f.locked, true, `${f.key} is not locked`);
  }
});

test("scope of accreditation is one of the six CBAM sectors", () => {
  assert.deepEqual([...ACCREDITATION_SECTORS], ["Cement", "Electricity", "Fertilisers", "Iron and steel", "Aluminium", "Hydrogen"]);
  const scope = actualFields({ cnCode: STEEL_CN, country: "TH" }).find((f) => f.key === "verificationSectoralScope")!;
  assert.equal(scope.input, "select");
  assert.deepEqual(scope.options!.map((o) => o.value), [...ACCREDITATION_SECTORS]);
});

test("the unknown-origin box sits with 'Where it was made' on both bases", () => {
  for (const list of [defaultFields(), actualFields({ cnCode: STEEL_CN, country: "TH" })]) {
    const box = list.find((f) => f.key === "originUnknown")!;
    const country = list.find((f) => f.key === "country")!;
    assert.equal(box.group, country.group);
    assert.equal(box.input, "checkbox");
  }
});

test("a default value exists for a precursor from ANY country — listed in Annex I or not", () => {
  const listed = defaultFor(STEEL_CN, "IN", 2026)!;
  const unlisted = defaultFor(STEEL_CN, "AF", 2026)!; // Afghanistan: not in Annex I
  assert.equal(listed.source, "country");
  assert.equal(unlisted.source, "other", "an unlisted country takes 'Other countries and territories'");
  assert.ok(unlisted.total > 0);
});

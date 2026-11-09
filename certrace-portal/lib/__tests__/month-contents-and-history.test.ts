/* ════════════════════════════════════════════════════════════
   THE PLANT'S CHECK STEP, A MONTH WITH NO PRODUCTION, AND THE CARBON PRICE REPORT

   · the supplier's check asks one thing — is it all there — and never judges a figure;
   · a month the exporter marks "no production" is answered, complete and empty, and every reader of the year agrees;
   · every authorisation is kept, newest first, with the minute it was pressed;
   · a claimed carbon price is only as good as the share, the receipt and the references behind it.
   ════════════════════════════════════════════════════════════ */

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

const { runMonthQualityCheck } = await import("../month-quality");
const { emptyMmd } = await import("../workspace-mmd");
const { emptyMonth, emptyFuel, saveMonth, getMonth, markNotManufactured, clearNotManufactured, monthIssues, monthCounts, annualProductionFor, monthStatusLabel, reopenMonth } = await import("../monthly-data");
const { requiredKeysForMonth } = await import("../workspace-evidence");
const { submitWithAttestation, authorisationHistory, submissionFor, markExporterEdited } = await import("../month-submission");
const { carbonPriceGaps, shareFraction, emptyCarbonPrice } = await import("../carbon-price");

const mmd = () => emptyMmd("2026-01-01", "2026-12-31");

/* ── The check step ───────────────────────────────────────────── */

test("the plant's check lists what the month contains, and flags only what is missing — never a figure's size", () => {
  const entry = { ...emptyMonth("ws-1", "2026-03"), productionTonnes: 1_000_000, fuels: [{ ...emptyFuel(), fuelType: "natural_gas", quantity: 5, efTco2PerGj: 99, ncvMjPerUnit: 38, unit: "m3" as const }], electricityMwh: 9_999_999, electricityFactorTco2PerMwh: 50 };
  const report = runMonthQualityCheck({ entry, mmd: mmd(), month: "2026-03", peers: [], documentCount: 0, audience: "supplier" });

  // An absurd production, an impossible emission factor and a grid factor of 50 are all "present" — the exporter has the year beside them.
  assert.deepEqual(report.warnings, [], "no out-of-range, unusual or contradiction findings reach the plant");
  assert.ok(report.mandatory.length > 0, "the empty methodology is still missing");
  assert.equal(report.canSubmit, report.mandatory.length === 0);

  const rows = report.contents.flatMap((s) => s.rows);
  const prod = rows.find((r) => r.label === "Production for the month");
  assert.equal(prod?.state, "ready");
  assert.match(prod?.value ?? "", /1,000,000/);
  assert.equal(rows.find((r) => r.label === "Boundary description")?.state, "missing");
  assert.equal(rows.find((r) => r.label === "Documents behind the figures")?.state, "advice", "a document is asked for, but does not block");
  assert.deepEqual(report.contents.map((s) => s.step), ["mmd", "monthly", "documents"]);
  for (const r of rows) assert.ok(r.field.startsWith("qf-"), "every row is a way back to a field");
});

test("an empty month is missing its production, and the missing row carries what to do about it", () => {
  const entry = emptyMonth("ws-1", "2026-03");
  const report = runMonthQualityCheck({ entry, mmd: mmd(), month: "2026-03", peers: [], documentCount: 2, audience: "supplier" });
  const prod = report.contents.flatMap((s) => s.rows).find((r) => r.label === "Production for the month");
  assert.equal(prod?.state, "missing");
  assert.match(prod?.note ?? "", /denominator/);
  assert.ok(report.mandatory.some((f) => f.field === "qf-production"));
  assert.equal(report.contents.flatMap((s) => s.rows).find((r) => r.label === "Documents behind the figures")?.state, "ready");
});

/* ── A month with no production ───────────────────────────────── */

test("a month the exporter marks as idle is answered: it counts, adds nothing and asks for nothing", () => {
  storage.clear();
  const idle = markNotManufactured("ws-1", "2026-05", "Exporter");
  assert.equal(idle.notManufactured, true);
  assert.equal(idle.status, "submitted");
  assert.equal(monthCounts(idle), true, "it counts toward the year");
  assert.equal(idle.productionTonnes, 0);
  assert.deepEqual(monthIssues(idle), [], "production zero is the answer, not a gap");
  assert.deepEqual(requiredKeysForMonth(idle, true), [], "no document is asked for a month in which nothing was made");
  assert.equal(monthStatusLabel(idle), "No production");

  const year = annualProductionFor({ id: "ws-1", year: 2026 });
  assert.equal(year.monthsCounted, 1);
  assert.equal(year.tonnes, 0, "it adds no tonnes");
  assert.ok(!year.missingMonths.includes("2026-05"), "and it is no longer a missing month");
});

test("marking a month clears what was typed, taking it back returns it to not started, and reopening it clears the flag", () => {
  storage.clear();
  saveMonth({ ...emptyMonth("ws-1", "2026-06"), status: "draft", productionTonnes: 120, fuels: [{ ...emptyFuel(), fuelType: "diesel", quantity: 10 }], notes: "relined furnace" });
  const idle = markNotManufactured("ws-1", "2026-06", "Exporter");
  assert.equal(idle.fuels.length, 0, "a half-filled draft of an idle month would keep adding fuel to the year");
  assert.equal(idle.productionTonnes, 0);
  assert.equal(idle.notes, "relined furnace", "the note stays");

  const back = clearNotManufactured("ws-1", "2026-06");
  assert.equal(back.notManufactured, undefined);
  assert.equal(back.status, "empty");

  markNotManufactured("ws-1", "2026-06", "Exporter");
  const reopened = reopenMonth("ws-1", "2026-06")!;
  assert.equal(reopened.status, "draft");
  assert.equal(reopened.notManufactured, undefined, "if the plant did produce after all, the month is a real draft again");
  assert.equal(getMonth("ws-1", "2026-06")?.notManufactured, undefined);
});

/* ── Who authorised, and when ─────────────────────────────────── */

test("every authorisation is kept, newest first — and an exporter's edit that voids the standing one does not erase the record", () => {
  storage.clear();
  submitWithAttestation("ws-1", "2026-02", { fullName: "Somchai Prasert", role: "Production Manager", at: "2026-03-02T09:15:00.000Z", warningsAcknowledged: 0 });
  submitWithAttestation("ws-1", "2026-02", { fullName: "Nattapong S.", role: "Plant Director", at: "2026-03-09T14:40:00.000Z", warningsAcknowledged: 0 });
  const sub = submissionFor("ws-1", "2026-02");
  assert.deepEqual(authorisationHistory(sub).map((a) => a.fullName), ["Nattapong S.", "Somchai Prasert"]);
  assert.equal(authorisationHistory(sub)[0].at, "2026-03-09T14:40:00.000Z", "the time is the time it was pressed");

  const edited = markExporterEdited("ws-1", "2026-02");
  assert.equal(edited.attestation, null, "the standing attestation is voided");
  assert.equal(authorisationHistory(edited).length, 2, "but the history is the record, and it stays");
  assert.deepEqual(authorisationHistory(null), []);
});

test("a month submitted before the history was kept still shows the one authorisation it had", () => {
  const legacy = { ...submissionFor("ws-9", "2026-01"), state: "submitted" as const, attestation: { fullName: "Old Name", role: "Manager", at: "2026-02-01T08:00:00.000Z", warningsAcknowledged: 0 } };
  assert.deepEqual(authorisationHistory(legacy).map((a) => a.fullName), ["Old Name"]);
});

/* ── The carbon price the report takes ────────────────────────── */

test("a nil return needs nothing; a claim needs the share, the receipt, the law and an independent certifier", () => {
  const nil = { ...emptyCarbonPrice("ws-1"), recorded: true, amountPerTonne: 0 };
  assert.deepEqual(carbonPriceGaps(nil), []);

  const claim = { ...emptyCarbonPrice("ws-1"), recorded: true, amountPerTonne: 200, instrument: "excise_embedded" as const };
  assert.deepEqual(carbonPriceGaps(claim), ["share", "receipt", "legal_basis", "certifier"]);
  assert.deepEqual(carbonPriceGaps({ ...claim, shareOfEmissionsCovered: 40, legalBasis: "Excise Act", certifiedBy: "A. Auditor, Firm" }, true), []);
  assert.deepEqual(carbonPriceGaps({ ...claim, shareOfEmissionsCovered: 40 }, true), ["legal_basis", "certifier"], "the receipt may sit on the Evidence tab rather than on the record");
});

test("the share is a percentage on the tab and a 0–1 fraction in the report, and an unset share is not assumed to be 100%", () => {
  const base = { ...emptyCarbonPrice("ws-1"), recorded: true, amountPerTonne: 200 };
  assert.equal(shareFraction(base), null, "never entered — never assumed");
  assert.equal(shareFraction({ ...base, shareOfEmissionsCovered: 40 }), 0.4);
  assert.equal(shareFraction({ ...base, shareOfEmissionsCovered: 0 }), 0, "zero is an answer");
  assert.equal(shareFraction({ ...base, shareOfEmissionsCovered: 250 }), 1, "clamped");
  assert.equal(shareFraction({ ...base, shareOfEmissionsCovered: -5 }), 0);
});

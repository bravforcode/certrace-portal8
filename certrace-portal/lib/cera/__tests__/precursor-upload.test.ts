/* ════════════════════════════════════════════════════════════
   CERA ON A PRECURSOR'S LINK, PINNED

   The sample that ships with Cera (lib/cera/__tests__/fixtures/…precursor-verification-summary.txt) says everything a precursor's operator is asked:
   it must be read in full, laid out as the form's groups, and written into the row only when confirmed.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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

const {
  analyzePrecursorText,
  applyPrecursorPlan,
  datesIn,
  describePrecursor,
  pairsIn,
  precursorStep,
} = await import("../precursor-upload");
const { emptySupplier } = await import("../../precursor-suppliers");
const { editReading } = await import("../smart-upload");

const SAMPLE = readFileSync(
  new URL(
    "./fixtures/cera-sample-3-precursor-verification-summary.txt",
    import.meta.url,
  ),
  "utf8",
);

const row = () => ({
  ...emptySupplier("ws-1", null),
  precursorName: "Steel billet",
  cnCode: "7207 11 90",
  country: "TH",
  valueBasis: "actual" as const,
});

test("dates are found however a verifier writes them — day first for a numeric date", () => {
  assert.deepEqual(datesIn("1 January 2025 – 31 December 2025"), [
    "2025-01-01",
    "2025-12-31",
  ]);
  assert.deepEqual(datesIn("from 2025-01-01 to 2025-12-31"), [
    "2025-01-01",
    "2025-12-31",
  ]);
  assert.deepEqual(datesIn("issued 14/03/2026"), ["2026-03-14"]);
  assert.deepEqual(datesIn("March 14, 2026"), ["2026-03-14"]);
  assert.deepEqual(
    datesIn("31 Feb 2025"),
    [],
    "a date that does not exist is not guessed at",
  );
});

test("a label and its value are paired, and a dash inside a label does not cut it", () => {
  const pairs = pairsIn(
    "a.txt",
    "Verifier: SGS Thailand\nSEE - direct: 1.84\nAccreditation number ...... TH-1\nplain sentence with no label",
  );
  assert.deepEqual(
    pairs.map((p) => [p.label, p.value]),
    [
      ["Verifier", "SGS Thailand"],
      ["SEE - direct", "1.84"],
      ["Accreditation number", "TH-1"],
    ],
  );
});

test("the sample is read in full: operator, installation, period, emissions and the verifier", () => {
  const a = analyzePrecursorText("summary.txt", SAMPLE, row());
  const by = (k: string) => a.findings.find((f) => f.key === k)?.raw;
  assert.equal(by("name"), "Chonburi Foundry Co., Ltd.");
  assert.equal(by("installationName"), "Chonburi Works No. 2");
  assert.equal(by("installationUniqueId"), "TH-CHON-0042");
  assert.equal(by("unlocode"), "THLCH");
  assert.equal(by("reportingPeriodStart"), "2025-01-01");
  assert.equal(by("reportingPeriodEnd"), "2025-12-31");
  assert.equal(by("specificEmbeddedDirectTco2PerT"), "1.842");
  assert.equal(by("verifierName"), "SGS (Thailand) Limited");
  assert.equal(by("verifierAccreditationNumber"), "TH-ACC-0912");
  assert.equal(by("verifierAccreditationIssuingCountry"), "TH");
  assert.equal(by("verifierAccreditationExpiryDate"), "2028-06-30");
  assert.equal(by("verificationSectoralScope"), "Iron and steel");
  assert.equal(by("verificationReportIssueDate"), "2026-03-14");
  assert.equal(by("verifierReasonableAssurance"), "yes");
});

test("it is laid out as the form's groups, and writes nothing until confirmed — then only what was kept ticked", () => {
  const r = row();
  const a = analyzePrecursorText("summary.txt", SAMPLE, r);
  const step = precursorStep(a, r, "ws-1");
  assert.equal(step.kind, "plan");
  if (step.kind !== "plan") return;
  const sections = new Set(step.plan.readings.map((x) => x.section));
  assert.deepEqual([...sections].sort(), [
    "p_emissions",
    "p_operator",
    "p_period",
    "p_verifier",
  ]);
  assert.equal(step.plan.precursor?.nodeId, r.id);
  assert.equal(r.verifierName ?? "", "", "reading a file changes nothing");

  // Untick the direct emissions and change the accreditation number: the change is what is written, the unticked figure is not.
  let plan = step.plan;
  const direct = plan.readings.find(
    (x) => x.target === "specificEmbeddedDirectTco2PerT",
  )!;
  plan = {
    ...plan,
    readings: plan.readings.map((x) =>
      x.id === direct.id ? { ...x, included: false } : x,
    ),
  };
  const acc = plan.readings.find(
    (x) => x.target === "verifierAccreditationNumber",
  )!;
  plan = editReading(plan, acc.id, { raw: "TH-ACC-0999" });

  const done = applyPrecursorPlan(plan, r);
  assert.equal(done.ok, true);
  assert.equal(done.row.verifierAccreditationNumber, "TH-ACC-0999");
  assert.equal(done.row.verifierName, "SGS (Thailand) Limited");
  assert.equal(
    done.row.specificEmbeddedDirectTco2PerT,
    undefined,
    "an unticked reading is not written",
  );
  assert.equal(done.row.reportingPeriodEnd, "2025-12-31");
  assert.deepEqual(done.sections, [
    "p_operator",
    "p_period",
    "p_emissions",
    "p_verifier",
  ]);
  assert.ok(
    done.missing.some((m) => /direct embedded emissions/i.test(m)),
    "what is still needed is named — the figure that was left out, and the report PDF",
  );
  assert.ok(done.missing.some((m) => /verification report/i.test(m)));
});

test("a PDF is not read — Cera points at the Documents block; a file with no labels asks for a description, then gives up kindly", () => {
  const r = row();
  const pdf = precursorStep(
    { fileName: "report.pdf", readable: false, findings: [] },
    r,
    "ws-1",
  );
  assert.equal(pdf.kind, "stop");
  assert.match((pdf as { text: string }).text, /Documents/);

  const blank = analyzePrecursorText(
    "notes.txt",
    "Thanks for your patience.\nRegards",
    r,
  );
  assert.equal(precursorStep(blank, r, "ws-1").kind, "describe");
  assert.equal(precursorStep(blank, r, "ws-1", "en", true).kind, "stop");

  const described = describePrecursor(
    blank,
    "Verifier: SGS Thailand; Accreditation number: TH-1; Reporting period: 1 January 2025 – 31 December 2025",
    r,
  );
  const keys = described.findings.map((f) => f.key).sort();
  assert.deepEqual(keys, [
    "reportingPeriodEnd",
    "reportingPeriodStart",
    "verifierAccreditationNumber",
    "verifierName",
  ]);
});

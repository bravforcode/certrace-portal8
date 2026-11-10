import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { calculateInstallationReport } from "../report-calculations";
import {
  blankAnswer,
  saveReportAnswer,
  readReportInputs,
  reportRows,
  reportScope,
  answerIssues,
  type ReportInputs,
} from "../report-inputs";
import { REPORT_SECTIONS } from "../report-input-schema";
import { initialInputPlan } from "../verification-inputs";
import { emptyMonth, type MonthlyEntry } from "../monthly-data";
import type { VerificationWorkspace } from "../workspace";
class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}
const storage = new MemoryStorage();
Object.assign(globalThis, {
  window: { localStorage: storage },
  localStorage: storage,
});
const ws = {
  id: "report-test",
  installationId: "factory",
  installationName: "Factory",
  productName: "Steel",
  productId: "billet",
  cnCode: "72071190",
  productionRoute: "EAF",
  year: 2026,
  periodStart: "2026-01-01",
  periodEnd: "2026-01-31",
  selfSupplied: true,
} as VerificationWorkspace;
const plan = initialInputPlan(ws);
const pid = plan.processes[0].id,
  gid = plan.processes[0].products[0].id;
const put = (
  data: ReportInputs,
  id: string,
  values: Record<string, string>[],
  context = "annual",
) => {
  const scope = reportScope(ws, id, context);
  data[scope] ??= {};
  data[scope][id] = {
    applicability: "yes",
    reason: "",
    rows: values.map((v, i) => ({ id: String(i), values: v })),
  };
};
const month = (): MonthlyEntry => ({
  ...emptyMonth(ws.id, "2026-01"),
  status: "submitted",
  productionTonnes: 100,
  noElectricityConfirmed: false,
  fuels: [
    {
      id: "f",
      fuelType: "natural_gas",
      quantity: 100,
      unit: "GJ",
      efTco2PerGj: 0.05,
      factorSource: "supplier_specific",
    },
  ],
  electricitySources: [
    { id: "e", sourceType: "ppa", mwh: 50, factorTco2PerMwh: 0.2 },
  ],
});
beforeEach(() => storage.clear());
test("company facts are shared while annual, monthly and source records remain scoped", () => {
  saveReportAnswer(ws, "0.4", "annual", {
    ...blankAnswer(),
    applicability: "yes",
    rows: [{ id: "1", values: { country: "TH" } }],
  });
  saveReportAnswer(ws, "2.3.35", "month:2026-01", {
    ...blankAnswer(),
    applicability: "no",
    reason: "No CEMS",
  });
  saveReportAnswer(ws, "2.4.27", "precursor:a", {
    ...blankAnswer(),
    applicability: "yes",
    rows: [{ id: "1", values: { origin: "external" } }],
  });
  assert.equal(
    readReportInputs()[reportScope({ ...ws, id: "other" }, "0.4")]["0.4"]
      .rows[0].values.country,
    "TH",
  );
  assert.equal(readReportInputs()["other:month:2026-01"], undefined);
  assert.equal(readReportInputs()[`${ws.id}:precursor:b`], undefined);
});
test("zero is valid, negative readings and missing applicability reasons remain incomplete", () => {
  const section = REPORT_SECTIONS.find((s) => s.id === "2.3.38")!;
  const answer = {
    applicability: "yes" as const,
    reason: "",
    rows: [
      {
        id: "r",
        values: { process: pid, produced: "0", used: "0", exported: "0" },
      },
    ],
  };
  assert.deepEqual(answerIssues(section, answer), []);
  assert.ok(
    answerIssues(section, {
      ...answer,
      rows: [{ id: "r", values: { ...answer.rows[0].values, produced: "-1" } }],
    }).length > 0,
  );
  assert.ok(
    answerIssues(section, { ...blankAnswer(), applicability: "no" }).length > 0,
  );
});
test("a normally required topic accepts a reasoned exception without using old rows", () => {
  const section = REPORT_SECTIONS.find((s) => s.id === "2.5.7")!;
  assert.equal(section.required, true);
  const answer = {
    ...blankAnswer(),
    applicability: "no" as const,
    reason: "No documents in scope for this reporting period",
    rows: [{ id: "old", values: { owner: "Previous operator" } }],
  };
  assert.deepEqual(answerIssues(section, answer), []);
  assert.deepEqual(answerIssues(section, { ...answer, reason: "  " }), [
    "Explain why this does not apply",
  ]);
  saveReportAnswer(ws, section.id, "annual", answer);
  assert.deepEqual(reportRows(readReportInputs(), ws, section.id), []);
});
test("one-process direct and electricity totals use source measurements and divide once", () => {
  const data: ReportInputs = {};
  put(data, "2.2.38", [
    { process: pid, product: gid, directShare: "100", indirectShare: "100" },
  ]);
  const result = calculateInstallationReport(ws, data, [month()], [], [], plan);
  assert.equal(result.installationDirect, 5);
  assert.equal(result.installationIndirect, 10);
  assert.equal(result.electricityFactor, 0.2);
  assert.equal(result.products[0].direct, 0.05);
  assert.equal(
    result.products[0].indirect,
    null,
    "steel indirect emissions are not reported as applicable",
  );
  assert.equal(
    result.ready,
    false,
    "unfilled methods and reporting records must not become ready",
  );
});
test("missing source factors never become a valid zero; draft months are excluded", () => {
  const m = month();
  m.electricitySources![0].factorTco2PerMwh = null;
  const result = calculateInstallationReport(ws, {}, [m], [], [], plan);
  assert.ok(result.findings.some((f) => f.ref === "2.3.18"));
  assert.equal(result.ready, false);
  const draft = calculateInstallationReport(
    ws,
    {},
    [{ ...month(), status: "draft" }],
    [],
    [],
    plan,
  );
  assert.equal(draft.installationDirect, 0);
  assert.equal(draft.monthsCounted, 0);
});
test("allocations cannot exceed 100% or silently omit a process", () => {
  const other = structuredClone(plan);
  other.processes.push({
    ...structuredClone(other.processes[0]),
    id: "p2",
    name: "Rolling",
    products: [],
  });
  const data: ReportInputs = {};
  put(
    data,
    "2.3.33",
    [
      { source: "fuel:f", process: pid, share: "80" },
      { source: "fuel:f", process: "p2", share: "80" },
    ],
    "month:2026-01",
  );
  const result = calculateInstallationReport(
    ws,
    data,
    [month()],
    [],
    [],
    other,
  );
  assert.ok(
    result.findings.some(
      (f) => f.ref === "2.3.33" && f.message.includes("100%"),
    ),
  );
  assert.equal(result.processes[0].direct, 0);
});
test("CEMS integrates mass flow over duration and detects overlaps", () => {
  const data: ReportInputs = {};
  const row = {
    process: pid,
    source: "stack1",
    gas: "CO2",
    start: "2026-01-01T00:00",
    end: "2026-01-01T02:00",
    flow: "1000",
    concentration: "100000",
    gwp: "1",
  };
  put(data, "2.3.35", [row], "month:2026-01");
  const m = { ...month(), fuels: [], electricitySources: [] };
  assert.equal(
    calculateInstallationReport(ws, data, [m], [], [], plan).installationDirect,
    0.2,
  );
  put(
    data,
    "2.3.35",
    [row, { ...row, start: "2026-01-01T01:00" }],
    "month:2026-01",
  );
  assert.ok(
    calculateInstallationReport(ws, data, [m], [], [], plan).findings.some(
      (f) => f.message.includes("overlapping"),
    ),
  );
});
test("unreconciled heat balances and source transfers block complete results", () => {
  const data: ReportInputs = {};
  put(
    data,
    "2.3.41",
    [
      {
        process: pid,
        kind: "heat",
        imported: "30",
        produced: "10",
        used: "20",
        exported: "0",
      },
    ],
    "month:2026-01",
  );
  const result = calculateInstallationReport(ws, data, [month()], [], [], plan);
  assert.equal(result.balances[0].balance, 20);
  assert.ok(result.findings.some((f) => f.ref === "2.2.35"));
});

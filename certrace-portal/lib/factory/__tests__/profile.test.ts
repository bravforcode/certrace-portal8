import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyProfile, factoryGaps, factoryKey, factoryProgress, processesFromSteps, productionMismatch, validateProfile,
  type FactoryProfile,
} from "../profile";

const months = (year: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({ month: `${year}-${String(i + 1).padStart(2, "0")}`, product: "Wire", tonnes: 100 }));

const full: FactoryProfile = {
  version: 1,
  processes: [{ id: "p1", name: "Annealing", step: "other", route: "", inBoundary: true, note: "" }],
  sources: [{ id: "s1", name: "Annealing furnace burner", kind: "combustion", processId: "p1", fuel: "Natural gas", tag: "F-01" }],
  meters: [{ id: "m1", name: "Gas meter GM-1", measures: "Natural gas m3", sourceId: "s1", owner: "Utility team", frequency: "monthly", evidence: "PTT invoice", calibratedUntil: "2027-06-30" }],
  production: months(2026, 12),
  updatedAt: "",
};

test("factory key is per installation", () => {
  assert.equal(factoryKey("inst-1"), "certrace:factory:inst-1");
});
test("a complete profile has no gaps and 100 % progress", () => {
  assert.deepEqual(factoryGaps(full, 2026, "2026-11-11"), []);
  assert.equal(factoryProgress(full, 2026).pct, 100);
});
test("gaps follow the monitoring chain process, source, meter, production", () => {
  const p: FactoryProfile = {
    ...full,
    sources: [...full.sources, { id: "s2", name: "Pickling acid", kind: "process", processId: "p1", fuel: "", tag: "" }],
    meters: [{ ...full.meters[0]!, owner: "", calibratedUntil: "2026-01-31" }],
    production: months(2026, 10).filter((r) => r.month !== "2026-03"),
  };
  assert.deepEqual(
    factoryGaps(p, 2026, "2026-11-11").map((g) => g.key),
    ["sources:s2:no-meter", "meters:m1:owner", "meters:m1:calibration", "production:2026"],
  );
  assert.match(factoryGaps(p, 2026, "2026-11-11").at(-1)!.message, /Mar, Nov, Dec/);
});
test("an empty profile asks for processes first", () => {
  assert.equal(factoryGaps(emptyProfile(), 2026)[0]!.key, "processes:none");
});
test("validation rejects a source that points at no process", () => {
  const bad = validateProfile({ ...full, sources: [{ ...full.sources[0]!, processId: "missing" }] });
  assert.equal(bad.ok, false);
  assert.match((bad as { errors: string[] }).errors.join(), /^sources\.0\.processId/);
});
test("validation rejects a bad month and negative tonnes", () => {
  const bad = validateProfile({ ...full, production: [{ month: "2026-13", product: "Wire", tonnes: -1 }] });
  assert.equal(bad.ok, false);
  assert.equal((bad as { errors: string[] }).errors.length, 2);
});
test("validation rejects rows that are not objects or lack an id", () => {
  const bad = validateProfile({ ...full, processes: [null, { ...full.processes[0]!, id: "" }] });
  assert.equal(bad.ok, false);
  assert.match((bad as { errors: string[] }).errors.join(), /processes\.0/);
  assert.match((bad as { errors: string[] }).errors.join(), /processes\.1\.id/);
});
test("production mismatch compares the year total with the workbook", () => {
  assert.equal(productionMismatch(full, 2026, 1000), 0.2);
  assert.equal(productionMismatch(emptyProfile(), 2026, 1000), null);
});
test("processesFromSteps adds only new names", () => {
  const next = processesFromSteps(full, ["annealing", "Drawing"]);
  assert.deepEqual(next.processes.map((p) => p.name), ["Annealing", "Drawing"]);
});

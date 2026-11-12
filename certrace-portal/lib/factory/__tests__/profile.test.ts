import test from "node:test";
import assert from "node:assert/strict";
import {
  PROFILE_LIMITS,
  emptyProfile,
  factoryGaps,
  factoryKey,
  factoryProgress,
  localDate,
  newId,
  nextMissingMonth,
  processesFromSteps,
  productionMismatch,
  validateProfile,
  monthRowsToAdd,
  clearFieldError,
  type FactoryProfile,
} from "../profile";

const months = (year: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `pr${i + 1}`,
    month: `${year}-${String(i + 1).padStart(2, "0")}`,
    product: "Wire",
    tonnes: 100,
  }));

const full: FactoryProfile = {
  version: 1,
  processes: [
    {
      id: "p1",
      name: "Annealing",
      step: "other",
      route: "",
      inBoundary: true,
      note: "",
    },
  ],
  sources: [
    {
      id: "s1",
      name: "Annealing furnace burner",
      kind: "combustion",
      processId: "p1",
      fuel: "Natural gas",
      tag: "F-01",
    },
  ],
  meters: [
    {
      id: "m1",
      name: "Gas meter GM-1",
      measures: "Natural gas m3",
      sourceId: "s1",
      owner: "Utility team",
      frequency: "monthly",
      evidence: "PTT invoice",
      calibratedUntil: "2027-06-30",
    },
  ],
  production: months(2026, 12),
  updatedAt: "",
};
const errorsOf = (r: ReturnType<typeof validateProfile>) =>
  r.ok ? [] : r.errors;

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
    sources: [
      ...full.sources,
      {
        id: "s2",
        name: "Pickling acid",
        kind: "process",
        processId: "p1",
        fuel: "",
        tag: "",
      },
    ],
    meters: [{ ...full.meters[0]!, owner: "", calibratedUntil: "2026-01-31" }],
    production: months(2026, 10).filter((r) => r.month !== "2026-03"),
  };
  assert.deepEqual(
    factoryGaps(p, 2026, "2026-11-11").map((g) => g.key),
    [
      "sources:s2:no-meter",
      "meters:m1:owner",
      "meters:m1:calibration",
      "production:2026",
    ],
  );
  assert.match(
    factoryGaps(p, 2026, "2026-11-11").at(-1)!.message,
    /Mar, Nov, Dec/,
  );
});
test("the local calendar date is used, so an early-morning reading is not yesterday", () => {
  // 00:30 local time: in any zone east of UTC, the UTC date is the day before.
  assert.equal(localDate(new Date(2026, 10, 11, 0, 30)), "2026-11-11");
  assert.equal(localDate(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});
test("a calibration that expires today is not yet expired at local midnight", () => {
  const p: FactoryProfile = {
    ...full,
    meters: [{ ...full.meters[0]!, calibratedUntil: "2026-11-11" }],
  };
  assert.deepEqual(
    factoryGaps(p, 2026, localDate(new Date(2026, 10, 11, 0, 30))),
    [],
  );
  assert.equal(
    factoryGaps(p, 2026, localDate(new Date(2026, 10, 12, 0, 30)))[0]!.key,
    "meters:m1:calibration",
  );
});
test("an empty profile asks for processes first", () => {
  assert.equal(factoryGaps(emptyProfile(), 2026)[0]!.key, "processes:none");
});
test("validation rejects a source that points at no process", () => {
  const bad = validateProfile({
    ...full,
    sources: [{ ...full.sources[0]!, processId: "missing" }],
  });
  assert.equal(bad.ok, false);
  assert.match(errorsOf(bad).join(), /^sources\.0\.processId/);
});
test("validation rejects a bad month and negative tonnes", () => {
  const bad = validateProfile({
    ...full,
    production: [{ id: "x", month: "2026-13", product: "Wire", tonnes: -1 }],
  });
  assert.equal(bad.ok, false);
  assert.equal(errorsOf(bad).length, 2);
});
test("validation rejects rows that are not objects or lack an id", () => {
  const bad = validateProfile({
    ...full,
    processes: [null, { ...full.processes[0]!, id: "" }],
  });
  assert.equal(bad.ok, false);
  assert.match(errorsOf(bad).join(), /processes\.0/);
  assert.match(errorsOf(bad).join(), /processes\.1\.id/);
});
test("validation rejects a calibration date that does not exist", () => {
  const bad = validateProfile({
    ...full,
    meters: [{ ...full.meters[0]!, calibratedUntil: "2026-02-31" }],
  });
  assert.equal(bad.ok, false);
  assert.match(errorsOf(bad).join(), /^meters\.0\.calibratedUntil/);
  assert.equal(
    validateProfile({
      ...full,
      meters: [{ ...full.meters[0]!, calibratedUntil: "2028-02-29" }],
    }).ok,
    true,
  );
});
test("ids are capped at 64 characters and must be unique within a list", () => {
  const long = validateProfile({
    ...full,
    processes: [{ ...full.processes[0]!, id: "x".repeat(65) }],
  });
  assert.match(errorsOf(long).join(), /^processes\.0\.id/);
  const dup = validateProfile({
    ...full,
    sources: [full.sources[0]!, { ...full.sources[0]!, name: "Second burner" }],
  });
  assert.match(errorsOf(dup).join(), /sources\.1\.id: duplicate id/);
});
test("a month may appear only once in production", () => {
  const dup = validateProfile({
    ...full,
    production: [
      ...full.production,
      { id: "again", month: "2026-01", product: "Wire", tonnes: 1 },
    ],
  });
  assert.match(
    errorsOf(dup).join(),
    /production\.12\.month: this month is already listed/,
  );
});
test("the next row defaults to the first month not yet present", () => {
  const p = {
    ...full,
    production: months(2026, 12).filter((r) => r.month !== "2026-05"),
  };
  assert.equal(nextMissingMonth(p, 2026), "2026-05");
  assert.equal(nextMissingMonth(full, 2026), null);
});
test("validation rebuilds each row from its known fields only", () => {
  const extra = {
    ...full.processes[0]!,
    evil: "x",
  } as (typeof full.processes)[0];
  const ok = validateProfile({ ...full, processes: [extra] });
  assert.equal(ok.ok, true);
  assert.equal(
    "evil" in (ok as { data: FactoryProfile }).data.processes[0]!,
    false,
  );
});
test("production mismatch compares the year total with the workbook", () => {
  assert.equal(productionMismatch(full, 2026, 1000), 0.2);
  assert.equal(productionMismatch(emptyProfile(), 2026, 1000), null);
});
test("processesFromSteps adds only new names", () => {
  const { profile, added, skipped } = processesFromSteps(full, [
    "annealing",
    "Drawing",
  ]);
  assert.deepEqual(
    profile.processes.map((p) => p.name),
    ["Annealing", "Drawing"],
  );
  assert.deepEqual([added, skipped], [1, 0]);
});
test("processesFromSteps stops at the process limit and reports what it skipped", () => {
  const crowded: FactoryProfile = {
    ...full,
    // p1 stays so the existing source still points at a real process; one slot is left free.
    processes: [
      full.processes[0]!,
      ...Array.from({ length: PROFILE_LIMITS.processes - 2 }, (_, i) => ({
        id: `q${i}`,
        name: `Step ${i}`,
        step: "other" as const,
        route: "",
        inBoundary: true,
        note: "",
      })),
    ],
  };
  const r = processesFromSteps(crowded, ["Drawing", "Pickling", "Coating"]);
  assert.equal(r.profile.processes.length, PROFILE_LIMITS.processes);
  assert.deepEqual([r.added, r.skipped], [1, 2]);
  assert.equal(validateProfile(r.profile).ok, true);
});
test("processesFromSteps trims names to the text limit", () => {
  const r = processesFromSteps(full, ["n".repeat(PROFILE_LIMITS.text + 30)]);
  assert.equal(r.profile.processes.at(-1)!.name.length, PROFILE_LIMITS.text);
  assert.equal(validateProfile(r.profile).ok, true);
});
test("new ids are unique, short, and still produced without crypto.randomUUID", () => {
  const a = newId();
  const b = newId();
  assert.notEqual(a, b);
  assert.ok(a.length > 0 && a.length <= 64);
  const fallback = newId(null);
  assert.ok(fallback.length > 0 && fallback.length <= 64);
});
test("Add the 12 months creates only the missing months, with a blank product and unique ids", () => {
  const p = {
    ...full,
    production: months(2026, 12).filter(
      (r) => r.month !== "2026-02" && r.month !== "2026-07",
    ),
  };
  const rows = monthRowsToAdd(p, 2026);
  assert.deepEqual(
    rows.map((r) => r.month),
    ["2026-02", "2026-07"],
  );
  assert.ok(rows.every((r) => r.product === "" && r.tonnes === 0));
  assert.notEqual(rows[0]!.id, rows[1]!.id);
  assert.deepEqual(monthRowsToAdd(full, 2026), []);
});
test("correcting a field clears only that field's error", () => {
  assert.deepEqual(
    clearFieldError(
      ["sources.0.name: required", "meters.1.owner: required"],
      "sources.0.name",
    ),
    ["meters.1.owner: required"],
  );
  // sources.1 must not clear sources.10
  assert.deepEqual(
    clearFieldError(["sources.10.name: required"], "sources.1.name"),
    ["sources.10.name: required"],
  );
});

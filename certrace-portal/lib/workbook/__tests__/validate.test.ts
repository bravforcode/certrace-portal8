import test from "node:test";
import assert from "node:assert/strict";
import { checkRow, rowSignature, type RowContext } from "../validate";

const ctx = (over: Partial<RowContext> = {}): RowContext => ({
  steps: new Set(["melting", "rolling"]),
  files: new Set(["meter-2025.pdf"]),
  numberCols: new Set(["qty", "exported", "load"]),
  unitCols: new Set(["unit"]),
  methodCols: new Set(["method"]),
  fileCols: new Set(["source"]),
  ...over,
});
const product = (cells: Record<string, string>) =>
  checkRow(
    "products",
    { cn: "7213 10 00", item: "Wire rod", qty: "100", unit: "t", ...cells },
    ctx(),
  );

test("a correct product row has nothing flagged", () => {
  assert.deepEqual(product({}).flags, {});
});

// CBAM declares goods by CN code (Reg. 2023/956 Annex I); an unknown code cannot be reported.
test("an unknown CN code is flagged", () => {
  assert.equal(product({ cn: "1234 56 78" }).flags.cn, "warn");
});

// Goods are declared in tonnes and electricity in MWh; another unit makes the report wrong.
test("units follow CBAM: tonnes for goods, MWh for electricity", () => {
  assert.equal(product({ unit: "pcs" }).flags.unit, "warn");
  assert.equal(product({ unit: "kg" }).flags.unit, undefined);
  assert.equal(product({ cn: "2716 00 00", unit: "t" }).flags.unit, "warn");
  assert.equal(
    product({ cn: "2716 00 00", unit: "MWh" }).flags.unit,
    undefined,
  );
});

test("numbers must parse and not be negative", () => {
  assert.equal(product({ qty: "ten" }).flags.qty, "warn");
  assert.equal(product({ qty: "-5" }).flags.qty, "warn");
  assert.equal(product({ qty: "0" }).flags.qty, "warn");
  assert.equal(product({ qty: "1,500.5" }).flags.qty, undefined);
});

test("export to the EU cannot exceed production", () => {
  assert.equal(product({ exported: "150" }).flags.exported, "warn");
  assert.equal(product({ exported: "80" }).flags.exported, undefined);
});

test("required gaps are missing, not warnings", () => {
  const { flags, notes } = product({ qty: "" });
  assert.equal(flags.qty, "missing");
  assert.equal(notes.qty, "Required");
});

// An emission source on a step that 02 does not list cannot be placed in the process map.
test("steps must exist in 02 Process steps", () => {
  const row = { step: "Casting", item: "Scrap", qty: "5", unit: "t" };
  assert.equal(checkRow("materials", row, ctx()).flags.step, "warn");
  assert.equal(
    checkRow("materials", { ...row, step: "Melting" }, ctx()).flags.step,
    undefined,
  );
  // With 02 still empty there is nothing to compare against yet.
  assert.equal(
    checkRow("materials", row, ctx({ steps: new Set() })).flags.step,
    undefined,
  );
});

test("a flow cannot go from a step to itself", () => {
  const f = checkRow(
    "flow",
    { from: "Melting", to: "melting", item: "Billet" },
    ctx(),
  );
  assert.equal(f.flags.to, "warn");
});

// Verification needs the evidence behind each figure (2025/2546 Art 7).
test("a source must be a file in 09 Documents or No file", () => {
  const row = { step: "Melting", item: "Electricity", qty: "5", unit: "MWh" };
  const check = (source: string) =>
    checkRow("energy", { ...row, source }, ctx()).flags.source;
  assert.equal(check("meter-2025.pdf"), undefined);
  assert.equal(check("No file"), undefined);
  assert.equal(check("invoice.pdf"), "warn");
});

test("electricity is measured in an energy unit", () => {
  const row = { step: "Melting", item: "Electricity (grid)", qty: "5" };
  assert.equal(
    checkRow("energy", { ...row, unit: "kg" }, ctx()).flags.unit,
    "warn",
  );
});

test("pick-list columns accept only their list, any case", () => {
  const row = { step: "Melting", item: "LPG", qty: "5", unit: "kg" };
  assert.equal(
    checkRow("energy", { ...row, scope: "scope 1" }, ctx()).flags.scope,
    undefined,
  );
  assert.equal(
    checkRow("energy", { ...row, scope: "Scope 3" }, ctx()).flags.scope,
    "warn",
  );
  assert.equal(
    checkRow("energy", { ...row, method: "Guess" }, ctx()).flags.method,
    "warn",
  );
});

test("evidence dates must be dates, and valid after issued", () => {
  const row = { item: "ISO 14064 cert", covers: "Scope 1" };
  const check = (cells: Record<string, string>) =>
    checkRow("evidence", { ...row, ...cells }, ctx()).flags;
  assert.equal(check({ valid: "next year" }).valid, "warn");
  assert.equal(
    check({ issued: "2025-01-10", valid: "2027-01-09" }).valid,
    undefined,
  );
  assert.equal(
    check({ issued: "2025-01-10", valid: "2024-12-31" }).valid,
    "warn",
  );
});

test("the signature changes with the data and ignores the status cell", () => {
  const a = rowSignature({ item: "LPG", qty: "5" });
  assert.equal(rowSignature({ qty: "5", item: "LPG", status: "x" }), a);
  assert.notEqual(rowSignature({ item: "LPG", qty: "6" }), a);
});

// C5 land use change records where the land is; south and west of 0 are negative.
test("coordinates may be negative but stay in range", () => {
  const luc = (cells: Record<string, string>) =>
    checkRow("cfp-luc", cells, ctx({ numberCols: new Set(["lat", "lng"]) }))
      .flags;
  assert.equal(luc({ lat: "-6.2", lng: "-75.5" }).lat, undefined);
  assert.equal(luc({ lat: "-6.2", lng: "-75.5" }).lng, undefined);
  assert.equal(luc({ lat: "95" }).lat, "warn");
  assert.equal(luc({ lng: "-181" }).lng, "warn");
});

// The TGO EF autofill writes small factors like 5.59e-10; the portal must accept its own value.
test("a factor in scientific notation is a number", () => {
  const f = checkRow(
    "cfp-luc",
    { ef: "5.59e-10" },
    ctx({ numberCols: new Set(["ef"]) }),
  ).flags;
  assert.equal(f.ef, undefined);
});

test("an evidence date must exist on the calendar", () => {
  const check = (issued: string) =>
    checkRow("evidence", { item: "Cert", issued }, ctx()).flags.issued;
  assert.equal(check("2025-02-31"), "warn");
  assert.equal(check("2025-04-31"), "warn");
  assert.equal(check("2025-02-29"), "warn");
  assert.equal(check("2024-02-29"), undefined);
  assert.equal(check("2025"), undefined);
  assert.equal(check("2025-13"), "warn");
});

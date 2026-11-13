import test from "node:test";
import assert from "node:assert/strict";
import { TGO_EF_2565, TGO_EF_2569 } from "../tgo-ef-data";
import { efFill, TGO_EF_OPTIONS, tgoEf } from "../tgo-ef";

// The lists are numbered without gaps; a lost or doubled row would shift every reference after it.
test("both TGO EF lists are complete and numbered without gaps", () => {
  assert.equal(TGO_EF_2569.length, 539);
  assert.equal(TGO_EF_2565.length, 593);
  for (const rows of [TGO_EF_2569, TGO_EF_2565])
    rows.forEach((r, i) => {
      assert.equal(r[0], i + 1);
      assert.ok(Number.isFinite(r[3]) && r[3] >= 0, `row ${r[0]} factor`);
    });
});

test("factors read as printed in the PDFs, including the x10 notation", () => {
  // 2569 p.1 row 1, and row 477 printed as "5.59x10-10".
  assert.deepEqual(TGO_EF_2569[0], [
    1,
    "Acrylonitrile Butadiene Styrene (ABS)",
    "kg",
    4.5845,
  ]);
  assert.equal(TGO_EF_2569[476]![3], 5.59e-10);
  assert.equal(TGO_EF_2565[0]![3], 4.1597);
});

test("every option is unique, so a picked reference names one row", () => {
  assert.equal(new Set(TGO_EF_OPTIONS).size, TGO_EF_OPTIONS.length);
  assert.equal(TGO_EF_OPTIONS.length, 539 + 593);
  assert.ok(TGO_EF_OPTIONS[0]!.startsWith("TGO EF 2569 #1 "));
});

test("a reference resolves back to its row; a typed or altered one does not", () => {
  const ref = TGO_EF_OPTIONS[0]!;
  assert.deepEqual(tgoEf(ref), {
    version: "2569",
    no: 1,
    name: "Acrylonitrile Butadiene Styrene (ABS)",
    unit: "kg",
    ef: 4.5845,
  });
  assert.equal(tgoEf("Supplier EPD 2024"), null);
  assert.equal(tgoEf(ref.replace("#1 ", "#2 ")), null);
});

test("a tkm factor fills the outbound EF on the transport sheet, a kg factor fills EF", () => {
  const tkm = TGO_EF_OPTIONS.find((o) => o.endsWith("[tkm]"))!;
  const transportCols = ["item", "ef_tkm", "ef_km", "ef_ref"];
  assert.deepEqual(Object.keys(efFill(transportCols, tkm)), ["ef_tkm"]);
  const kg = TGO_EF_OPTIONS[0]!;
  assert.deepEqual(efFill(["ef", "ef_source", "ef_ref"], kg), {
    ef: "4.5845",
    ef_source: "TGO EF",
  });
  assert.deepEqual(efFill(["ef"], "my own factor"), {});
});

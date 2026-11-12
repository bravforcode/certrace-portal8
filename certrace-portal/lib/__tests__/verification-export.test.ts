/* ════════════════════════════════════════════════════════════
   THE VERIFICATION FILE CARRIES ITS SCOPE AND NOTHING ELSE

   The builder turns the workbook, the suppliers, the evidence and the carbon
   price into the sheets of one file. These tests hold it to three things: a
   field outside the allowlist never reaches the file even when it is filled;
   a row that did not pass its check keeps its name and reason but no value;
   and the Summary counts match the rows written.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildVerificationExport,
  type VerificationExportInput,
} from "../export/verification-export";
import { buildSheets, type Sheet, type SheetRow } from "../workspace-sheets";
import { emptyInstallation, type Installation } from "../installations";
import { emptySupplier, type PrecursorSupplier } from "../precursor-suppliers";
import type { EvidenceItem } from "../workspace-evidence";
import type { CarbonPriceRecord } from "../carbon-price";
import { readXlsx } from "../workbook/xlsx";
import { buildXlsx } from "../xlsx-write";

const row = (
  cells: Record<string, string>,
  status: SheetRow["status"] = "confirmed",
): SheetRow => ({
  cells,
  status,
});

/* The workbook for one year: every sheet the workspace has, with the rows given. */
function workbook(rows: Record<string, SheetRow[]>): Sheet[] {
  return buildSheets([]).map((s) => ({ ...s, rows: rows[s.id] ?? [] }));
}

const installation = (over: Partial<Installation> = {}): Installation => ({
  ...emptyInstallation(true),
  id: "TH-BKK-01",
  name: "Plant A",
  street: "1 Industrial Road",
  postcode: "10110",
  poBox: "PO 12",
  city: "Bangkok",
  country: "TH",
  unlocode: "THBKK",
  lat: "13.7563",
  lng: "100.5018",
  economicActivity: "Steel rolling",
  contactName: "Somchai Jaidee",
  contactEmail: "somchai-private@example.com",
  contactPhone: "0812345678",
  ...over,
});

const supplier = (over: Partial<PrecursorSupplier>): PrecursorSupplier => ({
  ...emptySupplier("ws-1"),
  isScrap: false,
  cnCode: "7201",
  precursorName: "Pig iron",
  seeTco2ePerT: 1.5,
  dataOrigin: "supplier_verified",
  ...over,
});

const input = (
  over: Partial<VerificationExportInput> = {},
): VerificationExportInput => ({
  installation: installation(),
  year: 2026,
  sheets: workbook({}),
  suppliers: [],
  evidence: [],
  carbonPrices: [],
  generatedAt: new Date("2026-11-11T08:00:00.000Z"),
  ...over,
});

function sheetNamed(
  out: { sheets: { name: string; rows: unknown[][] }[] },
  name: string,
) {
  const s = out.sheets.find((x) => x.name === name);
  assert.ok(s, `no sheet named ${name}`);
  return s.rows;
}

test("a filled field outside the allowlist never reaches the file", () => {
  const out = buildVerificationExport(
    input({
      sheets: workbook({
        products: [
          row({
            cn: "7208",
            item: "Hot-rolled coil",
            qty: "100",
            unit: "t",
            notes: "INTERNAL-NOTE-XYZ",
            cost: "COST-999-THB",
            transport: "TRANSPORT-ROUTE-Q",
          }),
        ],
      }),
    }),
  );
  const everything = JSON.stringify(out.sheets);
  for (const secret of [
    "INTERNAL-NOTE-XYZ",
    "COST-999-THB",
    "TRANSPORT-ROUTE-Q",
    "somchai-private",
    "0812345678",
  ]) {
    assert.equal(
      everything.includes(secret),
      false,
      `${secret} leaked into the export`,
    );
  }
});

test("a row in review keeps its name and says not yet verified, with no values", () => {
  const out = buildVerificationExport(
    input({
      sheets: workbook({
        products: [
          row(
            { cn: "7208", item: "Hot-rolled coil", qty: "100", unit: "t" },
            "review",
          ),
        ],
      }),
    }),
  );
  const goods = sheetNamed(out, "Goods");
  const data = goods.find((r) => r[0] === "Hot-rolled coil");
  assert.ok(data, "the row must still be listed by name");
  assert.deepEqual(data.slice(1, 5), [null, null, null, null]);
  assert.equal(data[5], "not yet verified");
  assert.equal(data[6], "waiting for review");
});

test("a verified row exports its values with status verified", () => {
  const out = buildVerificationExport(
    input({
      sheets: workbook({
        products: [
          row({
            cn: "2601 12 00",
            item: "Hot-rolled coil",
            qty: "100",
            unit: "t",
          }),
        ],
      }),
    }),
  );
  const data = sheetNamed(out, "Goods").find((r) => r[0] === "Hot-rolled coil");
  assert.ok(data, "verified good listed");
  assert.equal(data[1], "2601 12 00");
  assert.equal(data[2], 100);
  assert.equal(data[5], "verified");
  assert.equal(data[6], null);
});

test("a precursor linked to a default value shows no figure", () => {
  const out = buildVerificationExport(
    input({
      sheets: workbook({
        materials: [
          row({
            step: "Smelting",
            item: "Pig iron",
            cn: "7201",
            qty: "10",
            unit: "t",
          }),
        ],
      }),
      suppliers: [supplier({ dataOrigin: "default_value" })],
    }),
  );
  const data = sheetNamed(out, "Precursors").find((r) => r[0] === "Pig iron");
  assert.ok(data);
  assert.deepEqual(data.slice(1, 5), [null, null, null, null]);
  assert.equal(data[5], "not yet verified");
  assert.equal(data[6], "default value");
});

test("a verified precursor exports its quantity, embedded emissions and data origin", () => {
  const out = buildVerificationExport(
    input({
      sheets: workbook({
        materials: [
          row({
            step: "Smelting",
            item: "Pig iron",
            cn: "7201",
            qty: "10",
            unit: "t",
          }),
        ],
      }),
      suppliers: [supplier({})],
    }),
  );
  const data = sheetNamed(out, "Precursors").find((r) => r[0] === "Pig iron");
  assert.ok(data);
  assert.equal(data[1], "7201");
  assert.equal(data[2], 10);
  assert.equal(data[3], 1.5);
  assert.equal(data[4], "Supplier — verified");
  assert.equal(data[5], "verified");
});

test("evidence still in needs_review is listed as not yet verified", () => {
  const item: EvidenceItem = {
    id: "ev-1",
    workspaceId: "ws-1",
    fieldKeys: [],
    sourceType: "utility_invoice",
    fileName: "march-bill.pdf",
    capturedAt: "2026-03-02T10:00:00.000Z",
    extraction: { status: "needs_review", fields: [] },
  };
  const out = buildVerificationExport(input({ evidence: [item] }));
  const data = sheetNamed(out, "Evidence").find(
    (r) => r[0] === "march-bill.pdf",
  );
  assert.ok(data, "document listed by name");
  assert.deepEqual(data.slice(1, 3), [null, null]);
  assert.equal(data[3], "not yet verified");
  assert.equal(data[4], "waiting for review");
});

test("the Summary counts the verified and not-yet-verified rows of each sheet", () => {
  const out = buildVerificationExport(
    input({
      sheets: workbook({
        products: [
          row({ cn: "2601 12 00", item: "Coil", qty: "100", unit: "t" }),
          row(
            { cn: "7208 25 00", item: "Sheet", qty: "50", unit: "t" },
            "review",
          ),
        ],
      }),
    }),
  );
  const summary = sheetNamed(out, "Summary");
  const goodsLine = summary.find((r) => r[0] === "Goods");
  assert.deepEqual(goodsLine?.slice(1), [1, 1]);
  const installationLine = summary.find(
    (r, i) => i > 5 && r[0] === "Installation",
  );
  assert.deepEqual(installationLine?.slice(1), [11, 0]);
});

test("the Summary states the installation, year, generation time and standard", () => {
  const out = buildVerificationExport(input());
  const summary = sheetNamed(out, "Summary");
  const flat = summary.map((r) => r.join("|")).join("\n");
  assert.ok(flat.includes("Plant A"));
  assert.ok(flat.includes("2026"));
  assert.ok(flat.includes("2026-11-11T08:00:00.000Z"));
  assert.ok(flat.includes("EU CBAM"));
  assert.ok(
    flat.includes(
      "This file contains only data in scope for CBAM verification. Rows marked 'not yet verified' have no values.",
    ),
  );
});

test("the file name carries the installation slug and the year", () => {
  const out = buildVerificationExport(input());
  assert.equal(out.fileName, "certrace-verification-plant-a-2026.xlsx");
});

test("a carbon price is listed only when it was recorded", () => {
  const recorded = {
    workspaceId: "ws-1",
    amountPerTonne: 0,
    currency: "THB",
    instrument: "excise",
    recorded: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
  } as unknown as CarbonPriceRecord;
  const out = buildVerificationExport(
    input({ carbonPrices: [{ label: "Steel coil", record: recorded }] }),
  );
  const data = sheetNamed(out, "Carbon price").find(
    (r) => r[0] === "Steel coil",
  );
  assert.ok(data);
  assert.equal(data[1], 0);
  assert.equal(data[4], "verified");

  const none = buildVerificationExport(input({ carbonPrices: [] }));
  assert.equal(
    none.sheets.some((s) => s.name === "Carbon price"),
    false,
  );
});

test("the built file reads back through the portal's reader with the same sheet names", async () => {
  const out = buildVerificationExport(
    input({
      sheets: workbook({
        products: [
          row({ cn: "2601 12 00", item: "=1+1 coil", qty: "100", unit: "t" }),
        ],
      }),
    }),
  );
  const bytes = buildXlsx(out.sheets);
  const read = await readXlsx(
    bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer,
  );
  assert.deepEqual(
    read.map((s) => s.name),
    out.sheets.map((s) => s.name),
  );
  const goods = read.find((s) => s.name === "Goods")!;
  assert.ok(
    goods.rows.some((r) => r[0] === "=1+1 coil"),
    "a formula-like product name stays text",
  );
});

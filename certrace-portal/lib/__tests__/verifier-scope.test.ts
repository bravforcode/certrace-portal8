/* ════════════════════════════════════════════════════════════
   A ROW IS VERIFIED ONLY WHEN A CHECK PASSED

   The verification export never invents a verdict. A workbook row is verified
   when it is neither in review nor marked missing and every required column is
   filled; a precursor also needs its supplier's figure to be verified; evidence
   needs a reviewer or a finished extraction; an installation field needs a value
   that is valid. Anything else is listed, with the reason, and carries no value.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { rowVerification } from "../export/verifier-scope";
import { emptySupplier, type PrecursorSupplier } from "../precursor-suppliers";
import type { EvidenceItem } from "../workspace-evidence";
import type { SheetRow } from "../workspace-sheets";

const row = (cells: Record<string, string>, status: SheetRow["status"] = "confirmed"): SheetRow => ({
  cells,
  status,
});

const NO_SUPPLIERS: PrecursorSupplier[] = [];

const supplier = (over: Partial<PrecursorSupplier>): PrecursorSupplier => ({
  ...emptySupplier("ws-1"),
  isScrap: false,
  cnCode: "7201",
  precursorName: "Pig iron",
  seeTco2ePerT: 1.5,
  dataOrigin: "supplier_verified",
  ...over,
});

const evidence = (over: Partial<EvidenceItem>): EvidenceItem => ({
  id: "ev-1",
  workspaceId: "ws-1",
  fieldKeys: [],
  sourceType: "utility_invoice",
  fileName: "bill.pdf",
  capturedAt: "2026-03-02T10:00:00.000Z",
  ...over,
});

test("a workbook row in review is not verified, whatever its columns say", () => {
  const v = rowVerification(
    "products",
    row({ cn: "7208", item: "Coil", qty: "10", unit: "t" }, "review"),
    { suppliers: NO_SUPPLIERS },
  );
  assert.deepEqual(v, { verified: false, reason: "waiting for review" });
});

test("a row missing a required column is not verified, with the reason 'required field missing'", () => {
  const v = rowVerification("products", row({ cn: "7208", item: "Coil", unit: "t" }), {
    suppliers: NO_SUPPLIERS,
  });
  assert.deepEqual(v, { verified: false, reason: "required field missing" });
});

test("a default confirmed status alone does not verify a row without its required columns", () => {
  const v = rowVerification("products", row({ notes: "todo" }, "confirmed"), { suppliers: NO_SUPPLIERS });
  assert.equal(v.verified, false);
  assert.equal(v.reason, "required field missing");
});

test("a complete confirmed workbook row is verified", () => {
  const v = rowVerification("products", row({ cn: "7208", item: "Coil", qty: "10", unit: "t" }), {
    suppliers: NO_SUPPLIERS,
  });
  assert.deepEqual(v, { verified: true });
});

test("a precursor whose supplier figure is a default value is not verified", () => {
  const v = rowVerification(
    "materials",
    row({ step: "Smelting", item: "Pig iron", cn: "7201", qty: "10", unit: "t" }),
    { suppliers: [supplier({ dataOrigin: "default_value" })] },
  );
  assert.deepEqual(v, { verified: false, reason: "default value" });
});

test("a precursor whose supplier data is not verified is not verified", () => {
  const v = rowVerification(
    "materials",
    row({ step: "Smelting", item: "Pig iron", cn: "7201", qty: "10", unit: "t" }),
    { suppliers: [supplier({ dataOrigin: "supplier_unverified" })] },
  );
  assert.deepEqual(v, { verified: false, reason: "supplier data not verified" });
});

test("a precursor that cannot be linked to any supplier is not verified", () => {
  const v = rowVerification(
    "materials",
    row({ step: "Smelting", item: "Pig iron", cn: "7201", qty: "10", unit: "t" }),
    { suppliers: NO_SUPPLIERS },
  );
  assert.deepEqual(v, { verified: false, reason: "no verified supplier data" });
});

test("a precursor linked to a verified supplier figure is verified", () => {
  const v = rowVerification(
    "materials",
    row({ step: "Smelting", item: "Pig iron", cn: "7201", qty: "10", unit: "t" }),
    { suppliers: [supplier({})] },
  );
  assert.deepEqual(v, { verified: true });
});

test("evidence in needs_review or pending or failed is not verified", () => {
  const ctx = { suppliers: NO_SUPPLIERS };
  assert.equal(
    rowVerification("evidence", evidence({ extraction: { status: "needs_review", fields: [] } }), ctx).verified,
    false,
  );
  assert.equal(
    rowVerification("evidence", evidence({ extraction: { status: "pending", fields: [] } }), ctx).verified,
    false,
  );
  assert.equal(
    rowVerification("evidence", evidence({ extraction: { status: "failed", fields: [], error: "x" } }), ctx).verified,
    false,
  );
});

test("evidence is verified when a reviewer set or its extraction is done", () => {
  const ctx = { suppliers: NO_SUPPLIERS };
  assert.equal(rowVerification("evidence", evidence({ reviewedBy: "u-1" }), ctx).verified, true);
  assert.equal(
    rowVerification("evidence", evidence({ extraction: { status: "done", fields: [] } }), ctx).verified,
    true,
  );
});

test("an installation field is verified when present and valid, otherwise required field missing", () => {
  const ctx = { suppliers: NO_SUPPLIERS };
  assert.deepEqual(rowVerification("installation", { value: "Plant A", valid: true }, ctx), { verified: true });
  assert.deepEqual(rowVerification("installation", { value: "", valid: false }, ctx), {
    verified: false,
    reason: "required field missing",
  });
  assert.deepEqual(rowVerification("installation", { value: "99", valid: false }, ctx), {
    verified: false,
    reason: "invalid value",
  });
});

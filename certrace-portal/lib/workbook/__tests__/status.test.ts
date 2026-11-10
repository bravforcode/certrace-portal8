import test from "node:test";
import assert from "node:assert/strict";
import { installationSheetStatus, missingCells, sheetStatus, SHEET_ORDER, statusTooltip } from "../status";
import { emptyInstallation, isInstallationComplete, type Installation } from "../../installations";
import { installationTabTone, STATUS_TONE } from "../status";
import type { Sheet } from "../../workspace-sheets";

const sheet = (rows: Sheet["rows"]): Sheet => ({
  id: "materials",
  code: "03",
  name: "Raw materials",
  cols: [],
  rows,
});
const req = ["item", "qty", "unit"];

// The tab colour is the customer's to-do list: red must mean "something is
// missing here", never just "you have not looked yet".
test("no values is untouched", () => {
  assert.equal(sheetStatus(sheet([{ cells: {}, status: "empty" }]), req), "untouched");
});
test("a started row without a required column is missing", () => {
  assert.equal(
    sheetStatus(sheet([{ cells: { item: "Wire rod", qty: "10" }, status: "confirmed" }]), req),
    "missing",
  );
});
test("a missing flag is missing even when columns are filled", () => {
  const row = {
    cells: { item: "a", qty: "1", unit: "t" },
    status: "confirmed" as const,
    flags: { qty: "missing" as const },
  };
  assert.equal(sheetStatus(sheet([row]), req), "missing");
});
test("review rows or warn flags give review", () => {
  assert.equal(
    sheetStatus(sheet([{ cells: { item: "a", qty: "1", unit: "t" }, status: "review" }]), req),
    "review",
  );
  const warn = {
    cells: { item: "a", qty: "1", unit: "t" },
    status: "confirmed" as const,
    flags: { qty: "warn" as const },
  };
  assert.equal(sheetStatus(sheet([warn]), req), "review");
});
test("all started rows complete is complete; blank rows are ignored", () => {
  const rows: Sheet["rows"] = [
    { cells: { item: "a", qty: "1", unit: "t" }, status: "confirmed" },
    { cells: {}, status: "empty" },
  ];
  assert.equal(sheetStatus(sheet(rows), req), "complete");
});
test("a status cell alone does not start a row", () => {
  assert.equal(sheetStatus(sheet([{ cells: { status: "review" }, status: "empty" }]), req), "untouched");
});

const labelled = (rows: Sheet["rows"]): Sheet => ({
  ...sheet(rows),
  cols: [
    { key: "item", label: "Item", kind: "text", width: "1fr" },
    { key: "qty", label: "Qty", kind: "number", width: "80px" },
    { key: "unit", label: "Unit", kind: "unit", width: "80px" },
  ],
});

test("missingCells lists required and flagged gaps per started row", () => {
  const s = labelled([
    { cells: {}, status: "empty" },
    { cells: { item: "Wire rod" }, status: "confirmed" },
    { cells: { item: "a", qty: "1", unit: "t" }, status: "confirmed", flags: { qty: "missing" } },
  ]);
  assert.deepEqual(missingCells(s, req), [
    { row: 1, cols: ["qty", "unit"] },
    { row: 2, cols: ["qty"] },
  ]);
});
test("statusTooltip names rows (1-based) and column labels", () => {
  const s = labelled([{ cells: { item: "Wire rod" }, status: "confirmed" }]);
  assert.equal(statusTooltip(s, req), "Missing data — row 1: Qty, Unit");
});
test("statusTooltip caps the list at 5 rows", () => {
  const rows = Array.from({ length: 7 }, () => ({ cells: { item: "x" }, status: "confirmed" as const }));
  assert.match(statusTooltip(labelled(rows), req), /row 5: Qty, Unit; \+2 more$/);
});
test("statusTooltip for other states is the plain label", () => {
  assert.equal(statusTooltip(labelled([{ cells: {}, status: "empty" }]), req), "Not started");
});
test("statusTooltip for a missing-flagged row with no gap columns still says why", () => {
  const s = labelled([{ cells: { item: "a", qty: "1", unit: "t" }, status: "missing" }]);
  assert.equal(sheetStatus(s, req), "missing");
  assert.equal(statusTooltip(s, req), "Missing data — marked missing");
});
test("SHEET_ORDER follows the material flow", () => {
  assert.deepEqual(SHEET_ORDER.slice(0, 4), ["installation", "products", "steps", "materials"]);
  assert.equal(SHEET_ORDER.at(-1), "documents");
});

// The Installation tab reads the same record as Settings, so its colour must
// agree with the "complete" badge shown there.
test("installation tab: no record or a blank record is untouched", () => {
  assert.equal(installationSheetStatus(null), "untouched");
  assert.equal(installationSheetStatus(emptyInstallation()), "untouched");
});
test("installation tab: a started record with gaps is missing", () => {
  const partial: Installation = { ...emptyInstallation(), name: "Rayong Rolling Mill 2" };
  assert.equal(installationSheetStatus(partial), "missing");
  assert.equal(isInstallationComplete(partial), false);
});
test("installation tab: a complete record is complete and matches Settings", () => {
  const full: Installation = {
    ...emptyInstallation(),
    id: "TH-RAYONG-01",
    name: "Rayong Rolling Mill 2",
    street: "1 Moo 2",
    city: "Rayong",
    country: "TH",
    lat: "12.7",
    lng: "101.2",
  };
  assert.equal(installationSheetStatus(full), "complete");
  assert.equal(isInstallationComplete(full), true);
});
test("installation tab: a country alone does not start the site", () => {
  assert.equal(installationSheetStatus({ ...emptyInstallation(), country: "TH" }), "untouched");
});
// A half-entered or out-of-range coordinate pair is not a complete site, even
// though the form would accept the record's other fields.
test("installation tab: an invalid coordinate pair is missing, the same as Settings", () => {
  const base: Installation = {
    ...emptyInstallation(),
    id: "TH-RAYONG-01",
    name: "Rayong Rolling Mill 2",
    street: "1 Moo 2",
    city: "Rayong",
    country: "TH",
    lat: "95",
    lng: "101.2",
  };
  assert.equal(installationSheetStatus(base), "missing");
  assert.equal(installationSheetStatus({ ...base, lat: "12.7", lng: "" }), "missing");
});
test("installation tab tone follows the status colour", () => {
  assert.equal(installationTabTone(null), STATUS_TONE.untouched);
  assert.equal(installationTabTone({ ...emptyInstallation(), name: "x" }), STATUS_TONE.missing);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readDocumentPages } from "../document-reading";
const read = (text: string) => readDocumentPages([{ page: 2, text }]);
test("reads labelled electricity from actual content with period and source page", () => {
  const r = read(
    "Electricity invoice\nIssue date: 2026-04-04\nBilling period: 2026-03-01 to 2026-03-31\nTotal electricity consumed: 125,000 kWh",
  );
  assert.equal(r.month, "2026-03");
  assert.equal(r.fields[0].value, "125000");
  assert.equal(r.fields[0].unit, "kWh");
  assert.equal(r.fields[0].page, 2);
  assert.equal(r.fields[0].accepted, false);
});
test("does not use invoice issue date as a consumption period", () => {
  assert.equal(
    read(
      "Electricity invoice\nIssue date: 2026-04-04\nTotal electricity consumed: 500 kWh",
    ).month,
    undefined,
  );
});
test("multiple-month total is flagged, contradictory totals are omitted", () => {
  const r = read(
    "Electricity\nBilling period: 2026-01-01 to 2026-02-28\nTotal electricity consumed: 500 kWh",
  );
  assert.equal(r.periodConflict, true);
  assert.equal(r.month, undefined);
  assert.equal(
    read(
      "Electricity\nTotal electricity consumed: 500 kWh\nTotal electricity consumed: 600 kWh",
    ).fields.length,
    0,
  );
});
test("delivery is separated from consumption, production is not shipment volume", () => {
  assert.equal(
    read("Natural gas invoice\nQuantity delivered: 500 m3").fields[0].key,
    "fuel-delivered",
  );
  assert.equal(
    read("Natural gas consumption record\nGas consumption: 300 m3").fields[0]
      .key,
    "fuel-quantity",
  );
  assert.equal(
    read(
      "Production report\nReporting period: March 2026\nTotal production: 1,250 tonnes",
    ).fields[0].value,
    "1250",
  );
  assert.equal(read("Shipment\nQuantity: 1250 tonnes").fields.length, 0);
});
test("negative and locale-ambiguous readings are never silently converted to positives", () => {
  assert.equal(
    read("Electricity\nTotal electricity consumed: -500 kWh").fields.length,
    0,
  );
  assert.equal(
    read("Electricity\nTotal electricity consumed: 1,5 kWh").fields.length,
    0,
  );
});

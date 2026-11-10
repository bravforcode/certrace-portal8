import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveEuPrecursorDefault } from "../eu-precursor-defaults";
import { emptySupplier, precursorValueUsable } from "../precursor-suppliers";
import { verifiedReport } from "./precursor-test-fixtures";

test("a Thai billet CN code resolves to the corrected Commission schedule", () => {
  const value = resolveEuPrecursorDefault("7207 11 90", "TH", 2026);
  assert.equal(value?.total, 1.44);
  assert.equal(value?.sheet, "Thailand");
  assert.equal(value?.codeRow, "72071190");
  assert.match(value?.reference ?? "", /2026\/1740/);
});

test("a missing country row uses the published Other countries row", () => {
  const value = resolveEuPrecursorDefault("72011000", "TH", 2026);
  assert.equal(value?.total, 3.48);
  assert.equal(value?.usedOtherCountries, true);
});

test("unknown production country uses Annex IV; missing inputs never guess", () => {
  assert.equal(resolveEuPrecursorDefault("72071190", "ZZ", 2026)?.total, 8.21);
  assert.equal(resolveEuPrecursorDefault("72071190", "", 2026), null);
  assert.equal(resolveEuPrecursorDefault("72071190", "TH", 2025), null);
  assert.equal(resolveEuPrecursorDefault("72071190", "TH", 2027), null);
  assert.equal(resolveEuPrecursorDefault("72071190", "DE", 2026), null);
  assert.equal(resolveEuPrecursorDefault("7207", "TH", 2026), null);
});

test("a default figure is usable only when it matches the selected EU row", () => {
  const selected = resolveEuPrecursorDefault("72071190", "TH", 2026)!;
  const row = {
    ...emptySupplier("ws"),
    country: "TH",
    cnCode: "72071190",
    dataOrigin: "default_value" as const,
    seeTco2ePerT: selected.total,
    defaultValueSourceId: selected.id,
    defaultValueReference: selected.reference,
    defaultValueYear: 2026,
  };
  assert.equal(precursorValueUsable(row), true);
  assert.equal(
    precursorValueUsable({ ...row, seeTco2ePerT: selected.total + 1 }),
    false,
  );
  assert.equal(precursorValueUsable({ ...row, country: "CN" }), false);
});

test("a new exporter row cannot use an actual number that was typed without report provenance", () => {
  const row = {
    ...emptySupplier("ws"),
    ...verifiedReport(),
    country: "TH",
    cnCode: "72071190",
    dataOrigin: "supplier_verified" as const,
    seeTco2ePerT: 1.2,
    specificEmbeddedDirectTco2PerT: 1.2,
    emissionsInputPolicy: "source_only" as const,
  };
  assert.equal(precursorValueUsable(row), false);
  assert.equal(
    precursorValueUsable({
      ...row,
      autofillProvenance: [
        {
          field: "specificEmbeddedDirectTco2PerT",
          documentId: "ev-1",
          page: 2,
          excerpt: "direct 1.2 tCO2e/t",
        },
      ],
    }),
    true,
  );
});

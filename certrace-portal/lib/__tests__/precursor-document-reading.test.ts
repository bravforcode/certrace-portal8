import { test } from "node:test";
import assert from "node:assert/strict";
import { readPrecursorReportPages } from "../precursor-document-reading";

test("proposes only labelled precursor values and keeps their page", () => {
  const result = readPrecursorReportPages([
    {
      page: 3,
      text: [
        "CN code: 7207 11 90",
        "Specific embedded direct emissions: 1.23 tCO₂e/t",
        "Specific embedded indirect emissions: 0.45 tCO₂e/t",
        "Reporting period: 2026-01-01 to 2026-12-31",
        "Unrelated plant emissions: 900 tCO₂e",
      ].join("\n"),
    },
  ]);
  assert.deepEqual(
    Object.fromEntries(result.map((item) => [item.field, item.value])),
    {
      cnCode: "72071190",
      specificEmbeddedDirectTco2PerT: "1.23",
      specificEmbeddedIndirectTco2PerT: "0.45",
      reportingPeriodStart: "2026-01-01",
      reportingPeriodEnd: "2026-12-31",
    },
  );
  assert.ok(result.every((item) => item.page === 3 && item.excerpt));
});

test("conflicting values are not suggested", () => {
  const result = readPrecursorReportPages([
    { page: 1, text: "Specific embedded direct emissions: 1.23 tCO2e/t" },
    { page: 2, text: "Specific embedded direct emissions: 2.34 tCO2e/t" },
  ]);
  assert.equal(
    result.some((item) => item.field === "specificEmbeddedDirectTco2PerT"),
    false,
  );
});

test("a clearly labelled total intensity can be read without a direct split", () => {
  const result = readPrecursorReportPages([
    { page: 2, text: "Total specific embedded emissions: 1.88 tCO2e/t" },
  ]);
  assert.deepEqual(
    result.map(({ field, value }) => [field, value]),
    [["seeTco2ePerT", "1.88"]],
  );
});

test("a report split takes precedence over a redundant total", () => {
  const result = readPrecursorReportPages([
    {
      page: 2,
      text: "Specific embedded direct emissions: 1.2 tCO2e/t\nTotal specific embedded emissions: 1.3 tCO2e/t",
    },
  ]);
  assert.equal(
    result.some(({ field }) => field === "seeTco2ePerT"),
    false,
  );
  assert.equal(
    result.some(({ field }) => field === "specificEmbeddedDirectTco2PerT"),
    true,
  );
});

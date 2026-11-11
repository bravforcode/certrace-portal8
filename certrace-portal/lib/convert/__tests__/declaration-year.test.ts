import test from "node:test";
import assert from "node:assert/strict";
import { declarationYear, generatedDate, yearOf } from "../declaration-year";

// Local-time midday, so the year does not shift with the test machine's timezone.
const mid2025 = new Date(2025, 5, 15, 12).getTime();

test("a numeric updatedAt (epoch ms, as the backend stores it) gives its year without throwing", () => {
  const d = { updatedAt: mid2025 } as const;
  assert.equal(declarationYear(d), 2025);
  assert.equal(generatedDate(d)?.getFullYear(), 2025);
});
test("periodStart wins over the timestamps", () => {
  assert.equal(declarationYear({ periodStart: "2026-01-01", updatedAt: mid2025 }), 2026);
});
test("an ISO string timestamp is read too", () => {
  assert.equal(declarationYear({ createdAt: "2024-03-02T00:00:00Z" }), 2024);
});
test("no usable value gives null, never NaN", () => {
  assert.equal(declarationYear({}), null);
  assert.equal(yearOf("not a date"), null);
  assert.equal(yearOf(Number.NaN), null);
  assert.equal(generatedDate({ updatedAt: "not a date" }), null);
});

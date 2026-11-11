import test from "node:test";
import assert from "node:assert/strict";
import { parseSheetParam, parseYearParam, withQueryParams } from "../url-state";

test("parseSheetParam returns a known sheet id", () => {
  assert.equal(parseSheetParam("steps", ["materials", "steps"], "materials"), "steps");
});
test("parseSheetParam falls back to the default for an unknown or missing id", () => {
  assert.equal(parseSheetParam("nope", ["materials", "steps"], "materials"), "materials");
  assert.equal(parseSheetParam(null, ["materials", "steps"], "materials"), "materials");
});
test("parseYearParam accepts a four-digit year inside the range", () => {
  assert.equal(parseYearParam("2026", [2020, 2026, 2031]), 2026);
});
test("parseYearParam rejects years outside the range and malformed values", () => {
  assert.equal(parseYearParam("2019", [2020, 2026]), null);
  assert.equal(parseYearParam("26", [2026]), null);
  assert.equal(parseYearParam("2026x", [2026]), null);
  assert.equal(parseYearParam(null, [2026]), null);
});
test("withQueryParams sets the year and keeps the other params", () => {
  assert.equal(withQueryParams("installation=site-1&view=flow", { year: "2027" }), "installation=site-1&view=flow&year=2027");
});
test("withQueryParams replaces an existing year in place", () => {
  assert.equal(withQueryParams("year=2026&sheet=steps", { year: "2027" }), "year=2027&sheet=steps");
});
test("withQueryParams deletes a key when its value is null", () => {
  assert.equal(withQueryParams("view=flow&year=2026", { view: null }), "year=2026");
});

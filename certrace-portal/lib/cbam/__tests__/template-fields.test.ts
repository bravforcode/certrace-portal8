import test from "node:test";
import assert from "node:assert/strict";
import { CBAM_FIELDS, cbamCellKey, cbamFieldsFor, cbamProgress } from "../template-fields";

const ITEMS = [
  "installation",
  "goods",
  "direct",
  "indirect",
  "precursors",
  "monitoring",
  "communication",
  "verification",
] as const;

// Two fields sharing an id would overwrite each other's saved answer.
test("field ids are unique across the template", () => {
  const ids = CBAM_FIELDS.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

// The backend rejects any cell key outside this shape, so one bad id would fail every save of that field.
test("every cell key matches the backend CELL_KEY pattern", () => {
  for (const f of CBAM_FIELDS) assert.match(cbamCellKey(f), /^[a-z0-9-]{1,32}:\d{1,5}:[a-z0-9_-]{1,40}$/, f.id);
});

// An item with no field renders an empty form. Carbon price has no input in the template, so it stays empty on purpose.
test("every item except carbon-price has at least one field", () => {
  for (const item of ITEMS) assert.ok(cbamFieldsFor(item).length > 0, item);
  assert.equal(cbamFieldsFor("carbon-price").length, 0);
});

// A dropdown without its option list would show a select the user cannot answer.
test("every select field has options", () => {
  for (const f of CBAM_FIELDS.filter((f) => f.kind === "select")) assert.ok(f.options?.length, f.id);
});

// The "x of y required filled" count must ignore optional blanks, or an item could never reach complete.
test("cbamProgress counts only non-optional filled fields", () => {
  const fields = cbamFieldsFor("installation");
  const required = fields.filter((f) => !f.optional);
  const optional = fields.find((f) => f.optional);
  assert.ok(required.length > 0 && optional, "installation needs one required and one optional field");
  const total = required.length;

  assert.deepEqual(cbamProgress({}, "installation"), { filled: 0, total });
  assert.deepEqual(
    cbamProgress({ [cbamCellKey(required[0])]: "x", [cbamCellKey(optional)]: "y" }, "installation"),
    { filled: 1, total },
  );
  // A whitespace-only answer is not an answer.
  assert.deepEqual(cbamProgress({ [cbamCellKey(required[0])]: "   " }, "installation"), { filled: 0, total });
});

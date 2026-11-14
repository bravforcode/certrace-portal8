import test from "node:test";
import assert from "node:assert/strict";
import { buildSheets } from "../workspace-sheets";

/* The backend refuses any cell whose key does not match its CELL_KEY pattern
   (certrace-backend/src/modules/workbooks/model.ts), so a camelCase column key renders but
   every value typed into it is lost on save. */
const CELL_KEY = /^[a-z0-9-]{1,32}:\d{1,5}:[a-z0-9_-]{1,40}$/;

test("every workspace cell key is one the backend accepts, so no column silently drops its values", () => {
  const bad = buildSheets([]).flatMap((s) =>
    s.cols.map((c) => `${s.id}:0:${c.key}`).filter((k) => !CELL_KEY.test(k)),
  );
  assert.deepEqual(bad, []);
});

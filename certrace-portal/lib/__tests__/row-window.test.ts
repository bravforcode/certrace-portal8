/* Long sheets render only the rows near the viewport. These pin the range maths:
   a wrong range shows blank gaps or drops the row being edited. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { rowWindow } from "../row-window";

const opts = { rowHeight: 32, overscan: 10, threshold: 200 };

test("a sheet under the threshold renders every row", () => {
  assert.deepEqual(
    rowWindow({ ...opts, total: 150, top: -5000, viewport: 800 }),
    {
      start: 0,
      end: 150,
    },
  );
});

test("rows above and below the viewport are skipped, with overscan", () => {
  // The first data row sits 3,200px above the viewport top: rows 100..125 are on screen.
  const w = rowWindow({ ...opts, total: 1000, top: -3200, viewport: 800 });
  assert.deepEqual(w, { start: 90, end: 135 });
});

test("before the grid scrolls into view, only the top rows render", () => {
  const w = rowWindow({ ...opts, total: 1000, top: 2000, viewport: 800 });
  assert.deepEqual(w, { start: 0, end: 10 });
});

test("the range never runs past the last row", () => {
  // Row 975 is at the viewport top; the viewport reaches past row 1000.
  const w = rowWindow({ ...opts, total: 1000, top: -31200, viewport: 800 });
  assert.deepEqual(w, { start: 965, end: 1000 });
});

test("the row being edited stays rendered after the user scrolls away", () => {
  // Unmounting the editor would drop the typed value, so the range stretches to keep it.
  const w = rowWindow({
    ...opts,
    total: 1000,
    top: -3200,
    viewport: 800,
    keep: 5,
  });
  assert.deepEqual(w, { start: 5, end: 135 });
  const below = rowWindow({
    ...opts,
    total: 1000,
    top: -3200,
    viewport: 800,
    keep: 400,
  });
  assert.deepEqual(below, { start: 90, end: 401 });
});

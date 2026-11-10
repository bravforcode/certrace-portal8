import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarDate } from "../calendar-date";

test("backend timestamps and form dates select the same calendar day without timezone shifting", () => {
  for (const value of [
    "2026-01-01",
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T23:00:00-08:00",
  ]) {
    const date = calendarDate(value)!;
    assert.deepEqual(
      [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()],
      [2026, 0, 1, 0],
    );
  }
  assert.equal(calendarDate("2028-02-29T00:00:00Z")?.getDate(), 29);
});

test("empty or invalid saved dates cannot poison the calendar month navigation", () => {
  for (const value of [
    undefined,
    "",
    "Invalid Date",
    "2026-02-29",
    "2026-13-01",
    "2026-01-00",
  ]) {
    assert.equal(calendarDate(value), undefined);
  }
});

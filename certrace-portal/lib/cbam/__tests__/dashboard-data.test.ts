/* ════════════════════════════════════════════════════════════
   THE DASHBOARD'S NUMBERS — the dates and the sample estate

   The dates are the regulation's, stated once with who each binds; the countdown on the first tile is the days to
   30 September 2027, the day the exporter's buyers file — so it is the day the exporter's verified figures must
   be with them. The sample estate is made up, never read from or written to the account.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}
const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage };
g.localStorage = storage;

const { keyDates, readDashboard } = await import("../dashboard-data");
const { sampleDashboard } = await import("./fixtures/dashboard-sample");
const { daysToNextDeclarationDeadline } = await import(
  "../dashboard-aggregates"
);

test("the dates that matter are in order, none of them already past, and each says who it binds", () => {
  const now = new Date("2026-10-25T09:00:00");
  const list = keyDates(now);
  assert.ok(list.length >= 5);
  assert.deepEqual(
    list.map((d) => d.date),
    [...list.map((d) => d.date)].sort(),
  );
  assert.ok(list.every((d) => new Date(`${d.date}T23:59:59`) >= now));
  assert.ok(list.every((d) => ["you", "buyers", "both"].includes(d.who)));
  const declaration = list.find((d) => d.date === "2027-09-30");
  assert.equal(
    declaration?.who,
    "both",
    "the first declaration is the buyers' filing and the exporter's deadline to supply for it",
  );
  assert.equal(
    list[0].date,
    "2026-12-31",
    "the exporter's own date — the reporting year ends — comes first",
  );
});

test("a date that has gone by is not listed", () => {
  const list = keyDates(new Date("2027-10-01T09:00:00"));
  assert.ok(!list.some((d) => d.date === "2027-09-30"));
  assert.ok(list.some((d) => d.date === "2027-10-31"));
});

test("the countdown is the days to the next 30 September, for the exporter as for the buyer", () => {
  assert.equal(
    daysToNextDeclarationDeadline(new Date("2026-10-25T09:00:00")),
    341,
  );
  assert.equal(
    readDashboard(new Date("2026-10-25T09:00:00")).daysToDeadline,
    341,
  );
  assert.equal(
    sampleDashboard(new Date("2026-10-25T09:00:00")).deadline.getMonth(),
    8,
  );
  assert.equal(
    sampleDashboard(new Date("2026-10-25T09:00:00")).deadline.getDate(),
    30,
  );
});

test("an empty account has nothing of its own, and the sample estate is a whole one", () => {
  const empty = readDashboard(new Date("2026-10-25T09:00:00"));
  assert.equal(empty.hasFigures, false);
  assert.equal(empty.company.reports, 0);
  const sample = sampleDashboard(new Date("2026-10-25T09:00:00"));
  assert.equal(sample.hasFigures, true);
  assert.ok(
    sample.carbon.rows.length > 0 &&
      sample.chain.total > 0 &&
      sample.actions.length > 0 &&
      sample.activity.length > 0,
  );
  assert.equal(
    storage.getItem("certrace:workspaces"),
    null,
    "the sample is never written to the account",
  );
});

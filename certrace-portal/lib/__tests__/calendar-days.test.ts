/* ════════════════════════════════════════════════════════════
   ONE LATE MONTH IS ONE NUMBER OF DAYS LATE

   It used to be 71 on the month's card (whole hours since the deadline's last second), 72 in the Smart
   Links table (rounded) and 73 in the bell and on the dashboard (rounded from the deadline's midnight).
   Late is counted on the calendar now, everywhere: due the 15th, today the 26th — 11 days late.
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

const { calendarDaysUntil, countdownFor, markMonthSent } = await import("../month-dispatch");
const { countdown } = await import("../smart-links");
const { actionQueueFor } = await import("../cbam/action-queue");
const { createWorkspace } = await import("../workspace");

const at = (iso: string) => new Date(iso);

test("days are counted on the calendar, whatever the time of day", () => {
  const due = new Date(2026, 7, 15); // 15 Aug 2026
  assert.equal(calendarDaysUntil(due, new Date(2026, 9, 26, 0, 5)), -72);
  assert.equal(calendarDaysUntil(due, new Date(2026, 9, 26, 13, 45)), -72);
  assert.equal(calendarDaysUntil(due, new Date(2026, 9, 26, 23, 59)), -72);
  assert.equal(calendarDaysUntil(due, new Date(2026, 7, 15, 9, 0)), 0, "the due day itself is today");
  assert.equal(calendarDaysUntil(due, new Date(2026, 7, 16, 0, 1)), -1, "the day after is one day late");
  assert.equal(calendarDaysUntil(due, new Date(2026, 7, 12, 22, 0)), 3);
});

test("the month's card, the Smart Links table and the action queue say the same number", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  markMonthSent(ws.id, "2026-07", 15);
  const now = new Date(2026, 9, 26, 13, 45);

  const card = countdownFor("2026-07", 15, now);
  assert.ok(card.overdue);
  assert.equal(card.label, "72 days late");

  const queue = actionQueueFor([ws], now).find((i) => i.type === "monthly_data");
  assert.equal(queue?.daysUntilDue, -72);

  const due = new Date(2026, 7, 15, 23, 59, 59, 999);
  assert.equal(countdown(due.getTime() - now.getTime(), undefined, due), "72 days late");
});

test("the first day past the deadline is one day late, not zero and not an hour", () => {
  const now = new Date(2026, 7, 16, 8, 0);
  assert.equal(countdownFor("2026-07", 15, now).label, "1 day late");
  const due = new Date(2026, 7, 15, 23, 59, 59, 999);
  assert.equal(countdown(due.getTime() - now.getTime(), undefined, due), "1 day late");
});

test("on the last day it is hours left, and a day before it is one day left", () => {
  assert.match(countdownFor("2026-07", 15, new Date(2026, 7, 15, 9, 0)).label, /hours? left/);
  assert.equal(countdownFor("2026-07", 15, new Date(2026, 7, 14, 9, 0)).label, "1 day left");
});

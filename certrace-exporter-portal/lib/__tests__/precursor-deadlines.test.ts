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

const { filingDeadlineFor, precursorSeeDeadlineFor, mmdFinalizationDeadlineFor, DEFAULT_PRECURSOR_DEADLINE_BUFFER_DAYS } = await import("../cbam/precursor-deadlines");
const { allPrecursorSuppliers, saveSupplier, emptySupplier } = await import("../precursor-suppliers");
const { createWorkspace } = await import("../workspace");

/* ── The 1-August-minus-buffer math ─────────────────────────────── */

test("the filing deadline is 30 September of the year AFTER the reporting period", () => {
  const d = filingDeadlineFor(2026);
  assert.equal(d.getFullYear(), 2027);
  assert.equal(d.getMonth(), 8);
  assert.equal(d.getDate(), 30);
});

test("the default 60-day buffer lands the precursor deadline on 1 August", () => {
  assert.equal(DEFAULT_PRECURSOR_DEADLINE_BUFFER_DAYS, 60);
  const d = precursorSeeDeadlineFor({ year: 2026 }, undefined, new Date(2026, 0, 1));
  assert.equal(d.due.getFullYear(), 2027);
  assert.equal(d.due.getMonth(), 7); // August, 0-indexed
  assert.equal(d.due.getDate(), 1);
});

test("a different buffer moves the deadline earlier, not the filing date itself", () => {
  const d90 = precursorSeeDeadlineFor({ year: 2026 }, 90, new Date(2026, 0, 1));
  const d60 = precursorSeeDeadlineFor({ year: 2026 }, 60, new Date(2026, 0, 1));
  assert.ok(d90.due.getTime() < d60.due.getTime(), "a larger buffer means an earlier deadline");
});

test("the precursor deadline is overdue once 1 August has passed, due soon within the window before it, on track otherwise", () => {
  const early = precursorSeeDeadlineFor({ year: 2026 }, undefined, new Date(2026, 0, 1));
  assert.equal(early.status, "on_track");

  const nearlyDue = precursorSeeDeadlineFor({ year: 2026 }, undefined, new Date(2027, 6, 15)); // mid-July 2027, ~17 days before Aug 1
  assert.equal(nearlyDue.status, "due_soon");

  const late = precursorSeeDeadlineFor({ year: 2026 }, undefined, new Date(2027, 7, 15)); // mid-August 2027
  assert.equal(late.status, "overdue");
});

/* ── MMD finalisation ─────────────────────────────────────────── */

test("the MMD finalisation deadline is the reporting year's own last day", () => {
  const d = mmdFinalizationDeadlineFor({ year: 2026 }, new Date(2026, 5, 1));
  assert.equal(d.due.getFullYear(), 2026);
  assert.equal(d.due.getMonth(), 11);
  assert.equal(d.due.getDate(), 31);
});

test("the MMD deadline reads overdue once January of the next year arrives", () => {
  const d = mmdFinalizationDeadlineFor({ year: 2026 }, new Date(2027, 0, 15));
  assert.equal(d.status, "overdue");
});

/* ── allPrecursorSuppliers cross-workspace aggregation ──────────── */

test("an account with no workspaces has no precursor suppliers", () => {
  storage.clear();
  assert.deepEqual(allPrecursorSuppliers([]), []);
});

test("precursor suppliers from every workspace are returned, each carrying its own workspace", () => {
  storage.clear();
  const wsA = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const wsB = createWorkspace({ installationId: "TH-B", installationName: "Plant B", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(wsA.id, null), name: "Foundry A" });
  saveSupplier({ ...emptySupplier(wsB.id, null), name: "Foundry B1" });
  saveSupplier({ ...emptySupplier(wsB.id, null), name: "Foundry B2" });

  const rows = allPrecursorSuppliers([wsA, wsB]);
  assert.equal(rows.length, 3);
  assert.equal(rows.filter((r) => r.workspace.id === wsA.id).length, 1);
  assert.equal(rows.filter((r) => r.workspace.id === wsB.id).length, 2);
  assert.ok(rows.every((r) => r.supplier.name.startsWith("Foundry")));
});

test("scrap precursors are excluded from the cross-workspace list", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Scrap Co", isScrap: true });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Real Foundry" });
  const rows = allPrecursorSuppliers([ws]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].supplier.name, "Real Foundry");
});

/* ════════════════════════════════════════════════════════════
   "OPEN IT" LEADS TO WHERE THE FIGURES WENT

   After a fill, the button under Cera's message takes the reader to the part
   of the month's form that took most of the readings — not to the top of a
   long page.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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

const { busiestSection, focusHash, requestFocus, takeFocus } = await import("../focus");
const { analyzeText, applyPlan, nextStep } = await import("../smart-upload");
const { createWorkspace, listWorkspaces } = await import("../../workspace");
const { emptyInstallation, saveInstallation } = await import("../../installations");

const SAMPLE_1 = readFileSync(new URL("../../../public/cera-samples/cera-sample-1-monthly-report-march-2026.txt", import.meta.url), "utf8");

const rows = (...s: [string, boolean?][]) => s.map(([section, included = true]) => ({ section: section as never, included }));

test("the busiest part of the form is the one with most readings written", () => {
  assert.equal(busiestSection(rows(["production"], ["fuel"], ["fuel"], ["fuel"], ["electricity"])), "fuel");
  assert.equal(busiestSection(rows(["production"], ["electricity"], ["electricity"], ["fuel"])), "electricity");
});

test("readings the reader unticked do not count, and a tie goes to the part that comes first in the form", () => {
  assert.equal(busiestSection(rows(["fuel"], ["fuel"], ["fuel", false], ["electricity"], ["electricity"])), "fuel");
  assert.equal(busiestSection(rows(["fuel", false], ["fuel", false], ["electricity"])), "electricity");
});

test("notes only win when nothing else was written", () => {
  assert.equal(busiestSection(rows(["notes"], ["production"])), "production");
  assert.equal(busiestSection(rows(["notes"])), "notes");
});

test("the link's hash names the form's own anchors, with both blocks where a route can use either", () => {
  assert.equal(focusHash("fuel"), "#qf-fuels");
  assert.equal(focusHash("process"), "#qf-processBasis,qf-materials");
});

test("a note left for an open page is taken once", () => {
  requestFocus("#qf-fuels");
  assert.equal(takeFocus(), "qf-fuels");
  assert.equal(takeFocus(), null);
});

test("filling a monthly report says where most of it went", () => {
  storage.clear();
  saveInstallation({ ...emptyInstallation(true), id: "TH-RAYONG-01", name: "Rayong Works", street: "1", postcode: "2", city: "R", country: "TH", unlocode: "THMAT", lat: "1", lng: "1" });
  createWorkspace({ installationId: "TH-RAYONG-01", installationName: "Rayong Works", productId: "ironore", productionRoute: "sintering", year: 2026, selfSupplied: true });
  const step = nextStep(analyzeText("report.txt", SAMPLE_1), {}, listWorkspaces());
  assert.equal(step.kind, "plan");
  if (step.kind !== "plan") return;
  const done = applyPlan(step.plan);
  assert.equal(done.ok, true);
  assert.equal(done.focus, "fuel", "two fuels, each with a quantity and a calorific value, outweigh the rest");
});

/* ── A supplier's link is about ONE month ───────────────────── */
test("on a supplier's link a file about another month is turned back, and one that names no month is taken as this one", () => {
  storage.clear();
  saveInstallation({ ...emptyInstallation(true), id: "TH-RAYONG-01", name: "Rayong Works", street: "1", postcode: "2", city: "R", country: "TH", unlocode: "THMAT", lat: "1", lng: "1" });
  const ws = createWorkspace({ installationId: "TH-RAYONG-01", installationName: "Rayong Works", productId: "ironore", productionRoute: "sintering", year: 2026, selfSupplied: true });
  const answers = { workspaceId: ws.id, lockedMonth: "2026-04" };

  const other = nextStep(analyzeText("r.txt", SAMPLE_1), answers, listWorkspaces());
  assert.equal(other.kind, "stop", "the sample is a March report; this link is April");
  assert.match((other as { text: string }).text, /April 2026/);

  const none = nextStep(analyzeText("r.txt", "Natural gas: 12,000 m3\nProduction: 4,000 t\n"), answers, listWorkspaces());
  assert.equal(none.kind, "plan");
  if (none.kind === "plan") assert.equal(none.plan.month, "2026-04");

  const thai = nextStep(analyzeText("r.txt", SAMPLE_1), answers, listWorkspaces(), "th");
  assert.equal(thai.kind, "stop");
  assert.match((thai as { text: string }).text, /เมษายน 2026/);
});

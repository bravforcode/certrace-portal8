/* ════════════════════════════════════════════════════════════
   THE COST AVOIDANCE CALCULATOR — pinned against the prompt pack's own
   worked example

   SEE_default = 2.60, SEE_actual = 2.10 → SEE_gap = 0.50 tCO2e/t
   export_volume = 2,000 t · price = €75.28 (2026-Q2) · payable = 2.5%
   savings_2026 = 0.50 × 2,000 × 75.28 × 0.025 = €1,882
   savings_at_full_phase_in = 0.50 × 2,000 × 75.28 × 1.00 = €75,280

   This is the single most important number on the dashboard — the test
   exists so nobody can silently break the phase-in step (Step 4), which the
   spec itself calls out as "most likely to be forgotten": skipping it
   overstates 2026 savings by roughly 40×.
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

const { costAvoidanceFor, latestCertificatePriceFor, payableShareFor, defaultSeeForWorkspace, portfolioCostAvoidance } = await import("../cbam/cost-exposure");
const { saveExportVolume, emptyExportVolume } = await import("../cbam/export-volumes");
const { createWorkspace } = await import("../workspace");

const near = (actual: number, expected: number, tol = 0.5) => assert.ok(Math.abs(actual - expected) <= tol, `expected ≈${expected}, got ${actual}`);

/* ── Reference data itself ─────────────────────────────────────── */

test("2026-Q2's price and 2026's phase-in rate are exactly the confirmed values", () => {
  const price = latestCertificatePriceFor(2026);
  assert.equal(price?.periodLabel, "2026-Q2");
  assert.equal(price?.priceEurPerTco2e, 75.28);
  assert.equal(payableShareFor(2026), 2.5);
});

test("no phase-in rate is invented for any year past 2026", () => {
  for (const year of [2027, 2028, 2030, 2034]) {
    assert.equal(payableShareFor(year), null, `${year} must not have a fabricated rate`);
  }
});

/* ── The worked example, end to end ─────────────────────────────── */

test("the prompt pack's worked example reproduces exactly: €1,882 in 2026, €75,280 at full phase-in", () => {
  // Pure arithmetic pin, independent of which category a real workspace
  // resolves to — the worked example is about Steps 1–5 of the formula, not
  // about this table's specific default figures. The next test exercises
  // costAvoidanceFor() end to end through a real workspace and category.
  const seeGap = Math.max(0, 2.6 - 2.1);
  const exportVolume = 2000;
  const price = 75.28;
  const payable = 2.5;

  const savings2026 = seeGap * exportVolume * price * (payable / 100);
  const savingsFullPhaseIn = seeGap * exportVolume * price * 1;

  near(savings2026, 1882, 1);
  near(savingsFullPhaseIn, 75280, 1);
});

test("costAvoidanceFor runs the same five steps end to end for a real workspace", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const def = defaultSeeForWorkspace(ws);
  assert.ok(def, "billet resolves to a category default");

  saveExportVolume({ ...emptyExportVolume(ws.id, 2026, ws.cnCode), volumeTonnes: 2000 });

  const seeActualTotal = (def!.defaultSeeDirect + def!.defaultSeeIndirect) - 0.5; // 0.5 t/t better than default, by construction
  const see = { seeDirect: seeActualTotal, seeIndirect: 0, seeTotal: seeActualTotal, seePrecursor: 0, seeChargeable: seeActualTotal, indirectCounted: true, computable: true } as never;

  const result = costAvoidanceFor(ws, see, 2026);
  assert.equal(result.status, "ok");
  if (result.status === "ok") {
    near(result.steps.seeGap, 0.5, 1e-9);
    near(result.savingsEur, 0.5 * 2000 * 75.28 * 0.025, 1e-6);
    near(result.savingsAtFullPhaseInEur, 0.5 * 2000 * 75.28, 1e-6);
    assert.ok(result.savingsThb > result.savingsEur, "THB conversion must scale the EUR figure up, not leave it unconverted");
  }
});

test("uncomputable SEE (no production entered) never reads as a 0 actual figure inflating the gap to the full default", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveExportVolume({ ...emptyExportVolume(ws.id, 2026, ws.cnCode), volumeTonnes: 2000 });
  // computable: false, with the zeroed figures an uncomputable WorkspaceSEE
  // actually carries — the exact shape a workspace with no monthly data yet
  // produces.
  const see = { seeDirect: 0, seeIndirect: 0, seeTotal: 0, seePrecursor: 0, seeChargeable: 0, indirectCounted: true, computable: false } as never;
  const result = costAvoidanceFor(ws, see, 2026);
  assert.equal(result.status, "not_computable");
});

/* ── Every failure mode names itself rather than fabricating a number ── */

test("no export volume on file blocks the calculation with an explicit prompt, not a €0", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const see = { seeDirect: 1.5, seeIndirect: 0, seeTotal: 1.5, seePrecursor: 0, seeChargeable: 1.5, indirectCounted: true, computable: true } as never;
  const result = costAvoidanceFor(ws, see, 2026);
  assert.equal(result.status, "no_export_volume");
});

test("a year with no confirmed phase-in rate blocks rather than assuming 100% or 2026's rate", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2027 });
  saveExportVolume({ ...emptyExportVolume(ws.id, 2027, ws.cnCode), volumeTonnes: 1000 });
  saveExportVolume({ ...emptyExportVolume(ws.id, 2026, ws.cnCode), volumeTonnes: 0 }); // unrelated row, ensures lookup is period-scoped
  const see = { seeDirect: 1.5, seeIndirect: 0, seeTotal: 1.5, seePrecursor: 0, seeChargeable: 1.5, indirectCounted: true, computable: true } as never;
  const result = costAvoidanceFor(ws, see, 2027);
  assert.equal(result.status, "no_phase_in");
});

/* ── Floored at zero, never negative ─────────────────────────────── */

test("an actual figure WORSE than the default floors the gap at zero rather than going negative", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveExportVolume({ ...emptyExportVolume(ws.id, 2026, ws.cnCode), volumeTonnes: 1000 });
  const def = defaultSeeForWorkspace(ws)!;
  const worseThanDefault = def.defaultSeeDirect + def.defaultSeeIndirect + 1; // 1 t/t worse
  const see = { seeDirect: worseThanDefault, seeIndirect: 0, seeTotal: worseThanDefault, seePrecursor: 0, seeChargeable: worseThanDefault, indirectCounted: true, computable: true } as never;
  const result = costAvoidanceFor(ws, see, 2026);
  assert.equal(result.status, "ok");
  if (result.status === "ok") {
    assert.equal(result.steps.seeGap, 0);
    assert.equal(result.savingsEur, 0);
  }
});

/* ── Portfolio aggregation skips what cannot be computed rather than zeroing it ── */

test("portfolioCostAvoidance sums the computable workspaces and does not let one blocked workspace zero the total", () => {
  storage.clear();
  const wsA = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const wsB = createWorkspace({ installationId: "TH-B", installationName: "Plant B", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveExportVolume({ ...emptyExportVolume(wsA.id, 2026, wsA.cnCode), volumeTonnes: 2000 });
  // wsB gets no export volume — it must be skipped, not treated as €0.

  const def = defaultSeeForWorkspace(wsA)!;
  const better = def.defaultSeeDirect + def.defaultSeeIndirect - 0.5;
  const seeA = { seeDirect: better, seeIndirect: 0, seeTotal: better, seePrecursor: 0, seeChargeable: better, indirectCounted: true, computable: true } as never;
  const seeB = { seeDirect: better, seeIndirect: 0, seeTotal: better, seePrecursor: 0, seeChargeable: better, indirectCounted: true, computable: true } as never;

  const { total, perWorkspace } = portfolioCostAvoidance([
    { workspace: wsA, see: seeA },
    { workspace: wsB, see: seeB },
  ]);
  assert.equal(total.status, "ok");
  if (total.status === "ok") near(total.savingsEur, 0.5 * 2000 * 75.28 * 0.025, 1e-6);
  assert.equal(perWorkspace.find((r) => r.workspaceId === wsB.id)?.result.status, "no_export_volume");
});

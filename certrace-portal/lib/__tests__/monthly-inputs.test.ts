/* The month's worked-out inputs — stock changes, shared meters, waste-gas rows, scrap deliveries, product
   composition, potlines — and the product made at the same site.

   Pinned: each one WRITES the figure the month always carried, in one place, so the SEE, the checks and the reports read what
   they always read; a stock or a split that cannot be right is refused with words; a worked-out figure moves with its inputs. */

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

const { createWorkspace } = await import("../workspace");
const { emptyMonth, emptyFuel, saveMonth, getMonth, monthIssues, monthResult, copyFromPreviousMonth } = await import("../monthly-data");
const inputs = await import("../monthly-inputs");
const { pfcEmissions, pfcIssues, potlineAem, potlinesAem, scrapOf } = await import("../cbam/sector-pack");
const { saveInternal, listInternal, wouldLoop } = await import("../internal-precursors");
const { workspaceSEE, internalContribution } = await import("../workspace-see");
const { suggestShare } = await import("../shared-meter");

const gasFuel = (over: Record<string, unknown> = {}) => ({ ...emptyFuel(), fuelType: "natural_gas", unit: "GJ" as const, efTco2PerGj: 0.0561, factorSource: "lab_analysis" as const, ...over });
const ws = (productId = "billet", installationId = "TH-A") => createWorkspace({ installationId, installationName: installationId, productId, productionRoute: "scrap_eaf", year: 2026 });

test("a stock change is delivered + start − end, never below zero, and it writes the fuel's quantity on save", () => {
  storage.clear();
  assert.equal(inputs.consumedFromStock({ delivered: 400, opening: 120, closing: 70 }), 450);
  assert.equal(inputs.consumedFromStock({ delivered: 10, opening: 0, closing: 50 }), 0);

  const w = ws();
  const saved = saveMonth({ ...emptyMonth(w.id, "2026-03"), productionTonnes: 100, status: "draft", fuels: [gasFuel({ stock: { delivered: 400, opening: 120, closing: 70 } })] });
  assert.equal(saved.fuels[0].quantity, 450);
  assert.equal(getMonth(w.id, "2026-03")!.fuels[0].quantity, 450);
  assert.ok(Math.abs(monthResult(saved).fuelTCO2 - 450 * 0.0561) < 1e-9, "the emissions are the derived quantity's");
});

test("a closing stock larger than what was available is refused, in words, on the row", () => {
  storage.clear();
  const w = ws();
  const f = gasFuel({ stock: { delivered: 10, opening: 5, closing: 40 } });
  const issues = monthIssues({ ...emptyMonth(w.id, "2026-03"), productionTonnes: 100, fuels: [f] });
  const hit = issues.find((i) => i.field === `fuel:${f.id}:stock`);
  assert.ok(hit && hit.severity === "error");
  assert.match(hit!.message, /larger than what came in/);
});

test("copying the previous month opens this one with the stock the last one closed with — and no readings", () => {
  storage.clear();
  const w = ws();
  saveMonth({ ...emptyMonth(w.id, "2026-03"), productionTonnes: 100, status: "submitted", fuels: [gasFuel({ stock: { delivered: 400, opening: 120, closing: 70 } })] });
  const next = copyFromPreviousMonth(w.id, "2026-04")!;
  assert.deepEqual(next.fuels[0].stock, { opening: 70, delivered: undefined, closing: undefined });
  assert.equal(next.fuels[0].quantity, 0);
});

test("a shared meter gives this good its share by tonnes, by energy or by a set percentage", () => {
  assert.equal(inputs.sharedFraction({ meter: "E-221", key: "production", reading: 1000, thisValue: 300, totalValue: 800 }), 0.375);
  assert.equal(inputs.sharedQuantity({ meter: "E-221", key: "production", reading: 1000, thisValue: 300, totalValue: 800 }), 375);
  assert.equal(inputs.sharedFraction({ meter: "E-221", key: "manual", manualPct: 62.5 }), 0.625);
  assert.equal(inputs.sharedFraction({ meter: "E-221", key: "production", thisValue: 900, totalValue: 800 }), null, "a part larger than the whole is no share");
  assert.match(inputs.sharedProblem({ meter: "", key: "production", reading: 10, thisValue: 900, totalValue: 800 })!, /larger than the total/);
  assert.match(inputs.sharedProblem({ meter: "", key: "production" })!, /whole meter/);
});

test("an electricity row on a shared meter writes its MWh, and the month's total follows", () => {
  storage.clear();
  const w = ws();
  const saved = saveMonth({
    ...emptyMonth(w.id, "2026-03"),
    productionTonnes: 300,
    status: "draft",
    electricitySources: [{ id: "s1", sourceType: "ppa", mwh: 0, factorTco2PerMwh: 0.4, shared: { meter: "E-221", key: "production", reading: 1000, thisValue: 300, totalValue: 800 } }],
  });
  assert.equal(saved.electricitySources![0].mwh, 375);
  assert.equal(saved.electricityMwh, 375);
  assert.ok(Math.abs(monthResult(saved).indirectTCO2 - 375 * 0.4) < 1e-9);
});

test("the allocation key is suggested from the other product reports of the installation", () => {
  storage.clear();
  const a = ws("billet", "TH-S");
  const b = ws("fasteners", "TH-S");
  saveMonth({ ...emptyMonth(b.id, "2026-03"), productionTonnes: 500, status: "submitted" });
  const mine = { ...emptyMonth(a.id, "2026-03"), productionTonnes: 300 };
  const s = suggestShare(a.id, mine, "production")!;
  assert.equal(s.thisValue, 300);
  assert.equal(s.totalValue, 800);
  assert.equal(s.parts.length, 2);
  assert.equal(suggestShare(ws("rebar", "TH-ALONE").id, mine, "production"), null, "alone on its site, there is nothing to split");
});

test("waste-gas rows give the energy balance — the calorific value from the plant, the composition, or the typical value", () => {
  const bfg = { id: "g1", gas: "bfg" as const, flow: "produced" as const, volumeNm3: 1_000_000 };
  assert.equal(inputs.wasteGasNcv(bfg).from, "typical");
  assert.equal(inputs.wasteGasGj(bfg), 3200);
  const cog = { id: "g2", gas: "cog" as const, flow: "consumed" as const, volumeNm3: 100_000, coPct: 6, h2Pct: 58, ch4Pct: 25 };
  const n = inputs.wasteGasNcv(cog);
  assert.equal(n.from, "composition");
  assert.ok(Math.abs((n.value as number) - (6 * 12.63 + 58 * 10.78 + 25 * 35.8) / 100) < 1e-9);
  const own = { ...cog, ncvMjPerNm3: 18 };
  assert.equal(inputs.wasteGasNcv(own).value, 18);
  assert.equal(inputs.wasteGasGj(own), 1800);

  const bal = inputs.wasteGasBalance([bfg, cog, { id: "g3", gas: "bofg", flow: "exported", volumeNm3: 500_000 }]);
  assert.equal(bal.produced, 3200);
  assert.ok(bal.consumed > 0 && bal.exported === 4200 && bal.imported === 0);
  assert.match(inputs.wasteGasProblem({ ...cog, coPct: 60, h2Pct: 60 })!, /more than 100/);
  assert.match(inputs.wasteGasProblem({ id: "x", gas: "other", flow: "produced", volumeNm3: 10 })!, /Name the gas/);
});

test("waste-gas rows write the month's GJ balance on save", () => {
  storage.clear();
  const w = ws();
  const saved = saveMonth({ ...emptyMonth(w.id, "2026-03"), productionTonnes: 100, status: "draft", wasteGases: [{ id: "g1", gas: "bfg", flow: "produced", volumeNm3: 1_000_000 }] });
  assert.equal(saved.wasteGasGj?.produced, 3200);
});

test("scrap deliveries write the scrap tonnes and the pre-consumer part — aluminium's block and steel's carbon-balance row", () => {
  storage.clear();
  const w = ws();
  const al = saveMonth({
    ...emptyMonth(w.id, "2026-03"),
    productionTonnes: 100,
    status: "draft",
    scrapDeliveries: [
      { id: "d1", material: "aluminium_scrap", supplier: "A", grade: "taint tabor", origin: "post_consumer", tonnes: 60 },
      { id: "d2", material: "aluminium_scrap", supplier: "B", grade: "offcuts", origin: "pre_consumer", tonnes: 40 },
    ],
  });
  assert.deepEqual(al.scrap, { tonnes: 100, preConsumerT: 40 });
  assert.deepEqual(scrapOf(al), { tonnes: 100, preConsumerT: 40 });

  const steel = saveMonth({
    ...emptyMonth(w.id, "2026-04"),
    productionTonnes: 100,
    status: "draft",
    processEmissionEntries: [{ id: "p1", method: "mass_balance", specKey: "steel_scrap", materialId: "steel_scrap", quantityT: 0 }],
    scrapDeliveries: [{ id: "d3", material: "steel_scrap", supplier: "C", grade: "HMS 1&2", origin: "pre_consumer", tonnes: 90 }],
  });
  const row = steel.processEmissionEntries![0] as { quantityT: number; preConsumerT?: number };
  assert.equal(row.quantityT, 90);
  assert.equal(row.preConsumerT, 90);
  assert.deepEqual(scrapOf(steel), { tonnes: 90, preConsumerT: 90 });
  assert.match(inputs.scrapDeliveryProblem({ id: "d", material: "steel_scrap", supplier: "", grade: "", origin: "pre_consumer", tonnes: 5 })!, /supplier/);
});

test("the product composition is weighted by what was made, and cannot exceed 100 %", () => {
  const w = inputs.weightedComposition([
    { productionTonnes: 300, composition: { mnPct: 1, crPct: 18 } },
    { productionTonnes: 100, composition: { mnPct: 2, crPct: 10 } },
    { productionTonnes: 500, composition: undefined },
  ])!;
  assert.equal(w.mnPct, 1.25);
  assert.equal(w.crPct, 16);
  assert.equal(inputs.weightedComposition([{ productionTonnes: 10, composition: undefined }]), null);
  assert.match(inputs.productCompositionProblem({ mnPct: 60, crPct: 50 })!, /more than 100/);
  assert.equal(inputs.productCompositionProblem({ mnPct: 1 }), null);
});

test("a month with a worked-out input that cannot be right is blocked, naming it", () => {
  storage.clear();
  const w = ws();
  const issues = monthIssues({
    ...emptyMonth(w.id, "2026-03"),
    productionTonnes: 10,
    wasteGases: [{ id: "g1", gas: "bfg", flow: "produced" }],
    scrapDeliveries: [{ id: "d1", material: "aluminium_scrap", supplier: "", grade: "", origin: "post_consumer" }],
    composition: { mnPct: 70, crPct: 70 },
  });
  const fields = issues.filter((i) => i.severity === "error").map((i) => i.field);
  assert.ok(fields.includes("wasteGas:g1"));
  assert.ok(fields.includes("scrapDelivery:d1"));
  assert.ok(fields.includes("composition"));
});

/* ── Potlines ────────────────────────────────────────────────────── */
const base = { method: "slope" as const, technology: "", collectionEfficiencyPct: 100 };

test("a potline's anode-effect minutes are how often × how long, and the lines average by their share of the metal", () => {
  assert.equal(potlineAem({ id: "a", label: "", technology: "PFPB_M", aePerCellDay: 0.1, aeMinutes: 2 }), 0.2);
  assert.equal(potlineAem({ id: "a", label: "", technology: "PFPB_M", aePerCellDay: 0.1 }), null);
  const avg = potlinesAem([
    { id: "a", label: "A", technology: "PFPB_M", sharePct: 75, aePerCellDay: 0.1, aeMinutes: 2 },
    { id: "b", label: "B", technology: "CWPB", sharePct: 25, aePerCellDay: 0.4, aeMinutes: 2 },
  ]);
  assert.ok(Math.abs((avg as number) - (0.75 * 0.2 + 0.25 * 0.8)) < 1e-12);
});

test("two lines of different cell types are worked out with their own factors and added", () => {
  const A = { id: "a", label: "A", technology: "PFPB_M", sharePct: 60, aePerCellDay: 0.1, aeMinutes: 2 };
  const B = { id: "b", label: "B", technology: "CWPB", sharePct: 40, aePerCellDay: 0.3, aeMinutes: 2 };
  const both = pfcEmissions({ ...base, potlines: [A, B] }, 1000)!;
  // Each line alone, on its own share of the metal, must add up to the pair.
  const onlyA = pfcEmissions({ ...base, technology: "PFPB_M", aem: 0.2, primaryAlT: 600 }, 1000)!;
  const onlyB = pfcEmissions({ ...base, technology: "CWPB", aem: 0.6, primaryAlT: 400 }, 1000)!;
  assert.ok(Math.abs(both.cf4T - (onlyA.cf4T + onlyB.cf4T)) < 1e-12);
  assert.ok(Math.abs(both.c2f6T - (onlyA.c2f6T + onlyB.c2f6T)) < 1e-12);
  assert.ok(Math.abs(both.totalTCO2e - (onlyA.totalTCO2e + onlyB.totalTCO2e)) < 1e-9);
});

test("potline shares that do not add up to 100 %, or a line without its cell type, are named", () => {
  const A = { id: "a", label: "A", technology: "PFPB_M", sharePct: 60, aePerCellDay: 0.1, aeMinutes: 2 };
  const B = { id: "b", label: "B", technology: "", sharePct: 30, aePerCellDay: 0.3, aeMinutes: 2 };
  const issues = pfcIssues({ ...base, potlines: [A, B] }, 1000);
  assert.ok(issues.some((i) => i.field === "pfc:potlines" && /not 100/.test(i.message)));
  assert.ok(issues.some((i) => i.field === "pfc:line:b:technology"));
  assert.equal(pfcIssues({ ...base, potlines: [{ ...A, sharePct: 100 }] }, 1000).length, 0);
  assert.equal(pfcEmissions({ ...base, potlines: [A, B] }, 1000), null, "no figure until every line has its cell type");
});

/* ── Products made at the same site ──────────────────────────────── */
test("a product made at the same site carries its own report's embedded emissions into the one that uses it", () => {
  storage.clear();
  const billet = ws("billet", "TH-MILL");
  const wire = ws("wirerod", "TH-MILL");
  // The melt shop: 1000 t, 560 tCO2 from gas → 0.56 tCO2e/t
  saveMonth({ ...emptyMonth(billet.id, "2026-01"), productionTonnes: 1000, status: "submitted", fuels: [gasFuel({ quantity: 10_000 })] });
  assert.ok(Math.abs(workspaceSEE(billet).seeTotal - 0.561) < 1e-9);
  // The rolling mill: 800 t, none of its own emissions, uses 820 t of billet
  saveMonth({ ...emptyMonth(wire.id, "2026-01"), productionTonnes: 800, status: "submitted" });
  assert.equal(workspaceSEE(wire).seePrecursor, 0);
  saveInternal({ id: "ip1", workspaceId: wire.id, sourceWorkspaceId: billet.id, quantityUsedT: 820 });
  const see = workspaceSEE(wire);
  assert.ok(Math.abs(see.seePrecursor - (820 / 800) * 0.561) < 1e-9);
  assert.ok(Math.abs(see.seeTotal - see.seePrecursor) < 1e-9);

  // …and moves when the melt shop's month moves.
  saveMonth({ ...emptyMonth(billet.id, "2026-01"), productionTonnes: 1000, status: "submitted", fuels: [gasFuel({ quantity: 20_000 })] });
  assert.ok(Math.abs(workspaceSEE(wire).seePrecursor - (820 / 800) * 1.122) < 1e-9);
});

test("a same-site precursor says what is missing instead of counting for nothing", () => {
  storage.clear();
  const billet = ws("billet", "TH-MILL2");
  const wire = ws("wirerod", "TH-MILL2");
  saveMonth({ ...emptyMonth(wire.id, "2026-01"), productionTonnes: 800, status: "submitted" });
  saveInternal({ id: "ip1", workspaceId: wire.id, sourceWorkspaceId: billet.id });
  const noQty = internalContribution(wire).rows[0];
  assert.match(noQty.issue ?? "", /no production counted yet|how many tonnes/);
  saveInternal({ id: "ip1", workspaceId: wire.id, sourceWorkspaceId: billet.id, quantityUsedT: 100 });
  assert.match(internalContribution(wire).rows[0].issue ?? "", /no production counted yet/, "the source has nothing counted yet");
});

test("a loop — A uses B and B uses A — is refused and cannot run away", () => {
  storage.clear();
  const a = ws("billet", "TH-LOOP");
  const b = ws("wirerod", "TH-LOOP");
  saveInternal({ id: "l1", workspaceId: b.id, sourceWorkspaceId: a.id, quantityUsedT: 10 });
  assert.equal(wouldLoop(a.id, b.id), true, "B already uses A, so A cannot use B");
  assert.equal(wouldLoop(b.id, a.id), false, "B already using A is not a loop; picking A again is only a repeat");
  assert.equal(wouldLoop(a.id, a.id), true, "nothing is its own precursor");
  // Even if a loop is written straight to the store, the figure stops rather than recursing for ever.
  saveInternal({ id: "l2", workspaceId: a.id, sourceWorkspaceId: b.id, quantityUsedT: 10 });
  saveMonth({ ...emptyMonth(a.id, "2026-01"), productionTonnes: 10, status: "submitted", fuels: [gasFuel({ quantity: 100 })] });
  saveMonth({ ...emptyMonth(b.id, "2026-01"), productionTonnes: 10, status: "submitted" });
  assert.doesNotThrow(() => workspaceSEE(a));
  assert.equal(listInternal(a.id).length, 1);
});

/* The monthly data of steel and aluminium, pinned.

   What is checked is arithmetic the regulation fixes (Implementing Regulation
   (EU) 2025/2547, Annex II B.3.2 and B.7) and the shape of the sector packs —
   so a screen can open with the rows the plant really has. */

import { test } from "node:test";
import assert from "node:assert/strict";

const store = new Map<string, string>();
(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
  dispatchEvent: () => true,
};

const { pfcEmissions, pfcIssues, scrapOf, packFor, sectorOf, PFC_TECHNOLOGIES } = await import("../sector-pack");
const { emptyMonth, monthResult, monthIssues, processEmissionEntryTCO2 } = await import("../../monthly-data");
const { PRODUCT_CATALOG: CATALOG } = await import("../../config");

const close = (a: number, b: number, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

/* ── PFC from anode effects ─────────────────────────────────── */

test("slope method: CF₄ = AEM × SEF/1000 × t Al, C₂F₆ = CF₄ × fraction, CO₂e with the Table 6 GWPs, divided by the collection efficiency", () => {
  const r = pfcEmissions({ method: "slope", technology: "PFPB_M", aem: 1, collectionEfficiencyPct: 95 }, 1000)!;
  close(r.cf4T, 0.104);
  close(r.c2f6T, 0.104 * 0.057);
  close(r.ductTCO2e, 0.104 * 6630 + 0.104 * 0.057 * 11100);
  close(r.totalTCO2e, r.ductTCO2e / 0.95);
  assert.equal(r.factorSource, "table");
});

test("overvoltage method: CF₄ = OVC × AEO/CE × t Al × 0.001", () => {
  const r = pfcEmissions({ method: "overvoltage", technology: "CWPB", aeo: 20, ce: 94, collectionEfficiencyPct: 100 }, 1000)!;
  close(r.cf4T, 1.16 * (20 / 94) * 1000 * 0.001);
  close(r.c2f6T, r.cf4T * 0.121);
});

test("the plant's own measured factors replace the technology table", () => {
  const own = pfcEmissions({ method: "slope", technology: "PFPB_M", aem: 1, ownCf4Factor: 0.09, ownC2f6Fraction: 0.05, collectionEfficiencyPct: 100 }, 1000)!;
  close(own.cf4T, 0.09);
  assert.equal(own.factorSource, "own");
});

test("a technology with no EU slope value falls back to the centre-worked values, and says so", () => {
  const r = pfcEmissions({ method: "slope", technology: "PFPB_MW", aem: 1, collectionEfficiencyPct: 100 }, 1000)!;
  close(r.cf4T, 0.143);
  assert.equal(r.fellBack, true);
});

test("nothing is computed until the cell type, the minutes and the collection efficiency are all in", () => {
  assert.equal(pfcEmissions({ method: "slope", technology: "", aem: 1, collectionEfficiencyPct: 100 }, 1000), null);
  assert.equal(pfcEmissions({ method: "slope", technology: "PFPB_M", collectionEfficiencyPct: 100 }, 1000), null);
  assert.equal(pfcEmissions({ method: "slope", technology: "PFPB_M", aem: 1 }, 1000), null);
  assert.equal(pfcEmissions({ method: "slope", technology: "PFPB_M", aem: 0, collectionEfficiencyPct: 100 }, 1000)!.totalTCO2e, 0, "zero minutes is an answer, not a gap");
});

test("the issues name what is missing", () => {
  const msgs = pfcIssues({ method: "slope", technology: "" }, 0).map((i) => i.field);
  assert.deepEqual(msgs.sort(), ["pfc:aem", "pfc:eff", "pfc:primary", "pfc:technology"].sort());
  const ov = pfcIssues({ method: "overvoltage", technology: "VSS", collectionEfficiencyPct: 100 }, 500).map((i) => i.field);
  assert.ok(ov.includes("pfc:aeo") && ov.includes("pfc:ce") && ov.includes("pfc:technology"), "Søderberg has no overvoltage factors in the EU table");
  assert.equal(PFC_TECHNOLOGIES.length, 7);
});

/* ── The month: PFC and the carbon balance reach the direct emissions ── */

test("PFC is added to a month's direct emissions", () => {
  const m = { ...emptyMonth("w", "2026-03"), productionTonnes: 1000, pfc: { method: "slope" as const, technology: "PFPB_M", aem: 1, collectionEfficiencyPct: 100 } };
  const r = monthResult(m);
  close(r.pfcTCO2e, 0.104 * 6630 + 0.104 * 0.057 * 11100);
  close(r.directTCO2, r.pfcTCO2e);
});

test("mass balance: carbon in counts, carbon out is negative, and the plant's own carbon content wins", () => {
  close(processEmissionEntryTCO2({ id: "a", method: "mass_balance", materialId: "eaf_carbon_electrodes", quantityT: 12 }), 3.664 * 12 * 0.8188);
  close(processEmissionEntryTCO2({ id: "b", method: "mass_balance", materialId: "steel_scrap", quantityT: -4820 }), 3.664 * -4820 * 0.0109);
  close(processEmissionEntryTCO2({ id: "c", method: "mass_balance", materialId: "steel_scrap", quantityT: 100, carbonContent: 0.02 }), 3.664 * 100 * 0.02);
  close(processEmissionEntryTCO2({ id: "d", method: "mass_balance", materialId: "custom", label: "Baked anode", quantityT: 100, carbonContent: 0.95 }), 3.664 * 100 * 0.95);
  assert.equal(processEmissionEntryTCO2({ id: "e", method: "mass_balance", materialId: "custom", label: "Anode", quantityT: 100 }), 0, "no carbon content, no figure — and the month says so");
});

test("a custom material must be named and must carry its own carbon content", () => {
  const base = { ...emptyMonth("w", "2026-03"), productionTonnes: 100, status: "draft" as const };
  const bad = monthIssues({ ...base, processEmissionEntries: [{ id: "x", method: "mass_balance", materialId: "custom", quantityT: 10 }] }).map((i) => i.field);
  assert.ok(bad.includes("processEntry:x:label") && bad.includes("processEntry:x:cc"));
  const good = monthIssues({ ...base, processEmissionEntries: [{ id: "x", method: "mass_balance", materialId: "custom", label: "Baked anode", quantityT: 10, carbonContent: 0.95 }] }).map((i) => i.field);
  assert.ok(!good.includes("processEntry:x:cc") && !good.includes("processEntry:x:label"));
});

test("an unused guided row is not an error; an unused ordinary row still is", () => {
  const base = { ...emptyMonth("w", "2026-03"), productionTonnes: 100, status: "draft" as const };
  const guided = monthIssues({ ...base, processEmissionEntries: [{ id: "g", method: "mass_balance", materialId: "dri", quantityT: 0, specKey: "dri" }] }).map((i) => i.field);
  assert.ok(!guided.includes("processEntry:g:quantity"));
  const plain = monthIssues({ ...base, processEmissionEntries: [{ id: "p", method: "mass_balance", materialId: "dri", quantityT: 0 }] }).map((i) => i.field);
  assert.ok(plain.includes("processEntry:p:quantity"));
});

test("scrap is counted from the steel scrap rows and from the aluminium block, with its pre-consumer part", () => {
  const steel = scrapOf({
    processEmissionEntries: [
      { method: "mass_balance", materialId: "steel_scrap", quantityT: 800, preConsumerT: 300 },
      { method: "mass_balance", materialId: "iron_scrap", quantityT: 100 },
      { method: "mass_balance", materialId: "steel_scrap", quantityT: -4000 },
      { method: "mass_balance", materialId: "dri", quantityT: 50 },
    ],
  });
  assert.deepEqual(steel, { tonnes: 900, preConsumerT: 300 });
  assert.deepEqual(scrapOf({ scrap: { tonnes: 250, preConsumerT: 100 } }), { tonnes: 250, preConsumerT: 100 });
  assert.deepEqual(scrapOf({}), { tonnes: 0, preConsumerT: 0 });
});

/* ── The packs ───────────────────────────────────────────────── */

const find = (cn: string) => CATALOG.find((p) => p.cnCode.replace(/\s/g, "").startsWith(cn));

test("each route opens with the rows it really has", () => {
  const eaf = packFor({ productId: find("7207")!.id, productionRoute: "scrap_eaf" }, "E")!;
  assert.equal(eaf.sector, "steel");
  assert.deepEqual(eaf.materials.filter((m) => m.direction === "out").map((m) => m.key), ["steel_out"]);
  assert.ok(eaf.materials.some((m) => m.key === "eaf_electrodes") && eaf.materials.some((m) => m.scrap));

  const bof = packFor({ productId: find("7207")!.id, productionRoute: "bf_bof" }, "C")!;
  assert.ok(bof.materials.some((m) => m.key === "bof_gas_out") && !bof.materials.some((m) => m.key === "eaf_electrodes"));
  assert.equal(bof.wasteGases, true);

  const rolled = packFor({ productId: find("7208")!.id, productionRoute: "scrap_eaf" }, "E")!;
  assert.equal(rolled.category, "Iron or steel products");
  assert.deepEqual(rolled.materials, [], "rolling has no carbon balance of its own");
});

test("PFC is asked for primary smelting only", () => {
  const primary = packFor({ productId: find("7601")!.id, productionRoute: "hall_heroult" }, "K")!;
  assert.equal(primary.pfc, true);
  assert.ok(primary.pfcTechnologies.includes("PFPB_M") && !primary.pfcTechnologies.includes("VSS"));
  assert.deepEqual(packFor({ productId: find("7601")!.id, productionRoute: "soderberg" }, "K")!.pfcTechnologies, ["VSS", "HSS"]);
  assert.equal(packFor({ productId: find("7601")!.id, productionRoute: "remelt" }, "L")!.pfc, false);
  assert.equal(packFor({ productId: find("7604")!.id, productionRoute: "al_primary" }, "K")!.pfc, false, "a product made from the metal carries the metal's PFC as a precursor");
});

test("only steel and aluminium goods have a pack", () => {
  assert.equal(sectorOf({ productId: find("7207")!.id }), "steel");
  assert.equal(sectorOf({ productId: find("7601")!.id }), "aluminium");
  const cement = CATALOG.find((p) => p.category === "Cement");
  if (cement) assert.equal(sectorOf({ productId: cement.id }), null);
});

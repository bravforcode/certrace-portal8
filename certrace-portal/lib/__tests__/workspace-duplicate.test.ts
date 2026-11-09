/* ════════════════════════════════════════════════════════════
   DUPLICATING A REPORT — what comes across is the reader's choice, part by part

   Each part of the copy follows its own switch; what is never offered (monthly figures, documents,
   sign-offs) never arrives; and what comes from the chain is its shape and never its answers.
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
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  get length() {
    return this.map.size;
  }
}
const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage, dispatchEvent: () => true };
g.localStorage = storage;

const { CARRY_SECTIONS, SITE_BOUND, carryPreview, defaultCarry, duplicateWorkspace, setAll } = await import("../workspace-duplicate");
const { createWorkspace, listWorkspaces } = await import("../workspace");
const { loadDraft, saveDraft, emptyMmd } = await import("../workspace-mmd");
const { emptySupplier, listSuppliers, saveSupplier, treeFor } = await import("../precursor-suppliers");
const { getCarbonPrice, saveCarbonPrice, emptyCarbonPrice } = await import("../carbon-price");
const { listMonths, saveMonth, emptyMonth } = await import("../monthly-data");

type Ws = Awaited<ReturnType<typeof createWorkspace>>;

function source(): Ws {
  storage.clear();
  const ws = createWorkspace({
    installationId: "inst-1",
    installationName: "Rayong Steel Works",
    productId: listProductId(),
    productionRoute: "scrap_eaf",
    country: "TH",
    year: 2026,
    selfSupplied: true,
    schedule: { dueDay: 22 },
  });

  // the monitoring plan, with something in every part
  const d = emptyMmd(ws.periodStart, ws.periodEnd);
  saveDraft(ws.id, {
    ...d,
    boundaryDescription: "EAF melt shop to the rolling mill",
    processesIncluded: ["Melting (EAF)", "Hot rolling"],
    exclusions: [{ id: "x1", process: "Canteen", ground: "not_production_process", groundOther: "", note: "offices" }],
    fuelTypeIds: ["natural_gas"],
    electricitySupply: "grid",
    electricityMeteringPoint: "Main feeder 2",
    fuelInstruments: [{ id: "i1", parameter: "Natural gas", instrument: "Flow meter", readingFrequency: "Daily", directMethod: "calculation" } as never],
    dataGaps: [{ id: "g1", description: "March meter outage", estimatedTCO2e: 40 } as never],
    reviewerName: "Kanya S.",
    reviewFrequency: "Monthly",
    diagramFileName: "plant.pdf",
    samplingPlan: "One sample per heat",
  });

  // a two-tier chain, with answers in it
  const a = saveSupplier({ ...emptySupplier(ws.id), name: "Chonburi Foundry", country: "TH", precursorName: "Pig iron", cnCode: "7201", origin: "purchased", contactName: "Nok", contactEmail: "nok@foundry.example", seeTco2ePerT: 1.9, dataOrigin: "supplier_unverified", smartLinkToken: "tok-1", smartLinkSentAt: "2026-03-01T00:00:00Z", smartLinkSubmittedAt: "2026-03-05T00:00:00Z", monthlyQuantities: [{ month: "2026-01", tonnes: 100 }] });
  saveSupplier({ ...emptySupplier(ws.id, a.id), name: "Rayong Coke", country: "TH", precursorName: "Coke", cnCode: "2704", origin: "purchased", contactEmail: "ops@coke.example" });

  saveCarbonPrice({ ...emptyCarbonPrice(ws.id), instrument: "excise_embedded", amountPerTonne: 200, legalBasis: "Excise notice 22 April 2025", certifiedBy: "A. Auditor", shareOfEmissionsCovered: 30, rebates: "refund of 10%", rebateAmountPerTonne: 20, evidenceItemId: "ev-1" });
  saveMonth({ ...emptyMonth(ws.id, "2026-01") });
  return ws;
}

function listProductId(): string {
  return "billet";
}

test("every part follows its own switch: all on brings the plan, the chain and the claim", () => {
  const src = source();
  const copy = duplicateWorkspace(src, { year: 2027, carry: setAll(true) });
  assert.equal(copy.year, 2027);
  assert.notEqual(copy.id, src.id);

  const m = loadDraft(copy.id, copy.periodStart, copy.periodEnd);
  assert.equal(m.boundaryDescription, "EAF melt shop to the rolling mill");
  assert.deepEqual(m.processesIncluded, ["Melting (EAF)", "Hot rolling"]);
  assert.equal(m.exclusions.length, 1);
  assert.deepEqual(m.fuelTypeIds, ["natural_gas"]);
  assert.equal(m.electricityMeteringPoint, "Main feeder 2");
  assert.equal(m.fuelInstruments.length, 1);
  assert.equal(m.dataGaps.length, 1);
  assert.equal(m.reviewerName, "Kanya S.");
  assert.equal(m.diagramFileName, "plant.pdf");
  assert.equal(m.samplingPlan, "One sample per heat");
  assert.equal(m.periodStart, "2027-01-01", "the plan is for the new year");
  assert.equal(m.periodEnd, "2027-12-31");
  assert.equal(copy.schedule?.dueDay, 22);
});

test("everything off: a copy of the good and nothing else", () => {
  const src = source();
  const copy = duplicateWorkspace(src, { year: 2027, carry: setAll(false) });
  assert.equal(copy.productId, src.productId, "the good always comes across");
  assert.equal(copy.productionRoute, src.productionRoute);
  assert.equal(copy.country, src.country);
  assert.equal(copy.selfSupplied, src.selfSupplied);
  assert.equal(copy.schedule?.dueDay, 15, "a schedule left out is the default one");

  const m = loadDraft(copy.id, copy.periodStart, copy.periodEnd);
  assert.equal(m.boundaryDescription, "");
  assert.equal(m.fuelInstruments.length, 0);
  assert.equal(m.dataGaps.length, 0);
  assert.equal(listSuppliers(copy.id).length, 0);
  assert.equal(getCarbonPrice(copy.id).recorded, false);
});

test("one part on leaves the others as they were", () => {
  const src = source();
  const only = (id: (typeof CARRY_SECTIONS)[number]) => ({ ...setAll(false), [id]: true });

  const a = duplicateWorkspace(src, { year: 2027, carry: only("mmd_boundary") });
  const ma = loadDraft(a.id, a.periodStart, a.periodEnd);
  assert.equal(ma.boundaryDescription, "EAF melt shop to the rolling mill");
  assert.deepEqual(ma.fuelTypeIds, [], "fuels were not chosen");
  assert.equal(ma.reviewerName, "");

  const b = duplicateWorkspace(src, { year: 2028, carry: only("mmd_instruments") });
  const mb = loadDraft(b.id, b.periodStart, b.periodEnd);
  assert.equal(mb.fuelInstruments.length, 1);
  assert.equal(mb.boundaryDescription, "");

  const c = duplicateWorkspace(src, { year: 2029, carry: only("mmd_gaps") });
  assert.equal(loadDraft(c.id, c.periodStart, c.periodEnd).dataGaps.length, 1);

  const d = duplicateWorkspace(src, { year: 2030, carry: only("schedule") });
  assert.equal(d.schedule?.dueDay, 22);
  assert.equal(listSuppliers(d.id).length, 0);
});

test("data gaps start new unless chosen; a different site starts the plant-bound parts new", () => {
  const same = defaultCarry(true);
  assert.equal(same.mmd_gaps, false);
  assert.ok(CARRY_SECTIONS.filter((s) => s !== "mmd_gaps").every((s) => same[s]));

  const other = defaultCarry(false);
  for (const s of SITE_BOUND) assert.equal(other[s], false, `${s} describes the old plant`);
  assert.equal(other.schedule, true);
  assert.equal(other.mmd_quality, true);
  assert.equal(other.carbon_price, true);
});

test("the chain comes across as a shape: who, where, under which code, who to ask — and none of what they said", () => {
  const src = source();
  const copy = duplicateWorkspace(src, { year: 2027, carry: { ...setAll(false), precursors: true } });
  const rows = listSuppliers(copy.id);
  assert.equal(rows.length, 2);

  const foundry = rows.find((r) => r.name === "Chonburi Foundry")!;
  assert.equal(foundry.cnCode, "7201");
  assert.equal(foundry.contactEmail, "nok@foundry.example");
  assert.equal(foundry.parentId, null);
  assert.equal(foundry.seeTco2ePerT, null, "no figure");
  assert.deepEqual(foundry.monthlyQuantities, [], "no quantities");
  assert.equal(foundry.smartLinkToken, undefined, "no link already sent");
  assert.equal(foundry.smartLinkSubmittedAt, undefined, "no answer");
  assert.equal(foundry.dataOrigin, "supplier_unverified");

  const coke = rows.find((r) => r.name === "Rayong Coke")!;
  assert.equal(coke.parentId, foundry.id, "the tree keeps its shape, on the copy's own ids");
  assert.ok(!listSuppliers(src.id).some((r) => r.id === foundry.id), "the copy's rows are its own");

  const tree = treeFor(copy.id);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].children.length, 1);
  assert.equal(listSuppliers(src.id).length, 2, "the source chain is untouched");
});

test("the carbon price claim comes across without its receipt or its rebate", () => {
  const src = source();
  const copy = duplicateWorkspace(src, { year: 2027, carry: { ...setAll(false), carbon_price: true } });
  const was = getCarbonPrice(src.id);
  const now = getCarbonPrice(copy.id);
  assert.equal(was.evidenceItemId, "ev-1");
  assert.equal(now.recorded, true);
  assert.equal(now.instrument, "excise_embedded");
  assert.equal(now.amountPerTonne, 200);
  assert.equal(now.legalBasis, "Excise notice 22 April 2025");
  assert.equal(now.certifiedBy, "A. Auditor");
  assert.equal(now.shareOfEmissionsCovered, 30);
  assert.equal(now.evidenceItemId, undefined, "last year's receipt is not this year's");
  assert.equal(now.rebates, undefined);
  assert.equal(now.rebateAmountPerTonne, undefined);
});

test("nothing recorded is nothing to bring — a part with nothing in it is not invented", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "i", installationName: "Plant", productId: listProductId(), productionRoute: "scrap_eaf", country: "TH", year: 2026, selfSupplied: true });
  const p = carryPreview(ws);
  assert.equal(p.precursors, 0);
  assert.equal(p.carbonPrice, false);
  const copy = duplicateWorkspace(ws, { year: 2027, carry: setAll(true) });
  assert.equal(listSuppliers(copy.id).length, 0);
  assert.equal(getCarbonPrice(copy.id).recorded, false, "no claim is made up");
});

test("monthly figures never come across, whatever is chosen", () => {
  const src = source();
  assert.ok(listMonths(src.id).length >= 0);
  const copy = duplicateWorkspace(src, { year: 2027, carry: setAll(true) });
  const months = listMonths(copy.id);
  assert.ok(months.every((m) => m.month.startsWith("2027")), "a month of 2026 never sits in the 2027 report");
  assert.ok(!months.some((m) => m.month === "2026-01"));
});

test("the preview counts what there is to bring", () => {
  const src = source();
  const p = carryPreview(src);
  assert.equal(p.precursors, 2);
  assert.equal(p.instruments, 1);
  assert.equal(p.gaps, 1);
  assert.equal(p.exclusions, 1);
  assert.equal(p.hasDiagram, true);
  assert.equal(p.carbonPrice, true);
  assert.equal(listWorkspaces().length, 1);
});

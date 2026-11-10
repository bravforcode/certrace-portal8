/* ════════════════════════════════════════════════════════════
   WHAT EACH BUYER WILL COST — the four rules the module's own header
   comment sets out, pinned so a refactor cannot quietly drop one:

     1. an unpriceable tonne is never priced at zero
     2. the projection only appears once enough of the year has closed
     3. monthsElapsed never straight-lines a part-month
     4. the carbon price already paid is computed but never subtracted
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

const { buyerProjections, monthsElapsed, MIN_MONTHS_TO_PROJECT } = await import(
  "../buyer-projection"
);
const { createWorkspace } = await import("../../workspace");
const { saveMonth, emptyMonth } = await import("../../monthly-data");
const { addShipment } = await import("../../shipments");
const { saveCarbonPrice, emptyCarbonPrice } = await import(
  "../../carbon-price"
);

/** listShipments() auto-seeds eight demo rows the first time it sees an
    empty store — real behaviour for a fresh install, noise in a test that
    wants an exact, known set of shipments. Pre-writing a non-empty (but
    still empty-of-rows) value skips that seed without needing to export the
    store's key from shipments.ts. */
function skipShipmentSeed() {
  storage.setItem("certrace:shipments", "[]");
}

const FUELS = [
  {
    id: "f1",
    fuelType: "natural_gas",
    quantity: 100,
    unit: "m3" as const,
    ncvMjPerUnit: 38,
    efTco2PerGj: 0.0561,
    oxidationFactor: 1,
    factorSource: "eu_standard" as const,
  },
];

function priceableWorkspace(year: number, months: string[]) {
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year,
  });
  for (const m of months) {
    saveMonth({
      ...emptyMonth(ws.id, m),
      productionTonnes: 100,
      fuels: FUELS,
      electricityMwh: 5,
      electricityFactorTco2PerMwh: 0.1,
      electricityFactorSource: "ppa",
      status: "submitted",
    });
  }
  return ws;
}

test("an unpriceable shipment's tonnes are counted and named, never priced at zero", () => {
  storage.clear();
  skipShipmentSeed();
  // No monthly data at all -> workspaceSEE is not computable.
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  addShipment({
    date: "2026-01-15",
    buyer: "Rotterdam Steel Import BV",
    productId: ws.productId,
    quantityTonnes: 40,
    declarationId: null,
    workspaceId: ws.id,
  });

  const summary = buyerProjections(2026, new Date("2026-06-15"));
  assert.equal(summary.totalUnpricedTonnes, 40);
  assert.ok(summary.unpriceable.includes(ws.productName));

  const row = summary.buyers.find(
    (b) => b.buyer === "Rotterdam Steel Import BV",
  );
  assert.ok(row);
  assert.equal(row!.tonnes, 0, "no priceable tonnes attributed to the buyer");
  assert.equal(
    row!.unpricedTonnes,
    40,
    "the unpriced tonnes are still counted against the buyer",
  );
  assert.equal(row!.embeddedTCO2e, 0);
  assert.equal(
    row!.costEUR,
    0,
    "an unpriceable tonne must never be priced at zero as if it were free AND counted",
  );
});

test("the projection stays null before MIN_MONTHS_TO_PROJECT months have closed, and appears once they have", () => {
  storage.clear();
  skipShipmentSeed();
  const ws = priceableWorkspace(2026, [
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
  ]);
  addShipment({
    date: "2026-01-15",
    buyer: "Hamburg Metallhandel GmbH",
    productId: ws.productId,
    quantityTonnes: 50,
    declarationId: null,
    workspaceId: ws.id,
  });

  // Only January has closed as at Feb 15 -> 1 closed month, below the floor.
  const early = buyerProjections(2026, new Date("2026-02-15"));
  assert.equal(early.monthsElapsed, 1);
  assert.equal(early.projectable, false);
  assert.equal(early.totalProjectedEUR, null);
  const earlyRow = early.buyers.find(
    (b) => b.buyer === "Hamburg Metallhandel GmbH",
  );
  assert.equal(earlyRow!.projectedCostEUR, null);

  // May 15th -> Jan-Apr closed, 4 months, at/above MIN_MONTHS_TO_PROJECT.
  const later = buyerProjections(2026, new Date("2026-05-15"));
  assert.ok(later.monthsElapsed >= MIN_MONTHS_TO_PROJECT);
  assert.equal(later.projectable, true);
  assert.ok(later.totalProjectedEUR != null);
  const laterRow = later.buyers.find(
    (b) => b.buyer === "Hamburg Metallhandel GmbH",
  );
  assert.ok(
    laterRow!.projectedCostEUR != null &&
      laterRow!.projectedCostEUR > laterRow!.costEUR,
    "annualising a part-year should scale the cost up",
  );
});

test("monthsElapsed counts only whole CLOSED months — never a part-month", () => {
  // The 2nd of July: June has closed, July has not even started meaningfully.
  assert.equal(monthsElapsed(2026, new Date("2026-07-02")), 6);
  // The last day of July, still: July itself has not closed yet.
  assert.equal(monthsElapsed(2026, new Date("2026-07-31")), 6);
  // A past year is fully closed; a future year has nothing closed.
  assert.equal(monthsElapsed(2020, new Date("2026-07-02")), 12);
  assert.equal(monthsElapsed(2030, new Date("2026-07-02")), 0);
});

test("the carbon price already claimed is computed but never subtracted from the cost figure", () => {
  storage.clear();
  skipShipmentSeed();
  const ws = priceableWorkspace(2026, ["2026-01"]);
  saveCarbonPrice({
    ...emptyCarbonPrice(ws.id),
    amountPerTonne: 200,
    currency: "THB",
    instrument: "excise_embedded",
    shareOfEmissionsCovered: 100,
    recorded: true,
  });
  addShipment({
    date: "2026-01-15",
    buyer: "Antwerp Long Products NV",
    productId: ws.productId,
    quantityTonnes: 30,
    declarationId: null,
    workspaceId: ws.id,
  });

  const summary = buyerProjections(2026, new Date("2026-03-01"));
  const row = summary.buyers.find(
    (b) => b.buyer === "Antwerp Long Products NV",
  )!;

  assert.ok(
    row.claimed > 0,
    "a recorded carbon price above zero produces a non-zero claim",
  );
  assert.equal(row.claimedCurrency, "THB");
  // The cost figure is certificates x price per certificate — full stop, no
  // deduction folded in anywhere.
  assert.equal(
    row.costEUR,
    row.certificates * summary.pricing.pricePerTonneEUR,
  );
});

test('mixing currencies across a buyer\'s workspaces reads as "mixed", not a wrong total', () => {
  storage.clear();
  skipShipmentSeed();
  const wsA = priceableWorkspace(2026, ["2026-01"]);
  saveCarbonPrice({
    ...emptyCarbonPrice(wsA.id),
    amountPerTonne: 200,
    currency: "THB",
    instrument: "excise_embedded",
    shareOfEmissionsCovered: 100,
    recorded: true,
  });
  addShipment({
    date: "2026-01-10",
    buyer: "Same Buyer Co",
    productId: wsA.productId,
    quantityTonnes: 10,
    declarationId: null,
    workspaceId: wsA.id,
  });

  const wsB = createWorkspace({
    installationId: "TH-B",
    installationName: "Plant B",
    productId: "rebar",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  saveMonth({
    ...emptyMonth(wsB.id, "2026-01"),
    productionTonnes: 100,
    fuels: FUELS,
    electricityMwh: 5,
    electricityFactorTco2PerMwh: 0.1,
    electricityFactorSource: "ppa",
    status: "submitted",
  });
  saveCarbonPrice({
    ...emptyCarbonPrice(wsB.id),
    amountPerTonne: 10,
    currency: "EUR",
    instrument: "tax",
    shareOfEmissionsCovered: 100,
    recorded: true,
  });
  addShipment({
    date: "2026-01-12",
    buyer: "Same Buyer Co",
    productId: wsB.productId,
    quantityTonnes: 10,
    declarationId: null,
    workspaceId: wsB.id,
  });

  const summary = buyerProjections(2026, new Date("2026-03-01"));
  const row = summary.buyers.find((b) => b.buyer === "Same Buyer Co")!;
  assert.equal(row.claimedCurrency, "mixed");
});

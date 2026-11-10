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

const { seeTrendFor, seeTrendByQuarter, benchmarkOutperformance } =
  await import("../cbam/see-trend");
const { createWorkspace } = await import("../workspace");
const { workspaceSEE } = await import("../workspace-see");
const { saveMonth, emptyMonth } = await import("../monthly-data");

test("a month with no production is omitted from the trend, not plotted as zero", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const see = workspaceSEE(ws);
  assert.deepEqual(seeTrendFor(see), []);
});

test("a submitted month with production appears as one point; for steel the total is the direct figure, the electricity is reported beside it", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  saveMonth({
    ...emptyMonth(ws.id, "2026-01"),
    productionTonnes: 100,
    fuels: [
      {
        id: "f1",
        fuelType: "natural_gas",
        quantity: 1000,
        unit: "m3",
        ncvMjPerUnit: 38,
        efTco2PerGj: 0.0561,
        oxidationFactor: 1,
        factorSource: "eu_standard",
      },
    ],
    electricityMwh: 50,
    electricityFactorTco2PerMwh: 0.5,
    electricityFactorSource: "ppa",
    status: "submitted",
  });
  const see = workspaceSEE(ws);
  const trend = seeTrendFor(see);
  assert.equal(trend.length, 1);
  assert.equal(trend[0].month, "2026-01");
  assert.ok(trend[0].seeDirect > 0);
  assert.ok(trend[0].seeIndirect > 0, "the electricity is still reported");
  assert.ok(
    Math.abs(trend[0].seeTotal - trend[0].seeDirect) < 1e-9,
    "steel is an Annex II good: only its direct emissions count, so the line read against the EU default is direct",
  );
});

test("for a good that counts indirect emissions the trend's total adds the electricity", async () => {
  storage.clear();
  const cfg = await import("../config");
  const cement = cfg.PRODUCT_CATALOG.find(
    (p: { cnCode: string; category: string }) =>
      cfg.aggregatedGoodsCategory(p as never) === "Cement",
  )!;
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: cement.id,
    productionRoute: "cement_all_routes",
    year: 2026,
  });
  saveMonth({
    ...emptyMonth(ws.id, "2026-01"),
    productionTonnes: 100,
    fuels: [
      {
        id: "f1",
        fuelType: "natural_gas",
        quantity: 1000,
        unit: "m3",
        ncvMjPerUnit: 38,
        efTco2PerGj: 0.0561,
        oxidationFactor: 1,
        factorSource: "eu_standard",
      },
    ],
    electricityMwh: 50,
    electricityFactorTco2PerMwh: 0.5,
    electricityFactorSource: "ppa",
    status: "submitted",
  });
  const trend = seeTrendFor(workspaceSEE(ws));
  assert.equal(trend.length, 1);
  assert.ok(
    Math.abs(trend[0].seeTotal - (trend[0].seeDirect + trend[0].seeIndirect)) <
      1e-9,
  );
});

test("benchmarkOutperformance is null when SEE is not computable", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const see = workspaceSEE(ws);
  assert.equal(benchmarkOutperformance(ws, see), null);
});

test("a facility beating the default reads as a positive outperformance percentage", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  saveMonth({
    ...emptyMonth(ws.id, "2026-01"),
    productionTonnes: 1000,
    fuels: [
      {
        id: "f1",
        fuelType: "natural_gas",
        quantity: 100,
        unit: "m3",
        ncvMjPerUnit: 38,
        efTco2PerGj: 0.0561,
        oxidationFactor: 1,
        factorSource: "eu_standard",
      },
    ],
    electricityMwh: 5,
    electricityFactorTco2PerMwh: 0.1,
    electricityFactorSource: "ppa",
    status: "submitted",
  });
  const see = workspaceSEE(ws);
  const bench = benchmarkOutperformance(ws, see);
  assert.ok(bench);
  assert.ok(
    bench!.outperformancePercent > 0,
    "a very small per-tonne figure against billet's category default should read as outperforming",
  );
});

test("seeTrendByQuarter: no counted months produces no points, not a false zero", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const see = workspaceSEE(ws);
  assert.deepEqual(seeTrendByQuarter(see), []);
});

test("seeTrendByQuarter: two months in the same quarter are production-weighted, not averaged", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  // Jan: light month, 100t. Feb: heavy month, 900t — same fuel mix each time
  // so the per-tonne SEE is identical between the two, and the ratio simply
  // confirms the roll-up sums raw tCO2/tonnes across the quarter rather than
  // averaging two months' already-divided per-tonne figures.
  const fuels = (qty: number) => [
    {
      id: "f1",
      fuelType: "natural_gas",
      quantity: qty,
      unit: "m3" as const,
      ncvMjPerUnit: 38,
      efTco2PerGj: 0.0561,
      oxidationFactor: 1,
      factorSource: "eu_standard" as const,
    },
  ];
  saveMonth({
    ...emptyMonth(ws.id, "2026-01"),
    productionTonnes: 100,
    fuels: fuels(100),
    electricityMwh: 5,
    electricityFactorTco2PerMwh: 0.1,
    electricityFactorSource: "ppa",
    status: "submitted",
  });
  saveMonth({
    ...emptyMonth(ws.id, "2026-02"),
    productionTonnes: 900,
    fuels: fuels(900),
    electricityMwh: 45,
    electricityFactorTco2PerMwh: 0.1,
    electricityFactorSource: "ppa",
    status: "submitted",
  });
  const see = workspaceSEE(ws);
  const monthly = seeTrendFor(see);
  const quarters = seeTrendByQuarter(see);

  assert.equal(quarters.length, 1);
  assert.equal(quarters[0].quarter, "2026-Q1");
  assert.equal(quarters[0].monthsCounted, 2);
  // Same intensity in both months means the weighted quarterly figure must
  // land on that same per-tonne value — proof the roll-up is weighted
  // correctly rather than, say, silently summing per-tonne figures.
  assert.ok(Math.abs(quarters[0].seeDirect - monthly[0].seeDirect) < 1e-9);
  assert.ok(
    Math.abs(quarters[0].seeTotal - quarters[0].seeDirect) < 1e-9,
    "steel: the total is the direct figure",
  );
});

test("seeTrendByQuarter: months in different quarters produce separate points, in order", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const fuels = [
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
  saveMonth({
    ...emptyMonth(ws.id, "2026-03"),
    productionTonnes: 100,
    fuels,
    electricityMwh: 5,
    electricityFactorTco2PerMwh: 0.1,
    electricityFactorSource: "ppa",
    status: "submitted",
  });
  saveMonth({
    ...emptyMonth(ws.id, "2026-04"),
    productionTonnes: 100,
    fuels,
    electricityMwh: 5,
    electricityFactorTco2PerMwh: 0.1,
    electricityFactorSource: "ppa",
    status: "submitted",
  });
  const quarters = seeTrendByQuarter(workspaceSEE(ws));
  assert.deepEqual(
    quarters.map((q) => q.quarter),
    ["2026-Q1", "2026-Q2"],
  );
  assert.equal(quarters[0].quarterLabel, "Q1 2026");
  assert.equal(quarters[1].quarterLabel, "Q2 2026");
});

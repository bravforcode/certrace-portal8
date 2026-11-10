/* ════════════════════════════════════════════════════════════
   CARBON & COST MODEL — the rules the tab's header comment states, pinned

     1. the bill is (SEE − CBAM factor × benchmark) × tonnes × price, never a flat 2.5 %
     2. the default is read like with like: no electricity for steel and aluminium
     3. a figure with nothing behind it is null, never zero
     4. the groups add up to the whole, however they are cut
     5. a claimed carbon price is capped at the bill and never subtracted
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { cbamFactor, rateSheet } from "../eu-rates";
import {
  energyCostOf,
  groupRows,
  monthlySeries,
  priceFacts,
  toCurrency,
  totalsOf,
  unitCostsOf,
  type CostEnv,
  type CostFacts,
} from "../carbon-cost-model";
import { sampleCostFacts } from "./fixtures/carbon-cost-sample";

const env: CostEnv = {
  certificatePrice: () => ({ eurPerTonne: 75.28, label: "2026-Q2" }),
  eurToThb: 38,
  rates: { THB: 38, EUR: 1, CNY: 7.8, INR: 95 },
};

const steel = (over: Partial<CostFacts> = {}): CostFacts => ({
  id: "w1",
  installationId: "i1",
  installationName: "Plant",
  productId: "billet",
  productName: "Billet",
  cnCode: "7207 11 11",
  year: 2026,
  country: "TH",
  routeLetter: "E",
  indirectCounted: false,
  tonnes: 1000,
  monthsCounted: 6,
  directT: 300,
  indirectT: 250,
  precursorT: 100,
  precursorDefaultShare: 0.5,
  months: [
    {
      month: "2026-01",
      tonnes: 500,
      directT: 150,
      indirectT: 125,
      precursorT: 50,
    },
    {
      month: "2026-02",
      tonnes: 500,
      directT: 150,
      indirectT: 125,
      precursorT: 50,
    },
  ],
  reason: "partial_year",
  euTonnes: null,
  energy: {
    fuels: [
      {
        key: "natural_gas|m3",
        fuelType: "natural_gas",
        unit: "m3",
        quantity: 9000,
      },
    ],
    electricityKwh: 500000,
  },
  inputs: {
    priceThbPerTonne: 20000,
    pieceKg: 100,
    electricityThbPerKwh: 4,
    fuelThbPerUnit: { "natural_gas|m3": 18 },
  },
  homePrice: null,
  ...over,
});

test("the bill is the emissions less the free allocation, not 2.5 % of them", () => {
  const r = priceFacts(steel(), env);
  const sheet = rateSheet({
    cn: "7207 11 11",
    country: "TH",
    year: 2026,
    routeLetter: "E",
  });
  const bm = sheet!.benchmark.process!;
  // direct 0.3 + precursor 0.1 per tonne; electricity reported, not charged
  assert.ok(Math.abs(r.see!.chargeable - 0.4) < 1e-9);
  const perT = 0.4 - cbamFactor(2026)! * bm;
  assert.ok(Math.abs(r.chargeableActualPerT! - perT) < 1e-9);
  assert.ok(Math.abs(r.costActualEur! - perT * 1000 * 75.28) < 1e-6);
  // 2.5 % of the emissions would be a small fraction of that: almost all of it is payable
  assert.ok(r.costActualEur! > 20 * (0.025 * 0.4 * 1000 * 75.28));
});

test("the default is the Annex I value with the year's mark-up, less the default benchmark", () => {
  const r = priceFacts(steel(), env);
  const s = rateSheet({ cn: "7207 11 11", country: "TH", year: 2026 })!;
  assert.equal(r.defaultValue, s.defaultValue);
  assert.ok(Math.abs(r.chargeableDefaultPerT! - s.chargeable!) < 1e-9);
  assert.ok(Math.abs(r.costDefaultEur! - s.chargeable! * 1000 * 75.28) < 1e-6);
  assert.ok(r.savingEur! > 0 && r.verdict === "below");
});

test("electricity counts only where the rules charge it", () => {
  const a = priceFacts(steel({ indirectCounted: false }), env);
  const b = priceFacts(steel({ indirectCounted: true }), env);
  assert.ok(Math.abs(b.see!.chargeable - a.see!.chargeable - 0.25) < 1e-9);
  // the whole embedded figure is the same either way
  assert.equal(a.embeddedT, b.embeddedT);
});

test("no production is null, never zero", () => {
  const r = priceFacts(
    steel({
      tonnes: 0,
      monthsCounted: 0,
      directT: 0,
      indirectT: 0,
      precursorT: 0,
      months: [],
    }),
    env,
  );
  assert.equal(r.see, null);
  assert.equal(r.embeddedT, null);
  assert.equal(r.costActualEur, null);
  assert.equal(r.costDefaultEur, null);
  assert.equal(r.costNote, "no_production");
  assert.equal(totalsOf([r]).costActualEur, null);
});

test("a year before 2026 has no certificates", () => {
  const r = priceFacts(steel({ year: 2025 }), env);
  assert.equal(r.costNote, "before_2026");
  assert.equal(r.costActualEur, null);
  assert.ok(r.embeddedT != null);
});

test("a missing certificate price leaves the cost empty and says why", () => {
  const r = priceFacts(steel(), { ...env, certificatePrice: () => null });
  assert.equal(r.costNote, "no_price");
  assert.equal(r.costActualEur, null);
});

test("the bill is on the tonnes shipped to the EU when they are entered, on all tonnes made when not", () => {
  const made = priceFacts(steel(), env);
  const eu = priceFacts(steel({ euTonnes: 400 }), env);
  assert.equal(made.costBasis, "produced");
  assert.equal(eu.costBasis, "eu");
  assert.ok(Math.abs(eu.costActualEur! / made.costActualEur! - 0.4) < 1e-9);
  assert.equal(totalsOf([made]).assumedRows, 1);
  assert.equal(totalsOf([eu]).assumedRows, 0);
});

test("the full-year estimate scales what was made, not the per-tonne figures", () => {
  const part = priceFacts(steel(), env, false);
  const full = priceFacts(steel(), env, true);
  assert.equal(full.projected, true);
  assert.ok(Math.abs(full.tonnes - 2000) < 1e-9);
  assert.ok(Math.abs(full.see!.total - part.see!.total) < 1e-12);
  assert.ok(Math.abs(full.embeddedT! - part.embeddedT! * 2) < 1e-9);
  // a finished year is left alone
  assert.equal(
    priceFacts(steel({ monthsCounted: 12 }), env, true).projected,
    false,
  );
});

test("a claimed home carbon price is capped at the bill and never subtracted from it", () => {
  const base = priceFacts(steel(), env);
  const r = priceFacts(
    steel({
      homePrice: {
        amountPerTonne: 200,
        currency: "THB",
        sharePct: 20,
        rebatePerTonne: 0,
      },
    }),
    env,
  );
  assert.equal(r.costActualEur, base.costActualEur);
  assert.ok(r.claimedEur! > 0 && r.claimedEur! <= r.costActualEur!);
  const huge = priceFacts(
    steel({
      homePrice: {
        amountPerTonne: 1e9,
        currency: "EUR",
        sharePct: 100,
        rebatePerTonne: 0,
      },
    }),
    env,
  );
  assert.equal(huge.claimedEur, huge.costActualEur);
  // an unanswered share is not a full-coverage claim
  assert.equal(
    priceFacts(
      steel({
        homePrice: {
          amountPerTonne: 200,
          currency: "THB",
          sharePct: null,
          rebatePerTonne: 0,
        },
      }),
      env,
    ).claimedEur,
    null,
  );
});

test("energy: every price it needs, or no total", () => {
  const ok = energyCostOf(steel());
  assert.equal(ok.totalThb, 9000 * 18 + 500000 * 4);
  assert.equal(ok.perTonneThb, ok.totalThb! / 1000);
  const missing = energyCostOf(steel({ inputs: { electricityThbPerKwh: 4 } }));
  assert.equal(missing.totalThb, null);
  assert.deepEqual(missing.missing, ["natural_gas|m3"]);
  assert.equal(missing.partialThb, 500000 * 4);
  assert.equal(
    energyCostOf(steel({ energy: { fuels: [], electricityKwh: 0 } })).totalThb,
    null,
  );
});

test("per unit: per piece needs the weight of a piece, and shares are of the selling price", () => {
  const r = priceFacts(steel(), env);
  const t = unitCostsOf(r, env, "tonne")!;
  const p = unitCostsOf(r, env, "piece")!;
  assert.ok(Math.abs(p.carbonThb! - t.carbonThb! * 0.1) < 1e-9);
  assert.ok(
    Math.abs(t.energyPctOfPrice! - (t.energyThb! / 20000) * 100) < 1e-9,
  );
  assert.ok(
    Math.abs(t.restThb! - (20000 - t.energyThb! - t.carbonThb!)) < 1e-9,
  );
  assert.equal(
    unitCostsOf(
      priceFacts(steel({ inputs: { priceThbPerTonne: 20000 } }), env),
      env,
      "piece",
    ),
    null,
  );
  assert.equal(
    unitCostsOf(priceFacts(steel({ inputs: null }), env), env, "tonne")!
      .priceThb,
    null,
  );
});

test("every cut of the rows adds up to the whole", () => {
  const rows = sampleCostFacts().map((f) => priceFacts(f, env));
  const whole = totalsOf(rows);
  for (const dim of ["installation", "product", "year"] as const) {
    const groups = groupRows(rows, dim, null);
    assert.ok(
      Math.abs(
        groups.reduce((a, g) => a + (g.totals.embeddedT ?? 0), 0) -
          whole.embeddedT!,
      ) < 1e-6,
      dim,
    );
    assert.ok(
      Math.abs(
        groups.reduce((a, g) => a + (g.totals.costActualEur ?? 0), 0) -
          whole.costActualEur!,
      ) < 1e-3,
      dim,
    );
    assert.ok(
      Math.abs(
        groups.reduce((a, g) => a + (g.totals.costDefaultEur ?? 0), 0) -
          whole.costDefaultEur!,
      ) < 1e-3,
      dim,
    );
  }
  const nested = groupRows(rows, "year", "installation");
  for (const g of nested)
    assert.ok(
      Math.abs(
        g.children.reduce((a, c) => a + (c.totals.costActualEur ?? 0), 0) -
          (g.totals.costActualEur ?? 0),
      ) < 1e-3,
    );
});

test("the month series compares the chargeable figure with the default, like with like", () => {
  const rows = [priceFacts(steel(), env)];
  const s = monthlySeries(rows);
  assert.equal(s.length, 2);
  assert.ok(s.every((p) => p.chargeableT < p.actualT));
  const dv = rows[0].defaultValue!;
  assert.ok(Math.abs(s[0].defaultT - dv * 500) < 1e-9);
  const projected = monthlySeries([priceFacts(steel(), env, true)]);
  assert.equal(projected.length, 12);
  assert.equal(projected.filter((p) => p.projected).length, 10);
});

test("the sample is complete, finite and cheaper on its own data than on the default", () => {
  const rows = sampleCostFacts().map((f) => priceFacts(f, env));
  assert.ok(rows.length >= 8);
  for (const r of rows) {
    for (const v of [r.embeddedT, r.costActualEur, r.costDefaultEur, r.gapPct])
      assert.ok(v == null || Number.isFinite(v), r.facts.id);
    if (r.costActualEur != null)
      assert.ok(r.costActualEur < r.costDefaultEur!, r.facts.id);
  }
  // one product is deliberately empty, to show the empty state
  assert.ok(rows.some((r) => r.see == null));
  assert.ok(new Set(rows.map((r) => r.facts.year)).size >= 2);
  assert.deepEqual(sampleCostFacts(), sampleCostFacts());
});

test("a euro amount can be shown in baht, euros, yuan or rupees, from the one set of rates", () => {
  const r = priceFacts(steel(), env);
  const eur = r.costActualEur!;
  assert.equal(toCurrency(eur, "EUR", env), eur);
  assert.ok(Math.abs(toCurrency(eur, "THB", env) - eur * 38) < 1e-6);
  assert.ok(Math.abs(toCurrency(eur, "CNY", env) - eur * 7.8) < 1e-6);
  assert.ok(Math.abs(toCurrency(eur, "INR", env) - eur * 95) < 1e-6);
});

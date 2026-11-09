/* ════════════════════════════════════════════════════════════
   THE PILOT CUSTOMERS, AS THE PORTAL WOULD HOLD THEM

   Seven Thai steel and aluminium exporters answered the pilot application. This builds each of them as they described
   themselves — their goods by CN code, how many production routes and sites they have, how many suppliers they chase
   (1–10 or 11–50) — and then reads every screen's model over the whole estate at once: the readiness of each report, the
   emissions engine, the dashboard, the supply-chain scores, the cost, the bell.

   It is a test that the portal copes with REAL SHAPES, at their real size, without a number going missing:
     · every CN code the customers named is in the catalogue (one they wrote is not a CN code at all, and is said so);
     · every report computes finite figures, and an estate of a dozen reports and a few hundred suppliers reads in well under
       the time a page is allowed to take;
     · the models that feed the dashboard, the Supply Chain tab, Carbon & Cost and the bell agree with one another.

   Company names are the public companies' own. No contact details are held here — nobody's name, address or phone.
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
g.window = { localStorage: storage, dispatchEvent: () => true };
g.localStorage = storage;

const { applyEuStandard, emptyMonth, saveMonth } = await import("../monthly-data");
const { emptySupplier, saveSupplier } = await import("../precursor-suppliers");
const { createWorkspace, listWorkspaces, routesForCategory } = await import("../workspace");
const { markMonthSent } = await import("../month-dispatch");
const { workspaceSEE } = await import("../workspace-see");
const { workspaceReadiness } = await import("../readiness");
const { aggregatedGoodsCategory, getCatalogProduct } = await import("../config");
const { cnProductByCode } = await import("../cbam/cn-catalogue");
const { readDashboard } = await import("../cbam/dashboard-data");
const { buildFeed } = await import("../notifications/feed");
const { UPDATES } = await import("../cera/updates");
const { ANNOUNCEMENTS } = await import("../notifications/announcements");
const { ALL_ON } = await import("../notification-prefs");
const { saveCarbonPrice, emptyCarbonPrice } = await import("../carbon-price");

type Pilot = {
  company: string;
  /** CN codes as the customer wrote them — the ones the catalogue is expected to know */
  cn: string[];
  /** a code the customer wrote that is not a CN code at all */
  notACode?: string[];
  sites: number;
  /** 1–10 → 6, 11–50 → 30 */
  suppliers: number;
  /** months already in */
  monthsIn: number;
};

const PILOT: Pilot[] = [
  { company: "Vilas Thai Steel Sheet", cn: ["72101220", "72105000"], sites: 1, suppliers: 6, monthsIn: 9 },
  { company: "Bangkok Steel Manufacturing", cn: ["72104900", "72139110", "72142000"], sites: 1, suppliers: 6, monthsIn: 3 },
  { company: "Asian Wire Products", cn: ["72171090", "73269098"], sites: 1, suppliers: 30, monthsIn: 2 },
  { company: "Rachasima Steel", cn: ["72104900", "72139110", "72142000"], notACode: ["72101899"], sites: 2, suppliers: 30, monthsIn: 4 },
  { company: "NS-Siam United Steel", cn: ["72091899"], sites: 1, suppliers: 6, monthsIn: 5 },
  { company: "Thai Metal Aluminium", cn: ["76042910"], sites: 2, suppliers: 6, monthsIn: 9 },
  { company: "G J Steel", cn: ["72083900", "72083600", "72083700", "72083800"], sites: 1, suppliers: 30, monthsIn: 9 },
];

const NOW = new Date(2026, 9, 26, 13, 45);

const naturalGas = (tonnes: number) =>
  applyEuStandard({ id: `f-${tonnes}`, fuelType: "natural_gas", quantity: tonnes, unit: "t", efTco2PerGj: 0, factorSource: "eu_standard", oxidationFactor: 1 });

const monthKey = (m: number) => `2026-${String(m).padStart(2, "0")}`;

function build(p: Pilot, offset: number): void {
  const products = p.cn.map((code) => cnProductByCode(code)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  for (let site = 1; site <= p.sites; site += 1) {
    for (const product of products) {
      const category = aggregatedGoodsCategory(product);
      const route = routesForCategory(category)[0]?.id ?? "route_other";
      const ws = createWorkspace({
        installationId: `TH-${p.company.replace(/\W+/g, "").slice(0, 6).toUpperCase()}-${site}`,
        installationName: `${p.company} · site ${site}`,
        productId: product.id,
        productionRoute: route,
        country: "TH",
        year: 2026,
        selfSupplied: true,
      });

      for (let m = 1; m <= p.monthsIn; m += 1) {
        saveMonth({
          ...emptyMonth(ws.id, monthKey(m)),
          productionTonnes: 4000 + offset * 300 + m * 40,
          fuels: [naturalGas(180 + m)],
          electricityMwh: 900 + m * 10,
          status: "submitted",
          submittedAt: new Date(2026, m, 5).toISOString(),
          submittedBy: "Pilot",
        });
      }
      // the next two months have been asked for and are late — what the bell and the queue exist for
      for (const m of [p.monthsIn + 1, p.monthsIn + 2]) if (m <= 9) markMonthSent(ws.id, monthKey(m), 15);

      // a chain: direct precursors, and the second tier under about a third of them
      const direct = Math.max(1, Math.ceil(p.suppliers / (products.length * p.sites) / 1.5));
      for (let k = 0; k < direct; k += 1) {
        const parent = saveSupplier({
          ...emptySupplier(ws.id, null),
          name: `Supplier ${offset}-${site}-${k}`,
          installationName: `Works ${k}`,
          country: "TH",
          origin: "purchased",
          precursorName: product.category === "Aluminium" ? "Aluminium ingot" : "Hot-rolled coil",
          cnCode: product.category === "Aluminium" ? "7601" : "7208",
          dataOrigin: k % 3 === 0 ? "default_value" : "supplier_unverified",
          seeTco2ePerT: 1.2 + k * 0.1,
          monthlyQuantities: [{ month: "2026-01", tonnes: 500 + k * 10 }],
          contactEmail: k % 4 === 0 ? "" : `ops${k}@example.test`,
          contactName: k % 4 === 0 ? "" : "Contact",
          smartLinkSentAt: k % 2 === 0 ? new Date(2026, 8, 1).toISOString() : undefined,
        });
        if (k % 3 === 0) {
          saveSupplier({
            ...emptySupplier(ws.id, parent.id),
            name: `Sub-supplier ${offset}-${site}-${k}`,
            country: "TH",
            origin: "purchased",
            precursorName: "Pig iron",
            cnCode: "7201",
            dataOrigin: "default_value",
            seeTco2ePerT: 1.9,
          });
        }
      }

      saveCarbonPrice({ ...emptyCarbonPrice(ws.id), instrument: "excise_embedded", amountPerTonne: 200, legalBasis: "Excise notice, 22 April 2025", shareOfEmissionsCovered: 20 });
    }
  }
}

function buildAll(): void {
  storage.clear();
  PILOT.forEach((p, i) => build(p, i));
}

test("every CN code the pilot customers named is in the catalogue — and the one that is not a code is said not to be", () => {
  for (const p of PILOT) {
    for (const code of p.cn) assert.ok(cnProductByCode(code), `${p.company}: CN ${code} should be in the catalogue`);
    for (const code of p.notACode ?? []) assert.equal(cnProductByCode(code), undefined, `${code} is not a CN code, and must not match a good`);
  }
});

test("every good has a production route the portal offers for it", () => {
  for (const p of PILOT) {
    for (const code of p.cn) {
      const product = cnProductByCode(code)!;
      assert.ok(routesForCategory(aggregatedGoodsCategory(product)).length > 0, `${code} has no route to choose from`);
      assert.ok(getCatalogProduct(product.id), `${code} is not a catalogue product`);
    }
  }
});

test("the whole estate builds: one report per site and good, and every one computes finite figures", () => {
  buildAll();
  const all = listWorkspaces();
  const expected = PILOT.reduce((n, p) => n + p.sites * p.cn.filter((c) => cnProductByCode(c)).length, 0);
  assert.equal(all.length, expected);

  for (const ws of all) {
    const see = workspaceSEE(ws);
    assert.ok(see.computable, `${ws.productName} at ${ws.installationName} should compute with nine months of production in`);
    for (const key of ["directTCO2", "indirectTCO2", "seeTotal", "seeChargeable"] as const) {
      assert.ok(Number.isFinite(see[key]) && see[key] >= 0, `${ws.productName}: ${key} is ${see[key]}`);
    }
    const r = workspaceReadiness(ws);
    assert.ok(r.tabs.length > 0);
    assert.ok(r.tabs.every((t) => typeof t.state === "string"));
  }
});

test("the dashboard reads the whole estate at once, in time, and agrees with itself", () => {
  buildAll();
  const t0 = Date.now();
  const d = readDashboard(NOW);
  const ms = Date.now() - t0;
  assert.ok(ms < 8000, `reading ${listWorkspaces().length} reports took ${ms} ms`);

  assert.equal(d.carbon.rows.length, listWorkspaces().length);
  assert.equal(d.chain.total, d.chain.plants + d.chain.precursors);
  assert.ok(d.chain.precursors > 50, "a few hundred suppliers across the estate");
  assert.ok(Number.isFinite(d.daysToDeadline) && d.daysToDeadline > 300);
  assert.ok(d.hasFigures);
  assert.equal(d.company.reports, listWorkspaces().length);
  for (const row of d.carbon.rows) {
    assert.ok(Number.isFinite(row.facts.tonnes), "tonnes");
    assert.ok(row.costDefaultEur == null || Number.isFinite(row.costDefaultEur), "default cost");
  }
  // late months: the pilot answers were asked for and are overdue
  assert.ok(d.actions.some((a) => a.type === "monthly_data"));
});

test("the bell tells the same story as the dashboard — one notice a situation, each one going somewhere or saying something", () => {
  buildAll();
  const d = readDashboard(NOW);
  const feed = buildFeed({ now: NOW, dash: d, trial: { onTrial: false }, caps: [], planName: "Standard", events: [], updates: UPDATES, announcements: ANNOUNCEMENTS, prefs: ALL_ON });
  assert.equal(new Set(feed.map((n) => n.id)).size, feed.length, "ids are unique");
  for (const n of feed) assert.ok(Boolean(n.href) !== Boolean(n.message), `${n.id}: exactly one of href and message`);

  // every report with late months is in the bell — each late month on its own, or three and more together, so a report that is
  // months behind is one line and not a page of them
  const lateByReport = new Map<string, number>();
  for (const a of d.actions) if (a.type === "monthly_data" && a.daysUntilDue < 0) lateByReport.set(a.workspaceId, (lateByReport.get(a.workspaceId) ?? 0) + 1);
  assert.ok(lateByReport.size > 0);
  for (const [ws, n] of lateByReport) {
    const own = feed.filter((x) => x.id === `months:${ws}` || x.id.startsWith(`month:${ws}:`));
    if (n >= 3) {
      assert.equal(own.length, 1, `${n} late months of one report are one notice`);
      assert.equal(own[0].title.vars?.n, n);
      assert.equal(own[0].href, `/workspaces/${ws}/monthly`);
    } else {
      assert.equal(own.length, n);
    }
    assert.ok(own.every((x) => x.tone === "err" && x.rank === 0));
  }

  for (const n of feed.filter((x) => x.id.startsWith("month:"))) {
    assert.match(n.href ?? "", /^\/workspaces\/[^/]+\/monthly\/2026-\d{2}#qf-production$/, "a late month leads to the first field of that month");
  }
});

test("a chain the size of the larger pilot customers is scored, ranked and summarised", () => {
  buildAll();
  const d = readDashboard(NOW);
  const s = d.chain;
  assert.equal(Object.values(s.byState).reduce((a, b) => a + b, 0), s.total, "every party has a state");
  assert.ok(s.concerns.length > 0);
  assert.ok(s.concerns.every((c) => c.name.trim().length > 0), "every worry names who it is about");
  const ranks = s.concerns.map((c) => ({ high: 0, medium: 1, low: 2 })[c.severity]);
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), "the worst come first");
});

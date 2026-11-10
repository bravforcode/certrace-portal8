/* The shipment → buyer loop, against the golden fixture (spec §8 row 10). */

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map<string, string>();
(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

const {
  emissionsByBuyer,
  unlinkedShipmentsFor,
  linkShipments,
  listShipments,
  shipmentsFor,
  pendingShipments,
  addShipment,
} = await import("../../shipments");
const { freezeCalculation, chargeableSeeForDate } = await import("../freeze");
const {
  goldenDataset,
  goldenPrecursorTree,
  GOLDEN_DECLARATION_ID,
  GOLDEN_SHIPMENTS,
  GOLDEN_EXPECTED,
} = await import("../__fixtures__/golden");

beforeEach(() => store.clear());

const seedGoldenShipments = () => {
  for (const s of GOLDEN_SHIPMENTS) {
    addShipment({ ...s, productId: "wirerod", declarationId: null });
  }
};

test("Buyer A's 136.0 t comes to 18.1075 tCO₂e end to end", async () => {
  // Freeze first, so shipments have an approved figure to resolve against.
  await freezeCalculation({
    declarationId: GOLDEN_DECLARATION_ID,
    dataset: goldenDataset(),
    precursorTree: goldenPrecursorTree(),
    category: "Iron & Steel",
    preparerId: "Preparer",
    approverId: "Approver",
    effectiveFrom: "2026-01-01",
  });

  seedGoldenShipments();
  const decl = {
    id: GOLDEN_DECLARATION_ID,
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
  };

  const candidates = unlinkedShipmentsFor(decl);
  /* The demo seed in lib/shipments.ts deliberately uses the same tonnages as
     the fixture, so match on the buyer rather than on the quantities. */
  const golden = candidates.filter((c) => c.buyer === "Buyer A");
  assert.equal(golden.length, 3);

  linkShipments(
    golden.map((c) => c.id),
    GOLDEN_DECLARATION_ID,
  );

  const linked = shipmentsFor(GOLDEN_DECLARATION_ID);
  assert.equal(linked.length, 3);
  assert.ok(
    Math.abs(
      linked.reduce((a, s) => a + s.quantityTonnes, 0) -
        GOLDEN_EXPECTED.T_buyerA_tonnes,
    ) < 1e-9,
  );

  const rows = emissionsByBuyer(linked, (declId, date) =>
    chargeableSeeForDate(declId, date),
  );
  const buyerA = rows.find((r) => r.buyer === "Buyer A")!;
  assert.ok(
    Math.abs(buyerA.embeddedTCO2e - GOLDEN_EXPECTED.T_buyerA_tCO2e) < 1e-3,
    `expected ${GOLDEN_EXPECTED.T_buyerA_tCO2e}, got ${buyerA.embeddedTCO2e}`,
  );
  assert.equal(buyerA.unpricedTonnes, 0);
});

test("nothing is linked without being asked — candidates are a proposal", () => {
  seedGoldenShipments();
  const decl = {
    id: GOLDEN_DECLARATION_ID,
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
  };

  assert.ok(unlinkedShipmentsFor(decl).length > 0);
  // Merely listing candidates must not mutate anything.
  assert.equal(shipmentsFor(GOLDEN_DECLARATION_ID).length, 0);
  assert.equal(
    listShipments().every((s) => s.declarationId === null),
    true,
  );
});

test("pending shipments stay visible and stay out of buyer totals", () => {
  seedGoldenShipments();
  const pending = pendingShipments();
  assert.ok(pending.length >= 3);

  const rows = emissionsByBuyer(listShipments(), () => 0.1331436);
  assert.equal(rows.length, 0, "unattributed shipments reach no buyer total");
});

test("a shipment outside the period is never proposed", () => {
  addShipment({
    date: "2025-11-02",
    buyer: "Buyer A",
    productId: "wirerod",
    quantityTonnes: 10,
    declarationId: null,
  });
  const candidates = unlinkedShipmentsFor({
    id: GOLDEN_DECLARATION_ID,
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
  });
  assert.equal(
    candidates.some((c) => c.date === "2025-11-02"),
    false,
  );
});

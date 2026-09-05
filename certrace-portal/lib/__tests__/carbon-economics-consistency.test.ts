/* Regression: a supplier's gross cost must equal the sum of its products'
   gross costs. It used to be priced off the supplier's ROUNDED chargeable
   tonnes (sf.chargeableTCO2e = round(Σ)), while each product priced off its
   un-rounded tonnes — so Σ(product) and the supplier total drifted by up to
   ~1 t × price. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { computeCost } from "../carbon-economics";
import type { ComplianceFacts } from "../compliance-engine";

function facts(): ComplianceFacts {
  const product = (id: string, chargeable: number) => ({
    productId: id,
    productName: id,
    cnCode: "7208",
    category: "iron_steel",
    tonnes: 100,
    seePerTonne: 1,
    chargeablePerTonne: chargeable / 100,
    grossTCO2e: chargeable,
    chargeableTCO2e: chargeable, // un-rounded, as the engine leaves per-product
    method: "default",
    defaultUsed: false,
    markup: 0,
  });
  const products = [product("a", 10.4), product("b", 10.4)]; // Σ = 20.8, rounds to 21
  const sumCharge = products.reduce((s, p) => s + p.chargeableTCO2e, 0);
  return {
    year: 2026,
    declarable: true,
    totalTonnes: 200,
    perSupplier: {
      s1: {
        supplierId: "s1",
        supplierName: "Acme",
        products,
        grossTCO2e: sumCharge,
        chargeableTCO2e: Math.round(sumCharge), // 21 — the engine rounds the supplier total
        defaultMethodProducts: [],
        capViolations: [],
        unverifiedActual: [],
        evidenceGaps: [],
        carbonPricePaidEUR: 0,
        netExposureEUR: 0,
      },
    },
    totalGrossTCO2e: sumCharge,
    totalChargeableTCO2e: Math.round(sumCharge),
    totalNetExposureEUR: 0,
    anyCapViolations: false,
    anyUnverifiedActual: false,
  } as unknown as ComplianceFacts;
}

test("supplier gross cost ties out to the sum of its products (no rounded-tonne drift)", () => {
  const price = 82;
  const cost = computeCost(facts(), { pricePerTonneEUR: price, thbPerEur: 39 });
  const s = cost.suppliers[0];

  const sumProducts = s.products.reduce((a, p) => a + p.grossCostEUR, 0);
  assert.equal(s.grossCostEUR, Math.round(sumProducts)); // ties out to the parts
  assert.notEqual(s.grossCostEUR, Math.round(21 * price)); // NOT the old rounded-tonne basis
});

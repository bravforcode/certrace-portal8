/* The Data Gap penalty prices the gap between a published default value and the
   installation's own chargeable emissions. Three things must hold:
   - the default is the one Annex I publishes for the installation's country and
     the declaration's own CN code, in the reporting year;
   - the year's markup is counted once: it is already inside the 2026/2027/2028
     columns, so applying it again would overstate the exposure by 10–30%;
   - indirect emissions count only where the sector makes them chargeable. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { SELF_SUPPLIER_ID } from "../../data";
import {
  chargeablePerTonne,
  dataGapPenalty,
  ownGoodsCnCodes,
  publishedDefaultFor,
  sharedSector,
} from "../data-gaps";

test("the penalty default is the Thai Annex I row for the CN code, in the reporting year", () => {
  /* Annex I, Thailand, heading 7208: total 1.92 t/t; the 2026 column is that
     value with the 10% markup applied (1.92 × 1.10 = 2.112, published 2.111). */
  assert.equal(publishedDefaultFor("7208 10 00", "TH", 2026), 2.111);
  assert.equal(publishedDefaultFor("7208 10 00", "TH", 2027), 2.303);
  assert.equal(publishedDefaultFor("7208 10 00", "TH", 2028), 2.495);
  /* Annex I's 2028 column applies "and onwards". */
  assert.equal(publishedDefaultFor("7208 10 00", "TH", 2031), 2.495);
});

test("a country Annex I does not list takes the 'Other countries' value, not nothing", () => {
  const other = publishedDefaultFor("7208 10 00", "ZZ", 2026);
  assert.notEqual(other, null);
  assert.equal(publishedDefaultFor("7208 10 00", "XX", 2026), other);
});

test("a CN code with no Annex I row has no published default", () => {
  assert.equal(publishedDefaultFor("9999 99 99", "TH", 2026), null);
});

test("the year's markup is counted once: the published value is used as it stands", () => {
  /* 2.111 already contains the 2026 markup. Chargeable 2.000 t/t over 1,000 t at
     €80/t: exposure is (2.111 − 2.000) × 1,000 × 80 = €8,880. Multiplying by
     (1 + 0.10) again would give €9,768. */
  const x = dataGapPenalty({
    defaultValue: 2.111,
    chargeableSEE: 2.0,
    quantityTonnes: 1000,
    certificatePrice: 80,
    markup: 0.1,
  });
  assert.ok(Math.abs(x.currency - 8880) < 1e-6, `currency was ${x.currency}`);
  assert.equal(x.worseThanDefault, false);
});

test("indirect emissions are chargeable only for the sectors that make them so", () => {
  assert.equal(chargeablePerTonne("Iron & Steel", 0.8, 0.1), 0.8);
  assert.equal(chargeablePerTonne("Aluminium", 0.8, 0.1), 0.8);
  assert.ok(Math.abs(chargeablePerTonne("Cement", 0.8, 0.1) - 0.9) < 1e-9);
  assert.ok(Math.abs(chargeablePerTonne("Fertilisers", 0.8, 0.1) - 0.9) < 1e-9);
});

test("the penalty's CN is the exporter's own good: its self-supplied request, one code", () => {
  const cnOfProduct: Record<string, string | undefined> = {
    "p-rebar": "7214 10 00",
    "p-ore": "2601 11 00",
  };
  const cnOf = (id: string) => cnOfProduct[id];
  const requests = [
    { supplierId: SELF_SUPPLIER_ID, products: [{ productId: "p-rebar" }] },
    { supplierId: "sup-1", products: [{ productId: "p-ore" }] },
  ];
  assert.deepEqual(ownGoodsCnCodes(requests, cnOf), ["7214 10 00"]);
  assert.deepEqual(ownGoodsCnCodes(undefined, cnOf), []);
  assert.deepEqual(
    ownGoodsCnCodes(
      [{ supplierId: SELF_SUPPLIER_ID, products: [{ productId: "unknown" }] }],
      cnOf,
    ),
    [],
  );
});

test("chargeability is known only when every own CN code maps to one shared sector", () => {
  /* Indirect counts for cement but not steel, so a mixed or unmapped set has no
     single answer: the screen must show it as unknown, not quietly drop indirect. */
  assert.equal(sharedSector(["2523 29 00", "2523 10 00"]), "Cement");
  assert.equal(sharedSector(["2523 29 00", "7208 10 00"]), undefined);
  assert.equal(sharedSector(["2523 29 00", "9999 99 99"]), undefined);
  assert.equal(sharedSector(["9999 99 99"]), undefined);
  assert.equal(sharedSector([]), undefined);
});

import { describe, expect, it } from "vitest";

import { computeComplianceFacts } from "../compliance-engine";
import { getCatalogProduct } from "../config";
import type { ReviewRollup, ReviewSubmission } from "../exporter-review";
import { buildLiabilityView, resolveCertificatePriceAsOf } from "../financial-liability";
import type { ThbEurRate } from "../fx";
import { valueKey } from "../supplier";

/* Pig iron is a primary input, so its embedded result is the direct figure
   alone — no precursor rows are needed to exercise the money path. */
const product = getCatalogProduct("pigiron")!;

const RATE: ThbEurRate = { thbPerEur: "39.20", asOf: "2026-06-30", source: "ecb", stale: false };

/** A published quarter (2026 Q2 = €75.28/t) and an unpublished one. */
const PRICED_DAY = "2026-05-15";
const UNPRICED_DAY = "2026-08-14";
const Q2_PRICE = "75.28";

type SubmissionOverrides = {
  id?: string;
  name?: string;
  submitted?: boolean;
  tonnes?: string;
  direct?: string;
  indirect?: string;
  carbonPrice?: string;
  carbonPriceCurrency?: "THB" | "EUR";
};

function submission(overrides: SubmissionOverrides = {}): ReviewSubmission {
  const {
    id = "s1",
    name = "Supplier One",
    submitted = true,
    tonnes = "100",
    direct = "2",
    indirect = "0.5",
    carbonPrice = "0",
    carbonPriceCurrency = "THB",
  } = overrides;

  const values: Record<string, string> = {
    [valueKey("method", product.id)]: "actual",
    [valueKey("direct-emissions", product.id)]: direct,
    [valueKey("indirect-emissions", product.id)]: indirect,
    [valueKey("carbon-price")]: carbonPrice,
    [valueKey("carbon-price-currency")]: carbonPriceCurrency,
  };

  // Only the fields computeComplianceFacts actually reads are populated; the
  // rest of ReviewSubmission is review/audit state irrelevant to the money path.
  return {
    supplier: { id, name },
    request: { products: [{ product, commercialQuantityTonnes: tonnes }], documents: [] },
    submitted,
    values,
  } as unknown as ReviewSubmission;
}

function rollupOf(...submissions: ReviewSubmission[]): ReviewRollup {
  return { submissions } as unknown as ReviewRollup;
}

const period = { periodStart: "2026-01-01", periodEnd: "2026-12-31", periodLabel: "Annual 2026 (Jan–Dec)" };

const viewAt = (day: string, roll: ReviewRollup = rollupOf(submission())) =>
  buildLiabilityView(period, roll, RATE, new Date(`${day}T00:00:00Z`));

describe("resolveCertificatePriceAsOf", () => {
  it("prices an in-progress period at today", () => {
    expect(resolveCertificatePriceAsOf(period, new Date("2026-08-14T00:00:00Z"))).toBe("2026-08-14");
  });

  it("clamps a not-yet-started period to its first day", () => {
    expect(resolveCertificatePriceAsOf(period, new Date("2025-11-02T00:00:00Z"))).toBe("2026-01-01");
  });

  it("clamps a closed period to its last day", () => {
    expect(resolveCertificatePriceAsOf(period, new Date("2027-03-09T00:00:00Z"))).toBe("2026-12-31");
  });

  it("falls back to year bounds parsed from the period label", () => {
    expect(resolveCertificatePriceAsOf({ periodLabel: "Annual 2026 (Jan–Dec)" }, new Date("2027-03-09T00:00:00Z"))).toBe(
      "2026-12-31",
    );
  });
});

describe("cost outcome — published price", () => {
  it("prices chargeable tonnes at the published certificate price", () => {
    const { cost } = viewAt(PRICED_DAY);

    // Indirect emissions are excluded from the Annex-II chargeable result:
    // 100 t x 2 tCO2e/t = 200, not 250.
    expect(cost.chargeableTCO2e).toBe("200");
    expect(cost.certificatePriceEURPerTCO2e).toBe(Q2_PRICE);
    expect(cost.grossCostEUR).toBe("15056");
    expect(cost.available).toBe(true);
    expect(cost.unavailableReason).toBeNull();
  });

  it("derives the reporting year from the period, not the wall clock", () => {
    expect(viewAt(PRICED_DAY).cost.year).toBe(2026);
    expect(buildLiabilityView(period, rollupOf(submission()), RATE, new Date("2028-02-02T00:00:00Z")).cost.year).toBe(2026);
  });

  it("converts a THB carbon price through the ECB rate before offsetting", () => {
    const { cost } = viewAt(PRICED_DAY, rollupOf(submission({ carbonPrice: "100", carbonPriceCurrency: "THB" })));

    // 100 THB/t / 39.20 = 2.55 EUR/t, billed across 200 chargeable tonnes.
    expect(cost.carbonPricePaidEUR).toBe("510");
    expect(cost.netExposureEUR).toBe("14546");
    expect(cost.netExposureTHB).toBe("570203.2");
  });

  it("takes a EUR carbon price at face value", () => {
    const { cost } = viewAt(PRICED_DAY, rollupOf(submission({ carbonPrice: "10", carbonPriceCurrency: "EUR" })));

    expect(cost.carbonPricePaidEUR).toBe("2000");
    expect(cost.netExposureEUR).toBe("13056");
  });

  it("floors net exposure at zero rather than reporting a negative liability", () => {
    const { cost } = viewAt(PRICED_DAY, rollupOf(submission({ carbonPrice: "10000", carbonPriceCurrency: "THB" })));

    expect(cost.grossCostEUR).toBe("15056");
    expect(cost.carbonPricePaidEUR).toBe("51020");
    expect(cost.netExposureEUR).toBe("0");
  });

  it("sums across suppliers and ignores unsubmitted ones", () => {
    const roll = rollupOf(
      submission({ id: "s1", tonnes: "100" }),
      submission({ id: "s2", tonnes: "50" }),
      submission({ id: "s3", tonnes: "999", submitted: false }),
    );
    const { cost, facts } = buildLiabilityView(period, roll, RATE, new Date(`${PRICED_DAY}T00:00:00Z`));

    expect(Object.keys(facts.perSupplier)).toEqual(["s1", "s2"]);
    expect(cost.chargeableTCO2e).toBe("300");
    expect(cost.grossCostEUR).toBe("22584");
  });

  it("carries the FX provenance the number depends on", () => {
    expect(viewAt(PRICED_DAY).cost.fx).toEqual({
      thbPerEur: "39.20",
      asOf: "2026-06-30",
      source: "ecb",
      stale: false,
    });
  });
});

describe("cost outcome — no published price", () => {
  it("reports the outcome as unavailable instead of substituting a price", () => {
    const { cost } = viewAt(UNPRICED_DAY);

    expect(cost.asOf).toBe(UNPRICED_DAY);
    expect(cost.available).toBe(false);
    expect(cost.certificatePriceEURPerTCO2e).toBeNull();
    expect(cost.grossCostEUR).toBeNull();
    expect(cost.netExposureEUR).toBeNull();
    expect(cost.netExposureTHB).toBeNull();
    expect(cost.unavailableReason).toContain(UNPRICED_DAY);
  });

  it("never carries the previous quarter's price forward", () => {
    expect(viewAt(UNPRICED_DAY).cost.certificatePriceEURPerTCO2e).not.toBe(Q2_PRICE);
  });

  it("still resolves the tonnage — only the price is missing", () => {
    const { cost } = viewAt(UNPRICED_DAY);

    expect(cost.chargeableTCO2e).toBe("200");
    expect(cost.carbonPricePaidEUR).toBe("0");
  });
});

describe("computeComplianceFacts", () => {
  it("is deterministic across repeated runs on the same dataset", () => {
    const roll = rollupOf(submission({ carbonPrice: "100" }));
    const first = computeComplianceFacts(roll, 2026, PRICED_DAY, RATE);
    const second = computeComplianceFacts(roll, 2026, PRICED_DAY, RATE);

    expect(first).toEqual(second);
  });

  it("keeps the reported gross view (indirect included) apart from the chargeable one", () => {
    const facts = computeComplianceFacts(rollupOf(submission()), 2026, PRICED_DAY, RATE);

    expect(facts.totalGrossTCO2e).toBe("250");
    expect(facts.totalChargeableTCO2e).toBe("200");
  });

  it("flags actual-method submissions as unverified", () => {
    const facts = computeComplianceFacts(rollupOf(submission()), 2026, PRICED_DAY, RATE);

    expect(facts.anyUnverifiedActual).toBe(true);
    expect(facts.perSupplier.s1.unverifiedActual).toEqual([{ productId: product.id, productName: product.name }]);
  });

  it("never asserts declarability from exporter-side data alone", () => {
    const facts = computeComplianceFacts(rollupOf(submission()), 2026, PRICED_DAY, RATE);

    expect(facts.declarable).toBeNull();
    expect(facts.thresholdAssessment).toBe("not_assessed_requires_importer_annual_totals");
  });
});

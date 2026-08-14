import { describe, it, expect } from "vitest";
import type { PackageInput, SupplierChapter } from "./download";
import { buildDeclarationHandoff, serializeHandoffJson, serializeHandoffXml } from "./export-formats";

/* Minimal fixture: one supplier chapter, one good. The good name carries an
   XML-hostile character (&) and the emission values are high-precision decimal
   STRINGS that must survive verbatim — no float coercion. */
const chapter = {
  name: "Björn Steel & Co",
  ref: "SUP-001",
  country: "TH",
  version: 2,
  submittedAt: "Mon, 01 Jan 2026 00:00:00 GMT",
  installation: { name: "Plant <A>", address: "1 Rd", country: "TH" },
  additionalInstallations: [],
  monitoringPlans: [],
  products: [
    {
      name: 'Hot-rolled "coil" & sheet',
      cnCode: "72081000",
      category: "Iron & steel",
      group: "Steel",
      quantityTonnes: "1000.5",
      directPerTonne: "1.23456789012345678", // long decimal — must not lose digits
      indirectPerTonne: "0.42200000000000001",
      totalPerTonne: "1.65656789012345679",
      absoluteTCO2e: "1657.398...",
      calculationTraces: [],
      method: "actual",
    },
  ],
  carbonPrice: { amount: "0 THB/tCO₂e" },
  verification: "",
  documents: [],
  findings: [],
  versions: [],
} satisfies SupplierChapter;

const payload: PackageInput = {
  ref: "RPT-1",
  regulationShort: "cbam",
  regulationFull: "Regulation (EU) 2023/956",
  period: "2026-Q1",
  sector: "Steel",
  origin: "Thailand",
  market: "European Union",
  org: "Exporter Co & Sons",
  installationId: "INST-1",
  totalEmbedded: "1657.39812345678901234", // long decimal string
  supplierCount: 1,
  carbonPricePaid: "0",
  factorSet: "default",
  chapters: [chapter],
};

describe("XML export", () => {
  const xml = serializeHandoffXml(buildDeclarationHandoff(payload));

  it("escapes XML-hostile characters and never emits a raw & < > \" '", () => {
    expect(xml).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    expect(xml).toContain("Björn Steel &amp; Co");
    expect(xml).toContain("Hot-rolled &quot;coil&quot; &amp; sheet");
    expect(xml).toContain("Plant &lt;A&gt;");
    // The only literal ampersands allowed are the heads of entity refs.
    const strayAmp = xml.replace(/&(amp|lt|gt|quot|apos);/g, "");
    expect(strayAmp).not.toContain("&");
    expect(strayAmp).not.toContain("<A>"); // raw angle brackets escaped away
  });

  it("wraps content in the declared root and repeats list elements", () => {
    expect(xml).toContain("<CBAMDeclaration>");
    expect(xml).toContain("</CBAMDeclaration>");
    expect(xml).toContain("<Supplier>"); // suppliers[] → <Supplier>
    expect(xml).toContain("<Good>"); // goods[] → <Good>
  });

  it("preserves decimal emission strings verbatim", () => {
    expect(xml).toContain("<DirectPerTonne>1.23456789012345678</DirectPerTonne>");
    expect(xml).toContain("<TotalEmbeddedTCO2e>1657.39812345678901234</TotalEmbeddedTCO2e>");
  });
});

describe("JSON export", () => {
  it("preserves decimal strings without float coercion", () => {
    const handoff = buildDeclarationHandoff(payload);
    const json = serializeHandoffJson(handoff);
    const parsed = JSON.parse(json);

    // Values stay strings — round-tripping through JSON must not touch precision.
    expect(parsed.totals.totalEmbeddedTCO2e).toBe("1657.39812345678901234");
    const good = parsed.suppliers[0].goods[0];
    expect(good.emissions.directPerTonne).toBe("1.23456789012345678");
    expect(good.emissions.indirectPerTonne).toBe("0.42200000000000001");
    expect(good.quantityTonnes).toBe("1000.5");
    expect(typeof good.emissions.directPerTonne).toBe("string");

    // A raw JSON regex check: the long digit run appears literally, proving no
    // 1.2345678901234568-style float rounding happened anywhere in the pipe.
    expect(json).toMatch(/"directPerTonne": "1\.23456789012345678"/);
  });

  it("emits stable top-level key order", () => {
    const json = serializeHandoffJson(buildDeclarationHandoff(payload));
    const order = ["meta", "operator", "totals", "costOutcome", "suppliers"].map((k) => json.indexOf(`"${k}"`));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

/* The money block travels with the dataset. A consumer reading only the file
   must be able to tell a real zero from an unpublished price. */
describe("cost outcome export", () => {
  const priced: PackageInput["costOutcome"] = {
    available: true,
    unavailableReason: null,
    asOf: "2026-05-15",
    year: 2026,
    chargeableTCO2e: "200",
    certificatePriceEURPerTCO2e: "75.28",
    grossCostEUR: "15056",
    carbonPricePaidEUR: "510",
    netExposureEUR: "14546",
    netExposureTHB: "570203.2",
    fx: { thbPerEur: "39.20", asOf: "2026-06-30", source: "ecb", stale: false },
  };

  const unpriced: PackageInput["costOutcome"] = {
    ...priced,
    available: false,
    unavailableReason: "No officially published certificate price is configured for 2026-08-14; no proxy was substituted.",
    asOf: "2026-08-14",
    certificatePriceEURPerTCO2e: null,
    grossCostEUR: null,
    netExposureEUR: null,
    netExposureTHB: null,
  };

  it("carries every amount into JSON as a decimal string", () => {
    const parsed = JSON.parse(serializeHandoffJson(buildDeclarationHandoff({ ...payload, costOutcome: priced })));

    expect(parsed.costOutcome.available).toBe(true);
    expect(parsed.costOutcome.netExposureEUR).toBe("14546");
    expect(parsed.costOutcome.grossCostEUR).toBe("15056");
    expect(parsed.costOutcome.certificatePriceEURPerTCO2e).toBe("75.28");
    expect(parsed.costOutcome.pricedAsOf).toBe("2026-05-15");
    expect(typeof parsed.costOutcome.netExposureEUR).toBe("string");
  });

  it("carries the FX provenance the converted figure depends on", () => {
    const parsed = JSON.parse(serializeHandoffJson(buildDeclarationHandoff({ ...payload, costOutcome: priced })));

    expect(parsed.costOutcome.fxThbPerEur).toBe("39.20");
    expect(parsed.costOutcome.fxAsOf).toBe("2026-06-30");
    expect(parsed.costOutcome.fxStale).toBe(false);
  });

  it("nulls every amount and states the reason when no price is published", () => {
    const parsed = JSON.parse(serializeHandoffJson(buildDeclarationHandoff({ ...payload, costOutcome: unpriced })));

    expect(parsed.costOutcome.available).toBe(false);
    expect(parsed.costOutcome.netExposureEUR).toBeNull();
    expect(parsed.costOutcome.grossCostEUR).toBeNull();
    expect(parsed.costOutcome.certificatePriceEURPerTCO2e).toBeNull();
    expect(parsed.costOutcome.unavailableReason).toContain("2026-08-14");
    // An unavailable outcome must never read as a zero liability.
    expect(parsed.costOutcome.netExposureEUR).not.toBe("0");
  });

  it("reaches XML with the same values", () => {
    const xml = serializeHandoffXml(buildDeclarationHandoff({ ...payload, costOutcome: priced }));

    expect(xml).toContain("<NetExposureEUR>14546</NetExposureEUR>");
    expect(xml).toContain("<CertificatePriceEURPerTCO2e>75.28</CertificatePriceEURPerTCO2e>");
    expect(xml).toContain("<Available>true</Available>");
  });

  it("emits an empty element rather than a number when unavailable", () => {
    const xml = serializeHandoffXml(buildDeclarationHandoff({ ...payload, costOutcome: unpriced }));

    expect(xml).toContain("<NetExposureEUR />");
    expect(xml).toContain("<Available>false</Available>");
  });

  it("stays absent — not zero — when no cost outcome was resolved", () => {
    const parsed = JSON.parse(serializeHandoffJson(buildDeclarationHandoff(payload)));

    expect(parsed.costOutcome).toBeNull();
  });
});

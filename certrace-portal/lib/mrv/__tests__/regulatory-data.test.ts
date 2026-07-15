import { describe, expect, it } from "vitest";

import {
  assessAnnualImporterThreshold,
  cbamDeclarationDueDate,
  defaultMarkupForDate,
  evaluateActualValueVerification,
  lookupCertificatePrice,
  requireCertificatePrice,
} from "../compliance";
import { measuredValue, MEASUREMENT_SPECS } from "../measurements";
import { classifyCnCode, REGULATORY_SOURCES } from "../regulatory-data";
import type { AggregatedGoodsCategory, VerificationReference } from "../types";

const mass = (value: string) => measuredValue(MEASUREMENT_SPECS.goodsMass, value, "TNE");

function verification(scope: AggregatedGoodsCategory = "CRUDE_STEEL"): VerificationReference {
  return {
    id: "verification-2026",
    verifierLegalName: "Accredited Verifier Ltd",
    accreditationBody: "National Accreditation Body",
    accreditationIdentifier: "ACC-CBAM-001",
    accreditationValidFrom: "2026-01-01",
    accreditationValidTo: "2027-12-31",
    sectorScopes: [scope],
    verificationReportReference: "VR-2026-001",
    verificationReportIssuedAt: "2027-03-01",
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    opinion: "SATISFACTORY",
    evidenceReferences: ["evidence:verification-report"],
  };
}

describe("2026 steel and aluminium CN master data", () => {
  it.each([
    ["2601 12 00", "SINTERED_ORE"],
    ["7201 10 90", "PIG_IRON"],
    ["7202 11 80", "FERROMANGANESE"],
    ["7202 41 10", "FERROCHROMIUM"],
    ["7202 60 00", "FERRONICKEL"],
    ["7203 10 00", "DRI"],
    ["7207 11 90", "CRUDE_STEEL"],
    ["7219 13 10", "IRON_STEEL_PRODUCTS"],
    ["7318 15 95", "IRON_STEEL_PRODUCTS"],
    ["7601 10 90", "UNWROUGHT_ALUMINIUM"],
    ["7606 11 10", "ALUMINIUM_PRODUCTS"],
    ["7616 99 90", "ALUMINIUM_PRODUCTS"],
  ] as const)("classifies Annex-I code %s", (cnCode, category) => {
    const product = classifyCnCode(cnCode);
    expect(product?.aggregatedGoodsCategory).toBe(category);
    expect(product?.directEmissionsTreatment).toBe("INCLUDED");
    expect(product?.indirectEmissionsTreatment).toBe("EXCLUDED_FROM_EMBEDDED_EMISSIONS_ANNEX_II");
    expect(product?.sourceReferences.map((source) => source.id)).toEqual(
      expect.arrayContaining([REGULATORY_SOURCES.cbam.id, REGULATORY_SOURCES.monitoring.id]),
    );
  });

  it("makes the context-dependent 7205 mapping explicit", () => {
    const product = classifyCnCode("7205 10 00");
    expect(product?.aggregatedGoodsCategory).toBe("PIG_IRON_OR_IRON_STEEL_PRODUCTS");
    expect(product?.requiresProductionContext).toBe(true);
  });

  it.each(["7202 21 00", "7202 30 00", "7202 99 80", "7204 10 00", "7602 00 90", "7609 99 99", "9999 99 99"])(
    "does not invent a fallback classification for excluded or unknown code %s",
    (cnCode) => expect(classifyCnCode(cnCode)).toBeUndefined(),
  );

  it("fails malformed CN codes and does not apply a 2026 snapshot outside its effective dates", () => {
    expect(() => classifyCnCode("7208")).toThrow(/eight digits/);
    expect(() => classifyCnCode("72083900", "2026-02-30")).toThrow(/valid ISO date/);
    expect(classifyCnCode("72083900", "2027-01-01")).toBeUndefined();
  });

  it("attributes each definitive-period source to its actual subject", () => {
    expect(REGULATORY_SOURCES.verification.celex).toBe("32025R2546");
    expect(REGULATORY_SOURCES.accreditation.celex).toBe("32025R2551");
    expect(REGULATORY_SOURCES.freeAllocation.celex).toBe("32025R2620");
    expect(REGULATORY_SOURCES.defaults.celex).toBe("32025R2621");
    expect(REGULATORY_SOURCES.certificatePrices.url).toContain("price-cbam-certificates");
  });
});

describe("definitive-period compliance semantics", () => {
  it("assesses the 50-tonne threshold per importer and calendar year, with exactly 50 tonnes exempt", () => {
    const atThreshold = assessAnnualImporterThreshold("EORI-1", 2026, [
      { importerId: "EORI-1", calendarYear: 2026, sector: "IRON_STEEL", netMass: mass("20") },
      { importerId: "EORI-1", calendarYear: 2026, sector: "ALUMINIUM", netMass: mass("30") },
    ]);
    const overThreshold = assessAnnualImporterThreshold("EORI-1", 2026, [
      { importerId: "EORI-1", calendarYear: 2026, sector: "IRON_STEEL", netMass: mass("50.0001") },
    ]);
    expect(atThreshold).toMatchObject({ eligibleNetMass: "50", exempt: true, obligationsApplyToAllEligibleImports: false });
    expect(overThreshold).toMatchObject({ exempt: false, obligationsApplyToAllEligibleImports: true });
  });

  it("excludes electricity and hydrogen from the mass threshold and rejects mixed importer scope", () => {
    const assessment = assessAnnualImporterThreshold("EORI-1", 2026, [
      { importerId: "EORI-1", calendarYear: 2026, sector: "ELECTRICITY", netMass: mass("500") },
      { importerId: "EORI-1", calendarYear: 2026, sector: "HYDROGEN", netMass: mass("500") },
    ]);
    expect(assessment).toMatchObject({ eligibleNetMass: "0", excludedEntryCount: 2, exempt: true });
    expect(() =>
      assessAnnualImporterThreshold("EORI-1", 2026, [
        { importerId: "EORI-2", calendarYear: 2026, sector: "IRON_STEEL", netMass: mass("1") },
      ]),
    ).toThrow(/assessed importer/);
  });

  it("uses annual declarations with the first definitive declaration due 30 September 2027", () => {
    expect(cbamDeclarationDueDate(2026)).toBe("2027-09-30");
    expect(cbamDeclarationDueDate(2027)).toBe("2028-09-30");
  });

  it("applies 10%, 20%, and 30% schedules only to explicitly unmarked default bases", () => {
    expect(defaultMarkupForDate("2026-06-30").markupFraction).toBe("0.10");
    expect(defaultMarkupForDate("2027-06-30").markupFraction).toBe("0.20");
    expect(defaultMarkupForDate("2028-06-30").markupFraction).toBe("0.30");
    expect(defaultMarkupForDate("2035-06-30").markupFraction).toBe("0.30");
  });

  it("looks up only effective official certificate prices and fails closed when one is absent", () => {
    expect(lookupCertificatePrice("2026-02-01")).toMatchObject({
      publishedAt: "2026-04-07",
      price: { canonicalValue: "75.36" },
    });
    expect(lookupCertificatePrice("2026-06-30")).toMatchObject({
      publishedAt: "2026-07-06",
      price: { canonicalValue: "75.28" },
    });
    expect(lookupCertificatePrice("2026-07-01")).toBeUndefined();
    expect(() => requireCertificatePrice("2026-07-01")).toThrow(/proxy fallback is prohibited/);
  });

  it("blocks an actual-value label without a satisfactory, in-scope accredited report", () => {
    expect(evaluateActualValueVerification(undefined, "CRUDE_STEEL", { start: "2026-01-01", end: "2026-12-31" }).verified).toBe(false);
    expect(evaluateActualValueVerification(verification(), "CRUDE_STEEL", { start: "2026-01-01", end: "2026-12-31" })).toEqual({
      verified: true,
      blockers: [],
    });
    expect(evaluateActualValueVerification(verification("UNWROUGHT_ALUMINIUM"), "CRUDE_STEEL", { start: "2026-01-01", end: "2026-12-31" }).verified).toBe(false);
    expect(
      evaluateActualValueVerification(
        { ...verification(), verificationReportIssuedAt: "2026-02-30" },
        "CRUDE_STEEL",
        { start: "2026-01-01", end: "2026-12-31" },
      ).verified,
    ).toBe(false);
  });
});

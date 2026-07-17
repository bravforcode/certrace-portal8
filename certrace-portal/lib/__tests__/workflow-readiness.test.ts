import { afterEach, describe, expect, it, vi } from "vitest";

import { PRODUCT_CATALOG, getCatalogProduct } from "../config";
import {
  actualValueVerificationBlockers,
  confirmReportSignoff,
  loadExporterState,
  markPackageGenerated,
  requestReportSignoffs,
  saveExporterState,
  setO3ciChecklistItem,
  type ReviewSubmission,
} from "../exporter-review";
import { REGULATORY_DATA_VERSION, classifyCnCode } from "../mrv";
import { createDefaultPlantMrvPayload, serializePlantMrvPayload } from "../plant-mrv";
import { serializePrecursors, type PrecursorRow } from "../precursors";
import { verificationRequired, type SupplierRequest } from "../supplier";
import { runQualityCheck } from "../ai-check";
import { buildWorkflowMrvReport } from "../workflow-mrv-report";
import {
  embeddedEmissionsCalculation,
  formatDecimal,
  goodsMass,
  reportedEmissionsPerTonne,
} from "../workflow-measurements";

const product = getCatalogProduct("hrc")!;

function precursor(overrides: Partial<PrecursorRow>): PrecursorRow {
  return {
    name: "Precursor",
    cn: "72071190",
    qty: "1",
    qtyUnit: "TNE_PER_TNE",
    see: "1",
    seeUnit: "TCO2E_PER_TNE",
    route: "BF-BOF",
    method: "default",
    defaultValueBasis: "published_includes_markup",
    verificationReference: "",
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
    ...overrides,
  };
}

function request(): SupplierRequest {
  return {
    token: "token",
    declId: "decl",
    supplierId: "supplier",
    supplierName: "Supplier",
    supplierRef: "#1",
    supplierCountry: "TH",
    critical: false,
    exporterName: "Exporter",
    exporterContact: "Contact",
    regulationId: "cbam",
    regulationShort: "CBAM",
    regulationFull: "Carbon Border Adjustment Mechanism",
    authority: "EU-side declarant",
    originName: "Thailand",
    originFactorSet: "test",
    destinationName: "European Union",
    period: "Annual 2026",
    deadline: "31 Jan 2027",
    dueInDays: 1,
    noteToSuppliers: "test",
    sectorWord: "steel",
    products: [{ product, lots: [], commercialQuantityTonnes: "1" }],
    fields: [],
    documents: [],
  };
}

function baseProductValues(method: "actual" | "default" = "default"): Record<string, string> {
  const route = classifyCnCode(product.cnCode)!.productionRoutes[0];
  return {
    "inst-name": "Test plant",
    "inst-country": "TH",
    "inst-address": "Rayong",
    "inst-coords": "12.68,101.28",
    [`${product.id}::process-route`]: route,
    [`${product.id}::installation-reference`]: "primary",
    [`${product.id}::monitoring-plan-id`]: "MP-2026-1",
    [`${product.id}::monitoring-plan-version`]: "1.0",
    [`${product.id}::system-boundary`]: "EAF and rolling boundary",
    [`${product.id}::excluded-activities`]: "None",
    [`${product.id}::data-gap-methodology`]: "No data gaps",
    [`${product.id}::control-activities`]: "Monthly reconciliation",
    [`${product.id}::production-activity`]: "10",
    [`${product.id}::direct-emissions`]: "1",
    [`${product.id}::indirect-emissions`]: "0",
    [`${product.id}::method`]: method,
    [`${product.id}::emissions-method`]: "STANDARD_CALCULATION",
    [`${product.id}::default-value-reference`]: method === "default" ? "EU default dataset row 1" : "",
    [`${product.id}::precursors`]: serializePrecursors([precursor({ qty: "0.1", see: "1" })]),
  };
}

describe("active workflow exact-decimal bridge", () => {
  it("preserves entered mass and exact canonical conversion metadata", () => {
    expect(goodsMass("1234.500", "KGM")).toEqual({
      enteredValue: "1234.500",
      enteredUnit: "KGM",
      canonicalValue: "1.2345",
      canonicalUnit: "TNE",
      conversionRule: "KGM × 0.001 = TNE",
      precision: { enteredDecimalPlaces: 3, canonicalDecimalPlaces: 4, rounding: "NONE_EXACT" },
      measurementSpecId: "goods-mass",
      regulatoryDataVersion: REGULATORY_DATA_VERSION,
    });
    expect(formatDecimal("1234567890.00050")).toBe("1,234,567,890.0005");
  });

  it("uses mixed precursor methods, marks only an unmarked base, and excludes Annex-II indirect emissions", () => {
    const rows = serializePrecursors([
      precursor({ name: "Actual billet", qty: "0.5", see: "2", method: "actual", verificationReference: "VR-1" }),
      precursor({ name: "Published default", qty: "0.25", see: "4" }),
      precursor({ name: "Unmarked kg input", qty: "100", qtyUnit: "KGM_PER_TNE", see: "10", defaultValueBasis: "unmarked_base" }),
    ]);
    const result = embeddedEmissionsCalculation({
      product,
      direct: "0.1",
      indirect: "0.9",
      precursors: rows,
      reportingPeriod: "Annual 2026",
    });

    expect(result?.value).toBe("3.2");
    expect(reportedEmissionsPerTonne({ direct: "0.1", indirect: "0.9", precursors: rows, reportingPeriod: "Annual 2026" })).toBe("4.1");
    expect(result?.traces.map((trace) => trace.method)).toEqual([
      "DIRECT_INDIRECT_TREATMENT",
      "PRECURSOR_MIX",
      "COMPLEX_GOODS",
    ]);
    expect(result?.traces[1]?.warnings.some((warning) => warning.code.startsWith("ACTUAL_VALUE_NOT_VERIFIED"))).toBe(true);
    expect(result?.traces.every((trace) => trace.authoritative && trace.regulatoryDataVersion === REGULATORY_DATA_VERSION)).toBe(true);
  });

  it("keeps every product shortcut behind the effective CN classifier", () => {
    for (const shortcut of PRODUCT_CATALOG) {
      expect(getCatalogProduct(shortcut.id)).toBe(shortcut);
      expect(classifyCnCode(shortcut.cnCode)).toBeDefined();
    }
    expect(getCatalogProduct("unknown-product")).toBeUndefined();
  });
});

describe("actual precursor verification and dataset-bound confirmations", () => {
  const memory = new Map<string, string>();

  afterEach(() => {
    memory.clear();
    vi.unstubAllGlobals();
  });

  it("requires verification when a default final good contains an actual precursor", () => {
    const req = request();
    const values = {
      [`${product.id}::method`]: "default",
      [`${product.id}::precursors`]: serializePrecursors([
        precursor({ method: "actual", verificationReference: "" }),
      ]),
    };
    expect(verificationRequired(req, values)).toBe(true);

    const blockers = actualValueVerificationBlockers([{
      supplier: { id: "supplier", name: "Supplier" },
      request: req,
      values,
      docs: {},
    } as unknown as ReviewSubmission]);
    expect(blockers).toEqual(expect.arrayContaining([
      expect.stringContaining("accredited verifier reference is missing"),
      expect.stringContaining("actual precursor"),
    ]));
  });

  it("invalidates confirmations and handoff notes when the approved dataset hash changes", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => memory.set(key, value),
        removeItem: (key: string) => memory.delete(key),
      },
    });

    saveExporterState(loadExporterState("decl"));
    markPackageGenerated("decl", "hash-a");
    requestReportSignoffs("decl", ["esg"]);
    confirmReportSignoff("decl", "esg");
    setO3ciChecklistItem("decl", "operator_account", true);

    expect(loadExporterState("decl").signoffs[0]?.packageHash).toBe("hash-a");
    expect(markPackageGenerated("decl", "hash-a").signoffs).toHaveLength(1);

    const changed = markPackageGenerated("decl", "hash-b");
    expect(changed.signoffs).toEqual([]);
    expect(changed.dispatch.worksheetDownloadedAt).toBeNull();
    expect(Object.values(changed.dispatch.checklist).every((value) => value === false)).toBe(true);
  });
});

describe("active plant MRV and report-draft assembly", () => {
  it("assembles a versioned report draft from the supplier workflow without treating shipment mass as production", () => {
    const result = buildWorkflowMrvReport(request(), baseProductValues(), null);
    expect(result.assemblyBlockers).toEqual([]);
    expect(result.draft?.productionProcesses[0]?.activityLevel.canonicalValue).toBe("10");
    expect(result.draft?.productionProcesses[0]?.determinationMethod).toBe("DEFAULT");
    expect(result.draft?.monitoringPlans[0]?.id).toContain("MP-2026-1");
    expect(result.draft?.blockers).toContainEqual(expect.stringContaining("Evidence file bytes"));
    expect(result.draft?.fixtureReviewStatus).toBe("PENDING_ESG_SPECIALIST_REVIEW");
  });

  it("accepts exact active plant traces and rejects a tampered aggregate", () => {
    const payload = createDefaultPlantMrvPayload("STANDARD_CALCULATION");
    payload.standardCalculationSourceStreams[0] = {
      ...payload.standardCalculationSourceStreams[0]!,
      name: "Electrode carbon",
      materialOrFuel: "Carbon",
      activityData: { value: "20", unit: "TNE" },
      emissionFactor: { value: "0.5", unit: "TCO2E_PER_TNE" },
      evidenceReferences: ["meter-1", "factor-1"],
    };
    const values = {
      ...baseProductValues("actual"),
      [`${product.id}::plant-mrv`]: serializePlantMrvPayload(payload),
    };
    const valid = runQualityCheck(request(), values, {});
    expect(valid.findings.some((finding) => finding.fieldId === "plant-mrv" && finding.severity === "critical")).toBe(false);

    const tampered = runQualityCheck(request(), { ...values, [`${product.id}::direct-emissions`]: "2" }, {});
    expect(tampered.findings).toContainEqual(expect.objectContaining({
      fieldId: "plant-mrv",
      severity: "critical",
      title: expect.stringContaining("Aggregate emissions do not match"),
    }));
  });
});

import { describe, expect, it } from "vitest";

import {
  calculateStandardSourceStreamEmissions,
  classifyCnCode,
  createMrvReportDraft,
  measuredValue,
  MEASUREMENT_SPECS,
  REGULATORY_DATA_VERSION,
  type MonitoringPlan,
  type MrvReportDraftInput,
  type PrecursorInput,
  type ProductionProcess,
  type SourceStream,
  type VerificationReference,
} from "..";

const activity = measuredValue(MEASUREMENT_SPECS.goodsMass, "10", "TNE");
const factor = measuredValue(MEASUREMENT_SPECS.specificEmissions, "2", "TCO2E_PER_TNE");
const calculated = calculateStandardSourceStreamEmissions({
  traceId: "calc-1",
  activityData: activity,
  emissionFactor: factor,
  evidenceReferences: ["factor-evidence"],
});

const plan: MonitoringPlan = {
  id: "plan-1",
  version: "1.0",
  status: "OPERATOR_APPROVED",
  reportingPeriod: { start: "2026-01-01", end: "2026-12-31", calendarYear: 2026 },
  installationBoundary: {
    installationId: "installation-1",
    installationName: "Plant 1",
    countryCode: "TH",
    address: "Rayong",
    includedProcessIds: ["process-1"],
    excludedActivities: [],
    boundaryEvidenceReferences: ["boundary-evidence"],
  },
  processIds: ["process-1"],
  sourceStreamIds: ["stream-1"],
  emissionSourceIds: [],
  energyFlowIds: [],
  dataGapMethodology: "No data gaps in fixture",
  controlActivities: ["Monthly meter reconciliation"],
  evidenceReferences: ["plan-evidence"],
  regulatoryDataVersion: REGULATORY_DATA_VERSION,
};

const process: ProductionProcess = {
  id: "process-1",
  installationId: "installation-1",
  name: "EAF steelmaking",
  route: "SCRAP_EAF",
  aggregatedGoodsCategory: "CRUDE_STEEL",
  cnCodes: ["72071190"],
  systemBoundaryDescription: "EAF process boundary",
  activityLevel: activity,
  determinationMethod: "ACTUAL",
  verificationReferenceIds: [],
  outputProductIds: ["steel-output"],
  sourceStreamIds: ["stream-1"],
  emissionSourceIds: [],
  energyFlowIds: [],
  precursorInputIds: [],
  evidenceReferences: ["process-evidence"],
  regulatoryDataVersion: REGULATORY_DATA_VERSION,
};

const stream: SourceStream = {
  id: "stream-1",
  installationId: "installation-1",
  processId: "process-1",
  name: "Carbon-bearing input",
  materialOrFuel: "Electrode carbon",
  methodology: "STANDARD_CALCULATION",
  activityData: activity,
  calculationFactorReferences: ["factor-evidence"],
  evidenceReferences: ["meter-evidence"],
  regulatoryDataVersion: REGULATORY_DATA_VERSION,
};

function input(): MrvReportDraftInput {
  return {
    id: "report-1",
    monitoringPlans: [plan],
    productionProcesses: [process],
    sourceStreams: [stream],
    emissionSources: [],
    energyFlows: [],
    precursorInputs: [],
    calculations: [calculated.trace],
    verificationReferences: [],
    evidenceReferences: ["plan-evidence", "factor-evidence"],
  };
}

describe("versioned MRV report draft assembly", () => {
  it("closes installation, process, source-stream and calculation references", () => {
    const report = createMrvReportDraft(input());
    expect(report.status).toBe("DRAFT_CALCULATION_PREVIEW");
    expect(report.monitoringPlans).toHaveLength(1);
    expect(report.calculations[0]).toMatchObject({
      formula: "E = activityData × emissionFactor × oxidationFactor × conversionFactor",
      authoritative: true,
      regulatoryDataVersion: REGULATORY_DATA_VERSION,
    });
    expect(report.verificationState).toBe("BLOCKED");
    expect(report.blockers.join(" ")).toMatch(/accredited verifier report is required/i);
    expect(report.fixtureReviewStatus).toBe("PENDING_ESG_SPECIALIST_REVIEW");
  });

  it("fails closed on a broken process reference", () => {
    const broken = input();
    broken.monitoringPlans = [{ ...plan, processIds: ["unknown-process"] }];
    expect(() => createMrvReportDraft(broken)).toThrow(/unknown id unknown-process/);
  });

  it("fails closed on a broken precursor reference", () => {
    const broken = input();
    broken.productionProcesses = [{ ...process, precursorInputIds: ["unknown-precursor"] }];
    expect(() => createMrvReportDraft(broken)).toThrow(/unknown id unknown-precursor/);
  });

  it("blocks an actual precursor without an accredited verification record", () => {
    const classified = classifyCnCode("72071190")!;
    const actual: PrecursorInput = {
      id: "precursor-1",
      processId: "process-1",
      precursorCnCode: classified.cnCode,
      precursorCategory: classified.aggregatedGoodsCategory,
      quantityConsumed: measuredValue(MEASUREMENT_SPECS.goodsMass, "1", "TNE"),
      determinationMethod: "ACTUAL",
      actualSpecificEmbeddedEmissions: factor,
      evidenceReferences: [],
      regulatoryDataVersion: REGULATORY_DATA_VERSION,
    };
    const actualInput = input();
    actualInput.precursorInputs = [actual];
    actualInput.productionProcesses = [{ ...process, precursorInputIds: [actual.id] }];
    const report = createMrvReportDraft(actualInput);
    expect(report.verificationState).toBe("BLOCKED");
    expect(report.blockers.join(" ")).toMatch(/accredited verifier report is required/i);
  });

  it("accepts an accredited report covering an actual own-process calculation", () => {
    const verification: VerificationReference = {
      id: "verification-2026",
      verifierLegalName: "Accredited Verifier Ltd",
      accreditationBody: "National Accreditation Body",
      accreditationIdentifier: "ACC-CBAM-001",
      accreditationValidFrom: "2026-01-01",
      accreditationValidTo: "2027-12-31",
      sectorScopes: ["CRUDE_STEEL"],
      verificationReportReference: "VR-2026-001",
      verificationReportIssuedAt: "2027-03-01",
      reportingPeriodStart: "2026-01-01",
      reportingPeriodEnd: "2026-12-31",
      opinion: "SATISFACTORY",
      evidenceReferences: ["verifier-report"],
    };
    const verifiedInput = input();
    verifiedInput.productionProcesses = [{ ...process, verificationReferenceIds: [verification.id] }];
    verifiedInput.verificationReferences = [verification];
    const report = createMrvReportDraft(verifiedInput);
    expect(report.verificationState).toBe("VERIFIED");
    expect(report.blockers).toEqual([]);
  });
});

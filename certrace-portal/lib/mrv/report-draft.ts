import { MrvValidationError } from "./decimal";
import { evaluateActualValueVerification } from "./compliance";
import { REGULATORY_DATA_VERSION } from "./measurements";
import type {
  CalculationTrace,
  EmissionSource,
  EnergyFlow,
  EvidenceReferenceId,
  MonitoringPlan,
  MrvReportDraft,
  PrecursorInput,
  ProductionProcess,
  SourceStream,
  VerificationReference,
} from "./types";

export interface MrvReportDraftInput {
  id: string;
  monitoringPlans: readonly MonitoringPlan[];
  productionProcesses: readonly ProductionProcess[];
  sourceStreams: readonly SourceStream[];
  emissionSources: readonly EmissionSource[];
  energyFlows: readonly EnergyFlow[];
  precursorInputs: readonly PrecursorInput[];
  calculations: readonly CalculationTrace[];
  verificationReferences: readonly VerificationReference[];
  evidenceReferences: readonly EvidenceReferenceId[];
  blockers?: readonly string[];
}

function uniqueIds(kind: string, records: readonly { id: string }[]): Set<string> {
  const ids = new Set<string>();
  for (const record of records) {
    if (!record.id.trim()) throw new MrvValidationError("ID_REQUIRED", `${kind} id is required`);
    if (ids.has(record.id)) throw new MrvValidationError("DUPLICATE_ID", `Duplicate ${kind} id ${record.id}`);
    ids.add(record.id);
  }
  return ids;
}

function requireReference(ids: Set<string>, id: string, label: string): void {
  if (!ids.has(id)) throw new MrvValidationError("BROKEN_REFERENCE", `${label} references unknown id ${id}`);
}

function requireCurrentVersion(records: readonly { id: string; regulatoryDataVersion: string }[]): void {
  for (const record of records) {
    if (record.regulatoryDataVersion !== REGULATORY_DATA_VERSION) {
      throw new MrvValidationError("REGULATORY_VERSION_MISMATCH", `${record.id} uses ${record.regulatoryDataVersion}`);
    }
  }
}

/**
 * Creates a structurally closed draft: every installation/process/source link
 * is checked, every calculation is authoritative and versioned, and all actual
 * process and precursor values pass through the accredited-verifier gate.
 */
export function createMrvReportDraft(input: MrvReportDraftInput): MrvReportDraft {
  if (!input.id.trim()) throw new MrvValidationError("REPORT_ID_REQUIRED", "MRV report draft id is required");
  if (input.monitoringPlans.length === 0) {
    throw new MrvValidationError("MONITORING_PLAN_REQUIRED", "At least one installation monitoring plan is required");
  }

  uniqueIds("monitoring plan", input.monitoringPlans);
  const installationIds = uniqueIds(
    "installation boundary",
    input.monitoringPlans.map((plan) => ({ id: plan.installationBoundary.installationId })),
  );
  const processIds = uniqueIds("production process", input.productionProcesses);
  const streamIds = uniqueIds("source stream", input.sourceStreams);
  const emissionSourceIds = uniqueIds("emission source", input.emissionSources);
  const energyFlowIds = uniqueIds("energy flow", input.energyFlows);
  const precursorIds = uniqueIds("precursor input", input.precursorInputs);
  uniqueIds("calculation trace", input.calculations);
  const verificationReferenceIds = uniqueIds("verification reference", input.verificationReferences);
  const verificationById = new Map(input.verificationReferences.map((reference) => [reference.id, reference]));
  requireCurrentVersion(input.productionProcesses);
  requireCurrentVersion(input.sourceStreams);
  requireCurrentVersion(input.emissionSources);
  requireCurrentVersion(input.energyFlows);
  requireCurrentVersion(input.precursorInputs);

  const firstPeriod = input.monitoringPlans[0].reportingPeriod;
  for (const plan of input.monitoringPlans) {
    if (plan.regulatoryDataVersion !== REGULATORY_DATA_VERSION) {
      throw new MrvValidationError("REGULATORY_VERSION_MISMATCH", `${plan.id} uses ${plan.regulatoryDataVersion}`);
    }
    if (
      plan.reportingPeriod.start !== firstPeriod.start ||
      plan.reportingPeriod.end !== firstPeriod.end ||
      plan.reportingPeriod.calendarYear !== firstPeriod.calendarYear
    ) {
      throw new MrvValidationError("REPORTING_PERIOD_MISMATCH", "All installation plans must cover the same reporting period");
    }
    for (const id of plan.processIds) requireReference(processIds, id, plan.id);
    for (const id of plan.sourceStreamIds) requireReference(streamIds, id, plan.id);
    for (const id of plan.emissionSourceIds) requireReference(emissionSourceIds, id, plan.id);
    for (const id of plan.energyFlowIds) requireReference(energyFlowIds, id, plan.id);
    for (const id of plan.installationBoundary.includedProcessIds) requireReference(processIds, id, `${plan.id}.installationBoundary`);
  }

  const planByInstallation = new Map(input.monitoringPlans.map((plan) => [plan.installationBoundary.installationId, plan]));
  const processById = new Map(input.productionProcesses.map((process) => [process.id, process]));
  for (const process of input.productionProcesses) {
    requireReference(installationIds, process.installationId, process.id);
    if (process.activityLevel.canonicalUnit !== "TNE") {
      throw new MrvValidationError("UNIT_MISMATCH", `${process.id}.activityLevel must use canonical TNE`);
    }
    const plan = planByInstallation.get(process.installationId)!;
    if (!plan.processIds.includes(process.id)) {
      throw new MrvValidationError("BROKEN_REFERENCE", `${process.id} is not included by monitoring plan ${plan.id}`);
    }
    for (const id of process.sourceStreamIds) requireReference(streamIds, id, process.id);
    for (const id of process.emissionSourceIds) requireReference(emissionSourceIds, id, process.id);
    for (const id of process.energyFlowIds) requireReference(energyFlowIds, id, process.id);
    for (const id of process.precursorInputIds) requireReference(precursorIds, id, process.id);
    for (const id of process.verificationReferenceIds) requireReference(verificationReferenceIds, id, process.id);
  }
  for (const stream of input.sourceStreams) {
    requireReference(installationIds, stream.installationId, stream.id);
    requireReference(processIds, stream.processId, stream.id);
    if (!processById.get(stream.processId)!.sourceStreamIds.includes(stream.id) || !planByInstallation.get(stream.installationId)!.sourceStreamIds.includes(stream.id)) {
      throw new MrvValidationError("ORPHAN_RECORD", `${stream.id} is not included by its production process and monitoring plan`);
    }
  }
  for (const source of input.emissionSources) {
    requireReference(installationIds, source.installationId, source.id);
    requireReference(processIds, source.processId, source.id);
    if (!processById.get(source.processId)!.emissionSourceIds.includes(source.id) || !planByInstallation.get(source.installationId)!.emissionSourceIds.includes(source.id)) {
      throw new MrvValidationError("ORPHAN_RECORD", `${source.id} is not included by its production process and monitoring plan`);
    }
  }
  for (const flow of input.energyFlows) {
    requireReference(installationIds, flow.installationId, flow.id);
    requireReference(processIds, flow.processId, flow.id);
    if (!processById.get(flow.processId)!.energyFlowIds.includes(flow.id) || !planByInstallation.get(flow.installationId)!.energyFlowIds.includes(flow.id)) {
      throw new MrvValidationError("ORPHAN_RECORD", `${flow.id} is not included by its production process and monitoring plan`);
    }
    // Transfer counterparties may be outside the reporting operator's plans;
    // their identifiers remain explicit trace inputs rather than local refs.
  }
  for (const precursor of input.precursorInputs) {
    requireReference(processIds, precursor.processId, precursor.id);
    if (!processById.get(precursor.processId)!.precursorInputIds.includes(precursor.id)) {
      throw new MrvValidationError("ORPHAN_RECORD", `${precursor.id} is not included by production process ${precursor.processId}`);
    }
  }

  for (const trace of input.calculations) {
    if (!trace.authoritative) throw new MrvValidationError("NON_AUTHORITATIVE_TRACE", `${trace.id} is not authoritative`);
    if (!trace.formula.trim() || trace.regulatoryDataVersion !== REGULATORY_DATA_VERSION) {
      throw new MrvValidationError("INVALID_TRACE", `${trace.id} lacks a formula or current regulatory-data version`);
    }
  }

  const blockers = [...(input.blockers ?? [])];
  let actualCount = 0;
  let verifiedActualCount = 0;
  for (const process of input.productionProcesses.filter((candidate) => candidate.determinationMethod === "ACTUAL")) {
    actualCount += 1;
    const results = process.verificationReferenceIds.map((id) =>
      evaluateActualValueVerification(
        verificationById.get(id),
        process.aggregatedGoodsCategory,
        { start: firstPeriod.start, end: firstPeriod.end },
      ),
    );
    const verified = results.find((result) => result.verified);
    if (verified) {
      verifiedActualCount += 1;
    } else if (results.length === 0) {
      const missing = evaluateActualValueVerification(
        undefined,
        process.aggregatedGoodsCategory,
        { start: firstPeriod.start, end: firstPeriod.end },
      );
      blockers.push(`${process.id}: ${missing.blockers.join("; ")}`);
    } else {
      blockers.push(`${process.id}: ${[...new Set(results.flatMap((result) => result.blockers))].join("; ")}`);
    }
  }
  for (const precursor of input.precursorInputs.filter((candidate) => candidate.determinationMethod === "ACTUAL")) {
    actualCount += 1;
    const result = evaluateActualValueVerification(
      precursor.verificationReference,
      precursor.precursorCategory,
      { start: firstPeriod.start, end: firstPeriod.end },
    );
    if (result.verified) verifiedActualCount += 1;
    else blockers.push(`${precursor.id}: ${result.blockers.join("; ")}`);
  }
  for (const trace of input.calculations) {
    blockers.push(...trace.warnings.filter((warning) => warning.severity === "BLOCKER").map((warning) => `${trace.id}: ${warning.message}`));
  }

  return {
    id: input.id,
    status: "DRAFT_CALCULATION_PREVIEW",
    reportingPeriod: firstPeriod,
    monitoringPlans: input.monitoringPlans,
    productionProcesses: input.productionProcesses,
    sourceStreams: input.sourceStreams,
    emissionSources: input.emissionSources,
    energyFlows: input.energyFlows,
    precursorInputs: input.precursorInputs,
    calculations: input.calculations,
    verificationReferences: input.verificationReferences,
    verificationState: blockers.length > 0
      ? "BLOCKED"
      : actualCount > 0 && verifiedActualCount === actualCount
        ? "VERIFIED"
        : "NOT_SUBMITTED",
    blockers,
    evidenceReferences: input.evidenceReferences,
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
    fixtureReviewStatus: "PENDING_ESG_SPECIALIST_REVIEW",
  };
}

import { accountStorage } from "./account-storage";
import { calculateInstallationReport } from "./report-calculations";
import {
  readReportInputs,
  reportRows,
  reportScope,
  type ReportInputs,
} from "./report-inputs";
import { monthsForWorkspace } from "./monthly-data";
import { listSuppliers } from "./precursor-suppliers";
import { listEvidence } from "./workspace-evidence";
import { loadDraft, mmdIssues } from "./workspace-mmd";
import { initialInputPlan, inputPlanIssues } from "./verification-inputs";
import { getInstallation, missingFields } from "./installations";
import type { VerificationWorkspace } from "./workspace";
export function buildReportDataset(ws: VerificationWorkspace) {
  const all = readReportInputs();
  const scopes: ReportInputs = {};
  for (const [scope, value] of Object.entries(all))
    if (scope.startsWith(`${ws.id}:`) || scope === reportScope(ws, "0.4"))
      scopes[scope] = value;
  const mmd = loadDraft(ws.id, ws.periodStart, ws.periodEnd);
  const months = monthsForWorkspace(ws).filter(
    (m) =>
      m.month >= ws.periodStart.slice(0, 7) &&
      m.month <= ws.periodEnd.slice(0, 7),
  );
  const sources = listSuppliers(ws.id);
  const evidence = listEvidence(ws.id);
  const calculations = calculateInstallationReport(
    ws,
    scopes,
    months,
    sources,
    evidence,
    mmd.inputPlan,
  );
  const plan = mmd.inputPlan ?? initialInputPlan(ws);
  const installation = getInstallation(ws.installationId);
  for (const message of inputPlanIssues(plan))
    calculations.findings.push({ ref: "2.1.1", context: "annual", message });
  for (const finding of mmdIssues(mmd))
    calculations.findings.push({
      ref: "2.2.1",
      context: "annual",
      message: finding.message,
    });
  for (const message of missingFields(installation))
    calculations.findings.push({ ref: "1.1", context: "annual", message });
  const existingVersions = listReportSnapshots(ws.id);
  for (const ref of ["2.7.9", "2.7.10", "2.7.12"])
    for (const record of reportRows(scopes, ws, ref)) {
      const version = Number(record.version?.replace(/^v/i, ""));
      if (!existingVersions.some((v) => v.version === version))
        calculations.findings.push({
          ref,
          context: "annual",
          message: "Select an existing dataset snapshot version",
        });
    }
  calculations.ready = calculations.findings.length === 0;
  const allowed = new Set(
    reportRows(scopes, ws, "2.5.8")
      .filter((r) => r.access === "verifier")
      .map((r) => r.evidence),
  );
  const sharedEvidence = evidence
    .filter((e) => allowed.has(e.id))
    .map((e) => ({
      id: e.id,
      fileName: e.fileName,
      fieldKeys: e.fieldKeys,
      month: e.month,
      hash: e.fileHash,
    }));
  // No raw files or internal-only document metadata in an exported dataset.
  const reportInputs = JSON.parse(JSON.stringify(scopes)) as ReportInputs;
  for (const answers of Object.values(reportInputs))
    for (const a of Object.values(answers))
      a.rows = a.rows.filter(
        (row) => !row.values.evidence || allowed.has(row.values.evidence),
      );
  const identity = {
    operator: plan.operatorName,
    registration: plan.operatorRegistration,
    address: plan.operatorAddress,
    installation,
  };
  const OER = {
    identity,
    period: { year: ws.year, start: ws.periodStart, end: ws.periodEnd },
    productionStructure: plan.processes,
    monitoringPlan: {
      ...mmd,
      ...(mmd.diagramFileId && !allowed.has(mmd.diagramFileId)
        ? {
            diagramFileName: null,
            diagramFileId: undefined,
            diagramDataUrl: undefined,
          }
        : {}),
    },
    monthlyActivity: months,
    precursorSources: sources,
    reportInputs,
    calculations,
    evidence: sharedEvidence,
    withheldDocumentCount: evidence.length - sharedEvidence.length,
  };
  // Summary deliberately reuses computed facts rather than accepting another set of totals.
  const OSER = {
    identity,
    period: OER.period,
    productionStructure: plan.processes,
    goods: calculations.products,
    installationDirect: calculations.installationDirect,
    installationIndirect: calculations.installationIndirect,
    processes: calculations.processes,
    precursors: calculations.precursorGroups,
    dataQuality: calculations.dataQuality,
    confirmations: Object.fromEntries(
      ["2.7.3", "2.7.4", "2.7.10"].map((id) => [
        id,
        reportRows(scopes, ws, id),
      ]),
    ),
  };
  const addenda = reportRows(scopes, ws, "2.7.5").map((declarant) => ({
    declarant,
    installation: ws.installationName,
    year: ws.year,
    criteria: reportRows(scopes, ws, "2.7.6").filter(
      (r) => r.eori === declarant.eori,
    ),
    electricity: reportRows(scopes, ws, "2.7.7").filter(
      (r) => r.eori === declarant.eori,
    ),
    sentToVerifier: reportRows(scopes, ws, "2.7.8").filter(
      (r) => r.eori === declarant.eori,
    ),
  }));
  const result = {
    schemaVersion: 1,
    status: calculations.ready ? "reviewed-inputs" : "draft",
    workspaceId: ws.id,
    OER,
    OSER,
    addenda,
  };
  return JSON.parse(
    JSON.stringify(result, (key, value) =>
      /token|dataurl|localfileid|apikey/i.test(key) ? undefined : value,
    ),
  ) as typeof result;
}
export type ReportDataset = ReturnType<typeof buildReportDataset>;
export type ReportSnapshot = {
  version: number;
  createdAt: string;
  reason: string;
  fingerprint: string;
  dataset: ReportDataset;
};
const key = (id: string) => `certrace:report-snapshots:${id}`;
export function listReportSnapshots(id: string): ReportSnapshot[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(accountStorage.getItem(key(id)) ?? "[]");
}
export function datasetFingerprint(dataset: ReportDataset): string {
  // Change detection only. This is not a signature or tamper-proof audit log.
  let hash = 2166136261;
  for (const c of JSON.stringify(dataset)) {
    hash ^= c.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
export function saveReportSnapshot(
  ws: VerificationWorkspace,
  reason: string,
): ReportSnapshot {
  if (!reason.trim()) throw new Error("A version reason is required");
  const versions = listReportSnapshots(ws.id);
  const dataset = buildReportDataset(ws);
  const snapshot = {
    version: (versions.at(-1)?.version ?? 0) + 1,
    createdAt: new Date().toISOString(),
    reason: reason.trim(),
    fingerprint: datasetFingerprint(dataset),
    dataset,
  };
  accountStorage.setItem(key(ws.id), JSON.stringify([...versions, snapshot]));
  return snapshot;
}

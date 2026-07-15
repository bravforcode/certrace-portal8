/* ════════════════════════════════════════════════════════════
   EXPORTER REVIEW — the other half of the smartlink seam (flow steps 4–10)

   The supplier fills /s/<token>, deterministic checks run, and a browser-local attestation is recorded
   (steps 1–3). Everything they produce lands in localStorage under
   `certrace:supplier:<token>` (see lib/supplier-store.ts). This module is what
   the EXPORTER reads back and acts on:

     4  Submission status (Submitted / In Review) per supplier
     5  Advisory compliance summary — derived from deterministic facts
     6  Assign internal reviewers (ESG / Compliance / Legal)
     7  Approve  ·  Request Revision (specific fields + docs + comment)
     8  → writes the revision into the SUPPLIER store, so the smartlink unlocks
        exactly those fields (the exporter ↔ supplier handoff)
     9  Review the resubmission, approve
     10 Draft calculation/report preview from locally approved submissions

   "Same input, same output": a submission is read straight from the supplier's
   own state when it exists in this browser; otherwise a deterministic stand-in
   is synthesised from the SAME fixtures + config the supplier form resolves, so
   the deterministic check, score and figures match what the demo link would produce.

   The exporter's own decisions (reviewers, approvals, revision requests, package
   + filing) persist under `certrace:exporter:<declId>`. Both stores are the seam
   where a real API slots in.
   ════════════════════════════════════════════════════════════ */

import { getDeclaration, type Declaration, type SupplierRow } from "./data";
import { getOrgIdentity } from "./org";
import {
  makeToken,
  resolveRequest,
  valueKey,
  type SupplierRequest,
  type RequestDocAsk,
} from "./supplier";
import {
  loadState,
  saveState,
  pushEvent,
  type DocState,
  type Version,
  type SubmissionStatus,
  type AuditEvent,
  type SupplierProfile,
} from "./supplier-store";
import { runQualityCheck, type CheckResult } from "./ai-check";
import { addExact, embeddedEmissionsCalculation, embeddedEmissionsPerTonne, multiplyExact } from "./workflow-measurements";
import { parsePrecursors } from "./precursors";
import { classifyCnCode, decimal, decimalToString, type CalculationTrace, type MrvReportDraft } from "./mrv";
import { calculatePlantMrv } from "./plant-mrv";
import { buildWorkflowMrvReport } from "./workflow-mrv-report";

/* ── Exporter-side persisted state ─────────────────────────── */
export type ReviewDecision = "pending" | "approved" | "changes_requested";

export type SupplierReview = {
  decision: ReviewDecision;
  decidedVersion: number; // the version the decision was made against
  reviewers: string[]; // assigned internal reviewer ids (see REVIEWERS)
  comment: string; // browser-local revision note shown to the supplier demo
  unlockedFields: string[]; // value-keys reopened for the supplier
  unlockedDocs: string[]; // doc ids reopened for the supplier
  decidedAt: number | null;
};

/* Browser-local manual handoff checklist. No external action is observed. */
export type O3ciChecklistKey = "operator_account" | "installation_registered" | "values_entered" | "verifier_report_attached";
export type DispatchState = {
  worksheetDownloadedAt: number | null;
  checklist: Record<O3ciChecklistKey, boolean>;
};

/* Browser-local sign-off model. No message is sent and no trusted identity or
   signature is created. Every requested local confirmation must cover the
   current dataset before the manual handoff can be prepared. */
export type ReportSignoff = {
  memberId: string; // team-store member id
  requestedAt: number;
  confirmedAt: number | null;
  /** Dataset fingerprint the local confirmation explicitly covered. */
  packageHash: string;
};

export type ExporterDeclState = {
  schemaVersion: 2;
  dataClassification: "readiness_demo";
  legacyUnverifiedQuarantined: boolean;
  declId: string;
  reviews: Record<string, SupplierReview>; // by supplierId
  summaryGeneratedAt: number | null;
  packageGeneratedAt: number | null;
  /** fingerprint of the approved dataset the package was generated from —
      worksheet preparation is blocked when the live dataset no longer matches it */
  packageHash: string | null;
  dispatch: DispatchState;
  signoffs: ReportSignoff[];
  /** reminder timestamps per supplier, newest last — "when did we last nudge them" */
  remindersSent: Record<string, number[]>;
};

const defaultReview = (): SupplierReview => ({
  decision: "pending",
  decidedVersion: 0,
  reviewers: [],
  comment: "",
  unlockedFields: [],
  unlockedDocs: [],
  decidedAt: null,
});

const keyFor = (declId: string) => `certrace:v2:exporter:${declId}`;
const legacyKeyFor = (declId: string) => `certrace:exporter:${declId}`;
const quarantineKeyFor = (declId: string) => `certrace:legacy_unverified:exporter:${declId}`;

function quarantineLegacyExporterState(declId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const legacyKey = legacyKeyFor(declId);
    const quarantineKey = quarantineKeyFor(declId);
    const raw = window.localStorage.getItem(legacyKey);
    if (raw === null) return window.localStorage.getItem(quarantineKey) !== null;
    window.localStorage.removeItem(legacyKey);
    if (window.localStorage.getItem(quarantineKey) === null) {
      window.localStorage.setItem(
        quarantineKey,
        JSON.stringify({ classification: "legacy_unverified", quarantinedAt: Date.now(), originalKey: legacyKey, discardedBytes: raw.length, reason: "Unversioned record discarded; payload not retained." }),
      );
    }
    return true;
  } catch {
    return true;
  }
}

export function loadExporterState(declId: string): ExporterDeclState {
  const empty: ExporterDeclState = {
    schemaVersion: 2,
    dataClassification: "readiness_demo",
    legacyUnverifiedQuarantined: false,
    declId,
    reviews: {},
    summaryGeneratedAt: null,
    packageGeneratedAt: null,
    packageHash: null,
    dispatch: {
      worksheetDownloadedAt: null,
      checklist: { operator_account: false, installation_registered: false, values_entered: false, verifier_report_attached: false },
    },
    signoffs: [],
    remindersSent: {},
  };
  if (typeof window === "undefined") return empty;
  const legacyUnverifiedQuarantined = quarantineLegacyExporterState(declId);
  try {
    const raw = window.localStorage.getItem(keyFor(declId));
    if (!raw) return { ...empty, legacyUnverifiedQuarantined };
    const parsed = JSON.parse(raw) as ExporterDeclState;
    if (parsed.schemaVersion !== 2 || parsed.dataClassification !== "readiness_demo") {
      window.localStorage.removeItem(keyFor(declId));
      window.localStorage.setItem(
        quarantineKeyFor(declId),
        JSON.stringify({ classification: "legacy_unverified", quarantinedAt: Date.now(), originalKey: keyFor(declId), discardedBytes: raw.length, reason: "Invalid schema record discarded; payload not retained." }),
      );
      return { ...empty, legacyUnverifiedQuarantined: true };
    }
    return {
      ...empty,
      ...parsed,
      declId,
      legacyUnverifiedQuarantined,
      dispatch: { ...empty.dispatch, ...parsed.dispatch, checklist: { ...empty.dispatch.checklist, ...parsed.dispatch?.checklist } },
      signoffs: Array.isArray(parsed.signoffs)
        ? parsed.signoffs.filter((signoff) => typeof signoff.packageHash === "string" && signoff.packageHash === parsed.packageHash)
        : [],
    };
  } catch {
    return { ...empty, legacyUnverifiedQuarantined };
  }
}

export function saveExporterState(state: ExporterDeclState): void {
  if (typeof window === "undefined") throw new Error("Exporter state can only be persisted in the browser.");
  try {
    window.localStorage.setItem(keyFor(state.declId), JSON.stringify(state));
  } catch {
    throw new Error("Local exporter-state save failed. No readiness action was recorded.");
  }
}

/* ── Internal reviewers the exporter can assign (step 6) ───── */
export type Reviewer = { id: string; name: string; role: string; dept: string };
export const REVIEWERS: Reviewer[] = [
  { id: "esg", name: "Ananya P.", role: "ESG / Sustainability", dept: "Sustainability" },
  { id: "compliance", name: "Wasawat K.", role: "Compliance lead", dept: "Compliance" },
  { id: "legal", name: "Krit Legal Partners", role: "Legal counsel", dept: "Legal" },
  { id: "verifier", name: "TÜV SÜD", role: "Accredited verifier", dept: "Assurance" },
];
export const getReviewer = (id: string) => REVIEWERS.find((r) => r.id === id);

/* ── Lifecycle of a single submission ──────────────────────── */
export type Lifecycle = "awaiting" | "submitted" | "in_review" | "changes_requested" | "approved";

export const LIFECYCLE_META: Record<Lifecycle, { label: string; tone: "ok" | "info" | "warn" | "err" | "muted" }> = {
  awaiting: { label: "awaiting", tone: "muted" },
  submitted: { label: "submitted", tone: "info" },
  in_review: { label: "in review", tone: "info" },
  changes_requested: { label: "changes requested", tone: "warn" },
  approved: { label: "approved", tone: "ok" },
};

export type EmissionLine = {
  productId: string;
  productName: string;
  cnCode: string;
  perTonne: string;
  tonnes: string;
  total: string;
  calculationTraces: readonly CalculationTrace[];
};

export type ReviewSubmission = {
  supplier: SupplierRow;
  token: string;
  href: string;
  request: SupplierRequest;
  profile: SupplierProfile | null;
  source: "live" | "demo";
  submitted: boolean;
  version: number;
  submittedAt: number | null;
  signedBy: string | null;
  signedRole: string | null;
  supplierStatus: SubmissionStatus;
  values: Record<string, string>;
  docs: Record<string, DocState>;
  check: CheckResult | null;
  versions: Version[];
  events: AuditEvent[];
  emissions: EmissionLine[];
  totalTCO2e: string; // exact absolute embedded emissions (TCO2E)
  mrvReportDraft: MrvReportDraft | null;
  mrvAssemblyBlockers: readonly string[];
  review: SupplierReview;
  lifecycle: Lifecycle;
};

/* "2d ago" / "5h ago" / "—" → a timestamp, so demo submissions carry a real
   (relative) submit time without inventing one at module load. */
function agoToTs(updated: string): number {
  const now = Date.now();
  const m = /(\d+)\s*([dh])/.exec(updated);
  if (!m) return now - 3 * 86_400_000;
  const n = parseInt(m[1], 10);
  return now - n * (m[2] === "d" ? 86_400_000 : 3_600_000);
}

const SIGNERS = [
  { name: "Niran T.", role: "Sustainability Manager" },
  { name: "Ploy S.", role: "Carbon & Compliance Lead" },
  { name: "Anan W.", role: "ESG Manager" },
  { name: "Suda P.", role: "QA Manager" },
  { name: "Korn M.", role: "Operations Manager" },
  { name: "Wichai R.", role: "Plant Manager" },
];

/* Deterministic stand-in for a supplier who has "submitted" in the fixtures but
   never opened the smartlink in this browser. Built from the resolved request so
   the deterministic check and figures are consistent with the supplier side. */
function synthesise(request: SupplierRequest, row: SupplierRow): { values: Record<string, string>; docs: Record<string, DocState> } {
  const seed = parseInt(row.ref.replace(/\D/g, "") || "100", 10);
  const total = decimal(row.emissions ?? decimalToString(decimal("1.2").plus(decimal(String(seed % 9)).times(decimal("0.13")))));
  const useDefaultMethod = seed % 3 === 0; // some report on default factors → advisory warning
  const values: Record<string, string> = {};

  values[valueKey("inst-name")] = row.name;
  values[valueKey("inst-country")] = request.originName;
  values[valueKey("inst-address")] = `${seed} Eastern Seaboard Industrial Estate, Rayong 21150`;
  values[valueKey("inst-unlocode")] = "THRYG";
  values[valueKey("inst-coords")] = "12.6802, 101.2810";
  values[valueKey("carbon-price")] = "0";
  values[valueKey("carbon-price-currency")] = "THB";
  values[valueKey("carbon-price-form")] = "";
  values[valueKey("verification")] = "";

  for (const rp of request.products) {
    const pid = rp.product.id;
    // Exact deterministic fixture inputs; these remain unverified demo data.
    const precQty = "0.4";
    const precSee = "0.55";
    const precContribution = decimal(precQty).times(decimal(precSee));
    const candidateOwn = total.minus(precContribution);
    const own = candidateOwn.lessThan(decimal("0.2")) ? decimal("0.2") : candidateOwn;
    const direct = decimalToString(own.times(decimal("0.82")));
    const indirect = decimalToString(own.times(decimal("0.18")));
    const classified = classifyCnCode(rp.product.cnCode);
    values[valueKey("process-route", pid)] = classified?.productionRoutes[0] ?? "";
    values[valueKey("installation-reference", pid)] = "primary";
    values[valueKey("monitoring-plan-id", pid)] = `MP-${row.ref.replace(/\D/g, "")}-2026`;
    values[valueKey("monitoring-plan-version", pid)] = "1.0-fixture";
    values[valueKey("system-boundary", pid)] = "Browser-local fixture boundary; requires operator confirmation.";
    values[valueKey("excluded-activities", pid)] = "None stated in fixture.";
    values[valueKey("data-gap-methodology", pid)] = "No data gaps stated in fixture.";
    values[valueKey("control-activities", pid)] = "Monthly meter reconciliation (fixture statement).";
    values[valueKey("production-activity", pid)] = rp.commercialQuantityTonnes;
    values[valueKey("direct-emissions", pid)] = direct;
    values[valueKey("indirect-emissions", pid)] = indirect;
    values[valueKey("method", pid)] = useDefaultMethod ? "default" : "actual";
    values[valueKey("default-value-reference", pid)] = useDefaultMethod ? "Fixture default reference only — pending ESG specialist review" : "";
    values[valueKey("emissions-method", pid)] = "STANDARD_CALCULATION";
    values[valueKey("precursors", pid)] = JSON.stringify([
      {
        name: "Pig iron",
        cn: "7201 10 90",
        qty: precQty,
        qtyUnit: "TNE_PER_TNE",
        see: precSee,
        seeUnit: "TCO2E_PER_TNE",
        route: "BF route",
        method: useDefaultMethod ? "default" : "actual",
        defaultValueBasis: "published_includes_markup",
        verificationReference: "",
      },
    ]);
    values[valueKey("total-emissions", pid)] = embeddedEmissionsPerTonne({
      product: rp.product,
      direct,
      indirect,
      precursors: values[valueKey("precursors", pid)],
      reportingPeriod: request.period,
    }) ?? "0";
    values[valueKey("precursor-route", pid)] = "BF route (pig iron) · recycled (scrap)";
  }

  const docs: Record<string, DocState> = {};
  for (const d of request.documents) {
    const include = d.required || seed % 2 === 0; // optional docs only sometimes → "missing optional" in the summary
    if (include) {
      docs[d.id] = {
        id: d.id,
        status: "uploaded",
        files: [{ name: `${d.id}-${row.ref.replace("#", "")}.pdf`, size: 160_000 + (seed % 60) * 1000, addedAt: agoToTs(row.updated), storage: "metadata_only" }],
      };
    }
  }
  return { values, docs };
}

function emissionsFor(request: SupplierRequest, values: Record<string, string>): { lines: EmissionLine[]; total: string } {
  const lines: EmissionLine[] = request.products.map((rp) => {
    const plant = values[valueKey("method", rp.product.id)] === "default"
      ? null
      : calculatePlantMrv(
          values[valueKey("plant-mrv", rp.product.id)],
          values[valueKey("production-activity", rp.product.id)],
          {
            productId: rp.product.id,
            installationId: values[valueKey("installation-reference", rp.product.id)] || "unassigned-installation",
            processId: `${rp.product.id}-process`,
          },
        );
    const direct = plant?.ok ? plant.directSpecificEmissions.value : values[valueKey("direct-emissions", rp.product.id)];
    const indirect = plant?.ok ? plant.indirectSpecificEmissions.value : values[valueKey("indirect-emissions", rp.product.id)];
    const calculation = embeddedEmissionsCalculation({
      product: rp.product,
      direct,
      indirect,
      precursors: values[valueKey("precursors", rp.product.id)],
      reportingPeriod: request.period,
    });
    const perTonne = calculation?.value ?? "0";
    return {
      productId: rp.product.id,
      productName: rp.product.name,
      cnCode: rp.product.cnCode,
      perTonne,
      tonnes: rp.commercialQuantityTonnes,
      total: multiplyExact(perTonne, rp.commercialQuantityTonnes),
      calculationTraces: [...(plant?.ok ? plant.traces : []), ...(calculation?.traces ?? [])],
    };
  });
  return { lines, total: addExact(lines.map((line) => line.total)) };
}

function deriveLifecycle(submitted: boolean, review: SupplierReview, version: number, check: CheckResult | null, mrvAssemblyBlocked: boolean): Lifecycle {
  if (submitted && (mrvAssemblyBlocked || (check && (!check.passable || check.critical > 0)))) return "in_review";
  if (review.decision === "approved" && review.decidedVersion === version) return "approved";
  if (review.decision === "changes_requested") {
    // a resubmission carries a higher version than the one we sent back → it's
    // come back for re-approval ("in review"); otherwise we're still waiting on them.
    if (version > review.decidedVersion) return "in_review";
    return "changes_requested";
  }
  if (!submitted) return "awaiting";
  // First submission, not yet sent back — "submitted". Assigning reviewers is a
  // separate "shared with…" signal and does not change the status.
  return "submitted";
}

/** Resolve one supplier row into a reviewable submission (live or demo). */
export function resolveSubmission(decl: Declaration, row: SupplierRow, exporter: ExporterDeclState): ReviewSubmission {
  const token = makeToken(decl.id, row.id);
  const request = resolveRequest(token)!;
  const ss = loadState(token);
  const review = exporter.reviews[row.id] ?? defaultReview();

  let values: Record<string, string>;
  let docs: Record<string, DocState>;
  let check: CheckResult | null;
  let versions: Version[];
  let events: AuditEvent[];
  let supplierStatus: SubmissionStatus;
  let source: "live" | "demo";

  if (ss.versions.length > 0) {
    // real submission from the smartlink in this browser
    values = ss.values;
    docs = ss.docs;
    check = ss.lastCheck ?? runQualityCheck(request, values, docs, ss.profile);
    versions = ss.versions;
    events = ss.events;
    supplierStatus = ss.status;
    source = "live";
  } else if (row.status === "submitted") {
    // fixtures say submitted but nobody filled it here — deterministic stand-in
    const s = synthesise(request, row);
    values = s.values;
    docs = s.docs;
    check = runQualityCheck(request, values, docs, ss.profile);
    const signer = SIGNERS[(parseInt(row.ref.replace(/\D/g, "") || "0", 10)) % SIGNERS.length];
    const submittedAt = agoToTs(row.updated);
    versions = [{ n: 1, submittedAt, score: check.score, warnings: check.warnings, signedBy: signer.name, signedRole: signer.role }];
    events = [
      ...Object.values(s.docs).map((d, i) => ({ id: `${row.id}-doc${i}`, at: submittedAt - (Object.keys(s.docs).length - i) * 60_000, kind: "doc_upload" as const, text: `${d.files[0]?.name ?? "file"} metadata reference recorded; no bytes stored` })),
      { id: `${row.id}-check`, at: submittedAt - 5 * 60_000, kind: "check_run" as const, text: `Deterministic quality check run — score ${check.score}, ${check.critical} critical, ${check.warnings} warning${check.warnings === 1 ? "" : "s"}` },
      { id: `${row.id}-submit`, at: submittedAt, kind: "submit" as const, text: `Version 1 locally attested by ${signer.name} (${signer.role}) and recorded — score ${check.score}, ${check.warnings} warning${check.warnings === 1 ? "" : "s"}` },
    ];
    supplierStatus = "submitted";
    source = "demo";
  } else {
    // still collecting — nothing to review yet
    values = {};
    docs = {};
    check = null;
    versions = [];
    events = [];
    supplierStatus = ss.status === "revision_requested" ? "revision_requested" : "new";
    source = "demo";
  }

  const latest = versions[versions.length - 1];
  const submitted = versions.length > 0;
  const version = latest?.n ?? 0;
  const { lines, total } = emissionsFor(request, values);
  const mrvReport = buildWorkflowMrvReport(request, values, ss.profile);

  return {
    supplier: row,
    token,
    href: `/s/${token}`,
    request,
    profile: ss.profile,
    source,
    submitted,
    version,
    submittedAt: latest?.submittedAt ?? null,
    signedBy: latest?.signedBy ?? null,
    signedRole: latest?.signedRole ?? null,
    supplierStatus,
    values,
    docs,
    check,
    versions,
    events,
    emissions: lines,
    totalTCO2e: total,
    mrvReportDraft: mrvReport.draft,
    mrvAssemblyBlockers: mrvReport.assemblyBlockers,
    review,
    lifecycle: deriveLifecycle(submitted, review, version, check, mrvReport.assemblyBlockers.length > 0),
  };
}

export function resolveSubmissions(decl: Declaration, exporter: ExporterDeclState): ReviewSubmission[] {
  return decl.suppliers.map((row) => resolveSubmission(decl, row, exporter));
}

/* ── Declaration-level roll-up ─────────────────────────────── */
export type DeclStage = "collecting" | "reviewing" | "approved";
export type ReviewRollup = {
  submissions: ReviewSubmission[];
  counts: Record<Lifecycle, number>;
  total: number;
  submittedCount: number;
  approvedCount: number;
  awaitingCount: number;
  changesCount: number;
  allApproved: boolean; // every supplier submitted AND approved
  reviewedEmissions: string; // exact TCO2E across approved submissions
  submittedEmissions: string; // exact TCO2E across all submitted submissions
  warnings: number; // total warnings across submitted submissions
  anomalies: number;
  avgScore: number | null;
  stage: DeclStage;
};

export function rollup(decl: Declaration, exporter: ExporterDeclState): ReviewRollup {
  const submissions = resolveSubmissions(decl, exporter);
  const counts: Record<Lifecycle, number> = { awaiting: 0, submitted: 0, in_review: 0, changes_requested: 0, approved: 0 };
  const reviewedEmissions: string[] = [];
  const submittedEmissions: string[] = [];
  let warnings = 0;
  let anomalies = 0;
  let scoreSum = 0;
  let scoreN = 0;

  for (const s of submissions) {
    counts[s.lifecycle]++;
    if (s.submitted) {
      submittedEmissions.push(s.totalTCO2e);
      if (s.check) {
        warnings += s.check.warnings;
        anomalies += s.check.findings.filter((f) => f.category === "Anomaly" && f.severity !== "pass").length;
        scoreSum += s.check.score;
        scoreN++;
      }
    }
    if (s.lifecycle === "approved") reviewedEmissions.push(s.totalTCO2e);
  }

  const total = submissions.length;
  const submittedCount = submissions.filter((s) => s.submitted).length;
  const approvedCount = counts.approved;
  const awaitingCount = counts.awaiting;
  const allApproved = total > 0 && approvedCount === total;

  let stage: DeclStage = "collecting";
  if (allApproved) stage = "approved";
  else if (submittedCount > 0) stage = "reviewing";

  return {
    submissions,
    counts,
    total,
    submittedCount,
    approvedCount,
    awaitingCount,
    changesCount: counts.changes_requested,
    allApproved,
    reviewedEmissions: addExact(reviewedEmissions),
    submittedEmissions: addExact(submittedEmissions),
    warnings,
    anomalies,
    avgScore: scoreN ? Math.round(scoreSum / scoreN) : null,
    stage,
  };
}

/* ── Actions (mutate + persist) ────────────────────────────── */
function mutateReview(declId: string, supplierId: string, fn: (r: SupplierReview) => SupplierReview): ExporterDeclState {
  const state = loadExporterState(declId);
  const prev = state.reviews[supplierId] ?? defaultReview();
  const next: ExporterDeclState = { ...state, reviews: { ...state.reviews, [supplierId]: fn(prev) } };
  saveExporterState(next);
  return next;
}

export function toggleReviewer(declId: string, supplierId: string, reviewerId: string): ExporterDeclState {
  return mutateReview(declId, supplierId, (r) => ({
    ...r,
    reviewers: r.reviewers.includes(reviewerId) ? r.reviewers.filter((x) => x !== reviewerId) : [...r.reviewers, reviewerId],
  }));
}

export function approveSubmission(declId: string, supplierId: string, version: number): ExporterDeclState {
  const declaration = getDeclaration(declId);
  const row = declaration?.suppliers.find((supplier) => supplier.id === supplierId);
  if (!declaration || !row) throw new Error("Submission could not be resolved for approval.");
  const current = resolveSubmission(declaration, row, loadExporterState(declId));
  if (!current.submitted || current.version !== version) throw new Error("Only the current submitted version can be approved.");
  if (!current.check || !current.check.passable || current.check.critical > 0) {
    throw new Error("Critical deterministic findings must be resolved before approval.");
  }
  if (!current.mrvReportDraft || current.mrvAssemblyBlockers.length > 0) {
    throw new Error("The versioned MRV report draft must assemble without structural errors before approval.");
  }
  return mutateReview(declId, supplierId, (r) => ({
    ...r,
    decision: "approved",
    decidedVersion: version,
    decidedAt: Date.now(),
    comment: "",
    unlockedFields: [],
    unlockedDocs: [],
  }));
}

/** Step 7/8 — the handoff. Records the exporter's decision AND writes the
    revision into the supplier's own store so the smartlink reopens exactly the
    requested fields/documents (everything else stays locked). */
export function requestRevision(
  declId: string,
  supplierId: string,
  version: number,
  payload: { fields: string[]; docs: string[]; comment: string },
): ExporterDeclState {
  const token = makeToken(declId, supplierId);
  const ss = loadState(token);
  const next = pushEvent(
    { ...ss, status: "revision_requested" as const, unlocked: payload.fields, unlockedDocs: payload.docs, revisionNote: payload.comment },
    "revision_requested",
    `${exporterIdentity().contact} requested a revision on ${payload.fields.length} field${payload.fields.length === 1 ? "" : "s"}${payload.docs.length ? ` and ${payload.docs.length} document${payload.docs.length === 1 ? "" : "s"}` : ""} — "${payload.comment}"`,
  );
  if (!saveState(next)) throw new Error("Local supplier-state save failed. The revision was not recorded.");
  return mutateReview(declId, supplierId, (r) => ({
    ...r,
    decision: "changes_requested",
    decidedVersion: version,
    decidedAt: Date.now(),
    comment: payload.comment,
    unlockedFields: payload.fields,
    unlockedDocs: payload.docs,
  }));
}

export function markSummaryGenerated(declId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, summaryGeneratedAt: state.summaryGeneratedAt ?? Date.now() };
  saveExporterState(next);
  return next;
}

/** Stable fingerprint of the approved dataset — values, docs and versions per
    supplier. If this changes after generation (a resubmission, a re-approval),
    the generated package no longer matches reality and dispatch must wait for
    a regeneration. djb2 over canonical JSON is plenty for change detection. */
export function datasetHash(submissions: ReviewSubmission[]): string {
  const canonical = submissions
    .filter((s) => s.lifecycle === "approved")
    .map((s) => ({
      id: s.supplier.id,
      v: s.version,
      period: s.request.period,
      scope: s.request.products
        .map((requestProduct) => ({
          id: requestProduct.product.id,
          cn: requestProduct.product.cnCode,
          commercialQuantityTonnes: requestProduct.commercialQuantityTonnes,
          lots: requestProduct.lots.map((lot) => lot.measurement),
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
      values: Object.keys(s.values).sort().map((key) => ({ key, value: s.values[key] })),
      docs: Object.keys(s.docs)
        .sort()
        .map((k) => ({ k, files: (s.docs[k]?.files ?? []).map((f) => f.name).sort() })),
    }));
  const str = JSON.stringify(canonical);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

export function markPackageGenerated(declId: string, hash: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const datasetChanged = state.packageHash !== hash;
  // Confirmations and handoff notes apply only to the exact dataset. A changed
  // hash invalidates them rather than silently carrying approval forward.
  const next: ExporterDeclState = {
    ...state,
    packageGeneratedAt: Date.now(),
    packageHash: hash,
    signoffs: datasetChanged ? [] : state.signoffs,
    dispatch: datasetChanged
      ? {
          worksheetDownloadedAt: null,
          checklist: { operator_account: false, installation_registered: false, values_entered: false, verifier_report_attached: false },
        }
      : state.dispatch,
  };
  saveExporterState(next);
  return next;
}

/** Record a local worksheet download. This never represents a Registry push. */
export function recordWorksheetDownload(declId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, dispatch: { ...state.dispatch, worksheetDownloadedAt: Date.now() } };
  saveExporterState(next);
  return next;
}

export function setO3ciChecklistItem(declId: string, key: O3ciChecklistKey, checked: boolean): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, dispatch: { ...state.dispatch, checklist: { ...state.dispatch.checklist, [key]: checked } } };
  saveExporterState(next);
  return next;
}

/** A typed verifier name plus a local filename is not the accredited report. */
export function actualValueVerificationBlockers(submissions: ReviewSubmission[]): string[] {
  const blockers: string[] = [];
  for (const sub of submissions) {
    const actualProducts = sub.request.products.filter((rp) => sub.values[valueKey("method", rp.product.id)] === "actual");
    const actualPrecursors = sub.request.products.flatMap((requestProduct) =>
      (parsePrecursors(sub.values[valueKey("precursors", requestProduct.product.id)]) ?? [])
        .filter((row) => row.method === "actual")
        .map((row) => ({ productName: requestProduct.product.name, row })),
    );
    if (actualProducts.length === 0 && actualPrecursors.length === 0) continue;
    const verifier = sub.values[valueKey("verification")]?.trim();
    const report = sub.docs.verif;
    if (!verifier) blockers.push(`${sub.supplier.name}: accredited verifier reference is missing.`);
    for (const precursor of actualPrecursors.filter(({ row }) => !row.verificationReference.trim())) {
      blockers.push(`${sub.supplier.name}: actual precursor ${precursor.row.name || "(unnamed)"} in ${precursor.productName} has no verifier report reference.`);
    }
    if (!report || report.status !== "uploaded" || report.files.length === 0) {
      blockers.push(`${sub.supplier.name}: accredited verifier report is not referenced.`);
    } else {
      blockers.push(`${sub.supplier.name}: verifier report bytes are unavailable until secure evidence storage and malware scanning are configured.`);
    }
  }
  return blockers;
}

/** Record a reminder to a supplier who hasn't submitted — persists so the
    workspace can answer "when did we last chase them" across sessions. */
export function remindSupplier(declId: string, supplierId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = {
    ...state,
    remindersSent: { ...state.remindersSent, [supplierId]: [...(state.remindersSent[supplierId] ?? []), Date.now()] },
  };
  saveExporterState(next);
  return next;
}

export const lastReminderAt = (state: ExporterDeclState, supplierId: string): number | null => {
  const list = state.remindersSent[supplierId] ?? [];
  return list.length > 0 ? list[list.length - 1] : null;
};

/* ── Report sign-off actions ───────────────────────────────── */

/** Assign local demo reviewers. No email or identity authority is configured. */
export function requestReportSignoffs(declId: string, memberIds: string[]): ExporterDeclState {
  const state = loadExporterState(declId);
  if (!state.packageHash) throw new Error("Generate the current dataset preview before assigning confirmations.");
  const existing = new Set(state.signoffs.map((s) => s.memberId));
  const added = memberIds.filter((id) => !existing.has(id)).map((memberId) => ({ memberId, requestedAt: Date.now(), confirmedAt: null, packageHash: state.packageHash! }));
  const next = { ...state, signoffs: [...state.signoffs, ...added] };
  saveExporterState(next);
  return next;
}

/** Local demo confirmation; no email, identity authority or access grant. */
export function confirmReportSignoff(declId: string, memberId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  if (!state.packageHash) throw new Error("The current dataset has no generated preview.");
  const next = {
    ...state,
    signoffs: state.signoffs.map((s) => (s.memberId === memberId && s.packageHash === state.packageHash ? { ...s, confirmedAt: s.confirmedAt ?? Date.now() } : s)),
  };
  saveExporterState(next);
  return next;
}

/** Withdraw a pending request (a confirmed sign-off stays on the record). */
export function withdrawReportSignoff(declId: string, memberId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, signoffs: state.signoffs.filter((s) => s.memberId !== memberId || s.confirmedAt !== null) };
  saveExporterState(next);
  return next;
}

/* The exporter org / signer identity, surfaced so the package header is real.
   Resolved at CALL time from the live org profile — a Settings rename must
   reach every output, which the old module-load fixture constant never did. */
export function exporterIdentity(): { org: string; installationId: string; contact: string; role: string } {
  const o = getOrgIdentity();
  return { org: o.name, installationId: o.installationId, contact: o.contact, role: o.role };
}

/* Re-export so the workflow UI groups the read-only submitted data the same way
   the supplier questionnaire did (Installation, Goods, Emissions, …). */
export type { RequestDocAsk };

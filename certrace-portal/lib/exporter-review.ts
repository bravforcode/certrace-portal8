/* ════════════════════════════════════════════════════════════
   EXPORTER REVIEW — the other half of the smartlink seam (flow steps 4–10)

   The supplier fills /s/<token>, the AI checks it, they e-sign and submit
   (steps 1–3). Everything they produce lands in localStorage under
   `certrace:supplier:<token>` (see lib/supplier-store.ts). This module is what
   the EXPORTER reads back and acts on:

     4  Submission status (Submitted / In Review) per supplier
     5  AI Executive Summary  — derived from the same data + ai-check
     6  Assign internal reviewers (ESG / Compliance / Legal)
     7  Approve  ·  Request Revision (specific fields + docs + comment)
     8  → writes the revision into the SUPPLIER store, so the smartlink unlocks
        exactly those fields (the exporter ↔ supplier handoff)
     9  Review the resubmission, approve
     10 Audit-ready package from the approved submissions

   "Same input, same output": a submission is read straight from the supplier's
   own state when it exists in this browser; otherwise a deterministic stand-in
   is synthesised from the SAME fixtures + config the supplier form resolves, so
   the AI check, score and figures match what the smartlink would produce.

   The exporter's own decisions (reviewers, approvals, revision requests, package
   + filing) persist under `certrace:exporter:<declId>`. Both stores are the seam
   where a real API slots in.
   ════════════════════════════════════════════════════════════ */

import { type Declaration, type SupplierRow } from "./data";
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
} from "./supplier-store";
import { runQualityCheck, type CheckResult } from "./ai-check";

/* ── Exporter-side persisted state ─────────────────────────── */
export type ReviewDecision = "pending" | "approved" | "changes_requested";

export type SupplierReview = {
  decision: ReviewDecision;
  decidedVersion: number; // the version the decision was made against
  reviewers: string[]; // assigned internal reviewer ids (see REVIEWERS)
  comment: string; // revision note sent to the supplier
  unlockedFields: string[]; // value-keys reopened for the supplier
  unlockedDocs: string[]; // doc ids reopened for the supplier
  decidedAt: number | null;
};

/* Buyer & Authority Handoff (Stage 5/8) — the exporter is never the CBAM
   declarant, so "filing" here means pushing verified data into the two real
   channels a non-EU operator has: the CBAM Registry's O3CI module and the
   Annex IV Communication Template. `acknowledgedAt` tracks each recipient
   confirming receipt — the true end state, distinct from "we sent it". */
export type DispatchRecipient = "buyer" | "authority" | "verifier";
export type DispatchState = {
  o3ciPushedAt: number | null;
  templateSentAt: number | null;
  acknowledgedAt: Partial<Record<DispatchRecipient, number>>;
};

/* Report sign-off — after the package is generated the exporter sends it to
   named people (team-store members) to preview and confirm. Every requested
   confirmation must land before the declaration can be dispatched. */
export type ReportSignoff = {
  memberId: string; // team-store member id
  requestedAt: number;
  confirmedAt: number | null;
};

export type ExporterDeclState = {
  declId: string;
  reviews: Record<string, SupplierReview>; // by supplierId
  summaryGeneratedAt: number | null;
  packageGeneratedAt: number | null;
  /** fingerprint of the approved dataset the package was generated from —
      dispatch is blocked when the live dataset no longer matches it */
  packageHash: string | null;
  filedAt: number | null;
  recipients: { buyer: boolean; authority: boolean; verifier: boolean };
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

const keyFor = (declId: string) => `certrace:exporter:${declId}`;

export function loadExporterState(declId: string): ExporterDeclState {
  const empty: ExporterDeclState = {
    declId,
    reviews: {},
    summaryGeneratedAt: null,
    packageGeneratedAt: null,
    packageHash: null,
    filedAt: null,
    recipients: { buyer: true, authority: true, verifier: true },
    dispatch: { o3ciPushedAt: null, templateSentAt: null, acknowledgedAt: {} },
    signoffs: [],
    remindersSent: {},
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(keyFor(declId));
    if (!raw) return empty;
    return { ...empty, ...(JSON.parse(raw) as ExporterDeclState), declId };
  } catch {
    return empty;
  }
}

export function saveExporterState(state: ExporterDeclState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(state.declId), JSON.stringify(state));
  } catch {
    /* ignore quota */
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

export type EmissionLine = { productId: string; productName: string; cnCode: string; perTonne: number; tonnes: number; total: number };

export type ReviewSubmission = {
  supplier: SupplierRow;
  token: string;
  href: string;
  request: SupplierRequest;
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
  totalTCO2e: number; // absolute embedded emissions for this supplier (tCO₂e)
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
   the AI check and figures are consistent with the supplier side. */
function synthesise(request: SupplierRequest, row: SupplierRow): { values: Record<string, string>; docs: Record<string, DocState> } {
  const seed = parseInt(row.ref.replace(/\D/g, "") || "100", 10);
  const total = row.emissions ?? Number((1.2 + (seed % 9) * 0.13).toFixed(2));
  const useDefaultMethod = seed % 3 === 0; // some report on default factors → AI warning
  const values: Record<string, string> = {};

  values[valueKey("inst-name")] = row.name;
  values[valueKey("inst-country")] = request.originName;
  values[valueKey("inst-address")] = `${seed} Eastern Seaboard Industrial Estate, Rayong 21150`;
  values[valueKey("inst-unlocode")] = "THRYG";
  values[valueKey("inst-coords")] = "12.6802, 101.2810";
  values[valueKey("carbon-price")] = "0";
  values[valueKey("carbon-price-currency")] = "THB";
  values[valueKey("carbon-price-form")] = "";
  values[valueKey("verification")] = "SGS (Thailand) Ltd · accredited — full verification, unqualified opinion";

  for (const rp of request.products) {
    const pid = rp.product.id;
    // Own-process split + a structured precursor row; the derived total keeps
    // the same headline figure the fixtures always showed.
    const precQty = 0.4;
    const precSee = 0.55;
    const precContribution = precQty * precSee;
    const own = Math.max(0.2, total - precContribution);
    const direct = Number((own * 0.82).toFixed(2));
    const indirect = Number((own * 0.18).toFixed(2));
    values[valueKey("process-route", pid)] = "EAF (electric arc furnace)";
    values[valueKey("direct-emissions", pid)] = String(direct);
    values[valueKey("indirect-emissions", pid)] = String(indirect);
    values[valueKey("total-emissions", pid)] = (direct + indirect + precContribution).toFixed(2);
    values[valueKey("method", pid)] = useDefaultMethod ? "default" : "actual";
    values[valueKey("precursors", pid)] = JSON.stringify([
      { name: "Pig iron", cn: "7201 10 90", qty: String(precQty), see: String(precSee), route: "BF route" },
    ]);
    values[valueKey("precursor-route", pid)] = "BF route (pig iron) · recycled (scrap)";
  }

  const docs: Record<string, DocState> = {};
  for (const d of request.documents) {
    const include = d.required || seed % 2 === 0; // optional docs only sometimes → "missing optional" in the summary
    if (include) {
      docs[d.id] = { id: d.id, status: "uploaded", files: [{ name: `${d.id}-${row.ref.replace("#", "")}.pdf`, size: 160_000 + (seed % 60) * 1000, addedAt: agoToTs(row.updated) }] };
    }
  }
  return { values, docs };
}

function emissionsFor(request: SupplierRequest, values: Record<string, string>): { lines: EmissionLine[]; total: number } {
  const lines: EmissionLine[] = request.products.map((rp) => {
    const per = Number(values[valueKey("total-emissions", rp.product.id)] || values[valueKey("direct-emissions", rp.product.id)] || "0") || 0;
    return { productId: rp.product.id, productName: rp.product.name, cnCode: rp.product.cnCode, perTonne: per, tonnes: rp.totalTonnes, total: Math.round(per * rp.totalTonnes) };
  });
  return { lines, total: lines.reduce((a, l) => a + l.total, 0) };
}

function deriveLifecycle(submitted: boolean, review: SupplierReview, version: number): Lifecycle {
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
    check = ss.lastCheck ?? runQualityCheck(request, values, docs);
    versions = ss.versions;
    events = ss.events;
    supplierStatus = ss.status;
    source = "live";
  } else if (row.status === "submitted") {
    // fixtures say submitted but nobody filled it here — deterministic stand-in
    const s = synthesise(request, row);
    values = s.values;
    docs = s.docs;
    check = runQualityCheck(request, values, docs);
    const signer = SIGNERS[(parseInt(row.ref.replace(/\D/g, "") || "0", 10)) % SIGNERS.length];
    const submittedAt = agoToTs(row.updated);
    versions = [{ n: 1, submittedAt, score: check.score, warnings: check.warnings, signedBy: signer.name, signedRole: signer.role }];
    events = [
      ...Object.values(s.docs).map((d, i) => ({ id: `${row.id}-doc${i}`, at: submittedAt - (Object.keys(s.docs).length - i) * 60_000, kind: "doc_upload" as const, text: `${d.files[0]?.name ?? "file"} attached` })),
      { id: `${row.id}-check`, at: submittedAt - 5 * 60_000, kind: "check_run" as const, text: `AI quality check run — score ${check.score}, ${check.critical} critical, ${check.warnings} warning${check.warnings === 1 ? "" : "s"}` },
      { id: `${row.id}-submit`, at: submittedAt, kind: "submit" as const, text: `Version 1 signed by ${signer.name} (${signer.role}) and submitted — score ${check.score}, ${check.warnings} warning${check.warnings === 1 ? "" : "s"}` },
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

  return {
    supplier: row,
    token,
    href: `/s/${token}`,
    request,
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
    review,
    lifecycle: deriveLifecycle(submitted, review, version),
  };
}

export function resolveSubmissions(decl: Declaration, exporter: ExporterDeclState): ReviewSubmission[] {
  return decl.suppliers.map((row) => resolveSubmission(decl, row, exporter));
}

/* ── Declaration-level roll-up ─────────────────────────────── */
export type DeclStage = "collecting" | "reviewing" | "approved" | "filed";
export type ReviewRollup = {
  submissions: ReviewSubmission[];
  counts: Record<Lifecycle, number>;
  total: number;
  submittedCount: number;
  approvedCount: number;
  awaitingCount: number;
  changesCount: number;
  allApproved: boolean; // every supplier submitted AND approved
  reviewedEmissions: number; // tCO₂e across approved submissions
  submittedEmissions: number; // tCO₂e across all submitted submissions
  warnings: number; // total warnings across submitted submissions
  anomalies: number;
  avgScore: number | null;
  stage: DeclStage;
};

export function rollup(decl: Declaration, exporter: ExporterDeclState): ReviewRollup {
  const submissions = resolveSubmissions(decl, exporter);
  const counts: Record<Lifecycle, number> = { awaiting: 0, submitted: 0, in_review: 0, changes_requested: 0, approved: 0 };
  let reviewedEmissions = 0;
  let submittedEmissions = 0;
  let warnings = 0;
  let anomalies = 0;
  let scoreSum = 0;
  let scoreN = 0;

  for (const s of submissions) {
    counts[s.lifecycle]++;
    if (s.submitted) {
      submittedEmissions += s.totalTCO2e;
      if (s.check) {
        warnings += s.check.warnings;
        anomalies += s.check.findings.filter((f) => f.category === "Anomaly" && f.severity !== "pass").length;
        scoreSum += s.check.score;
        scoreN++;
      }
    }
    if (s.lifecycle === "approved") reviewedEmissions += s.totalTCO2e;
  }

  const total = submissions.length;
  const submittedCount = submissions.filter((s) => s.submitted).length;
  const approvedCount = counts.approved;
  const awaitingCount = counts.awaiting;
  const allApproved = total > 0 && approvedCount === total;

  let stage: DeclStage = "collecting";
  if (exporter.filedAt) stage = "filed";
  else if (allApproved) stage = "approved";
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
    reviewedEmissions,
    submittedEmissions,
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
  saveState(next);
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
      values: s.values,
      docs: Object.keys(s.docs)
        .sort()
        .map((k) => ({ k, files: (s.docs[k]?.files ?? []).map((f) => f.name) })),
    }));
  const str = JSON.stringify(canonical);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

export function markPackageGenerated(declId: string, hash: string): ExporterDeclState {
  const state = loadExporterState(declId);
  // Regeneration is allowed (and required) after the dataset changes — the
  // timestamp and hash always move together.
  const next = { ...state, packageGeneratedAt: Date.now(), packageHash: hash };
  saveExporterState(next);
  return next;
}

export function fileDeclaration(declId: string, recipients: { buyer: boolean; authority: boolean; verifier: boolean }): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, recipients, filedAt: state.filedAt ?? Date.now() };
  saveExporterState(next);
  return next;
}

export function setRecipients(declId: string, recipients: { buyer: boolean; authority: boolean; verifier: boolean }): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, recipients };
  saveExporterState(next);
  return next;
}

/** Push verified installation + emissions data into the CBAM Registry's O3CI
    module (Operators of Third-Country Installations) — any declarant holding
    this operator's EORI reference can then pull it in directly. */
export function pushToO3CI(declId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, dispatch: { ...state.dispatch, o3ciPushedAt: state.dispatch.o3ciPushedAt ?? Date.now() } };
  saveExporterState(next);
  return next;
}

/** Send the Annex IV-aligned CBAM Communication Template to buyers/declarants
    not using O3CI — the regulator-recognised fallback to a generic PDF. */
export function sendCommunicationTemplate(declId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, dispatch: { ...state.dispatch, templateSentAt: state.dispatch.templateSentAt ?? Date.now() } };
  saveExporterState(next);
  return next;
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

/** Send the generated report to people for preview + confirmation. Deduped —
    re-requesting someone who's already on the list is a no-op. */
export function requestReportSignoffs(declId: string, memberIds: string[]): ExporterDeclState {
  const state = loadExporterState(declId);
  const existing = new Set(state.signoffs.map((s) => s.memberId));
  const added = memberIds.filter((id) => !existing.has(id)).map((memberId) => ({ memberId, requestedAt: Date.now(), confirmedAt: null }));
  const next = { ...state, signoffs: [...state.signoffs, ...added] };
  saveExporterState(next);
  return next;
}

/** A reviewer confirming the report reads exactly as sent — demo affordance
    for what would arrive via their emailed preview link. */
export function confirmReportSignoff(declId: string, memberId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = {
    ...state,
    signoffs: state.signoffs.map((s) => (s.memberId === memberId ? { ...s, confirmedAt: s.confirmedAt ?? Date.now() } : s)),
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

/** Records a recipient confirming receipt — the real end state, since the
    exporter can never claim "filed with the authority" on someone else's behalf. */
export function acknowledgeRecipient(declId: string, recipient: DispatchRecipient): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, dispatch: { ...state.dispatch, acknowledgedAt: { ...state.dispatch.acknowledgedAt, [recipient]: Date.now() } } };
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

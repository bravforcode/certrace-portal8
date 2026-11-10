import { accountStorage } from "./account-storage";
/* ════════════════════════════════════════════════════════════
   EXPORTER REVIEW — the other half of the smartlink seam (flow steps 4–10)

   The supplier fills /s/<token>, the AI checks it, they e-sign and submit
   (steps 1–3). Link state is stored by the backend and account review data
   is held in PostgreSQL records. This module is what the exporter reads:

     4  Submission status (Submitted / In Review) per supplier
     5  AI Executive Summary  — derived from the same data + ai-check
     6  Assign internal reviewers (ESG / Compliance / Legal)
     7  Approve  ·  Request Revision (specific fields + docs + comment)
     8  → writes the revision into the SUPPLIER store, so the smartlink unlocks
        exactly those fields (the exporter ↔ supplier handoff)
     9  Review the resubmission, approve
     10 Verification-ready package from the approved submissions

   A submission needs actual link state or a saved supplier record. A status
   label alone never manufactures answers, evidence, or a signature.

   The exporter's own decisions persist under `certrace:exporter:<declId>`.
   ════════════════════════════════════════════════════════════ */

import { type Declaration, type SupplierRow } from "./data";
import { getOrgIdentity } from "./org";
import {
  makeToken,
  buildRequestFrom,
  valueKey,
  type SupplierRequest,
  type RequestDocAsk,
} from "./supplier";
import {
  loadState,
  saveState,
  pushEvent,
  type DocState,
  type SupplierState,
  type Version,
  type SubmissionStatus,
  type TrailEvent,
} from "./supplier-store";
import { runQualityCheck, type CheckResult } from "./ai-check";
import {
  assessFreshness,
  getRecord,
  readRequestFromRecord,
  restrictedSections,
  staleLevel,
  type AccessPolicy,
  type Freshness,
  type StaleVerdict,
  type SupplierRecord,
} from "./supplier-records";
import type { SectionKey } from "./supplier";

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

/* ── Multi-buyer send ───────────────────────────────────────────
   One approved dataset, many buyers. The declaration is created naming the
   buyer who triggered it (decl.buyer), but the same goods are routinely sold
   to several EU importers — each with their own Authorised CBAM Declarant,
   each needing the same Annex IV data under their own EORI. Re-running the
   whole collection for buyer #2 would be absurd, so buyers attach to the
   CONFIRMED dataset instead, and each carries its own send + acknowledgement
   clock. The first entry is seeded from decl.buyer so nothing that already
   works changes shape. */
export type DeclarationBuyerState = {
  id: string;
  name: string;
  eori: string;
  email: string;
  contact?: string;
  /** true for the buyer named when the declaration was created */
  primary: boolean;
  addedAt: number;
  templateSentAt: number | null;
  acknowledgedAt: number | null;
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
  /** every buyer this approved dataset goes to — see DeclarationBuyerState */
  buyers: DeclarationBuyerState[];
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
    buyers: [],
    signoffs: [],
    remindersSent: {},
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = accountStorage.getItem(keyFor(declId));
    if (!raw) return empty;
    // Deep-default the nested objects: a shallow spread lets a partial/legacy
    // persisted blob drop `dispatch.acknowledgedAt` or a `recipients` key, and
    // the component then does `acknowledgedAt[k]` / `Object.entries(...)` on
    // undefined. Merge each nested default under the stored value.
    const stored = JSON.parse(raw) as Partial<ExporterDeclState>;
    return {
      ...empty,
      ...stored,
      declId,
      recipients: { ...empty.recipients, ...stored.recipients },
      dispatch: { ...empty.dispatch, ...stored.dispatch },
    };
  } catch {
    return empty;
  }
}

export function saveExporterState(state: ExporterDeclState): void {
  if (typeof window === "undefined") return;
  try {
    accountStorage.setItem(keyFor(state.declId), JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

/* ── Internal reviewers the exporter can assign (step 6) ───── */
export type Reviewer = { id: string; name: string; role: string; dept: string };
export const REVIEWERS: Reviewer[] = [
  {
    id: "esg",
    name: "Ananya P.",
    role: "ESG / Sustainability",
    dept: "Sustainability",
  },
  {
    id: "compliance",
    name: "Wasawat K.",
    role: "Compliance lead",
    dept: "Compliance",
  },
  {
    id: "legal",
    name: "Krit Legal Partners",
    role: "Legal counsel",
    dept: "Legal",
  },
  {
    id: "verifier",
    name: "TÜV SÜD",
    role: "Accredited verifier",
    dept: "Assurance",
  },
];
export const getReviewer = (id: string) => REVIEWERS.find((r) => r.id === id);

/* ── Lifecycle of a single submission ──────────────────────── */
export type Lifecycle =
  | "awaiting"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved";

export const LIFECYCLE_META: Record<
  Lifecycle,
  { label: string; tone: "ok" | "info" | "warn" | "err" | "muted" }
> = {
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
  perTonne: number;
  tonnes: number;
  total: number;
};

export type ReviewSubmission = {
  supplier: SupplierRow;
  token: string;
  href: string;
  request: SupplierRequest;
  /** live = filled through this Smart Link · record = pulled from the supplier's
      own saved record (they answered it on another declaration) · demo = the
      deterministic stand-in for a fixture supplier nobody has filled here */
  source: "live" | "record" | "none";
  /** the supplier's persistent record behind this submission, when there is one */
  record: SupplierRecord | null;
  /** age + reporting-period verdict on the data in this submission */
  freshness: StaleVerdict;
  freshnessLevel: Freshness;
  /** restrictable sections this supplier has held back from onward sharing */
  restrictedForBuyer: SectionKey[];
  restrictedForVerifier: SectionKey[];
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
  events: TrailEvent[];
  emissions: EmissionLine[];
  totalTCO2e: number; // absolute embedded emissions for this supplier (tCO₂e)
  review: SupplierReview;
  lifecycle: Lifecycle;
};

function emissionsFor(
  request: SupplierRequest,
  values: Record<string, string>,
): { lines: EmissionLine[]; total: number } {
  const lines: EmissionLine[] = request.products.map((rp) => {
    const per =
      Number(
        values[valueKey("total-emissions", rp.product.id)] ||
          values[valueKey("direct-emissions", rp.product.id)] ||
          "0",
      ) || 0;
    return {
      productId: rp.product.id,
      productName: rp.product.name,
      cnCode: rp.product.cnCode,
      perTonne: per,
      tonnes: rp.totalTonnes,
      total: Math.round(per * rp.totalTonnes),
    };
  });
  return { lines, total: lines.reduce((a, l) => a + l.total, 0) };
}

function deriveLifecycle(
  submitted: boolean,
  review: SupplierReview,
  version: number,
): Lifecycle {
  if (review.decision === "approved" && review.decidedVersion === version)
    return "approved";
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

/** The live status glance from GET /declarations/{id}/submissions, keyed by
 *  supplierId. The exporter's browser may not hold a supplier's answers, but
 *  the API knows the status transition — enough to keep the dashboard current. */
export type LiveSubmission = {
  status: SubmissionStatus;
  version: number;
  updatedAt: number;
};
export type LiveStatusMap = Map<string, LiveSubmission>;

// Where a status sits in the fill-in journey, so the API's status only ever
// moves the dashboard forward (a supplier really started/submitted) and never
// back over what this browser already knows.
const STATUS_RANK: Record<SubmissionStatus, number> = {
  new: 0,
  draft: 1,
  in_check: 2,
  revision_requested: 3,
  submitted: 4,
};

/** Resolve one supplier row into a reviewable submission.
 *  `live` is the API's status glance (always cheap); `fullState` carries a
 *  supplier's real answers, injected only for the one submission the exporter
 *  has opened, so a link filled on the supplier's own machine is reviewable. */
export function resolveSubmission(
  decl: Declaration,
  row: SupplierRow,
  exporter: ExporterDeclState,
  live?: LiveStatusMap,
  fullState?: Map<string, SupplierState>,
): ReviewSubmission {
  const token = makeToken(decl.id, row.id);
  // Built from the decl in hand, not re-looked-up from fixtures: a server-backed
  // declaration is not in getDeclaration()'s bundled set, and the old
  // resolveRequest(token)! returned null for it, crashing here on mount.
  const request = buildRequestFrom(token, decl, row);
  // Server answers win when we have them (cross-browser review); otherwise the
  // local copy, exactly as before.
  const ss = fullState?.get(row.id) ?? loadState(token);
  const review = exporter.reviews[row.id] ?? defaultReview();

  let values: Record<string, string>;
  let docs: Record<string, DocState>;
  let check: CheckResult | null;
  let versions: Version[];
  let events: TrailEvent[];
  let supplierStatus: SubmissionStatus;
  let source: "live" | "record" | "none";

  /* The supplier's own record (lib/supplier-records.ts) — the durable data this
     declaration is a filtered request against. Read once, used three ways:
     as a data source when this link was never opened here, as the freshness
     reference, and as the access policy governing what travels onward. */
  const record = getRecord(request.supplierName);
  const recordRead = record ? readRequestFromRecord(request, record) : null;
  let dataAt: number | null = null;
  let dataPeriods: string[] = [];

  if (ss.versions.length > 0) {
    // real submission from the smartlink in this browser
    values = ss.values;
    docs = ss.docs;
    check = ss.lastCheck ?? runQualityCheck(request, values, docs);
    versions = ss.versions;
    events = ss.events;
    supplierStatus = ss.status;
    source = "live";
    dataAt = ss.versions[ss.versions.length - 1].submittedAt;
    dataPeriods = [request.period];
  } else if (recordRead && recordRead.carriedKeys.length > 0 && record) {
    /* Never filled through THIS link — but this company has answered these
       goods before, on another declaration. That data belongs to them, not to
       the declaration it was born in, so it answers this request too. The
       exporter still reviews and approves it; it just arrives already filled,
       carrying the age and provenance that let them judge it.

       A declaration status alone cannot supply missing answers or evidence. */
    const contribution = record.contributions[0];
    values = recordRead.values;
    docs = recordRead.docs;
    check = runQualityCheck(request, values, docs);
    const at = recordRead.sourceAt ?? record.updatedAt;
    versions = [
      {
        n: contribution?.version || 1,
        submittedAt: at,
        score: check.score,
        warnings: check.warnings,
        signedBy: record.profile?.legalName || record.company,
        signedRole: "carried from supplier record",
      },
    ];
    events = [
      {
        id: `${row.id}-record`,
        at,
        kind: "check_run",
        text: contribution
          ? `Data pulled from ${record.company}'s own record — originally reported for ${contribution.periodLabel} on "${contribution.declName}"`
          : `Data pulled from ${record.company}'s own record`,
      },
    ];
    supplierStatus = "submitted";
    source = "record";
    dataAt = at;
    dataPeriods = recordRead.sourcePeriods;
  } else {
    // still collecting — nothing to review yet
    values = {};
    docs = {};
    check = null;
    versions = [];
    events = [];
    supplierStatus =
      ss.status === "revision_requested" ? "revision_requested" : "new";
    source = "none";
  }

  const latest = versions[versions.length - 1];
  let submitted = versions.length > 0;
  let version = latest?.n ?? 0;
  let submittedAt = latest?.submittedAt ?? null;

  /* Live status from the API's submissions feed. A supplier who filled the
     Smart Link on their own machine left no copy in this browser, so `ss` is
     empty here even though they really moved. Reflect the API's status —
     draft, in_check, revision_requested or submitted — so the dashboard is
     current, but only forward (STATUS_RANK) and only when there are no local
     versions to contradict it, so a demo fixture is never regressed. */
  const liveHere = live?.get(row.id);
  if (
    liveHere &&
    versions.length === 0 &&
    STATUS_RANK[liveHere.status] > STATUS_RANK[supplierStatus]
  ) {
    supplierStatus = liveHere.status;
    if (liveHere.status === "submitted") {
      submitted = true;
      version = liveHere.version || 1;
      submittedAt = liveHere.updatedAt;
    }
  }

  const { lines, total } = emissionsFor(request, values);
  const freshness = assessFreshness(
    { sourceAt: dataAt, sourcePeriods: dataPeriods },
    request.period,
  );
  const access: AccessPolicy | undefined = record?.access;

  return {
    supplier: row,
    token,
    href: `/s/${token}`,
    request,
    source,
    record,
    freshness,
    freshnessLevel: staleLevel(freshness),
    restrictedForBuyer: restrictedSections(access, "buyer"),
    restrictedForVerifier: restrictedSections(access, "verifier"),
    submitted,
    version,
    submittedAt,
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

export function resolveSubmissions(
  decl: Declaration,
  exporter: ExporterDeclState,
  live?: LiveStatusMap,
): ReviewSubmission[] {
  return decl.suppliers.map((row) =>
    resolveSubmission(decl, row, exporter, live),
  );
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

export function rollup(
  decl: Declaration,
  exporter: ExporterDeclState,
  live?: LiveStatusMap,
): ReviewRollup {
  const submissions = resolveSubmissions(decl, exporter, live);
  const counts: Record<Lifecycle, number> = {
    awaiting: 0,
    submitted: 0,
    in_review: 0,
    changes_requested: 0,
    approved: 0,
  };
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
        anomalies += s.check.findings.filter(
          (f) => f.category === "Anomaly" && f.severity !== "pass",
        ).length;
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
function mutateReview(
  declId: string,
  supplierId: string,
  fn: (r: SupplierReview) => SupplierReview,
): ExporterDeclState {
  const state = loadExporterState(declId);
  const prev = state.reviews[supplierId] ?? defaultReview();
  const next: ExporterDeclState = {
    ...state,
    reviews: { ...state.reviews, [supplierId]: fn(prev) },
  };
  saveExporterState(next);
  return next;
}

export function toggleReviewer(
  declId: string,
  supplierId: string,
  reviewerId: string,
): ExporterDeclState {
  return mutateReview(declId, supplierId, (r) => ({
    ...r,
    reviewers: r.reviewers.includes(reviewerId)
      ? r.reviewers.filter((x) => x !== reviewerId)
      : [...r.reviewers, reviewerId],
  }));
}

export function approveSubmission(
  declId: string,
  supplierId: string,
  version: number,
): ExporterDeclState {
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

export function approveAllSubmissions(
  declaration: Declaration,
): ExporterDeclState {
  let state = loadExporterState(declaration.id);
  for (const supplier of declaration.suppliers) {
    const current = resolveSubmission(declaration, supplier, state);
    if (current.submitted && current.lifecycle !== "approved") {
      try {
        state = approveSubmission(declaration.id, supplier.id, current.version);
      } catch (err) {
        console.warn(`Could not auto-approve ${supplier.id}:`, err);
      }
    }
  }
  return state;
}

/** Step 7/8 — the handoff. Records the exporter's decision AND writes the
    revision into the supplier's own store so the smartlink reopens exactly the
    requested fields/documents (everything else stays locked). */
/** The EXPORTER's half of a revision request: their own record of the decision
    — lifecycle, comment, which items they reopened — under
    `certrace:exporter:<declId>`. The backend API does not carry the
    exporter's review state, so this half stays local in both modes.

    Split out from requestRevision below because the SUPPLIER's half does not:
    when a backend is wired up the supplier's state lives on the server, and
    writing it here would reopen the link in this browser only — see
    useRequestRevision in lib/links-query.ts. */
export function recordRevisionDecision(
  declId: string,
  supplierId: string,
  version: number,
  payload: { fields: string[]; docs: string[]; comment: string },
): ExporterDeclState {
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

/** Demo path (no backend): write BOTH halves locally. The supplier's store is
    in this same browser, so unlocking the fields here is what the smartlink
    reads back. */
export function requestRevision(
  declId: string,
  supplierId: string,
  version: number,
  payload: { fields: string[]; docs: string[]; comment: string },
): ExporterDeclState {
  const token = makeToken(declId, supplierId);
  const ss = loadState(token);
  const next = pushEvent(
    {
      ...ss,
      status: "revision_requested" as const,
      unlocked: payload.fields,
      unlockedDocs: payload.docs,
      revisionNote: payload.comment,
    },
    "revision_requested",
    `${exporterIdentity().contact} requested a revision on ${payload.fields.length} field${payload.fields.length === 1 ? "" : "s"}${payload.docs.length ? ` and ${payload.docs.length} document${payload.docs.length === 1 ? "" : "s"}` : ""} — "${payload.comment}"`,
  );
  saveState(next);
  return recordRevisionDecision(declId, supplierId, version, payload);
}

export function markSummaryGenerated(declId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = {
    ...state,
    summaryGeneratedAt: state.summaryGeneratedAt ?? Date.now(),
  };
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
        .map((k) => ({
          k,
          files: (s.docs[k]?.files ?? []).map((f) => f.name),
        })),
    }));
  const str = JSON.stringify(canonical);
  let h = 5381;
  for (let i = 0; i < str.length; i++)
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

export function markPackageGenerated(
  declId: string,
  hash: string,
): ExporterDeclState {
  const state = loadExporterState(declId);
  // Regeneration is allowed (and required) after the dataset changes — the
  // timestamp and hash always move together.
  const next = { ...state, packageGeneratedAt: Date.now(), packageHash: hash };
  saveExporterState(next);
  return next;
}

export function fileDeclaration(
  declId: string,
  recipients: { buyer: boolean; authority: boolean; verifier: boolean },
): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = { ...state, recipients, filedAt: state.filedAt ?? Date.now() };
  saveExporterState(next);
  return next;
}

export function setRecipients(
  declId: string,
  recipients: { buyer: boolean; authority: boolean; verifier: boolean },
): ExporterDeclState {
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
  const next = {
    ...state,
    dispatch: {
      ...state.dispatch,
      o3ciPushedAt: state.dispatch.o3ciPushedAt ?? Date.now(),
    },
  };
  saveExporterState(next);
  return next;
}

/** Send the Annex IV-aligned CBAM Communication Template to buyers/declarants
    not using O3CI — the regulator-recognised fallback to a generic PDF.
    Superseded by the per-buyer `sendToBuyer()` for the multi-buyer flow; kept
    as the declaration-level clock those per-buyer sends still sync into. */
export function sendCommunicationTemplate(declId: string): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = {
    ...state,
    dispatch: {
      ...state.dispatch,
      templateSentAt: state.dispatch.templateSentAt ?? Date.now(),
    },
  };
  saveExporterState(next);
  return next;
}

/* ── Buyers (multi-buyer send) ─────────────────────────────────
   The declaration's own buyer is always first in the list, resolved live from
   the declaration so a wizard-set buyer never has to be re-typed. Extra buyers
   live in exporter state alongside it. Both are the same shape from here on,
   so the send + acknowledge paths don't care which is which. */
export function resolveBuyers(
  decl: Declaration,
  state: ExporterDeclState,
): DeclarationBuyerState[] {
  const extra = (state.buyers ?? []).filter((b) => !b.primary);
  const storedPrimary = (state.buyers ?? []).find((b) => b.primary);
  if (!decl.buyer) return storedPrimary ? [storedPrimary, ...extra] : extra;
  const primary: DeclarationBuyerState = {
    id: "primary",
    name: decl.buyer.name,
    eori: decl.buyer.eori,
    email: decl.buyer.email,
    contact: decl.buyer.contact,
    primary: true,
    addedAt: storedPrimary?.addedAt ?? 0,
    // the legacy single-buyer clock IS the primary buyer's, so an old
    // declaration that already dispatched keeps showing as sent
    templateSentAt:
      storedPrimary?.templateSentAt ?? state.dispatch.templateSentAt,
    acknowledgedAt:
      storedPrimary?.acknowledgedAt ??
      state.dispatch.acknowledgedAt.buyer ??
      null,
  };
  return [primary, ...extra];
}

const newBuyerId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? `buyer-${crypto.randomUUID()}`
    : `buyer-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Attach another buyer to an already-confirmed dataset. Deduped on EORI —
    the same importer added twice is one importer. */
export function addBuyer(
  declId: string,
  buyer: { name: string; eori: string; email: string; contact?: string },
): ExporterDeclState {
  const state = loadExporterState(declId);
  const eori = buyer.eori.replace(/\s/g, "").toUpperCase();
  if ((state.buyers ?? []).some((b) => b.eori.toUpperCase() === eori))
    return state;
  const next: ExporterDeclState = {
    ...state,
    buyers: [
      ...(state.buyers ?? []),
      {
        id: newBuyerId(),
        name: buyer.name.trim(),
        eori,
        email: buyer.email.trim(),
        contact: buyer.contact?.trim() || undefined,
        primary: false,
        addedAt: Date.now(),
        templateSentAt: null,
        acknowledgedAt: null,
      },
    ],
  };
  saveExporterState(next);
  return next;
}

/** Remove an added buyer. The declaration's own buyer can't be removed here —
    that's a change to the declaration, made in the wizard. */
export function removeBuyer(
  declId: string,
  buyerId: string,
): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = {
    ...state,
    buyers: (state.buyers ?? []).filter((b) => b.id !== buyerId || b.primary),
  };
  saveExporterState(next);
  return next;
}

/** Mutate one buyer in place, materialising the primary into storage the first
    time it's touched (it lives on the declaration until then). */
function mutateBuyer(
  decl: Declaration,
  buyerId: string,
  fn: (b: DeclarationBuyerState) => DeclarationBuyerState,
): ExporterDeclState {
  const state = loadExporterState(decl.id);
  const resolved = resolveBuyers(decl, state);
  const target = resolved.find((b) => b.id === buyerId);
  if (!target) return state;
  const updated = fn(target);
  const stored = state.buyers ?? [];
  const exists = stored.some(
    (b) => b.id === buyerId || (b.primary && updated.primary),
  );
  const buyers = exists
    ? stored.map((b) =>
        b.id === buyerId || (b.primary && updated.primary) ? updated : b,
      )
    : [...stored, updated];
  const next: ExporterDeclState = {
    ...state,
    buyers,
    // keep the single-buyer dispatch clock in step with the primary buyer, so
    // every existing "has this been sent" check keeps working untouched
    dispatch: updated.primary
      ? {
          ...state.dispatch,
          templateSentAt:
            updated.templateSentAt ?? state.dispatch.templateSentAt,
          acknowledgedAt: updated.acknowledgedAt
            ? {
                ...state.dispatch.acknowledgedAt,
                buyer: updated.acknowledgedAt,
              }
            : state.dispatch.acknowledgedAt,
        }
      : state.dispatch,
  };
  saveExporterState(next);
  return next;
}

/** Send the Annex IV Communication Template to ONE buyer. */
export function sendToBuyer(
  decl: Declaration,
  buyerId: string,
): ExporterDeclState {
  return mutateBuyer(decl, buyerId, (b) => ({
    ...b,
    templateSentAt: b.templateSentAt ?? Date.now(),
  }));
}

/** That buyer's declarant confirming they received the dataset. */
export function acknowledgeBuyer(
  decl: Declaration,
  buyerId: string,
): ExporterDeclState {
  return mutateBuyer(decl, buyerId, (b) => ({
    ...b,
    acknowledgedAt: b.acknowledgedAt ?? Date.now(),
  }));
}

/** Record a reminder to a supplier who hasn't submitted — persists so the
    workspace can answer "when did we last chase them" across sessions. */
export function remindSupplier(
  declId: string,
  supplierId: string,
): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = {
    ...state,
    remindersSent: {
      ...state.remindersSent,
      [supplierId]: [...(state.remindersSent[supplierId] ?? []), Date.now()],
    },
  };
  saveExporterState(next);
  return next;
}

export const lastReminderAt = (
  state: ExporterDeclState,
  supplierId: string,
): number | null => {
  const list = state.remindersSent[supplierId] ?? [];
  return list.length > 0 ? list[list.length - 1] : null;
};

/* ── Report sign-off actions ───────────────────────────────── */

/** Send the generated report to people for preview + confirmation. Deduped —
    re-requesting someone who's already on the list is a no-op. */
export function requestReportSignoffs(
  declId: string,
  memberIds: string[],
): ExporterDeclState {
  const state = loadExporterState(declId);
  const existing = new Set(state.signoffs.map((s) => s.memberId));
  const added = memberIds
    .filter((id) => !existing.has(id))
    .map((memberId) => ({
      memberId,
      requestedAt: Date.now(),
      confirmedAt: null,
    }));
  const next = { ...state, signoffs: [...state.signoffs, ...added] };
  saveExporterState(next);
  return next;
}

/** A reviewer confirming the report reads exactly as sent — demo affordance
    for what would arrive via their emailed preview link. */
export function confirmReportSignoff(
  declId: string,
  memberId: string,
): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = {
    ...state,
    signoffs: state.signoffs.map((s) =>
      s.memberId === memberId
        ? { ...s, confirmedAt: s.confirmedAt ?? Date.now() }
        : s,
    ),
  };
  saveExporterState(next);
  return next;
}

/** Withdraw a pending request (a confirmed sign-off stays on the record). */
export function withdrawReportSignoff(
  declId: string,
  memberId: string,
): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = {
    ...state,
    signoffs: state.signoffs.filter(
      (s) => s.memberId !== memberId || s.confirmedAt !== null,
    ),
  };
  saveExporterState(next);
  return next;
}

/** Records a recipient confirming receipt — the real end state, since the
    exporter can never claim "filed with the authority" on someone else's behalf. */
export function acknowledgeRecipient(
  declId: string,
  recipient: DispatchRecipient,
): ExporterDeclState {
  const state = loadExporterState(declId);
  const next = {
    ...state,
    dispatch: {
      ...state.dispatch,
      acknowledgedAt: {
        ...state.dispatch.acknowledgedAt,
        [recipient]: Date.now(),
      },
    },
  };
  saveExporterState(next);
  return next;
}

/* The exporter org / signer identity, surfaced so the package header is real.
   Resolved at CALL time from the live org profile — a Settings rename must
   reach every output, which the old module-load fixture constant never did. */
export function exporterIdentity(): {
  org: string;
  installationId: string;
  contact: string;
  role: string;
} {
  const o = getOrgIdentity();
  return {
    org: o.name,
    installationId: o.installationId,
    contact: o.contact,
    role: o.role,
  };
}

/* Re-export so the workflow UI groups the read-only submitted data the same way
   the supplier questionnaire did (Installation, Goods, Emissions, …). */
export type { RequestDocAsk };

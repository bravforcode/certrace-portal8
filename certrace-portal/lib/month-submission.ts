/* ════════════════════════════════════════════════════════════
   THE MONTH'S SUBMISSION — who signed it, and what happened after

   A month has readings (lib/monthly-data.ts), a methodology
   (lib/workspace-mmd.ts) and precursor tonnages (lib/precursor-suppliers.ts).
   What none of those carry is the PROVENANCE of the month as a whole: who
   attested to it, what the quality check said at the time, and where the
   exporter's review of it got to.

   WHY THAT IS A SEPARATE RECORD. The readings are facts about a furnace and
   they belong to the month. The attestation is a statement by a named person
   at a moment in time, and it must not silently follow the readings when they
   change — a signature that re-applies itself to edited numbers is not a
   signature. So editing a submitted month INVALIDATES its attestation rather
   than inheriting it, and the exporter's own edits are recorded as theirs.

   THE REVIEW LOOP, and the one case it exists to get right:

     supplier submits  →  exporter reviews  →  confirmed
                                            ↘  changes requested → supplier

   The case that used to be wrong is an exporter who EDITS the month and THEN
   asks the supplier for a revision. The supplier would receive their own
   original figures back with a note about something the exporter had already
   fixed, and would either re-fix it (two edits, one of them stale) or reply
   that it was already right. So a revision request carries whichever version
   is current: if the exporter has edited since submission, the EDITED version
   is what goes back, and the request says so.

   Frontend-only MVP: one localStorage key, same seam as the other stores.
   ════════════════════════════════════════════════════════════ */

import { dateLocaleNow } from "./i18n";

export type Attestation = {
  /** typed name — browser-local demo metadata, never an e-signature */
  fullName: string;
  role: string;
  /** ISO timestamp */
  at: string;
  /** how many quality-check warnings they confirmed they had read */
  warningsAcknowledged: number;
};

export type ReviewState =
  /** nothing submitted yet */
  | "open"
  /** the supplier has attested and sent it */
  | "submitted"
  /** handed to a named colleague to look at */
  | "in_review"
  /** the exporter has accepted it */
  | "confirmed"
  /** sent back for a revision */
  | "changes_requested";

export type MonthSubmission = {
  workspaceId: string;
  /** 'YYYY-MM' */
  month: string;
  state: ReviewState;
  /** set when the supplier submits; cleared when anyone edits afterwards */
  attestation: Attestation | null;
  /** EVERY authorisation ever given for this month, oldest first. `attestation` is the one standing now; this is the record,
      and an exporter's edit that voids the first does not remove it. */
  history?: Attestation[];
  /** ISO timestamp of the supplier's submission */
  submittedAt?: string;
  /* ── The exporter's side ──────────────────────────────────── */
  /** true once the exporter has changed a figure after submission. This is
      what decides which version a revision request carries. */
  editedByExporter: boolean;
  editedAt?: string;
  /** who it was handed to, when `state` is "in_review" */
  reviewerId?: string;
  reviewerName?: string;
  /** the exporter's acceptance */
  confirmedBy?: string;
  confirmedAt?: string;
  /** what was asked for, when `state` is "changes_requested" */
  revisionNote?: string;
  revisionAt?: string;
  /** whether the revision request carried the exporter's edits back with it */
  revisionCarriedEdits?: boolean;
  /* ── WHICH PARTS the revision is about ────────────────────────
     `RevisionArea` ids from lib/month-revision.ts. A note alone leaves the
     supplier matching one sentence against twenty screens; these are what
     let their own flow mark the fields and jump to the first of them. Empty
     is legal and means "the whole month", which is what a note-only request
     from an older build reads as. */
  revisionAreas?: string[];
  /** how many times this month has been sent back. Shown on both sides — a
      third round is a different conversation from a first one. */
  revisionRound?: number;

  /* ── The other direction: the supplier asking to reopen ───────
     A submitted month is closed to the supplier, and it should be. But plants
     find their own mistakes, and without a request the only route is a phone
     call the portal never sees. Nothing here reopens anything on its own —
     `approveEditRequest` is what does that, and a person presses it. */
  editRequest?: {
    at: string;
    reason: string;
    state: "pending" | "approved" | "rejected";
    decidedAt?: string;
    decidedBy?: string;
  };
};

const KEY = "certrace:month-submissions";

type Store = Record<string, Record<string, MonthSubmission>>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export const emptySubmission = (workspaceId: string, month: string): MonthSubmission => ({
  workspaceId,
  month,
  state: "open",
  attestation: null,
  editedByExporter: false,
});

export const submissionsFor = (workspaceId: string): Record<string, MonthSubmission> => read()[workspaceId] ?? {};

export const submissionFor = (workspaceId: string, month: string): MonthSubmission =>
  submissionsFor(workspaceId)[month] ?? emptySubmission(workspaceId, month);

function put(next: MonthSubmission): MonthSubmission {
  const store = read();
  store[next.workspaceId] = { ...(store[next.workspaceId] ?? {}), [next.month]: next };
  write(store);
  return next;
}

/** The supplier attests and sends. Resets the exporter's edit flag: whatever
    they changed last round has been superseded by a fresh submission. */
export function submitWithAttestation(workspaceId: string, month: string, attestation: Attestation): MonthSubmission {
  const prev = submissionFor(workspaceId, month);
  return put({
    ...prev,
    state: "submitted",
    attestation,
    history: [...authorisationHistory(prev).slice().reverse(), attestation].slice(-50),
    submittedAt: new Date().toISOString(),
    editedByExporter: false,
    editedAt: undefined,
    revisionNote: undefined,
    revisionAt: undefined,
    revisionCarriedEdits: undefined,
    /* The areas stay. They are the record of what was asked for and answered,
       and the supplier's own screen keeps them marked so a second round of
       questions is legible against the first — see REVISION_RING. What is
       cleared is the REQUEST: a resubmitted month is no longer outstanding. */
    editRequest: undefined,
  });
}

/** Who authorised this month and when, newest first. A month submitted before the record was kept still shows the one authorisation it had. */
export function authorisationHistory(s: MonthSubmission | null | undefined): Attestation[] {
  if (!s) return [];
  const all = s.history && s.history.length > 0 ? s.history : s.attestation ? [s.attestation] : [];
  return all.slice().sort((a, b) => b.at.localeCompare(a.at));
}

/** "25 Oct 2026 · 14:32" — the date the platform uses everywhere, and the time it was pressed. */
export function formatAuthorisedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString(dateLocaleNow(), { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

/** Called whenever the EXPORTER changes a figure on a month that had already
    been submitted.

    IT VOIDS THE ATTESTATION. The supplier signed a set of numbers; those
    numbers are no longer the ones on file, and carrying their name forward
    onto figures they have not seen would be the product forging a signature.
    The month stays submitted — it is still their data, edited — and the screen
    says who edited it. */
export function markExporterEdited(workspaceId: string, month: string): MonthSubmission {
  const prev = submissionFor(workspaceId, month);
  if (prev.state === "open") return prev;
  return put({ ...prev, editedByExporter: true, editedAt: new Date().toISOString(), attestation: null });
}

/** Hand the month to a colleague. Not an approval — a named person now owns
    looking at it, which is the thing an owner actually wants to record. */
export function assignReviewer(workspaceId: string, month: string, reviewerId: string, reviewerName: string): MonthSubmission {
  const prev = submissionFor(workspaceId, month);
  return put({ ...prev, state: "in_review", reviewerId, reviewerName });
}

/** The exporter accepts the month as it now stands. */
export function confirmMonth(workspaceId: string, month: string, by: string): MonthSubmission {
  const prev = submissionFor(workspaceId, month);
  return put({ ...prev, state: "confirmed", confirmedBy: by, confirmedAt: new Date().toISOString() });
}

/** Send it back for a revision.

    `carriedEdits` records the case in the header: when the exporter has
    already edited the month, the supplier is being asked to revise the
    EXPORTER'S version, not the one they submitted. Callers do not compute
    this — it is read off the record, so the two cannot disagree. */
export function requestRevision(workspaceId: string, month: string, note: string, areas: string[] = []): MonthSubmission {
  const prev = submissionFor(workspaceId, month);
  return put({
    ...prev,
    state: "changes_requested",
    revisionNote: note.trim(),
    revisionAt: new Date().toISOString(),
    revisionCarriedEdits: prev.editedByExporter,
    revisionAreas: areas,
    revisionRound: (prev.revisionRound ?? 0) + 1,
    /* A revision request answers an edit request. Leaving one pending
       underneath would have the exporter approving access to a month they
       have already handed back. */
    editRequest: undefined,
  });
}

/* ── The supplier asks to reopen a submitted month ──────────────
   Only from a month that is actually closed, and only one at a time: a second
   press while one is pending must not overwrite the reason already sent. */
export function requestEdit(workspaceId: string, month: string, reason: string): MonthSubmission {
  const prev = submissionFor(workspaceId, month);
  if (prev.editRequest?.state === "pending") return prev;
  return put({ ...prev, editRequest: { at: new Date().toISOString(), reason: reason.trim(), state: "pending" } });
}

/** The exporter agrees. This RECORDS the decision; reopening the month itself
    is the caller's job (`reopenMonth` in lib/monthly-data.ts) because the
    readings are a different store, and a half-applied approval that says yes
    without unlocking anything is worse than a refusal. */
export function approveEditRequest(workspaceId: string, month: string, by: string): MonthSubmission {
  const prev = submissionFor(workspaceId, month);
  if (!prev.editRequest) return prev;
  return put({
    ...prev,
    editRequest: { ...prev.editRequest, state: "approved", decidedAt: new Date().toISOString(), decidedBy: by },
  });
}

export function rejectEditRequest(workspaceId: string, month: string, by: string): MonthSubmission {
  const prev = submissionFor(workspaceId, month);
  if (!prev.editRequest) return prev;
  return put({
    ...prev,
    editRequest: { ...prev.editRequest, state: "rejected", decidedAt: new Date().toISOString(), decidedBy: by },
  });
}

export const REVIEW_STATE_LABEL: Record<ReviewState, string> = {
  open: "Not submitted",
  submitted: "Awaiting your review",
  in_review: "With a reviewer",
  confirmed: "Confirmed",
  changes_requested: "Revision requested",
};

export const REVIEW_STATE_TONE: Record<ReviewState, "muted" | "info" | "warn" | "ok"> = {
  open: "muted",
  submitted: "info",
  in_review: "info",
  changes_requested: "warn",
  confirmed: "ok",
};

/* ── Which version is on file, and when it landed ───────────────
   The review bar used to carry only a state chip. "Awaiting your review" is
   the state of a conversation, not of a document, and the question an exporter
   opening a month in November actually has is WHICH version they are looking
   at and WHEN it arrived — a month resubmitted twice after two rounds of
   questions is three different documents wearing the same chip.

   `n` counts submissions rather than revisions: v1 is what the supplier first
   sent, and every resubmission after a round of questions is the next one. */
export function submissionVersion(s: MonthSubmission): { label: string; at: string | null } | null {
  if (s.state === "open") return null;
  const n = (s.revisionRound ?? 0) + 1;
  const at = s.editedByExporter ? (s.editedAt ?? s.submittedAt ?? null) : (s.submittedAt ?? null);
  return { label: s.editedByExporter ? `v${n} · edited by you` : `v${n}`, at };
}

/** The date on the version, formatted the way every other date on the
    platform is — day, short month, year, in English. */
export function formatSubmissionDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(dateLocaleNow(), { day: "numeric", month: "short", year: "numeric" });
}

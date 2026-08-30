/* ════════════════════════════════════════════════════════════
   SMART LINKS — the reason this whole migration exists

   Mirrors §3 of docs/API-CONTRACT.md.

   Today a supplier's answers live in the localStorage of whichever browser
   typed them, so a link opened on the supplier's own machine produces data the
   exporter never sees. These five calls are what make the round trip real.

   ── Two things the server owns, not this file ─────────────────
   `submit` sends the state, the attestation and the check result, and takes
   back whatever the server wrote. It does not append the version or stamp the
   time itself, even though it could: a verifier reads those fields, and a
   number the submitting browser chose is not evidence of anything. Same for
   the status transition.

   ── Why these calls pass `auth: false` ───────────────────────
   Whoever opens a Smart Link has no account, so `resolve`, `saveState` and
   `submit` must work with no session at all — and must not quietly start
   depending on one when the exporter opens the same link while signed in.
   ════════════════════════════════════════════════════════════ */

import type { CheckResult } from "../ai-check";
import type { Attestation } from "../supplier-records";
import type { SubmissionStatus, SupplierState } from "../supplier-store";
import { request } from "./http";

/** What `GET /api/v1/links/{token}` hands the supplier's browser. */
export type LinkResolution = {
  token: string;
  declId: string;
  supplierId: string;
  /** Present on monthly requests — one link per month, per the token format. */
  month?: string;
  expiresAt: number;
  /** Only what the holder of the link may see: who is asking. */
  exporter: { companyName: string };
  /** The products and lots this supplier was asked about. */
  request: unknown;
  /** Never null — an untouched link resolves to an empty state. */
  state: SupplierState;
};

export type SmartLink = {
  token: string;
  url: string;
  expiresAt: number;
};

export type SubmissionSummary = {
  supplierId: string;
  token: string;
  status: SubmissionStatus;
  version: number;
  score: number | null;
  updatedAt: number;
};

export type CreateLinkInput = {
  supplierId: string;
  month?: string;
  expiresInDays?: number;
};

/* ── Exporter side (signed in) ─────────────────────────────── */

export function createSmartLink(declId: string, input: CreateLinkInput): Promise<SmartLink> {
  return request<SmartLink>(`/api/v1/declarations/${encodeURIComponent(declId)}/links`, {
    method: "POST",
    body: input,
  });
}

/** The exporter's at-a-glance "who has answered" — called often, kept small. */
export async function listSubmissions(declId: string): Promise<SubmissionSummary[]> {
  const result = await request<{ submissions: SubmissionSummary[] }>(
    `/api/v1/declarations/${encodeURIComponent(declId)}/submissions`,
  );
  return result.submissions ?? [];
}

export type RevisionInput = {
  note: string;
  /** Value keys the supplier may edit again. */
  unlocked: string[];
  /** Document ids they must re-upload. */
  unlockedDocs: string[];
};

export function requestRevision(
  declId: string,
  token: string,
  input: RevisionInput,
): Promise<SupplierState> {
  return request<SupplierState>(
    `/api/v1/declarations/${encodeURIComponent(declId)}/links/${encodeURIComponent(token)}/revision`,
    { method: "POST", body: input },
  );
}

/* ── Supplier side (no account, no session) ────────────────── */

export function resolveLink(token: string): Promise<LinkResolution> {
  return request<LinkResolution>(`/api/v1/links/${encodeURIComponent(token)}`, {
    auth: false,
  });
}

/** Autosave while filling in. Whole state, last write wins — same as today. */
export function saveLinkState(token: string, state: SupplierState): Promise<SupplierState> {
  return request<SupplierState>(`/api/v1/links/${encodeURIComponent(token)}/state`, {
    method: "PUT",
    body: { state },
    auth: false,
  });
}

export type SubmitInput = {
  state: SupplierState;
  attestation: Attestation;
  check: CheckResult | null;
};

export function submitLink(token: string, input: SubmitInput): Promise<SupplierState> {
  return request<SupplierState>(`/api/v1/links/${encodeURIComponent(token)}/submit`, {
    method: "POST",
    body: input,
    auth: false,
  });
}

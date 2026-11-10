/* ════════════════════════════════════════════════════════════
   SMART LINKS — the reason this whole migration exists

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
import { api, result } from "./client";
import { decode, jsonDocument } from "./decode";
import {
  isSupplierState,
  isLinkResolution,
  isSubmissionSummary,
} from "./validators.js";

/** Declaration-level context the supplier's guided form is built from. Shared,
    not secret — which regulation, the period, the deadline, the exporter's
    note. Never carries another supplier's data or anyone's figures. */
export type LinkDeclaration = {
  name: string;
  regulation: string;
  origin: string;
  market: string;
  period: string;
  periodEnd: string;
  due: string;
  dueInDays: number;
  kind: "cbam" | "buyer";
  includedFieldIds: string[] | null;
  note: string;
};

/** This one supplier's identity row — never their emissions figure. */
export type LinkSupplier = {
  name: string;
  ref: string;
  country: string;
  material: string;
  critical: boolean;
  selfSupplied: boolean;
};

/** What `GET /api/v1/links/{token}` hands the supplier's browser. */
export type LinkResolution = {
  token: string;
  declId: string;
  supplierId: string;
  /** Present on monthly requests — one link per month, per the token format. */
  month?: string | null;
  expiresAt: number;
  /** Only what the holder of the link may see: who is asking. */
  exporter: { companyName: string };
  /** Declaration context the questionnaire is rebuilt from (buildFromPayload). */
  declaration: LinkDeclaration;
  /** This supplier's identity, so the form need not invent a name. */
  supplier: LinkSupplier;
  /** The products and lots this supplier was asked about. */
  request: { products: unknown };
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

/* The supplier opens /s/<token> on the PORTAL, so the address handed out is
   built on the origin this page is served from — the same rule the monthly
   (lib/workspace-link-sync.ts) and precursor (lib/precursor-link-sync.ts)
   links follow. The `url` the API returns is built from the backend's
   CERTRACE_APP_BASE_URL, which production once ran without: every link then
   pointed at a host that does not resolve, and the first to notice would have
   been a supplier. The token is the server's; only the host is ours. Kept as
   the fallback where there is no page origin (tests, server rendering). */
function onThisPortal(link: SmartLink): SmartLink {
  const origin =
    typeof window !== "undefined" ? window.location?.origin : undefined;
  return origin ? { ...link, url: `${origin}/s/${link.token}` } : link;
}

export async function createSmartLink(
  declId: string,
  input: CreateLinkInput,
): Promise<SmartLink> {
  return onThisPortal(
    await result(
      api()
        .api.v1.declarations({ declaration_id: encodeURIComponent(declId) })
        .links.post(input),
    ),
  );
}
export async function listSubmissions(
  declId: string,
): Promise<SubmissionSummary[]> {
  return (
    await result(
      api()
        .api.v1.declarations({ declaration_id: encodeURIComponent(declId) })
        .submissions.get(),
    )
  ).submissions.map((value) => decode(value, isSubmissionSummary));
}
export async function getSubmissionState(
  declId: string,
  token: string,
): Promise<SupplierState> {
  const response = await result(
    api()
      .api.v1.declarations({ declaration_id: encodeURIComponent(declId) })
      .submissions({ token: encodeURIComponent(token) })
      .get(),
  );
  return decode(response.state, isSupplierState);
}
export type RevisionInput = {
  note: string;
  unlocked: string[];
  unlockedDocs: string[];
};
export async function requestRevision(
  declId: string,
  token: string,
  input: RevisionInput,
): Promise<SupplierState> {
  return decode(
    await result(
      api()
        .api.v1.declarations({ declaration_id: encodeURIComponent(declId) })
        .links({ token: encodeURIComponent(token) })
        .revision.post(input),
    ),
    isSupplierState,
  );
}
export async function resolveLink(token: string): Promise<LinkResolution> {
  return decode(
    await result(
      api(false)
        .api.v1.links({ token: encodeURIComponent(token) })
        .get(),
    ),
    isLinkResolution,
  );
}
export async function saveLinkState(
  token: string,
  state: SupplierState,
): Promise<SupplierState> {
  return decode(
    await result(
      api(false)
        .api.v1.links({ token: encodeURIComponent(token) })
        .state.put({ state: jsonDocument(state) }),
    ),
    isSupplierState,
  );
}
export type SubmitInput = {
  state: SupplierState;
  attestation: Attestation;
  check: CheckResult | null;
};
export async function submitLink(
  token: string,
  input: SubmitInput,
): Promise<SupplierState> {
  return decode(
    await result(
      api(false)
        .api.v1.links({ token: encodeURIComponent(token) })
        .submit.post({
          state: jsonDocument(input.state),
          attestation: jsonDocument(input.attestation),
          check: input.check ? jsonDocument(input.check) : null,
        }),
    ),
    isSupplierState,
  );
}

/* ════════════════════════════════════════════════════════════
   THE PRECURSOR SUPPLIER LINK

   `lib/workspace-link.ts`'s `/w/<token>` resolves to a WORKSPACE and a
   MONTH — the right shape for fuel and electricity readings. A precursor
   supplier is answering a different question: not "what did you burn in
   March" but "what is your installation's SEE for the whole reporting
   period, and who verified it" — a different form, a different node in the
   chain, and no month attached to it at all. So it gets its own token
   scheme and its own route (`/p/<token>`), mirroring the workspace scheme's
   stateless encode/decode exactly.

   Nothing is transmitted here either — same seam, same honesty, see the
   file header on lib/workspace-link.ts. */

import { getSupplier, linkStatus, listSuppliers, saveSupplier, type PrecursorSupplier } from "./precursor-suppliers";
import { getWorkspace, type VerificationWorkspace } from "./workspace";

const b64urlEncode = (s: string): string => {
  const b64 = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const b64urlDecode = (s: string): string => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const raw = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
    return decodeURIComponent(escape(raw));
  } catch {
    return "";
  }
};

/** `pr|<workspaceId>|<precursorNodeId>`. The `pr` prefix keeps this scheme
    distinguishable from `ws|…` without decoding both to find out. */
export function makePrecursorLinkToken(workspaceId: string, precursorNodeId: string): string {
  return b64urlEncode(`pr|${workspaceId}|${precursorNodeId}`);
}

export function decodePrecursorLinkToken(token: string): { workspaceId: string; precursorNodeId: string } | null {
  const parts = b64urlDecode(token).split("|");
  if (parts[0] !== "pr" || !parts[1] || !parts[2]) return null;
  return { workspaceId: parts[1], precursorNodeId: parts[2] };
}

export type PrecursorLinkRequest = {
  workspace: VerificationWorkspace;
  node: PrecursorSupplier;
};

export function resolvePrecursorLink(token: string): PrecursorLinkRequest | null {
  const decoded = decodePrecursorLinkToken(token);
  if (!decoded) return null;
  const workspace = getWorkspace(decoded.workspaceId);
  if (!workspace) return null;
  const node = getSupplier(decoded.workspaceId, decoded.precursorNodeId);
  if (!node) return null;
  return { workspace, node };
}

/** The full URL to hand a precursor supplier. Origin-relative, same reason
    as `workspaceLinkFor`. */
export const precursorLinkFor = (workspaceId: string, precursorNodeId: string): string =>
  typeof window === "undefined" ? "" : `${window.location.origin}/p/${makePrecursorLinkToken(workspaceId, precursorNodeId)}`;

/* ── Bulk invite (§2.4) ──────────────────────────────────────────
   "Send links to all precursors in this chain" — one click, with the two
   skip rules the spec names: a node already verified for the CURRENT
   period has nothing left to ask for, and a node already sent a link
   within the current period is not re-invited just because someone
   pressed the button twice. A node sent in a PRIOR period IS re-invited —
   a new reporting period is a new ask, not a continuation of the old one.

   Simulated send, same honesty as every other "send" action in this
   build: this stamps the record and hands back counts for the summary
   toast. No email is dispatched — there is no email infrastructure to
   dispatch it from. */
export type BulkInviteResult = { sent: number; skippedVerified: number; skippedAlreadyInvited: number; skippedScrap: number };

export function sendAllPrecursorLinks(workspace: Pick<VerificationWorkspace, "id" | "periodStart" | "periodEnd">): BulkInviteResult {
  const nodes = listSuppliers(workspace.id);
  const result: BulkInviteResult = { sent: 0, skippedVerified: 0, skippedAlreadyInvited: 0, skippedScrap: 0 };

  for (const node of nodes) {
    if (node.isScrap) {
      result.skippedScrap++;
      continue;
    }
    if (linkStatus(node) === "submitted_verified") {
      result.skippedVerified++;
      continue;
    }
    const sentThisPeriod = node.smartLinkSentAt && node.smartLinkSentAt >= workspace.periodStart && node.smartLinkSentAt <= workspace.periodEnd;
    if (sentThisPeriod) {
      result.skippedAlreadyInvited++;
      continue;
    }
    const token = node.smartLinkToken ?? makePrecursorLinkToken(workspace.id, node.id);
    saveSupplier({ ...node, smartLinkToken: token, smartLinkSentAt: new Date().toISOString() });
    result.sent++;
  }

  return result;
}

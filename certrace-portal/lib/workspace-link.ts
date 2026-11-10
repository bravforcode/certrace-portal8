/* ════════════════════════════════════════════════════════════
   THE WORKSPACE SUPPLIER LINK

   The address an exporter hands to whoever fills in a month.

   WHY A SECOND SCHEME. `lib/supplier.ts` encodes `declId|supplierId`, which
   was correct when a declaration was the spine. It is not any more, and the
   workspace menu was emitting `/s/<workspaceId>` into that decoder — a token
   it cannot parse, so the supplier opened "This link looks invalid or
   expired." A dead link handed to a supplier is worse than no link, because
   the exporter believes they have asked.

   So a workspace link is its own scheme with its own route (`/w/<token>`),
   and it carries the month, because the ask is "send me March", never "send
   me the year".

   THIS IS THE OLD, LOCAL SCHEME. A token made here is base64 of the ids and
   carries nothing: a supplier opening it on their own machine gets an empty
   store, and what they type never reaches the exporter. Links handed to real
   suppliers are server-issued instead (lib/workspace-link-sync.ts); this
   scheme stays for the demo and for links sent before that existed.
   ════════════════════════════════════════════════════════════ */

import {
  getWorkspace,
  monthsOf,
  type VerificationWorkspace,
} from "./workspace";

const b64urlEncode = (s: string): string => {
  const b64 =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(s)))
      : Buffer.from(s, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const b64urlDecode = (s: string): string => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const raw =
      typeof atob === "function"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("binary");
    return decodeURIComponent(escape(raw));
  } catch {
    return "";
  }
};

/** `ws|<workspaceId>` or `ws|<workspaceId>|<YYYY-MM>`. The `ws` prefix is what
    lets a reader tell the two token schemes apart without decoding twice. */
export function makeWorkspaceToken(
  workspaceId: string,
  month?: string,
): string {
  return b64urlEncode(
    month ? `ws|${workspaceId}|${month}` : `ws|${workspaceId}`,
  );
}

export function decodeWorkspaceToken(
  token: string,
): { workspaceId: string; month?: string } | null {
  const parts = b64urlDecode(token).split("|");
  if (parts[0] !== "ws" || !parts[1]) return null;
  return { workspaceId: parts[1], month: parts[2] || undefined };
}

export type WorkspaceRequest = {
  workspace: VerificationWorkspace;
  /** the month being asked for; defaults to the most recent one that has passed */
  month: string;
  /** every month of the reporting year, so the supplier can move between them */
  months: string[];
};

/** The month an exporter most likely means when they share a bare workspace
    link: the last one that has actually finished. Asking for the current month
    on the 3rd is asking for readings nobody has yet. */
export function defaultMonthFor(
  w: Pick<VerificationWorkspace, "year">,
): string {
  const months = monthsOf(w);
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const past = months.filter((m) => m < current);
  return past.length > 0 ? past[past.length - 1] : months[0];
}

export function resolveWorkspaceRequest(
  token: string,
): WorkspaceRequest | null {
  const decoded = decodeWorkspaceToken(token);
  if (!decoded) return null;
  const workspace = getWorkspace(decoded.workspaceId);
  if (!workspace) return null;
  const months = monthsOf(workspace);
  const month =
    decoded.month && months.includes(decoded.month)
      ? decoded.month
      : defaultMonthFor(workspace);
  return { workspace, month, months };
}

/** The full URL to hand over. Origin-relative so it is correct on localhost,
    on a preview deployment and in production without configuration. */
export const workspaceLinkFor = (
  workspaceId: string,
  month?: string,
): string =>
  typeof window === "undefined"
    ? ""
    : `${window.location.origin}/w/${makeWorkspaceToken(workspaceId, month)}`;

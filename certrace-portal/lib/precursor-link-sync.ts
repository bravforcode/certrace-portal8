/* ════════════════════════════════════════════════════════════
   THE PRECURSOR LINK, CARRIED BY THE SERVER

   /p/<token> used to be a browser-local form, exactly as /w/<token> was
   before lib/workspace-link-sync.ts. The token was base64 of
   "pr|<workspaceId>|<nodeId>", the form read and wrote this browser's
   precursor store, and a precursor producer who opened the link on their own
   machine found nothing at all — "This link looks invalid" — because the
   workspace and the row only ever existed in the exporter's browser.

   Now the link is an ordinary smart link (docs/API-CONTRACT.md §3), riding
   the same document kind the monthly link does ("workspace": an opaque slice
   the server hands to the link holder whole), so the backend needed nothing:

     exporter  publishes the precursor's slice (id `pr-<workspace>-<node>`),
               mints a link for it, and hands over /p/<server token>
     supplier  opens it with no account; the row is written into THIS
               browser's precursor store, the form runs as before, and the
               draft is saved back to the link as it changes
     exporter  pulls each submitted answer and merges it into the row

   ── What travels, and what does not ────────────────────────────
   The holder is a company one or more tiers up the chain, not the exporter's
   customer and not the workspace's own supplier. So the slice is the least
   the form needs: who is asking, the one row being asked about, and the
   evidence filed against it. Never the exporter's workspace record, never
   any other row in the chain.

   Coming back, only the fields the form itself edits are taken (SUPPLIER
   FIELDS below). The rest of the row — where it sits in the chain, whether
   it is scrap, its data origin, its link history — is the exporter's, and a
   blob sent from someone else's browser does not get to rewrite it.

   ── Files ───────────────────────────────────────────────────────
   As on the monthly link: an attachment is uploaded to the link's file store
   and its evidence item keeps `serverFileId`; bytes never ride in the slice.

   Legacy base64 tokens keep resolving locally: demo builds and links already
   handed out must not break.
   ════════════════════════════════════════════════════════════ */

import { apiConfigured } from "./api/config";
import { request } from "./api/http";
import { uploadLinkFile } from "./api/files";
import { getOrgIdentity } from "./org";
import { getSupplier, listSuppliers, saveSupplier, type PrecursorSupplier } from "./precursor-suppliers";
import { getWorkspace, listWorkspaces } from "./workspace";

const PRECURSORS_KEY = "certrace:precursor-suppliers";
const EVIDENCE_KEY = "certrace:workspace-evidence";
/** Exporter side: the updatedAt of each link state already merged in. */
const PULLED_KEY = "certrace:precursor-links-pulled";

/** What the /p/ form edits, and so the only fields an answer may carry back. */
export const SUPPLIER_FIELDS = [
  "name",
  "installationName",
  "country",
  "installationUniqueId",
  "unlocode",
  "fullAddress",
  "latitude",
  "longitude",
  "precursorName",
  "cnCode",
  "productionRoute",
  "specificEmbeddedDirectTco2PerT",
  "specificEmbeddedIndirectTco2PerT",
  "reportingPeriodStart",
  "reportingPeriodEnd",
  "qtyPerTonneOverride",
  "verifierName",
  "verifierAccreditationNumber",
  "verifierAccreditationIssuingCountry",
  "verifierAccreditationExpiryDate",
  "verificationReportIssueDate",
  "verificationSectoralScope",
  "verificationReportExpiresAt",
  "verificationReportFileId",
] as const satisfies readonly (keyof PrecursorSupplier)[];

/* Read by the submit gate (precursorRequirements) to decide what this row has
   to answer — a purchased good from an EU or exempt country needs no
   verification, scrap needs no figure. Sent so the supplier's form asks the
   same questions the exporter's does; never taken back. */
const CONTEXT_FIELDS = ["origin", "isScrap"] as const satisfies readonly (keyof PrecursorSupplier)[];

type Row = Record<string, unknown> & { id?: unknown };

export type PrecursorSlice = {
  /** who the form says is asking — the installation the good is made at, or
      the exporter's own company for the row at the top of the chain */
  asker: string;
  workspaceId: string;
  node: Row;
  evidence: Row[];
};

type LinkState = {
  token?: string;
  status?: string;
  slice?: { node?: Row; evidence?: Row[] };
  versions?: { submittedAt?: number }[];
  updatedAt?: number;
  [key: string]: unknown;
};

type Resolution = {
  token: string;
  kind?: string;
  supplierId: string;
  workspace: { precursor?: PrecursorSlice } | null;
  state: LinkState | null;
};

/** What /p/<token> renders from, whichever way the token resolved. */
export type PrecursorLinkView = {
  workspaceId: string;
  node: PrecursorSupplier;
  asker: string;
  /** true when answers are saved to and submitted through the server */
  server: boolean;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Quota: the same failure every store here already tolerates. */
  }
}

export const precursorDocId = (workspaceId: string, nodeId: string): string => `pr-${workspaceId}-${nodeId}`;

const evidenceKeyFor = (nodeId: string): string => `precursor:${nodeId}`;

/** A server token is not base64 of "pr|…". */
export function isServerPrecursorToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    return !atob(token.replace(/-/g, "+").replace(/_/g, "/")).startsWith("pr|");
  } catch {
    return true;
  }
}

const linkUrl = (token: string): string =>
  typeof window === "undefined" ? `/p/${token}` : `${window.location.origin}/p/${token}`;

const pick = (row: Row, keys: readonly string[] = SUPPLIER_FIELDS): Row => {
  const out: Row = { id: row.id };
  for (const key of keys) if (key in row) out[key] = row[key];
  return out;
};

/** Evidence filed against this one row, without file bytes. */
function evidenceOf(workspaceId: string, nodeId: string): Row[] {
  const key = evidenceKeyFor(nodeId);
  const items = readJson<Record<string, Row[]>>(EVIDENCE_KEY, {})[workspaceId] ?? [];
  return items
    .filter((item) => Array.isArray(item.fieldKeys) && (item.fieldKeys as unknown[]).includes(key))
    .map((item) => {
      const rest = { ...item };
      delete rest.fileDataUrl;
      return rest;
    });
}

/** Upsert evidence items by id, keeping any bytes this browser already holds
    and never letting an incoming item land outside this row's key. */
function mergeEvidence(workspaceId: string, nodeId: string, incoming: Row[] | undefined): boolean {
  if (!Array.isArray(incoming) || incoming.length === 0) return false;
  const key = evidenceKeyFor(nodeId);
  const store = readJson<Record<string, Row[]>>(EVIDENCE_KEY, {});
  const items = [...(store[workspaceId] ?? [])];
  for (const raw of incoming) {
    if (!raw || typeof raw.id !== "string") continue;
    const item: Row = { ...raw, workspaceId, fieldKeys: [key] };
    delete item.fileDataUrl;
    const at = items.findIndex((e) => e.id === item.id);
    if (at >= 0) items[at] = { ...items[at], ...item, fileDataUrl: items[at].fileDataUrl };
    else items.push(item);
  }
  store[workspaceId] = items;
  writeJson(EVIDENCE_KEY, store);
  return true;
}

/* ── Exporter: hand over a server link ─────────────────────────── */

function askerFor(workspaceId: string, node: PrecursorSupplier): string {
  if (node.isChainRoot) return getOrgIdentity().name;
  return getWorkspace(workspaceId)?.installationName ?? getOrgIdentity().name;
}

export function collectPrecursorSlice(workspaceId: string, nodeId: string): PrecursorSlice | null {
  const node = getSupplier(workspaceId, nodeId);
  if (!node) return null;
  return {
    asker: askerFor(workspaceId, node),
    workspaceId,
    node: pick(node as unknown as Row, [...SUPPLIER_FIELDS, ...CONTEXT_FIELDS]),
    evidence: evidenceOf(workspaceId, nodeId),
  };
}

/** Refresh the precursor's slice on the server. Called before every
    hand-over, so a link opened next week shows the row as it is then. */
export async function publishPrecursor(workspaceId: string, nodeId: string): Promise<void> {
  const precursor = collectPrecursorSlice(workspaceId, nodeId);
  if (!precursor) return;
  await request(`/api/v1/declarations/${encodeURIComponent(precursorDocId(workspaceId, nodeId))}`, {
    method: "PUT",
    body: { kind: "workspace", title: String(precursor.node.precursorName ?? ""), supplierView: { precursor } },
  });
}

/** The URL to give this precursor's producer — minted once, then reused.
    The server token is kept on the row as its `smartLinkToken`, so every
    screen that builds `/p/<token>` from the row hands out the working one.
    Null when there is no backend: the caller falls back to the local link. */
export async function ensurePrecursorLink(workspaceId: string, nodeId: string): Promise<string | null> {
  if (!apiConfigured()) return null;
  await publishPrecursor(workspaceId, nodeId);
  const row = getSupplier(workspaceId, nodeId);
  if (!row) return null;
  if (isServerPrecursorToken(row.smartLinkToken)) return linkUrl(row.smartLinkToken as string);
  const minted = await request<{ token: string }>(
    `/api/v1/declarations/${encodeURIComponent(precursorDocId(workspaceId, nodeId))}/links`,
    { method: "POST", body: { supplierId: nodeId } },
  );
  // Re-read: the caller may have stamped sent-at while the request was out.
  const fresh = getSupplier(workspaceId, nodeId) ?? row;
  saveSupplier({ ...fresh, smartLinkToken: minted.token });
  return linkUrl(minted.token);
}

/** Merge one submitted answer into the exporter's row. */
function mergeAnswer(workspaceId: string, nodeId: string, state: LinkState): boolean {
  const row = getSupplier(workspaceId, nodeId);
  const answer = state.slice?.node;
  const versions = Array.isArray(state.versions) ? state.versions : [];
  if (!row || !answer || versions.length === 0) return false;

  const patch: Record<string, unknown> = {};
  for (const key of SUPPLIER_FIELDS) if (key in answer) patch[key] = answer[key];
  const submittedAt = versions[versions.length - 1]?.submittedAt;
  const at = typeof submittedAt === "number" ? new Date(submittedAt).toISOString() : new Date().toISOString();
  saveSupplier({
    ...row,
    ...(patch as Partial<PrecursorSupplier>),
    // Same stamps the local form's submit wrote (app/p/[token]/page.tsx).
    dataOrigin: row.dataOrigin === "default_value" ? row.dataOrigin : "supplier_verified",
    smartLinkOpenedAt: row.smartLinkOpenedAt ?? at,
    smartLinkSubmittedAt: at,
  });
  mergeEvidence(workspaceId, nodeId, state.slice?.evidence);
  return true;
}

/** Pull every precursor in one workspace that has a server link. Returns the
    node ids whose answers changed, so the caller knows whether to refresh.

    Only SUBMITTED answers are merged: the local form never wrote the row
    until Submit either, and a half-typed draft is not something the exporter
    should be building a declaration on. An open with nothing submitted yet
    still stamps "opened". */
export async function pullPrecursorAnswers(workspaceId: string): Promise<string[]> {
  if (!apiConfigured()) return [];
  const pulled = readJson<Record<string, number>>(PULLED_KEY, {});
  const changed: string[] = [];
  for (const row of listSuppliers(workspaceId)) {
    const token = row.smartLinkToken;
    if (!isServerPrecursorToken(token)) continue;
    try {
      const { state } = await request<{ state: LinkState }>(
        `/api/v1/declarations/${encodeURIComponent(precursorDocId(workspaceId, row.id))}/submissions/${encodeURIComponent(token as string)}`,
      );
      const stamp = typeof state?.updatedAt === "number" ? state.updatedAt : 0;
      if (!state || stamp <= (pulled[token as string] ?? 0)) continue;
      if (mergeAnswer(workspaceId, row.id, state)) changed.push(row.id);
      else if (state.slice && !row.smartLinkOpenedAt) {
        saveSupplier({ ...row, smartLinkOpenedAt: new Date(stamp).toISOString() });
        changed.push(row.id);
      }
      pulled[token as string] = stamp;
    } catch (cause) {
      // One dead link (revoked, expired) must not stop the others.
      console.warn(`[precursor-links] could not pull ${row.id}:`, cause);
    }
  }
  writeJson(PULLED_KEY, pulled);
  return changed;
}

/** Every workspace's precursors — for the smart-links overview. */
export async function pullAllPrecursorAnswers(): Promise<number> {
  if (!apiConfigured()) return 0;
  let changed = 0;
  for (const workspace of listWorkspaces()) changed += (await pullPrecursorAnswers(workspace.id)).length;
  return changed;
}

/* ── Supplier: open, autosave, submit ──────────────────────────── */

type Session = { token: string; workspaceId: string; nodeId: string; asker: string; state: LinkState; last: string };

let session: Session | null = null;

export const activePrecursorSession = (): Readonly<Session> | null => session;

function writeRow(workspaceId: string, node: Row): void {
  if (typeof node.id !== "string") return;
  const store = readJson<Record<string, Row[]>>(PRECURSORS_KEY, {});
  const rows = [...(store[workspaceId] ?? [])];
  const at = rows.findIndex((r) => r.id === node.id);
  if (at >= 0) rows[at] = { ...rows[at], ...node };
  else rows.push({ parentId: null, isScrap: false, dataOrigin: "supplier_verified", monthlyQuantities: [], origin: "purchased", seeTco2ePerT: null, ...node, workspaceId });
  store[workspaceId] = rows;
  writeJson(PRECURSORS_KEY, store);
}

/** Resolve a server-issued precursor link and load its row into this browser. */
export async function openPrecursorLink(token: string): Promise<PrecursorLinkView | null> {
  // Already open in this tab: this browser's copy is the newer one, and a
  // focus refetch re-applying the server's would undo typing since the last save.
  if (session?.token === token) {
    const open = getSupplier(session.workspaceId, session.nodeId);
    if (open) return { workspaceId: session.workspaceId, node: open, asker: session.asker, server: true };
  }
  const resolved = await request<Resolution>(`/api/v1/links/${encodeURIComponent(token)}`, { auth: false });
  const precursor = resolved.workspace?.precursor;
  if (resolved.kind !== "workspace" || !precursor || typeof precursor.node?.id !== "string") return null;
  const { workspaceId } = precursor;
  const nodeId = precursor.node.id;

  writeRow(workspaceId, precursor.node);
  mergeEvidence(workspaceId, nodeId, precursor.evidence);
  // What they already typed wins over the exporter's snapshot.
  const saved = resolved.state?.slice;
  if (saved?.node) writeRow(workspaceId, { ...pick(saved.node), id: nodeId });
  mergeEvidence(workspaceId, nodeId, saved?.evidence);

  const node = getSupplier(workspaceId, nodeId);
  if (!node) return null;
  session = {
    token,
    workspaceId,
    nodeId,
    asker: String(precursor.asker ?? ""),
    state: resolved.state ?? {},
    last: JSON.stringify(saved ?? null),
  };
  return { workspaceId, node, asker: session.asker, server: true };
}

/** Upload any attachment still only in this browser, and mark it as stored. */
async function uploadPendingFiles(s: Session): Promise<void> {
  const store = readJson<Record<string, Row[]>>(EVIDENCE_KEY, {});
  const items = store[s.workspaceId] ?? [];
  const key = evidenceKeyFor(s.nodeId);
  let changed = false;
  for (const item of items) {
    if (!Array.isArray(item.fieldKeys) || !(item.fieldKeys as unknown[]).includes(key)) continue;
    if (item.serverFileId || typeof item.fileDataUrl !== "string" || typeof item.id !== "string") continue;
    try {
      const blob = await (await fetch(item.fileDataUrl)).blob();
      const file = new File([blob], String(item.fileName ?? "evidence"), { type: blob.type });
      const stored = await uploadLinkFile(s.token, file, item.id);
      item.serverFileId = stored.id;
      changed = true;
    } catch (cause) {
      console.warn(`[precursor-links] ${String(item.fileName)} was not uploaded:`, cause);
    }
  }
  if (changed) writeJson(EVIDENCE_KEY, { ...store, [s.workspaceId]: items });
}

const sliceOf = (s: Session, draft: PrecursorSupplier) => ({
  node: pick(draft as unknown as Row),
  evidence: evidenceOf(s.workspaceId, s.nodeId),
});

/** Save the supplier's draft if anything changed since the last save. The
    form keeps its draft in React state, so it hands the draft in. */
export async function savePrecursorDraft(draft: PrecursorSupplier): Promise<boolean> {
  const s = session;
  if (!s || draft.id !== s.nodeId) return false;
  await uploadPendingFiles(s);
  const slice = sliceOf(s, draft);
  const serialised = JSON.stringify(slice);
  if (serialised === s.last) return false;
  const status = s.state.status === "submitted" ? "submitted" : "draft";
  s.state = await request<LinkState>(`/api/v1/links/${encodeURIComponent(s.token)}/state`, {
    method: "PUT",
    body: { state: { ...s.state, status, slice } },
    auth: false,
  });
  s.last = serialised;
  return true;
}

/** Submit through the server, which stamps the version. The form has no
    signatory fields, so the version is signed in the company's name. */
export async function submitPrecursorLink(draft: PrecursorSupplier): Promise<void> {
  const s = session;
  if (!s || draft.id !== s.nodeId) return;
  await uploadPendingFiles(s);
  const slice = sliceOf(s, draft);
  s.state = await request<LinkState>(`/api/v1/links/${encodeURIComponent(s.token)}/submit`, {
    method: "POST",
    body: {
      state: { ...s.state, slice },
      attestation: { signatoryName: draft.name || draft.installationName || "", signatoryRole: "Precursor supplier" },
      check: null,
    },
    auth: false,
  });
  s.last = JSON.stringify(slice);
}

/** Tests only. */
export function resetPrecursorSession(): void {
  session = null;
}

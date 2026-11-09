/* ════════════════════════════════════════════════════════════
   THE MONTHLY LINK, CARRIED BY THE SERVER

   /w/<token> used to be a browser-local form. The token was base64 of
   "ws|<workspaceId>|<month>", every answer was written to this browser's
   localStorage, and a supplier who opened the link on their own machine
   filled in a form whose answers never reached the exporter.

   Now the monthly link is an ordinary smart link (docs/API-CONTRACT.md §3):

     exporter  stores the workspace's supplier slice as a declaration document
               of kind "workspace" (id `ws-<workspaceId>`), mints a link for
               (workspace, month), and hands over /w/<server token>
     supplier  opens it with no account; the slice is written into THIS
               browser's stores, the form runs exactly as before, and every
               change is saved back to the link's state
     exporter  pulls each month's state and merges it into their own stores

   ── Why the stores stay the working copy ───────────────────────
   The supplier form is ~1,500 lines over eight localStorage stores. Moving
   each of them behind the API is D2, and still a decision. This file is the
   seam instead: everything reads and writes the same stores as before, and
   the server is where a slice of them travels between two browsers.

   Every store involved is keyed by workspace id, so "the slice" is simply
   store[workspaceId] for each key below, plus the workspace itself and its
   installation. Nothing here needs to know what a MonthlyEntry looks like.

   ── Files ───────────────────────────────────────────────────────
   Evidence bytes do not ride in the slice (a document is capped at 512 KB).
   A supplier's attachment is uploaded to the link's file store and its item
   keeps `serverFileId`; `fileDataUrl` is stripped from everything that goes
   up and never overwritten by what comes down.

   Legacy base64 tokens keep resolving locally: demo builds and links already
   handed out must not break.
   ════════════════════════════════════════════════════════════ */

import { apiConfigured } from "./api/config";
import { request } from "./api/http";
import { uploadLinkFile } from "./api/files";
import type { WorkspaceRequest } from "./workspace-link";
import { defaultMonthFor } from "./workspace-link";
import { getWorkspace, monthsOf } from "./workspace";

/* ── The stores a monthly link moves ───────────────────────────── */

const WORKSPACES_KEY = "certrace:workspaces";
const INSTALLATIONS_KEY = "certrace:installations";

/** Every store here is Record<workspaceId, …>. */
export const WORKSPACE_STORE_KEYS = [
  "certrace:monthly-data",
  "certrace:month-submissions",
  "certrace:precursor-suppliers",
  "certrace:workspace-evidence",
  "certrace:workspace-mmd-draft",
  "certrace:workspace-mmd-versions",
  /* Which months the exporter has sent. The plant only READS it — to open the months it has been asked for — and the merge back to the
     exporter below takes the month's answers, never this. */
  "certrace:month-dispatch",
] as const;

const EVIDENCE_KEY = "certrace:workspace-evidence";

/** Exporter side: which server token carries which (workspace, month). */
const LINKS_KEY = "certrace:workspace-server-links";
/** Exporter side: the updatedAt of each link state already merged in. */
const PULLED_KEY = "certrace:workspace-links-pulled";

export type WorkspaceSlice = {
  workspace: Record<string, unknown> | null;
  installation: Record<string, unknown> | null;
  stores: Record<string, unknown>;
};

type WorkspaceLinkState = {
  token?: string;
  status?: string;
  slice?: WorkspaceSlice;
  updatedAt?: number;
  [key: string]: unknown;
};

type WorkspaceResolution = {
  token: string;
  kind?: string;
  declId: string;
  supplierId: string;
  month?: string | null;
  exporter: { companyName: string };
  workspace: WorkspaceSlice;
  state: WorkspaceLinkState;
};

type Row = Record<string, unknown> & { id?: unknown };

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

export const workspaceDocId = (workspaceId: string): string => `ws-${workspaceId}`;

/* ── Collect and apply ─────────────────────────────────────────── */

const withoutFileBytes = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map((item) => {
        if (!item || typeof item !== "object") return item;
        const rest = { ...(item as Row) };
        delete rest.fileDataUrl;
        return rest;
      })
    : value;

/** This workspace's share of every store, with no file bytes in it. */
export function collectSlice(workspaceId: string): WorkspaceSlice {
  const workspace = readJson<Row[]>(WORKSPACES_KEY, []).find((w) => w.id === workspaceId) ?? null;
  const installationId = workspace?.installationId;
  const installation =
    typeof installationId === "string" && installationId
      ? (readJson<Row[]>(INSTALLATIONS_KEY, []).find((i) => i.id === installationId) ?? null)
      : null;
  const stores: Record<string, unknown> = {};
  for (const key of WORKSPACE_STORE_KEYS) {
    const value = readJson<Record<string, unknown>>(key, {})[workspaceId];
    if (value !== undefined) stores[key] = key === EVIDENCE_KEY ? withoutFileBytes(value) : value;
  }
  return { workspace, installation, stores };
}

function upsertById(key: string, row: Row | null): void {
  if (!row || typeof row.id !== "string") return;
  const all = readJson<Row[]>(key, []);
  const at = all.findIndex((r) => r.id === row.id);
  if (at >= 0) all[at] = { ...all[at], ...row };
  else all.push(row);
  writeJson(key, all);
}

/** Evidence coming down keeps any bytes this browser already holds for it. */
function mergeEvidence(local: unknown, incoming: unknown): unknown {
  if (!Array.isArray(incoming)) return incoming;
  const bytes = new Map<string, unknown>();
  if (Array.isArray(local)) {
    for (const item of local as Row[]) {
      if (typeof item?.id === "string" && item.fileDataUrl) bytes.set(item.id, item.fileDataUrl);
    }
  }
  return (incoming as Row[]).map((item) =>
    typeof item?.id === "string" && bytes.has(item.id) ? { ...item, fileDataUrl: bytes.get(item.id) } : item,
  );
}

/** Write a whole slice into this browser's stores, replacing this workspace's share. */
export function applySlice(workspaceId: string, slice: WorkspaceSlice | undefined | null): void {
  if (!slice) return;
  upsertById(WORKSPACES_KEY, slice.workspace);
  upsertById(INSTALLATIONS_KEY, slice.installation);
  for (const key of WORKSPACE_STORE_KEYS) {
    if (!(key in (slice.stores ?? {}))) continue;
    const store = readJson<Record<string, unknown>>(key, {});
    const incoming = slice.stores[key];
    store[workspaceId] = key === EVIDENCE_KEY ? mergeEvidence(store[workspaceId], incoming) : incoming;
    writeJson(key, store);
  }
}

/* ── Month-scoped merge, for the exporter ──────────────────────────
   A supplier answers one month. What comes back replaces THAT month and
   upserts the rows they could touch; it must never wipe another month the
   exporter holds, or rows the supplier's snapshot predates. */

const monthOf = (row: unknown): unknown => (row && typeof row === "object" ? (row as Row).month : undefined);

function mergeRowsById(local: unknown, incoming: unknown, keep: (row: Row) => boolean = () => true): Row[] {
  const out = new Map<string, Row>();
  for (const row of Array.isArray(local) ? (local as Row[]) : []) {
    if (typeof row?.id === "string") out.set(row.id, row);
  }
  for (const row of Array.isArray(incoming) ? (incoming as Row[]) : []) {
    if (typeof row?.id === "string" && keep(row)) out.set(row.id, { ...(out.get(row.id) ?? {}), ...row });
  }
  return [...out.values()];
}

export function mergeMonthFromSupplier(workspaceId: string, month: string, slice: WorkspaceSlice): void {
  const stores = slice.stores ?? {};

  // The month's own entry: theirs replaces ours, every other month stays.
  const monthly = readJson<Record<string, Row[]>>("certrace:monthly-data", {});
  const incomingEntry = (Array.isArray(stores["certrace:monthly-data"]) ? (stores["certrace:monthly-data"] as Row[]) : []).find(
    (row) => monthOf(row) === month,
  );
  if (incomingEntry) {
    monthly[workspaceId] = [...(monthly[workspaceId] ?? []).filter((row) => monthOf(row) !== month), incomingEntry];
    writeJson("certrace:monthly-data", monthly);
  }

  // The month's submission record (attestation, state).
  const submissions = readJson<Record<string, Record<string, unknown>>>("certrace:month-submissions", {});
  const incomingSubmission = (stores["certrace:month-submissions"] as Record<string, unknown> | undefined)?.[month];
  if (incomingSubmission) {
    submissions[workspaceId] = { ...(submissions[workspaceId] ?? {}), [month]: incomingSubmission };
    writeJson("certrace:month-submissions", submissions);
  }

  // Evidence for this month, and precursor rows: upserted by id.
  const evidence = readJson<Record<string, Row[]>>(EVIDENCE_KEY, {});
  evidence[workspaceId] = mergeEvidence(
    evidence[workspaceId],
    mergeRowsById(evidence[workspaceId], stores[EVIDENCE_KEY], (row) => monthOf(row) === month),
  ) as Row[];
  writeJson(EVIDENCE_KEY, evidence);

  const precursors = readJson<Record<string, Row[]>>("certrace:precursor-suppliers", {});
  if (Array.isArray(stores["certrace:precursor-suppliers"])) {
    precursors[workspaceId] = mergeRowsById(precursors[workspaceId], stores["certrace:precursor-suppliers"]);
    writeJson("certrace:precursor-suppliers", precursors);
  }

  // The installation and the monitoring methodology are "correctable here"
  // on the supplier's side: their latest word stands.
  upsertById(INSTALLATIONS_KEY, slice.installation);
  const draft = (stores["certrace:workspace-mmd-draft"] as unknown) ?? undefined;
  if (draft !== undefined) {
    const drafts = readJson<Record<string, unknown>>("certrace:workspace-mmd-draft", {});
    drafts[workspaceId] = draft;
    writeJson("certrace:workspace-mmd-draft", drafts);
  }
}

/* ── Exporter: hand over a server link ─────────────────────────── */

type LinkIndex = Record<string, Record<string, string>>;

export const cachedWorkspaceToken = (workspaceId: string, month: string): string | null =>
  readJson<LinkIndex>(LINKS_KEY, {})[workspaceId]?.[month] ?? null;

const linkUrl = (token: string): string =>
  typeof window === "undefined" ? `/w/${token}` : `${window.location.origin}/w/${token}`;

/** Refresh the supplier's slice on the server. Called before every hand-over,
    so a link opened next week shows the installation as it is next week. */
export async function publishWorkspace(workspaceId: string): Promise<void> {
  const supplierView = collectSlice(workspaceId);
  await request(`/api/v1/declarations/${encodeURIComponent(workspaceDocId(workspaceId))}`, {
    method: "PUT",
    body: { kind: "workspace", title: String(supplierView.workspace?.name ?? ""), supplierView },
  });
}

/** The URL to give the supplier for one month — minted once, then reused.
    Null when there is no backend: the caller falls back to the local link. */
export async function ensureWorkspaceLink(workspaceId: string, month: string): Promise<string | null> {
  if (!apiConfigured()) return null;
  await publishWorkspace(workspaceId);
  const cached = cachedWorkspaceToken(workspaceId, month);
  if (cached) return linkUrl(cached);
  const minted = await request<{ token: string }>(
    `/api/v1/declarations/${encodeURIComponent(workspaceDocId(workspaceId))}/links`,
    { method: "POST", body: { supplierId: workspaceId, month } },
  );
  const index = readJson<LinkIndex>(LINKS_KEY, {});
  index[workspaceId] = { ...(index[workspaceId] ?? {}), [month]: minted.token };
  writeJson(LINKS_KEY, index);
  return linkUrl(minted.token);
}

/** Pull every month a supplier has touched since the last pull. Returns the
    months that changed, so the caller knows whether to refresh anything. */
export async function pullWorkspaceAnswers(workspaceId: string): Promise<string[]> {
  if (!apiConfigured()) return [];
  const months = readJson<LinkIndex>(LINKS_KEY, {})[workspaceId] ?? {};
  const pulled = readJson<Record<string, number>>(PULLED_KEY, {});
  const changed: string[] = [];
  for (const [month, token] of Object.entries(months)) {
    try {
      const { state } = await request<{ state: WorkspaceLinkState }>(
        `/api/v1/declarations/${encodeURIComponent(workspaceDocId(workspaceId))}/submissions/${encodeURIComponent(token)}`,
      );
      const stamp = typeof state?.updatedAt === "number" ? state.updatedAt : 0;
      if (!state?.slice || stamp <= (pulled[token] ?? 0)) continue;
      mergeMonthFromSupplier(workspaceId, month, state.slice);
      pulled[token] = stamp;
      changed.push(month);
    } catch (cause) {
      // One dead link (revoked, expired) must not stop the others.
      console.warn(`[workspace-links] could not pull ${month}:`, cause);
    }
  }
  writeJson(PULLED_KEY, pulled);
  return changed;
}

/* ── Supplier: open, autosave, submit ──────────────────────────── */

type Session = { token: string; workspaceId: string; month: string; state: WorkspaceLinkState; last: string };

let session: Session | null = null;

export const activeLinkSession = (): Readonly<Session> | null => session;

/** A server token is not base64 of "ws|…". */
export function isServerToken(token: string): boolean {
  try {
    return !atob(token.replace(/-/g, "+").replace(/_/g, "/")).startsWith("ws|");
  } catch {
    return true;
  }
}

/** Resolve a server-issued monthly link and load its slice into this browser. */
export async function openWorkspaceLink(token: string): Promise<WorkspaceRequest | null> {
  // Already open in this tab: this browser's stores are the newer copy. The
  // query behind the page refetches on focus, and re-applying the server's
  // slice then would overwrite whatever was typed since the last autosave.
  if (session?.token === token) {
    const open = getWorkspace(session.workspaceId);
    if (open) return { workspace: open, month: session.month, months: [session.month] };
  }
  const resolved = await request<WorkspaceResolution>(`/api/v1/links/${encodeURIComponent(token)}`, { auth: false });
  if (resolved.kind !== "workspace") return null;
  const workspaceId = String(resolved.workspace?.workspace?.id ?? resolved.supplierId);
  applySlice(workspaceId, resolved.workspace);
  // What they already typed wins over the exporter's snapshot.
  applySlice(workspaceId, resolved.state?.slice);

  const workspace = getWorkspace(workspaceId);
  if (!workspace) return null;
  const months = monthsOf(workspace);
  const month = resolved.month && months.includes(resolved.month) ? resolved.month : defaultMonthFor(workspace);
  session = { token, workspaceId, month, state: resolved.state ?? {}, last: JSON.stringify(collectSlice(workspaceId)) };
  // One server link is one month: the picker offers only that one.
  return { workspace, month, months: [month] };
}

/** Upload any attachment still only in this browser, and mark it as stored. */
async function uploadPendingFiles(s: Session): Promise<void> {
  const evidence = readJson<Record<string, Row[]>>(EVIDENCE_KEY, {});
  const items = evidence[s.workspaceId] ?? [];
  let changed = false;
  for (const item of items) {
    if (item.serverFileId || typeof item.fileDataUrl !== "string" || typeof item.id !== "string") continue;
    try {
      const blob = await (await fetch(item.fileDataUrl)).blob();
      const file = new File([blob], String(item.fileName ?? "evidence"), { type: blob.type });
      const stored = await uploadLinkFile(s.token, file, item.id);
      item.serverFileId = stored.id;
      changed = true;
    } catch (cause) {
      console.warn(`[workspace-links] ${String(item.fileName)} was not uploaded:`, cause);
    }
  }
  if (changed) writeJson(EVIDENCE_KEY, { ...evidence, [s.workspaceId]: items });
}

/** Save the supplier's slice if anything changed since the last save. */
export async function saveLinkIfChanged(): Promise<boolean> {
  const s = session;
  if (!s) return false;
  await uploadPendingFiles(s);
  const slice = collectSlice(s.workspaceId);
  const serialised = JSON.stringify(slice);
  if (serialised === s.last) return false;
  const status = s.state.status === "submitted" ? "submitted" : "draft";
  s.state = await request<WorkspaceLinkState>(`/api/v1/links/${encodeURIComponent(s.token)}/state`, {
    method: "PUT",
    body: { state: { ...s.state, status, slice } },
    auth: false,
  });
  s.last = serialised;
  return true;
}

/** Submit through the server, which stamps the version and the signer. */
export async function submitWorkspaceLink(attestation: { signatoryName: string; signatoryRole: string }, check: { score: number; warnings: number }): Promise<void> {
  const s = session;
  if (!s) return;
  await uploadPendingFiles(s);
  const slice = collectSlice(s.workspaceId);
  s.state = await request<WorkspaceLinkState>(`/api/v1/links/${encodeURIComponent(s.token)}/submit`, {
    method: "POST",
    body: { state: { ...s.state, slice }, attestation, check },
    auth: false,
  });
  s.last = JSON.stringify(slice);
}

/** Tests only. */
export function resetLinkSession(): void {
  session = null;
}

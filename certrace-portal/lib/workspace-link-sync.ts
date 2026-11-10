import { loadDocumentFile } from "./document-files";
import {
  accountStorage,
  flushAccount,
  refreshAccountRecords,
  publicScope,
} from "./account-storage";
/* ════════════════════════════════════════════════════════════
   THE MONTHLY LINK, CARRIED BY THE SERVER

   /w/<token> used to be a browser-local form. The token was base64 of
   "ws|<workspaceId>|<month>", every answer was written to this browser's
   browser storage, and a supplier who opened the link on their own machine
   filled in a form whose answers never reached the exporter.

   Now the monthly link is an ordinary smart link:

     exporter  stores the workspace's supplier slice as a declaration document
               of kind "workspace" (id `ws-<workspaceId>`), mints a link for
               (workspace, month), and hands over /w/<server token>
     supplier  opens it with no account; the slice is written into THIS
               browser's stores, the form runs exactly as before, and every
               change is saved back to the link's state
     exporter  refreshes the account records promoted by the server on submission

   ── Why the stores stay the working copy ───────────────────────
   The supplier form uses an isolated in-memory working copy. This file sends
   a slice of that copy through the link API between the two browsers.

   Every store involved is keyed by workspace id, so "the slice" is simply
   store[workspaceId] for each key below, plus the workspace itself and its
   installation. Nothing here needs to know what a MonthlyEntry looks like.

   ── Files ───────────────────────────────────────────────────────
   Evidence bytes do not ride in the slice (a document is capped at 512 KB).
   A supplier's attachment is uploaded to the link's file store and its item
   keeps `serverFileId`; `fileDataUrl` is stripped from everything that goes
   up and never overwritten by what comes down.

   Only server-issued tokens resolve in the public form.
   ════════════════════════════════════════════════════════════ */

import { apiConfigured } from "./api/config";
import { api, result } from "./api/client";
import { decode, jsonDocument } from "./api/decode";
import {
  isWorkspaceResolution,
  isWorkspaceLinkState,
} from "./api/validators.js";
import { uploadLinkFile } from "./api/files";
import type { WorkspaceRequest } from "./workspace-link";
import { defaultMonthFor } from "./workspace-link";
import { getWorkspace, monthsOf } from "./workspace";
import {
  approveEditRequest,
  requestRevision,
  submissionFor,
} from "./month-submission";
import { reopenMonth } from "./monthly-data";

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
] as const;

const EVIDENCE_KEY = "certrace:workspace-evidence";

/** Exporter side: which server token carries which (workspace, month). */
const LINKS_KEY = "certrace:workspace-server-links";

export type WorkspaceSlice = {
  workspace: Record<string, unknown> | null;
  installation: Record<string, unknown> | null;
  stores: Record<string, unknown>;
};

export type WorkspaceLinkState = {
  token?: string;
  status?: string;
  slice?: WorkspaceSlice;
  updatedAt?: number;
  [key: string]: unknown;
};

export type WorkspaceResolution = {
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
    const raw = accountStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  accountStorage.setItem(key, JSON.stringify(value));
}

export const workspaceDocId = (workspaceId: string): string =>
  `ws-${workspaceId}`;

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
  const workspace =
    readJson<Row[]>(WORKSPACES_KEY, []).find((w) => w.id === workspaceId) ??
    null;
  const installationId = workspace?.installationId;
  const installation =
    typeof installationId === "string" && installationId
      ? (readJson<Row[]>(INSTALLATIONS_KEY, []).find(
          (i) => i.id === installationId,
        ) ?? null)
      : null;
  const stores: Record<string, unknown> = {};
  for (const key of WORKSPACE_STORE_KEYS) {
    const value = readJson<Record<string, unknown>>(key, {})[workspaceId];
    if (value !== undefined)
      stores[key] = key === EVIDENCE_KEY ? withoutFileBytes(value) : value;
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
      if (typeof item?.id === "string" && item.fileDataUrl)
        bytes.set(item.id, item.fileDataUrl);
    }
  }
  return (incoming as Row[]).map((item) =>
    typeof item?.id === "string" && bytes.has(item.id)
      ? { ...item, fileDataUrl: bytes.get(item.id) }
      : item,
  );
}

/** Write a whole slice into this browser's stores, replacing this workspace's share. */
export function applySlice(
  workspaceId: string,
  slice: WorkspaceSlice | undefined | null,
): void {
  if (!slice) return;
  upsertById(WORKSPACES_KEY, slice.workspace);
  upsertById(INSTALLATIONS_KEY, slice.installation);
  for (const key of WORKSPACE_STORE_KEYS) {
    if (!(key in (slice.stores ?? {}))) continue;
    const store = readJson<Record<string, unknown>>(key, {});
    const incoming = slice.stores[key];
    store[workspaceId] =
      key === EVIDENCE_KEY
        ? mergeEvidence(store[workspaceId], incoming)
        : incoming;
    writeJson(key, store);
  }
}

/* ── Exporter: hand over a server link ─────────────────────────── */

type LinkIndex = Record<string, Record<string, string>>;

export const cachedWorkspaceToken = (
  workspaceId: string,
  month: string,
): string | null => {
  const token = readJson<LinkIndex>(LINKS_KEY, {})[workspaceId]?.[month];
  return token && isServerToken(token) ? token : null;
};

const linkUrl = (token: string): string =>
  typeof window === "undefined"
    ? `/w/${token}`
    : `${window.location.origin}/w/${token}`;

/** Refresh the supplier's slice on the server. Called before every hand-over,
    so a link opened next week shows the installation as it is next week. */
export async function publishWorkspace(workspaceId: string): Promise<void> {
  const supplierView = collectSlice(workspaceId);
  await result(
    api()
      .api.v1.declarations({
        declaration_id: encodeURIComponent(workspaceDocId(workspaceId)),
      })
      .put(
        jsonDocument({
          kind: "workspace",
          title: String(supplierView.workspace?.name ?? ""),
          supplierView,
        }),
      ),
  );
}

/** The durable URL to give the supplier for one month, reused after creation. */
export async function ensureWorkspaceLink(
  workspaceId: string,
  month: string,
): Promise<string | null> {
  if (!apiConfigured()) return null;
  await flushAccount();
  await publishWorkspace(workspaceId);
  const cached = cachedWorkspaceToken(workspaceId, month);
  if (cached) return linkUrl(cached);
  const minted = await result(
    api()
      .api.v1.declarations({
        declaration_id: encodeURIComponent(workspaceDocId(workspaceId)),
      })
      .links.post({ supplierId: workspaceId, month }),
  );
  const index = readJson<LinkIndex>(LINKS_KEY, {});
  index[workspaceId] = { ...(index[workspaceId] ?? {}), [month]: minted.token };
  writeJson(LINKS_KEY, index);
  await flushAccount();
  return linkUrl(minted.token);
}

/** Supplier submissions are promoted atomically by the backend. Refresh the
 * account instead of re-merging an older supplier snapshot over owner edits. */
export async function pullWorkspaceAnswers(
  workspaceId: string,
): Promise<string[]> {
  const before = JSON.stringify(collectSlice(workspaceId));
  await refreshAccountRecords();
  return before === JSON.stringify(collectSlice(workspaceId))
    ? []
    : Object.keys(readJson<LinkIndex>(LINKS_KEY, {})[workspaceId] ?? {});
}

/* ── Supplier: open, autosave, submit ──────────────────────────── */

type Session = {
  token: string;
  workspaceId: string;
  month: string;
  state: WorkspaceLinkState;
  last: string;
  writes: Promise<unknown>;
  scope: string | null;
};

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
export async function openWorkspaceLink(
  token: string,
): Promise<WorkspaceRequest | null> {
  const scope = publicScope();
  const prior = session;
  if (prior?.token === token && prior.scope === scope)
    await prior.writes.catch(() => {});
  // Already open in this tab: this browser's stores are the newer copy. The
  // query behind the page refetches on focus, and re-applying the server's
  // slice then would overwrite whatever was typed since the last autosave.
  if (
    session?.token === token &&
    session.scope === scope &&
    session.state.status !== "submitted"
  ) {
    const open = getWorkspace(session.workspaceId);
    if (open)
      return { workspace: open, month: session.month, months: [session.month] };
  }
  const resolved = decode(
    await result(
      api(false)
        .api.v1.links({ token: encodeURIComponent(token) })
        .get(),
    ),
    isWorkspaceResolution,
  );
  if (publicScope() !== scope || session !== prior) return null;
  if (resolved.kind !== "workspace") return null;
  const workspaceId = String(
    resolved.workspace?.workspace?.id ?? resolved.supplierId,
  );
  applySlice(workspaceId, resolved.workspace);
  // What they already typed wins over the exporter's snapshot.
  applySlice(workspaceId, resolved.state?.slice);

  const workspace = getWorkspace(workspaceId);
  if (!workspace) return null;
  const months = monthsOf(workspace);
  const month =
    resolved.month && months.includes(resolved.month)
      ? resolved.month
      : defaultMonthFor(workspace);
  session = {
    token,
    workspaceId,
    month,
    state: resolved.state ?? {},
    last: JSON.stringify(collectSlice(workspaceId)),
    writes: Promise.resolve(),
    scope,
  };
  // One server link is one month: the picker offers only that one.
  return { workspace, month, months: [month] };
}

/** Upload any attachment still only in this browser, and mark it as stored. */
async function uploadPendingFiles(s: Session): Promise<void> {
  const evidence = readJson<Record<string, Row[]>>(EVIDENCE_KEY, {});
  const items = evidence[s.workspaceId] ?? [];
  for (const item of items) {
    if (item.serverFileId || typeof item.id !== "string") continue;
    try {
      const blob =
        typeof item.fileDataUrl === "string"
          ? await (await fetch(item.fileDataUrl)).blob()
          : typeof item.localFileId === "string"
            ? await loadDocumentFile(item.localFileId)
            : undefined;
      if (!blob) continue;
      const file = new File([blob], String(item.fileName ?? "evidence"), {
        type: blob.type,
      });
      const stored = await uploadLinkFile(s.token, file, item.id);
      if (session !== s || publicScope() !== s.scope)
        throw new Error("This link changed during upload.");
      // Preserve files attached or removed while this upload was in flight.
      const current = readJson<Record<string, Row[]>>(EVIDENCE_KEY, {});
      current[s.workspaceId] = (current[s.workspaceId] ?? []).map((row) =>
        row.id === item.id ? { ...row, serverFileId: stored.id } : row,
      );
      writeJson(EVIDENCE_KEY, current);
    } catch (cause) {
      throw new Error(
        `Could not upload ${String(item.fileName)}. Your submission has not been saved.`,
        { cause },
      );
    }
  }
  if (session !== s || publicScope() !== s.scope)
    throw new Error("This link changed. Reopen it before saving.");
}

/** Autosave and submit share one queue: a late draft must never undo a submission. */
function writeLink<T>(s: Session, action: () => Promise<T>): Promise<T> {
  const job = s.writes
    .catch(() => {})
    .then(async () => {
      if (session !== s || publicScope() !== s.scope)
        throw new Error("This link changed. Reopen it before saving.");
      return action();
    });
  s.writes = job;
  return job;
}

/** Save the supplier's slice if anything changed since the last save. */
export function saveLinkIfChanged(): Promise<boolean> {
  const s = session;
  if (!s) return Promise.resolve(false);
  return writeLink(s, async () => {
    await uploadPendingFiles(s);
    const slice = collectSlice(s.workspaceId);
    const serialised = JSON.stringify(slice);
    if (serialised === s.last) return false;
    const status = s.state.status === "submitted" ? "submitted" : "draft";
    s.state = decode(
      await result(
        api(false)
          .api.v1.links({ token: encodeURIComponent(s.token) })
          .state.put({ state: jsonDocument({ ...s.state, status, slice }) }),
      ),
      isWorkspaceLinkState,
    );
    s.last = serialised;
    return true;
  });
}

/** Submit through the server, which stamps the version and the signer. */
export async function submitWorkspaceLink(
  attestation: { signatoryName: string; signatoryRole: string },
  check: { score: number; warnings: number },
): Promise<void> {
  const s = session;
  if (!s) throw new Error("Reopen the supplier link before submitting.");
  await writeLink(s, async () => {
    await uploadPendingFiles(s);
    const slice = collectSlice(s.workspaceId);
    s.state = decode(
      await result(
        api(false)
          .api.v1.links({ token: encodeURIComponent(s.token) })
          .submit.post({
            state: jsonDocument({ ...s.state, slice }),
            attestation: attestation,
            check: check,
          }),
      ),
      isWorkspaceLinkState,
    );
    // Only acknowledged server state may lock the form and supply its signature.
    if (session === s && publicScope() === s.scope) {
      applySlice(s.workspaceId, s.state.slice);
      s.last = JSON.stringify(collectSlice(s.workspaceId));
    }
  });
}

/** Reopen both copies atomically; the server uses the owner's latest saved figures. */
export async function requestWorkspaceRevision(
  workspaceId: string,
  month: string,
  note: string,
  areas: string[] = [],
  approvalBy?: string,
) {
  await flushAccount();
  const token = cachedWorkspaceToken(workspaceId, month);
  if (!token) {
    // Own-site months have no public link to reopen.
    const next = approvalBy
      ? approveEditRequest(workspaceId, month, approvalBy)
      : requestRevision(workspaceId, month, note, areas);
    reopenMonth(workspaceId, month);
    await flushAccount();
    return next;
  }
  await result(
    api()
      .api.v1.declarations({
        declaration_id: encodeURIComponent(workspaceDocId(workspaceId)),
      })
      .links({ token: encodeURIComponent(token) })
      .revision.post({
        note,
        areas,
        action: approvalBy ? "approve_edit" : "revision",
      }),
  );
  await refreshAccountRecords();
  return submissionFor(workspaceId, month);
}

/** Tests only. */
export function resetLinkSession(): void {
  session = null;
}

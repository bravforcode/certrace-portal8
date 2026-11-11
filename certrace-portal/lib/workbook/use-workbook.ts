"use client";

/* The workspace's data, read from and written to the shared server workbook
   (lib/api/workbooks.ts). Two hooks:

   - useWorkbookYears(installationId): which years exist and their set-up meta
     (syncing / ready, files, copy source).
   - useWorkbook(installationId, year): the cells of one year. Typed values go
     through the save runner (save-runner.ts), which keeps them per account,
     installation and year, sends one batch at a time, and shows them on screen
     until the server has them. */

import * as React from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { loadSession, onSessionChange } from "../api/session";
import {
  getWorkbook,
  listWorkbooks,
  patchWorkbookCells,
  putWorkbookMeta,
  type Workbook,
  type WorkbookMeta,
} from "../api/workbooks";
import { sheetsFromCells } from "./cells";
import { clearBatches, pendingFor } from "./save-queue";
import { SaveRunner } from "./save-runner";
import type { Sheet, WorkspaceFile } from "../workspace-sheets";

/** How long the set-up takes after Confirm. */
export const SETUP_MS = 60_000;
const POLL_MS = 10_000;
const YEARS_POLL_MS = 30_000;
/** The server takes at most 2000 cells in one patch. */
const CHUNK = 2000;

/** A year that exists: its meta, with the files always present. */
export type WorkbookYear = WorkbookMeta & { status: "syncing" | "ready"; files: WorkspaceFile[] };

const nowIso = () => new Date().toISOString();
const currentAccount = () => loadSession()?.user.id ?? null;

/** Best effort: delete cells by patching them to null, in chunks. A failed chunk is skipped. */
async function clearCells(iid: string, year: number, keys: string[]) {
  for (const batch of clearBatches(keys)) {
    try {
      await patchWorkbookCells(iid, year, batch);
    } catch {
      // Leftover cells are overwritten by the next copy or stay hidden under a reset meta.
    }
  }
}

/** A year with cells but no meta (left by a failed copy) must not show old cells under a new start. */
async function clearLeftovers(iid: string, year: number) {
  const existing = await getWorkbook(iid, year).catch(() => null);
  if (existing?.changed && !existing.meta?.status) await clearCells(iid, year, Object.keys(existing.cells));
}

/* ── save runner: one per browser tab, shared by every year and installation ── */

let queryClient: QueryClient | null = null;

const runner = new SaveRunner<Workbook>({
  patch: (t, cells) => patchWorkbookCells(t.iid, t.year, cells),
  onSaved: (t, saved) => {
    // Only the account that typed the edit may update the cache it reads.
    if (queryClient && t.accountId === currentAccount()) queryClient.setQueryData(["workbook", t.iid, t.year], saved);
  },
  notify: (message, detail) => toast({ message, tone: "err", detail }),
  account: currentAccount,
  now: () => Date.now(),
  setTimer: (fn, ms) => window.setTimeout(fn, ms),
  clearTimer: (h) => window.clearTimeout(h as number),
});

if (typeof window !== "undefined") {
  onSessionChange((s) => runner.onAccountChange(s?.user.id ?? null));
}

const subscribeQueue = (fn: () => void) => runner.subscribe(fn);
const queueSnapshot = () => runner.snapshot();

export function useWorkbookYears(installationId: string | null) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["workbook-years", installationId],
    queryFn: () => listWorkbooks(installationId!),
    enabled: Boolean(installationId),
    staleTime: 0,
    refetchInterval: YEARS_POLL_MS,
    refetchIntervalInBackground: false,
  });
  const years = query.data?.years ?? [];
  if (installationId && query.data) seedWalkin(installationId, years);

  const get = (year: number): WorkbookYear | undefined => {
    const meta = years.find((y) => y.year === year)?.meta as WorkbookMeta | undefined;
    if (!meta?.status) return undefined;
    return { ...meta, status: meta.status, files: meta.files ?? [] };
  };

  const write = async (year: number, meta: WorkbookMeta) => {
    if (!installationId) return;
    try {
      await putWorkbookMeta(installationId, year, meta);
      await qc.invalidateQueries({ queryKey: ["workbook-years", installationId] });
      await qc.invalidateQueries({ queryKey: ["workbook", installationId, year] });
    } catch (e) {
      toast({ message: "Your change was not saved", tone: "err", detail: (e as Error).message });
    }
  };

  /** Confirm the upload: the year is set up from these files and closed to more. */
  const confirm = (year: number, files: WorkspaceFile[]) =>
    write(year, { status: "syncing", files, confirmedAt: nowIso() });

  /**
   * Start a year from an earlier one. The year is first marked syncing with no
   * confirmedAt, so the auto-ready timer never fires during the copy. If the copy
   * fails, the year's meta is cleared so it disappears and copying can run again.
   */
  const copy = async (year: number, from: number) => {
    if (!installationId) return;
    const written: string[] = [];
    try {
      const src = await getWorkbook(installationId, from);
      if (!src.changed) return;
      const files = src.meta.files ?? [];
      await clearLeftovers(installationId, year);
      await putWorkbookMeta(installationId, year, { status: "syncing", files, blank: src.meta.blank, copiedFrom: from });
      const entries = Object.entries(src.cells);
      written.push(...entries.map(([k]) => k));
      for (let i = 0; i < entries.length; i += CHUNK)
        await patchWorkbookCells(installationId, year, Object.fromEntries(entries.slice(i, i + CHUNK)));
      await putWorkbookMeta(installationId, year, {
        status: "ready",
        files,
        blank: src.meta.blank,
        confirmedAt: nowIso(),
        copiedFrom: from,
      });
      await qc.invalidateQueries({ queryKey: ["workbook-years", installationId] });
      await qc.invalidateQueries({ queryKey: ["workbook", installationId, year] });
    } catch (e) {
      // Remove the cells already written, then reset meta so the year disappears and can be copied again.
      await clearCells(installationId, year, written);
      try {
        await putWorkbookMeta(installationId, year, {});
      } catch {
        // The reset itself failed; the year stays syncing until a retry overwrites it.
      }
      await qc.invalidateQueries({ queryKey: ["workbook-years", installationId] });
      toast({ message: "Your change was not saved", tone: "err", detail: (e as Error).message });
    }
  };

  /** Start from the beginning: no files, empty sheets, open at once. */
  const startBlank = async (year: number) => {
    if (!installationId) return;
    await clearLeftovers(installationId, year);
    await write(year, { status: "ready", files: [], blank: true, confirmedAt: nowIso() });
  };

  /** The set-up has finished. The walk-in for this year is per browser (see walkinPending). */
  const markReady = (year: number) => {
    const rec = get(year);
    if (rec) return write(year, { ...rec, status: "ready" });
  };

  /** This browser has seen the walk-in for this year; the team's meta is untouched. */
  const markRevealed = (year: number) => {
    const rec = get(year);
    if (rec && installationId) rememberWalkin(installationId, year, rec.confirmedAt);
  };

  return {
    loaded: Boolean(installationId) && query.isSuccess,
    years,
    get,
    confirm,
    copy,
    startBlank,
    markReady,
    markRevealed,
  };
}

/* ── walk-in, per browser ──────────────────────────────────────────────── */

const WALKIN_KEY = "certrace:workbook-walkin-seen";
const walkinId = (iid: string, year: number, confirmedAt: string | undefined) => `${iid}:${year}:${confirmedAt ?? ""}`;

function readSeen(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(WALKIN_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function rememberWalkin(iid: string, year: number, confirmedAt: string | undefined) {
  try {
    const seen = readSeen();
    const k = walkinId(iid, year, confirmedAt);
    if (!seen.includes(k)) window.localStorage.setItem(WALKIN_KEY, JSON.stringify([...seen, k].slice(-200)));
  } catch {
    // Storage blocked: the walk-in simply shows again next time.
  }
}

/** First load in a browser: every year that is already ready counts as seen, so only years set up from now on play the walk-in. */
function seedWalkin(iid: string, years: { year: number; meta: unknown }[]) {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(WALKIN_KEY) !== null) return;
    const seen = years
      .map((y) => y.meta as WorkbookMeta | undefined)
      .map((m, i) => (m?.status === "ready" ? walkinId(iid, years[i].year, m.confirmedAt) : null))
      .filter((x): x is string => x !== null);
    window.localStorage.setItem(WALKIN_KEY, JSON.stringify(seen));
  } catch {
    // Storage blocked: the walk-in may show once for existing years.
  }
}

/** Whether this browser should play the "it's ready" walk-in for a year. Blank and copied years never play it. */
export function walkinPending(iid: string | null, year: number, rec: WorkbookYear | undefined): boolean {
  if (!iid || !rec || rec.status !== "ready" || rec.blank || rec.copiedFrom) return false;
  if (typeof window === "undefined") return false;
  return !readSeen().includes(walkinId(iid, year, rec.confirmedAt));
}

/** The cells of one installation and year. `saveEdit` takes a "sheet:row:col" key; an empty value deletes it. */
export function useWorkbook(installationId: string | null, year: number) {
  const qc = useQueryClient();
  queryClient = qc;
  const key = ["workbook", installationId, year] as const;

  const queue = React.useSyncExternalStore(subscribeQueue, queueSnapshot, queueSnapshot);
  const pending = React.useMemo(
    () => (installationId ? pendingFor(queue, { accountId: currentAccount(), iid: installationId, year }) : {}),
    [queue, installationId, year],
  );
  const pendingN = Object.keys(pending).length;

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      runner.flush(); // a refused or failed save is retried on each poll
      const cached = qc.getQueryData<Workbook>(key);
      const next = await getWorkbook(installationId!, year, cached?.revision);
      // An answer older than what is already cached (a poll that raced a save) must not undo it.
      if (!next.changed || (cached && next.revision < cached.revision)) return qc.getQueryData<Workbook>(key) ?? cached!;
      return next;
    },
    enabled: Boolean(installationId),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

  const saveEdit = React.useCallback(
    (cellKey: string, value: string) => {
      const accountId = currentAccount();
      if (!installationId || !accountId) return;
      runner.enqueue({ accountId, iid: installationId, year }, cellKey, value);
    },
    [installationId, year],
  );

  // Anything still typed is sent when the page is left.
  React.useEffect(() => () => runner.flush(), []);

  // Warn before closing the tab while edits are waiting or in flight.
  const hasQueued = Object.keys(queue).length > 0;
  React.useEffect(() => {
    if (!hasQueued) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasQueued]);

  const data = query.data;
  const cells = React.useMemo(() => {
    const out: Record<string, string> = { ...(data?.cells ?? {}) };
    for (const [k, v] of Object.entries(pending)) {
      if (v === null) delete out[k];
      else out[k] = v;
    }
    return out;
  }, [data, pending]);

  const sheets: Sheet[] = React.useMemo(() => sheetsFromCells(cells, data?.meta.files ?? []), [cells, data]);

  return {
    loaded: Boolean(installationId) && query.isSuccess,
    sheets,
    cells,
    editors: data?.editors ?? {},
    revision: data?.revision,
    saveEdit,
    pending: pendingN,
  };
}

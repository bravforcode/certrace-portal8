"use client";

/* The workspace's data, read from and written to the shared server workbook
   (lib/api/workbooks.ts). Two hooks:

   - useWorkbookYears(installationId): which years exist and their set-up meta
     (syncing / ready, files, copy source).
   - useWorkbook(installationId, year): the cells of one year. Typed values wait in
     a queue (lib/workbook/save-queue.ts) that is kept per installation and year,
     sent one batch at a time, and shown on screen until the server has them. */

import * as React from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import {
  getWorkbook,
  listWorkbooks,
  patchWorkbookCells,
  putWorkbookMeta,
  type Workbook,
  type WorkbookMeta,
} from "../api/workbooks";
import { sheetsFromCells } from "./cells";
import {
  acknowledge,
  dropKeys,
  enqueue,
  isRetryable,
  nextBatch,
  pendingFor,
  retryDelay,
  targetsWithPending,
  type Queue,
  type Target,
} from "./save-queue";
import type { Sheet, WorkspaceFile } from "../workspace-sheets";

/** How long the set-up takes after Confirm. */
export const SETUP_MS = 60_000;
const POLL_MS = 10_000;
const YEARS_POLL_MS = 30_000;
const SAVE_DELAY_MS = 600;
/** The server takes at most 2000 cells in one patch. */
const CHUNK = 2000;

/** A year that exists: its meta, with the files always present. */
export type WorkbookYear = WorkbookMeta & { status: "syncing" | "ready"; files: WorkspaceFile[] };

const nowIso = () => new Date().toISOString();

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
   * confirmedAt, so the auto-ready timer never fires during the copy and an
   * interrupted copy is retried by copying again. Then the cells, then ready.
   */
  const copy = async (year: number, from: number) => {
    if (!installationId) return;
    try {
      const src = await getWorkbook(installationId, from);
      if (!src.changed) return;
      const files = src.meta.files ?? [];
      await putWorkbookMeta(installationId, year, { status: "syncing", files, blank: src.meta.blank, copiedFrom: from });
      await qc.invalidateQueries({ queryKey: ["workbook-years", installationId] });
      const entries = Object.entries(src.cells);
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
      toast({ message: "Your change was not saved", tone: "err", detail: (e as Error).message });
    }
  };

  /** Start from the beginning: no files, empty sheets, open at once. */
  const startBlank = (year: number) => write(year, { status: "ready", files: [], blank: true, confirmedAt: nowIso() });

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
    const k = `${iid}:${year}:${confirmedAt ?? ""}`;
    if (!seen.includes(k)) window.localStorage.setItem(WALKIN_KEY, JSON.stringify([...seen, k].slice(-200)));
  } catch {
    // Storage blocked: the walk-in simply shows again next time.
  }
}

/** Whether this browser should play the "it's ready" walk-in for a year. Blank and copied years never play it. */
export function walkinPending(iid: string | null, year: number, rec: WorkbookYear | undefined): boolean {
  if (!iid || !rec || rec.status !== "ready" || rec.blank || rec.copiedFrom) return false;
  if (typeof window === "undefined") return false;
  return !readSeen().includes(`${iid}:${year}:${rec.confirmedAt ?? ""}`);
}

/* ── save runner: one batch in flight, shared by every year and installation ── */

type Runner = {
  queue: Queue;
  sending: boolean;
  attempt: number;
  debounce?: ReturnType<typeof setTimeout>;
  retry?: ReturnType<typeof setTimeout>;
  listeners: Set<() => void>;
};

const runner: Runner = { queue: {}, sending: false, attempt: 0, listeners: new Set() };

function setQueue(q: Queue) {
  runner.queue = q;
  runner.listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  runner.listeners.add(l);
  return () => runner.listeners.delete(l);
}

/** Send the next batch, if none is in flight. Targets are served in the order they were first typed into. */
function pump(qc: QueryClient) {
  if (runner.sending || runner.retry) return;
  const t: Target | undefined = targetsWithPending(runner.queue)[0];
  if (!t) return;
  const cells = nextBatch(runner.queue, t);
  runner.sending = true;
  patchWorkbookCells(t.iid, t.year, cells).then(
    (saved: Workbook) => {
      runner.sending = false;
      runner.attempt = 0;
      setQueue(acknowledge(runner.queue, t, cells));
      qc.setQueryData(["workbook", t.iid, t.year], saved);
      pump(qc);
    },
    (e: { status?: number; message?: string }) => {
      runner.sending = false;
      const status = e.status ?? 0;
      if (isRetryable({ status })) {
        // Network or 5xx: keep the cells queued and try again with backoff.
        runner.retry = setTimeout(() => {
          runner.retry = undefined;
          pump(qc);
        }, retryDelay(runner.attempt++));
        return;
      }
      // A refusal (4xx): these cells are dropped and never retried; one notice for the batch.
      setQueue(dropKeys(runner.queue, t, Object.keys(cells)));
      toast({ message: "Some changes were refused and not saved", tone: "err", detail: e.message });
      pump(qc);
    },
  );
}

/** Wait for the typing to settle, then send. */
function schedule(qc: QueryClient) {
  if (runner.debounce) clearTimeout(runner.debounce);
  runner.debounce = setTimeout(() => {
    runner.debounce = undefined;
    pump(qc);
  }, SAVE_DELAY_MS);
}

/** Send now (poll, page leave). */
function flush(qc: QueryClient) {
  if (runner.debounce) {
    clearTimeout(runner.debounce);
    runner.debounce = undefined;
  }
  pump(qc);
}

/** The cells of one installation and year. `saveEdit` takes a "sheet:row:col" key; an empty value deletes it. */
export function useWorkbook(installationId: string | null, year: number) {
  const qc = useQueryClient();
  const key = ["workbook", installationId, year] as const;

  const queue = React.useSyncExternalStore(subscribe, () => runner.queue, () => runner.queue);
  const pending = React.useMemo(
    () => (installationId ? pendingFor(queue, { iid: installationId, year }) : {}),
    [queue, installationId, year],
  );
  const pendingN = Object.keys(pending).length;

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      flush(qc); // a refused or failed save is retried on each poll
      const cached = qc.getQueryData<Workbook>(key);
      const next = await getWorkbook(installationId!, year, cached?.revision);
      // An answer older than what is already cached (a poll that raced a save) must not undo it.
      if (!next.changed || (cached && next.revision < cached.revision)) return cached!;
      return next;
    },
    enabled: Boolean(installationId),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

  const saveEdit = React.useCallback(
    (cellKey: string, value: string) => {
      if (!installationId) return;
      setQueue(enqueue(runner.queue, { iid: installationId, year }, cellKey, value));
      schedule(qc);
    },
    [installationId, year, qc],
  );

  // Anything still typed is sent when the page is left.
  React.useEffect(() => () => flush(qc), [qc]);

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

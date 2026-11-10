"use client";

/* The workspace's data, read from and written to the shared server workbook
   (lib/api/workbooks.ts). Two hooks:

   - useWorkbookYears(installationId): which years exist and their set-up meta
     (syncing / ready, files, copy source). Same method names as the old
     browser store, so the callers only change their import.
   - useWorkbook(installationId, year): the cells of one year. Polls every 10 s
     while the tab is visible, sends only what the reader typed (batched after
     600 ms), and keeps a typed value on screen until the server has it. */

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { Sheet, WorkspaceFile } from "../workspace-sheets";

/** How long the set-up takes after Confirm. */
export const SETUP_MS = 60_000;
const POLL_MS = 10_000;
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

  /** Start a year from an earlier one: its cells and files, ready at once. */
  const copy = async (year: number, from: number) => {
    if (!installationId) return;
    try {
      const src = await getWorkbook(installationId, from);
      if (!src.changed) return;
      const entries = Object.entries(src.cells);
      for (let i = 0; i < entries.length; i += CHUNK)
        await patchWorkbookCells(installationId, year, Object.fromEntries(entries.slice(i, i + CHUNK)));
      await write(year, {
        status: "ready",
        files: src.meta.files ?? [],
        blank: src.meta.blank,
        confirmedAt: nowIso(),
        copiedFrom: from,
      });
    } catch (e) {
      toast({ message: "Your change was not saved", tone: "err", detail: (e as Error).message });
    }
  };

  /** Start from the beginning: no files, empty sheets, open at once. */
  const startBlank = (year: number) => write(year, { status: "ready", files: [], blank: true, confirmedAt: nowIso() });

  /** The set-up has finished; its card plays the walk-in until the reader goes on to the sheet. */
  const markReady = (year: number) => {
    const rec = get(year);
    if (rec) return write(year, { ...rec, status: "ready", revealed: false });
  };

  /** The reader has seen the "it's ready" walk-in and gone on to the sheet. */
  const markRevealed = (year: number) => {
    const rec = get(year);
    if (rec) return write(year, { ...rec, revealed: true });
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

type Batch = { iid: string; year: number; cells: Record<string, string | null> };

/** The cells of one installation and year. `saveEdit` takes a "sheet:row:col" key; an empty value deletes it. */
export function useWorkbook(installationId: string | null, year: number) {
  const qc = useQueryClient();
  const key = ["workbook", installationId, year] as const;

  // Typed but not yet confirmed by the server, for the one target they were typed into.
  const batchRef = React.useRef<Batch | null>(null);
  const [pending, setPending] = React.useState<Batch | null>(null);
  const timer = React.useRef<number | undefined>(undefined);

  const sendBatch = React.useCallback(
    async (batch: Batch) => {
      const sent = batch.cells;
      if (!Object.keys(sent).length) return;
      try {
        const saved: Workbook = await patchWorkbookCells(batch.iid, batch.year, sent);
        qc.setQueryData(["workbook", batch.iid, batch.year], saved);
        // Keep only what was typed after this request was sent; a failed request stays pending and is retried.
        const cur = batchRef.current;
        if (cur && cur.iid === batch.iid && cur.year === batch.year) {
          const rest = { ...cur.cells };
          for (const [k, v] of Object.entries(sent)) if (rest[k] === v) delete rest[k];
          batchRef.current = Object.keys(rest).length ? { ...cur, cells: rest } : null;
          setPending(batchRef.current);
        }
      } catch (e) {
        toast({ message: "Your change was not saved", tone: "err", detail: (e as Error).message });
      }
    },
    [qc],
  );

  const flushPending = React.useCallback(() => {
    window.clearTimeout(timer.current);
    return batchRef.current ? sendBatch(batchRef.current) : Promise.resolve();
  }, [sendBatch]);

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      void flushPending(); // a failed save is retried on each poll
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
      const cur = batchRef.current;
      // Edits for another installation or year are sent on their own, not merged into this one.
      if (cur && (cur.iid !== installationId || cur.year !== year)) void sendBatch(cur);
      const base: Batch =
        cur && cur.iid === installationId && cur.year === year ? cur : { iid: installationId, year, cells: {} };
      const next: Batch = { ...base, cells: { ...base.cells, [cellKey]: value === "" ? null : value } };
      batchRef.current = next;
      setPending(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flushPending(), SAVE_DELAY_MS);
    },
    [installationId, year, sendBatch, flushPending],
  );

  // Anything still typed is written when the page is left.
  React.useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (batchRef.current) void sendBatch(batchRef.current);
    },
    [sendBatch],
  );

  const data = query.data;
  const cells = React.useMemo(() => {
    const out: Record<string, string> = { ...(data?.cells ?? {}) };
    if (pending && pending.iid === installationId && pending.year === year)
      for (const [k, v] of Object.entries(pending.cells)) {
        if (v === null) delete out[k];
        else out[k] = v;
      }
    return out;
  }, [data, pending, installationId, year]);

  const sheets: Sheet[] = React.useMemo(() => sheetsFromCells(cells, data?.meta.files ?? []), [cells, data]);

  return {
    loaded: Boolean(installationId) && query.isSuccess,
    sheets,
    cells,
    editors: data?.editors ?? {},
    revision: data?.revision,
    saveEdit,
    pending: pending && pending.iid === installationId && pending.year === year ? Object.keys(pending.cells).length : 0,
  };
}

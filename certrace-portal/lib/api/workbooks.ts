/* The shared server workbook of one installation and reporting year (certrace-backend
   modules/workbooks). Cells are "sheet:row:col" keys; a null value deletes the cell. */

import type { WorkspaceFile } from "../workspace-sheets";
import { api, result } from "./client";

/** Mirrors the backend's `meta` schema: a year is "syncing" while its files are sorted, then "ready". */
export type WorkbookMeta = {
  status?: "syncing" | "ready";
  files?: WorkspaceFile[];
  confirmedAt?: string;
  copiedFrom?: number;
  blank?: boolean;
  revealed?: boolean;
};

export type Workbook = {
  changed: true;
  revision: number;
  meta: WorkbookMeta;
  cells: Record<string, string>;
  editors: Record<string, { by: string; at: string }>;
  updatedAt: string;
};

/** A poll that already holds the current revision gets this instead of the whole workbook. */
export type WorkbookUnchanged = { changed: false; revision: number };

const wb = (iid: string) => api().api.v1.workbooks({ installationId: iid });

export const listWorkbooks = (iid: string) => result(wb(iid).get());

export const getWorkbook = (iid: string, year: number, since?: number) =>
  result(
    wb(iid)({ year }).get({ query: since === undefined ? {} : { since } }),
  ) as Promise<Workbook | WorkbookUnchanged>;

export const patchWorkbookCells = (
  iid: string,
  year: number,
  cells: Record<string, string | null>,
) => result(wb(iid)({ year }).cells.patch({ cells })) as Promise<Workbook>;

export const putWorkbookMeta = (
  iid: string,
  year: number,
  meta: WorkbookMeta,
) => result(wb(iid)({ year }).meta.put({ meta })) as Promise<Workbook>;

/** Appends files under the server's row lock, so concurrent uploads never drop each other's files. */
export const addWorkbookFiles = (
  iid: string,
  year: number,
  files: NonNullable<WorkbookMeta["files"]>,
) => result(wb(iid)({ year }).files.post({ files })) as Promise<Workbook>;

/** Clears the cells of a year with no meta status, under the server's row lock. */
export const resetWorkbookLeftovers = (iid: string, year: number) =>
  result(wb(iid)({ year })["reset-leftovers"].post()) as Promise<Workbook>;

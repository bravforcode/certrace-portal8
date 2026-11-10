"use client";

/* ════════════════════════════════════════════════════════════
   WORKSPACE — one record per reporting year

   A year starts empty. The exporter uploads every file they have (no limit,
   a line of description on each) and confirms; from then the year is
   "syncing" — the files are being sorted into the sheets and no more can be
   added — until it is "ready" and the sheets open. A year can also start as
   a copy of an earlier year that already has data, or from the beginning:
   empty sheets, filled in by hand.

   The mock set-up takes SETUP_MS. If the reader is not there when it
   finishes, the year is "ready" but not yet revealed: the next time they
   open it, its card plays the walk-in and Get started opens the sheets.

   Stored per browser for now (localStorage), like the other mock screens:
   the file's name, size and description, never its contents. Cell edits are
   kept per year as overrides on the sheet data (lib/workspace-sheets.ts).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";

export type WorkspaceFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  description: string;
};

export type WorkspaceYear = {
  status: "syncing" | "ready";
  files: WorkspaceFile[];
  confirmedAt: string;
  /** set when the year was started as a copy of an earlier one */
  copiedFrom?: number;
  /** started from the beginning: empty sheets, filled in by hand */
  blank?: boolean;
  /** false while the set-up has finished but the reader has not yet been shown it (the card's
      "it's ready" walk-in plays then). Absent on older records: those count as shown. */
  revealed?: boolean;
  /** "sheet:row:col" → the value typed over the original */
  edits: Record<string, string>;
};

type Store = Record<string, WorkspaceYear>;

const KEY = "certrace:workspace-years";
/** How long the mock set-up takes after Confirm. */
export const SETUP_MS = 60_000;
const EVENT = "certrace:workspace-years";

function read(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(next: Store) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useWorkspaceYears() {
  const [store, setStore] = React.useState<Store>({});
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setStore(read());
    setLoaded(true);
    const sync = () => setStore(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const get = (year: number): WorkspaceYear | undefined => store[String(year)];

  const put = (year: number, rec: WorkspaceYear) => write({ ...read(), [String(year)]: rec });

  /** Confirm the upload: the year is set up from these files and closed to more. */
  const confirm = (year: number, files: WorkspaceFile[]) =>
    put(year, { status: "syncing", files, confirmedAt: new Date().toISOString(), edits: {} });

  /** Start a year from an earlier one: its files and edits, ready at once. */
  const copy = (year: number, from: number) => {
    const src = read()[String(from)];
    if (!src) return;
    put(year, {
      status: "ready",
      files: src.files,
      blank: src.blank,
      edits: { ...src.edits },
      confirmedAt: new Date().toISOString(),
      copiedFrom: from,
    });
  };

  /** Start from the beginning: no files, empty sheets, open at once. */
  const startBlank = (year: number) =>
    put(year, { status: "ready", files: [], blank: true, confirmedAt: new Date().toISOString(), edits: {} });

  /** The set-up has finished; its card plays the walk-in until the reader goes on to the sheet. */
  const markReady = (year: number) => {
    const rec = read()[String(year)];
    if (rec) put(year, { ...rec, status: "ready", revealed: false });
  };

  /** The reader has seen the "it's ready" walk-in and gone on to the sheet. */
  const markRevealed = (year: number) => {
    const rec = read()[String(year)];
    if (rec) put(year, { ...rec, revealed: true });
  };

  const saveEdit = (year: number, cell: string, value: string) => {
    const rec = read()[String(year)];
    if (rec) put(year, { ...rec, edits: { ...rec.edits, [cell]: value } });
  };

  return { loaded, get, confirm, copy, startBlank, markReady, markRevealed, saveEdit };
}

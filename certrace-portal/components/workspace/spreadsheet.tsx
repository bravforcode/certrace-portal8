"use client";

/* ════════════════════════════════════════════════════════════
   THE WORKSPACE SHEET — an Excel-style grid over the sheet data

   Formula bar (cell reference · fx · value) with the sheet's search and the
   save state in its right-hand corner; column letters and row numbers; the
   header row; the data rows; and the sheet tabs along the bottom, each with
   its count of rows still to review.

   Keys work as in Excel. Click selects; typing replaces the cell, F2 or a
   double-click edits it in place. Enter keeps the edit and moves down, Tab
   moves right (Shift goes back), Escape drops the edit, Delete clears the
   cell, arrows move (and, while typing over a cell, keep it and move).
   Ctrl+C / Ctrl+V copy and paste, tab-separated, so a block copied from
   Excel lands cell for cell. Every kept edit shows "Saving…" and then
   "All changes saved". Status cells are not typed into — they come from the
   checks. Selection and editing never change a column's width: the editor
   lies over the cell's text instead of replacing it.

   The expand button opens the sheet over the whole window; Escape closes it.

   `empty` draws the plain sheet a year with no data shows: letters, row
   numbers and tabs, nothing in the cells.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  CircleMinus,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/components/ui";
import { useLanguage, type TFunction } from "@/lib/i18n";
import { TH_WORKSPACE } from "@/lib/i18n-th-workspace";
import { InstallationSheet } from "@/components/workspace/installation-sheet";
import { FlowDiagram } from "@/components/workspace/flow-diagram";
import { ImportWizard } from "@/components/workspace/import-wizard";
import { ImportFilePanel } from "@/components/workspace/import-file-panel";
import { parseSheetParam } from "@/lib/workbook/url-state";
import type { SyncResult } from "@/lib/workbook/sync-queue";
import { LivePanel } from "@/components/workspace/live-panel";
import type { Installation } from "@/lib/installations";
import {
  SHEET_ORDER,
  STATUS_LABEL,
  STATUS_TONE,
  installationGaps,
  installationSheetStatus,
  installationTabTone,
  sheetStatus,
  statusTooltip,
} from "@/lib/workbook/status";
import { useTeam } from "@/lib/team-query";
import { CELL_MAX } from "@/lib/workbook/save-queue";
import { toast } from "@/components/toast";
import { rowWindow } from "@/lib/row-window";
import {
  INSTALLATION_SHEET_ID,
  NO_FILE,
  issuesOf,
  letter,
  type Sheet,
  type SheetCol,
  type SheetRow,
  type WorkspaceFile,
} from "@/lib/workspace-sheets";

const MIN_ROWS = 20;
// Long sheets render only the rows near the viewport. Every data row is h-8 (32px).
const ROW_H = 32;
const WINDOW_FROM = 200;
const OVERSCAN = 20;
/** Cells one paste may write; the server takes at most 2000 cells per patch (workbooks/model.ts). */
const PASTE_MAX = 2000;
const DEFAULT_SHEET = "materials";

/* "3 min ago" style, for the editor note on a cell. */
function timeAgo(at: string, t: TFunction) {
  const s = Math.max(0, (Date.now() - Date.parse(at)) / 1000);
  if (s < 60) return t("just now");
  if (s < 3600) return t("{n} min ago", { n: Math.floor(s / 60) });
  if (s < 86400) return t("{n} h ago", { n: Math.floor(s / 3600) });
  return t("{n} days ago", { n: Math.floor(s / 86400) });
}

/* Inside the sheet the workspace's own Thai wins (แหล่งที่มา, วิธีได้ค่า, ผลิตภัณฑ์) over the
   portal-wide words for the same English (แหล่ง, วิธีการ, สินค้า), without changing them elsewhere. */
function useSheetT(): TFunction {
  const { lang, t } = useLanguage();
  return (en, vars) =>
    lang === "th" && !vars && TH_WORKSPACE[en]
      ? TH_WORKSPACE[en]!
      : t(en, vars);
}
const ROW_NO = "44px";

const RAW_KEYS = new Set(["description", "cn", "size", "type", "valid"]);
const isRaw = (c: SheetCol) =>
  c.kind === "number" || c.kind === "file" || RAW_KEYS.has(c.key);

export function Spreadsheet({
  sheets,
  onEdit,
  saving = false,
  editors = {},
  empty = false,
  installation = null,
  onInstallationSave,
  cells,
  savePatch,
  extraTabs = [],
  files,
  onAddFiles,
}: {
  /** The year's uploaded files, listed with their review state above the live check. */
  files?: WorkspaceFile[];
  /** Adds uploaded files to the year; without it the side panel has no Import file. */
  onAddFiles?: (
    files: WorkspaceFile[],
    blobs: Map<string, Blob>,
  ) => Promise<boolean>;
  /** The year's cells with unsaved edits on top (the Flow view is drawn from them). */
  cells?: Record<string, string>;
  /** Sends a diagram patch through the save runner; resolves how it went. */
  savePatch?: (patch: Record<string, string | null>) => Promise<SyncResult>;
  /** Rows come from the server workbook (useWorkbook), already with unsaved edits on top. */
  sheets: Sheet[];
  onEdit?: (cell: string, value: string) => void;
  /** Typed edits not yet confirmed by the server. */
  saving?: boolean;
  /** Who last changed each cell ("sheet:row:col" → account id and time). */
  editors?: Record<string, { by: string; at: string }>;
  empty?: boolean;
  /** The site the Installation tab edits — the scoped installation's full record. */
  installation?: Installation | null;
  onInstallationSave?: (inst: Installation) => void;
  /** Tabs that are not row sheets (e.g. CBAM): a tab after the sheets, showing its own content in the grid's place. */
  extraTabs?: { id: string; label: string; content: React.ReactNode }[];
}) {
  const t = useSheetT();
  const team = useTeam().data;
  // The view and the open sheet live in the URL (?view=, ?sheet=), so a reload or a shared link opens the same place.
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = parseSheetParam(
    params.get("sheet"),
    [...sheets.map((s) => s.id), ...extraTabs.map((x) => x.id)],
    DEFAULT_SHEET,
  );
  // "Table" or "Flow". An old ?view=factory link opens the table.
  const view: "table" | "flow" =
    params.get("view") === "flow" ? "flow" : "table";
  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const setView = (v: "table" | "flow") =>
    updateParams({ view: v === "table" ? null : v });
  const [sel, setSel] = React.useState<{ r: number; c: number }>({
    r: 0,
    c: 2,
  });
  /* The cell being edited. `seed` is set when typing started the edit: the typed key replaces the
     value and the arrows keep the edit and move on (Excel's Enter mode). Without it (F2, double-click)
     the edit starts from the value and the arrows move the caret (Edit mode). */
  const [editing, setEditingState] = React.useState<{
    key: string;
    seed?: string;
  } | null>(null);
  const setEditing = (key: string | null, seed?: string) =>
    setEditingState(key === null ? null : { key, seed });
  const [query, setQuery] = React.useState("");
  const [full, setFull] = React.useState(false);
  // Opening a sheet always leaves the Flow view, as the sheet tabs did before.
  const openTab = (id: string) => {
    setSel({ r: 0, c: 0 });
    setEditing(null);
    updateParams({ sheet: id === DEFAULT_SHEET ? null : id, view: null });
  };
  const gridRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null); // the scroller in full-page mode
  const rowsRef = React.useRef<HTMLDivElement>(null); // marks where the first data row starts

  const editorName = (by: string) =>
    team?.find((m) => m.id === by)?.name ?? t("a teammate");
  // Tabs follow the material flow; a sheet not in SHEET_ORDER goes after the ones that are.
  const orderOf = (id: string) => {
    const i = SHEET_ORDER.indexOf(id);
    return i < 0 ? SHEET_ORDER.length : i;
  };
  // Installation first, then the sheets in material-flow order.
  const tabOrder = (list: Sheet[]): Sheet[] => {
    const sorted = [...list].sort((a, b) => orderOf(a.id) - orderOf(b.id));
    return [
      ...sorted.filter((s) => s.id === INSTALLATION_SHEET_ID),
      ...sorted.filter((s) => s.id !== INSTALLATION_SHEET_ID),
    ];
  };
  const sheet = sheets.find((s) => s.id === tab);
  const isFlow = view === "flow" && !empty;
  const extra = extraTabs.find((x) => x.id === tab);
  const showExtra = !!extra && !isFlow;
  const [importing, setImporting] = React.useState(false);
  const fullRef = React.useRef<HTMLDivElement>(null); // the full-page dialog, for its focus trap
  const importOpener = React.useRef<HTMLElement | null>(null); // whatever opened the CSV mapper, focused again on close
  // Import writes rows into a sheet of cells; the Installation and Documents tabs are not row sheets.
  const canImport =
    !!sheet &&
    !!onEdit &&
    !!savePatch &&
    tab !== INSTALLATION_SHEET_ID &&
    tab !== "documents";
  const installStatus = installationSheetStatus(installation);
  const installIssues =
    installation && installStatus === "missing"
      ? installationGaps(installation)
      : 0;
  const cols = sheet?.cols ?? [];
  const colCount = empty || !sheet ? 7 : cols.length;

  const keyOf = (r: number, c: number) => `${tab}:${r}:${cols[c]?.key}`;
  const valueOf = (row: SheetRow, _r: number, c: number) =>
    row.cells[cols[c]!.key] ?? "";
  const shown = (col: SheetCol, v: string) => (v && !isRaw(col) ? t(v) : v);

  // Search: rows of this sheet with a cell that matches; counts per sheet for the tabs.
  const q = query.trim().toLowerCase();
  const rowMatches = (s: Sheet, row: SheetRow) =>
    !q ||
    s.cols.some((c) => {
      if (c.kind === "status") return false;
      const v = row.cells[c.key] ?? "";
      return (
        v.toLowerCase().includes(q) || shown(c, v).toLowerCase().includes(q)
      );
    });
  const visible =
    sheet && !empty
      ? sheet.rows
          .map((row, r) => ({ row, r }))
          .filter(({ row }) => rowMatches(sheet, row))
      : [];
  const matchCount = (s: Sheet) =>
    s.rows.filter((row) => rowMatches(s, row)).length;
  const firstVisible = visible[0]?.r;

  // Where the first data row sits relative to the scroller (the window, or the full-page box).
  const [scrollPos, setScrollPos] = React.useState({ top: 0, height: 800 });
  const windowed = visible.length > WINDOW_FROM;
  const viewBox = React.useCallback(() => {
    const box = full ? scrollRef.current?.getBoundingClientRect() : null;
    return box
      ? { top: box.top, bottom: box.bottom }
      : { top: 0, bottom: window.innerHeight };
  }, [full]);
  React.useLayoutEffect(() => {
    if (!windowed) return;
    const measure = () => {
      const mark = rowsRef.current?.getBoundingClientRect();
      if (!mark) return;
      const box = viewBox();
      // Rounded to whole rows, so scrolling within a row does not re-render the grid.
      const top = Math.floor((mark.top - box.top) / ROW_H) * ROW_H;
      const height = Math.ceil((box.bottom - box.top) / ROW_H) * ROW_H;
      setScrollPos((p) =>
        p.top === top && p.height === height ? p : { top, height },
      );
    };
    measure();
    // Capture catches the full-page box scrolling as well as the window.
    window.addEventListener("scroll", measure, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
    };
  }, [windowed, viewBox, tab, q]);
  const selHidden = !!q && !visible.some((v) => v.r === sel.r);
  React.useEffect(() => {
    if (selHidden && firstVisible !== undefined)
      setSel((s) => ({ ...s, r: firstVisible }));
  }, [selHidden, firstVisible]);

  // The row being edited stays rendered, so scrolling away does not drop what was typed.
  const win = rowWindow({
    total: visible.length,
    top: scrollPos.top,
    viewport: scrollPos.height,
    rowHeight: ROW_H,
    overscan: OVERSCAN,
    threshold: WINDOW_FROM,
    keep: editing ? visible.findIndex((v) => v.r === sel.r) : undefined,
  });

  const template = [
    ROW_NO,
    ...(empty || !sheet
      ? Array(7).fill("minmax(96px,1fr)")
      : cols.map((c) => c.width)),
  ].join(" ");

  const selRow = sheet?.rows[sel.r];
  const selCol = cols[sel.c];
  const selValue =
    !empty && !selHidden && selRow && selCol && selCol.kind !== "status"
      ? shown(selCol, valueOf(selRow, sel.r, sel.c))
      : "";
  const ref = `${letter(sel.c)}${sel.r + 2}`;
  // An empty cell names itself in the formula bar, muted, so the bar always says where you are.
  const selPlace =
    !empty && !selHidden && selRow && selCol
      ? t("Row {n} · {col}", { n: sel.r + 2, col: t(selCol.label) })
      : "";

  const focusGrid = () => gridRef.current?.focus({ preventScroll: true });

  // Moves along the rows the search leaves visible, never onto a hidden one.
  const moveSel = (dr: number, dc: number) => {
    if (!sheet || visible.length === 0) return false;
    const i = Math.max(
      0,
      visible.findIndex((v) => v.r === sel.r),
    );
    const ni = Math.min(visible.length - 1, Math.max(0, i + dr));
    const nc = Math.min(cols.length - 1, Math.max(0, sel.c + dc));
    if (ni === i && nc === sel.c) return false;
    setSel({ r: visible[ni]!.r, c: nc });
    return true;
  };

  // Documents rows come from the file list, not from cells, so a typed value there would not stick.
  const editable = (c: number) =>
    !empty && !!onEdit && tab !== "documents" && cols[c]?.kind !== "status";

  const commit = (r: number, c: number, value: string) => {
    setEditing(null);
    focusGrid();
    const row = sheet?.rows[r];
    if (!row || !onEdit) return;
    if (value === valueOf(row, r, c)) return;
    onEdit(keyOf(r, c), value);
  };

  // Keeps the selected cell in view after keyboard moves, without scrolling the page by more than it needs.
  React.useEffect(() => {
    const cell = gridRef.current?.querySelector<HTMLElement>(
      '[role="gridcell"][aria-selected="true"]',
    );
    if (cell) {
      cell.scrollIntoView({ block: "nearest", inline: "nearest" });
      return;
    }
    // A long sheet has not rendered a row far from view: scroll to where it sits, and it renders.
    const i = visible.findIndex((v) => v.r === sel.r);
    const mark = rowsRef.current?.getBoundingClientRect();
    if (!windowed || i < 0 || !mark) return;
    const box = viewBox();
    const rowTop = mark.top + i * ROW_H;
    const by =
      rowTop < box.top
        ? rowTop - box.top
        : rowTop + ROW_H > box.bottom
          ? rowTop + ROW_H - box.bottom
          : 0;
    if (by) (full ? scrollRef.current : window)?.scrollBy({ top: by });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on selection moves only
  }, [sel.r, sel.c]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing || empty || !sheet) return;
    const go = (dr: number, dc: number) => {
      e.preventDefault();
      moveSel(dr, dc);
    };
    const k = e.key;
    const mod = e.ctrlKey || e.metaKey;
    if (k === "ArrowDown") go(1, 0);
    else if (k === "ArrowUp") go(-1, 0);
    else if (k === "ArrowRight") go(0, 1);
    else if (k === "ArrowLeft") go(0, -1);
    else if (k === "Enter") go(e.shiftKey ? -1 : 1, 0);
    else if (k === "Tab") {
      // At either end of the row Tab leaves the grid, so the keyboard is never trapped.
      if (moveSel(0, e.shiftKey ? -1 : 1)) e.preventDefault();
    } else if (k === "Home") go(0, -cols.length);
    else if (k === "End") go(0, cols.length);
    else if (k === "F2" && editable(sel.c)) {
      e.preventDefault();
      setEditing(keyOf(sel.r, sel.c));
    } else if ((k === "Delete" || k === "Backspace") && editable(sel.c)) {
      e.preventDefault();
      commit(sel.r, sel.c, "");
    } else if (k === "Escape" && full) {
      e.preventDefault();
      setFull(false);
    } else if (
      k.length === 1 &&
      !mod &&
      !e.altKey &&
      editable(sel.c) &&
      !selHidden
    ) {
      // A printable key starts an edit that replaces the cell with what was typed.
      e.preventDefault();
      setEditing(keyOf(sel.r, sel.c), k);
    }
  };

  const onCopy = (e: React.ClipboardEvent) => {
    if (editing || empty || !selRow || !selCol) return;
    e.preventDefault();
    e.clipboardData.setData(
      "text/plain",
      selCol.kind === "status" ? "" : valueOf(selRow, sel.r, sel.c),
    );
  };

  // A paste fills from the selected cell: tabs go across, lines go down, over the visible rows.
  const onPaste = (e: React.ClipboardEvent) => {
    if (editing || empty || !sheet || !onEdit) return;
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    e.preventDefault();
    const lines = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
    const start = Math.max(
      0,
      visible.findIndex((v) => v.r === sel.r),
    );
    let written = 0;
    let skipped = 0;
    lines.forEach((line, i) => {
      // Unfiltered, a paste longer than the sheet writes new rows below; the sheet grows to hold them.
      const target =
        visible[start + i] ??
        (q ? undefined : { row: { cells: {} } as SheetRow, r: start + i });
      if (!target) {
        skipped++;
        return;
      }
      line.split("\t").forEach((value, j) => {
        const c = sel.c + j;
        if (c >= cols.length || !editable(c)) return;
        if (written >= PASTE_MAX) {
          skipped++;
          return;
        }
        const v = value.slice(0, CELL_MAX);
        if (v === valueOf(target.row, target.r, c)) return;
        onEdit(keyOf(target.r, c), v);
        written++;
      });
    });
    if (skipped > 0)
      toast({
        message: t("Part of the paste was not added"),
        detail: q
          ? t("Clear the search to paste below the matching rows.")
          : t("Paste at most {n} cells at a time.", { n: PASTE_MAX }),
        tone: "warn",
      });
  };

  // Full page: the page behind does not scroll, and Escape closes it when the grid does not take the key.
  // Tab stays inside it while open, and focus returns to what opened it on close.
  React.useEffect(() => {
    if (!full) return;
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    gridRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setFull(false);
      const box = fullRef.current;
      if (e.key !== "Tab" || e.defaultPrevented || !box) return;
      const items = [
        ...box.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const at = document.activeElement;
      if (e.shiftKey && (at === first || !box.contains(at))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (at === last || !box.contains(at))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      opener?.focus({ preventScroll: true });
    };
  }, [full]);

  const showLive = (id: string) => openTab(id);
  const openMapper = canImport
    ? () => {
        importOpener.current = document.activeElement as HTMLElement | null;
        setImporting(true);
      }
    : undefined;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <div
        ref={fullRef}
        role={full ? "dialog" : undefined}
        aria-modal={full || undefined}
        aria-label={full ? t("Sheet, full page") : undefined}
        className={cn(
          "min-w-0 overflow-hidden bg-white",
          full
            ? "fixed inset-0 z-50 flex flex-col"
            : "rounded-2xl border border-black/[0.08]",
        )}
      >
        {/* ── Formula bar ─────────────────────────────── */}
        <div className="flex h-10 flex-none items-stretch border-b border-black/[0.08]">
          <div className="flex w-[76px] flex-none items-center justify-center border-r border-black/[0.08] font-mono text-[12px] text-black/75">
            {empty || isFlow || showExtra ? "" : ref}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
            <span className="font-serif text-[12px] italic text-black/35">
              fx
            </span>
            {selValue ? (
              <span className="truncate text-[12.5px] text-black/80">
                {selValue}
              </span>
            ) : (
              !isFlow &&
              !showExtra && (
                <span className="truncate text-[12.5px] text-black/35">
                  {selPlace}
                </span>
              )
            )}
          </div>
          {!empty && (
            <div
              role="group"
              aria-label={t("View")}
              className="my-1 ml-2 flex flex-none items-center self-center rounded-md bg-[#f0efea] p-0.5 text-[12px]"
            >
              {(["table", "flow"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded px-2.5 py-1 transition-colors",
                    view === v
                      ? "bg-white font-medium text-[#111] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-black/55 hover:text-black",
                  )}
                >
                  {v === "table" ? t("Table") : t("Flow")}
                </button>
              ))}
            </div>
          )}
          {!empty && !isFlow && !showExtra && (
            <div className="flex min-w-0 items-center gap-3 border-l border-black/[0.08] px-2.5">
              {/* A fixed width, so switching between the two messages never moves the search box. */}
              <span
                aria-live="polite"
                className={cn(
                  "hidden w-[124px] items-center gap-1.5 whitespace-nowrap text-[11.5px] xl:inline-flex",
                  saving ? "text-black/45" : "text-black/40",
                )}
              >
                {saving ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    {t("Saving…")}
                  </>
                ) : (
                  <>
                    <Check
                      size={12}
                      strokeWidth={2}
                      className="text-emerald-600"
                    />
                    {t("All changes saved")}
                  </>
                )}
              </span>
              <label className="relative flex min-w-0 items-center">
                <Search
                  size={12}
                  strokeWidth={1.5}
                  className="pointer-events-none absolute left-2 text-black/30"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && query) {
                      e.preventDefault();
                      setQuery("");
                    } else if (e.key === "Enter" && visible.length) {
                      // Enter jumps into the first match, ready to type.
                      e.preventDefault();
                      setSel((s) => ({ ...s, r: visible[0]!.r }));
                      focusGrid();
                    }
                  }}
                  placeholder={t("Search this year…")}
                  aria-label={t("Search sheets")}
                  data-lock="allow"
                  className="no-focus-ring h-7 w-40 rounded-md border border-black/10 bg-[#f7f6f2] pl-7 pr-14 text-[12px] text-black/75 placeholder:text-black/35 focus:border-black/25 focus:bg-white focus:outline-none min-w-[96px] xl:w-52 [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <span className="absolute right-1 flex items-center gap-0.5">
                    <span
                      aria-live="polite"
                      className={cn(
                        "font-mono text-[10.5px] tabular-nums",
                        visible.length ? "text-black/45" : "text-[#b91c1c]",
                      )}
                    >
                      {visible.length}
                    </span>
                    <span className="sr-only">
                      {t("rows match in this sheet")}
                    </span>
                    <button
                      type="button"
                      aria-label={t("Clear search")}
                      onClick={() => setQuery("")}
                      className="grid h-5 w-5 place-items-center rounded text-black/35 hover:bg-black/[0.05] hover:text-black"
                    >
                      <X size={11} strokeWidth={2} />
                    </button>
                  </span>
                )}
              </label>
            </div>
          )}
          {!empty && (
            <button
              type="button"
              onClick={() => setFull((v) => !v)}
              aria-pressed={full}
              aria-label={full ? t("Exit full page") : t("Full page")}
              title={full ? t("Exit full page (Esc)") : t("Full page")}
              className="grid w-10 flex-none place-items-center border-l border-black/[0.08] text-black/45 transition-colors hover:bg-black/[0.03] hover:text-black"
            >
              {full ? (
                <Minimize2 size={14} strokeWidth={1.75} />
              ) : (
                <Maximize2 size={14} strokeWidth={1.75} />
              )}
            </button>
          )}
        </div>

        {/* ── Grid ────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className={cn(full && "min-h-0 flex-1 overflow-auto")}
        >
          {isFlow ? (
            <FlowDiagram
              sheets={sheets}
              cells={cells}
              t={t}
              onOpenSheet={showLive}
              editable={!empty && !!onEdit}
              savePatch={savePatch}
            />
          ) : tab === INSTALLATION_SHEET_ID ? (
            <InstallationSheet
              key={installation?.id ?? ""}
              installation={installation}
              onSave={onInstallationSave}
            />
          ) : showExtra ? (
            <div className="min-h-[320px]">{extra!.content}</div>
          ) : (
            <div
              ref={gridRef}
              role="grid"
              aria-label={sheet ? `${sheet.code} ${t(sheet.name)}` : t("Sheet")}
              aria-rowcount={windowed ? visible.length + 1 : undefined}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onCopy={onCopy}
              onPaste={onPaste}
              className="no-focus-ring overflow-x-auto focus:outline-none"
            >
              <div
                className="grid min-w-max text-[12.5px]"
                style={{ gridTemplateColumns: template }}
              >
                {/* column letters */}
                <div className="sticky left-0 z-10 h-6 border-b border-r border-black/[0.08] bg-[#f0efea]" />
                {Array.from({ length: colCount }, (_, c) => (
                  <div
                    key={c}
                    className={cn(
                      "flex h-6 items-center justify-center border-b border-r border-black/[0.08] text-[11px] text-black/45",
                      !empty && sel.c === c
                        ? "bg-[#e3e2dc] font-medium text-black/70"
                        : "bg-[#f0efea]",
                    )}
                  >
                    {letter(c)}
                  </div>
                ))}

                {/* header row */}
                <RowNo n={1} />
                {Array.from({ length: colCount }, (_, c) => (
                  <div
                    key={c}
                    className="flex h-8 items-center border-b border-r border-black/[0.08] bg-[#f7f6f2] px-2.5 font-semibold text-[#111]"
                  >
                    {!empty && cols[c] ? t(cols[c]!.label) : ""}
                  </div>
                ))}

                {/* data rows; a long sheet renders the ones near the viewport between two spacers */}
                <div
                  ref={rowsRef}
                  aria-hidden
                  style={{ gridColumn: "1 / -1", height: win.start * ROW_H }}
                />
                {visible.slice(win.start, win.end).map(({ row, r }, i) => (
                  <div
                    key={r}
                    role="row"
                    aria-rowindex={windowed ? win.start + i + 2 : undefined}
                    className="contents"
                  >
                    <RowNo n={r + 2} on={sel.r === r} />
                    {cols.map((col, c) => {
                      const k = keyOf(r, c);
                      const v = valueOf(row, r, c);
                      const flag = row.flags?.[col.key];
                      const editor = editors[`${tab}:${r}:${col.key}`];
                      const selected = sel.r === r && sel.c === c;
                      const isEditing = editing?.key === k;
                      return (
                        <div
                          key={col.key}
                          role="gridcell"
                          title={
                            editor
                              ? t("Edited by {name} · {time}", {
                                  name: editorName(editor.by),
                                  time: timeAgo(editor.at, t),
                                })
                              : undefined
                          }
                          tabIndex={-1}
                          aria-selected={selected}
                          onMouseDown={(e) => {
                            // A click on the cell being edited places the caret; anywhere else selects.
                            if (isEditing) return;
                            e.preventDefault();
                            setSel({ r, c });
                            focusGrid();
                          }}
                          onDoubleClick={() => editable(c) && setEditing(k)}
                          className={cn(
                            "relative flex h-8 min-w-0 cursor-cell items-center border-b border-r border-black/[0.08] px-2.5",
                            col.kind === "number" && "justify-end",
                            flag && "bg-[#fffbeb]",
                            selected &&
                              "z-[1] outline outline-2 -outline-offset-1 outline-[#111]",
                            selected && !isEditing && "bg-[#f7f6f2]",
                            isEditing && "bg-white",
                            // Columns have fixed minimums, so the browser can skip painting off-screen cells
                            // on long sheets without the layout moving; the live cell is always painted.
                            !selected &&
                              !isEditing &&
                              "[contain-intrinsic-size:auto_32px] [content-visibility:auto]",
                          )}
                        >
                          {/* The text stays under the editor (hidden), so the column keeps its width while editing. */}
                          <span
                            className={cn(
                              "flex min-w-0 items-center",
                              isEditing && "invisible",
                            )}
                          >
                            <CellView
                              col={col}
                              value={v}
                              flag={flag}
                              status={row.status}
                              query={q}
                              text={shown(col, v)}
                            />
                          </span>
                          {isEditing && (
                            <CellEditor
                              initial={editing.seed ?? v}
                              seeded={editing.seed !== undefined}
                              align={col.kind === "number" ? "right" : "left"}
                              onCommit={(val, dr, dc) => {
                                commit(r, c, val);
                                if (dr || dc) moveSel(dr, dc);
                              }}
                              onCancel={() => {
                                setEditing(null);
                                focusGrid();
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
                {windowed && (
                  <div
                    aria-hidden
                    style={{
                      gridColumn: "1 / -1",
                      height: (visible.length - win.end) * ROW_H,
                    }}
                  />
                )}

                {/* empty rows to the fold, like a fresh sheet */}
                {Array.from(
                  { length: Math.max(0, MIN_ROWS - 1 - visible.length) },
                  (_, i) => {
                    const n = (empty ? 2 : (sheet?.rows.length ?? 0) + 2) + i;
                    return (
                      <React.Fragment key={`e${i}`}>
                        <RowNo n={empty ? 2 + i : n} />
                        {Array.from({ length: colCount }, (_, c) => (
                          <div
                            key={c}
                            className="h-8 border-b border-r border-black/[0.08]"
                          />
                        ))}
                      </React.Fragment>
                    );
                  },
                )}
              </div>
              {q && visible.length === 0 && (
                <p className="border-b border-black/[0.08] px-3 py-2 text-[12px] text-black/40">
                  {t("No rows in this sheet match “{query}”.", { query })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Sheet tabs ──────────────────────────────── */}
        <div className="flex items-stretch overflow-x-auto border-t border-black/[0.08] bg-[#f0efea] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabOrder(sheets).map((s) => {
            const on = tab === s.id;
            const fullSheet = sheets.find((x) => x.id === s.id);
            const n =
              !fullSheet || empty
                ? 0
                : q
                  ? matchCount(fullSheet)
                  : issuesOf(fullSheet);
            const isInstall = s.id === INSTALLATION_SHEET_ID;
            // Every tab has the same dot before its code: the installation's from its form, the rest from their rows.
            const dot = empty
              ? "untouched"
              : isInstall
                ? installStatus
                : fullSheet
                  ? sheetStatus(fullSheet)
                  : "untouched";
            const dotLabel =
              isInstall && installStatus === "missing"
                ? t("{n} missing fields", { n: installIssues })
                : t(STATUS_LABEL[dot]);
            return (
              <button
                key={s.id}
                type="button"
                title={
                  !empty && !isInstall && fullSheet
                    ? statusTooltip(fullSheet)
                    : dotLabel
                }
                onClick={() => openTab(s.id)}
                className={cn(
                  "flex flex-none items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 text-[12.5px] transition-colors",
                  on
                    ? "rounded-b-xl bg-white font-medium text-[#111] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                    : "text-black/55 hover:text-black",
                )}
              >
                <span
                  role="img"
                  aria-label={dotLabel}
                  style={{
                    backgroundColor:
                      isInstall && !empty
                        ? installationTabTone(installation)
                        : STATUS_TONE[dot],
                  }}
                  className="inline-block h-2 w-2 flex-none rounded-full"
                />
                {s.code && <span className="tabular-nums">{s.code}</span>}
                {t(s.name)}
                {!isInstall && n > 0 && (
                  <span
                    className={cn(
                      "grid h-4 min-w-4 place-items-center rounded-full px-1 font-mono text-[10px]",
                      q
                        ? "bg-black/[0.07] text-black/55"
                        : "bg-[#fdecc8] text-[#b45309]",
                    )}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}
          {extraTabs.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => openTab(x.id)}
              className={cn(
                "flex flex-none items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 text-[12.5px] transition-colors",
                tab === x.id
                  ? "rounded-b-xl bg-white font-medium text-[#111] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-black/55 hover:text-black",
              )}
            >
              <span
                aria-hidden
                style={{ backgroundColor: STATUS_TONE.untouched }}
                className="inline-block h-2 w-2 flex-none rounded-full"
              />
              {t(x.label)}
            </button>
          ))}
        </div>
      </div>
      {!empty && (
        <LivePanel
          sheets={sheets}
          installation={installation}
          onOpenSheet={showLive}
          top={
            files && onAddFiles ? (
              <ImportFilePanel
                files={files}
                onAdd={onAddFiles}
                onMapCsv={openMapper}
              />
            ) : null
          }
        />
      )}
      {importing && sheet && canImport && savePatch && (
        <ImportWizard
          sheet={sheet}
          cells={cells ?? {}}
          savePatch={savePatch}
          onClose={() => {
            setImporting(false);
            importOpener.current?.focus();
          }}
          t={t}
        />
      )}
    </div>
  );
}

function RowNo({ n, on }: { n: number; on?: boolean }) {
  return (
    <div
      className={cn(
        "sticky left-0 z-10 flex h-8 items-center justify-center border-b border-r border-black/[0.08] text-[11.5px]",
        on
          ? "bg-[#e3e2dc] font-medium text-black/70"
          : "bg-[#f0efea] text-black/45",
      )}
    >
      {n}
    </div>
  );
}

/* Lies over the cell (absolute) instead of taking its place, so the grid never re-measures.
   `seeded`: typing started the edit, so the arrows keep it and move on, as in Excel. */
function CellEditor({
  initial,
  seeded,
  align,
  onCommit,
  onCancel,
}: {
  initial: string;
  seeded: boolean;
  align: "left" | "right";
  /** Keeps the value, then moves the selection by (rows, columns). */
  onCommit: (v: string, dr: number, dc: number) => void;
  onCancel: () => void;
}) {
  const [v, setV] = React.useState(initial);
  // Set once the edit is decided, so the blur that follows does not decide it again.
  const done = React.useRef(false);
  const finish = (keep: boolean, dr = 0, dc = 0) => {
    if (done.current) return;
    done.current = true;
    if (keep) onCommit(v, dr, dc);
    else onCancel();
  };
  return (
    <input
      autoFocus
      size={1}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => {
        // The caret goes to the end, as after F2 in Excel.
        const end = e.currentTarget.value.length;
        e.currentTarget.setSelectionRange(end, end);
      }}
      onBlur={() => finish(true)}
      maxLength={CELL_MAX}
      onKeyDown={(e) => {
        e.stopPropagation();
        const k = e.key;
        if (k === "Enter") {
          e.preventDefault();
          finish(true, e.shiftKey ? -1 : 1, 0);
        } else if (k === "Tab") {
          e.preventDefault();
          finish(true, 0, e.shiftKey ? -1 : 1);
        } else if (k === "Escape") {
          e.preventDefault();
          finish(false);
        } else if (seeded && k === "ArrowDown") finish(true, 1, 0);
        else if (seeded && k === "ArrowUp") finish(true, -1, 0);
        else if (seeded && k === "ArrowRight") finish(true, 0, 1);
        else if (seeded && k === "ArrowLeft") finish(true, 0, -1);
      }}
      className={cn(
        "no-focus-ring absolute inset-0 h-full w-full min-w-0 bg-white px-2.5 text-[12.5px] text-[#111] focus:outline-none",
        align === "right" && "text-right tabular-nums",
      )}
    />
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-[#fde68a] text-inherit">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

function CellView({
  col,
  value,
  flag,
  status,
  query,
  text,
}: {
  col: SheetCol;
  value: string;
  flag?: "warn" | "missing";
  status: SheetRow["status"];
  query: string;
  text: string;
}) {
  const t = useSheetT();
  if (col.kind === "status") return <StatusPill status={status} />;
  if (status === "empty" && !value) return null;
  if (flag === "missing" || (!value && col.kind === "number"))
    return <span className="text-[#c2410c]">—</span>;
  if (col.kind === "file") {
    if (value === NO_FILE)
      return <span className="truncate text-black/35">{t(NO_FILE)}</span>;
    return (
      <span className="flex min-w-0 items-center gap-2 text-black/70">
        <FileText
          size={13}
          strokeWidth={1.5}
          className="flex-none text-black/55"
        />
        <span className="truncate">
          <Highlight text={text} query={query} />
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "truncate",
        col.kind === "number" && "tabular-nums",
        flag === "warn" && value === "Not stated"
          ? "text-[#c2410c]"
          : flag === "warn"
            ? "font-semibold text-[#111]"
            : "text-black/80",
      )}
    >
      <Highlight text={text} query={query} />
    </span>
  );
}

function StatusPill({ status }: { status: SheetRow["status"] }) {
  const t = useSheetT();
  if (status === "empty") return null;
  if (status === "review")
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#f2c98f] bg-[#fff8eb] px-2 py-px text-[11.5px] font-medium text-[#b45309]">
        <Eye size={12} strokeWidth={1.75} /> {t("To review")}
      </span>
    );
  if (status === "missing")
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-black/[0.06] px-2 py-px text-[11.5px] text-black/60">
        <CircleMinus size={12} strokeWidth={1.75} /> {t("Missing data")}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/15 bg-[#f7f6f2] px-2 py-px text-[11.5px] font-medium text-[#111]">
      <Check size={12} strokeWidth={2} /> {t("Confirmed")}
    </span>
  );
}

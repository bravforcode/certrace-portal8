"use client";

/* ════════════════════════════════════════════════════════════
   THE WORKSPACE SHEET — an Excel-style grid over the sheet data

   Formula bar (cell reference · fx · value) with the sheet's search and the
   save state in its right-hand corner; column letters and row numbers; the
   header row; the data rows; and the sheet tabs along the bottom, each with
   its count of rows still to review.

   Click a cell to select it, double-click (or Enter) to edit,
   Enter to keep and Escape to drop; arrow keys move. Every kept edit shows
   "Saving…" and then "All changes saved". Status cells are not typed into —
   they come from the checks.

   `empty` draws the plain sheet a year with no data shows: letters, row
   numbers and tabs, nothing in the cells.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, CircleMinus, Eye, FileText, Search, X } from "lucide-react";
import { cn } from "@/components/ui";
import { useLanguage, type TFunction } from "@/lib/i18n";
import { TH_WORKSPACE } from "@/lib/i18n-th-workspace";
import { InstallationSheet } from "@/components/workspace/installation-sheet";
import { missingFields, type Installation } from "@/lib/installations";
import { installationSheetStatus } from "@/lib/workbook/status";
import {
  INSTALLATION_SHEET_ID,
  NO_FILE,
  PRODUCTION_DIAGRAM_ID,
  issuesOf,
  letter,
  type Sheet,
  type SheetCol,
  type SheetRow,
} from "@/lib/workspace-sheets";

const MIN_ROWS = 20;

/* Inside the sheet the workspace's own Thai wins (แหล่งที่มา, วิธีได้ค่า, ผลิตภัณฑ์) over the
   portal-wide words for the same English (แหล่ง, วิธีการ, สินค้า), without changing them elsewhere. */
function useSheetT(): TFunction {
  const { lang, t } = useLanguage();
  return (en, vars) => (lang === "th" && !vars && TH_WORKSPACE[en] ? TH_WORKSPACE[en]! : t(en, vars));
}
const ROW_NO = "44px";

type SaveState = "saved" | "saving";

const RAW_KEYS = new Set(["description", "cn", "size", "type", "valid"]);
const isRaw = (c: SheetCol) => c.kind === "number" || c.kind === "file" || RAW_KEYS.has(c.key);

export function Spreadsheet({
  sheets,
  edits: saved = {},
  onEdit,
  empty = false,
  installation = null,
  onInstallationSave,
}: {
  sheets: Sheet[];
  edits?: Record<string, string>;
  onEdit?: (cell: string, value: string) => void;
  empty?: boolean;
  /** The site the Installation tab edits — the scoped installation's full record. */
  installation?: Installation | null;
  onInstallationSave?: (inst: Installation) => void;
}) {
  const t = useSheetT();
  const [tab, setTab] = React.useState<string>("materials");
  const [sel, setSel] = React.useState<{ r: number; c: number }>({ r: 0, c: 2 });
  const [editing, setEditing] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [save, setSave] = React.useState<SaveState>("saved");
  const gridRef = React.useRef<HTMLDivElement>(null);

  /* Kept edits show at once, before they are written: `pending` sits over the
     saved edits, and one timer writes everything pending together — so two
     quick edits cannot have the first one's timer report "saved" while the
     second is still on its way. Anything still pending is written on unmount. */
  const [pending, setPending] = React.useState<Record<string, string>>({});
  const pendingRef = React.useRef<Record<string, string>>({});
  const timer = React.useRef<number | undefined>(undefined);
  const onEditRef = React.useRef(onEdit);
  onEditRef.current = onEdit;
  const flush = React.useCallback(() => {
    window.clearTimeout(timer.current);
    const out = pendingRef.current;
    pendingRef.current = {};
    for (const [k, v] of Object.entries(out)) onEditRef.current?.(k, v);
    setPending({});
    setSave("saved");
  }, []);
  React.useEffect(() => () => {
    if (Object.keys(pendingRef.current).length) flush();
  }, [flush]);
  const edits = React.useMemo(() => ({ ...saved, ...pending }), [saved, pending]);

  const sheet = sheets.find((s) => s.id === tab);
  const isDiagram = tab === PRODUCTION_DIAGRAM_ID;
  const installIssues = installationSheetStatus(installation) === "missing" ? missingFields(installation).length : 0;
  const cols = sheet?.cols ?? [];
  const colCount = empty || !sheet ? 7 : cols.length;

  const keyOf = (r: number, c: number) => `${tab}:${r}:${cols[c]?.key}`;
  const valueOf = (row: SheetRow, r: number, c: number) => {
    const k = keyOf(r, c);
    return k in edits ? edits[k]! : (row.cells[cols[c]!.key] ?? "");
  };
  const shown = (col: SheetCol, v: string) => (v && !isRaw(col) ? t(v) : v);

  // Search: rows of this sheet with a cell that matches; counts per sheet for the tabs.
  const q = query.trim().toLowerCase();
  const rowMatches = (s: Sheet, row: SheetRow, r: number) =>
    !q ||
    s.cols.some((c) => {
      if (c.kind === "status") return false;
      const k = `${s.id}:${r}:${c.key}`;
      const v = k in edits ? edits[k]! : (row.cells[c.key] ?? "");
      return v.toLowerCase().includes(q) || shown(c, v).toLowerCase().includes(q);
    });
  const visible = sheet && !empty ? sheet.rows.map((row, r) => ({ row, r })).filter(({ row, r }) => rowMatches(sheet, row, r)) : [];
  const matchCount = (s: Sheet) => s.rows.filter((row, r) => rowMatches(s, row, r)).length;
  const firstVisible = visible[0]?.r;
  const selHidden = !!q && !visible.some((v) => v.r === sel.r);
  React.useEffect(() => {
    if (selHidden && firstVisible !== undefined) setSel((s) => ({ ...s, r: firstVisible }));
  }, [selHidden, firstVisible]);

  const template = [ROW_NO, ...(empty || !sheet ? Array(7).fill("minmax(96px,1fr)") : cols.map((c) => c.width))].join(" ");

  const selRow = sheet?.rows[sel.r];
  const selCol = cols[sel.c];
  const selValue =
    !empty && !selHidden && selRow && selCol && selCol.kind !== "status" ? shown(selCol, valueOf(selRow, sel.r, sel.c)) : "";
  const ref = `${letter(sel.c)}${sel.r + 2}`;

  const commit = (r: number, c: number, value: string) => {
    setEditing(null);
    gridRef.current?.focus();
    const row = sheet?.rows[r];
    if (!row || !onEdit) return;
    if (value === valueOf(row, r, c)) return;
    const k = keyOf(r, c);
    pendingRef.current = { ...pendingRef.current, [k]: value };
    setPending(pendingRef.current);
    setSave("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 700);
  };

  const editable = (c: number) => !empty && !!onEdit && cols[c]?.kind !== "status";

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing || empty || !sheet) return;
    const maxR = sheet.rows.length - 1;
    const maxC = cols.length - 1;
    const move = (dr: number, dc: number) => {
      e.preventDefault();
      setSel((s) => ({ r: Math.min(maxR, Math.max(0, s.r + dr)), c: Math.min(maxC, Math.max(0, s.c + dc)) }));
    };
    if (e.key === "ArrowDown") move(1, 0);
    else if (e.key === "ArrowUp") move(-1, 0);
    else if (e.key === "ArrowRight") move(0, 1);
    else if (e.key === "ArrowLeft") move(0, -1);
    else if (e.key === "Enter" && editable(sel.c)) {
      e.preventDefault();
      setEditing(keyOf(sel.r, sel.c));
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
      {/* ── Formula bar ─────────────────────────────── */}
      <div className="flex min-h-[36px] flex-wrap items-stretch border-b border-black/[0.08]">
        <div className="flex w-[76px] flex-none items-center justify-center border-r border-black/[0.08] font-mono text-[12px] text-black/75">
          {empty || isDiagram ? "" : ref}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
          <span className="font-serif text-[12px] italic text-black/35">fx</span>
          <span className="truncate text-[12.5px] text-black/80">{selValue}</span>
        </div>
        {!empty && !isDiagram && (
          <div className="flex items-center gap-3 border-l border-black/[0.08] px-2.5 py-1">
            <span
              aria-live="polite"
              className={cn(
                "hidden items-center gap-1.5 whitespace-nowrap text-[11.5px] sm:inline-flex",
                save === "saving" ? "text-black/45" : "text-black/40",
              )}
            >
              {save === "saving" ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                  {t("Saving…")}
                </>
              ) : (
                <>
                  <Check size={12} strokeWidth={2} className="text-emerald-600" />
                  {t("All changes saved")}
                </>
              )}
            </span>
            <label className="relative flex items-center">
              <Search size={12} strokeWidth={1.5} className="pointer-events-none absolute left-2 text-black/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search sheets…")}
                aria-label={t("Search sheets")}
                data-lock="allow"
                className="no-focus-ring h-7 w-44 rounded-md border border-black/10 bg-white pl-7 pr-6 text-[12px] text-black/70 placeholder:text-black/30 focus:border-black/25 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label={t("Clear search")}
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 grid h-5 w-5 place-items-center rounded text-black/35 hover:text-black"
                >
                  <X size={11} strokeWidth={2} />
                </button>
              )}
            </label>
          </div>
        )}
      </div>

      {/* ── Grid ────────────────────────────────────── */}
      {isDiagram ? (
        <div className="grid min-h-[420px] place-items-center bg-[#fafaf8] px-6 text-center">
          <div>
            <p className="text-[14px] text-black/55">{t("Production diagram")}</p>
            <p className="mt-1 text-[12.5px] text-black/35">{t("Coming soon.")}</p>
          </div>
        </div>
      ) : tab === INSTALLATION_SHEET_ID ? (
        <InstallationSheet key={installation?.id ?? ""} installation={installation} onSave={onInstallationSave} />
      ) : (
        <div
          ref={gridRef}
          role="grid"
          aria-label={sheet ? `${sheet.code} ${t(sheet.name)}` : t("Sheet")}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="no-focus-ring overflow-x-auto focus:outline-none"
        >
          <div className="grid min-w-max text-[12.5px]" style={{ gridTemplateColumns: template }}>
            {/* column letters */}
            <div className="sticky left-0 z-10 h-6 border-b border-r border-black/[0.08] bg-[#f0efea]" />
            {Array.from({ length: colCount }, (_, c) => (
              <div
                key={c}
                className={cn(
                  "flex h-6 items-center justify-center border-b border-r border-black/[0.08] text-[11px] text-black/45",
                  !empty && sel.c === c ? "bg-[#e3e2dc] font-medium text-black/70" : "bg-[#f0efea]",
                )}
              >
                {letter(c)}
              </div>
            ))}

            {/* header row */}
            <RowNo n={1} />
            {Array.from({ length: colCount }, (_, c) => (
              <div key={c} className="flex h-8 items-center border-b border-r border-black/[0.08] bg-[#f7f6f2] px-2.5 font-semibold text-[#111]">
                {!empty && cols[c] ? t(cols[c]!.label) : ""}
              </div>
            ))}

            {/* data rows */}
            {visible.map(({ row, r }) => (
              <div key={r} role="row" className="contents">
                <RowNo n={r + 2} on={sel.r === r} />
                {cols.map((col, c) => {
                  const k = keyOf(r, c);
                  const v = valueOf(row, r, c);
                  const flag = k in edits && v ? undefined : row.flags?.[col.key];
                  const selected = sel.r === r && sel.c === c;
                  return (
                    <div
                      key={col.key}
                      role="gridcell"
                      tabIndex={-1}
                      aria-selected={selected}
                      onClick={() => {
                        setSel({ r, c });
                        gridRef.current?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editable(c) && !editing) setEditing(k);
                      }}
                      onDoubleClick={() => editable(c) && setEditing(k)}
                      className={cn(
                        "relative flex h-8 min-w-0 items-center border-b border-r border-black/[0.08] px-2.5",
                        col.kind === "number" && "justify-end",
                        flag && "bg-[#fffbeb]",
                        selected && "z-[1] outline outline-2 -outline-offset-1 outline-[#111]",
                      )}
                    >
                      {editing === k ? (
                        <CellEditor
                          initial={v}
                          align={col.kind === "number" ? "right" : "left"}
                          onCommit={(val) => commit(r, c, val)}
                          onCancel={() => {
                            setEditing(null);
                            gridRef.current?.focus();
                          }}
                        />
                      ) : (
                        <CellView col={col} value={v} flag={flag} status={row.status} selected={selected} query={q} text={shown(col, v)} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* empty rows to the fold, like a fresh sheet */}
            {Array.from({ length: Math.max(0, MIN_ROWS - 1 - visible.length) }, (_, i) => {
              const n = (empty ? 2 : (sheet?.rows.length ?? 0) + 2) + i;
              return (
                <React.Fragment key={`e${i}`}>
                  <RowNo n={empty ? 2 + i : n} />
                  {Array.from({ length: colCount }, (_, c) => (
                    <div key={c} className="h-8 border-b border-r border-black/[0.08]" />
                  ))}
                </React.Fragment>
              );
            })}
          </div>
          {q && visible.length === 0 && (
            <p className="border-b border-black/[0.08] px-3 py-2 text-[12px] text-black/40">
              {t("No rows in this sheet match “{query}”.", { query })}
            </p>
          )}
        </div>
      )}

      {/* ── Sheet tabs ──────────────────────────────── */}
      <div className="flex items-stretch overflow-x-auto border-t border-black/[0.08] bg-[#f0efea] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ id: PRODUCTION_DIAGRAM_ID, code: "", name: "Production diagram" } as Pick<Sheet, "id" | "code" | "name">, ...sheets].map((s) => {
          const on = tab === s.id;
          const full = sheets.find((x) => x.id === s.id);
          const n = !full || empty ? 0 : s.id === INSTALLATION_SHEET_ID ? installIssues : q ? matchCount(full) : issuesOf(full);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setTab(s.id);
                setSel({ r: 0, c: 0 });
                setEditing(null);
              }}
              className={cn(
                "flex flex-none items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 text-[12.5px] transition-colors",
                on
                  ? "rounded-b-xl bg-white font-medium text-[#111] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-black/55 hover:text-black",
              )}
            >
              {s.code && <span>{s.code}</span>}
              {t(s.name)}
              {n > 0 && (
                <span
                  className={cn(
                    "grid h-4 min-w-4 place-items-center rounded-full px-1 font-mono text-[10px]",
                    q ? "bg-black/[0.07] text-black/55" : "bg-[#fdecc8] text-[#b45309]",
                  )}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RowNo({ n, on }: { n: number; on?: boolean }) {
  return (
    <div
      className={cn(
        "sticky left-0 z-10 flex h-8 items-center justify-center border-b border-r border-black/[0.08] text-[11.5px]",
        on ? "bg-[#e3e2dc] font-medium text-black/70" : "bg-[#f0efea] text-black/45",
      )}
    >
      {n}
    </div>
  );
}

function CellEditor({
  initial,
  align,
  onCommit,
  onCancel,
}: {
  initial: string;
  align: "left" | "right";
  onCommit: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = React.useState(initial);
  // Set once the edit is decided, so the blur that follows does not decide it again.
  const done = React.useRef(false);
  const finish = (keep: boolean) => {
    if (done.current) return;
    done.current = true;
    if (keep) onCommit(v);
    else onCancel();
  };
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") finish(true);
        else if (e.key === "Escape") finish(false);
      }}
      className={cn(
        "no-focus-ring h-full w-full bg-transparent text-[12.5px] text-[#111] focus:outline-none",
        align === "right" && "text-right",
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
      <mark className="rounded-sm bg-[#fde68a] text-inherit">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function CellView({
  col,
  value,
  flag,
  status,
  selected,
  query,
  text,
}: {
  col: SheetCol;
  value: string;
  flag?: "warn" | "missing";
  status: SheetRow["status"];
  selected: boolean;
  query: string;
  text: string;
}) {
  const t = useSheetT();
  if (col.kind === "status") return <StatusPill status={status} />;
  if (status === "empty" && !value) return null;
  if (flag === "missing" || (!value && col.kind === "number")) return <span className="text-[#c2410c]">—</span>;
  if (col.kind === "file") {
    if (value === NO_FILE) return <span className="truncate text-black/35">{t(NO_FILE)}</span>;
    return (
      <span className="flex min-w-0 items-center gap-2 text-black/70">
        <FileText size={13} strokeWidth={1.5} className="flex-none text-black/55" />
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
        flag === "warn" && value === "Not stated" ? "text-[#c2410c]" : flag === "warn" || selected ? "font-semibold text-[#111]" : "text-black/80",
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

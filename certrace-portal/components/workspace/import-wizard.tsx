"use client";

/* ════════════════════════════════════════════════════════════
   IMPORT WIZARD — brings an Excel or CSV file into one workbook sheet

   Five steps in MEASUR's order: file, header row, columns, preview, import.
   Nothing is written until the last step; then the rows go through the same
   savePatch path as typed edits, one patch after another. A failed patch stops
   the import and says how many rows were saved.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Button, Field, Modal, cn, inputClass } from "@/components/ui";
import { toast } from "@/components/toast";
import type { TFunction } from "@/lib/i18n";
import type { CellPatch } from "@/lib/workbook/flow-edit";
import type { SyncResult } from "@/lib/workbook/sync-queue";
import { cellKey } from "@/lib/workbook/cells";
import { IMPORT_LIMITS, buildImport, detectHeaderRow, parseCsv, suggestMapping } from "@/lib/workbook/import";
import { readXlsx } from "@/lib/workbook/xlsx";
import { letter, type Sheet } from "@/lib/workspace-sheets";

type Book = { name: string; rows: string[][] }[];
const STEPS = ["File", "Header row", "Columns", "Preview"] as const;
const HEADER_CHOICES = 15;
const PREVIEW_ROWS = 20;
const NO_ROWS: string[][] = [];

/* Reads the picked file. Throws an English message the wizard shows through t(). */
async function readFile(file: File): Promise<Book> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xls")) throw new Error("Save the file as .xlsx or .csv first.");
  if (file.size > IMPORT_LIMITS.bytes) throw new Error("The file is larger than 5 MB.");
  if (lower.endsWith(".csv")) return [{ name: file.name, rows: parseCsv(await file.text()) }];
  if (lower.endsWith(".xlsx")) return readXlsx(await file.arrayBuffer());
  throw new Error("Choose a .csv or .xlsx file.");
}

/* How many rows a patch holds: one status cell per imported row. */
const rowsIn = (patch: CellPatch) => Object.keys(patch).filter((k) => k.endsWith(":status")).length;

export function ImportWizard({
  sheet,
  cells,
  savePatch,
  onClose,
  t,
}: {
  sheet: Sheet;
  cells: Record<string, string>;
  savePatch: (patch: CellPatch) => Promise<SyncResult>;
  onClose: () => void;
  t: TFunction;
}) {
  const [step, setStep] = React.useState(0);
  const [fileName, setFileName] = React.useState("");
  const [book, setBook] = React.useState<Book | null>(null);
  const [sheetIdx, setSheetIdx] = React.useState(0);
  const [headerRow, setHeaderRow] = React.useState(0);
  const [mapping, setMapping] = React.useState<(string | null)[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [reading, setReading] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  // Focus moves to the new step's heading, so keyboard and screen-reader users land on the change.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const targets = React.useMemo(() => sheet.cols.filter((c) => c.kind !== "status"), [sheet]);
  const rows = book?.[sheetIdx]?.rows ?? NO_ROWS;
  const header = rows[headerRow] ?? [];
  const duplicate = mapping.some((k, i) => k !== null && mapping.indexOf(k) !== i);

  const plan = React.useMemo(
    () => (book ? buildImport(rows, headerRow, mapping, sheet.id, cells) : null),
    [book, rows, headerRow, mapping, sheet.id, cells],
  );

  // Preview: the first mapped rows, built by the same code that writes them, so the values shown are the stored ones.
  const preview = React.useMemo(() => {
    const head = rows[headerRow] ?? [];
    const sample = rows
      .slice(headerRow + 1)
      .filter((r) => mapping.some((k, i) => k && (r[i] ?? "").trim()))
      .slice(0, PREVIEW_ROWS);
    return { sample, built: buildImport([head, ...sample], 0, mapping, sheet.id, {}).patches[0] ?? {} };
  }, [rows, headerRow, mapping, sheet.id]);

  const samples = React.useMemo(
    () =>
      (rows[headerRow] ?? []).map((_, i) =>
        rows
          .slice(headerRow + 1)
          .map((r) => (r[i] ?? "").trim())
          .filter(Boolean)
          .slice(0, 3),
      ),
    [rows, headerRow],
  );

  const pickHeader = (source: string[][], row: number) => {
    setHeaderRow(row);
    setMapping(suggestMapping(source[row] ?? [], targets));
  };

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setError(null);
    setNotice(null);
    try {
      const sheets = await readFile(file);
      if (!sheets.length) throw new Error("This file has no sheets.");
      const first = sheets[0]!.rows;
      if (!first.length) throw new Error("This file has no rows.");
      setFileName(file.name);
      setBook(sheets);
      setSheetIdx(0);
      pickHeader(first, detectHeaderRow(first));
    } catch (e) {
      setBook(null);
      setError(e instanceof Error ? e.message : "This file could not be read.");
    } finally {
      setReading(false);
    }
  };

  const chooseSheet = (i: number) => {
    setSheetIdx(i);
    const next = book![i]!.rows;
    pickHeader(next, detectHeaderRow(next));
  };

  const startOver = () => {
    if (fileRef.current) fileRef.current.value = "";
    setStep(0);
    setBook(null);
    setFileName("");
    setSheetIdx(0);
    setHeaderRow(0);
    setMapping([]);
    setError(null);
    setNotice(null);
  };

  const canNext = step === 0 ? book !== null : step === 2 ? !duplicate : true;
  const canImport = plan !== null && plan.added > 0 && !progress && !duplicate;

  const runImport = async () => {
    if (!plan || progress) return;
    const total = plan.added;
    let done = 0;
    setNotice(null);
    setProgress({ done, total });
    for (const patch of plan.patches) {
      const result = await savePatch(patch);
      if (result !== "saved") {
        setProgress(null);
        setNotice(t("Imported {done} of {total} rows. The rest were not saved.", { done, total }));
        return;
      }
      done += rowsIn(patch);
      setProgress({ done, total });
    }
    toast({ message: t("Imported {n} rows into {sheet}", { n: done, sheet: t(sheet.name) }), tone: "ok" });
    onClose();
  };

  const dataLimited = rows.length - (headerRow + 1) > IMPORT_LIMITS.rows;

  return (
    <Modal
      open
      onClose={() => {
        if (!progress) onClose();
      }}
      title={t("Import from file")}
      width="max-w-3xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={startOver} disabled={!!progress}>
            {t("Start over")}
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setStep(step - 1)} disabled={!!progress}>
                {t("Back")}
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext || !!progress}>
                {t("Next")}
              </Button>
            ) : (
              <Button size="sm" onClick={runImport} disabled={!canImport}>
                {t("Import")}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Step strip: finished steps can be revisited; later ones cannot be reached yet. */}
      <ol className="mb-5 flex flex-wrap gap-2 text-[12px]">
        {STEPS.map((name, i) => (
          <li key={name}>
            <button
              type="button"
              disabled={i > step || !!progress}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
              className={cn(
                "rounded-full border px-3 py-1 transition-colors disabled:cursor-not-allowed",
                i === step ? "border-black/30 bg-[#111] text-white" : "border-black/10 text-black/60 enabled:hover:text-black",
              )}
            >
              {i + 1} {t(name)}
            </button>
          </li>
        ))}
      </ol>

      <h3 ref={headingRef} tabIndex={-1} className="mb-3 text-[15px] font-semibold text-[#111] focus:outline-none">
        {t(STEPS[step]!)}
      </h3>

      {/* The file input stays mounted on every step so Start over can clear it. */}
      <div hidden={step !== 0} className="space-y-4">
        <Field label={t("File")} hint={t("Choose a .csv or .xlsx file, up to 5 MB.")}>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            disabled={reading || !!progress}
            onChange={(e) => onPick(e.target.files?.[0])}
            className={inputClass}
          />
        </Field>
        {reading && (
          <p role="status" className="text-[13px] text-black/55">
            {t("Reading the file…")}
          </p>
        )}
        {error && (
          <p role="alert" className="text-[13px] text-err-text">
            {t(error)}
          </p>
        )}
        {book && (
          <div className="space-y-3">
            <p className="text-[13px] text-black/60">{t("{n} rows read from {name}", { n: rows.length, name: fileName })}</p>
            {book.length > 1 && (
              <Field label={t("Sheet")}>
                <select value={sheetIdx} onChange={(e) => chooseSheet(Number(e.target.value))} className={inputClass}>
                  {book.map((s, i) => (
                    <option key={i} value={i}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        )}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-[13px] text-black/60">{t("Choose the row with the column names.")}</p>
          <div className="max-h-[360px] overflow-auto rounded-xl border border-black/10">
            <table className="w-full border-collapse text-[12.5px]">
              <tbody>
                {rows.slice(0, HEADER_CHOICES).map((row, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0">
                    <td className="px-2 py-1.5">
                      <input
                        type="radio"
                        name="import-header-row"
                        aria-label={t("Row {n}", { n: i + 1 })}
                        checked={i === headerRow}
                        onChange={() => pickHeader(rows, i)}
                      />
                    </td>
                    <td className="px-2 py-1.5 font-mono text-black/45">{i + 1}</td>
                    {row.slice(0, 8).map((cell, c) => (
                      <td key={c} className="max-w-[160px] truncate px-2 py-1.5 text-black/75">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-[13px] text-black/60">{t("Match each column in the file to a column in the sheet.")}</p>
          <ul className="divide-y divide-black/[0.06] rounded-xl border border-black/10">
            {header.map((name, i) => (
              <li key={i} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[1fr_1fr_200px] sm:items-center">
                <span className="truncate text-[13px] font-medium text-[#111]">
                  {name.trim() || t("Column {letter}", { letter: letter(i) })}
                </span>
                <span className="truncate text-[12px] text-black/45">
                  {samples[i]?.length ? `${t("Sample")}: ${samples[i]!.join(" · ")}` : ""}
                </span>
                <select
                  aria-label={t("Sheet column for {col}", { col: name.trim() || letter(i) })}
                  value={mapping[i] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    setMapping((m) => m.map((k, j) => (j === i ? value : k)));
                  }}
                  className={inputClass}
                >
                  <option value="">{t("Skip")}</option>
                  {targets.map((c) => (
                    <option key={c.key} value={c.key}>
                      {t(c.label)}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          {duplicate && (
            <p role="alert" className="text-[13px] text-err-text">
              {t("Each sheet column can be used once")}
            </p>
          )}
        </div>
      )}

      {step === 3 && plan && (
        <div className="space-y-3">
          <div className="max-h-[320px] overflow-auto rounded-xl border border-black/10">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-black/[0.03] text-left text-black/60">
                  {mapping.map((k, i) =>
                    k ? (
                      <th key={i} className="px-2 py-1.5 font-semibold">
                        {t(targets.find((c) => c.key === k)?.label ?? k)}
                      </th>
                    ) : null,
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.sample.map((_, r) => (
                  <tr key={r} className="border-t border-black/[0.06]">
                    {mapping.map((k, i) =>
                      k ? (
                        <td key={i} className="px-2 py-1.5 text-black/80">
                          {preview.built[cellKey(sheet.id, r, k)] ?? ""}
                        </td>
                      ) : null,
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-black/70">
            {t("{added} rows will be added · {skipped} empty rows skipped", { added: plan.added, skipped: plan.skipped })}
          </p>
          <p className="text-[12.5px] text-warn-text">{t("Imported rows are marked Needs review")}</p>
          {dataLimited && (
            <p className="text-[12.5px] text-black/60">{t("Only the first {n} rows will be imported.", { n: IMPORT_LIMITS.rows })}</p>
          )}
          {progress && (
            <p role="status" className="text-[13px] text-black/60">
              {t("Importing… {done} / {total}", { done: progress.done, total: progress.total })}
            </p>
          )}
          {notice && (
            <p role="alert" className="text-[13px] text-err-text">
              {notice}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

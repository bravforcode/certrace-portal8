"use client";

/* ════════════════════════════════════════════════════════════
   IMPORT WIZARD — brings an Excel or CSV file into one workbook sheet

   Five steps in MEASUR's order: file, header row, columns, preview, import.
   Nothing is written until the last step; then the rows go through the same
   savePatch path as typed edits, one patch after another. A failed patch stops
   the import; the next press of Import resumes at that patch, so no row is sent
   twice. Once a run has saved rows, the steps behind it are locked, so the
   mapping cannot change under the patches already written.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Button, Field, Modal, cn, inputClass } from "@/components/ui";
import { toast } from "@/components/toast";
import type { TFunction } from "@/lib/i18n";
import type { CellPatch } from "@/lib/workbook/flow-edit";
import type { SyncResult } from "@/lib/workbook/sync-queue";
import { cellKey } from "@/lib/workbook/cells";
import {
  IMPORT_LIMITS,
  buildImport,
  decodeCsv,
  detectHeaderRow,
  fileProblem,
  hasDuplicateMapping,
  parseCsv,
  saveInOrder,
  suggestMapping,
} from "@/lib/workbook/import";
import { ImportError } from "@/lib/workbook/import-limits";
import { readXlsx } from "@/lib/workbook/xlsx";
import { letter, type Sheet } from "@/lib/workspace-sheets";

type Book = { name: string; rows: string[][] }[];
const STEPS = ["File", "Header row", "Columns", "Preview"] as const;
const HEADER_CHOICES = 15;
const PREVIEW_ROWS = 20;
const NO_ROWS: string[][] = [];
const CONTROL = "input:not([disabled]),select:not([disabled]),button:not([disabled])";
const UNREADABLE = "This file could not be read.";

/* Reads the picked file. Problems we can name come out as ImportError; anything else is reported as UNREADABLE. */
async function readFile(file: File): Promise<Book> {
  const problem = fileProblem(file.name, file.size);
  if (problem) throw new ImportError(problem);
  const bytes = await file.arrayBuffer();
  if (file.name.toLowerCase().endsWith(".csv")) return [{ name: file.name, rows: parseCsv(decodeCsv(bytes)) }];
  return readXlsx(bytes);
}

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
  // The sheet is fixed when the wizard opens, so changing the open tab cannot move the import.
  const [target] = React.useState(sheet);
  const [step, setStep] = React.useState(0);
  const [fileName, setFileName] = React.useState("");
  const [book, setBook] = React.useState<Book | null>(null);
  const [sheetIdx, setSheetIdx] = React.useState(0);
  const [headerRow, setHeaderRow] = React.useState(0);
  const [mapping, setMapping] = React.useState<(string | null)[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [reading, setReading] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [saved, setSaved] = React.useState(0); // rows written by earlier runs
  const [resumeAt, setResumeAt] = React.useState(0); // first patch not yet saved
  const [notice, setNotice] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const readToken = React.useRef(0); // a read that was overtaken (Start over, or a new file) is ignored
  const planRef = React.useRef<ReturnType<typeof buildImport> | null>(null); // frozen once a run starts
  const partial = resumeAt > 0;

  // Each step opens on its first usable control, not on the heading.
  React.useEffect(() => {
    const controls = [...(bodyRef.current?.querySelectorAll<HTMLElement>(CONTROL) ?? [])];
    controls.find((el) => !el.closest("[hidden]"))?.focus();
  }, [step]);

  const targets = React.useMemo(() => target.cols.filter((c) => c.kind !== "status"), [target]);
  const rows = book?.[sheetIdx]?.rows ?? NO_ROWS;
  const header = rows[headerRow] ?? [];
  const duplicate = hasDuplicateMapping(mapping);

  const plan = React.useMemo(
    () => (book ? buildImport(rows, headerRow, mapping, target.id, cells) : null),
    [book, rows, headerRow, mapping, target.id, cells],
  );

  // Preview: the first mapped rows, built by the same code that writes them, so the values shown are the stored ones.
  const preview = React.useMemo(() => {
    const head = rows[headerRow] ?? [];
    const sample = rows
      .slice(headerRow + 1)
      .filter((r) => mapping.some((k, i) => k && (r[i] ?? "").trim()))
      .slice(0, PREVIEW_ROWS);
    return { sample, built: buildImport([head, ...sample], 0, mapping, target.id, {}).patches[0] ?? {} };
  }, [rows, headerRow, mapping, target.id]);

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
    planRef.current = null;
    setHeaderRow(row);
    setMapping(suggestMapping(source[row] ?? [], targets));
  };

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    const token = ++readToken.current;
    setReading(true);
    setError(null);
    setNotice(null);
    try {
      const sheets = await readFile(file);
      if (token !== readToken.current) return;
      if (!sheets.length) throw new ImportError("This file has no sheets.");
      const first = sheets[0]!.rows;
      if (!first.length) throw new ImportError("This file has no rows.");
      setFileName(file.name);
      setBook(sheets);
      setSheetIdx(0);
      pickHeader(first, detectHeaderRow(first));
    } catch (e) {
      if (token !== readToken.current) return;
      setBook(null);
      setError(e instanceof ImportError ? e.message : UNREADABLE);
    } finally {
      if (token === readToken.current) setReading(false);
    }
  };

  const chooseSheet = (i: number) => {
    setSheetIdx(i);
    const next = book![i]!.rows;
    pickHeader(next, detectHeaderRow(next));
  };

  const startOver = () => {
    readToken.current++;
    planRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
    setStep(0);
    setBook(null);
    setFileName("");
    setSheetIdx(0);
    setHeaderRow(0);
    setMapping([]);
    setError(null);
    setNotice(null);
    setReading(false);
  };

  const canNext = step === 0 ? book !== null : step === 2 ? !duplicate : true;
  const canImport = plan !== null && plan.added > 0 && !progress && !duplicate;

  const runImport = async () => {
    if (!plan || progress) return;
    // A retry continues the plan the first run froze, so its patches keep the same row numbers.
    const run = planRef.current ?? plan;
    planRef.current = run;
    setNotice(null);
    setProgress({ done: saved, total: run.added });
    const result = await saveInOrder(run.patches, savePatch, resumeAt, (n) =>
      setProgress({ done: saved + n, total: run.added }),
    );
    const done = saved + result.rows;
    setSaved(done);
    setResumeAt(result.next);
    setProgress(null);
    if (result.failed) {
      setNotice(t("Imported {done} of {total} rows. The rest were not saved.", { done, total: run.added }));
      return;
    }
    toast({ message: t("Imported {n} rows into {sheet}", { n: done, sheet: t(target.name) }), tone: "ok" });
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
          <Button variant="ghost" size="sm" onClick={startOver} disabled={!!progress || reading || partial}>
            {t("Start over")}
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setStep(step - 1)} disabled={!!progress || partial}>
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
      {/* Step strip: finished steps can be revisited; later ones cannot be reached yet. Locked once rows are saved. */}
      <ol className="mb-5 flex flex-wrap gap-2 text-[12px]">
        {STEPS.map((name, i) => (
          <li key={name}>
            <button
              type="button"
              disabled={i > step || !!progress || partial}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
              className={cn(
                "rounded-full border px-3 py-1 transition-colors disabled:cursor-not-allowed",
                i === step
                  ? "border-black/30 bg-[color:var(--flow-ink)] text-white"
                  : "border-black/10 text-black/60 enabled:hover:text-black",
              )}
            >
              {i + 1} {t(name)}
            </button>
          </li>
        ))}
      </ol>

      <div ref={bodyRef}>
        <h3 className="mb-3 text-[15px] font-semibold text-[color:var(--flow-ink)]">{t(STEPS[step]!)}</h3>

        {/* The file input stays mounted on every step so Start over can clear it. */}
        <div hidden={step !== 0} className="space-y-4">
          <Field label={t("File")}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              aria-describedby="import-file-hint"
              disabled={reading || !!progress || partial}
              onChange={(e) => onPick(e.target.files?.[0])}
              className={inputClass}
            />
          </Field>
          <p id="import-file-hint" className="text-[12.5px] text-black/45">
            {t("Choose a .csv or .xlsx file, up to 5 MB.")}
          </p>
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
                  <select
                    value={sheetIdx}
                    disabled={partial}
                    onChange={(e) => chooseSheet(Number(e.target.value))}
                    className={inputClass}
                  >
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
                  <span className="truncate text-[13px] font-medium text-[color:var(--flow-ink)]">
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
                            {preview.built[cellKey(target.id, r, k)] ?? ""}
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
      </div>
    </Modal>
  );
}

"use client";

/* ════════════════════════════════════════════════════════════
   STARTING A YEAR — three ways, one Confirm

     1. Upload files (the main way): no limit, and each file needs one line
        saying what it is — a name like "scan_0042.pdf" does not say which
        month or which material it covers.
     2. Start from the beginning: empty sheets, filled in by hand.
     3. Start from an earlier year: a copy of any earlier year with data.

   Nothing happens until Confirm, and Confirm asks once more, because it
   closes the year to further uploads. 2 and 3 are the secondary cards
   under the drop zone; choosing one of them, or adding a file, is the
   choice — and a second click on a chosen card takes the choice back.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Copy, FilePlus2, FileText, UploadCloud, X } from "lucide-react";
import { Button, Card, Eyebrow, Modal, cn, inputClass } from "@/components/ui";
import { Select } from "@/components/controls";
import { useT } from "@/lib/i18n";
import { yearRange } from "@/lib/year-range";
import type { WorkspaceFile } from "@/lib/workspace-sheets";
import {
  UPLOAD_LIMITS,
  uploadProblem,
  type UploadProblem,
} from "@/lib/workbook/limits";

type Draft = {
  id: string;
  name: string;
  size: number;
  type: string;
  description: string;
};
type Mode = "upload" | "blank" | "copy";

const sizeLabel = (n: number) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

export function UploadPanel({
  year,
  onYear,
  copyFrom,
  onConfirm,
  onBlank,
  onCopy,
}: {
  year: number;
  onYear: (y: number) => void;
  /** earlier years that have data, newest first */
  copyFrom: number[];
  onConfirm: (files: WorkspaceFile[]) => void;
  onBlank: () => void;
  onCopy: (from: number) => void;
}) {
  const t = useT();
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [drag, setDrag] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const [asking, setAsking] = React.useState(false);
  const [source, setSource] = React.useState("");
  const [limitNote, setLimitNote] = React.useState<UploadProblem | null>(null);
  const input = React.useRef<HTMLInputElement>(null);

  // A different year starts with nothing chosen.
  React.useEffect(() => {
    setMode(null);
    setDrafts([]);
    setTried(false);
    setSource("");
    setAsking(false);
    setLimitNote(null);
  }, [year]);

  const add = (list: FileList | File[]) => {
    const next = [...list].map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      description: "",
    }));
    if (next.length === 0) return;
    setDrafts((d) => [...d, ...next]);
    setMode("upload");
  };

  const undescribed = drafts.filter((d) => !d.description.trim()).length;

  /* A second click on the chosen card un-chooses it: back to the upload if
     files were already added, otherwise to nothing chosen. */
  const toggle = (m: "blank" | "copy") =>
    setMode((cur) => (cur === m ? (drafts.length > 0 ? "upload" : null) : m));

  // What Confirm would do, and whether it can yet.
  const canConfirm =
    mode === "upload"
      ? drafts.length > 0 && undescribed === 0
      : mode === "blank"
        ? true
        : mode === "copy"
          ? !!source
          : false;
  const status =
    mode === null
      ? t("Choose how to start {year}.", { year })
      : mode === "upload"
        ? drafts.length === 0
          ? t("No files yet.")
          : undescribed > 0
            ? drafts.length === 1
              ? t("1 file · it still needs a description")
              : t("{n} files · {m} still need a description", {
                  n: drafts.length,
                  m: undescribed,
                })
            : drafts.length === 1
              ? t("1 file ready")
              : t("{n} files ready", { n: drafts.length })
        : mode === "blank"
          ? t("{year} starts with empty sheets.", { year })
          : source
            ? t("{year} starts as a copy of {from}.", { year, from: source })
            : t("Pick the year to copy.");

  const onConfirmClick = () => {
    setTried(true);
    const problem = mode === "upload" ? uploadProblem(drafts) : null;
    setLimitNote(problem);
    if (canConfirm && !problem) setAsking(true);
  };

  const limitText = (p: UploadProblem) =>
    p.field === "files"
      ? t("Upload at most {n} files at a time.", { n: p.max })
      : p.field === "name"
        ? t("The file name of {file} is longer than {n} characters.", {
            file: p.file,
            n: p.max,
          })
        : p.field === "type"
          ? t("The file type of {file} is longer than {n} characters.", {
              file: p.file,
              n: p.max,
            })
          : t("The description of {file} is longer than {n} characters.", {
              file: p.file,
              n: p.max,
            });

  const finish = () => {
    setAsking(false);
    if (mode === "upload")
      onConfirm(
        drafts.map(({ id, name, size, type, description }) => ({
          id,
          name,
          size,
          type,
          description: description.trim(),
        })),
      );
    else if (mode === "blank") onBlank();
    else if (mode === "copy" && source) onCopy(Number(source));
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Eyebrow>{t("Upload")}</Eyebrow>
          <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
            {t("Upload your files for {year}", { year })}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/45">
            {t(
              "Add every file you have — invoices, bills, stock cards, process maps. There is no limit. Say in one line what each file is.",
            )}
          </p>
        </div>
        <div className="w-full flex-none sm:w-40">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">
            {t("Year")}
          </span>
          <Select
            value={String(year)}
            onChange={(v) => onYear(Number(v))}
            options={yearRange().map((y) => ({
              value: String(y),
              label: String(y),
            }))}
            ariaLabel={t("Year")}
          />
        </div>
      </div>

      {/* 1 — the main way: upload */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) add(e.dataTransfer.files);
        }}
        className={cn(
          "relative mt-6 rounded-2xl border px-6 py-9 text-center transition-colors",
          drag
            ? "border-dashed border-black/40 bg-black/[0.03]"
            : mode === "upload"
              ? "border-black/30 bg-black/[0.02]"
              : "border-dashed border-black/15",
        )}
      >
        <UploadCloud
          size={26}
          strokeWidth={1.25}
          className="mx-auto text-black/35"
        />
        <p className="mt-3 text-[14px] text-black/70">{t("Drop files here")}</p>
        <p className="mt-1 text-[12px] text-black/35">
          {t("PDF, Excel, Word, images — any number of files")}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => input.current?.click()}
        >
          {t("Choose files")}
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* the files, each with its description */}
      {mode === "upload" && drafts.length > 0 && (
        <ul className="mt-4 divide-y divide-black/[0.06] rounded-xl border border-black/[0.08]">
          {drafts.map((d) => {
            const bad = tried && !d.description.trim();
            return (
              <li
                key={d.id}
                className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)_auto] md:items-center"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <FileText
                    size={16}
                    strokeWidth={1.5}
                    className="flex-none text-black/45"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] text-black/80">
                      {d.name}
                    </span>
                    <span className="block font-mono text-[10.5px] text-black/35">
                      {sizeLabel(d.size)}
                    </span>
                  </span>
                </span>
                <span>
                  <input
                    value={d.description}
                    maxLength={UPLOAD_LIMITS.description}
                    onChange={(e) =>
                      setDrafts((list) =>
                        list.map((x) =>
                          x.id === d.id
                            ? { ...x, description: e.target.value }
                            : x,
                        ),
                      )
                    }
                    placeholder={t(
                      "What is this file? e.g. Zinc purchase orders, Jan–Jun",
                    )}
                    aria-label={t("Description of {file}", { file: d.name })}
                    aria-invalid={bad}
                    className={cn(
                      inputClass,
                      "py-2.5",
                      bad && "border-[rgba(220,38,38,0.45)]",
                    )}
                  />
                  {bad && (
                    <span className="mt-1 block text-[11.5px] text-[#dc2626]">
                      {t("Say what this file is")}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  aria-label={t("Remove {file}", { file: d.name })}
                  onClick={() =>
                    setDrafts((list) => list.filter((x) => x.id !== d.id))
                  }
                  className="grid h-8 w-8 place-items-center justify-self-end rounded-lg text-black/35 transition-colors hover:bg-black/[0.05] hover:text-black"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 2 and 3 — the secondary ways */}
      <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.1em] text-black/35">
        <span className="h-px flex-1 bg-black/[0.07]" />
        {t("or")}
        <span className="h-px flex-1 bg-black/[0.07]" />
      </div>
      <div
        role="group"
        aria-label={t("How to start {year}", { year })}
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        <StartChoice
          on={mode === "blank"}
          onPick={() => toggle("blank")}
          icon={<FilePlus2 size={17} strokeWidth={1.5} />}
          title={t("Start from the beginning")}
          body={t("Empty sheets for {year}, filled in by hand.", { year })}
        />
        <StartChoice
          on={mode === "copy"}
          onPick={() => toggle("copy")}
          disabled={copyFrom.length === 0}
          icon={<Copy size={17} strokeWidth={1.5} />}
          title={t("Start from an earlier year")}
          body={
            copyFrom.length === 0
              ? t("No earlier year has data yet.")
              : t("Copy the files and sheets of a year that already has data.")
          }
        >
          {mode === "copy" && (
            <div className="mt-3 w-full sm:w-44">
              <Select
                value={source}
                onChange={setSource}
                placeholder={t("Pick a year")}
                options={copyFrom.map((y) => ({
                  value: String(y),
                  label: String(y),
                }))}
                ariaLabel={t("Copy from year")}
                invalid={tried && !source}
              />
            </div>
          )}
        </StartChoice>
      </div>

      {/* one Confirm for all three */}
      <div className="mt-6 flex flex-col gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12.5px] text-black/45">
          {limitNote ? limitText(limitNote) : status}
        </p>
        <Button
          onClick={onConfirmClick}
          disabled={mode === null}
          className="self-start sm:self-auto"
        >
          {t("Confirm")}
        </Button>
      </div>

      <Modal
        open={asking}
        onClose={() => setAsking(false)}
        title={
          mode === "upload"
            ? drafts.length === 1
              ? t("Confirm 1 file for {year}?", { year })
              : t("Confirm {n} files for {year}?", { n: drafts.length, year })
            : mode === "blank"
              ? t("Start {year} from the beginning?", { year })
              : t("Start {year} as a copy of {from}?", { year, from: source })
        }
        lead={
          mode === "upload"
            ? t(
                "Once you confirm, we set up the workspace from these files and no more can be added to {year}.",
                { year },
              )
            : mode === "blank"
              ? t(
                  "{year} opens with empty sheets. Files can't be uploaded to it afterwards.",
                  { year },
                )
              : t(
                  "{year} opens with the files and sheets of {from}. Files can't be uploaded to it afterwards.",
                  { year, from: source },
                )
        }
        width="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAsking(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={finish}>{t("Confirm")}</Button>
          </>
        }
      >
        {mode === "upload" ? (
          <ul className="max-h-60 space-y-1.5 overflow-y-auto">
            {drafts.map((d) => (
              <li key={d.id} className="flex items-start gap-2 text-[13px]">
                <FileText
                  size={14}
                  strokeWidth={1.5}
                  className="mt-0.5 flex-none text-black/40"
                />
                <span className="min-w-0">
                  <span className="block truncate text-black/75">{d.name}</span>
                  <span className="block truncate text-[12px] text-black/40">
                    {d.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </Card>
  );
}

function StartChoice({
  on,
  onPick,
  disabled,
  icon,
  title,
  body,
  children,
}: {
  on: boolean;
  onPick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3.5 transition-colors",
        disabled
          ? "border-black/[0.06] opacity-50"
          : on
            ? "border-black/30 bg-black/[0.02]"
            : "border-black/[0.08] hover:border-black/20",
      )}
    >
      <button
        type="button"
        aria-pressed={on}
        disabled={disabled}
        onClick={onPick}
        className="flex w-full items-start gap-3 text-left disabled:cursor-not-allowed"
      >
        <span
          className={cn(
            "mt-0.5 flex-none",
            on ? "text-[#111]" : "text-black/40",
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-[13.5px]",
              on ? "text-[#111]" : "text-black/70",
            )}
          >
            {title}
          </span>
          <span className="mt-0.5 block text-[12px] text-black/45">{body}</span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "mt-1 grid h-4 w-4 flex-none place-items-center rounded-full border",
            on ? "border-[#111]" : "border-black/20",
          )}
        >
          {on && <span className="h-2 w-2 rounded-full bg-[#111]" />}
        </span>
      </button>
      {children && <div className="pl-[29px]">{children}</div>}
    </div>
  );
}

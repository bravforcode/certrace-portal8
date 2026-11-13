"use client";

/* ════════════════════════════════════════════════════════════
   IMPORT FILE — adding files to a year that is already open

   Two parts. ImportFilePanel sits at the top of the workspace side panel:
   the year's files with their review state, and the Import file button.
   The button opens ImportFileSection, a full-width upload card above the
   sheet, laid out like the card that starts a year (upload-panel.tsx), so
   the drop zone has room. Upload only: no year picker and no "start from"
   choice, because the year and its start are already set. Each file still
   needs one line saying what it is.

   Every file then waits for Certrace to review it. The five-dot scale reads
   red while the review is pending and green once it is done; nothing in
   between is shown because nothing in between is tracked.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { FileText, Table2, UploadCloud, X } from "lucide-react";
import { Button, Card, Eyebrow, Modal, cn, inputClass } from "@/components/ui";
import { SettingUpStage } from "@/components/workspace/setting-up";
import { useT } from "@/lib/i18n";
import { uploadable, type WorkspaceFile } from "@/lib/workspace-sheets";
import {
  UPLOAD_LIMITS,
  uploadProblem,
  type UploadProblem,
} from "@/lib/workbook/limits";

/** How long the set-up animation plays after an upload before the section closes. */
const SETTING_UP_MS = 4200;

const SCALE = ["#dc2626", "#f97316", "#eab308", "#84cc16", "#16a34a"];

/** The section's id, so the side panel's button can say what it opens. */
export const IMPORT_SECTION_ID = "import-file-section";

const sizeLabel = (n: number) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

export function ImportFilePanel({
  files,
  open,
  onToggle,
}: {
  files: WorkspaceFile[];
  /** Whether the upload section is showing. */
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const pending = files.filter((f) => !f.reviewedAt).length;

  return (
    <section
      aria-label={t("Files")}
      className="rounded-2xl border border-black/[0.07] bg-white p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-medium text-[#111]">{t("Files")}</h3>
          <p className="mt-0.5 text-[11.5px] text-black/45">
            {files.length === 0
              ? t("No files yet")
              : pending === 0
                ? t("All reviewed")
                : t("{n} waiting for review", { n: pending })}
          </p>
        </div>
        <Button
          size="sm"
          variant={open ? "secondary" : "primary"}
          aria-expanded={open}
          aria-controls={IMPORT_SECTION_ID}
          onClick={onToggle}
          className="flex-none"
        >
          <UploadCloud size={14} strokeWidth={1.5} /> {t("Import file")}
        </Button>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 grid max-h-80 gap-x-8 gap-y-2.5 overflow-y-auto border-t border-black/[0.06] pt-3 pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((f) => (
            <li key={f.id} className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText
                  size={13}
                  strokeWidth={1.5}
                  className="flex-none text-black/40"
                />
                <span
                  className="min-w-0 flex-1 truncate text-[12.5px] text-black/75"
                  title={f.description || f.name}
                >
                  {f.name}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 pl-[21px]">
                <ReviewScale done={Boolean(f.reviewedAt)} />
                <span
                  className={cn(
                    "text-[11px]",
                    f.reviewedAt ? "text-[#15803d]" : "text-[#b91c1c]",
                  )}
                >
                  {f.reviewedAt ? t("Completed") : t("Pending")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The upload card the Import file button opens, full width above the sheet. */
export function ImportFileSection({
  year,
  files,
  onAdd,
  onMapCsv,
  onClose,
}: {
  year?: number;
  /** The year's files so far: they count toward the cap the server enforces. */
  files: WorkspaceFile[];
  /** Resolves true once the server has the files; on false the drafts stay so nothing typed is lost. */
  onAdd: (files: WorkspaceFile[], blobs: Map<string, Blob>) => Promise<boolean>;
  /** Opens the CSV column mapper for the current sheet, when the sheet takes one. */
  onMapCsv?: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const [drafts, setDrafts] = React.useState<WorkspaceFile[]>([]);
  const [drag, setDrag] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<UploadProblem | null>(null);
  const [settingUp, setSettingUp] = React.useState<string[] | null>(null);
  const [refused, setRefused] = React.useState<string[]>([]);
  const input = React.useRef<HTMLInputElement>(null);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const blobs = React.useRef(new Map<string, Blob>());

  // Opened from the side panel: bring the card into view and move focus to it.
  React.useEffect(() => {
    // It opens right under the Import file button, so scroll only as far as needed ("nearest"), keeping the
    // button in view; scroll-mt-24 keeps the card clear of the sticky h-16 shell header if it does align to the top.
    document.getElementById(IMPORT_SECTION_ID)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    heading.current?.focus({ preventScroll: true });
  }, []);

  const done = React.useCallback(() => {
    setSettingUp(null);
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    if (!settingUp) return;
    const id = window.setTimeout(done, SETTING_UP_MS);
    return () => window.clearTimeout(id);
  }, [settingUp, done]);

  const add = (list: FileList | File[]) => {
    const all = [...list];
    setRefused(all.filter((f) => !uploadable(f)).map((f) => f.name));
    const next = all.flatMap((raw) => {
      const f = uploadable(raw);
      if (!f) return [];
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      blobs.current.set(id, f);
      return [{ id, name: f.name, size: f.size, type: f.type, description: "" }];
    });
    if (next.length) setDrafts((d) => [...d, ...next]);
  };

  const undescribed = drafts.filter((d) => !d.description.trim()).length;

  const upload = async () => {
    setTried(true);
    // The year's existing files count toward the 200-file cap the server enforces.
    const p = uploadProblem([...files, ...drafts]);
    setProblem(p);
    if (p || undescribed > 0 || drafts.length === 0) return;
    setBusy(true);
    try {
      const saved = await onAdd(
        drafts.map((d) => ({ ...d, description: d.description.trim() })),
        blobs.current,
      );
      if (!saved) return;
      blobs.current.clear();
      setSettingUp(drafts.map((d) => d.name));
      setDrafts([]);
      setTried(false);
    } finally {
      setBusy(false);
    }
  };

  // After an upload only the set-up animation is left; the card closes with it.
  if (settingUp)
    return (
      <Modal
        open
        onClose={done}
        title={t("Setting up your workspace")}
        lead={t(
          "We're adding your files. Certrace reviews each one and marks it Completed.",
        )}
        width="max-w-3xl"
      >
        <SettingUpStage files={settingUp} />
      </Modal>
    );

  return (
    <div id={IMPORT_SECTION_ID} className="scroll-mt-24">
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>{t("Upload")}</Eyebrow>
          <h2
            ref={heading}
            tabIndex={-1}
            className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111] focus:outline-none"
          >
            {year
              ? t("Upload your files for {year}", { year })
              : t("Import file")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/45">
            {t(
              "Add every file you have — invoices, bills, stock cards, process maps. There is no limit. Say in one line what each file is.",
            )}
          </p>
        </div>
        <button
          type="button"
          aria-label={t("Close")}
          onClick={onClose}
          className="grid h-9 w-9 flex-none place-items-center rounded-lg text-black/40 transition-colors hover:bg-black/[0.05] hover:text-black"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

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
          "mt-6 rounded-2xl border px-6 py-9 text-center transition-colors",
          drag
            ? "border-dashed border-black/40 bg-black/[0.03]"
            : drafts.length > 0
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

      {drafts.length > 0 && (
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
                      setDrafts((l) =>
                        l.map((x) =>
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
                    setDrafts((l) => l.filter((x) => x.id !== d.id))
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

      <div className="mt-6 flex flex-col gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {onMapCsv && (
            <button
              type="button"
              onClick={onMapCsv}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-black/50 underline-offset-2 hover:text-black/80 hover:underline"
            >
              <Table2 size={13} strokeWidth={1.5} />
              {t("Map a CSV into this sheet")}
            </button>
          )}
          {refused.length > 0 && (
            <p role="alert" className="mt-1 text-[12px] text-[#dc2626]">
              {t("Not added, this file type is not accepted: {files}", {
                files: refused.join(", "),
              })}
            </p>
          )}
          {problem && (
            <p role="alert" className="mt-1 text-[12px] text-[#dc2626]">
              {problem.field === "files"
                ? t("A year holds at most {n} files.", { n: problem.max })
                : t("{file} is over the {n}-character limit.", {
                    file: problem.file,
                    n: problem.max,
                  })}
            </p>
          )}
        </div>
        <div className="flex flex-none items-center gap-2 self-start sm:self-auto">
          <Button variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={upload} disabled={drafts.length === 0 || busy}>
            {busy ? t("Uploading…") : t("Upload")}
          </Button>
        </div>
      </div>
    </Card>
    </div>
  );
}

/** Five dots from red to green. Pending lights the first; Completed lights all five. */
export function ReviewScale({ done }: { done: boolean }) {
  const t = useT();
  return (
    <span
      role="img"
      aria-label={done ? t("Review completed") : t("Review pending")}
      className="flex items-center gap-1"
    >
      {SCALE.map((c, i) => (
        <span
          key={c}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: done || i === 0 ? c : "rgba(0,0,0,0.1)",
          }}
        />
      ))}
    </span>
  );
}

"use client";

/* ════════════════════════════════════════════════════════════
   IMPORT FILE — the top of the workspace side panel

   Adds files to a year that is already open. Upload only: no year picker and
   no "start from" choice, because the year and its start are already set. Each
   file still needs one line saying what it is.

   Every file then waits for Certrace to review it. The five-dot scale reads
   red while the review is pending and green once it is done; nothing in
   between is shown because nothing in between is tracked.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { FileText, Table2, UploadCloud, X } from "lucide-react";
import { Button, Modal, cn, inputClass } from "@/components/ui";
import { SettingUpStage } from "@/components/workspace/setting-up";
import { useT } from "@/lib/i18n";
import { uploadable, type WorkspaceFile } from "@/lib/workspace-sheets";
import {
  UPLOAD_LIMITS,
  uploadProblem,
  type UploadProblem,
} from "@/lib/workbook/limits";

/** How long the set-up animation plays after an upload before the panel shows the files. */
const SETTING_UP_MS = 4200;

const SCALE = ["#dc2626", "#f97316", "#eab308", "#84cc16", "#16a34a"];

const sizeLabel = (n: number) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

export function ImportFilePanel({
  files,
  onAdd,
  onMapCsv,
}: {
  files: WorkspaceFile[];
  /** Resolves true once the server has the files; on false the drafts stay so nothing typed is lost. */
  onAdd: (files: WorkspaceFile[], blobs: Map<string, Blob>) => Promise<boolean>;
  /** Opens the CSV column mapper for the current sheet, when the sheet takes one. */
  onMapCsv?: () => void;
}) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [drafts, setDrafts] = React.useState<WorkspaceFile[]>([]);
  const [drag, setDrag] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<UploadProblem | null>(null);
  const [settingUp, setSettingUp] = React.useState<string[] | null>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const blobs = React.useRef(new Map<string, Blob>());
  const [refused, setRefused] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!settingUp) return;
    const id = window.setTimeout(() => setSettingUp(null), SETTING_UP_MS);
    return () => window.clearTimeout(id);
  }, [settingUp]);

  const add = (list: FileList | File[]) => {
    const all = [...list];
    const ok = all.flatMap((f) => {
      const file = uploadable(f);
      return file ? [file] : [];
    });
    setRefused(all.filter((f) => !uploadable(f)).map((f) => f.name));
    const next = ok.map((f) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      blobs.current.set(id, f);
      return { id, name: f.name, size: f.size, type: f.type, description: "" };
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
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

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
          onClick={() => setOpen((v) => !v)}
          className="flex-none"
        >
          <UploadCloud size={14} strokeWidth={1.5} /> {t("Import file")}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
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
              "rounded-xl border px-4 py-5 text-center transition-colors",
              drag
                ? "border-dashed border-black/40 bg-black/[0.03]"
                : "border-dashed border-black/15",
            )}
          >
            <UploadCloud
              size={22}
              strokeWidth={1.25}
              className="mx-auto text-black/35"
            />
            <p className="mt-2 text-[13px] text-black/70">
              {t("Drop files here")}
            </p>
            <p className="mt-0.5 text-[11.5px] text-black/40">
              {t("PDF, Excel, Word, images")}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
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
            <ul className="space-y-2">
              {drafts.map((d) => {
                const bad = tried && !d.description.trim();
                return (
                  <li
                    key={d.id}
                    className="rounded-xl border border-black/[0.08] p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <FileText
                        size={14}
                        strokeWidth={1.5}
                        className="flex-none text-black/45"
                      />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-black/80">
                        {d.name}
                      </span>
                      <span className="flex-none font-mono text-[10.5px] text-black/35">
                        {sizeLabel(d.size)}
                      </span>
                      <button
                        type="button"
                        aria-label={t("Remove {file}", { file: d.name })}
                        onClick={() =>
                          setDrafts((l) => l.filter((x) => x.id !== d.id))
                        }
                        className="grid h-7 w-7 flex-none place-items-center rounded-lg text-black/35 hover:bg-black/[0.05] hover:text-black"
                      >
                        <X size={13} strokeWidth={1.75} />
                      </button>
                    </div>
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
                      placeholder={t("What is this file?")}
                      aria-label={t("Description of {file}", { file: d.name })}
                      aria-invalid={bad}
                      className={cn(
                        inputClass,
                        "mt-2 py-2 text-[12.5px]",
                        bad && "border-[rgba(220,38,38,0.45)]",
                      )}
                    />
                    {bad && (
                      <span className="mt-1 block text-[11px] text-[#dc2626]">
                        {t("Say what this file is")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {refused.length > 0 && (
            <p role="alert" className="text-[11.5px] text-[#dc2626]">
              {t("Not added, this file type is not accepted: {files}", {
                files: refused.join(", "),
              })}
            </p>
          )}
          {problem && (
            <p role="alert" className="text-[11.5px] text-[#dc2626]">
              {problem.field === "files"
                ? t("A year holds at most {n} files.", { n: problem.max })
                : t("{file} is over the {n}-character limit.", {
                    file: problem.file,
                    n: problem.max,
                  })}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            {onMapCsv ? (
              <button
                type="button"
                onClick={onMapCsv}
                className="inline-flex items-center gap-1.5 text-[12px] text-black/50 underline-offset-2 hover:text-black/80 hover:underline"
              >
                <Table2 size={13} strokeWidth={1.5} />
                {t("Map a CSV into this sheet")}
              </button>
            ) : (
              <span />
            )}
            <Button
              size="sm"
              onClick={upload}
              disabled={drafts.length === 0 || busy}
            >
              {busy ? t("Uploading…") : t("Upload")}
            </Button>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <ul className="mt-4 max-h-80 space-y-2.5 overflow-y-auto border-t border-black/[0.06] pt-3 pr-1">
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

      <Modal
        open={settingUp !== null}
        onClose={() => setSettingUp(null)}
        title={t("Setting up your workspace")}
        lead={t(
          "We're adding your files. Certrace reviews each one and marks it Completed.",
        )}
        width="max-w-3xl"
      >
        <SettingUpStage files={settingUp ?? []} />
      </Modal>
    </section>
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

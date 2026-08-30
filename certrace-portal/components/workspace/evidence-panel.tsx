"use client";

/* ════════════════════════════════════════════════════════════
   EVIDENCE, WHERE THE NUMBER IS

   This used to live only on an Evidence tab: twelve month sections, each
   repeating the month's required figures, sitting three tabs away from the
   screen where those figures were typed. Nobody attaches a March gas bill from
   a list of twelve months in December. They attach it while they are looking
   at March's gas reading.

   So the per-month machinery moved into the month editor and the precursor
   rows, and this file is what both of them render. The Evidence tab keeps the
   things that genuinely belong to the YEAR — installation identity, the
   calibration file, a carbon-price receipt — and stops pretending to be the
   place monthly paperwork gets done.

   WHAT THE AI DOES AND DOES NOT DO is unchanged and load-bearing: extraction
   PROPOSES. Each field arrives with a confidence and an Accept / Edit / Reject
   control, only Accept writes anything, and an unreviewed extraction does not
   count toward coverage. The whole point of evidence is that a human tied a
   number to a document; an AI silently filling the field destroys exactly the
   traceability being tested.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, ExternalLink, Paperclip, Sparkles, Trash2, TriangleAlert, Upload } from "lucide-react";
import { Progress, inputClass, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { Note } from "@/components/workspace/chrome";
import { saveMonth, type MonthlyEntry } from "@/lib/monthly-data";
import { getWorkspace } from "@/lib/workspace";
import { workspaceRequiresIndirectEmissions } from "@/lib/cbam/product-category-rules";
import { useT } from "@/lib/i18n";
import {
  CONFIDENCE_FLOOR,
  EVIDENCE_SOURCE_LABEL,
  annualEvidence,
  INLINE_BYTES_LIMIT,
  applyAcceptedField,
  coverageForMonth,
  coverageRowFor,
  evidenceForMonth,
  extractionAvailable,
  isLowConfidence,
  isReviewed,
  removeEvidence,
  runExtraction,
  saveEvidence,
  uid,
  type CoverageRow,
  type EvidenceItem,
  type EvidenceSourceType,
  type ExtractedField,
  type RequiredKey,
} from "@/lib/workspace-evidence";

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });

/** Which kind of document a required key normally is. Pre-selecting it saves a
    dropdown on every upload without ever being wrong in a way that matters —
    the type is metadata a verifier reads, not an input to any calculation. */
export function sourceTypeForKey(key: string): EvidenceSourceType {
  if (key.startsWith("fuel:")) return "fuel_invoice";
  if (key.startsWith("electricity")) return "utility_invoice";
  // "meter_log", not "production_log" — the latter is not a member of
  // EvidenceSourceType. The old evidence page asserted it with `as`, which
  // type-checked and then rendered an empty chip, because the label lookup had
  // no such key.
  if (key === "production") return "meter_log";
  if (key === "carbon-price") return "carbon_price_receipt";
  if (key === "calibration-records") return "calibration_record";
  return "other";
}

export async function uploadEvidence({
  file,
  workspaceId,
  month,
  fieldKeys,
  sourceType,
  uploadedBy,
  boundTo,
  onProgress,
}: {
  file: File;
  workspaceId: string;
  month?: string;
  fieldKeys: string[];
  sourceType: EvidenceSourceType;
  /** who attached the file — shown on the Documents card. Omit to leave it
      unattributed, matching every call site written before this existed. */
  uploadedBy?: string;
  /** the bind target, when it is already known at upload time (e.g. a card
      dropzone that is itself scoped to one supplier). Otherwise the item
      arrives unbound and the Documents card's inline picker fills it in. */
  boundTo?: string;
  onProgress: (busyId: string | null) => void;
}): Promise<void> {
  let dataUrl: string | undefined;
  try {
    if (file.size <= INLINE_BYTES_LIMIT) dataUrl = await readFileAsDataUrl(file);
  } catch {
    dataUrl = undefined;
  }

  const item: EvidenceItem = {
    id: uid(),
    workspaceId,
    month,
    fieldKeys,
    sourceType,
    fileName: file.name,
    fileDataUrl: dataUrl,
    mimeType: file.type,
    sizeBytes: file.size,
    capturedAt: new Date().toISOString(),
    uploadedBy,
    boundTo,
  };

  const { stored } = saveEvidence(item);
  onProgress(null);
  if (!stored) {
    toast({
      message: "File too large to keep in the browser",
      detail: "The index entry was saved without the bytes. This is why a backend is the next step.",
      tone: "warn",
    });
  }

  if (extractionAvailable() && dataUrl) {
    onProgress(item.id);
    saveEvidence({ ...item, extraction: { status: "pending", fields: [] } });
    const extraction = await runExtraction(item);
    saveEvidence({ ...item, extraction });
    onProgress(null);
    if (extraction.status === "failed") toast({ message: "Extraction failed", detail: extraction.error, tone: "warn" });
  }
}

function FieldRow({ field, onAct }: { field: ExtractedField; onAct: (f: ExtractedField, a: "accept" | "reject", v?: string) => void }) {
  const t = useT();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(field.value);
  const low = isLowConfidence(field);

  if (field.accepted) {
    return (
      <li className="flex items-center gap-2 py-2 text-[12px] text-[#047857]">
        <Check size={13} strokeWidth={1.5} />
        <span className="font-mono">{field.key}</span>
        <span className="text-black/60">
          {field.value} {field.unit ?? ""}
        </span>
        <span className="text-black/35">{t("accepted")}</span>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <span className="font-mono text-[11px] text-black/45">{field.key}</span>
      {editing ? (
        <input className={cn(inputClass, "w-40 px-3 py-1.5 text-[13px]")} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
      ) : (
        <span className="text-[13px] text-black/80">
          {field.value} {field.unit ?? ""}
        </span>
      )}
      <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", low ? "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]" : "border-black/10 text-black/40")}>
        {Math.round(field.confidence * 100)}%
      </span>
      <span className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => onAct(field, "accept", editing ? value : undefined)}
          className="rounded-lg px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-[#047857] hover:bg-[#ecfdf5]"
        >
          {t("Accept")}
        </button>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-lg px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-black/45 hover:bg-black/[0.04]"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
        <button
          type="button"
          onClick={() => onAct(field, "reject")}
          className="rounded-lg px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-black/45 hover:bg-[#fef2f2] hover:text-[#dc2626]"
        >
          {t("Reject")}
        </button>
      </span>
    </li>
  );
}

export function ExtractionPanel({ item, entry, onChange }: { item: EvidenceItem; entry: MonthlyEntry | null; onChange: () => void }) {
  const t = useT();
  const x = item.extraction;
  if (!x) return null;

  if (x.status === "pending") return <p className="mt-2 text-[12px] text-black/45">{t("Reading the document…")}</p>;

  if (x.status === "failed") {
    return (
      <div className="mt-2">
        <Note tone="warn">{x.error ?? "Extraction failed. Enter the values by hand — the file is still attached."}</Note>
      </div>
    );
  }

  const act = (field: ExtractedField, action: "accept" | "reject", editedValue?: string) => {
    const next = { ...item, extraction: { ...x, fields: [] as ExtractedField[] } };

    if (action === "reject") {
      next.extraction!.fields = x.fields.filter((f) => f.key !== field.key);
      saveEvidence(next);
      onChange();
      toast({ message: "Proposal rejected", detail: "Nothing was written. The coverage gap stays open.", tone: "info" });
      return;
    }

    const value = editedValue ?? field.value;
    next.extraction!.fields = x.fields.map((f) => (f.key === field.key ? { ...f, value, accepted: true } : f));
    saveEvidence(next);

    if (entry) {
      const outcome = applyAcceptedField(entry, { ...field, value });
      if (outcome.applied) saveMonth(outcome.entry);
      toast({ message: "Accepted", detail: outcome.note, tone: "ok" });
    } else {
      toast({ message: "Accepted", detail: "Recorded against the document.", tone: "ok" });
    }
    onChange();
  };

  return (
    <div className="mt-3 rounded-xl border border-black/[0.07] bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={13} strokeWidth={1.5} className="text-black/35" />
        <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">{t("Proposed values — nothing is written until you accept")}</span>
      </div>

      {x.status === "needs_review" && (
        <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-[#fffbeb] px-3 py-2 text-[12px] text-[#78350f]">
          <TriangleAlert size={13} strokeWidth={1.5} className="mt-0.5 flex-none" />
          At least one value came back below {CONFIDENCE_FLOOR} confidence. Check it against the document before accepting.
        </p>
      )}

      {x.fields.length === 0 ? (
        <p className="text-[12px] text-black/40">{t("All proposals have been dealt with.")}</p>
      ) : (
        <ul className="divide-y divide-black/[0.05]">
          {x.fields.map((f) => (
            <FieldRow key={f.key} field={f} onAct={act} />
          ))}
        </ul>
      )}

      {x.rawSummary && <p className="mt-2 text-[11px] italic text-black/35">{x.rawSummary}</p>}
    </div>
  );
}

export function AttachButton({
  onFile,
  label = "Attach",
  compact = true,
}: {
  onFile: (f: File) => void;
  label?: string;
  compact?: boolean;
}) {
  const t = useT();
  return (
    <label
      className={cn(
        "flex-none cursor-pointer rounded-lg border border-black/10 uppercase tracking-[0.08em] text-black/50 hover:border-black/25 hover:text-black",
        compact ? "px-2.5 py-1 text-[11px]" : "px-4 py-2 text-[12px]",
      )}
    >
      <Upload size={11} strokeWidth={1.5} className="mr-1 inline" />
      {t(label)}
      <input
        type="file"
        className="hidden"
        accept="application/pdf,image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

/* ── Open the attached file ─────────────────────────────────────
   Through a Blob rather than by handing the data: URL straight to
   window.open — Chrome blocks top-level navigation to a data: URL, so the
   obvious spelling silently does nothing. Above INLINE_BYTES_LIMIT only the
   metadata was ever kept (see lib/workspace-evidence.ts), so there is
   genuinely nothing to open and the control says so instead of failing. */
export function openEvidenceDocument(item: EvidenceItem) {
  if (!item.fileDataUrl) {
    toast({ message: "Nothing stored to open", detail: `${item.fileName} was too large to keep in the browser — only its record is held here.`, tone: "warn" });
    return;
  }
  try {
    const [meta, b64] = item.fileDataUrl.split(",");
    const mime = /:(.*?);/.exec(meta)?.[1] ?? item.mimeType ?? "application/octet-stream";
    const bytes = atob(b64);
    const buf = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) buf[i] = bytes.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([buf], { type: mime }));
    window.open(url, "_blank", "noopener");
    // Revoked on a timer rather than immediately: the new tab has to have
    // started reading it first, and there is no event that says it has.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    toast({ message: "Could not open this file", detail: item.fileName, tone: "warn" });
  }
}

export function EvidenceItemCard({
  item,
  entry,
  busy,
  openable,
  onChange,
}: {
  item: EvidenceItem;
  entry: MonthlyEntry | null;
  busy: boolean;
  /** Set by the precursor Documents block. There, a file is a file: the
      reader wants to READ it, and what they get instead is two badges
      classifying it — a source type that is "Other" for almost everything a
      supplier attaches, and a review state that belongs to the extraction
      workflow rather than to the document. Both are dropped for the one
      control that is actually wanted. */
  openable?: boolean;
  onChange: () => void;
}) {
  const t = useT();
  return (
    <div className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Paperclip size={13} strokeWidth={1.5} className="text-black/35" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-black/80">{item.fileName}</span>
        {openable ? (
          <button
            type="button"
            onClick={() => openEvidenceDocument(item)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/12 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.06em] text-black/55 transition-colors hover:border-black/25 hover:bg-black/[0.03] hover:text-black"
          >
            <ExternalLink size={11} strokeWidth={1.5} /> {t("Open document")}
          </button>
        ) : (
          <>
            <span className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] text-black/45">{t(EVIDENCE_SOURCE_LABEL[item.sourceType])}</span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px]",
                isReviewed(item) ? "border-[rgba(5,150,105,0.2)] bg-[#ecfdf5] text-[#047857]" : "border-[#fde68a] bg-[#fffbeb] text-[#b45309]",
              )}
            >
              {isReviewed(item) ? "Reviewed" : "Awaiting review"}
            </span>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            removeEvidence(item.workspaceId, item.id);
            onChange();
          }}
          className="rounded-lg p-1.5 text-black/25 hover:bg-[#fef2f2] hover:text-[#dc2626]"
          aria-label={t("Remove")}
        >
          <Trash2 size={13} strokeWidth={1.5} />
        </button>
      </div>
      {busy && <p className="mt-2 text-[12px] text-black/45">{t("Reading the document…")}</p>}
      <ExtractionPanel item={item} entry={entry} onChange={onChange} />
    </div>
  );
}

export function CoverageRows({
  rows,
  onAttach,
}: {
  rows: CoverageRow[];
  onAttach: (row: CoverageRow, file: File) => void;
}) {
  const t = useT();
  return (
    <ul className="divide-y divide-black/[0.05]">
      {rows.map((row) => (
        <li key={row.key} className="flex flex-wrap items-center gap-3 py-2.5 text-[13px]">
          <span className={cn("h-1.5 w-1.5 flex-none rounded-full", row.covered ? "bg-[#10b981]" : "bg-[#facc15]")} />
          <span className="min-w-0 flex-1 text-black/75">{t(row.label)}</span>
          {row.awaitingReview > 0 && (
            <span className="text-[11px] text-[#b45309]">{t("{count} awaiting review", { count: row.awaitingReview })}</span>
          )}
          <span className="font-mono text-[11px] text-black/35">{row.key}</span>
          <AttachButton onFile={(f) => onAttach(row, f)} />
        </li>
      ))}
    </ul>
  );
}

/* ── An evidence block for a NON-monthly section ────────────────
   The Evidence tab is gone. Its job — "which figures have a document behind
   them" — did not disappear with it; it moved next to the figures.

   A separate tab for paperwork is the same mistake in every compliance tool:
   the document belongs to the number, and putting it one navigation away means
   the number gets entered in March and the bill gets hunted for in December,
   by which time it is gone. So this block renders wherever a section asks for
   figures — the MMD, the precursor chain — carrying the same coverage rule and
   the same attach control the month screens already use.

   `keys` decides what the section is responsible for; everything else is
   shared, so a section added later cannot invent its own idea of covered. */
export function SectionEvidence({
  workspaceId,
  keys,
  emptyLabel = "Nothing attached yet.",
  openable,
  onChange,
}: {
  workspaceId: string;
  keys: RequiredKey[];
  emptyLabel?: string;
  /** see EvidenceItemCard's own note — the precursor forms set this */
  openable?: boolean;
  onChange?: () => void;
}) {
  const t = useT();
  const [items, setItems] = React.useState<EvidenceItem[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);

  const keySet = React.useMemo(() => keys.map((k) => k.key).join("|"), [keys]);

  const reload = React.useCallback(() => {
    const wanted = new Set(keySet.split("|").filter(Boolean));
    setItems(annualEvidence(workspaceId).filter((i) => i.fieldKeys.some((k) => wanted.has(k))));
    onChange?.();
  }, [workspaceId, keySet, onChange]);

  React.useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, keySet]);

  const rows: CoverageRow[] = React.useMemo(() => {
    const attached = annualEvidence(workspaceId);
    // Through coverageRowFor, not hand-built — a hand-built row is how the
    // citation stopped reaching the screen the first time (see the comment
    // above `coverageRowFor`), and it is also how a hand-built row would
    // silently disagree with the binding gate every other coverage figure
    // in the app now goes through.
    return keys.map((k) => coverageRowFor(k, attached));
    // items is in the dep list so the rows recompute after an upload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, keySet, items]);

  const attach = (row: CoverageRow, file: File) =>
    void uploadEvidence({
      file,
      workspaceId,
      month: undefined,
      fieldKeys: [row.key],
      sourceType: sourceTypeForKey(row.key),
      onProgress: (id) => {
        setBusy(id);
        reload();
      },
    }).then(reload);

  const covered = rows.filter((r) => r.covered).length;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[12px] text-black/45">
          {t("{covered} of {total} have a document behind them.", { covered, total: rows.length })}
        </span>
        <span className="font-mono text-[12px] text-black/45">{rows.length ? Math.round((covered / rows.length) * 100) : 0}%</span>
      </div>
      <Progress value={rows.length ? (covered / rows.length) * 100 : 0} tone={covered === rows.length ? "ok" : "warn"} />

      <div className="mt-3">
        <CoverageRows rows={rows} onAttach={attach} />
      </div>

      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <EvidenceItemCard key={item.id} item={item} entry={null} busy={busy === item.id} openable={openable} onChange={reload} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-black/35">{t(emptyLabel)}</p>
      )}
    </div>
  );
}

/* ── The whole per-month block ──────────────────────────────────
   Required figures, their coverage, and the documents attached to them —
   rendered inside the month it describes. */
export function MonthEvidence({ workspaceId, entry, onChange }: { workspaceId: string; entry: MonthlyEntry; onChange: () => void }) {
  const [items, setItems] = React.useState<EvidenceItem[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [cov, setCov] = React.useState<ReturnType<typeof coverageForMonth> | null>(null);

  const reload = React.useCallback(() => {
    const ws = getWorkspace(workspaceId);
    setCov(coverageForMonth(workspaceId, entry, ws ? workspaceRequiresIndirectEmissions(ws.productId) : false));
    setItems(evidenceForMonth(workspaceId, entry.month));
    onChange();
  }, [workspaceId, entry, onChange]);

  React.useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, entry.month, entry.fuels.length]);

  if (!cov) return null;

  const attach = (row: CoverageRow, file: File) =>
    void uploadEvidence({
      file,
      workspaceId,
      month: entry.month,
      fieldKeys: [row.key],
      sourceType: sourceTypeForKey(row.key),
      onProgress: (id) => {
        setBusy(id);
        reload();
      },
    }).then(reload);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] text-black/45">
          {cov.covered} of {cov.total} figures in this month have a reviewed document behind them.
        </span>
        <span className="font-mono text-[12px] text-black/45">{Math.round(cov.ratio * 100)}%</span>
      </div>
      <Progress value={cov.ratio * 100} tone={cov.complete ? "ok" : "warn"} />

      <div className="mt-3">
        <CoverageRows rows={cov.rows} onAttach={attach} />
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <EvidenceItemCard key={item.id} item={item} entry={entry} busy={busy === item.id} onChange={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

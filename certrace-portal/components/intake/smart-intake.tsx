"use client";

/* ════════════════════════════════════════════════════════════
   SMART INTAKE — the screen

   PROTOTYPE. One component, two doors: the exporter's workspace tab
   (app/(portal)/workspaces/[id]/intake) and the supplier's Smart Link
   Documents step (app/w/[token]). What differs between them is who is named
   as the uploader and how a month is written — the supplier flow holds the
   open month in an edit buffer, so it passes its own writer.

   The page is only a door: drop files, and the review popup
   (detection-summary.tsx) opens. Checking and confirming happen there and
   nowhere else — this page used to repeat every question as a pile of cards
   under the popup, which left the reader unsure where to confirm. What stays
   here is a way back into the popup for anything left waiting, and a short
   list of what has been filed.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Eye, FileSearch, FlaskConical, Loader2, TriangleAlert, Undo2, Upload, X } from "lucide-react";
import { DocumentPreview } from "@/components/intake/document-preview";
import { DetectionSummary, type SummaryItem } from "@/components/intake/detection-summary";
import { Button, Card, cn, inputClass } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { recordFillRun } from "@/lib/ai-fill";
import { useLanguage, useT } from "@/lib/i18n";
import { FUEL_TYPES, fuelTypeLabelIn } from "@/lib/monthly-data";
import { getWorkspace, monthsOf } from "@/lib/workspace";
import { CONFIDENCE_FLOOR, type ExtractedField } from "@/lib/workspace-evidence";
import {
  DOC_SUBJECTS,
  DOC_SUBJECT_LABEL,
  WRITES_TO,
  addFiles,
  clearFinished,
  fileDoc,
  intakeQueue,
  needsFuel,
  patchDoc,
  shortTargetLabel,
  subscribeIntake,
  targetsFor,
  verdictFor,
  type IntakeDoc,
  type MonthWriter,
  type ShortLabel,
} from "@/lib/smart-intake";

const FIELD_LABEL: Record<string, string> = {
  "billing-period-start": "Billing period start",
  "billing-period-end": "Billing period end",
  "electricity-consumed": "Electricity consumed",
  "meter-number": "Meter number",
  "total-amount": "Total amount",
  "supplier-name": "Issued by",
  "fuel-quantity": "Fuel quantity",
  ncv: "Net calorific value",
  "delivery-date": "Delivery date",
  "production-tonnes": "Production output",
  "scrap-tonnes": "Scrap",
  "cn-code": "CN code",
  "instrument-serial": "Instrument serial",
  "calibration-date": "Calibration date",
  "next-calibration-due": "Next calibration due",
  "heat-number": "Heat number",
  "net-mass": "Net mass",
  "production-route": "Production route",
};

const fieldLabel = (key: string) => FIELD_LABEL[key] ?? key.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** A value as the popup shows it: grouped digits, and the conversion when the
    box it fills uses a different unit (kWh → MWh, kg → t). */
const fmtWriteValue = (value: string, unit?: string): string => {
  const n = Number(String(value).replace(/[,\s]/g, ""));
  if (!Number.isFinite(n)) return `${value} ${unit ?? ""}`.trim();
  const u = (unit ?? "").toLowerCase();
  if (u === "kwh") return `${n.toLocaleString("en-GB")} kWh → ${(n / 1000).toLocaleString("en-GB")} MWh`;
  if (u === "kg") return `${n.toLocaleString("en-GB")} kg → ${(n / 1000).toLocaleString("en-GB")} t`;
  return `${n.toLocaleString("en-GB")} ${unit ?? ""}`.trim();
};

/** The bundled sample PDFs for one door ("workspace" or "supplier"), as Files. */
export async function loadSampleFiles(set: "workspace" | "supplier"): Promise<File[]> {
  const index = (await (await fetch("/mock-documents/index.json")).json()) as { file: string; sets?: string[] }[];
  const picked = index.filter((e) => !e.sets || e.sets.includes(set));
  return Promise.all(picked.map(async ({ file }) => new File([await (await fetch(`/mock-documents/${file}`)).blob()], file, { type: "application/pdf" })));
}

/** What a confirm did, for the host to take the reader there. */
export type IntakeResult = { docs: number; values: number; months: string[] };

function useMonthLabel() {
  const { lang } = useLanguage();
  return React.useCallback(
    (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { month: "short", year: "numeric" }),
    [lang],
  );
}

function ViewButton({ doc }: { doc: IntakeDoc }) {
  const t = useT();
  const monthLabel = useMonthLabel();
  const [open, setOpen] = React.useState(false);
  if (!doc.fileDataUrl) return null;
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Eye size={13} /> {t("View document")}
      </Button>
      <DocumentPreview
        doc={doc}
        open={open}
        onClose={() => setOpen(false)}
        labelFor={(k) => t(fieldLabel(k))}
        heading={`${t(DOC_SUBJECT_LABEL[doc.subject])}${doc.month ? ` · ${monthLabel(doc.month)}` : ""}`}
      />
    </>
  );
}

/* ── The fix-it form, drawn inside the popup ──────────────────── */
function DocEditor({ doc }: { doc: IntakeDoc }) {
  const t = useT();
  const monthLabel = useMonthLabel();
  const { lang } = useLanguage();
  const ws = getWorkspace(doc.workspaceId);
  const months = ws ? monthsOf(ws) : [];
  const v = verdictFor(doc);
  const targets = targetsFor(doc.workspaceId, doc.month);
  const renderShort = (s: ShortLabel) => t(s.text, { fuel: s.fuelType ? fuelTypeLabelIn(lang, s.fuelType) : t("Fuel") });
  const whereLabel = (key: string, scope: "month" | "annual") =>
    `${renderShort(shortTargetLabel(doc.workspaceId, key, doc.month, doc.fuelType))} · ${scope === "month" && doc.month ? monthLabel(doc.month) : t("whole year")}`;
  const set = (patch: Partial<IntakeDoc>) => patchDoc(doc.workspaceId, doc.id, patch);
  const setField = (key: string, patch: Partial<ExtractedField>) => set({ fields: doc.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)) });

  return (
    <div>
      {/* A duplicate is already said above the editor, as the reason. */}
      <div className="grid gap-3 px-3 py-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.1em] text-black/45">{t("What it is")}</span>
          <Select
            value={doc.subject}
            onChange={(s) => set({ subject: s as IntakeDoc["subject"], targetOverride: undefined, fuelType: needsFuel(s as IntakeDoc["subject"]) ? doc.fuelType : undefined })}
            options={DOC_SUBJECTS.map((s) => ({ value: s, label: t(DOC_SUBJECT_LABEL[s]) }))}
            ariaLabel={t("What it is")}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.1em] text-black/45">{t("Month it covers")}</span>
          <Select
            value={doc.month ?? ""}
            onChange={(m) => set({ month: m || undefined, targetOverride: undefined })}
            options={[{ value: "", label: t("No specific month") }, ...months.map((m) => ({ value: m, label: monthLabel(m) }))]}
            ariaLabel={t("Month it covers")}
          />
          {doc.month && !months.includes(doc.month) && (
            <span className="mt-1 block text-[11.5px] text-[#b45309]">{t("{month} is outside this reporting year.", { month: monthLabel(doc.month) })}</span>
          )}
        </label>

        {needsFuel(doc.subject) && (
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.1em] text-black/45">{t("Fuel")}</span>
            <Select
              value={doc.fuelType ?? ""}
              onChange={(f) => set({ fuelType: f || undefined, targetOverride: undefined })}
              options={FUEL_TYPES.map((f) => ({ value: f.id, label: fuelTypeLabelIn(lang, f.id) }))}
              searchable
              ariaLabel={t("Fuel")}
            />
          </label>
        )}

        <label className={cn("block", !needsFuel(doc.subject) && "sm:col-span-2")}>
          <span className="mb-1 block text-[11px] uppercase tracking-[0.1em] text-black/45">{t("Files to")}</span>
          {v.suggestion.addFuelRow && !doc.targetOverride ? (
            <div className="rounded-xl border border-dashed border-black/15 bg-white px-3 py-2 text-[12.5px] text-black/60">
              {t("There is no {fuel} row in {month} yet. Filing adds one, with the EU standard factors.", {
                fuel: fuelTypeLabelIn(lang, v.suggestion.addFuelRow),
                month: doc.month ? monthLabel(doc.month) : "",
              })}
            </div>
          ) : (
            <Select
              value={doc.targetOverride ?? v.suggestion.key ?? ""}
              onChange={(k) => set({ targetOverride: k || undefined })}
              options={targets.map((tg) => ({ value: tg.key, label: whereLabel(tg.key, tg.scope) }))}
              placeholder={t("Pick a checklist row")}
              invalid={!!v.blocked}
              ariaLabel={t("Files to")}
            />
          )}
          {v.blocked && (
            <span className="mt-1 flex items-start gap-1 text-[11.5px] text-[#b45309]">
              <TriangleAlert size={12} className="mt-0.5 flex-none" /> {t(v.blocked)}
            </span>
          )}
          {v.notNeeded && <span className="mt-1 block text-[11.5px] text-black/50">{t("Pick a row above if it is needed anyway.")}</span>}
        </label>
      </div>

      {doc.fields.length > 0 && (
        <div className="border-t border-black/[0.06] px-3 py-2.5">
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.1em] text-black/45">{t("Values found — untick anything you don't want kept")}</div>
          <ul className="divide-y divide-black/[0.05]">
            {doc.fields.map((f) => {
              const low = f.confidence < CONFIDENCE_FLOOR;
              return (
                <li key={f.key} className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 py-2", low && "rounded-lg bg-[#fffbeb] px-2")}>
                  <input type="checkbox" className="h-4 w-4 accent-[#111]" checked={f.accepted} onChange={(e) => setField(f.key, { accepted: e.target.checked })} aria-label={t(fieldLabel(f.key))} />
                  <span className="w-36 flex-none text-[12.5px] text-black/60">{t(fieldLabel(f.key))}</span>
                  <span className="w-44 flex-none">
                    <input className={cn(inputClass, "px-2.5 py-1 font-mono text-[12.5px]")} value={f.value} onChange={(e) => setField(f.key, { value: e.target.value })} aria-label={t(fieldLabel(f.key))} />
                  </span>
                  <span className="font-mono text-[11.5px] text-black/40">{f.unit ?? ""}</span>
                  {low && <span className="text-[11px] text-[#b45309]">{t("Check this against the document")}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex justify-end border-t border-black/[0.06] px-3 py-2">
        <Button size="sm" variant="ghost" onClick={() => set({ status: "discarded" })}>
          <X size={13} /> {t("Set aside")}
        </Button>
      </div>
    </div>
  );
}

/* ── One line in "Filed" ──────────────────────────────────────── */
function DoneRow({ doc, audience }: { doc: IntakeDoc; audience: "exporter" | "supplier" }) {
  const t = useT();
  const monthLabel = useMonthLabel();
  const { lang } = useLanguage();
  const ws = getWorkspace(doc.workspaceId);
  const filed = doc.status === "filed";
  const renderShort = (s: ShortLabel) => t(s.text, { fuel: s.fuelType ? fuelTypeLabelIn(lang, s.fuelType) : t("Fuel") });
  return (
    <Card warm className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
      {filed ? <CheckCircle2 size={15} className="flex-none text-[#059669]" /> : <X size={15} className="flex-none text-black/30" />}
      <div className="min-w-0 flex-1 basis-64">
        <div className="break-all text-[13px] text-black/75">{doc.fileName}</div>
        <div className="mt-0.5 text-[12px] text-black/50">
          {filed && doc.filedTo ? (
            <>
              {t("Filed to")} <span className="text-black/70">{renderShort(doc.filedTo.short)}</span>
              {doc.filedTo.month ? ` · ${monthLabel(doc.filedTo.month)}` : ` · ${t("whole year")}`}
            </>
          ) : doc.notNeededReason ? (
            <>
              {t("Not needed — not filed.")} {t(doc.notNeededReason, { product: ws?.productName ?? "" })}
            </>
          ) : (
            t("Set aside — not filed")
          )}
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
        <ViewButton doc={doc} />
        {filed && audience === "exporter" && doc.filedTo?.month && (
          <Link href={`/workspaces/${doc.workspaceId}/monthly/${doc.filedTo.month}`} className="px-2 text-[12px] text-black/50 underline-offset-2 hover:underline">
            {t("Open month")}
          </Link>
        )}
        {!filed && (
          <button className="inline-flex items-center gap-1 px-2 text-[12px] text-black/50 hover:text-black" onClick={() => patchDoc(doc.workspaceId, doc.id, { status: "review" })}>
            <Undo2 size={12} /> {t("Bring back")}
          </button>
        )}
      </div>
    </Card>
  );
}

/* ── The whole panel ──────────────────────────────────────────── */
export function SmartIntake({
  workspaceId,
  audience,
  writeMonth,
  uploadedBy,
  onFiled,
  onComplete,
  startOpen,
  onDismiss,
}: {
  workspaceId: string;
  audience: "exporter" | "supplier";
  writeMonth: MonthWriter;
  uploadedBy: string;
  onFiled?: () => void;
  /** after a confirm — the host takes the reader to where the values went */
  onComplete?: (result: IntakeResult) => void;
  /** files were dropped somewhere else and the reader was sent here: open the
      review as soon as they are in the queue */
  startOpen?: boolean;
  /** the popup was closed without confirming (×, Esc, "Later") */
  onDismiss?: () => void;
}) {
  const t = useT();
  const queue = React.useSyncExternalStore(
    subscribeIntake,
    () => intakeQueue(workspaceId),
    () => intakeQueue(workspaceId),
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [loadingSamples, setLoadingSamples] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const { lang } = useLanguage();
  const monthLabel = useMonthLabel();
  const openReview = () => setSummaryOpen(true);

  const add = (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length > 0) void addFiles(workspaceId, list, openReview);
  };

  const trySamples = async () => {
    setLoadingSamples(true);
    try {
      // Supplier-portal samples (CBAM sheet, COO, verification) belong to /s/.
      await addFiles(workspaceId, await loadSampleFiles("workspace"), openReview);
    } catch {
      toast({ message: t("Sample documents could not be loaded"), tone: "warn" });
    } finally {
      setLoadingSamples(false);
    }
  };

  // Everything not yet filed or set aside is in the popup — one review, not one per drop.
  const pending = queue.filter((doc) => doc.status === "reading" || doc.status === "review");
  const done = queue.filter((doc) => doc.status === "filed" || doc.status === "discarded");

  const autoOpened = React.useRef(false);
  React.useEffect(() => {
    if (!startOpen || autoOpened.current || pending.length === 0) return;
    autoOpened.current = true;
    setSummaryOpen(true);
  }, [startOpen, pending.length]);

  /* ── What the popup says about each waiting file ──────────────── */
  const renderShort = (s: ShortLabel) => t(s.text, { fuel: s.fuelType ? fuelTypeLabelIn(lang, s.fuelType) : t("Fuel") });
  const summaryItems: SummaryItem[] = pending.map((doc) => {
    const v = verdictFor(doc);
    let destination: string | undefined;
    if (v.target) {
      const where = v.target.scope === "month" && doc.month ? monthLabel(doc.month) : t("whole year");
      destination = `${renderShort(shortTargetLabel(doc.workspaceId, v.target.key, doc.month, doc.fuelType))} · ${where}`;
    } else if (v.suggestion.addFuelRow && doc.month) {
      destination = `${t("{fuel} — invoice", { fuel: fuelTypeLabelIn(lang, v.suggestion.addFuelRow) })} · ${monthLabel(doc.month)}`;
    }
    const status: SummaryItem["status"] = doc.status === "reading" ? "reading" : v.notNeeded ? "notNeeded" : v.confident ? "ready" : "needs";
    // A document that will not be filed fills nothing — listing its values
    // as fills would promise a write that never happens.
    const writes =
      status === "notNeeded"
        ? []
        : doc.fields
            .filter((f) => f.key in WRITES_TO)
            .map((f) => ({
              label: `${t(WRITES_TO[f.key])}${doc.month ? ` · ${monthLabel(doc.month)}` : ""}`,
              value: fmtWriteValue(f.value, f.unit),
              confidence: f.confidence,
              kept: f.accepted,
            }));
    const reason = v.notNeeded
      ? t(v.notNeeded, { product: getWorkspace(doc.workspaceId)?.productName ?? "" })
      : v.blocked
        ? t(v.blocked)
        : doc.duplicateOf
          ? t("Looks like the same file as {name}.", { name: doc.duplicateOf })
          : doc.detection?.via === "filename"
            ? t("Guessed from the file name — check what it is.")
            : undefined;
    return {
      id: doc.id,
      fileName: doc.fileName,
      status,
      typeLabel: doc.detection ? t(DOC_SUBJECT_LABEL[doc.subject]) : undefined,
      destination,
      reason,
      blocked: !!v.blocked,
      writes,
      editor: doc.status === "review" ? <DocEditor doc={doc} /> : null,
      preview: <ViewButton doc={doc} />,
    };
  });

  const confirm = (ids: string[]) => {
    let docs = 0;
    let values = 0;
    const months = new Set<string>();
    for (const id of ids) {
      const doc = intakeQueue(workspaceId).find((x) => x.id === id);
      if (!doc || doc.status !== "review") continue;
      const writes = doc.fields.filter((f) => f.accepted && f.key in WRITES_TO).length;
      const r = fileDoc(doc, uploadedBy, writeMonth);
      if (!r.ok) {
        toast({ message: t("Could not file"), detail: `${doc.fileName} — ${t(r.message)}`, tone: "warn" });
        continue;
      }
      docs += 1;
      values += writes;
      if (doc.month && writes > 0) months.add(doc.month);
    }
    const sorted = [...months].sort();
    setSummaryOpen(false);
    toast({ message: t("{n} documents filed", { n: docs }), tone: "info" });
    if (values > 0) recordFillRun(`ws:${workspaceId}`, { months: sorted, values });
    onFiled?.();
    onComplete?.({ docs, values, months: sorted });
  };

  return (
    <div className="space-y-5">
      <DetectionSummary
        open={summaryOpen}
        onClose={() => {
          setSummaryOpen(false);
          onDismiss?.();
        }}
        items={summaryItems}
        onConfirm={confirm}
        confirmLabel={(docs, values) => (values > 0 ? t("Confirm {docs} documents · fill {values} values", { docs, values }) : t("Confirm {docs} documents", { docs }))}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-[#111] bg-[#f0eee8]" : "border-black/12 bg-white",
        )}
      >
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f5f4f0] text-black/45">
          <FileSearch size={22} strokeWidth={1.5} />
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">
          {audience === "supplier" ? t("Drop your plant's documents here") : t("Drop any documents here")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-black/50">
          {t("Bills, invoices, meter logs, ERP exports, certificates — as many as you like. Certrace works out what each one is, which month it covers and where it belongs. Nothing is filed until you confirm.")}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={() => inputRef.current?.click()}>
            <Upload size={13} /> {t("Choose files")}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void trySamples()} disabled={loadingSamples}>
            {loadingSamples ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />} {t("Try sample documents")}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-4 text-[11.5px] text-black/50">{t("AI can make mistakes. You check every value before anything is saved.")}</p>
        <p className="mt-1 text-[11px] text-black/35">{t("Prototype — detection is simulated. Nothing leaves this browser.")}</p>
      </div>

      {pending.length > 0 && !summaryOpen && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(180,83,9,0.25)] bg-[#fffbeb] px-4 py-3">
          <TriangleAlert size={15} className="flex-none text-[#b45309]" />
          <span className="min-w-0 flex-1 text-[13px] text-[#92400e]">{t("{n} documents waiting for your check", { n: pending.length })}</span>
          <Button size="sm" onClick={openReview}>
            {t("Continue review")}
          </Button>
        </div>
      )}

      {done.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[11px] uppercase tracking-[0.12em] text-black/40">{t("Done")}</h3>
            <Button size="sm" variant="ghost" onClick={() => clearFinished(workspaceId)}>
              {t("Clear done")}
            </Button>
          </div>
          {done.map((doc) => (
            <DoneRow key={doc.id} doc={doc} audience={audience} />
          ))}
        </section>
      )}
    </div>
  );
}

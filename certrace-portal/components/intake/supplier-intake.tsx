"use client";

/* ════════════════════════════════════════════════════════════
   SUPPLIER-PORTAL SMART INTAKE — the screen (PROTOTYPE)

   Sits at the top of the Supplier Portal's Documents view (/s/ and /self/).
   Same grammar as the workspace version (components/intake/smart-intake.tsx):
   drop the pile, and the review popup is the one place it is checked and
   confirmed. The destination is the list of documents the exporter asked
   for, and attaching goes through the portal's own uploadFiles — so the
   trail, the byte cap and revision locks all hold. When a CBAM sheet fills
   the questionnaire, confirming takes the supplier to the first value filled.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import {
  CheckCircle2,
  Eye,
  FileSearch,
  TriangleAlert,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { Button, Card, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { DocumentPreview } from "@/components/intake/document-preview";
import {
  DetectionSummary,
  type SummaryItem,
} from "@/components/intake/detection-summary";
import { useSupplier } from "@/components/supplier/context";
import { recordFillRun } from "@/lib/ai-fill";
import { useT } from "@/lib/i18n";
import { valueKey } from "@/lib/supplier";
import {
  CONFIDENCE_FLOOR,
  type ExtractedField,
} from "@/lib/workspace-evidence";
import {
  DOC_SUBJECTS,
  DOC_SUBJECT_LABEL,
  type DocSubject,
} from "@/lib/smart-intake";
import {
  addSupplierFiles,
  clearFinishedSupplierDocs,
  fileSupplierDoc,
  patchSupplierDoc,
  subscribeSupplierIntake,
  supplierIntakeQueue,
  questionnaireWritesFor,
  supplierVerdict,
  type SupplierIntakeDoc,
} from "@/lib/supplier-intake";

const FIELD_LABEL: Record<string, string> = {
  "heat-number": "Heat number",
  "net-mass": "Net mass",
  "production-route": "Production route",
  "direct-emissions": "Direct emissions",
  "indirect-emissions": "Indirect emissions",
  "reporting-period": "Reporting period",
  "cn-code": "CN code",
  "certificate-number": "Certificate number",
  "country-of-origin": "Country of origin",
  "issue-date": "Issue date",
  "verifier-name": "Verifier",
  opinion: "Opinion",
  "supplier-name": "Issued by",
};
const fieldLabel = (key: string) =>
  FIELD_LABEL[key] ??
  key.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function ViewButton({ doc }: { doc: SupplierIntakeDoc }) {
  const t = useT();
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
        heading={t(DOC_SUBJECT_LABEL[doc.subject])}
      />
    </>
  );
}

/* ── The fix-it form, drawn inside the popup ──────────────────── */
function SupplierDocEditor({ doc }: { doc: SupplierIntakeDoc }) {
  const t = useT();
  const { req, isDocEditable } = useSupplier();
  const v = supplierVerdict(doc, req.documents, isDocEditable);
  const set = (patch: Partial<SupplierIntakeDoc>) =>
    patchSupplierDoc(doc.token, doc.id, patch);
  const setField = (key: string, patch: Partial<ExtractedField>) =>
    set({
      fields: doc.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    });

  return (
    <div>
      {/* A duplicate is already said above the editor, as the reason. */}
      <div className="grid gap-3 px-3 py-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.1em] text-black/45">
            {t("What it is")}
          </span>
          <Select
            value={doc.subject}
            onChange={(s) =>
              set({ subject: s as DocSubject, targetOverride: undefined })
            }
            options={DOC_SUBJECTS.map((s) => ({
              value: s,
              label: t(DOC_SUBJECT_LABEL[s]),
            }))}
            ariaLabel={t("What it is")}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.1em] text-black/45">
            {t("Attach to")}
          </span>
          <Select
            value={doc.targetOverride ?? v.suggestedId ?? ""}
            onChange={(k) => set({ targetOverride: k || undefined })}
            options={req.documents.map((r) => ({
              value: r.id,
              label: `${t(r.label)}${r.required ? ` · ${t("required")}` : ""}`,
            }))}
            placeholder={t("Pick a requested document")}
            invalid={!!v.blocked}
            ariaLabel={t("Attach to")}
          />
          {v.blocked && (
            <span className="mt-1 flex items-start gap-1 text-[11.5px] text-[#b45309]">
              <TriangleAlert size={12} className="mt-0.5 flex-none" />{" "}
              {t(v.blocked)}
            </span>
          )}
        </label>
      </div>

      {doc.fields.length > 0 && (
        <div className="border-t border-black/[0.06] px-3 py-2.5">
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.1em] text-black/45">
            {t("Values found — untick anything you don't want kept")}
          </div>
          <ul className="divide-y divide-black/[0.05]">
            {doc.fields.map((f) => {
              const low = f.confidence < CONFIDENCE_FLOOR;
              return (
                <li
                  key={f.key}
                  className={cn(
                    "flex flex-wrap items-center gap-x-3 gap-y-1 py-2",
                    low && "rounded-lg bg-[#fffbeb] px-2",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#111]"
                    checked={f.accepted}
                    onChange={(e) =>
                      setField(f.key, { accepted: e.target.checked })
                    }
                    aria-label={t(fieldLabel(f.key))}
                  />
                  <span className="w-36 flex-none text-[12.5px] text-black/60">
                    {t(fieldLabel(f.key))}
                  </span>
                  <span className="min-w-0 flex-1 break-all font-mono text-[12.5px] text-black/80">
                    {f.value} {f.unit ?? ""}
                  </span>
                  {low && (
                    <span className="text-[11px] text-[#b45309]">
                      {t("Check this against the document")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex justify-end border-t border-black/[0.06] px-3 py-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => set({ status: "discarded" })}
        >
          <X size={13} /> {t("Set aside")}
        </Button>
      </div>
    </div>
  );
}

function DoneRow({ doc }: { doc: SupplierIntakeDoc }) {
  const t = useT();
  const filed = doc.status === "filed";
  return (
    <Card
      warm
      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5"
    >
      {filed ? (
        <CheckCircle2 size={15} className="flex-none text-[#059669]" />
      ) : (
        <X size={15} className="flex-none text-black/30" />
      )}
      <div className="min-w-0 flex-1 basis-64">
        <div className="break-all text-[13px] text-black/75">
          {doc.fileName}
        </div>
        <div className="mt-0.5 text-[12px] text-black/50">
          {filed && doc.filedTo ? (
            <>
              {t("Attached to")}{" "}
              <span className="text-black/70">{t(doc.filedTo.label)}</span>
            </>
          ) : doc.notNeededReason ? (
            t("Not needed — not attached.")
          ) : (
            t("Set aside — not attached")
          )}
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
        <ViewButton doc={doc} />
        {!filed && (
          <button
            className="inline-flex items-center gap-1 px-2 text-[12px] text-black/50 hover:text-black"
            onClick={() =>
              patchSupplierDoc(doc.token, doc.id, {
                status: "review",
                notNeededReason: undefined,
              })
            }
          >
            <Undo2 size={12} /> {t("Bring back")}
          </button>
        )}
      </div>
    </Card>
  );
}

export function SupplierIntake() {
  const t = useT();
  const {
    req,
    state,
    isDocEditable,
    uploadFiles,
    getValue,
    setValue,
    isEditable,
    focusField,
  } = useSupplier();
  const token = req.token;
  const queue = React.useSyncExternalStore(
    subscribeSupplierIntake,
    () => supplierIntakeQueue(token),
    () => supplierIntakeQueue(token),
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const openReview = () => setSummaryOpen(true);
  const year =
    Number((req.periodEnd || "").slice(0, 4)) || new Date().getFullYear();

  const attachedNames = React.useMemo(() => {
    const out = new Set<string>();
    for (const ds of Object.values(state.docs))
      for (const f of ds.files) out.add(`${f.name}|${f.size}`);
    return out;
  }, [state.docs]);

  const add = (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length > 0)
      void addSupplierFiles(token, list, year, attachedNames, openReview);
  };

  const pending = queue.filter(
    (doc) => doc.status === "reading" || doc.status === "review",
  );
  const done = queue.filter(
    (doc) => doc.status === "filed" || doc.status === "discarded",
  );

  /* ── What the popup says about each waiting file ──────────────── */
  const summaryItems: SummaryItem[] = pending.map((doc) => {
    const v = supplierVerdict(doc, req.documents, isDocEditable);
    const status: SummaryItem["status"] =
      doc.status === "reading"
        ? "reading"
        : v.notNeeded
          ? "notNeeded"
          : v.confident
            ? "ready"
            : "needs";
    // Not attached → fills nothing; do not list its values as fills.
    const writes =
      status === "notNeeded"
        ? []
        : questionnaireWritesFor(doc, req, getValue).map((w) => ({
            label: `${t(w.label)}${w.productName ? ` · ${w.productName}` : ""}`,
            value: `${w.value} ${w.unit ?? ""}`.trim(),
            confidence: w.confidence,
            kept: w.accepted,
            replaces:
              w.current && w.current !== w.value ? w.current : undefined,
          }));
    const reason = v.notNeeded
      ? t(v.notNeeded, { exporter: req.exporterName })
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
      destination: v.target ? t(v.target.label) : undefined,
      reason,
      blocked: !!v.blocked,
      writes,
      editor: doc.status === "review" ? <SupplierDocEditor doc={doc} /> : null,
      preview: <ViewButton doc={doc} />,
    };
  });

  const confirm = async (ids: string[]) => {
    let docs = 0;
    let values = 0;
    let firstKey: string | null = null;
    for (const id of ids) {
      const doc = supplierIntakeQueue(token).find((x) => x.id === id);
      if (!doc || doc.status !== "review") continue;
      const v = supplierVerdict(doc, req.documents, isDocEditable);
      const keys = questionnaireWritesFor(doc, req, getValue)
        .filter((w) => w.accepted)
        .map((w) => valueKey(w.fieldId, w.productId))
        .filter(isEditable);
      const r = await fileSupplierDoc(doc, v, uploadFiles, {
        req,
        getValue,
        setValue,
        isEditable,
      });
      if (!r.ok) {
        toast({
          message: t("Could not attach"),
          detail: `${doc.fileName} — ${t(r.message, { exporter: req.exporterName })}`,
          tone: "warn",
        });
        continue;
      }
      docs += 1;
      values += r.written;
      if (r.written > 0 && !firstKey) firstKey = keys[0] ?? null;
    }
    setSummaryOpen(false);
    toast({ message: t("{n} documents attached", { n: docs }), tone: "info" });
    // Values went into the questionnaire — take the supplier to them.
    if (values > 0) {
      recordFillRun(`sup:${token}`, { months: [], values });
      if (firstKey) focusField(firstKey);
    }
  };

  return (
    <div className="space-y-5">
      <DetectionSummary
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        items={summaryItems}
        onConfirm={confirm}
        confirmLabel={(docs, values) =>
          values > 0
            ? t("Confirm {docs} documents · fill {values} values", {
                docs,
                values,
              })
            : t("Confirm {docs} documents", { docs })
        }
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
          "rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-[#111] bg-[#f0eee8]" : "border-black/12 bg-white",
        )}
      >
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#f5f4f0] text-black/45">
          <FileSearch size={20} strokeWidth={1.5} />
        </span>
        <h2 className="mt-3 font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">
          {t("Drop your documents here")}
        </h2>
        <p className="mx-auto mt-1.5 max-w-xl text-[13px] leading-relaxed text-black/50">
          {t(
            "Certificates, CBAM sheets, verification statements — Certrace matches each file to what {exporter} asked for. Nothing is attached until you confirm.",
            { exporter: req.exporterName },
          )}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={() => inputRef.current?.click()}>
            <Upload size={13} /> {t("Choose files")}
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
        <p className="mt-3 text-[11.5px] text-black/50">
          {t(
            "AI can make mistakes. You check every value before anything is saved.",
          )}
        </p>
        <p className="mt-1 text-[11px] text-black/35">
          {t(
            "Prototype — detection is simulated. Nothing leaves this browser.",
          )}
        </p>
      </div>

      {pending.length > 0 && !summaryOpen && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(180,83,9,0.25)] bg-[#fffbeb] px-4 py-3">
          <TriangleAlert size={15} className="flex-none text-[#b45309]" />
          <span className="min-w-0 flex-1 text-[13px] text-[#92400e]">
            {t("{n} documents waiting for your check", { n: pending.length })}
          </span>
          <Button size="sm" onClick={openReview}>
            {t("Continue review")}
          </Button>
        </div>
      )}

      {done.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[11px] uppercase tracking-[0.12em] text-black/40">
              {t("Done")}
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => clearFinishedSupplierDocs(token)}
            >
              {t("Clear done")}
            </Button>
          </div>
          {done.map((doc) => (
            <DoneRow key={doc.id} doc={doc} />
          ))}
        </section>
      )}
    </div>
  );
}

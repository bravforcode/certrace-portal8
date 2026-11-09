"use client";

/* ════════════════════════════════════════════════════════════
   THE DOCUMENTS SCREEN, AS CARDS

   Replaces the flat "one row per required key" checklist with what the spec
   calls for: five named categories (Operations, Finance, Suppliers, Lab,
   Organisation-level), each a group of cards, each card one document type
   with its own dropzone, its own status, and — where more than one instance
   of the document could exist — its own binding control.

   BINDING is the piece the flat list never had. A file dropped on a card is
   not counted by `lib/workspace-evidence.ts`'s `coverageRowFor` until it
   carries a target. A file uploaded through the per-month flow already has
   one — its own month. Everything else gets one button, "Bind to <year>".

   IT NO LONGER ASKS WHICH. The card used to put a picker here — which month,
   which supplier, which shipment — and each was a note typed or chosen by
   hand beside a document that already records its uploader and its date.
   They are gone; the button is not.

   NOT REQUIRED is not the same as MISSING. A conditional key the workspace
   has not triggered (no PPA on file, no purchased precursor) still gets a
   card — greyed, unopenable — so a document that quietly stopped applying
   cannot be mistaken for one that was simply never asked about.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, FileCheck2, Paperclip, Trash2, Upload } from "lucide-react";
import { cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { USER } from "@/lib/data";
import { type MonthlyEntry } from "@/lib/monthly-data";
import { sourceTypeForKey, uploadEvidence } from "@/components/workspace/evidence-panel";
import { useT } from "@/lib/i18n";
import {
  ALL_CONDITIONAL_ANNUAL_KEYS,
  ALL_ELECTRICITY_KEYS,
  EVIDENCE_CATEGORY_ORDER,
  EVIDENCE_DEPARTMENT_LABEL,
  EVIDENCE_DEPARTMENT_WHO_TO_ASK,
  EVIDENCE_FREQUENCY_LABEL,
  EVIDENCE_RECOMMENDED_ORDER,
  acknowledgeEvidenceOnboarding,
  annualCoverage,
  coverageForMonth,
  evidenceOnboardingAcknowledged,
  isReviewed,
  removeEvidence,
  saveEvidence,
  type AnnualScope,
  type CoverageRow,
  type EvidenceDepartment,
  type EvidenceItem,
} from "@/lib/workspace-evidence";

type CardStatus = "not_required" | "missing" | "awaiting_review" | "needs_binding" | "bound";

function statusFor(row: CoverageRow, notRequired: boolean): CardStatus {
  if (notRequired) return "not_required";
  if (row.covered) return "bound";
  if (row.items.length === 0) return "missing";
  if (row.awaitingReview > 0) return "awaiting_review";
  return "needs_binding";
}

const STATUS_LABEL: Record<CardStatus, string> = {
  not_required: "Not required",
  missing: "Missing",
  awaiting_review: "Attached — awaiting review",
  needs_binding: "Uploaded — needs binding",
  bound: "Bound — counted",
};

const STATUS_CLASS: Record<CardStatus, string> = {
  not_required: "border-black/[0.08] bg-black/[0.02] text-black/40",
  missing: "border-[rgba(220,38,38,0.16)] bg-[#fef2f2] text-[#dc2626]",
  awaiting_review: "border-[rgba(37,99,235,0.16)] bg-[#eff6ff] text-[#1d4ed8]",
  needs_binding: "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]",
  bound: "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]",
};

function StatusPill({ status }: { status: CardStatus }) {
  const t = useT();
  return (
    <span className={cn("flex-none whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]", STATUS_CLASS[status])}>
      {t(STATUS_LABEL[status])}
    </span>
  );
}

/** The bind control shown inline once a file lands on a key with no target
    yet. One button, always: pressing it binds the document to the reporting
    year, and that is what turns the card's chip green.

    IT USED TO ASK. There were three variants here — a month dropdown ("Which
    month does this cover?"), a supplier dropdown ("Which supplier does this
    belong to?") and a free-text box ("Which shipment or purchase?") — each a
    note filled in by hand beside a document that already records who attached
    it and when. All three are gone. Nothing is lost from the per-month flow:
    a file uploaded against a month already carries that month in its own
    metadata and `isBound` counts it without anyone picking anything, so the
    dropdown only ever appeared on the annual grid, where the year is the
    answer anyway. */
function BindControl({ year, item, onBound }: { year: number; item: EvidenceItem; onBound: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => {
        saveEvidence({ ...item, boundTo: String(year) });
        onBound();
      }}
      className="rounded-lg border border-black/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-black/50 hover:border-black/25 hover:text-black"
    >
      {t("Bind to {year}", { year })}
    </button>
  );
}

function DocumentCard({
  workspaceId,
  year,
  row,
  notRequired,
  onChange,
  busy,
  onFile,
  allowUpload = true,
}: {
  workspaceId: string;
  year: number;
  row: CoverageRow;
  notRequired: boolean;
  onChange: () => void;
  busy: string | null;
  onFile: (row: CoverageRow, file: File) => void;
  /** false where smart upload is the way documents come in, so the card only
      reports what is missing instead of offering a second upload. */
  allowUpload?: boolean;
}) {
  const t = useT();
  const status = statusFor(row, notRequired);
  const disabled = status === "not_required";

  return (
    <div className={cn("rounded-xl border p-3.5", disabled ? "border-black/[0.06] bg-black/[0.015]" : "border-black/[0.08] bg-white")}>
      {/* THE TITLE KEEPS THE WIDTH; THE PILL WRAPS.

          `min-w-0` without `flex-1` let the title shrink to its longest word
          while the pill took whatever it wanted, so a card holding
          "Bound — counted" printed its heading one word per line down the
          left-hand side. The pill is short and fixed; the sentence is not.
          `basis-[8rem]` is the give: on a card too narrow to hold both, the
          pill drops onto its own line above rather than strangling the title. */}
      <div className="flex flex-wrap-reverse items-start justify-between gap-x-2 gap-y-1.5">
        <div className="min-w-0 flex-1 basis-[8rem]">
          <p className={cn("text-[13px] leading-snug", disabled ? "text-black/35" : "text-black/80")}>{t(row.label)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-black/40">
            {row.frequency && <span>{t(EVIDENCE_FREQUENCY_LABEL[row.frequency])}</span>}
            {row.whoToAsk && <span className="truncate">· {t(row.whoToAsk)}</span>}
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      {disabled ? (
        <p className="mt-2 text-[11px] italic text-black/30">{t("Not applicable to this product report right now.")}</p>
      ) : (
        <>
          {row.items.length > 0 && (
            <ul className="mt-2.5 space-y-1.5">
              {row.items.map((item) => (
                <li key={item.id} className="rounded-lg bg-[#faf9f7] px-2.5 py-1.5 text-[11px]">
                  {/* THE FILE, AND NOTHING ABOUT IT. A stored file cannot be previewed here — the browser keeps only what fits and the
                      larger ones leave a record, not a copy — so the name is a label, not a link that sometimes works. Who attached it and
                      when is no longer printed: the card says which document it is, and the bin takes it away. */}
                  <div className="flex w-full min-w-0 items-center gap-1.5 text-black/70">
                    <Paperclip size={11} strokeWidth={1.5} className="flex-none text-black/30" />
                    <span className="min-w-0 flex-1 truncate" title={item.fileName}>
                      {item.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        removeEvidence(item.workspaceId, item.id);
                        onChange();
                      }}
                      className="flex-none rounded p-1 text-black/25 hover:bg-[#fef2f2] hover:text-[#dc2626]"
                      aria-label={t("Remove")}
                    >
                      <Trash2 size={11} strokeWidth={1.5} />
                    </button>
                  </div>
                  {item.boundTo && (
                    <div className="mt-1">
                      <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-black/45">&rarr; {item.boundTo}</span>
                    </div>
                  )}
                  {isReviewed(item) && !item.boundTo && !item.month && (
                    <div className="mt-1.5">
                      <BindControl year={year} item={item} onBound={onChange} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {allowUpload && (
          <label
            className={cn(
              "mt-2.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-[11px] uppercase tracking-[0.08em] transition-colors",
              busy ? "border-black/10 text-black/30" : "border-black/15 text-black/45 hover:border-black/30 hover:text-black",
            )}
          >
            <Upload size={12} strokeWidth={1.5} />
            {busy ? t("Uploading…") : t("Drop a file, or click to attach")}
            <input
              type="file"
              className="hidden"
              accept="application/pdf,image/*"
              disabled={Boolean(busy)}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(row, f);
                e.target.value = "";
              }}
            />
          </label>
          )}
        </>
      )}
    </div>
  );
}

/* ── The onboarding banner (§1.5) ────────────────────────────── */
/* THE PLATFORM'S OWN BLUE, not a generic notice blue. This is the same panel
   grammar as the English-only strip (#3C7ACB at low alpha, dark text, an icon
   in the brand colour) — a second, unrelated blue on the same screen reads as
   a different KIND of message, and this is not one.

   THE DISMISS IS A BUTTON. It used to be bare text at the end of a paragraph,
   with no border and no hit area to speak of, which on a phone is a word you
   have to aim at. Three short lines, and one obvious way to put them away. */
function OnboardingBanner({ workspaceId, onDismiss }: { workspaceId: string; onDismiss: () => void }) {
  const t = useT();
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#3C7ACB]/20 bg-[#3C7ACB]/[0.045] px-4 py-3.5 text-[12px] text-black/60 sm:flex-row sm:items-start">
      <FileCheck2 size={15} strokeWidth={1.5} className="mt-0.5 flex-none text-[#3C7ACB]" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-black/80">{t("Work through these in order: Finance, then Operations, then Suppliers.")}</p>
        <p className="mt-1 leading-relaxed">
          {t("{finance} is usually already on file. {operations} may need a new logging habit. {suppliers} waits on someone outside your company — ask early, finish there.", {
            finance: t(EVIDENCE_DEPARTMENT_LABEL.finance),
            operations: t(EVIDENCE_DEPARTMENT_LABEL.operations),
            suppliers: t(EVIDENCE_DEPARTMENT_LABEL.suppliers),
          })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          acknowledgeEvidenceOnboarding(workspaceId);
          onDismiss();
        }}
        className="inline-flex flex-none items-center justify-center gap-1.5 self-start rounded-lg border border-[#3C7ACB]/25 bg-white px-3 py-1.5 text-[10.5px] uppercase tracking-[0.08em] text-[#3C7ACB] transition-colors hover:border-[#3C7ACB]/50 hover:bg-[#3C7ACB] hover:text-white"
      >
        <Check size={12} strokeWidth={2} /> {t("Got it")}
      </button>
    </div>
  );
}

/* ── The grid ───────────────────────────────────────────────────
   Combines this month's per-month keys with the workspace's annual keys
   (fixed six plus whichever conditionals the scope triggers) and every
   conditional the scope did NOT trigger, so every category shows the full
   catalog of document types — some live, some "Not required". */
export function DocumentsCardGrid({
  workspaceId,
  year,
  entry,
  scope,
  onChange,
  allowUpload = true,
  audience = "exporter",
  uploadedBy,
}: {
  workspaceId: string;
  year: number;
  entry: MonthlyEntry;
  scope: AnnualScope;
  onChange: () => void;
  /** See DocumentCard. */
  allowUpload?: boolean;
  /** On the plant's own link the precursors' paperwork (verification reports, mill certificates of bought-in goods) is not asked:
      the precursors are the exporter's, on their Precursors tab. */
  audience?: "exporter" | "supplier";
  /** who is attached to the file — the signed-in user in the portal, the plant on its link */
  uploadedBy?: string;
}) {
  const t = useT();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    setShowOnboarding(!evidenceOnboardingAcknowledged(workspaceId));
  }, [workspaceId]);

  const reload = React.useCallback(() => {
    setTick((t) => t + 1);
    onChange();
  }, [onChange]);

  const asked = React.useCallback((rows: CoverageRow[]) => (audience === "supplier" ? rows.filter((r) => r.department !== "suppliers") : rows), [audience]);
  const monthRows = React.useMemo(
    () => asked(coverageForMonth(workspaceId, entry, scope.requiresIndirectEmissions ?? false).rows),
    [workspaceId, entry, scope.requiresIndirectEmissions, tick, asked],
  );
  const annualRows = React.useMemo(() => asked(annualCoverage(workspaceId, scope)), [workspaceId, scope, tick, asked]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeKeys = React.useMemo(() => new Set([...monthRows, ...annualRows].map((r) => r.key)), [monthRows, annualRows]);
  // ALL_ELECTRICITY_KEYS alongside the annual conditionals: a workspace whose
  // category doesn't count indirect emissions still gets the three
  // electricity cards, greyed as "Not required" — same treatment as the PPA
  // card — rather than the cards just vanishing, which would be
  // indistinguishable from a requirement nobody ever asked about.
  const notRequiredRows: CoverageRow[] = React.useMemo(
    () =>
      [...ALL_CONDITIONAL_ANNUAL_KEYS, ...ALL_ELECTRICITY_KEYS].filter((k) => !activeKeys.has(k.key) && !(audience === "supplier" && k.department === "suppliers")).map((k) => ({
        key: k.key,
        label: k.label,
        cite: k.cite,
        department: k.department,
        frequency: k.frequency,
        whoToAsk: k.whoToAsk,
        covered: false,
        awaitingReview: 0,
        awaitingBinding: 0,
        items: [],
      })),
    [activeKeys, audience],
  );

  const notRequiredKeys = new Set(notRequiredRows.map((r) => r.key));
  const allRows = [...monthRows, ...annualRows, ...notRequiredRows];
  const byDept = new Map<EvidenceDepartment, CoverageRow[]>();
  for (const row of allRows) {
    const dept = row.department ?? "organisation";
    if (!byDept.has(dept)) byDept.set(dept, []);
    byDept.get(dept)!.push(row);
  }

  const liveTotal = monthRows.length + annualRows.length;
  const liveCovered = [...monthRows, ...annualRows].filter((r) => r.covered).length;

  // Anything requiredKeysForMonth() generated is a genuinely per-month
  // document — tag it with THIS month so it is bound automatically and
  // scoped to it, the same way a file dropped through the per-month flow
  // always has been. Reading membership off monthRows itself, rather than a
  // hand-maintained list of key prefixes, is what a key like utility-invoice
  // moving from the annual list into requiredKeysForMonth() needs to start
  // tagging correctly without a second edit here being remembered too.
  const monthRowKeys = React.useMemo(() => new Set(monthRows.map((r) => r.key)), [monthRows]);

  const attach = (row: CoverageRow, file: File) =>
    void uploadEvidence({
      file,
      workspaceId,
      month: monthRowKeys.has(row.key) ? entry.month : undefined,
      fieldKeys: [row.key],
      sourceType: sourceTypeForKey(row.key),
      uploadedBy: uploadedBy ?? USER.name,
      onProgress: (id) => {
        setBusy(id);
        reload();
      },
    }).then(() => {
      reload();
      toast({ message: "Attached", detail: `${file.name} — reviewing…`, tone: "info" });
    });

  return (
    <div>
      {showOnboarding && audience !== "supplier" && <OnboardingBanner workspaceId={workspaceId} onDismiss={() => setShowOnboarding(false)} />}

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[12px] text-black/45">
          {t("{covered} of {total} required documents are bound and counted.", { covered: liveCovered, total: liveTotal })}
        </span>
        <span className="font-mono text-[12px] text-black/45">{liveTotal ? Math.round((liveCovered / liveTotal) * 100) : 0}%</span>
      </div>

      <div className="space-y-3">
        {EVIDENCE_CATEGORY_ORDER.map((dept) => {
          const rows = byDept.get(dept) ?? [];
          if (rows.length === 0) return null;
          const coveredHere = rows.filter((r) => r.covered).length;
          const applicableHere = rows.filter((r) => !notRequiredKeys.has(r.key)).length;
          return (
            <details key={dept} className="group rounded-2xl border border-black/[0.07] bg-[#faf9f7]" open>
              {/* THE STEP TAG IS NEVER LEFT ON A LINE OF ITS OWN.

                  One row of name + tag + count is right at 640px and up. At
                  375px it is three lines and the worst of them is the third:
                  the department name takes two, the count tucks up beside its
                  second line, and "Step 2" drops out on its own underneath —
                  where it stops reading as a tag on this group and starts
                  reading as a heading for whatever comes next.

                  So below `sm` the header inverts into a meta line and a
                  heading: the tag and the count sit together on one short row
                  (they are the same kind of information, and neither wraps),
                  and the name gets the full measure underneath, which is what
                  most of these need to fit on a single line at all. The two
                  genuinely long departments still take two lines for the
                  name — no arrangement of 283px fixes "Laboratory Analysis &
                  Third-Party Verification" — but nothing is orphaned and the
                  block reads as one header either way. */}
              <summary className="flex cursor-pointer list-none flex-col-reverse gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-pixel text-[11px] uppercase tracking-[0.1em] text-black/55 sm:tracking-[0.14em]">
                    {t(EVIDENCE_DEPARTMENT_LABEL[dept])}
                  </span>
                  {EVIDENCE_RECOMMENDED_ORDER.includes(dept) && (
                    <span className="hidden flex-none whitespace-nowrap rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] text-black/35 sm:inline">
                      {t("Step {n}", { n: EVIDENCE_RECOMMENDED_ORDER.indexOf(dept) + 1 })}
                    </span>
                  )}
                </span>
                <span className="flex flex-none items-center gap-2 whitespace-nowrap text-[11px] text-black/40 sm:gap-3">
                  {EVIDENCE_RECOMMENDED_ORDER.includes(dept) && (
                    <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] text-black/35 sm:hidden">
                      {t("Step {n}", { n: EVIDENCE_RECOMMENDED_ORDER.indexOf(dept) + 1 })}
                    </span>
                  )}
                  <span>{t("{covered} of {total} bound", { covered: coveredHere, total: applicableHere || rows.length })}</span>
                </span>
              </summary>
              <div className="border-t border-black/[0.06] px-4 py-3">
                <p className="mb-3 text-[11px] text-black/40">{t(EVIDENCE_DEPARTMENT_WHO_TO_ASK[dept])}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {rows.map((row) => (
                    <DocumentCard
                      key={row.key}
                      workspaceId={workspaceId}
                      year={year}
                      row={row}
                      notRequired={notRequiredKeys.has(row.key)}
                      onChange={reload}
                      busy={busy}
                      onFile={attach}
                      allowUpload={allowUpload}
                    />
                  ))}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

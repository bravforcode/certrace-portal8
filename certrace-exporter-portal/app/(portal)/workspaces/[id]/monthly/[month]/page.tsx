"use client";

/* ════════════════════════════════════════════════════════════
   ONE MONTH — the exporter's side of the very same form

   THIS PAGE HELD A SECOND COPY OF THE MONTHLY FORM. The supplier answers a
   month through app/w/[token]; the exporter opened the same month here and got
   a different set of boxes — hand-built production, fuel, electricity and
   process cards that had drifted from the supplier's over months of edits, no
   methodology at all, a precursor list with different wording, and an evidence
   grid under a different heading. Two forms over one record is two ideas of
   what a month IS, and every question of the form "why does their screen ask
   for something mine doesn't" traces back to it.

   So there is now ONE form, and it is the supplier's:

     · InstallationStep   the site record — shared, so a correction on either
                          side reaches the other
     · MmdStep            the methodology in force
     · MonthlyStep        production, fuels, electricity, process, notes
     · PrecursorStep      what arrived from upstream
     · DocumentsStep      what stands behind the figures

   Field for field, in the same order, from the same components. It is not a
   resemblance that has to be maintained — it is the same code, so it cannot
   drift.

   WHAT IS THE EXPORTER'S AND NOT THE SUPPLIER'S stays here, around that form:

     · WHAT THE MONTH COMES TO, ABOVE IT — the four figures. This screen is
       opened to check a number far more often than to type one, and the
       number used to be at the very bottom, behind every field that fed it.
     · THE REVIEW BAR under those figures — which version is on file, when it
       landed, and the decisions only the exporter can take. It reads as a
       judgement about the figures because it now sits under them.
     · THE REVISION REQUEST directly under the review, because it is the other
       half of that same decision: if the answer is no, name the parts that
       need another look and the month goes back. It used to live at the foot
       of the page, four screens from the bar it answers.
     · THE ERRORS AT THE FOOT. They used to sit above every field, so the first
       thing on the screen was a list of complaints about boxes the reader had
       not reached yet. They are a summary of the form, and a summary belongs
       after the thing it summarises.

   FIVE RULES STILL ENFORCED, all of them inside the shared components:

   1. A fuel row with a quantity in m³/kg/t/l and no calorific value blocks
      submission — an emission factor in tCO₂/GJ cannot be applied to a volume.
   2. "Copy setup from previous month" clones the SETUP and never the
      QUANTITIES. A copied meter reading is a fabricated meter reading.
   3. No sample numbers in inputs. Examples live in the hint, in words.
   4. Nothing is lost by navigating away — every field autosaves, and the
      badge beside the title says when it last did.
   5. A SUBMITTED MONTH OPENS READ-ONLY. Reviewing is reading; editing is a
      decision about whose attestation covers what, and taking it is recorded
      (see lib/month-submission.ts).

   AND THE EXPORTER DOES NOT SUBMIT. This screen carried a Submit month button
   beside the autosave badge, which let the exporter close a month on the
   plant's behalf — the same figures, the same store, but nobody outside the
   account had attested to them. Submitting is the supplier's act, through
   app/w/[token]; from here a month is read, confirmed, or sent back.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Copy, TriangleAlert } from "lucide-react";
import { AutoSaveBadge, Button, useAutoSave } from "@/components/ui";
import { toast } from "@/components/toast";
import { loadDraft, saveDraft, type WorkspaceMmdContent } from "@/lib/workspace-mmd";
import { syncFromMmd, syncFromMonth } from "@/lib/mmd-sync";
import { Note, SectionCard, fmt } from "@/components/workspace/chrome";
import { MonthReviewBar } from "@/components/workspace/month-review";
import { RevisionRequestPanel } from "@/components/workspace/revision-request";
import { DocumentsStep, InstallationStep, MmdStep, MonthlyStep, PrecursorStep } from "@/components/supplier/month-steps";
import { useWorkspace } from "@/components/workspace/provider";
import { markExporterEdited, submissionFor, type MonthSubmission } from "@/lib/month-submission";
import { emptyInstallation, getInstallation, saveInstallation, type Installation } from "@/lib/installations";
import {
  copyFromPreviousMonth,
  emptyMonth,
  fuelEvidenceKey,
  fuelTypeLabel,
  getMonth,
  hasPreviousMonthSetup,
  monthIssues,
  monthResult,
  saveMonth,
  type FuelEntry,
  type MonthlyEntry,
} from "@/lib/monthly-data";
import { listSuppliers, saveSupplier, type PrecursorSupplier } from "@/lib/precursor-suppliers";
import { coverageForMonth, reconcileFuelEvidence } from "@/lib/workspace-evidence";
import { workspaceRequiresIndirectEmissions } from "@/lib/cbam/product-category-rules";
import { monthNameLong } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

export default function MonthEditorPage({ params }: { params: Promise<{ id: string; month: string }> }) {
  const t = useT();
  const { month } = React.use(params);
  const { workspace, refresh } = useWorkspace();

  /* Everything the month is made of, loaded exactly as the supplier flow
     loads it — same stores, same fallbacks, so the two screens cannot start
     from different pictures of the same month. */
  const [entry, setEntry] = React.useState<MonthlyEntry | null>(null);
  const [mmd, setMmd] = React.useState<WorkspaceMmdContent | null>(null);
  const [installation, setInstallation] = React.useState<Installation | null>(null);
  const [precursors, setPrecursors] = React.useState<PrecursorSupplier[]>([]);
  const [submission, setSubmission] = React.useState<MonthSubmission | null>(null);
  const [unlocked, setUnlocked] = React.useState(false);

  React.useEffect(() => {
    setEntry(getMonth(workspace.id, month) ?? emptyMonth(workspace.id, month));
    setMmd(loadDraft(workspace.id, workspace.periodStart, workspace.periodEnd));
    setInstallation(
      getInstallation(workspace.installationId) ?? { ...emptyInstallation(), id: workspace.installationId, name: workspace.installationName },
    );
    setPrecursors(listSuppliers(workspace.id).filter((s) => s.parentId === null));
    setSubmission(submissionFor(workspace.id, month));
    setUnlocked(false);
  }, [workspace.id, workspace.installationId, workspace.installationName, workspace.periodStart, workspace.periodEnd, month]);

  /* A month nobody has submitted is just a form — it opens editable, because
     there is no other way in. Once submitted it opens FIXED, and Edit is a
     deliberate act. */
  const hasSubmission = entry?.status === "submitted" || entry?.status === "reviewed";
  const readOnly = hasSubmission && !unlocked;

  const autosave = useAutoSave(
    { entry, mmd, installation },
    (v) => {
      if (v.entry) saveMonth(v.entry);
      if (v.mmd) saveDraft(workspace.id, v.mmd);
      /* THE INSTALLATION IS ONE RECORD, NOT TWO COPIES. Writing it here is
         what makes the exporter's correction reach the supplier's link, in the
         same way the supplier's correction reaches this page. */
      if (v.installation && v.installation.name.trim() && v.installation.id.trim()) saveInstallation(v.installation);
      // Editing a month somebody else attested to VOIDS that attestation —
      // their name must not travel onto figures they have not seen.
      if (hasSubmission) setSubmission(markExporterEdited(workspace.id, month));
      refresh();
    },
    { enabled: Boolean(entry) && !readOnly },
  );

  const reloadPrecursors = React.useCallback(() => {
    setPrecursors(listSuppliers(workspace.id).filter((s) => s.parentId === null));
  }, [workspace.id]);

  /** Which fuels had a supporting document a moment ago — see
      `reconcileFuelEvidence`. Seeded on load, because "was covered" cannot be
      recovered from the store after the file is gone. */
  const fuelEvidenceRef = React.useRef<Record<string, boolean>>({});
  const requiresIndirect = workspaceRequiresIndirectEmissions(workspace.productId);

  React.useEffect(() => {
    if (!entry) return;
    const cov = coverageForMonth(workspace.id, entry, requiresIndirect);
    fuelEvidenceRef.current = Object.fromEntries(
      entry.fuels.map((f) => [f.id, cov.rows.find((r) => r.key === fuelEvidenceKey(f.id))?.covered ?? false]),
    );
    // Only on arrival at a month — thereafter the snapshot is advanced by the
    // reconcile itself, and re-seeding on every keystroke would erase the
    // "was covered" memory the rule depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id, month]);

  /* Removing the last document behind a Type II factor reverts that fuel to
     the EU standard value. The rule lives in lib/workspace-evidence.ts so the
     supplier's Documents step enforces the identical thing. */
  const onDocumentsChanged = () => {
    setEntry((cur) => {
      if (!cur) return cur;
      const r = reconcileFuelEvidence(workspace.id, cur, fuelEvidenceRef.current, requiresIndirect);
      fuelEvidenceRef.current = r.covered;
      if (r.reverted.length > 0) {
        queueMicrotask(() =>
          toast({
            message: `${r.reverted.join(", ")} reverted to the EU standard value`,
            detail: "The document behind the Type II factor was removed, so the figure can no longer stand as entered.",
            tone: "warn",
          }),
        );
      }
      return r.entry;
    });
    refresh();
  };

  if (!entry || !mmd || !installation) return null;

  const issues = monthIssues(entry);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warn");
  const result = monthResult(entry);

  /* ── The methodology and the month, kept in step ──────────────
     Both live in this component's state now, which is where the supplier flow
     reconciles them too — so the same rules in lib/mmd-sync.ts apply on both
     sides rather than one going through the store and the other not. */
  const fuelLabel = (id: string) => fuelTypeLabel(id);

  /* DEFERRED OUT OF THE RENDER PHASE. `announce` is reached from inside a
     `setState` updater, and an updater runs while React is rendering — firing
     a toast there updates the Toaster mid-render, which React reports as a
     bug because it is one. The microtask puts it after the commit. */
  const announce = (notes: string[]) => {
    if (notes.length === 0) return;
    queueMicrotask(() => toast({ message: "Methodology and month updated together", detail: notes.join(" "), tone: "info" }));
  };

  const setMmdSynced = (next: WorkspaceMmdContent) => {
    setMmd(next);
    setEntry((prev) => {
      if (!prev) return prev;
      const r = syncFromMmd(next, prev, fuelLabel);
      announce(r.notes);
      return r.entry.fuels === prev.fuels && r.entry.electricityFactorSource === prev.electricityFactorSource
        ? prev
        : { ...r.entry, status: prev.status === "empty" ? "draft" : prev.status };
    });
  };

  const syncMmdFromEntry = (nextEntry: MonthlyEntry) => {
    setMmd((prevMmd) => {
      if (!prevMmd) return prevMmd;
      const r = syncFromMonth(prevMmd, nextEntry, fuelLabel);
      announce(r.notes);
      return r.mmd;
    });
  };

  const patch = (p: Partial<MonthlyEntry>) =>
    setEntry((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...p, status: prev.status === "empty" ? "draft" : prev.status } as MonthlyEntry;
      // Only these two feed back into the methodology; a quantity keystroke
      // must not touch it, let alone announce it.
      if (p.fuels !== undefined || p.electricityFactorSource !== undefined) queueMicrotask(() => syncMmdFromEntry(next));
      return next;
    });

  const patchFuel = (id: string, p: Partial<FuelEntry>) =>
    setEntry((prev) =>
      prev
        ? { ...prev, fuels: prev.fuels.map((f) => (f.id === id ? { ...f, ...p } : f)), status: prev.status === "empty" ? "draft" : prev.status }
        : prev,
    );

  const setPrecursorMonth = (row: PrecursorSupplier, tonnes: number | undefined) => {
    const others = (row.monthlyQuantities ?? []).filter((q) => q.month !== month);
    saveSupplier({
      ...row,
      monthlyQuantities: tonnes == null ? others : [...others, { month, tonnes }].sort((a, b) => a.month.localeCompare(b.month)),
    });
    reloadPrecursors();
    refresh();
  };

  const copyPrevious = () => {
    const cloned = copyFromPreviousMonth(workspace.id, month);
    if (!cloned) {
      toast({ message: "Nothing to copy", detail: "The previous month has no fuel or electricity setup yet.", tone: "warn" });
      return;
    }
    setEntry(cloned);
    toast({
      message: "Setup copied",
      detail: "Fuel types, factors, NCVs and the electricity factor were cloned. Quantities were NOT — enter this month's readings.",
      tone: "ok",
    });
  };

  return (
    <div className="space-y-5">
      {/* ── The title, and the one fact a form owes its reader ──
          THE AUTOSAVE BADGE SITS ON THE TITLE'S LINE. It answers the question
          a form raises before any other — is what I typed kept — and it used
          to answer it from a strip of its own above the title, which read as
          a toolbar and was scrolled past as one. On the heading it is where
          the eye already is, and it costs no row.

          THERE IS NO SUBMIT BUTTON. A month is submitted by the plant, on
          their own link, under their own attestation; this screen is where
          the exporter reads that month and decides about it. A Submit here
          put the exporter's press on the supplier's figures — the same act
          the read-only lock and the edit record exist to keep visible. What
          is left on this line is setup, which is the exporter's to copy. */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/40">{t("Monthly data")}</span>
          <div className="flex flex-wrap items-center gap-3">
            {!readOnly && <AutoSaveBadge status={autosave.status} savedAt={autosave.savedAt} />}
            {hasPreviousMonthSetup(workspace.id, month) && !readOnly && (
              <Button size="sm" variant="secondary" onClick={copyPrevious}>
                <Copy size={13} strokeWidth={1.5} /> {t("Copy setup from previous month")}
              </Button>
            )}
          </div>
        </div>
        <h2 className="mt-1 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{monthNameLong(month)}</h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-black/45">
          {t("The same form the supplier answers on their link, field for field. What you change here is what they see; what they send is what you read.")}
        </p>
      </div>

      {/* ══ WHAT THE MONTH SAYS, BEFORE THE FORM THAT SAYS IT ══
          Three blocks, in the order the exporter's own question runs:

            1 · WHAT IT COMES TO. Four figures. Somebody opening March in
                November is nearly always checking a number, not typing one,
                and the number used to be five screens down, under the whole
                form, reachable only by reading past every field that fed it.
            2 · THE REVIEW. Which version is on file, when it landed, and the
                decisions only the exporter can take about it. It sits under
                the figures because it is a judgement ABOUT them.
            3 · AND WHAT YOU DO IF THE ANSWER IS NO — send it back, naming the
                parts. Directly under the decision it belongs to, rather than
                at the foot of the page where it was a fourth thing to find.

          The form itself follows, because editing is what you do after all
          three, and only sometimes. */}
      <SectionCard
        title={t("This month")}
        blurb={t("Computed from the form below. Monthly SEE is indicative only — the year's figure divides once, at the end.")}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ["Produced", `${fmt(result.productionTonnes, 2)} t`],
            ["Fuel CO₂", `${fmt(result.fuelTCO2, 2)} tCO₂`],
            ["Electricity CO₂", `${fmt(result.indirectTCO2, 2)} tCO₂`],
            ["Total", `${fmt(result.directTCO2 + result.indirectTCO2, 2)} tCO₂`],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">{k}</div>
              <div className="mt-1 font-mono text-[15px] text-black/80">{v}</div>
            </div>
          ))}
        </div>

        {entry.submittedAt && (
          <p className="mt-4 text-[12px] text-[#047857]">
            Submitted {entry.submittedAt.slice(0, 10)} by {entry.submittedBy}.
          </p>
        )}
      </SectionCard>

      {submission && (
        <MonthReviewBar
          submission={submission}
          month={month}
          locked={readOnly}
          canEdit={hasSubmission}
          onUnlock={() => setUnlocked(true)}
          onChanged={setSubmission}
          onReopened={() => {
            const reloaded = getMonth(workspace.id, month);
            if (reloaded) setEntry(reloaded);
            setUnlocked(false);
            refresh();
          }}
        />
      )}

      {submission && (
        <RevisionRequestPanel
          submission={submission}
          month={month}
          /* Gated on whether anything was ever SUBMITTED, not on whether the
             readings are locked right now. A month reopened after an approved
             edit request has a supplier on the other end of it — telling the
             exporter there is nobody to send it back to would be false. */
          disabled={submission.state === "open"}
          onChanged={setSubmission}
          onReopened={() => {
            const reloaded = getMonth(workspace.id, month);
            if (reloaded) setEntry(reloaded);
            setUnlocked(false);
            refresh();
          }}
        />
      )}

      {/* NOT "this month has been reviewed" — read-only is the state a
          SUBMITTED month opens in, before anybody has reviewed anything. */}
      {readOnly && (
        <Note tone="info">
          {t("Locked while you read it. Press")} <strong>{t("Edit")}</strong> {t("above to change a figure — doing so is recorded, and it replaces the supplier’s attestation with your own edit.")}
        </Note>
      )}

      {/* ══ THE FORM — the supplier's, not a second version of it ══ */}
      <InstallationStep
        value={installation}
        onChange={setInstallation}
        readOnly={readOnly}
        existingId={workspace.installationId}
        autoSave={autosave.status}
        savedAt={autosave.savedAt}
      />

      <MmdStep value={mmd} onChange={setMmdSynced} readOnly={readOnly} cnCode={workspace.cnCode} />

      <MonthlyStep workspaceId={workspace.id} entry={entry} patch={patch} patchFuel={patchFuel} readOnly={readOnly} />

      <PrecursorStep rows={precursors} month={month} onTonnes={setPrecursorMonth} readOnly={readOnly} />

      <DocumentsStep workspaceId={workspace.id} workspace={workspace} entry={entry} onChange={onDocumentsChanged} />

      {/* ── What is wrong with it, AFTER it ───────────────────
          This block used to open the screen. A list of faults above a form is
          a list of faults about fields the reader has not seen yet — and on a
          fresh month it is simply a wall of red saying "you have not filled
          this in", which the empty form already says. Read as a summary, at
          the end, it is the thing it always was. */}
      <div id="month-errors" className="scroll-mt-24 space-y-4">
        {errors.length > 0 && (
          <Note tone="err">
            <div className="flex items-center gap-2 font-medium">
              <TriangleAlert size={14} strokeWidth={1.5} /> {errors.length} error{errors.length === 1 ? "" : "s"} — this month cannot be submitted
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4">
              {errors.map((e, i) => (
                <li key={i}>{e.message}</li>
              ))}
            </ul>
          </Note>
        )}

        {warnings.length > 0 && (
          <Note tone="warn">
            <div className="font-medium">
              {warnings.length} thing{warnings.length === 1 ? "" : "s"} worth a look — none of them block submission.
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4">
              {warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          </Note>
        )}

        {errors.length === 0 && warnings.length === 0 && entry.status !== "empty" && (
          <Note>{t("Nothing is outstanding in this month. Every figure the arithmetic needs is present.")}</Note>
        )}
      </div>

      <p className="text-[12px] leading-relaxed text-black/40">
        The precursor chain itself — who supplies what — is a property of the year, not of this month. Add or remove rows on the{" "}
        <Link href={`/workspaces/${workspace.id}/tree`} className="underline underline-offset-2">
          {t("Supply Chain")}
        </Link>{" "}
        page; the tonnages stay here.
      </p>
    </div>
  );
}

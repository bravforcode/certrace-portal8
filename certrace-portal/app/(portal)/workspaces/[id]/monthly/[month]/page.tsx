"use client";

export const runtime = "edge";

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

     · MmdStep            the methodology in force
     · MonthlyStep        production, fuels, electricity, process, the rest
     · DocumentsStep      what stands behind the figures

   The installation's own record and the precursors received are NOT part of the
   month: the site is entered once on the installation's Overview, and the
   precursors live on the product report's Precursors tab.

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
import { AutoSaveBadge, Button, cn, useAutoSave } from "@/components/ui";
import { toast } from "@/components/toast";
import { type WorkspaceMmdContent } from "@/lib/workspace-mmd";
import { syncFromMmd, syncFromMonth } from "@/lib/mmd-sync";
import { Note, SectionCard, fmt } from "@/components/workspace/chrome";
import { MonthReviewBar } from "@/components/workspace/month-review";
import {
  AuthorisationHistory,
  ContentsBox,
  ringField,
} from "@/components/workspace/month-contents";
import { RevisionRequestPanel } from "@/components/workspace/revision-request";
import {
  DocumentsStep,
  MmdStep,
  MonthlyStep,
} from "@/components/supplier/month-steps";
import { AiFillRunBanner } from "@/components/intake/ai-badge";
import { useWorkspace } from "@/components/workspace/provider";
import {
  copyFromPreviousMonth,
  emptyMonth,
  fuelEvidenceKey,
  fuelTypeLabel,
  hasPreviousMonthSetup,
  monthIssues,
  monthResult,
  type FuelEntry,
  type MonthlyEntry,
} from "@/lib/monthly-data";
import { deriveMonth } from "@/lib/monthly-inputs";
import { runMonthQualityCheck, type ContentRow } from "@/lib/month-quality";
import { authorisationHistory } from "@/lib/month-submission";
import {
  useClearNotManufactured,
  useMarkExporterEdited,
  useMmdDraft,
  useMonth,
  useMonthEvidence,
  useSaveMmdDraft,
  useSaveMonth,
  useSubmission,
} from "@/lib/workspace-data-query";
import {
  coverageForMonth,
  reconcileFuelEvidence,
} from "@/lib/workspace-evidence";
import { workspaceRequiresIndirectEmissions } from "@/lib/cbam/product-category-rules";
import { monthNameLong } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

export default function MonthEditorPage({
  params,
}: {
  params: Promise<{ id: string; month: string }>;
}) {
  const t = useT();
  const { month } = React.use(params);
  const { workspace, refresh } = useWorkspace();

  /* Everything the month is made of, read exactly as the supplier flow reads
     it — same stores, now through the same query cache, so the two screens
     cannot start from different pictures of the same month, and every write
     invalidates its way back to both. */
  const { data: savedMonth } = useMonth(workspace.id, month);
  const { data: savedMmd } = useMmdDraft(
    workspace.id,
    workspace.periodStart,
    workspace.periodEnd,
  );
  const { data: submission } = useSubmission(workspace.id, month);
  const saveMonthMutation = useSaveMonth();
  const saveMmdDraft = useSaveMmdDraft();
  const markEdited = useMarkExporterEdited();
  const clearIdle = useClearNotManufactured();
  const { data: monthEvidence } = useMonthEvidence(workspace.id, month);

  /* Edit buffers over those reads — typing stays synchronous, the autosave
     below writes through the mutations, and the effect after it reseeds the
     buffers whenever the store moves underneath. */
  const [entry, setEntry] = React.useState<MonthlyEntry | null>(null);
  const [mmd, setMmd] = React.useState<WorkspaceMmdContent | null>(null);
  const [unlocked, setUnlocked] = React.useState(false);

  React.useEffect(() => {
    setUnlocked(false);
  }, [workspace.id, month]);

  /* A month nobody has submitted is just a form — it opens editable, because
     there is no other way in. Once submitted it opens FIXED, and Edit is a
     deliberate act. */
  const hasSubmission =
    entry?.status === "submitted" || entry?.status === "reviewed";
  const readOnly = hasSubmission && !unlocked;

  const autosave = useAutoSave(
    { entry, mmd },
    async (v) => {
      if (v.entry) await saveMonthMutation.mutateAsync(v.entry);
      if (v.mmd)
        await saveMmdDraft.mutateAsync({
          workspaceId: workspace.id,
          content: v.mmd,
        });
      // Editing a month somebody else attested to VOIDS that attestation —
      // their name must not travel onto figures they have not seen.
      if (hasSubmission)
        await markEdited.mutateAsync({ workspaceId: workspace.id, month });
      refresh();
    },
    { enabled: Boolean(entry) && !readOnly },
  );

  /* The buffers resync whenever the query data changes — after a reopen, an
     approved edit, a save from the supplier's side — but NEVER while this
     screen holds keystrokes the autosave has not written yet: the refetch a
     nearby write triggers would hand back the pre-keystroke month and erase
     them. The status is read through a ref so the resync fires on data
     arriving, not on the autosave's own transitions. */
  const autosaveStatus = React.useRef(autosave.status);
  autosaveStatus.current = autosave.status;
  React.useEffect(() => {
    if (
      autosaveStatus.current === "pending" ||
      autosaveStatus.current === "saving"
    )
      return;
    if (savedMonth !== undefined)
      setEntry(savedMonth ?? emptyMonth(workspace.id, month));
    if (savedMmd) setMmd(savedMmd);
  }, [savedMonth, savedMmd, workspace.id, month]);

  /** Which fuels had a supporting document a moment ago — see
      `reconcileFuelEvidence`. Seeded on load, because "was covered" cannot be
      recovered from the store after the file is gone. */
  const fuelEvidenceRef = React.useRef<Record<string, boolean>>({});
  const requiresIndirect = workspaceRequiresIndirectEmissions(
    workspace.productId,
  );

  React.useEffect(() => {
    if (!entry) return;
    const cov = coverageForMonth(workspace.id, entry, requiresIndirect);
    fuelEvidenceRef.current = Object.fromEntries(
      entry.fuels.map((f) => [
        f.id,
        cov.rows.find((r) => r.key === fuelEvidenceKey(f.id))?.covered ?? false,
      ]),
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
      const r = reconcileFuelEvidence(
        workspace.id,
        cur,
        fuelEvidenceRef.current,
        requiresIndirect,
      );
      fuelEvidenceRef.current = r.covered;
      if (r.reverted.length > 0) {
        queueMicrotask(() =>
          toast({
            message: `${r.reverted.join(", ")} reverted to the EU standard value`,
            detail:
              "The document behind the Type II factor was removed, so the figure can no longer stand as entered.",
            tone: "warn",
          }),
        );
      }
      return r.entry;
    });
    refresh();
  };

  if (!entry || !mmd) return null;

  const issues = monthIssues(entry);

  /* What the plant is asked for, read the way the plant reads it (its Check step): completeness, not correctness. */
  const report = runMonthQualityCheck({
    entry,
    mmd,
    month,
    peers: [],
    documentCount: monthEvidence?.length ?? 0,
    audience: "supplier",
  });
  const gotoRow = (row: ContentRow) => {
    if (!ringField(row.field)) window.scrollTo({ top: 0, behavior: "smooth" });
    if (row.state !== "ready")
      toast({
        message: t(row.label),
        detail: row.note ? t(row.note) : t("Fill this in."),
        tone: "info",
      });
  };
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
    queueMicrotask(() =>
      toast({
        message: "Methodology and month updated together",
        detail: notes.join(" "),
        tone: "info",
      }),
    );
  };

  const setMmdSynced = (next: WorkspaceMmdContent) => {
    setMmd(next);
    setEntry((prev) => {
      if (!prev) return prev;
      const r = syncFromMmd(next, prev, fuelLabel);
      announce(r.notes);
      return r.entry.fuels === prev.fuels &&
        r.entry.electricityFactorSource === prev.electricityFactorSource
        ? prev
        : {
            ...r.entry,
            status: prev.status === "empty" ? "draft" : prev.status,
          };
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
      // A stock change, a shared meter, a gas row or a delivery WRITES the quantity it stands for — here, so the form shows the same figure the month will hold.
      const next = deriveMonth({
        ...prev,
        ...p,
        status: prev.status === "empty" ? "draft" : prev.status,
      } as MonthlyEntry);
      // Only these two feed back into the methodology; a quantity keystroke
      // must not touch it, let alone announce it.
      if (p.fuels !== undefined || p.electricityFactorSource !== undefined)
        queueMicrotask(() => syncMmdFromEntry(next));
      return next;
    });

  const patchFuel = (id: string, p: Partial<FuelEntry>) =>
    setEntry((prev) =>
      prev
        ? deriveMonth({
            ...prev,
            fuels: prev.fuels.map((f) => (f.id === id ? { ...f, ...p } : f)),
            status: prev.status === "empty" ? "draft" : prev.status,
          })
        : prev,
    );

  const copyPrevious = () => {
    const cloned = copyFromPreviousMonth(workspace.id, month);
    if (!cloned) {
      toast({
        message: "Nothing to copy",
        detail: "The previous month has no fuel or electricity setup yet.",
        tone: "warn",
      });
      return;
    }
    setEntry(cloned);
    toast({
      message: "Setup copied",
      detail:
        "Fuel types, factors, NCVs and the electricity factor were cloned. Quantities were NOT — enter this month's readings.",
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
          <span className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/40">
            {t("Monthly data")}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {!readOnly && (
              <AutoSaveBadge
                status={autosave.status}
                savedAt={autosave.savedAt}
              />
            )}
            {hasPreviousMonthSetup(workspace.id, month) && !readOnly && (
              <Button size="sm" variant="secondary" onClick={copyPrevious}>
                <Copy size={13} strokeWidth={1.5} />{" "}
                {t("Copy setup from previous month")}
              </Button>
            )}
          </div>
        </div>
        <h2 className="mt-1 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
          {monthNameLong(month)}
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-black/45">
          {t(
            "On top, what the plant is asked for. Below it, what has been entered — fill in anything for them, or change it. It is the same form they answer on their link.",
          )}
        </p>
      </div>

      {/* A month in which nothing was made has no form: nothing is asked of the plant and nothing is counted. */}
      {entry.notManufactured && (
        <SectionCard
          title={t("No production this month")}
          blurb={t(
            "You recorded that nothing was made in {month}. The plant is not asked for it, it counts as answered, and it adds no tonnes and no emissions to the year.",
            { month: monthNameLong(month) },
          )}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              clearIdle.mutate(
                { workspaceId: workspace.id, month },
                { onSuccess: () => refresh() },
              )
            }
          >
            {t("Undo — the plant did produce")}
          </Button>
        </SectionCard>
      )}

      {/* ══ WHAT THE PLANT IS ASKED FOR ══ — the same list the plant meets at its Check step, on top, so the first thing here is what is in and what is not. */}
      {!entry.notManufactured && (
        <ContentsBox
          report={report}
          onGoto={gotoRow}
          title={t("What the plant is asked for")}
          purpose={t(
            "Every part of this month and whether it is filled in. Tap a row to go to it — you can fill any of it in for them.",
          )}
        />
      )}

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
      {!entry.notManufactured && (
        <SectionCard
          title={t("This month")}
          blurb={t(
            "Computed from the form below. Monthly SEE is indicative only — the year's figure divides once, at the end.",
          )}
        >
          {/* Steel, aluminium and hydrogen count direct emissions only (Annex II to Regulation (EU) 2023/956): their electricity is not a tile and not part of the total. */}
          <div
            className={cn(
              "grid gap-4",
              requiresIndirect ? "sm:grid-cols-4" : "sm:grid-cols-3",
            )}
          >
            {[
              ["Produced", `${fmt(result.productionTonnes, 2)} t`],
              ["Fuel CO₂", `${fmt(result.fuelTCO2, 2)} tCO₂`],
              ...(requiresIndirect
                ? [["Electricity CO₂", `${fmt(result.indirectTCO2, 2)} tCO₂`]]
                : []),
              requiresIndirect
                ? [
                    "Total",
                    `${fmt(result.directTCO2 + result.indirectTCO2, 2)} tCO₂`,
                  ]
                : ["Direct CO₂", `${fmt(result.directTCO2, 2)} tCO₂`],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">
                  {t(k)}
                </div>
                <div className="mt-1 font-mono text-[15px] text-black/80">
                  {v}
                </div>
              </div>
            ))}
          </div>

          {entry.submittedAt && (
            <p className="mt-4 text-[12px] text-[#047857]">
              {t("Submitted {date} by {name}.", {
                date: entry.submittedAt.slice(0, 10),
                name: entry.submittedBy ?? "",
              })}
            </p>
          )}
        </SectionCard>
      )}

      {/* THE REVIEW AND THE REVISION REQUEST ARE ABOUT A SUBMISSION. Before anything has been sent they say "Not submitted — no version on file" and
          "nobody to send it back to", which is two cards of nothing above a form; they appear once the plant has sent the month. */}
      {submission &&
        !entry.notManufactured &&
        (submission.state !== "open" || hasSubmission) && (
          <MonthReviewBar
            submission={submission}
            beforeChange={readOnly ? undefined : autosave.flush}
            month={month}
            locked={readOnly}
            canEdit={hasSubmission}
            onUnlock={() => setUnlocked(true)}
            /* The bar writes to the store itself; refresh() invalidates the
             subtree, so the submission and the reloaded month both come back
             through the queries above. */
            onChanged={() => refresh()}
            onReopened={() => {
              setUnlocked(false);
              refresh();
            }}
          />
        )}

      {submission && !entry.notManufactured && submission.state !== "open" && (
        <RevisionRequestPanel
          submission={submission}
          beforeChange={readOnly ? undefined : autosave.flush}
          month={month}
          onChanged={() => refresh()}
          onReopened={() => {
            setUnlocked(false);
            refresh();
          }}
        />
      )}

      {/* NOT "this month has been reviewed" — read-only is the state a
          SUBMITTED month opens in, before anybody has reviewed anything. */}
      {readOnly && !entry.notManufactured && (
        <Note tone="info">
          {t("Locked while you read it. Press")} <strong>{t("Edit")}</strong>{" "}
          {t(
            "above to change a figure — doing so is recorded, and it replaces the supplier’s attestation with your own edit.",
          )}
        </Note>
      )}

      {/* ══ THE FORM — the supplier's, not a second version of it ══ */}
      {!entry.notManufactured && (
        <>
          <MmdStep
            value={mmd}
            onChange={setMmdSynced}
            readOnly={readOnly}
            cnCode={workspace.cnCode}
          />

          {/* PROTOTYPE: "AI just filled these" when smart upload sent the reader here. */}
          <AiFillRunBanner
            scope={`ws:${workspace.id}`}
            month={month}
            hrefFor={(m) => `/workspaces/${workspace.id}/monthly/${m}`}
            scroll={false}
          />

          <MonthlyStep
            workspaceId={workspace.id}
            entry={entry}
            patch={patch}
            patchFuel={patchFuel}
            readOnly={readOnly}
          />

          <DocumentsStep
            workspaceId={workspace.id}
            workspace={workspace}
            entry={entry}
            onChange={onDocumentsChanged}
            onEntryChange={patch}
          />

          {/* Who authorised the month, and when — the foot of the monthly data, as on the plant's own link. */}
          <AuthorisationHistory history={authorisationHistory(submission)} />
        </>
      )}

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
              <TriangleAlert size={14} strokeWidth={1.5} />{" "}
              {errors.length === 1
                ? t("{n} error — this month cannot be submitted", { n: 1 })
                : t("{n} errors — this month cannot be submitted", {
                    n: errors.length,
                  })}
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4">
              {errors.map((e, i) => (
                <li key={i}>{t(e.message)}</li>
              ))}
            </ul>
          </Note>
        )}

        {warnings.length > 0 && (
          <Note tone="warn">
            <div className="font-medium">
              {warnings.length === 1
                ? t("{n} thing worth a look — none of them block submission.", {
                    n: 1,
                  })
                : t(
                    "{n} things worth a look — none of them block submission.",
                    { n: warnings.length },
                  )}
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4">
              {warnings.map((w, i) => (
                <li key={i}>{t(w.message)}</li>
              ))}
            </ul>
          </Note>
        )}

        {errors.length === 0 &&
          warnings.length === 0 &&
          entry.status !== "empty" &&
          !entry.notManufactured && (
            <Note>
              {t(
                "Nothing is outstanding in this month. Every figure the arithmetic needs is present.",
              )}
            </Note>
          )}
      </div>

      <p className="text-[12px] leading-relaxed text-black/40">
        {t(
          "The direct precursors — who supplies what, and how much — are a property of the year, not of this month. Add or change them on the",
        )}{" "}
        <Link
          href={`/workspaces/${workspace.id}/precursors`}
          className="underline underline-offset-2"
        >
          {t("Precursors")}
        </Link>{" "}
        {t("tab.")}
      </p>
    </div>
  );
}

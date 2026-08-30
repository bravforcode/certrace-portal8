"use client";

/* ════════════════════════════════════════════════════════════
   READINESS — "can we call the verifier yet?"

   THE SCREEN IS ORDERED THE WAY THE QUESTION IS ASKED, and it did not used to
   be. It opened on the DOWNLOAD — the last act of the year — and then worked
   backwards through the things that have to be true before that button means
   anything. So the first thing an exporter saw on the readiness screen was a
   button they could not press, under two paragraphs about a file that does not
   exist yet.

   It now reads:

     1 · how complete the year is, in one bar
     2 · the materiality self-check — whether the estimated share is small
         enough to stand
     3 · the carbon price paid at home — annual, exporter-owned, and the one
         figure on this screen that is entered rather than derived
     4 · WHAT THE REPORT WILL CONTAIN — the document's own table of contents,
         section by section, with a state against each line
     5 · and only then, the download

   THERE IS ONE CHECKLIST ON THIS SCREEN, AND IT IS SECTION 4. There used to be
   two. A grid of five tab cards — Monthly data, Precursors, Evidence,
   Materiality, Carbon price — sat directly above the table of contents, each
   listing what was missing behind it. Both were answering "what is left to
   do", from the same underlying state, one immediately after the other: an
   unstarted year printed twelve "January 2026 not submitted" lines in the
   grid and then said the same thing again, in the report's own shape, in the
   section below. Two lists that always agree are not two readings; they are
   one reading the reader has to check against itself.

   The one that stayed is the one organised the way the DOCUMENT is, because
   that is the artefact this screen exists to produce. Readiness is per TAB —
   a tab is somebody's job — but nobody sends a tab. lib/report-contents.ts
   reads the same state the report is built from and reports it section by
   section, with a link into each, so nothing that was actionable in the grid
   became unreachable when it went: the per-tab state is still the rollup bar
   at the top and still the tab strip's own chips, one click away and in the
   place a reader already goes to change it.

   THE CARBON PRICE IS EDITED, NOT AUTOSAVED. Everywhere else in this build a
   figure saves as it is typed, and that is right for a meter reading. This one
   is a legal claim against a liability, entered once a year from a receipt: a
   half-typed "20" on the way to "200" is a claim of a tenth the amount, live,
   for as long as it takes to type the next character. Edit / Cancel / Save, and
   the Save says so on the button.

   ONE DOWNLOAD, AND IT OPENS WHEN THE YEAR IS FINISHED. It used to hand out a
   copy of an incomplete workspace stamped DRAFT. A stamp is a word on page
   one: what actually leaves the building is a complete-looking CBAM
   communication with holes in it, and the stamp is all that stands between a
   half-finished year and a declarant's inbox. So the gate is the real one —
   everything applicable complete, the methodology final, and a name against
   the figures.

   The methodology half of that gate is READ FROM the MMD tab's own readiness
   state — lib/readiness.ts's, the one every other surface reads — never
   recomputed here. The MMD has no card and no section of its own on this
   screen, and it has lost none of its hold over the download: the line under
   the button names it as the reason the button is off, so the gate never goes
   silent.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Check, Download, Pencil } from "lucide-react";
import { Button, ButtonLink, Card, Chip, Field, Modal, Progress, SaveButton, inputClass, cn, useSaveState } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { Note, SectionCard, StateChip, fmt } from "@/components/workspace/chrome";
import { useWorkspace } from "@/components/workspace/provider";
import {
  CARBON_PRICE_CLAIMED_NOTE,
  CARBON_PRICE_INSTRUMENTS,
  CARBON_PRICE_INSTRUMENT_HINT,
  CARBON_PRICE_INSTRUMENT_LABEL,
  claimedDeduction,
  getCarbonPrice,
  saveCarbonPrice,
  THAILAND_EXCISE_CARBON_PRICE,
  type CarbonPriceInstrument,
  type CarbonPriceRecord,
} from "@/lib/carbon-price";
import { materiality, MATERIALITY_THRESHOLD } from "@/lib/readiness";
import { CONTENT_STATE_LABEL, CONTENT_STATE_TONE, contentTally, reportContents, type ContentPart } from "@/lib/report-contents";
import { annualCoverage, annualScopeFor, CARBON_PRICE_KEY } from "@/lib/workspace-evidence";
import { SectionEvidence } from "@/components/workspace/evidence-panel";
import { buildFinalReport, downloadFinalReport } from "@/lib/cbam/final-report";
import { saveFinalReportSnapshot } from "@/lib/cbam/final-report-snapshot";
import { packFingerprint, signOffPack, signOffState, SIGNOFF_DISCLAIMER, type SignOffState } from "@/lib/pack-signoff";
import { listEvidence } from "@/lib/workspace-evidence";
import { workspaceSEE } from "@/lib/workspace-see";
import { useT } from "@/lib/i18n";
import { useAccount } from "@/components/account-lock";
import { LOCK_DESTINATION } from "@/lib/plan";

const numeric = (v: string): number => {
  const n = Number(v.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export default function ReadinessPage() {
  const t = useT();
  const { workspace, readiness, refresh } = useWorkspace();
  const [price, setPrice] = React.useState<CarbonPriceRecord | null>(null);
  const [see, setSee] = React.useState<ReturnType<typeof workspaceSEE> | null>(null);
  const [contents, setContents] = React.useState<ContentPart[] | null>(null);

  React.useEffect(() => {
    setPrice(getCarbonPrice(workspace.id));
    setSee(workspaceSEE(workspace));
    setContents(reportContents(workspace, readiness, t));
  }, [workspace, readiness]);

  const mat = React.useMemo(() => materiality(workspace), [workspace, readiness]);
  /* Same resolution the readiness rule uses, so this warning and the tab's
     state can never disagree about whether the receipt is attached. */
  const priceEvidenced = React.useMemo(
    () =>
      Boolean(
        annualCoverage(workspace.id, annualScopeFor(workspace.id, workspace.periodStart, workspace.periodEnd, (price?.amountPerTonne ?? 0) > 0)).find(
          (r) => r.key === CARBON_PRICE_KEY.key,
        )?.covered,
      ),
    [workspace.id, workspace.periodStart, workspace.periodEnd, price, readiness],
  );
  const blocked = readiness.overall === "blocked";

  /* Read through the account context rather than calling planAllows() so the
     control re-renders when the plan resolves on the client — see
     components/account-lock.tsx. */
  const { plan } = useAccount();
  const methodologyDocLocked = !plan.features.methodologyDoc;

  /* The SAME MMD tab every other surface reads — the chain rows, the dashboard
     dots, lib/report-contents.ts. Read here rather than recomputed: a second
     "is the MMD final?" check would be a second answer to the question, free
     to drift from the one the rest of the build is working off. There is no
     card for it in the grid below any more, so the sentence under the download
     button is the only place this state is spoken aloud on this screen — which
     is why that sentence names the MMD outright. */
  const mmdTab = readiness.tabs.find((t) => t.tab === "mmd");
  const mmdBlocked = mmdTab != null && mmdTab.state !== "complete";

  /* ── The sign-off gate ────────────────────────────────────────
     Computed from the same figures the report prints, so "signed" always
     refers to a document somebody could reproduce. See lib/pack-signoff.ts
     for why editing invalidates it. */
  const fingerprint = React.useMemo(
    () =>
      packFingerprint({
        // `see` is null on the first paint. A signature taken against zeros
        // would be invalidated the moment the real figures arrived, so the
        // gate stays closed until they have.
        seeDirect: see?.seeDirect ?? NaN,
        seeIndirect: see?.seeIndirect ?? NaN,
        seePrecursor: see?.seePrecursor ?? NaN,
        productionTonnes: see?.production.tonnes ?? NaN,
        readiness: readiness.overall,
        evidenceCount: listEvidence(workspace.id).length,
      }),
    [see, readiness, workspace.id],
  );
  const [signState, setSignState] = React.useState<SignOffState>({ kind: "draft_open", signOff: null });
  const [signOpen, setSignOpen] = React.useState(false);
  const [signName, setSignName] = React.useState("");
  const [signTitle, setSignTitle] = React.useState("");

  React.useEffect(() => {
    setSignState(signOffState(workspace.id, readiness.overall === "complete", fingerprint));
  }, [workspace.id, readiness.overall, fingerprint]);

  const confirmSignOff = () => {
    if (!signName.trim() || !signTitle.trim()) return;
    signOffPack(workspace.id, signName, signTitle, fingerprint);
    /* Freeze the report itself, not just the fingerprint that gates it — see
       lib/cbam/final-report-snapshot.ts. */
    saveFinalReportSnapshot(workspace.id, fingerprint, buildFinalReport(workspace, readiness));
    setSignState(signOffState(workspace.id, true, fingerprint));
    setSignOpen(false);
    toast({ message: "Signed off", detail: `${signName.trim()} · ${signTitle.trim()}. The report can now be downloaded.`, tone: "ok" });
  };

  const [exporting, setExporting] = React.useState(false);

  const exportFinal = async () => {
    setExporting(true);
    try {
      const result = await downloadFinalReport(workspace, readiness);
      const unrendered = result.placeholders.length;
      toast({
        message: result.draft ? "Draft report downloaded" : "Report downloaded",
        detail:
          unrendered > 0
            ? `${result.fileName} — ${result.pageCount} pages. ${unrendered} file${unrendered === 1 ? "" : "s"} could not be rendered and ${unrendered === 1 ? "carries" : "carry"} a placeholder page naming ${unrendered === 1 ? "it" : "them"}.`
            : `${result.fileName} — ${result.pageCount} pages, every document inside.`,
        tone: unrendered > 0 ? "warn" : "ok",
      });
    } catch (e) {
      toast({ message: "Could not build the report", detail: e instanceof Error ? e.message : String(e), tone: "err" });
    } finally {
      setExporting(false);
    }
  };

  /* THE REPORT DOWNLOADS WHEN IT IS FINISHED, and not before. This used to
     hand out a copy of an incomplete workspace stamped DRAFT, on the argument
     that the alternative is rebuilding it by hand in Excel. In practice a
     stamp is a word on page one: the file is a complete-looking CBAM
     communication with holes in it, it leaves the building, and the stamp is
     the only thing standing between a half-finished year and a declarant's
     inbox. So the gate is the real one — everything applicable complete, the
     methodology final, and a name against the figures. */
  const canDownload = !mmdBlocked && signState.kind === "signed";

  return (
    <div className="space-y-5">
      {/* ── 1 · How complete the year is ───────────────────────── */}
      <SectionCard
        title={t("Overall readiness")}
        blurb={t("A tab is green only when a verifier would find nothing missing there. Nothing here rounds up.")}
        actions={<StateChip state={readiness.overall} />}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Progress value={readiness.percentComplete} tone={blocked ? "err" : readiness.overall === "complete" ? "ok" : "warn"} />
          </div>
          <span className="font-mono text-[13px] tabular-nums text-black/55">{readiness.percentComplete}%</span>
        </div>
        <p className="mt-2 text-[12px] text-black/40">
          {t("{percent}% of applicable tabs are complete. This percentage is descriptive — it is never used as a gate.", { percent: readiness.percentComplete })}
        </p>
      </SectionCard>

      {/* ── 2 · Materiality ────────────────────────────────────── */}
      <SectionCard title={t("Materiality self-check")} blurb={t("The share of this year's emissions that rests on estimates rather than measurements.")}>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <div className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">{fmt(mat.estimatedTCO2e, 2)}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("tCO₂e estimated")}</div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">{fmt(mat.totalTCO2e, 2)}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("tCO₂e total")}</div>
          </div>
          <div>
            <div
              className={cn("font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight", mat.overThreshold ? "text-[#dc2626]" : "text-[#111]")}
            >
              {fmt(mat.share * 100, 2)}%
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">
              {t("estimated share · threshold {threshold}%", { threshold: MATERIALITY_THRESHOLD.value * 100 })}
            </div>
          </div>
          <div className="flex items-center">
            <p className="text-[13px] text-black/50">
              {mat.overThreshold
                ? "Past 5% the estimate is the number. Close the largest gaps with primary data before engaging a verifier."
                : t("Within the self-check threshold.")}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── 3 · The carbon price paid at home ──────────────────── */}
      {price && <CarbonPriceCard price={price} onSaved={setPrice} see={see} priceEvidenced={priceEvidenced} onEvidenceChange={refresh} />}

      {/* ── 4 · What the report will contain ───────────────────── */}
      {contents && <ReportContentsCard parts={contents} />}

      {/* ── 5 · And only then, the download ────────────────────── */}
      <SectionCard title={t("What you send the verifier")} blurb={t("One file: the EU communication template's field set with the arithmetic shown, then every supporting document as a paginated appendix.")}>
        {signState.kind === "signed" && (
          <Note tone="info">
            {t("Signed off by")} <strong>{signState.signOff.name}</strong> · {signState.signOff.jobTitle} on{" "}
            {new Date(signState.signOff.signedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
          </Note>
        )}
        {signState.kind === "stale" && (
          <Note tone="warn">
            {t("The figures have changed since")} <strong>{signState.signOff.name}</strong> signed on{" "}
            {new Date(signState.signOff.signedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. Sign again before
            sending — a signature against superseded numbers is worse than none.
          </Note>
        )}
        {signState.kind === "needs_signature" && (
          <Note tone="info">{t("Everything applicable is complete. One person inside your company signs these figures off, and the report downloads.")}</Note>
        )}

        <div className="mb-3 mt-4 flex flex-wrap items-center gap-3">
          {/* ── THE ONE THING A FREE TRIAL DOES NOT HAND OVER ──────
              On a trial the button is off and it goes to Plan & billing
              instead. It is a LINK, not a disabled button: a disabled control
              swallows the click, and the whole point here is that the click
              lands somewhere. Muted to the same weight `disabled:opacity-40`
              gives, so it reads as off rather than as an offer.

              AND IT SAYS NOTHING. No "upgrade to download", no ribbon, no
              tooltip — the destination is the explanation, and it is the only
              screen that can do anything about it. See lib/config.ts's
              TRIAL_PLAN for why this is the right thing to hold back when
              everything else on a trial is unlimited. */}
          {methodologyDocLocked ? (
            /* NO `aria-disabled`. The control is not disabled — it is a link
               that goes to Plan & billing, and it does that for a screen
               reader exactly as it does for everybody else. Marking it
               disabled would announce "does nothing" about the one control on
               this card that definitely does something. */
            <ButtonLink href={LOCK_DESTINATION} size="sm" className="opacity-40">
              <Download size={13} strokeWidth={1.5} /> {t("Download Monitoring Methodology Documentation")}
            </ButtonLink>
          ) : (
            <Button size="sm" onClick={exportFinal} disabled={exporting || !canDownload}>
              <Download size={13} strokeWidth={1.5} /> {exporting ? t("Building the PDF…") : t("Download Monitoring Methodology Documentation")}
            </Button>
          )}
          {!methodologyDocLocked && signState.kind !== "draft_open" && (
            <Button size="sm" variant="secondary" onClick={() => setSignOpen(true)}>
              {signState.kind === "signed" ? "Sign again" : "Sign off to download"}
            </Button>
          )}
        </div>

        {/* ONE LINE, and it is the line that says why the button is off. The
            card used to carry three paragraphs about drafts and gates above a
            control the reader was trying to press.

            NOTHING AT ALL on a trial — see the button above. */}
        {!methodologyDocLocked && (
          <p className="text-[12.5px] leading-relaxed text-black/45">
            {canDownload
              ? signState.kind === "signed"
                ? "Signed and current. The report is ready to send."
                : "Everything required is in. The report downloads with every document inside it."
              : mmdBlocked
                ? t("Available once the monitoring methodology is finalised.")
                : "Available once everything required is complete and one person inside your company has signed it off."}
          </p>
        )}

        <Modal
          open={signOpen}
          onClose={() => setSignOpen(false)}
          eyebrow={t("Internal sign-off")}
          title={t("Who is approving these figures?")}
          lead={t("The report carries your company's name. One person inside the business puts theirs to it before it goes out.")}
          footer={
            <>
              <Button size="sm" variant="secondary" onClick={() => setSignOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button size="sm" disabled={!signName.trim() || !signTitle.trim()} onClick={confirmSignOff}>
                {t("Sign off")}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Name")} hint={t("The person answering for these figures, not the person clicking.")}>
                <input className={inputClass} value={signName} onChange={(e) => setSignName(e.target.value)} placeholder={t("Somchai Prasert")} autoFocus />
              </Field>
              <Field label={t("Job title")} hint={t("A verifier reads this to know whether the signatory could have known.")}>
                <input className={inputClass} value={signTitle} onChange={(e) => setSignTitle(e.target.value)} placeholder={t("Energy Manager")} />
              </Field>
            </div>
            <Note tone="muted">{SIGNOFF_DISCLAIMER}</Note>
            <Note tone="warn">
              {t("If any figure changes after this — a month re-submitted, a precursor corrected, a document added — the sign-off lapses and has to be repeated. That is deliberate: it is what stops a signature outliving the numbers it was given for.")}
            </Note>
          </div>
        </Modal>
      </SectionCard>
    </div>
  );
}

/* ── The carbon price, edited rather than autosaved ─────────────
   See the header for why this one figure is not live. The draft is separate
   from the record so a half-typed amount never reaches the readiness rule
   that reads it, and Cancel is a real undo rather than a re-type. */
function CarbonPriceCard({
  price,
  onSaved,
  see,
  priceEvidenced,
  onEvidenceChange,
}: {
  price: CarbonPriceRecord;
  onSaved: (next: CarbonPriceRecord) => void;
  see: ReturnType<typeof workspaceSEE> | null;
  priceEvidenced: boolean;
  onEvidenceChange: () => void;
}) {
  const t = useT();
  const { workspace, refresh } = useWorkspace();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<CarbonPriceRecord>(price);
  const save = useSaveState();

  React.useEffect(() => {
    if (!editing) setDraft(price);
  }, [price, editing]);

  /* The card holds EDIT while the button plays saving → saved, and settles
     back only once the tick has been seen. Closing on the click would delete
     the button at the exact moment it has something to report. */
  const closingRef = React.useRef(false);
  React.useEffect(() => {
    if (save.state === "saved") closingRef.current = true;
    else if (save.state === "idle" && closingRef.current) {
      closingRef.current = false;
      setEditing(false);
    }
  }, [save.state]);

  const set = (p: Partial<CarbonPriceRecord>) => setDraft((d) => ({ ...d, ...p }));

  const commit = () =>
    save.run(() => {
      onSaved(saveCarbonPrice(draft));
      refresh();
    });

  const shown = editing ? draft : price;

  return (
    <SectionCard
      id="carbon-price"
      title={t("Carbon price paid in the country of origin")}
      blurb={t("Annual. Zero is a valid and complete answer — record it rather than leaving it blank.")}
      actions={
        editing ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)} disabled={save.state !== "idle"}>
              {t("Cancel")}
            </Button>
            <SaveButton state={save.state} onClick={commit} icon={<Check size={13} strokeWidth={2} />} idleLabel={t("Save")} savingLabel={t("Saving…")} savedLabel={t("Saved")} />
          </>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            <Pencil size={13} strokeWidth={1.5} /> {t("Edit")}
          </Button>
        )
      }
    >
      {/* NO CURRENCY PICKER. The claim is read off a receipt issued in one
          currency, and the record already carries it — offering a dropdown
          beside the amount invites relabelling 200 THB as 200 EUR without
          touching the figure, which is a forty-fold change to a claim against
          a liability. The unit is stated on the field instead. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("Amount per tCO₂e ({currency})", { currency: shown.currency })}>
          <input
            className={inputClass}
            inputMode="decimal"
            disabled={!editing}
            value={shown.amountPerTonne || ""}
            onChange={(e) => set({ amountPerTonne: numeric(e.target.value) })}
            placeholder="200"
          />
        </Field>
        <Field label={t("Instrument")} hint={t(CARBON_PRICE_INSTRUMENT_HINT[shown.instrument])}>
          <Select
            value={shown.instrument}
            onChange={(v) => set({ instrument: v as CarbonPriceInstrument })}
            disabled={!editing}
            options={CARBON_PRICE_INSTRUMENTS.map((i) => ({ value: i, label: t(CARBON_PRICE_INSTRUMENT_LABEL[i]), hint: t(CARBON_PRICE_INSTRUMENT_HINT[i]) }))}
          />
        </Field>
        <Field
          label={t("Share of emissions covered")}
          hint={t("What fraction of this good's total specific embedded emissions this instrument actually applies to. If unsure, 1.0/100% is rarely correct — check your documentation rather than guessing.")}
        >
          <input
            className={inputClass}
            inputMode="decimal"
            disabled={!editing}
            value={shown.shareOfEmissionsCovered ?? ""}
            onChange={(e) => set({ shareOfEmissionsCovered: numeric(e.target.value) })}
            placeholder="40"
          />
        </Field>
        <Field label={t("Rebates or free allocation")} hint={t("Any offset received against the above.")}>
          <input className={inputClass} disabled={!editing} value={shown.rebates ?? ""} onChange={(e) => set({ rebates: e.target.value })} />
        </Field>
      </div>

      {price.amountPerTonne > 0 && see?.computable && (
        <p className="mt-4 text-[13px] text-black/55">
          Claimed deduction across the year:{" "}
          <strong className="font-mono">
            {fmt(claimedDeduction(price, see.seeChargeable * see.production.tonnes).claimed, 0)} {price.currency}
          </strong>{" "}
          — shown as context, never subtracted from anything.
        </p>
      )}

      <div className="mt-4 space-y-3">
        <Note tone="warn">{CARBON_PRICE_CLAIMED_NOTE}</Note>
        {price.instrument === "excise_embedded" && (
          <Note>
            Thailand&apos;s {THAILAND_EXCISE_CARBON_PRICE.value} THB/tCO₂e sits inside {THAILAND_EXCISE_CARBON_PRICE.source.toLowerCase()}. If you burn
            diesel or fuel oil, the honest answer to &ldquo;what carbon price did you pay?&rdquo; is no longer zero — attach the excise receipt below and
            let your verifier see the claim.
          </Note>
        )}
        {price.amountPerTonne > 0 && !price.evidenceItemId && !priceEvidenced && (
          <Note tone="err">{t("An amount above zero is claimed with no payment evidence attached. Attach the excise or tax receipt below.")}</Note>
        )}
        {price.amountPerTonne > 0 && price.shareOfEmissionsCovered == null && (
          <Note tone="err">
            {t("Zero is not a safe default here — enter the real share of this good's emissions the instrument actually covers before this can be submitted.")}
          </Note>
        )}
      </div>

      {/* The receipt attaches beside the claim it evidences. `openable`
          because what a reader wants from a receipt is to READ it — a review
          badge belongs to the extraction workflow, not to the document. */}
      <div className="mt-5 border-t border-black/[0.06] pt-5">
        <SectionEvidence
          workspaceId={workspace.id}
          keys={[CARBON_PRICE_KEY]}
          openable
          emptyLabel={t("No receipt attached. A claimed deduction with nothing behind it is the first thing a verifier removes.")}
          onChange={onEvidenceChange}
        />
      </div>
    </SectionCard>
  );
}

/* ── What the report will contain ───────────────────────────────
   The document's own table of contents, with a state against each line. See
   lib/report-contents.ts for why this is not a second readiness screen. */
function ReportContentsCard({ parts }: { parts: ContentPart[] }) {
  const t = useT();
  const tally = contentTally(parts);
  const total = Object.values(tally).reduce((a, b) => a + b, 0);

  return (
    <SectionCard
      title={t("What the report will contain")}
      helpTitle={t("Why this is not the same as readiness")}
      help={
        <>
          <p>{t("Readiness is per TAB, because a tab is somebody’s job. The report is organised by SECTION, and the two do not line up.")}</p>
          <p className="mt-2">{t("Section 3.4 is assembled out of three tabs; one thin tab leaves four sections short. This says which sections.")}</p>
          <p className="mt-2">{t("It changes nothing about the document. It is a view of what is already in it.")}</p>
        </>
      }
      blurb={t("Section by section, in the order it prints. Nothing here is a gate — it is so you can see what a verifier will and will not find.")}
      actions={
        <span className="text-[12px] text-black/45">
          {tally.ready} of {total} ready
        </span>
      }
    >
      <div className="space-y-5">
        {parts.map((part) => (
          <div key={part.number}>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="font-mono text-[11px] text-black/35">{t("Part {number}", { number: part.number })}</span>
              <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/50">{t(part.title)}</span>
            </div>
            <ul className="divide-y divide-black/[0.05] overflow-hidden rounded-xl border border-black/[0.07]">
              {part.items.map((item) => (
                <li key={item.number} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-[11px] tabular-nums text-black/35">{item.number}</span>
                      <Link href={item.deepLink} className="text-[13px] text-black/80 hover:underline">
                        {t(item.title)}
                      </Link>
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-black/45">{t(item.detail)}</span>
                  </span>
                  <span className="flex-none">
                    <Chip tone={CONTENT_STATE_TONE[item.state]}>{t(CONTENT_STATE_LABEL[item.state])}</Chip>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

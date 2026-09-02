"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   THE PRECURSOR SUPPLIER'S FORM — what opens from a /p/<token> link

   Different question from the workspace link (/w/<token>). That one asks
   "what did you burn in March". This one asks a precursor producer for the
   whole-period answer a verifier tests on a complex good: who and where they
   are, their SEE (direct + indirect, for the period they name), and the
   verification evidence behind it — as TWO separate things, not one.

   THE PDF IS NOT THE VALIDATION. The uploaded report is evidence a human can
   open; the four-check gate (`validateVerificationReport`) reads structured
   fields the supplier types below it — the verifier's accreditation expiry,
   the report's own issue date, the sectoral scope — never the file's
   contents. Pretending to read a PDF here would be a worse lie than asking
   for the two dates directly.

   ONE FORM, ONE ANSWER. This page asks this installation about ITS OWN
   figure and nothing else. It used to end with "Add an upstream precursor of
   your own", which let a supplier build out the tier above themselves from
   here — bidirectional, and correct in principle, but it turned a form with
   one question into an open-ended chain editor for somebody who was handed a
   link and asked for one number. Suppliers arriving at it read it as work
   they had been given, and the rows it produced arrived on the exporter's
   side unidentified and unasked for. Extending the chain is the exporter's
   move, from Add precursor on the chain itself; `descendantsOf` below still
   carries any tier that already exists through submission, so nothing
   already on file is stranded by its removal.

   NOTHING IS TRANSMITTED. Same honesty as /w/<token> — see that file's
   header. Whoever opens this on their own machine writes to their own
   browser only.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useParams } from "next/navigation";
import { FileCheck2, MapPin, Paperclip, ShieldCheck, Sparkles } from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { Button, EnglishWhyTip, Field, NumberInput, inputClass, cn } from "@/components/ui";
import { DatePicker, Select } from "@/components/controls";
import { toast, Toaster } from "@/components/toast";
import { SectionCard } from "@/components/workspace/chrome";
import { coordinateError } from "@/lib/installations";
import { getOrgIdentity } from "@/lib/org";
import { COUNTRIES } from "@/lib/config";
import { SectionEvidence } from "@/components/workspace/evidence-panel";
import { annualEvidence, type RequiredKey } from "@/lib/workspace-evidence";
import { resolvePrecursorLink, type PrecursorLinkRequest } from "@/lib/precursor-link";
import { useT } from "@/lib/i18n";
import {
  descendantsOf,
  getSupplier,
  markLinkOpened,
  markLinkSubmitted,
  saveSupplier,
  precursorSubmissionGaps,
  type PrecursorSupplier,
} from "@/lib/precursor-suppliers";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[rgba(245,244,240,0.85)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-6">
          <CertraceLogo className="h-[18px] w-auto" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
      <Toaster />
    </div>
  );
}

function Invalid() {
  const t = useT();
  return (
    <Shell>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-black/40 shadow-sm">
        <ShieldCheck size={22} strokeWidth={1.5} />
      </span>
      <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{t("This link looks invalid or expired.")}</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-black/50">
        {t("Precursor links are personal to one supplier in one supply chain. Ask whoever asked you for this data to resend it.")}
      </p>
    </Shell>
  );
}

export default function PrecursorSupplierPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token);
  const [req, setReq] = React.useState<PrecursorLinkRequest | null | undefined>(undefined);

  React.useEffect(() => {
    const resolved = resolvePrecursorLink(token);
    setReq(resolved);
    if (resolved) markLinkOpened(resolved.workspace.id, resolved.node.id);
  }, [token]);

  if (req === undefined) return null;
  if (req === null) return <Invalid />;
  /* WHO IS ASKING. For a precursor it is the installation the good is made at
     — the plant this supplier ships INTO. For the row at the top of the chain
     that installation is the RECIPIENT, so naming it here would head the page
     "data request from" the very site reading it; the asker there is the
     exporter's own company. */
  const asker = req.node.isChainRoot ? getOrgIdentity().name : req.workspace.installationName;
  return <Form workspaceId={req.workspace.id} nodeId={req.node.id} exporterName={asker} />;
}

function Form({ workspaceId, nodeId, exporterName }: { workspaceId: string; nodeId: string; exporterName: string }) {
  const t = useT();
  const [draft, setDraft] = React.useState<PrecursorSupplier | null>(null);
  /* Bumped by the Documents block on every attach/remove, so the effect below
     re-reads which file is bound to this row. */
  const [evidenceVersion, setEvidenceVersion] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const reload = React.useCallback(() => {
    setDraft(getSupplier(workspaceId, nodeId));
  }, [workspaceId, nodeId]);

  React.useEffect(reload, [reload]);

  /* THE ATTACHED FILE HAS TO REACH THE ROW, or the gate below never sees it.
     `precursorSubmissionGaps` asks for `verificationReportFileId`, which is a
     pointer into the evidence store — attaching a PDF writes the evidence
     item but nothing on the PrecursorSupplier, so a supplier who attached
     their report still faced a permanently disabled Submit button. This is
     the same effect the exporter's own SupplierEditor runs, for the same
     reason: one store, one pointer, kept in step on both sides. */
  React.useEffect(() => {
    const items = annualEvidence(workspaceId).filter((i) => i.fieldKeys.includes(`precursor:${nodeId}`));
    const latest = items[0]?.id; // annualEvidence is already newest-first
    setDraft((d) => (d == null || d.verificationReportFileId === latest ? d : { ...d, verificationReportFileId: latest }));
  }, [workspaceId, nodeId, evidenceVersion]);

  if (!draft) return null;

  const set = (p: Partial<PrecursorSupplier>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const gaps = precursorSubmissionGaps(draft);
  const evidenceKeys: RequiredKey[] = [
    { key: `precursor:${nodeId}`, label: `${draft.precursorName || "Unnamed precursor"} — emissions figure` },
  ];

  const save = () => saveSupplier(draft);

  const submit = () => {
    // Belt and braces: the button is disabled while gaps remain, but this
    // refuses to run even if something manages to call it anyway — the same
    // fail-closed rule the missing-field check itself follows.
    if (precursorSubmissionGaps(draft).length > 0) return;
    const saved = saveSupplier({ ...draft, dataOrigin: draft.dataOrigin === "default_value" ? draft.dataOrigin : "supplier_verified" });
    markLinkSubmitted(workspaceId, nodeId);

    // Any upstream tier the supplier filled in themselves this session never
    // went through a real invite link (no smartLinkToken) — back-fill the
    // same sent/opened/submitted lifecycle the root just got, but only for
    // ones that are actually complete, and never for one the exporter has
    // since sent a REAL link to directly (that node now has its own
    // independent lifecycle; re-stamping it here would clobber it).
    const now = new Date().toISOString();
    descendantsOf(workspaceId, nodeId)
      .filter((n) => !n.smartLinkToken && precursorSubmissionGaps(n).length === 0)
      .forEach((n) =>
        saveSupplier({
          ...n,
          dataOrigin: n.dataOrigin === "default_value" ? n.dataOrigin : "supplier_verified",
          smartLinkSentAt: n.smartLinkSentAt ?? now,
          smartLinkOpenedAt: n.smartLinkOpenedAt ?? now,
          smartLinkSubmittedAt: now,
        }),
      );

    setDraft(saved);
    setSubmitted(true);
    toast({ message: "Submitted", detail: "The exporter will see this the next time they open the chain.", tone: "ok" });
  };

  if (submitted) {
    return (
      <Shell>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ecfdf5] text-[#047857] shadow-sm">
          <FileCheck2 size={22} strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{t("Submitted.")}</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-black/50">
          {exporterName} will see this data the next time they open their precursor chain. You can reopen this link any time before their filing deadline to correct it — a resubmission simply replaces this one.
        </p>
        <div className="mt-6 rounded-xl border border-black/[0.08] bg-white p-4 text-sm text-black/60">
          <p className="font-medium text-black/80">{t("Save your progress on this device?")}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed">
            {t("This is")} <strong>{t("not a real account")}</strong> {t("— no password, no server session, nothing sent anywhere. It only pre-fills this installation’s details the next time this SAME link is opened on this SAME device or browser.")}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={() => {
              try {
                const raw = window.localStorage.getItem("certrace:precursor-supplier-account");
                const list = raw ? (JSON.parse(raw) as { installationId: string; createdAt: string }[]) : [];
                const key = draft.installationUniqueId || draft.unlocode || draft.id;
                if (!list.some((r) => r.installationId === key)) list.push({ installationId: key, createdAt: new Date().toISOString() });
                window.localStorage.setItem("certrace:precursor-supplier-account", JSON.stringify(list));
                toast({ message: "Saved on this device", tone: "ok" });
              } catch {
                /* ignore */
              }
            }}
          >
            {t("Save on this device")}
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-[12px] uppercase tracking-[0.1em] text-black/40">Precursor data request from {exporterName}</p>
      {/* THE "?" IS ON THE HEADING, not tucked into the paragraph under it.
          "In English" is the one instruction on this page that costs the
          reader weeks if they miss it, and the reason it exists is a
          regulation citation nobody wants inline. Heading on the left,
          question mark hard right — the reader who has already started typing
          still passes it on the way down. */}
      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{t("Your emissions data for this supply chain")}</h1>
        <EnglishWhyTip className="mt-1 flex-none" />
      </div>
      {/* IN ENGLISH IS AN INSTRUCTION, not a note, so it does not read at the
          same weight as the sentence carrying it. Everything typed on this
          page is read by an EU declarant and an accredited verifier, and a
          plant name in Thai reaches them as a field they cannot check — which
          comes back weeks later as a question to the exporter about a form
          this supplier believes they finished. It is emphasised here and said
          again on the first card, because the reader who most needs it is the
          one who started typing before reading anything. */}
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-black/50">
        {exporterName} buys a precursor that includes something you produce. Give your installation&rsquo;s specific embedded emissions, and the
        accredited verification behind them — <strong className="font-medium text-black/80">{t("in English")}</strong>.
      </p>

      {/* mt-6 rather than nothing. The card used to sit flush against the
          paragraph above it, so the page's opening line read as the first
          section's own preamble instead of as the page's. Every section below
          is mt-5; this one is a step wider because it is the seam between the
          heading block and the form. */}
      <SectionCard
        className="mt-6"
        title={t("Product installation")}
        blurb={
          <>
            The plant this material was actually produced at, as a verifier would have to find it — named{" "}
            <strong className="font-medium text-black/70">{t("in English")}</strong>.
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Company")}>
            <input className={inputClass} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder={t("Chonburi Foundry")} />
          </Field>
          <Field label={t("Installation")} hint={t("Where it was actually produced.")}>
            <input className={inputClass} value={draft.installationName} onChange={(e) => set({ installationName: e.target.value })} placeholder={t("Chonburi Works No. 2")} />
          </Field>
          <Field label={t("Country")}>
            <Select value={draft.country} onChange={(v) => set({ country: v })} searchable options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} ariaLabel={t("Country")} />
          </Field>
          <Field label={t("Installation reference")} hint={t("This plant's own reference for itself.")}>
            <input className={inputClass} value={draft.installationUniqueId ?? ""} onChange={(e) => set({ installationUniqueId: e.target.value })} placeholder={t("TH-CHON-0042")} />
          </Field>
          <Field label={t("UN/LOCODE")}>
            <input className={cn(inputClass, "font-mono")} value={draft.unlocode ?? ""} onChange={(e) => set({ unlocode: e.target.value.toUpperCase() })} placeholder={t("THLCH")} />
          </Field>
          <Field label={t("Full address")}>
            <input className={inputClass} value={draft.fullAddress ?? ""} onChange={(e) => set({ fullAddress: e.target.value })} placeholder={t("88 Moo 4, Sriracha, Chonburi 20230")} />
          </Field>
          {/* TWO FIELDS, TWO LABELS. One "Coordinates" box holding two
              unlabelled numbers is a coin toss over which half is which, and
              a latitude typed into the longitude box is a plant in the wrong
              hemisphere that nothing downstream can catch. */}
          <Field label={t("Latitude")} hint={coordinateError(String(draft.latitude ?? ""), String(draft.longitude ?? "")) ?? undefined}>
            <NumberInput
              value={draft.latitude}
              min={-90}
              max={90}
              invalid={Boolean(coordinateError(String(draft.latitude ?? ""), String(draft.longitude ?? "")))}
              onChange={(v) => set({ latitude: v })}
              ariaLabel={t("Latitude")}
            />
          </Field>
          <Field label={t("Longitude")}>
            <NumberInput value={draft.longitude} min={-180} max={180} onChange={(v) => set({ longitude: v })} ariaLabel={t("Longitude")} />
          </Field>
        </div>

        {/* ── Precursor product ──────────────────────────────────
            TYPED, NOT PICKED. The catalogue picker in front of these three
            fields was the exporter's tool on the supplier's screen: it lists
            67 EU CBAM goods by their EU names, and a mill that knows exactly
            what it makes and what CN code it ships under had to go hunting
            for the catalogue's spelling of it first. What the exporter needs
            back is the name, the code and the route — so those are the three
            boxes. */}
        <div className="mt-4 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
          <span className="mb-3 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Precursor product")}</span>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("Product name")}>
              <input className={inputClass} value={draft.precursorName} onChange={(e) => set({ precursorName: e.target.value })} placeholder={t("Steel billet")} />
            </Field>
            <Field label={t("CN code")}>
              <input
                className={cn(inputClass, "font-mono")}
                value={draft.cnCode}
                onChange={(e) => set({ cnCode: e.target.value })}
                placeholder="7207 11 90"
              />
            </Field>
            <Field label={t("Production route")} hint={t("How you make it — tells the exporter which precursors should sit above you.")}>
              <input
                className={inputClass}
                value={draft.productionRoute}
                onChange={(e) => set({ productionRoute: e.target.value })}
                placeholder={t("Scrap-based EAF")}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <section className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <MapPin size={14} strokeWidth={1.5} className="text-black/35" />
          <span className="font-pixel text-[11px] uppercase tracking-[0.14em] text-black/50">{t("Specific embedded emissions")}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Direct")} hint={t("Your own CBAM communication figure.")}>
            <NumberInput value={draft.specificEmbeddedDirectTco2PerT} min={0} unit="tCO₂e/t" onChange={(v) => set({ specificEmbeddedDirectTco2PerT: v })} ariaLabel={t("Direct SEE")} />
          </Field>
          <Field label={t("Indirect")}>
            <NumberInput value={draft.specificEmbeddedIndirectTco2PerT} min={0} unit="tCO₂e/t" onChange={(v) => set({ specificEmbeddedIndirectTco2PerT: v })} ariaLabel={t("Indirect SEE")} />
          </Field>
          <Field label={t("Reporting period start")}>
            <DatePicker value={draft.reportingPeriodStart ?? ""} onChange={(iso) => set({ reportingPeriodStart: iso })} ariaLabel={t("Reporting period start")} />
          </Field>
          <Field label={t("Reporting period end")}>
            <DatePicker value={draft.reportingPeriodEnd ?? ""} onChange={(iso) => set({ reportingPeriodEnd: iso })} ariaLabel={t("Reporting period end")} />
          </Field>
          <Field
            label={t("Quantity — per-tonne ratio")}
            hint={t("The TOTAL you consumed to produce what you supply, including material that never reaches the finished good — offcuts, spillage, scrap, burn-off.")}
          >
            <NumberInput value={draft.qtyPerTonneOverride} min={0} unit="t/t" onChange={(v) => set({ qtyPerTonneOverride: v })} ariaLabel={t("Per-tonne ratio")} />
          </Field>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck size={14} strokeWidth={1.5} className="text-black/35" />
          <span className="font-pixel text-[11px] uppercase tracking-[0.14em] text-black/50">{t("Verification evidence")}</span>
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-black/45">
          {t("Two separate things: the report itself, attached in Documents below, and the facts it states, typed here. The facts are what get checked — Certrace does not read the PDF.")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Verifier name")}>
            <input className={inputClass} value={draft.verifierName ?? ""} onChange={(e) => set({ verifierName: e.target.value })} placeholder={t("SGS Thailand")} />
          </Field>
          <Field label={t("Accreditation number")}>
            <input
              className={inputClass}
              value={draft.verifierAccreditationNumber ?? ""}
              onChange={(e) => set({ verifierAccreditationNumber: e.target.value })}
              placeholder={t("TH-ACC-001")}
            />
          </Field>
          <Field label={t("Accreditation issuing country")}>
            <Select
              value={draft.verifierAccreditationIssuingCountry ?? ""}
              onChange={(v) => set({ verifierAccreditationIssuingCountry: v })}
              searchable
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
              ariaLabel={t("Accreditation issuing country")}
            />
          </Field>
          <Field label={t("Accreditation expiry date")}>
            <DatePicker value={draft.verifierAccreditationExpiryDate ?? ""} onChange={(iso) => set({ verifierAccreditationExpiryDate: iso })} ariaLabel={t("Accreditation expiry date")} />
          </Field>
          <Field label={t("Report issue date")}>
            <DatePicker value={draft.verificationReportIssueDate ?? ""} onChange={(iso) => set({ verificationReportIssueDate: iso })} ariaLabel={t("Report issue date")} />
          </Field>
          <Field label={t("Sectoral scope")} hint={t("e.g. Iron and steel.")}>
            <input
              className={inputClass}
              value={draft.verificationSectoralScope ?? ""}
              onChange={(e) => set({ verificationSectoralScope: e.target.value })}
              placeholder={t("Iron and steel")}
            />
          </Field>
          {/* The one field in this block that is not required, and
              deliberately: a verification report that does not lapse has no
              expiry date, and forcing one would put a made-up date on a
              compliance record. It is here — rather than exporter-only, as it
              was — because the supplier is the party holding the report. */}
          <Field label={t("Report expires")} optional hint={t("When this report itself needs renewing — leave blank if it does not lapse.")}>
            <DatePicker value={draft.verificationReportExpiresAt ?? ""} onChange={(iso) => set({ verificationReportExpiresAt: iso })} ariaLabel={t("Report expiry date")} />
          </Field>
        </div>
      </section>

      {/* ── Documents ────────────────────────────────────────────
          The SAME block, reading the SAME store, as the exporter's own Enter
          verified data screen — a dashed "attach a PDF" box on this side and
          a coverage-tracked Documents panel on theirs were two different
          answers to one question, and only one of them told you whether the
          figure had anything behind it yet. */}
      <section className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Paperclip size={14} strokeWidth={1.5} className="text-black/35" />
          <span className="font-pixel text-[11px] uppercase tracking-[0.14em] text-black/50">{t("Documents")}</span>
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-black/45">
          {t("The verification report, and anything else that stands behind this figure.")}
        </p>
        <SectionEvidence
          workspaceId={workspaceId}
          keys={evidenceKeys}
          emptyLabel={t("Nothing attached yet — this figure needs something behind it.")}
          openable
          onChange={() => setEvidenceVersion((v) => v + 1)}
        />
      </section>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-[12px] text-black/40 flex items-center gap-1.5">
          <Sparkles size={12} strokeWidth={1.5} /> {t("Nothing here is transmitted automatically — this browser only, until you submit.")}
        </p>
        {/* The wall of "13 things still needed" is gone — every field it
            named is marked required on the form itself. The COUNT survives as
            a tooltip on the wrapper (a disabled button fires no mouse events,
            so the title has to hang off something enabled), because a Submit
            that refuses with no explanation at all is a dead end. */}
        <span title={gaps.length > 0 ? `${gaps.length} required field${gaps.length === 1 ? "" : "s"} above still to fill in.` : undefined}>
          <Button
            disabled={busy || gaps.length > 0}
            onClick={() => {
              if (busy || gaps.length > 0) return;
              setBusy(true);
              save();
              submit();
              setBusy(false);
            }}
          >
            {t("Submit")}
          </Button>
        </span>
      </div>
    </Shell>
  );
}

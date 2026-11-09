"use client";

/* ════════════════════════════════════════════════════════════
   SUPPLIER EDITOR — one precursor tier's full form

   Moved out of the old Precursors tab (app/(portal)/workspaces/[id]/precursors)
   so the Supplier and Precursor Tree page's "Enter Verified Data" modal can
   reuse it exactly as-is — same fields, same autosave, same validation,
   same four-check gate (all already live in lib/precursor-suppliers.ts's
   `saveSupplier`, not reimplemented here). The old page and the new one are
   editing the SAME PrecursorSupplier rows; this is the one editor for them.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Link2Off, TriangleAlert } from "lucide-react";
import { AutoSaveBadge, EnglishWhyTip, Field, NumberInput, TagBadge, inputClass, useAutoSave, cn } from "@/components/ui";
import { DatePicker, Select } from "@/components/controls";
import { fmt } from "@/components/workspace/chrome";
import { annualEvidence } from "@/lib/workspace-evidence";
import { aggregatedGoodsCategory, COUNTRIES, PRODUCT_CATALOG, countryName, getCatalogProduct, isEuOrExempt, productType } from "@/lib/config";
import { coordinateError } from "@/lib/installations";
import { defaultValueForId } from "@/lib/default-values";
import {
  getSupplier,
  DATA_ORIGINS,
  DATA_ORIGIN_HINT,
  DATA_ORIGIN_LABEL,
  looksLikeScrap,
  PRECURSOR_ORIGINS,
  PRECURSOR_ORIGIN_LABEL,
  saveSupplier,
  setScrap,
  supplierPrecursorGaps,
  type DataOrigin,
  type PrecursorOrigin,
  type PrecursorSupplier,
  type SupplierNode,
} from "@/lib/precursor-suppliers";
import { PRODUCTION_ROUTES } from "@/lib/workspace";
import { recordVersion } from "@/lib/precursor-versions";
import { SupplierPhoneField } from "@/components/workspace/supplier-form";
import { supplierEmailError } from "@/lib/supplier-companies";
import { useT } from "@/lib/i18n";

/* Two views onto one catalogue. Selecting from either fills both, which is
   what makes the pair impossible to contradict. */
const PRODUCT_OPTIONS = PRODUCT_CATALOG.map((p) => ({ value: p.id, label: p.name, hint: `CN ${p.cnCode} · ${p.group}` }));
const CN_OPTIONS = PRODUCT_CATALOG.map((p) => ({ value: p.id, label: p.cnCode, hint: p.name }));

/* Local draft, autosaved. The caller is told to rebuild only when something
   that changes the SHAPE of the chain changes — not on every character. */
export function SupplierEditor({
  node,
  onSaved,
  evidenceVersion = 0,
  showGaps = true,
  onVersionRecorded,
}: {
  node: SupplierNode;
  onSaved: () => void;
  /** Bumped by a caller that renders its own Documents block for this row —
      the Enter verified data dialog does. Without it the effect below has
      nothing to re-run on, so a report attached a moment ago would not reach
      `verificationReportFileId` until the row was reopened. */
  evidenceVersion?: number;
  /** false where the caller shows the outstanding list itself, above the
      form — Enter verified data does, in its completeness meter, and against
      the WIDER submission scope. Two lists of what is missing, counted two
      different ways, on one screen, is worse than either alone. */
  showGaps?: boolean;
  /** told after each autosave that actually changed something, so a caller
      showing the version history can re-read it. */
  onVersionRecorded?: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = React.useState<PrecursorSupplier>(node);

  // Resync when the row identity changes — reopening a different node reuses
  // this component instance.
  React.useEffect(() => setDraft(node), [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* The verification report lives in the SAME "Documents" section every other
     tier's evidence already goes through (SectionEvidence, keyed
     `precursor:${id}`) — not a second upload control duplicating it here.
     This just watches that store and keeps `verificationReportFileId`
     pointed at whatever is attached there, so `validateVerificationReport`
     has something to check against without the editor needing its own file
     input. */
  React.useEffect(() => {
    const items = annualEvidence(node.workspaceId).filter((i) => i.fieldKeys.includes(`precursor:${node.id}`));
    const latest = items[0]?.id; // annualEvidence is already newest-first
    setDraft((d) => (d.verificationReportFileId === latest ? d : { ...d, verificationReportFileId: latest }));
  }, [node.workspaceId, node.id, node.dataOrigin, evidenceVersion]);

  const autosave = useAutoSave(draft, (d) => {
    /* THE LINK LIFECYCLE IS NOT THIS FORM'S TO WRITE. `draft` is a snapshot
       taken when the row was opened; Send stamps the token and the sent/
       last-sent timestamps on the STORED row while that snapshot is still on
       screen. Saving the snapshot wholesale therefore un-sent the link the
       moment anything else on the form autosaved — the button flipped back
       to "Send link", the once-a-day throttle reset, and the token the
       supplier had just been handed stopped existing. Those five fields are
       always taken from the store instead. */
    const current = getSupplier(d.workspaceId, d.id);
    const saved = saveSupplier({
      ...d,
      smartLinkToken: current?.smartLinkToken ?? d.smartLinkToken,
      smartLinkSentAt: current?.smartLinkSentAt ?? d.smartLinkSentAt,
      smartLinkLastSentAt: current?.smartLinkLastSentAt ?? d.smartLinkLastSentAt,
      smartLinkOpenedAt: current?.smartLinkOpenedAt ?? d.smartLinkOpenedAt,
      smartLinkSubmittedAt: current?.smartLinkSubmittedAt ?? d.smartLinkSubmittedAt,
    });
    /* THE SAVE IS WHAT MAKES THE VERSION, not the keystroke. recordVersion
       compares against the last snapshot and returns null when nothing
       actually moved, so a timer that fires on an untouched form does not
       fill the history with identical entries. */
    if (recordVersion(saved)) onVersionRecorded?.();
    // The store may have rewritten the row (EU-exempt lock, the direct/
    // indirect sync, or the verification fallback) — reflect that back so
    // the fields on screen never show something that was silently overruled.
    setDraft(saved);
    onSaved();
  });

  const set = (p: Partial<PrecursorSupplier>) => setDraft((d) => ({ ...d, ...p }));

  const locked = Boolean(draft.catalogProductId);
  const catalogProduct = draft.catalogProductId ? getCatalogProduct(draft.catalogProductId) : undefined;
  const isPurchased = draft.origin === "purchased";
  const isExempt = isPurchased && isEuOrExempt(draft.country);
  const derivedCategory = catalogProduct ? aggregatedGoodsCategory(catalogProduct) : null;
  const showSectorParams = derivedCategory === "Iron or steel products";
  const supplierGaps = supplierPrecursorGaps(draft);
  // Only once something has been typed — an empty box on a form that
  // autosaves is not yet a mistake, and marking it red on arrival is how a
  // screen teaches people to ignore red.
  const contactEmailError = (draft.contactEmail ?? "").trim() ? supplierEmailError(draft.contactEmail ?? "") : null;

  const pickFromCatalog = (id: string) => {
    const p = getCatalogProduct(id);
    if (!p) return;
    set({ catalogProductId: id, precursorName: p.name, cnCode: p.cnCode });
  };

  const unlink = () => set({ catalogProductId: undefined });

  /* ── Default values (IR (EU) 2025/2621) ───────────────────────
     The exporter should ask the upstream producer for actual data first. When
     they cannot get it — a trader two steps removed, a mill that will not
     answer — the regulation allows the published default for the product and
     country instead, at a deliberate penalty: defaults are set conservatively,
     so a default is always worse than a real figure.

     Choosing it here FILLS the SEE and locks it, rather than asking the
     exporter to look the number up and retype it. A typed "default" is a
     number nobody can trace; a filled one carries its source into the report
     and into the verifier pack. */
  const defaultForDraft = draft.catalogProductId ? defaultValueForId(draft.catalogProductId) : null;
  const usingDefault = draft.dataOrigin === "default_value";

  const setDataOrigin = (next: DataOrigin) => {
    if (next !== "default_value") {
      set({ dataOrigin: next });
      return;
    }
    // Switching TO a default replaces the figure and clears the direct/
    // indirect split — a published default is a single total, not a
    // breakdown, and a stale split left in place would otherwise silently
    // override the total the moment this saves (see saveSupplier).
    set({
      dataOrigin: next,
      seeTco2ePerT: defaultForDraft ? defaultForDraft.seeTotal : draft.seeTco2ePerT,
      specificEmbeddedDirectTco2PerT: null,
      specificEmbeddedIndirectTco2PerT: null,
    });
  };

  const toggleScrap = (isScrap: boolean) => {
    // Through the store helper, so the "un-ticking clears the 0" rule lives in
    // one place and no screen can reimplement it differently.
    const saved = setScrap(draft, isScrap);
    setDraft(saved);
    onSaved();
  };

  /* ── Precursor product ────────────────────────────────────────
     Product ↔ CN, locked as a pair, plus the route. Held in a variable
     because it NESTS INSIDE Product installation on a purchased row — which
     is where the supplier's own link puts it — and stands alone on an
     own-installation row, where there is no third-party plant to nest it in.
     One definition either way, so the two branches cannot drift.

     The catalogue picker stays. The supplier's link asks for these three as
     free text on purpose (see that page's own note); on this side the picker
     is what sets `catalogProductId`, and the default-value library, the
     aggregated category and the sector parameters are all read off it. The
     free-text box underneath is the same answer the supplier gives, so a row
     filled in on either side still lands in the same two fields. */
  const precursorProductBlock = (
    <div className="mt-4 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Precursor product")}</span>
        {locked && (
          <button
            type="button"
            onClick={unlink}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
          >
            <Link2Off size={12} strokeWidth={1.5} /> {t("Enter it by hand instead")}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Product name")} hint={locked ? "From the CBAM catalogue — locked to the CN code beside it." : "Search the catalogue, or type it if it is not listed."}>
          {locked ? (
            <div className={cn(inputClass, "flex items-center justify-between gap-2 bg-black/[0.02]")}>
              <span className="truncate text-black/70">{draft.precursorName}</span>
              {catalogProduct && <TagBadge tone="info">{productType(catalogProduct)}</TagBadge>}
            </div>
          ) : (
            <>
              <Select
                value=""
                onChange={pickFromCatalog}
                options={PRODUCT_OPTIONS}
                searchable
                searchPlaceholder={t("Search 67 CBAM goods by name…")}
                placeholder={t("Pick from the CBAM catalogue")}
                ariaLabel={t("Product name")}
              />
              <input
                className={cn(inputClass, "mt-2")}
                value={draft.precursorName}
                onChange={(e) => set({ precursorName: e.target.value })}
                placeholder={t("…or type a name the catalogue does not carry")}
              />
            </>
          )}
        </Field>

        <Field label={t("CN code")} hint={locked ? "From the CBAM catalogue — locked to the product beside it." : "Pick a CN code and the product name fills in."}>
          {locked ? (
            <div className={cn(inputClass, "bg-black/[0.02] font-mono text-black/70")}>{draft.cnCode}</div>
          ) : (
            <>
              <Select
                value=""
                onChange={pickFromCatalog}
                options={CN_OPTIONS}
                searchable
                searchPlaceholder={t("Search by CN code — 7207…")}
                placeholder={t("Pick a CN code")}
                ariaLabel={t("CN code")}
              />
              <input
                className={cn(inputClass, "mt-2 font-mono")}
                value={draft.cnCode}
                onChange={(e) => set({ cnCode: e.target.value })}
                placeholder={t("…or type it — 7207 11 90")}
              />
            </>
          )}
        </Field>

        <Field label={t("Production route")} hint={t("How it is made — it tells a verifier which precursors should sit above this tier.")}>
          <Select
            value={draft.productionRoute}
            onChange={(v) => set({ productionRoute: v })}
            placeholder={t("Route, where known")}
            options={PRODUCTION_ROUTES.map((r) => ({ value: r.label, label: t(r.label), hint: `${t(r.standardName)} — ${t(r.hint)}` }))}
            searchable
            ariaLabel={t("Production route")}
          />
        </Field>
      </div>
    </div>
  );

  return (
    <div className="border-b border-black/[0.05] bg-[#faf9f7] p-4" style={{ paddingLeft: `${(node.depth - 1) * 20 + 16}px` }}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* "Tier 3" names this row's position in a chain the reader is not
            looking at from inside this dialog. What they ARE looking at is
            the form the supplier would otherwise fill in on their own link —
            the same fields, the same rules — so that is what it is called.

            IT IS LITERALLY THE SAME FORM, and laid out to look like it. The
            sections below follow app/p/[token] block for block — Product
            installation (with Precursor product inside it), Specific
            embedded emissions, Verification evidence — because the two sides
            edit ONE row: the exporter fills what they know and sends the
            link, the supplier opens it already carrying those answers,
            corrects them and sends it back, and the exporter sees the
            corrected row here. Two different layouts over one record made
            that round trip read as two unrelated forms. */}
        {/* IT IS THE SUPPLIER'S FORM, so it carries the supplier's own
            instruction. Everything typed into these boxes reaches an EU
            verifier exactly as typed, whether the supplier filled it in on
            their link or the exporter filled it in here — so the rule is
            attached to the label rather than left on the other screen. */}
        <span className="flex items-center gap-1.5">
          <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">{t("Supplier form")}</span>
          <span className="text-[11px] normal-case tracking-normal text-black/45">
            {t("· fill in")} <strong className="font-medium text-black/70">{t("English")}</strong>
          </span>
          <EnglishWhyTip />
        </span>
        <AutoSaveBadge status={autosave.status} savedAt={autosave.savedAt} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Where was this precursor made?")}>
          <Select
            value={draft.origin}
            onChange={(v) => set({ origin: v as PrecursorOrigin })}
            options={PRECURSOR_ORIGINS.map((o) => ({ value: o, label: PRECURSOR_ORIGIN_LABEL[o] }))}
            ariaLabel={t("Precursor origin")}
          />
        </Field>
      </div>

      {isPurchased ? (
        <>
          {/* ── Product installation ──────────────────────────────────
              The supplier link's opening block, field for field and label
              for label: Company · Installation · Country · Installation
              reference · UN/LOCODE · Full address · Latitude · Longitude,
              with Precursor product nested inside it. These used to be split
              across a loose three-column grid and a separately-titled
              "Producing installation" box, which is the same eight answers
              in two places the supplier's own screen shows as one. */}
          <div className="mt-4 rounded-xl border border-black/[0.07] bg-white p-4">
            <span className="mb-3 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Product installation")}</span>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Company")} hint={t("The company you buy from.")}>
                <input className={inputClass} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder={t("Chonburi Foundry")} />
              </Field>
              <Field label={t("Installation")} hint={t("Where it was actually produced. A trader's name is not an installation.")}>
                <input
                  className={inputClass}
                  value={draft.installationName}
                  onChange={(e) => set({ installationName: e.target.value })}
                  placeholder={t("Chonburi Works No. 2")}
                />
              </Field>
              <Field label={t("Country")}>
                <Select
                  value={draft.country}
                  onChange={(v) => set({ country: v })}
                  searchable
                  options={COUNTRIES.map((c) => ({ value: c.code, label: c.name, hint: c.code }))}
                  ariaLabel={t("Country")}
                />
              </Field>
              {/* An EU/exempt row is not asked to identify the plant to a
                  verifier — nothing is verified against it. Same rule as
                  before; it just no longer hides a whole separately-titled
                  box, because these now sit in the block above it. */}
              {!isExempt && (
                <>
                  <Field label={t("Installation reference")} hint={t("The producing plant's own reference for itself.")}>
                    <input className={inputClass} value={draft.installationUniqueId ?? ""} onChange={(e) => set({ installationUniqueId: e.target.value })} placeholder={t("TH-CHON-0042")} />
                  </Field>
                  <Field label={t("UN/LOCODE")}>
                    <input
                      className={cn(inputClass, "font-mono")}
                      value={draft.unlocode ?? ""}
                      onChange={(e) => set({ unlocode: e.target.value.toUpperCase() })}
                      placeholder={t("THLCH")}
                    />
                  </Field>
                  <Field label={t("Full address")} hint={t("In English.")}>
                    <input className={inputClass} value={draft.fullAddress ?? ""} onChange={(e) => set({ fullAddress: e.target.value })} placeholder={t("88 Moo 4, Sriracha, Chonburi 20230")} />
                  </Field>
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
                </>
              )}
            </div>

            {precursorProductBlock}
          </div>

          {/* ── Who to chase ──────────────────────────────────────────
              The same three facts the Add precursor dialog collected, and
              the same three a supplier record carries — editable here
              because the email is what the Smart Link is sent to, and a
              wrong one has to be fixable from the screen that discovers it
              rather than from a different page. The telephone is the
              supplier form's own picked control, not a text box. */}
          <div className="mt-4 rounded-xl border border-black/[0.07] bg-white p-4">
            <span className="mb-3 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Who fills this in")}</span>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field label={t("Contact person")} hint={t("The named person who answers for these figures. A department is not an answer.")}>
                <input
                  className={inputClass}
                  value={draft.contactName ?? ""}
                  onChange={(e) => set({ contactName: e.target.value })}
                  placeholder={t("Somchai Prasert")}
                />
              </Field>
              <Field label={t("Email")} hint={t("Where this precursor's own link is sent.")}>
                <input
                  className={cn(inputClass, contactEmailError && "border-[#dc2626]")}
                  type="email"
                  value={draft.contactEmail ?? ""}
                  onChange={(e) => set({ contactEmail: e.target.value })}
                  placeholder={t("somchai@gjsteel.co.th")}
                  aria-invalid={Boolean(contactEmailError)}
                />
                {contactEmailError && <span className="mt-1.5 block text-[11.5px] text-[#dc2626]">{contactEmailError}</span>}
              </Field>
              {/* Not a <Field>: that wraps its children in a <label>, and a
                  label holding two controls forwards every click to the
                  first one — tapping the number would open the code menu. */}
              <div className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Telephone")}</span>
                <SupplierPhoneField value={draft.contactPhone ?? ""} country={draft.country} onChange={(v) => set({ contactPhone: v })} />
              </div>
            </div>
          </div>

          {isExempt && (
            <p className="mt-3 rounded-xl border border-[rgba(5,150,105,0.2)] bg-[#ecfdf5] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#047857]">
              {countryName(draft.country)} is in the EU or an exempted territory (CH/NO/IS/LI). No CBAM liability arises from this precursor — SEE
              is locked at 0 and no verification report is required.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t("Source production process")} hint={t("Which of this installation's own processes made it — e.g. the sinter line, not a supplier.")}>
              <input
                className={inputClass}
                value={draft.sourceProcessId ?? ""}
                onChange={(e) => set({ sourceProcessId: e.target.value })}
                placeholder={t("Sinter line 1")}
              />
            </Field>
          </div>
          {/* Own-installation rows have no Product installation block to nest
              this inside — nobody else's plant is being identified — so it
              stands on its own, still asking the same three things. */}
          {precursorProductBlock}
        </>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label={t("Data origin")} hint={t(DATA_ORIGIN_HINT[draft.dataOrigin])}>
          <Select
            value={draft.dataOrigin}
            onChange={(v) => setDataOrigin(v as DataOrigin)}
            options={DATA_ORIGINS.map((o) => ({ value: o, label: t(DATA_ORIGIN_LABEL[o]), hint: DATA_ORIGIN_HINT[o] }))}
            ariaLabel={t("Data origin")}
          />
        </Field>
      </div>

      {/* Specific embedded emissions — direct and indirect, kept separate:
          Annex II asks for both, not just their sum, and keeping them apart
          is what lets a verifier see which half of the figure carries which
          kind of evidence. */}
      <div className="mt-4 rounded-xl border border-black/[0.07] bg-white p-4">
        <span className="mb-3 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Specific embedded emissions")}</span>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Direct")} hint={draft.isScrap ? "Forced to 0 — scrap carries no embedded emissions." : "From this supplier's own CBAM communication."}>
            <NumberInput
              value={draft.isScrap ? 0 : draft.specificEmbeddedDirectTco2PerT}
              min={0}
              unit="tCO₂e/t"
              disabled={draft.isScrap || usingDefault || isExempt}
              onChange={(v) => set({ specificEmbeddedDirectTco2PerT: v ?? null })}
              ariaLabel={t("Specific embedded direct emissions")}
            />
          </Field>
          <Field label={t("Indirect")} hint={t("Electricity embedded in the precursor.")}>
            <NumberInput
              value={draft.isScrap ? 0 : draft.specificEmbeddedIndirectTco2PerT}
              min={0}
              unit="tCO₂e/t"
              disabled={draft.isScrap || usingDefault || isExempt}
              onChange={(v) => set({ specificEmbeddedIndirectTco2PerT: v ?? null })}
              ariaLabel={t("Specific embedded indirect emissions")}
            />
          </Field>
          {/* THE PERIOD AND THE RATIO BELONG TO THE FIGURE. Both used to sit
              elsewhere — the period inside the producing-installation box,
              the ratio in a loose grid two sections down — while the
              supplier's own link asks for all four here, in this order. They
              qualify the number above them: over what year it was measured,
              and how much of it goes into a tonne of the parent. */}
          {isPurchased && !draft.isScrap && !isExempt && (
            <>
              <Field label={t("Reporting period start")} hint={t("Of the producing installation's own report.")}>
                <DatePicker value={draft.reportingPeriodStart ?? ""} onChange={(iso) => set({ reportingPeriodStart: iso })} ariaLabel={t("Reporting period start")} />
              </Field>
              <Field label={t("Reporting period end")}>
                <DatePicker value={draft.reportingPeriodEnd ?? ""} onChange={(iso) => set({ reportingPeriodEnd: iso })} ariaLabel={t("Reporting period end")} />
              </Field>
            </>
          )}
          <Field
            label={t("Quantity — per-tonne ratio")}
            hint={t("Used only when no monthly quantities are recorded. The TOTAL consumed to produce the output, including material that never reaches the finished good — offcuts, spillage, scrap, burn-off. Cut 20% away and you consumed 100 t to ship 80 t; record 100.")}
          >
            <NumberInput
              value={draft.qtyPerTonneOverride}
              min={0}
              unit="t/t"
              onChange={(v) => set({ qtyPerTonneOverride: v })}
              ariaLabel={t("Per-tonne ratio")}
            />
          </Field>
        </div>
        {/* The total belongs directly under the two halves it adds up — the
            period note reads after it, as a condition on the figure rather
            than as an interruption between the figure and its sum. */}
        <p className="mt-3 text-[12px] text-black/45">
          {t("Total:")} <span className="font-mono tabular-nums text-black/70">{fmt(draft.seeTco2ePerT ?? 0, 4)} tCO₂e/t</span>
          {usingDefault &&
            (defaultForDraft
              ? ` — from the published default for this category, ${defaultForDraft.source}. It cannot be edited while the origin is "default value".`
              : " — no published default is available for this product yet. Pick the product from the catalogue above, or ask the supplier for actual data.")}
        </p>
        {isPurchased && !draft.isScrap && !isExempt && (
          <p className="mt-2 text-[11.5px] leading-relaxed text-black/45">
            {t("A verification report is attached in Documents, below. Actual data from a precursor made elsewhere counts only if a report from an accredited verifier covers this period — attach it there for the four-check gate under “Data origin” to pass.")}
          </p>
        )}
        {draft.dataOrigin === "supplier_verified" && draft.verificationChecks && draft.verificationChecks.failedReasons.length > 0 && (
          <p className="mt-2 flex items-start gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] leading-relaxed text-[#991b1b]">
            <TriangleAlert size={13} strokeWidth={1.5} className="mt-0.5 flex-none" />
            <span>
              This claimed a verified figure but the checks did not pass, so it has been recorded as a default value instead:{" "}
              {draft.verificationChecks.failedReasons.join(" ")}
            </span>
          </p>
        )}
      </div>

      {showSectorParams && (
        <div className="mt-4 rounded-xl border border-black/[0.07] bg-white p-4">
          <span className="mb-3 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Iron or steel products — sector parameters")}</span>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label={t("Main reducing agent")} optional hint={t("Used in this precursor's own production, if known.")}>
              <input className={inputClass} value={draft.reducingAgent ?? ""} onChange={(e) => set({ reducingAgent: e.target.value })} placeholder={t("Coke")} />
            </Field>
            <Field label={t("Mn")} optional>
              <NumberInput value={draft.mnPct} min={0} max={100} unit="%" onChange={(v) => set({ mnPct: v })} ariaLabel={t("Manganese mass percent")} />
            </Field>
            <Field label={t("Cr")} optional>
              <NumberInput value={draft.crPct} min={0} max={100} unit="%" onChange={(v) => set({ crPct: v })} ariaLabel={t("Chromium mass percent")} />
            </Field>
            <Field label={t("Ni")} optional>
              <NumberInput value={draft.niPct} min={0} max={100} unit="%" onChange={(v) => set({ niPct: v })} ariaLabel={t("Nickel mass percent")} />
            </Field>
            <Field label={t("Other alloying elements")} optional>
              <NumberInput value={draft.otherAlloyingPct} min={0} max={100} unit="%" onChange={(v) => set({ otherAlloyingPct: v })} ariaLabel={t("Other alloying elements mass percent")} />
            </Field>
            <Field label={t("Scrap per tonne of product")} optional>
              <NumberInput value={draft.scrapRatioTPerT} min={0} unit="t/t" onChange={(v) => set({ scrapRatioTPerT: v })} ariaLabel={t("Scrap ratio")} />
            </Field>
            <Field label={t("Pre-consumer share of that scrap")} optional>
              <NumberInput value={draft.preConsumerScrapPct} min={0} max={100} unit="%" onChange={(v) => set({ preConsumerScrapPct: v })} ariaLabel={t("Pre-consumer scrap percent")} />
            </Field>
          </div>
        </div>
      )}

      {/* The ratio that used to sit beside this moved up into Specific
          embedded emissions, where the supplier's link asks for it. The scrap
          flag stays on the exporter's side: it is a judgement about the
          material, not a figure the supplier reports. */}
      <div className="mt-4">
        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-black/70">
          <input
            type="checkbox"
            checked={draft.isScrap}
            onChange={(e) => toggleScrap(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-none accent-[#111]"
          />
          <span>
            {t("This input is scrap or waste — SEE is forced to 0 at any depth.")}
            <span className="mt-0.5 block text-[11px] text-black/40">{t("Un-ticking clears the figure back to unknown rather than leaving a 0 behind.")}</span>
          </span>
        </label>
      </div>

      {looksLikeScrap(draft) && (
        <p className="mt-3 text-[12px] text-[#b45309]">
          &ldquo;{draft.precursorName}&rdquo; reads like scrap but is not flagged. Nothing has been changed — tick the box if it is.
        </p>
      )}

      {draft.dataOrigin === "supplier_verified" && (
        <p className="mt-3 text-[11.5px] leading-relaxed text-black/40">
          {t("Add a child here only if you are modelling this precursor entry’s own upstream chain yourself. If the figure above already came verified, it already accounts for whatever went into making this precursor — do not add children under a verified figure. A single supplier may appear against more than one precursor entry; this note is about THIS entry’s material, not about the supplier as a whole.")}
        </p>
      )}

      {/* ── Verification evidence ────────────────────────────────
          The facts the four-check gate reads, in one place, under the name
          the supplier's own /p/<token> form uses for them. They used to be
          a "Verifier & report details" drawer buried inside the producing-
          installation box, which put the evidence for the figure three
          nested borders away from the figure — and gave the two sides of the
          same form two different names for one set of fields.

          NONE OF THEM IS OPTIONAL. They never were: precursorRequirements'
          submission scope has always refused a row without the full package.
          The form said "optional" beside every one of them anyway, so the
          only place that told the truth was the error list afterwards.

          Hidden — not merely unenforced — for a scrap or EU-exempt row: no
          verification arises, so there is nothing here to ask for. */}
      {isPurchased && !draft.isScrap && !isExempt && (
        <div className="mt-4 rounded-xl border border-black/[0.07] bg-white p-4">
          <span className="mb-3 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Verification evidence")}</span>
          <p className="mb-3.5 text-[12px] leading-relaxed text-black/45">
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
              <DatePicker
                value={draft.verifierAccreditationExpiryDate ?? ""}
                onChange={(iso) => set({ verifierAccreditationExpiryDate: iso })}
                ariaLabel={t("Accreditation expiry date")}
              />
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
            <Field label={t("Report expires")} optional hint={t("When this report itself needs renewing — leave blank if it does not lapse.")}>
              <DatePicker value={draft.verificationReportExpiresAt ?? ""} onChange={(iso) => set({ verificationReportExpiresAt: iso })} ariaLabel={t("Report expiry date")} />
            </Field>
          </div>
        </div>
      )}

      {showGaps && supplierGaps.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-3.5">
          <p className="text-[12px] font-medium text-[#92400e]">Not yet complete — {supplierGaps.length} required field{supplierGaps.length === 1 ? "" : "s"} missing:</p>
          <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-[#92400e]">
            {supplierGaps.map((g) => (
              <li key={g} className="flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 flex-none rounded-full bg-[#b45309]" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}

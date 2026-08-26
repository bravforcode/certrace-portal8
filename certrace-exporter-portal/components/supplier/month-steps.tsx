"use client";

/* ════════════════════════════════════════════════════════════
   THE SUPPLIER'S MONTH, STEP BY STEP

   The sections a supplier fills in through the workspace link, extracted from
   the page so the page can be about the FLOW — which step, what is blocking,
   what happens next — and each section can be about its own subject.

   THREE THINGS ARE TRUE OF EVERY SECTION HERE:

   1 · THE EXPLANATION LIVES IN THE "?" BESIDE THE HEADING, never in prose
       under it. A form that explains itself in paragraphs is a form people
       scroll past to reach the boxes; one that answers on demand is a form
       they can read when they are stuck. `SectionCard`'s `help` slot puts the
       tip on the heading, which is what it explains.

   2 · EVERY PLACEHOLDER IS A REAL ANSWER, not a restatement of the label. "e.g.
       45.2" under "Production" tells somebody the shape of the answer;
       "Production" under "Production" tells them nothing. A supplier filling
       this in has usually never seen a CBAM form before, and the placeholder is
       the cheapest possible worked example.

   3 · THE FIELDS ARE THE EU TEMPLATE'S. The methodology section mirrors the
       CBAM communication template's monitoring-methodology sheet and the
       monthly section mirrors its activity data — same names, same units, same
       order — because the supplier's answers end up copied into that workbook.
       Where the template leaves a field as free text and a closed list would be
       safer to sum across twelve months (fuel names, reading frequencies,
       electricity supply), it is a dropdown with an "Other, say what" escape.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { AutoSaveBadge, Button, Field, NumberInput, inputClass, cn, type AutoSaveStatus } from "@/components/ui";
import { DatePicker, MultiSelect, OrderedMultiSelect, Select } from "@/components/controls";
import { SectionCard, fmt } from "@/components/workspace/chrome";
import { InstallationFields } from "@/components/workspace/installation-form";
import { ExclusionGroundSelect, ExclusionProcessSelect } from "@/components/workspace/exclusion-process-select";
import { InstrumentRows } from "@/components/workspace/instrument-rows";
import { DocumentsCardGrid } from "@/components/workspace/evidence-cards";
import { getCarbonPrice } from "@/lib/carbon-price";
import { installationErrors, type Installation } from "@/lib/installations";
import {
  applyEuStandard,
  electricityFactorFor,
  ELECTRICITY_FACTOR_SOURCES,
  ELECTRICITY_FACTOR_SOURCE_LABEL,
  biomassEvidenceKey,
  emptyElectricitySource,
  emptyProcessEmissionEntry,
  fuelEvidenceKey,
  FUEL_FACTOR_SOURCES,
  FUEL_FACTOR_SOURCE_LABEL,
  FUEL_FAMILIES,
  FUEL_TYPES,
  FUEL_TYPE_OTHER,
  isTypeIStandard,
  MONTHLY_FUEL_UNITS,
  ncvFieldHint,
  processEmissionEntryTCO2,
  emptyFuel,
  fuelFamilyLabelIn,
  fuelTypeLabelIn,
  fuelTypeNoteIn,
  fuelTypeDef,
  type FuelEntry,
  type MonthlyEntry,
  type MonthlyFuelUnit,
} from "@/lib/monthly-data";
import { CARBON_CONTENTS, STANDARD_MATERIALS } from "@/lib/cbam/process-factors";
import { useLanguage, useT } from "@/lib/i18n";
import { annualScopeFor, coverageForMonth } from "@/lib/workspace-evidence";
import { totalTonnes, type PrecursorSupplier } from "@/lib/precursor-suppliers";
import { getWorkspace, monthNameLong } from "@/lib/workspace";
import { workspaceRequiresIndirectEmissions } from "@/lib/cbam/product-category-rules";
import {
  DIRECT_METHOD_LABEL,
  DIRECT_METHOD_HINT,
  ELECTRICITY_SUPPLY_OPTIONS,
  EXCLUSION_GROUND_HINT,
  PROCESS_OPTIONS,
  REDUCING_AGENTS,
  REDUCING_AGENT_LABEL,
  electricityInstrument,
  isOwnGeneration,
  emptyExclusion,
  emptyGap,
  emptyMeasurement,
  type DirectMethod,
  type ReducingAgent,
  type SectorParameters,
  type WorkspaceMmdContent,
} from "@/lib/workspace-mmd";
import { categoryForCn, specialParametersFor } from "@/lib/cbam/template-reference";

/* Which aggregated-goods categories the EU template asks alloy/scrap
   questions for — the other categories in template-reference.ts that also
   carry `specialParameters` (cement's clinker factor, ammonia's
   concentration, aluminium's own scrap fields, ...) ask something else
   entirely and must not show this card. */
const SECTOR_PARAMETER_CATEGORIES = new Set(["pig_iron", "direct_reduced_iron", "alloys", "crude_steel", "iron_or_steel_products"]);

const UNIT_LABEL: Record<MonthlyFuelUnit, string> = { m3: "m³", kg: "kg", t: "t", l: "litres", GJ: "GJ" };

/** Anchor id for a quality-check finding to scroll to. Kept in one place so
    the check and the form cannot name a field differently. */
const anchor = (field: string) => `qf-${field}`;

export function useFuelOptions() {
  const { lang } = useLanguage();
  return React.useMemo(
    () =>
      FUEL_FAMILIES.flatMap((family) =>
        FUEL_TYPES.filter((f) => f.family === family).map((f) => ({
          value: f.id,
          label: fuelTypeLabelIn(lang, f.id),
          hint: [fuelFamilyLabelIn(lang, family), f.typicalNcv, fuelTypeNoteIn(lang, f.id)].filter(Boolean).join(" · "),
        })),
      ).concat([{ value: FUEL_TYPE_OTHER, label: lang === "th" ? "เชื้อเพลิงอื่น ๆ (Other fuel)" : "Other fuel", hint: "" }]),
    [lang],
  );
}

/* ════════════════════════════════════════════════════════════
   1 · INSTALLATION — settled, with a pencil

   THE SUPPLIER CAN EDIT THIS, and that is a deliberate reversal. It used to be
   read-only on the grounds that a supplier who can retype the installation can
   answer for a different site. The grounds were right about the risk and wrong
   about who knows the answer: the exporter fills this in from an email, and the
   person on the plant is the only one who can say where the main emission
   source actually is or who the authorised representative is this year.

   So it is editable, it is clearly marked as shared, and the exporter sees the
   change on their own screen — which is the control that actually works. A
   silent divergence between two copies of an address is the failure mode; one
   record both parties can correct is not.

   IT AUTOSAVES, AND THERE IS NO EDIT BUTTON. It used to open settled behind a
   pencil, on the argument that the supplier's job here is to READ the record
   and say whether it is right. In practice the pencil was a gate in front of
   the one action the step exists for: a reader who spots a wrong coordinate
   has to find a control, press it, retype, and then find a second control to
   put it back — and a Save button that only closes a local editing flag,
   while the real write happens on a debounce underneath, is a button telling
   the reader something that is not true. The fields are live, every keystroke
   is written, and the badge in the corner says when it last landed. That is
   the same contract as every other step in this flow.

   TWO THINGS ARE NOT THE SUPPLIER'S:

   · THE REFERENCE. It is the key every workspace, month, shipment and document
     already points at — see `lockReference` in the form. This is also the
     duplicate-reference message the supplier used to hit on arrival: the form
     was checking their own site's reference for uniqueness without being told
     which record it belonged to, so a link into TH-RAYONG-04 opened with
     "TH-RAYONG-04 already belongs to another installation" against a site that
     WAS TH-RAYONG-04. `existingId` is what answers that.

   · A HALF-ANSWERED RECORD. `installationIncomplete` is read by the page,
     which will not let Continue past a site that cannot be filed against.
   ════════════════════════════════════════════════════════════ */

/** What is still missing, in the page's words. Exported so the flow's gate and
    this card cannot disagree about whether the step is done. */
/* EMAIL IS REQUIRED HERE, exactly as it is when the exporter creates the
   workspace. It is the address every one of this year's twelve monthly links
   is sent to, so a site filed without one is a site nobody can be asked
   anything — and the two screens that write the same record must not disagree
   about which of its fields are optional. */
export const installationGaps = (i: Installation, existingId?: string): string[] =>
  Object.values(installationErrors(i, existingId, true)).filter(Boolean) as string[];

export function InstallationStep({
  value,
  onChange,
  readOnly,
  existingId,
  showErrors = false,
  autoSave,
  savedAt,
}: {
  value: Installation;
  onChange: (next: Installation) => void;
  readOnly: boolean;
  /** The reference this record already carries — see the note above. */
  existingId?: string;
  /** The Continue gate has just refused. Mark everything that is missing. */
  showErrors?: boolean;
  /** The flow's autosave, rendered where Edit / Save used to be. */
  autoSave?: AutoSaveStatus;
  savedAt?: Date | null;
}) {
  const t = useT();
  const gaps = installationGaps(value, existingId);
  const locked = readOnly;

  return (
    <SectionCard
      title={t("About the installation")}
      helpTitle={t("Why you are being asked to check this")}
      help={
        <>
          <p>{t("These are the facts a verifier asks about a producing site, in the order the EU’s own template asks for them.")}</p>
          <p className="mt-2">
            {t("The exporter filled them in from what they had. You are the one standing at the plant, so correct anything that is wrong — the coordinates especially, which are the MAIN EMISSION SOURCE and not the front gate.")}
          </p>
          <p className="mt-2">{t("Anything you change here appears on the exporter’s screen too. It is one record, not two copies.")}</p>
          <p className="mt-2">
            {t("The installation reference is the exception. It is the id everything about this plant is already filed under, so it is shown but not editable.")}
          </p>
        </>
      }
      blurb={
        readOnly
          ? "Submitted — this is the record as it stood when you signed."
          : "Filled in by the exporter. Read it through and correct anything that is wrong — your changes go back to them, and they save as you type."
      }
      /* WHERE EDIT / SAVE USED TO BE. Nothing is pressed here any more, so the
         corner carries the answer to the only question the pair was ever
         really answering: has what I typed been kept? */
      actions={!readOnly && autoSave ? <AutoSaveBadge status={autoSave} savedAt={savedAt} /> : undefined}
    >
      {gaps.length > 0 && !readOnly && (
        <div className="mb-4 rounded-xl border border-[#f59e0b]/30 bg-[#fffbeb] px-4 py-3">
          <div className="text-[12.5px] text-[#92400e]">
            {gaps.length === 1 ? "One thing is missing before this month can be submitted:" : `${gaps.length} things are missing before this month can be submitted:`}
          </div>
          <ul className="mt-1.5 space-y-1">
            {gaps.map((g) => (
              <li key={g} className="text-[12px] leading-relaxed text-[#92400e]/80">
                · {g}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div id={anchor("installation")} className="scroll-mt-32">
        <InstallationFields
          value={value}
          onChange={onChange}
          existingId={existingId}
          disabled={locked}
          lockReference
          requireEmail
          showAllErrors={showErrors}
        />
      </div>
    </SectionCard>
  );
}

/* ════════════════════════════════════════════════════════════
   2 · METHODOLOGY — how these figures are produced

   Written once for the year and CONFIRMED every month, which is the shape the
   regulation actually has: the boundary does not change monthly, but "was this
   still true in March" is exactly what a verifier asks about March. So the
   supplier meets it every month, pre-filled with what is already on file, and
   changing it in June is what tells the exporter the plant changed in June.
   ════════════════════════════════════════════════════════════ */
export function MmdStep({
  value,
  onChange,
  readOnly,
  cnCode,
}: {
  value: WorkspaceMmdContent;
  onChange: (next: WorkspaceMmdContent) => void;
  readOnly: boolean;
  /** Gates the sector-specific parameters card — only certain iron/steel
      aggregated goods categories ask for it. */
  cnCode?: string;
}) {
  const t = useT();
  const fuelOptions = useFuelOptions();
  const set = (p: Partial<WorkspaceMmdContent>) => onChange({ ...value, ...p });
  const setSector = (p: Partial<SectorParameters>) => set({ sectorParameters: { ...value.sectorParameters, ...p } });

  const sectorGood = categoryForCn(cnCode);
  const sectorLabels = sectorGood && SECTOR_PARAMETER_CATEGORIES.has(sectorGood.id) ? specialParametersFor(sectorGood.id) : [];
  const sp = value.sectorParameters;
  const alloyPctTotal = (sp.mnPct ?? 0) + (sp.crPct ?? 0) + (sp.niPct ?? 0) + (sp.otherAlloyingPct ?? 0);

  const electricityOptions = ELECTRICITY_SUPPLY_OPTIONS.map((o) => ({ value: o.id, label: o.label, hint: o.hint }));

  /* ── The electricity row seeds itself ──────────────────────────
     Picking a supply is the moment the exporter knows there IS a meter, so
     the row appears then rather than waiting for them to find a "+" button
     and guess that "Electricity consumption" is the parameter a verifier
     expects. Only the parameter is filled; the meter details stay empty
     because only the plant knows them.

     Clearing the supply removes the row again — but ONLY while it is still
     empty. A row somebody has typed a meter number into is their work, and
     changing a dropdown must not silently delete it. */
  const setElectricitySupply = (next: string) => {
    const rows = value.electricityInstruments;
    const untouched = rows.length === 1 && !rows[0].instrument.trim() && !rows[0].readingFrequency && !rows[0].lastCalibration;

    if (next && rows.length === 0) {
      set({ electricitySupply: next, electricityInstruments: [electricityInstrument()] });
      return;
    }
    if (!next && untouched) {
      set({ electricitySupply: next, electricityInstruments: [] });
      return;
    }
    set({ electricitySupply: next });
  };

  return (
    <div className={cn("space-y-5", readOnly && "pointer-events-none opacity-60")}>
      <SectionCard
        title={t("The boundary")}
        helpTitle={t("What a boundary is")}
        help={
          <>
            <p>{t("The set of processes whose emissions belong to this good — not the site fence. A plant making three products has three boundaries.")}</p>
            <p className="mt-2">
              {t("Say what is INSIDE it and, just as importantly, what is deliberately outside. A verifier’s first completeness question is what was left out.")}
            </p>
          </>
        }
        blurb={t("Which processes these figures cover, in the order material moves through them.")}
      >
        <div className="space-y-5">
          <div id={anchor("mmd-boundaryDescription")} className="scroll-mt-32">
            <Field label={t("Describe the boundary")} hint={t("Two or three sentences. Name the furnace or line, and say where the boundary stops.")}>
              <textarea
                className={cn(inputClass, "min-h-[96px] resize-y py-2.5")}
                value={value.boundaryDescription}
                onChange={(e) => set({ boundaryDescription: e.target.value })}
                placeholder={t("Scrap is charged to the 90 t electric arc furnace, tapped to the ladle furnace and continuously cast into billet. The boundary ends at the cooling bed. The rolling mill and the on-site canteen are outside it.")}
              />
            </Field>
          </div>

          <div id={anchor("mmd-processesIncluded")} className="scroll-mt-32">
            <Field label={t("Processes inside the boundary, in order")} hint={t("Add them in the sequence material passes through.")}>
              <OrderedMultiSelect
                values={value.processesIncluded}
                onChange={(v) => set({ processesIncluded: v })}
                options={PROCESS_OPTIONS.map((p) => ({ value: p, label: p }))}
                firstPlaceholder={t("Add the first process…")}
                placeholder={t("Add the next process…")}
                ariaLabel={t("Processes included")}
                allowOther
                otherLabel={t("Other — name the process yourself")}
                otherPlaceholder={t("e.g. Billet reheating (walking-beam furnace)")}
              />
            </Field>
          </div>

          <div id={anchor("mmd-exclusions")} className="scroll-mt-32">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Deliberately outside the boundary")}</span>
              <Button size="sm" variant="secondary" onClick={() => set({ exclusions: [...value.exclusions, emptyExclusion()] })}>
                <Plus size={12} strokeWidth={1.5} /> {t("Add an exclusion")}
              </Button>
            </div>
            {value.exclusions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-black/10 px-4 py-4 text-[12.5px] leading-relaxed text-black/40">
                {t("Nothing declared as excluded. If part of the plant is genuinely outside this good’s boundary — a separate line, a leased workshop, the canteen — say so here. An undeclared exclusion is the most common first-engagement finding.")}
              </p>
            ) : (
              <div className="space-y-3">
                {value.exclusions.map((x, i) => (
                  <div key={x.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">Exclusion {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => set({ exclusions: value.exclusions.filter((e) => e.id !== x.id) })}
                        className="grid h-7 w-7 place-items-center rounded-lg text-black/30 transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                        aria-label={`Remove exclusion ${i + 1}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t("Process excluded")} hint={t("Pick it from the same list the boundary is drawn in. A process already excluded drops off the list.")}>
                        <ExclusionProcessSelect
                          value={x}
                          all={value.exclusions}
                          onChange={(process) =>
                            set({ exclusions: value.exclusions.map((y) => (y.id === x.id ? { ...y, process } : y)) })
                          }
                        />
                      </Field>
                      <Field label={t("On what ground")} hint={t(EXCLUSION_GROUND_HINT[x.ground])}>
                        <ExclusionGroundSelect
                          value={x}
                          onChange={(p) => set({ exclusions: value.exclusions.map((y) => (y.id === x.id ? { ...y, ...p } : y)) })}
                        />
                      </Field>
                    </div>
                    <div className="mt-4">
                      <Field label={t("Say how you know")} hint={t("Name the meter, the subcontractor or the threshold. “Not relevant” is a finding.")}>
                        <input
                          className={inputClass}
                          value={x.note}
                          placeholder={t("Separately metered on feeder F-12; the billet leaves our boundary at the cooling bed.")}
                          onChange={(e) => set({ exclusions: value.exclusions.map((y) => (y.id === x.id ? { ...y, note: e.target.value } : y)) })}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Card 1 · Fuels ───────────────────────────────────── */}
      <SectionCard
        title={t("Fuels burned")}
        helpTitle={t("Fuels, and how they are measured")}
        help={
          <>
            <p><strong>{t("What this is.")}</strong> {t("Every fuel burned inside the boundary across the whole year, and the meter that measures each one.")}</p>
            <p className="mt-2">
              <strong>{t("Why it is asked.")}</strong> {t("Burning fuel is where most of a steel plant’s direct CO₂ comes from. Naming the fuels here means a month that suddenly shows a fourth fuel is visible as an exception rather than passing unnoticed.")}
            </p>
            <p className="mt-2">
              <strong>{t("How to fill it.")}</strong> {t("Tick every fuel you burn, even the ones used only occasionally. Then add one instrument row per fuel — what it measures, the make and model, how often somebody reads it, and the date on its last calibration certificate.")}
            </p>
            <p className="mt-2 text-black/45">
              <strong>{t("Example.")}</strong> {t("Natural gas + diesel. Instrument: “Natural gas volume · Elster RVG G250 · monthly · calibrated 15 Mar 2026”.")}
            </p>
          </>
        }
        blurb={t("What you burn, and the meters behind it.")}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div id={anchor("mmd-directMethod")} className="scroll-mt-32">
              <Field label={t("How direct emissions are determined")} hint={t(DIRECT_METHOD_HINT[value.directMethod])}>
                <Select
                  value={value.directMethod}
                  onChange={(v) => set({ directMethod: v as DirectMethod })}
                  options={(["calculation", "measurement"] as DirectMethod[]).map((m) => ({
                    value: m,
                    label: t(DIRECT_METHOD_LABEL[m]),
                    hint: t(DIRECT_METHOD_HINT[m]),
                  }))}
                  ariaLabel={t("Direct method")}
                />
              </Field>
            </div>
            <div id={anchor("mmd-fuelTypes")} className="scroll-mt-32">
              <Field label={t("Fuels burned inside the boundary")} hint={t("Every fuel used across the year, not only this month. Choosing one adds its row to the monthly readings.")}>
                <MultiSelect
                  values={value.fuelTypeIds}
                  onChange={(v) => set({ fuelTypeIds: v })}
                  options={fuelOptions}
                  placeholder={t("Choose the fuels…")}
                  ariaLabel={t("Fuel types")}
                />
              </Field>
            </div>
          </div>

          {value.fuelTypeIds.includes(FUEL_TYPE_OTHER) && (
            <Field label={t("Name the other fuel")} hint={t("In the terms your invoices use.")}>
              <input
                className={inputClass}
                value={value.fuelTypesOther}
                placeholder={t("Rice husk pellets, 14.2 MJ/kg, from Surin")}
                onChange={(e) => set({ fuelTypesOther: e.target.value })}
              />
            </Field>
          )}

          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Instruments — fuels")}</span>
            <InstrumentRows
              anchorId={anchor("mmd-fuelInstruments")}
              rows={value.fuelInstruments}
              onChange={(rows) => set({ fuelInstruments: rows })}
              makeRow={() => emptyMeasurement()}
              addLabel={t("Add a fuel instrument")}
              showCems={value.directMethod === "measurement"}
              emptyHint={
                value.fuelTypeIds.length === 0
                  ? "Choose a fuel above first — then add the meter that measures it."
                  : "Add one row per fuel you selected. A fuel with no instrument behind it is a figure a verifier cannot test."
              }
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Card 2 · Electricity ─────────────────────────────── */}
      <SectionCard
        title={t("Electricity")}
        helpTitle={t("Electricity, and the meter it is read from")}
        help={
          <>
            <p><strong>{t("What this is.")}</strong> {t("Where your power comes from, and which meter the reported MWh is read off.")}</p>
            <p className="mt-2">
              <strong>{t("Why it is asked.")}</strong> {t("The source decides which emission factor you are allowed to use. Grid power uses the national factor; a direct line or a power purchase agreement uses the generator’s own, and that needs the contract behind it.")}
            </p>
            <p className="mt-2">
              <strong>{t("How to fill it.")}</strong> {t("Pick the closest match — the list is written in the names Thai plants actually use. Then name the meter: the feeder, the meter number, whatever appears on the bill.")}
            </p>
            <p className="mt-2 text-black/45"><strong>{t("Example.")}</strong> {t("“Grid — Provincial Electricity Authority (PEA)”, meter PEA 3392011 on main incomer MDB-1.")}</p>
          </>
        }
        blurb={t("Where the power comes from, and the meter behind the figure.")}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div id={anchor("mmd-electricitySupply")} className="scroll-mt-32">
              <Field label={t("Where the electricity comes from")} hint={t("Decides which emission factor is admissible.")}>
                <Select
                  value={value.electricitySupply}
                  onChange={(v) => setElectricitySupply(v)}
                  options={electricityOptions}
                  placeholder={t("Choose a supply")}
                  searchable
                  ariaLabel={t("Electricity supply")}
                />
              </Field>
            </div>
            <div id={anchor("mmd-electricityMeteringPoint")} className="scroll-mt-32">
              {/* NOT "measurement point" — that term is reserved for CEMS
                  sampling locations under Annex I item 25 of IR 2025/2547. */}
              <Field label={t("Electricity metering point")} hint={t("Which meter or feeder the reported MWh is read from — the one the invoice evidences.")}>
                <input
                  className={inputClass}
                  value={value.electricityMeteringPoint}
                  placeholder={t("Main incomer MDB-1, meter PEA 3392011")}
                  onChange={(e) => set({ electricityMeteringPoint: e.target.value })}
                />
              </Field>
            </div>
          </div>

          {value.electricitySupply === "other" && (
            <Field label={t("Describe the supply")}>
              <input
                className={inputClass}
                value={value.electricitySupplyOther}
                placeholder={t("Shared 22 kV feeder with the neighbouring plant, sub-metered at our boundary")}
                onChange={(e) => set({ electricitySupplyOther: e.target.value })}
              />
            </Field>
          )}

          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Instruments — electricity")}</span>
            <InstrumentRows
              anchorId={anchor("mmd-electricityInstruments")}
              rows={value.electricityInstruments}
              onChange={(rows) => set({ electricityInstruments: rows })}
              makeRow={() => electricityInstrument()}
              addLabel={t("Add an electricity meter")}
              parameterPlaceholder={t("Electricity consumption")}
              instrumentPlaceholder={t("PEA revenue meter, 115 kV incomer")}
              emptyHint={t("Choose a supply above and a row appears here, ready for the meter details.")}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Card 3 · Own generation ──────────────────────────────
          Conditional, and a gate. See `ownGenerationFuelDeclared`. */}
      {isOwnGeneration(value.electricitySupply) && (
        <SectionCard
          title={t("Own generation")}
          helpTitle={t("Why this one question matters")}
          help={
            <>
              <p><strong>{t("What this is.")}</strong> {t("A check that the fuel your generator burns has not been left out — or counted twice.")}</p>
              <p className="mt-2">
                <strong>{t("Why it is asked.")}</strong> {t("On-site generation is the easiest place in a CBAM return to double-count. The gas your turbine burns is direct emissions, and the electricity it makes is the same carbon again. Only one of them may be reported.")}
              </p>
              <p className="mt-2">
                <strong>{t("How to fill it.")}</strong> {t("Report the FUEL in the fuels card above and tick the box here. Do not also enter the generated MWh as purchased electricity.")}
              </p>
              <p className="mt-2 text-black/45">
                <strong>{t("Example.")}</strong> {t("A 2 MW gas cogeneration set: the natural gas goes in the fuel list, the electricity it produces does not go in as a separate purchase.")}
              </p>
            </>
          }
          blurb={t("One confirmation, so the same carbon is not counted twice.")}
        >
          <label
            id={anchor("mmd-ownGenerationFuelDeclared")}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 scroll-mt-32 transition-colors",
              value.ownGenerationFuelDeclared ? "border-[rgba(5,150,105,0.25)] bg-[#ecfdf5]" : "border-[#f59e0b]/50 bg-[#fffbeb]",
            )}
          >
            <input
              type="checkbox"
              checked={value.ownGenerationFuelDeclared}
              onChange={(e) => set({ ownGenerationFuelDeclared: e.target.checked })}
              className="mt-0.5 h-4 w-4 flex-none accent-[#111]"
            />
            <span className="min-w-0">
              <span className="block text-[13px] text-black/80">{t("The fuel this generation burns is already listed in the fuels card above.")}</span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-black/50">
                {t("Tick this once you have checked. If the fuel is not up there, add it — leaving it out understates your direct emissions; entering the generated electricity as well would count the same carbon twice.")}
              </span>
            </span>
          </label>
        </SectionCard>
      )}

      <SectionCard
        title={t("Gaps and checking")}
        helpTitle={t("Data gaps")}
        help={
          <>
            <p>{t("A period where an instrument failed or a reading was lost. Declaring it is not an admission — hiding it is the finding.")}</p>
            <p className="mt-2">
              {t("“Estimated” on its own is a finding. HOW it was estimated — from the mean of the months either side, normalised to production — is an answer.")}
            </p>
          </>
        }
        blurb={t("Anything you could not measure, and who checks the figures before they go out.")}
      >
        <div className="space-y-5">
          <div id={anchor("mmd-dataGaps")} className="scroll-mt-32">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Data gaps")}</span>
              <Button size="sm" variant="secondary" onClick={() => set({ dataGaps: [...value.dataGaps, emptyGap()] })}>
                <Plus size={12} strokeWidth={1.5} /> {t("Declare a gap")}
              </Button>
            </div>
            {value.dataGaps.length === 0 ? (
              <p className="rounded-xl border border-dashed border-black/10 px-4 py-4 text-[12.5px] leading-relaxed text-black/40">
                {t("No gaps declared. If every figure this year came off a working instrument, that is the right answer.")}
              </p>
            ) : (
              <div className="space-y-3">
                {value.dataGaps.map((g, i) => (
                  <div key={g.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">Gap {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => set({ dataGaps: value.dataGaps.filter((x) => x.id !== g.id) })}
                        className="grid h-7 w-7 place-items-center rounded-lg text-black/30 transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                        aria-label={`Remove gap ${i + 1}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t("From")}>
                        <DatePicker
                          value={g.periodStart}
                          onChange={(iso) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, periodStart: iso } : x)) })}
                          ariaLabel={t("Gap start")}
                        />
                      </Field>
                      <Field label={t("To")}>
                        <DatePicker
                          value={g.periodEnd}
                          onChange={(iso) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, periodEnd: iso } : x)) })}
                          ariaLabel={t("Gap end")}
                        />
                      </Field>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field label={t("What happened")}>
                        <input
                          className={inputClass}
                          value={g.reason}
                          placeholder={t("Gas meter failed; replaced 14 March")}
                          onChange={(e) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, reason: e.target.value } : x)) })}
                        />
                      </Field>
                      <Field label={t("How the figure was estimated")} hint={t("Specific enough that a verifier could redo it.")}>
                        <input
                          className={inputClass}
                          value={g.estimationMethod}
                          placeholder={t("Mean of Feb and Apr consumption, scaled by March's billet tonnage")}
                          onChange={(e) =>
                            set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, estimationMethod: e.target.value } : x)) })
                          }
                        />
                      </Field>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field label={t("Reviewer of record")} hint={t("This gap's reviewer — a person, not a department.")}>
                        <input
                          className={inputClass}
                          value={g.reviewerName}
                          placeholder={t("Nattapong S., Production Manager")}
                          onChange={(e) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, reviewerName: e.target.value } : x)) })}
                        />
                      </Field>
                      <Field label={t("Date reviewed")}>
                        <DatePicker
                          value={g.gapDate}
                          onChange={(iso) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, gapDate: iso } : x)) })}
                          ariaLabel={t("Date reviewed")}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* The standalone "Reviewer of record" that used to sit here was a
              SECOND copy of the field already inside each gap box. Reviewer of
              record is captured in one place only — per gap, beside the date
              that gap was reviewed. Safe to drop from this form: the supplier
              side never validated it (`SUPPLIER_MMD_EXCLUDED` in
              lib/workspace-mmd.ts already excludes `reviewerName`). */}
        </div>
      </SectionCard>

      {sectorLabels.length > 0 && (
        <SectionCard
          title={t("Alloy composition and scrap use")}
          helpTitle={t("Sector-specific parameters")}
          help={
            <p>
              The EU template asks for these fields for this good&rsquo;s category. They do not change the reported emissions figure — they let an
              importer sanity-check that the reported SEE is plausible for the declared metal composition, and confirm the good is correctly categorised.
            </p>
          }
          blurb={t("Annual, like the rest of this step. Every field here is optional except where the category requires it.")}
        >
          <div id={anchor("mmd-sectorParameters")} className="scroll-mt-32 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sectorLabels.includes("The main reducing agent of the precursor, if known") && (
                <Field
                  label={t("Main reducing agent")}
                  optional
                  hint={t("If this good is made from pig iron or DRI, what reduced the iron ore? For a pure scrap-EAF route, choose “None” — that is a complete and expected answer.")}
                >
                  <Select
                    value={sp.reducingAgent}
                    onChange={(v) => setSector({ reducingAgent: v as ReducingAgent })}
                    options={REDUCING_AGENTS.map((a) => ({ value: a, label: REDUCING_AGENT_LABEL[a] }))}
                    placeholder={t("Not answered")}
                  />
                  {sp.reducingAgent === "other" && (
                    <input
                      className={cn(inputClass, "mt-2")}
                      value={sp.reducingAgentOther}
                      onChange={(e) => setSector({ reducingAgentOther: e.target.value })}
                      placeholder={t("Describe the reducing agent")}
                    />
                  )}
                </Field>
              )}
              {sectorLabels.includes("Steel mill identification number") && (
                <Field label={t("Steel mill identification number")} optional>
                  <input className={inputClass} value={sp.steelMillId} onChange={(e) => setSector({ steelMillId: e.target.value })} />
                </Field>
              )}
              {sectorLabels.includes("% Mn") && (
                <Field label={t("% Mn")} optional hint={t("Leave blank if manganese is only a trace element.")}>
                  <NumberInput value={sp.mnPct} min={0} max={100} unit="%" onChange={(v) => setSector({ mnPct: v })} ariaLabel={t("Manganese mass percent")} />
                </Field>
              )}
              {sectorLabels.includes("% Cr") && (
                <Field label={t("% Cr")} optional hint={t("Leave blank if chromium is only a trace element.")}>
                  <NumberInput value={sp.crPct} min={0} max={100} unit="%" onChange={(v) => setSector({ crPct: v })} ariaLabel={t("Chromium mass percent")} />
                </Field>
              )}
              {sectorLabels.includes("% Ni") && (
                <Field label={t("% Ni")} optional hint={t("Leave blank if nickel is only a trace element.")}>
                  <NumberInput value={sp.niPct} min={0} max={100} unit="%" onChange={(v) => setSector({ niPct: v })} ariaLabel={t("Nickel mass percent")} />
                </Field>
              )}
              {sectorLabels.includes("% other alloys") && (
                <Field label={t("% other alloys")} optional hint={t("Combined share of any alloying elements not covered by Mn/Cr/Ni above.")}>
                  <NumberInput
                    value={sp.otherAlloyingPct}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => setSector({ otherAlloyingPct: v })}
                    ariaLabel={t("Other alloying elements mass percent")}
                  />
                </Field>
              )}
              {sectorLabels.includes("% other materials") && (
                <Field label={t("% other materials")} optional>
                  <NumberInput
                    value={sp.otherMaterialsPct}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => setSector({ otherMaterialsPct: v })}
                    ariaLabel={t("Other materials mass percent")}
                  />
                </Field>
              )}
              {sectorLabels.includes("% carbon") && (
                <Field label={t("% carbon")} optional>
                  <NumberInput value={sp.carbonPct} min={0} max={100} unit="%" onChange={(v) => setSector({ carbonPct: v })} ariaLabel={t("Carbon mass percent")} />
                </Field>
              )}
              {sectorLabels.includes("t scrap per t steel") && (
                <Field label={t("Tonnes of scrap per tonne of steel")} optional>
                  <NumberInput
                    value={sp.scrapTonnesPerTonneSteel}
                    min={0}
                    unit="t/t"
                    onChange={(v) => setSector({ scrapTonnesPerTonneSteel: v })}
                    ariaLabel={t("Scrap ratio")}
                  />
                </Field>
              )}
              {sectorLabels.includes("% pre-consumer scrap") && (
                <Field
                  label={t("% pre-consumer scrap")}
                  optional
                  hint={t("Pre-consumer scrap comes from your own production process — offcuts, trimmings, rejected pieces. Post-consumer scrap comes from end-of-life products such as scrapped vehicles or appliances.")}
                >
                  <NumberInput
                    value={sp.preConsumerScrapPct}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => setSector({ preConsumerScrapPct: v })}
                    ariaLabel={t("Pre-consumer scrap percent")}
                  />
                </Field>
              )}
            </div>
            {alloyPctTotal >= 8 && (
              <p className="rounded-xl border border-[#f4d9a8] bg-[#fef3e2] px-4 py-3 text-[12.5px] leading-relaxed text-[#92620d]">
                {t("This composition may qualify as high alloy steel rather than non-alloy steel — confirm the CN code and aggregated goods category are still correct for this workspace.")}
              </p>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   3 · MONTHLY DATA — the readings

   Same fields, same units and same validation as the exporter's own month
   editor, because they write to the same store. A supplier form that drifts
   from the exporter's form is a reconciliation job nobody scheduled.
   ════════════════════════════════════════════════════════════ */
export function MonthlyStep({
  workspaceId,
  entry,
  patch,
  patchFuel,
  readOnly,
}: {
  workspaceId: string;
  entry: MonthlyEntry;
  patch: (p: Partial<MonthlyEntry>) => void;
  patchFuel: (id: string, p: Partial<FuelEntry>) => void;
  readOnly: boolean;
}) {
  const t = useT();
  const fuelOptions = useFuelOptions();
  const ws = getWorkspace(workspaceId);
  const coverage = coverageForMonth(workspaceId, entry, ws ? workspaceRequiresIndirectEmissions(ws.productId) : false);
  const fuelIsEvidenced = (fuelId: string) => coverage.rows.find((r) => r.key === fuelEvidenceKey(fuelId))?.covered ?? false;

  return (
    <div className={cn("space-y-5", readOnly && "pointer-events-none opacity-60")}>
      <SectionCard
        title={t("Production")}
        helpTitle={t("What counts as production")}
        help={
          <>
            <p>{t("Saleable output of this good in this month, in tonnes.")}</p>
            <p className="mt-2">
              {t("Not what shipped — what came off the line. Scrap returned into the process is not production, and a month with no output is 0 rather than blank.")}
            </p>
          </>
        }
      >
        <div id={anchor("production")} className="scroll-mt-32 sm:w-64">
          <Field label={t("Produced this month")} hint={t("Tonnes of saleable output.")}>
            <NumberInput
              value={entry.productionTonnes}
              min={0}
              unit="t"
              disabled={readOnly}
              onChange={(v) => patch({ productionTonnes: v ?? 0 })}
              ariaLabel={t("Production tonnes")}
              placeholder="4820.5"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title={t("Fuels burned")}
        helpTitle={t("Fuels")}
        help={
          <>
            <p>{t("Every fuel burned inside the boundary this month, with the quantity as your invoice states it.")}</p>
            <p className="mt-2">
              {t("A quantity in m³, kg, t or litres needs a net calorific value beside it. An emission factor is per gigajoule, and applying it to a volume overstates the month by roughly twenty-five times — so the form will not let the figure through without one.")}
            </p>
          </>
        }
        actions={
          !readOnly && (
            <Button size="sm" variant="secondary" onClick={() => patch({ fuels: [...entry.fuels, emptyFuel()] })}>
              <Plus size={12} strokeWidth={1.5} /> {t("Add fuel")}
            </Button>
          )
        }
      >
        {/* One anchor for the whole block as well as one per row. A revision
            request is aimed at "the fuels", not at fuel 2's NCV — see
            lib/month-revision.ts — and the row anchors move whenever a row is
            added or deleted. */}
        {entry.fuels.length === 0 ? (
          <p id={anchor("fuels")} className="scroll-mt-32 rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-[13px] text-black/40">
            {t("No fuel recorded. If this installation burned nothing this month, that is a valid answer — leave it empty.")}
          </p>
        ) : (
          <div id={anchor("fuels")} className="scroll-mt-32 space-y-4">
            {entry.fuels.map((f, i) => {
              const def = fuelTypeDef(f.fuelType);
              const needsNcv = f.unit !== "GJ";
              const typeILocked = isTypeIStandard(f.factorSource);
              const evidenced = fuelIsEvidenced(f.id);
              const typeIIWaitingOnDocument = !typeILocked && !evidenced;
              const factorFieldsDisabled = readOnly || typeILocked || typeIIWaitingOnDocument;
              return (
                <div key={f.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">Fuel {i + 1}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => patch({ fuels: entry.fuels.filter((x) => x.id !== f.id) })}
                        className="grid h-7 w-7 place-items-center rounded-lg text-black/30 transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                        aria-label={`Remove fuel ${i + 1}`}
                        title={t("Remove this fuel")}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <Field label={t("Fuel")}>
                      <Select
                        value={f.fuelType}
                        onChange={(v) => {
                          const unit = fuelTypeDef(v)?.typicalUnit ?? f.unit;
                          const locked = applyEuStandard({ ...f, fuelType: v, unit });
                          patchFuel(f.id, { fuelType: v, unit, efTco2PerGj: locked.efTco2PerGj, ncvMjPerUnit: locked.ncvMjPerUnit });
                        }}
                        options={fuelOptions}
                        searchable
                        ariaLabel={t("Fuel type")}
                      />
                    </Field>
                    <div id={anchor(`fuel:${f.id}:quantity`)} className="scroll-mt-32">
                      <Field label={t("Quantity")} hint={t("The metered figure for this month.")}>
                        <NumberInput
                          value={f.quantity || undefined}
                          min={0}
                          unit={t(UNIT_LABEL[f.unit])}
                          disabled={readOnly}
                          onChange={(v) => patchFuel(f.id, { quantity: v ?? 0 })}
                          ariaLabel={t("Quantity")}
                          placeholder="182400"
                        />
                      </Field>
                    </div>
                    <Field label={t("Unit")}>
                      <Select
                        value={f.unit}
                        onChange={(v) => {
                          const unit = v as MonthlyFuelUnit;
                          const locked = applyEuStandard({ ...f, unit });
                          patchFuel(f.id, { unit, efTco2PerGj: locked.efTco2PerGj, ncvMjPerUnit: locked.ncvMjPerUnit });
                        }}
                        options={MONTHLY_FUEL_UNITS.map((u) => ({ value: u, label: UNIT_LABEL[u] }))}
                        ariaLabel={t("Unit")}
                      />
                    </Field>
                    <div id={anchor(`fuel:${f.id}:ncv`)} className="scroll-mt-32">
                      <Field label={t("Calorific value")} hint={needsNcv ? ncvFieldHint(f, def?.typicalNcv) : "Not needed for GJ."}>
                        <NumberInput
                          value={f.ncvMjPerUnit}
                          min={0}
                          unit={`MJ/${t(UNIT_LABEL[f.unit])}`}
                          disabled={factorFieldsDisabled || !needsNcv}
                          invalid={needsNcv && !(Number(f.ncvMjPerUnit) > 0)}
                          onChange={(v) => patchFuel(f.id, { ncvMjPerUnit: v })}
                          ariaLabel={t("Net calorific value")}
                          placeholder="38.2"
                        />
                      </Field>
                    </div>
                    <div id={anchor(`fuel:${f.id}:ef`)} className="scroll-mt-32">
                      <Field
                        label={t("Emission factor")}
                        hint={
                          typeILocked
                            ? "Locked to the EU standard value above."
                            : "Per gigajoule, never per m³ or litre — a volume factor is roughly 25× out."
                        }
                      >
                        <NumberInput
                          value={f.efTco2PerGj || undefined}
                          min={0}
                          unit="tCO₂/GJ"
                          disabled={factorFieldsDisabled}
                          invalid={!(Number(f.efTco2PerGj) > 0)}
                          onChange={(v) => patchFuel(f.id, { efTco2PerGj: v ?? 0 })}
                          ariaLabel={t("Emission factor")}
                          placeholder="0.0561"
                        />
                      </Field>
                    </div>
                    <Field label={t("Factor source")} hint={t("Where that factor comes from.")}>
                      <Select
                        value={f.factorSource}
                        onChange={(v) => {
                          const factorSource = v as FuelEntry["factorSource"];
                          if (isTypeIStandard(factorSource)) {
                            const locked = applyEuStandard({ ...f, factorSource });
                            patchFuel(f.id, { factorSource, efTco2PerGj: locked.efTco2PerGj, ncvMjPerUnit: locked.ncvMjPerUnit });
                          } else {
                            patchFuel(f.id, { factorSource });
                          }
                        }}
                        options={FUEL_FACTOR_SOURCES.map((s) => ({ value: s, label: FUEL_FACTOR_SOURCE_LABEL[s] }))}
                        ariaLabel={t("Factor source")}
                      />
                    </Field>
                  </div>
                  {typeIIWaitingOnDocument && (
                    <p className="mt-3 text-[12px] leading-relaxed text-[#b45309]">
                      {t("Calorific value and emission factor unlock once a spec sheet, invoice or lab report is attached on the Documents step.")}
                    </p>
                  )}
                  {fuelTypeDef(f.fuelType)?.family === "Biomass" &&
                    (() => {
                      const biomassEvidenced = coverage.rows.find((r) => r.key === biomassEvidenceKey(f.id))?.covered ?? false;
                      const bfLocked = readOnly || !biomassEvidenced;
                      return (
                        <div className="mt-3 rounded-lg border border-black/[0.06] bg-white p-3">
                          <Field
                            label={t("Biomass fraction")}
                            optional
                            hint={t("The share of this fuel's carbon treated as biomass rather than fossil — a fraction, 0 to 1, not a percentage. Zero is the legal default: an unknown fraction counts as fossil.")}
                          >
                            <NumberInput
                              value={f.biomassFraction}
                              min={0}
                              max={1}
                              disabled={bfLocked}
                              onChange={(v) => patchFuel(f.id, { biomassFraction: v ?? 0, biomassEvidenced })}
                              ariaLabel={t("Biomass fraction")}
                              placeholder="0.85"
                            />
                          </Field>
                          {bfLocked && !readOnly && (
                            <p className="mt-2 text-[12px] leading-relaxed text-[#b45309]">
                              {t("Zero-rating this fuel needs the sustainability criteria of Directive (EU) 2018/2001 Art. 29(2)–(7) and (10) evidenced first — attach it on the Documents step to unlock a fraction above zero.")}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[12.5px] text-black/60">
                    <input
                      type="checkbox"
                      checked={Boolean(f.usedForSelfGeneratedElectricity)}
                      disabled={readOnly}
                      onChange={(e) => patchFuel(f.id, { usedForSelfGeneratedElectricity: e.target.checked })}
                      className="mt-0.5 h-4 w-4 flex-none accent-[#111]"
                    />
                    <span>{t("Burned to generate this month’s self-generated electricity.")}</span>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={t("Electricity")}
        helpTitle={t("Electricity")}
        help={
          <p>
            {t("One row per source this month, as the invoice or contract states it — not per tonne. Each source carries its own factor: grid, PPA, self-generated and a direct technical link are never the same number, so a single blended figure would hide which one applies.")}
          </p>
        }
        actions={
          !readOnly && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => patch({ electricitySources: [...(entry.electricitySources ?? []), emptyElectricitySource()] })}
            >
              <Plus size={12} strokeWidth={1.5} /> {t("Add source")}
            </Button>
          )
        }
      >
        <div id={anchor("electricity")} className="scroll-mt-32 space-y-4">
          {(entry.electricitySources ?? []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-[13px] text-black/40">
              {t("No electricity source recorded. Add one, even if the plant drew nothing this month.")}
            </p>
          ) : (
            (entry.electricitySources ?? []).map((s, i) => {
              const isGrid = s.sourceType === "grid_default";
              const isSelfGen = s.sourceType === "self_generated";
              const derived = isGrid || isSelfGen;
              const gridAwaiting = isGrid && s.factorTco2PerMwh == null;
              return (
                <div key={s.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">Source {i + 1}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => patch({ electricitySources: (entry.electricitySources ?? []).filter((x) => x.id !== s.id) })}
                        className="grid h-7 w-7 place-items-center rounded-lg text-black/30 transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                        aria-label={`Remove source ${i + 1}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label={t("Where it comes from")}>
                      <Select
                        value={s.sourceType}
                        onChange={(v) => {
                          const sourceType = v as MonthlyEntry["electricityFactorSource"];
                          patch({
                            electricitySources: (entry.electricitySources ?? []).map((x) =>
                              x.id === s.id ? { ...x, sourceType, factorTco2PerMwh: sourceType === "grid_default" ? electricityFactorFor("grid_default") : null } : x,
                            ),
                          });
                        }}
                        options={ELECTRICITY_FACTOR_SOURCES.map((t) => ({ value: t, label: ELECTRICITY_FACTOR_SOURCE_LABEL[t] }))}
                        ariaLabel={t("Electricity source type")}
                      />
                    </Field>
                    <Field label={t("Consumed")} hint={t("Absolute MWh, real power only.")}>
                      <NumberInput
                        value={s.mwh || undefined}
                        min={0}
                        unit="MWh"
                        disabled={readOnly}
                        onChange={(v) => patch({ electricitySources: (entry.electricitySources ?? []).map((x) => (x.id === s.id ? { ...x, mwh: v ?? 0 } : x)) })}
                        ariaLabel={t("Electricity MWh")}
                        placeholder="2140"
                      />
                    </Field>
                    <Field
                      label={t("Emission factor")}
                      hint={
                        isGrid
                          ? gridAwaiting
                            ? "Awaiting the published EU country default — cannot be typed."
                            : "Locked to the published country default."
                          : isSelfGen
                            ? "Derived from the fuel rows above flagged for self-generation."
                            : "The contracted generator's own figure."
                      }
                    >
                      <NumberInput
                        value={s.factorTco2PerMwh ?? undefined}
                        min={0}
                        disabled={readOnly || derived}
                        invalid={gridAwaiting}
                        onChange={(v) =>
                          /* `null`, not `undefined`, for a cleared box —
                             ElectricitySourceRow spells "nothing entered" as
                             null, and undefined would drop the key on the way
                             through JSON. */
                          patch({
                            electricitySources: (entry.electricitySources ?? []).map((x) =>
                              x.id === s.id ? { ...x, factorTco2PerMwh: v ?? null } : x,
                            ),
                          })
                        }
                        ariaLabel={t("Electricity factor")}
                        placeholder="0.45"
                      />
                    </Field>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={t("Process emissions")}
        helpTitle={t("Process emissions")}
        help={
          <p>
            {t("CO₂ released by the chemistry rather than by burning fuel — flux decomposition, electrode consumption, carbon injection. Pick the material and the quantity; the figure is computed, not typed. Zero rows recorded is a common and correct answer.")}
          </p>
        }
        actions={
          !readOnly && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => patch({ processEmissionEntries: [...(entry.processEmissionEntries ?? []), emptyProcessEmissionEntry()] })}
            >
              <Plus size={12} strokeWidth={1.5} /> {t("Add entry")}
            </Button>
          )
        }
      >
        <div id={anchor("processBasis")} className="scroll-mt-32 space-y-4">
          {(entry.processEmissionEntries ?? []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-[13px] text-black/40">
              {t("No process emissions recorded. Leave empty if there are none.")}
            </p>
          ) : (
            (entry.processEmissionEntries ?? []).map((e, i) => {
              const isStandard = e.method === "standard";
              const materialOptions = isStandard
                ? STANDARD_MATERIALS.map((m) => ({ value: m.id, label: m.label, hint: `${m.tco2PerUnit} tCO₂/${m.unit}` }))
                : CARBON_CONTENTS.map((c) => ({ value: c.material, label: c.label, hint: `${c.tCPerT} t C/t` }));
              return (
                <div key={e.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">Entry {i + 1}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => patch({ processEmissionEntries: (entry.processEmissionEntries ?? []).filter((x) => x.id !== e.id) })}
                        className="grid h-7 w-7 place-items-center rounded-lg text-black/30 transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                        aria-label={`Remove entry ${i + 1}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Field label={t("Method")}>
                      <Select
                        value={e.method}
                        onChange={(v) => {
                          const method = v as "standard" | "mass_balance";
                          patch({
                            processEmissionEntries: (entry.processEmissionEntries ?? []).map((x) =>
                              x.id === e.id
                                ? method === "standard"
                                  ? { id: x.id, method: "standard" as const, materialId: "", quantityT: 0, conversionFactor: 1, note: x.note }
                                  : { id: x.id, method: "mass_balance" as const, materialId: "", quantityT: 0, note: x.note }
                                : x,
                            ),
                          });
                        }}
                        options={[
                          { value: "standard", label: "Standard method" },
                          { value: "mass_balance", label: "Mass balance" },
                        ]}
                        ariaLabel={t("Process emission method")}
                      />
                    </Field>
                    <Field label={t("Material")}>
                      <Select
                        value={e.materialId}
                        onChange={(v) => patch({ processEmissionEntries: (entry.processEmissionEntries ?? []).map((x) => (x.id === e.id ? { ...x, materialId: v } : x)) })}
                        options={materialOptions}
                        searchable
                        placeholder={t("Pick a material")}
                        ariaLabel={t("Process emission material")}
                      />
                    </Field>
                    <Field label={t("Quantity")} hint={isStandard ? "Tonnes." : "Negative for an output stream."}>
                      <NumberInput
                        value={e.quantityT || undefined}
                        unit="t"
                        disabled={readOnly}
                        onChange={(v) => patch({ processEmissionEntries: (entry.processEmissionEntries ?? []).map((x) => (x.id === e.id ? { ...x, quantityT: v ?? 0 } : x)) })}
                        ariaLabel={t("Process emission quantity")}
                      />
                    </Field>
                    {isStandard && (
                      <Field label={t("Conversion factor")} hint={t("Default 1.")}>
                        <NumberInput
                          value={e.conversionFactor ?? 1}
                          min={0.0001}
                          max={1}
                          disabled={readOnly}
                          onChange={(v) =>
                            patch({
                              processEmissionEntries: (entry.processEmissionEntries ?? []).map((x) =>
                                x.id === e.id && x.method === "standard" ? { ...x, conversionFactor: v ?? 1 } : x,
                              ),
                            })
                          }
                          ariaLabel={t("Conversion factor")}
                        />
                      </Field>
                    )}
                  </div>
                  <p className="mt-2 text-[12px] text-black/50">
                    {t("Computed:")} <span className="font-mono text-black/75">{fmt(processEmissionEntryTCO2(e), 4)} tCO₂</span>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>

      {/* ── Anything the figures do not say ────────────────────
          Last, because it is the only free-text box in the step and putting it
          first invites a paragraph in place of a reading. It is the same
          field the exporter's own month screen edits — one note per month,
          not two that disagree. */}
      <SectionCard
        title={t("Notes on this month")}
        blurb={t("Anything a verifier should know that the numbers above do not say — a shutdown, a meter swapped mid-month, a delivery counted late.")}
      >
        <div id={anchor("notes")} className="scroll-mt-32">
          <Field label={t("Notes")} optional hint={t("Plain English. Leave it empty if the month was ordinary.")}>
            <textarea
              className={cn(inputClass, "min-h-[80px] resize-y py-2.5")}
              disabled={readOnly}
              value={entry.notes ?? ""}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder={t("The furnace was down for maintenance from the 12th to the 18th, so output is about half a normal month.")}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   4 · PRECURSORS

   Deeper tiers are not shown. A tier-3 supplier's tonnage is not something the
   plant filling this in can observe, and a box they cannot answer is a box
   somebody eventually guesses at.
   ════════════════════════════════════════════════════════════ */
export function PrecursorStep({
  rows,
  month,
  onTonnes,
  readOnly,
}: {
  rows: PrecursorSupplier[];
  month: string;
  onTonnes: (row: PrecursorSupplier, tonnes: number | undefined) => void;
  readOnly: boolean;
}) {
  const t = useT();
  return (
    <SectionCard
      title={t("Precursors received")}
      helpTitle={t("Precursor quantities")}
      blurb={t("How much of each input arrived in this month, as your goods-received records state it.")}
      help={
        <>
          <p>{t("A precursor is a CBAM good consumed to make this one — billet into rebar, anode into aluminium. Its emissions travel into the finished good with the tonnage.")}</p>
          <p className="mt-2">{t("Report what was received in the month, not what was consumed from stock. Enter 0 if none arrived — a blank is read as a gap, and a gap understates the finished good.")}</p>
        </>
      }
    >
      <div id={anchor("precursors")} className={cn("scroll-mt-32", readOnly && "pointer-events-none opacity-60")}>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-[13px] text-black/40">
            {t("The exporter has not listed any precursors for this good. If you buy in a CBAM input to make it — billet, anode, hot-rolled coil — tell them, because it belongs in the chain.")}
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => {
              const qty = (row.monthlyQuantities ?? []).find((q) => q.month === month)?.tonnes;
              return (
                <div key={row.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
                  <div className="mb-3 min-w-0">
                    <div className="truncate text-[13.5px] text-black/80">{row.precursorName || "Unnamed precursor"}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-black/40">
                      CN {row.cnCode || "—"} · {row.installationName || row.name || "—"}
                      {row.country ? ` · ${row.country}` : ""}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("Received this month")} hint={t("Net mass, from the goods-received note.")}>
                      <NumberInput
                        value={qty}
                        min={0}
                        unit="t"
                        disabled={readOnly}
                        onChange={(v) => onTonnes(row, v)}
                        ariaLabel={`Tonnes of ${row.precursorName || "precursor"} received in ${monthNameLong(month)}`}
                        placeholder="1250"
                      />
                    </Field>
                    <div className="self-end pb-1">
                      <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">{t("Year to date")}</div>
                      <div className="mt-1 font-mono text-[13px] text-black/60">{fmt(totalTonnes(row), 3)} t</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

/* ════════════════════════════════════════════════════════════
   5 · DOCUMENTS — before the check, not after

   The upload step sits BEFORE the quality check on purpose. The check reports
   "nothing is attached to this month" as a finding, and a finding you are told
   about after you have been shown a screen that had no upload control on it is
   a finding that reads as the product's fault.
   ════════════════════════════════════════════════════════════ */
export function DocumentsStep({
  workspaceId,
  workspace,
  entry,
  onChange,
}: {
  workspaceId: string;
  workspace: { year: number; periodStart: string; periodEnd: string };
  entry: MonthlyEntry;
  onChange: () => void;
}) {
  const t = useT();
  const price = getCarbonPrice(workspaceId);
  const scope = annualScopeFor(workspaceId, workspace.periodStart, workspace.periodEnd, price.amountPerTonne > 0);

  return (
    <SectionCard
      title={t("Documents")}
      helpTitle={t("What to attach")}
      help={
        <>
          <p>{t("One document behind each figure — the utility invoice for electricity, the fuel invoice or delivery note for each fuel, the production log for the tonnage.")}</p>
          <p className="mt-2">{t("A figure with nothing behind it is the first thing a verifier removes, and removing it does not make the year smaller — it makes it unverified.")}</p>
          <p className="mt-2">{t("Grouped by who usually holds each document — Operations, Finance, Suppliers, Lab, and Organisation-level — so nothing has to be chased from a list that mixes all five together.")}</p>
        </>
      }
      blurb={t("What a verifier will ask to see behind each figure in this month, grouped by who usually holds it.")}
    >
      <div id={anchor("documents")} className="scroll-mt-32">
        <DocumentsCardGrid workspaceId={workspaceId} year={workspace.year} entry={entry} scope={scope} onChange={onChange} />
      </div>
    </SectionCard>
  );
}

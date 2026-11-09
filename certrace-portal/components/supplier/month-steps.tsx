"use client";

import { AiNumberInput } from "@/components/intake/ai-badge";
import { anchor, useFuelOptions, UNIT_LABEL } from "./monthly-step";

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
import { Button, NumberInput, inputClass, cn } from "@/components/ui";
import { TaggedField } from "@/components/precursor/annex-fields";
import { DatePicker, MultiSelect, OrderedMultiSelect, Select } from "@/components/controls";
import { SectionCard, fmt } from "@/components/workspace/chrome";
import { ExclusionGroundSelect, ExclusionProcessSelect } from "@/components/workspace/exclusion-process-select";
import { InstrumentRows } from "@/components/workspace/instrument-rows";
import { MonitoringPlanCard } from "@/components/workspace/monitoring-plan-card";
import { DocumentsCardGrid } from "@/components/workspace/evidence-cards";
import { getCarbonPrice } from "@/lib/carbon-price";
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
  ELECTRICITY_PARAMETERS,
  FUEL_PARAMETERS,
  type DirectMethod,
  type PfcFactorSource,
  type ReducingAgent,
  type SectorParameters,
  type WorkspaceMmdContent,
} from "@/lib/workspace-mmd";
import { PFC_TECHNOLOGIES, type PfcMethod } from "@/lib/cbam/sector-pack";
import { categoryForCn, specialParametersFor } from "@/lib/cbam/template-reference";

/* Which aggregated-goods categories the EU template asks alloy/scrap
   questions for — the other categories in template-reference.ts that also
   carry `specialParameters` (cement's clinker factor, ammonia's
   concentration, aluminium's own scrap fields, ...) ask something else
   entirely and must not show this card. */
/* Annex IV point 2 of Implementing Regulation (EU) 2025/2547 asks an iron or steel product for the scrap it used and the pre-consumer share too.
   The communication template this card was first built from does not list them for that category, so they are added here. */
const ANNEX_IV_EXTRA: Record<string, string[]> = { iron_or_steel_products: ["t scrap per t steel", "% pre-consumer scrap"] };

const SECTOR_PARAMETER_CATEGORIES = new Set(["pig_iron", "direct_reduced_iron", "alloys", "crude_steel", "iron_or_steel_products", "unwrought_aluminium", "aluminium_products"]);

/* The monthly readings live in ./monthly-step; re-exported so both screens that
   render the month keep importing every step from this one file. */
export { MonthlyStep } from "./monthly-step";

/* One labelled field of the methodology step, in the same style as the monthly
   readings: the Annex IV item it feeds in a box in front of the label — ink for
   required, white for optional ("—" where the answer is asked but is not an item
   of Annex IV). Optional is what `Field`'s `optional` always meant. */
function MField({ tag, label, hint, optional, children }: { tag: string; label: string; hint?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <TaggedField tag={tag} need={optional ? "optional" : "required"} label={label} hint={hint}>
      {children}
    </TaggedField>
  );
}

/* ════════════════════════════════════════════════════════════
   1 · METHODOLOGY — how these figures are produced

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
  const sectorLabels = sectorGood && SECTOR_PARAMETER_CATEGORIES.has(sectorGood.id) ? [...specialParametersFor(sectorGood.id), ...(ANNEX_IV_EXTRA[sectorGood.id] ?? [])] : [];
  /* Which of these Annex IV point 2 REQUIRES for the good, so the box in front of the field says so: the alloying elements and the scrap
     figures for steel, the reducing agent for pig iron and direct reduced iron, the scrap figures for aluminium, carbon for a ferro-alloy.
     The reducing agent of crude steel and iron or steel products is asked "if known". */
  const gid = sectorGood?.id ?? "";
  const isSteelAlloyed = ["pig_iron", "direct_reduced_iron", "crude_steel", "iron_or_steel_products"].includes(gid);
  const needsScrap = ["crude_steel", "iron_or_steel_products", "unwrought_aluminium", "aluminium_products"].includes(gid);
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
            <MField tag="—" label={t("Describe the boundary")} hint={t("Two or three sentences. Name the furnace or line, and say where the boundary stops.")}>
              <textarea
                className={cn(inputClass, "min-h-[96px] resize-y py-2.5")}
                value={value.boundaryDescription}
                onChange={(e) => set({ boundaryDescription: e.target.value })}
                placeholder={t("Scrap is charged to the 90 t electric arc furnace, tapped to the ladle furnace and continuously cast into billet. The boundary ends at the cooling bed. The rolling mill and the on-site canteen are outside it.")}
              />
            </MField>
          </div>

          <div id={anchor("mmd-processesIncluded")} className="scroll-mt-32">
            <MField tag="2(a)" label={t("Processes inside the boundary, in order")} hint={t("Add them in the sequence material passes through.")}>
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
            </MField>
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
                        aria-label={`${t("Remove exclusion")} ${i + 1}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <MField tag="—" label={t("Process excluded")} hint={t("Pick it from the same list the boundary is drawn in. A process already excluded drops off the list.")}>
                        <ExclusionProcessSelect
                          value={x}
                          all={value.exclusions}
                          onChange={(process) =>
                            set({ exclusions: value.exclusions.map((y) => (y.id === x.id ? { ...y, process } : y)) })
                          }
                        />
                      </MField>
                      <MField tag="—" label={t("On what ground")} hint={t(EXCLUSION_GROUND_HINT[x.ground])}>
                        <ExclusionGroundSelect
                          value={x}
                          onChange={(p) => set({ exclusions: value.exclusions.map((y) => (y.id === x.id ? { ...y, ...p } : y)) })}
                        />
                      </MField>
                    </div>
                    <div className="mt-4">
                      <MField tag="—" label={t("Say how you know")} hint={t("Name the meter, the subcontractor or the threshold. “Not relevant” is a finding.")}>
                        <input
                          className={inputClass}
                          value={x.note}
                          placeholder={t("Separately metered on feeder F-12; the billet leaves our boundary at the cooling bed.")}
                          onChange={(e) => set({ exclusions: value.exclusions.map((y) => (y.id === x.id ? { ...y, note: e.target.value } : y)) })}
                        />
                      </MField>
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
              <MField tag="16(a)" label={t("How direct emissions are determined")} hint={t(DIRECT_METHOD_HINT[value.directMethod])}>
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
              </MField>
            </div>
            <div id={anchor("mmd-fuelTypes")} className="scroll-mt-32">
              <MField tag="2(d)" label={t("Fuels burned inside the boundary")} hint={t("Every fuel used across the year, not only this month. Choosing one adds its row to the monthly readings.")}>
                <MultiSelect
                  values={value.fuelTypeIds}
                  onChange={(v) => set({ fuelTypeIds: v })}
                  options={fuelOptions}
                  placeholder={t("Choose the fuels…")}
                  ariaLabel={t("Fuel types")}
                />
              </MField>
            </div>
          </div>

          {value.fuelTypeIds.includes(FUEL_TYPE_OTHER) && (
            <MField tag="2(d)" label={t("Name the other fuel")} hint={t("In the terms your invoices use.")}>
              <input
                className={inputClass}
                value={value.fuelTypesOther}
                placeholder={t("Rice husk pellets, 14.2 MJ/kg, from Surin")}
                onChange={(e) => set({ fuelTypesOther: e.target.value })}
              />
            </MField>
          )}

          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Instruments — fuels")}</span>
            <InstrumentRows
              anchorId={anchor("mmd-fuelInstruments")}
              rows={value.fuelInstruments}
              onChange={(rows) => set({ fuelInstruments: rows })}
              makeRow={() => emptyMeasurement()}
              addLabel={t("Add a fuel instrument")}
              parameterOptions={FUEL_PARAMETERS}
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
              <MField tag="3" label={t("Where the electricity comes from")} hint={t("Decides which emission factor is admissible.")}>
                <Select
                  value={value.electricitySupply}
                  onChange={(v) => setElectricitySupply(v)}
                  options={electricityOptions}
                  placeholder={t("Choose a supply")}
                  searchable
                  ariaLabel={t("Electricity supply")}
                />
              </MField>
            </div>
            <div id={anchor("mmd-electricityMeteringPoint")} className="scroll-mt-32">
              {/* NOT "measurement point" — that term is reserved for CEMS
                  sampling locations under Annex I item 25 of IR 2025/2547. */}
              <MField tag="—" label={t("Electricity metering point")} hint={t("Which meter or feeder the reported MWh is read from — the one the invoice evidences.")}>
                <input
                  className={inputClass}
                  value={value.electricityMeteringPoint}
                  placeholder={t("Main incomer MDB-1, meter PEA 3392011")}
                  onChange={(e) => set({ electricityMeteringPoint: e.target.value })}
                />
              </MField>
            </div>
          </div>

          {value.electricitySupply === "other" && (
            <MField tag="3" label={t("Describe the supply")}>
              <input
                className={inputClass}
                value={value.electricitySupplyOther}
                placeholder={t("Shared 22 kV feeder with the neighbouring plant, sub-metered at our boundary")}
                onChange={(e) => set({ electricitySupplyOther: e.target.value })}
              />
            </MField>
          )}

          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Instruments — electricity")}</span>
            <InstrumentRows
              anchorId={anchor("mmd-electricityInstruments")}
              rows={value.electricityInstruments}
              onChange={(rows) => set({ electricityInstruments: rows })}
              makeRow={() => electricityInstrument()}
              addLabel={t("Add an electricity meter")}
              parameterOptions={ELECTRICITY_PARAMETERS}
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
                        aria-label={`${t("Remove gap")} ${i + 1}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <MField tag="16(e)" label={t("From")}>
                        <DatePicker
                          value={g.periodStart}
                          onChange={(iso) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, periodStart: iso } : x)) })}
                          ariaLabel={t("Gap start")}
                        />
                      </MField>
                      <MField tag="16(e)" label={t("To")}>
                        <DatePicker
                          value={g.periodEnd}
                          onChange={(iso) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, periodEnd: iso } : x)) })}
                          ariaLabel={t("Gap end")}
                        />
                      </MField>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <MField tag="16(e)" label={t("What happened")}>
                        <input
                          className={inputClass}
                          value={g.reason}
                          placeholder={t("Gas meter failed; replaced 14 March")}
                          onChange={(e) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, reason: e.target.value } : x)) })}
                        />
                      </MField>
                      <MField tag="16(e)" label={t("How the figure was estimated")} hint={t("Specific enough that a verifier could redo it.")}>
                        <input
                          className={inputClass}
                          value={g.estimationMethod}
                          placeholder={t("Mean of Feb and Apr consumption, scaled by March's billet tonnage")}
                          onChange={(e) =>
                            set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, estimationMethod: e.target.value } : x)) })
                          }
                        />
                      </MField>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <MField tag="—" label={t("Reviewer of record")} hint={t("This gap's reviewer — a person, not a department.")}>
                        <input
                          className={inputClass}
                          value={g.reviewerName}
                          placeholder={t("Nattapong S., Production Manager")}
                          onChange={(e) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, reviewerName: e.target.value } : x)) })}
                        />
                      </MField>
                      <MField tag="—" label={t("Date reviewed")}>
                        <DatePicker
                          value={g.gapDate}
                          onChange={(iso) => set({ dataGaps: value.dataGaps.map((x) => (x.id === g.id ? { ...x, gapDate: iso } : x)) })}
                          ariaLabel={t("Date reviewed")}
                        />
                      </MField>
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

      <MonitoringPlanCard value={value} onChange={set} anchor={anchor} />

      {value.pfcMethodology && (
        <SectionCard
          title={t("PFC monitoring")}
          helpTitle={t("How PFC is monitored")}
          help={
            <>
              <p>{t("A primary smelter emits CF₄ and C₂F₆ during anode effects. The monitoring plan says how they are counted, for which cells, and on whose factors — once for the year. The monthly figures then follow what is written here.")}</p>
              <p className="mt-2">{t("Plants start from the EU factors for the cell type. Their own factors, measured in the field to within ±15%, replace them and are renewed at least every three years.")}</p>
            </>
          }
          blurb={t("Primary smelting only. Written once for the year.")}
        >
          <div id={anchor("mmd-pfc")} className="scroll-mt-32 grid gap-4 sm:grid-cols-2">
            <MField tag="—" label={t("How the anode effects are counted")}>
              <Select
                value={value.pfcMethodology.method}
                onChange={(v) => set({ pfcMethodology: { ...value.pfcMethodology!, method: v as PfcMethod } })}
                options={[
                  { value: "slope", label: t("Minutes per cell-day (slope)"), hint: t("The most common way") },
                  { value: "overvoltage", label: t("Overvoltage"), hint: t("Where the anode-effect voltage is recorded") },
                ]}
                placeholder={t("Not answered")}
                disabled={readOnly}
                ariaLabel={t("PFC method")}
              />
            </MField>
            <MField tag="—" label={t("Cell type")}>
              <Select
                value={value.pfcMethodology.technology}
                onChange={(v) => set({ pfcMethodology: { ...value.pfcMethodology!, technology: v } })}
                options={PFC_TECHNOLOGIES.map((x) => ({ value: x.id, label: t(x.label) }))}
                placeholder={t("Not answered")}
                disabled={readOnly}
                ariaLabel={t("Cell type")}
              />
            </MField>
            <MField tag="—" label={t("Whose factors")} hint={t("The EU table for the cell type, or factors the plant measured itself.")}>
              <Select
                value={value.pfcMethodology.factorSource}
                onChange={(v) => set({ pfcMethodology: { ...value.pfcMethodology!, factorSource: v as PfcFactorSource } })}
                options={[
                  { value: "eu_table", label: t("The EU table for the cell type") },
                  { value: "own_measurement", label: t("The plant's own field measurement") },
                ]}
                placeholder={t("Not answered")}
                disabled={readOnly}
                ariaLabel={t("PFC factor source")}
              />
            </MField>
            {value.pfcMethodology.factorSource === "own_measurement" && (
              <MField tag="—" label={t("Last measured")} hint={t("Renewed at least every three years, or sooner if the cells or their control change.")}>
                <DatePicker
                  value={value.pfcMethodology.measuredOn}
                  onChange={(iso) => set({ pfcMethodology: { ...value.pfcMethodology!, measuredOn: iso } })}
                  ariaLabel={t("Date the PFC factors were last measured")}
                />
              </MField>
            )}
            <div className="sm:col-span-2">
              <MField tag="—" label={t("How the duct's collection efficiency was determined")} hint={t("What is measured in the duct is divided by it, so the figure includes fume that escapes the duct.")}>
                <textarea
                  className={cn(inputClass, "min-h-[72px] resize-y py-2.5")}
                  disabled={readOnly}
                  value={value.pfcMethodology.collectionBasis}
                  onChange={(e) => set({ pfcMethodology: { ...value.pfcMethodology!, collectionBasis: e.target.value } })}
                  placeholder={t("Measured in the duct and at the roof vents during the 2025 survey of potline 2.")}
                />
              </MField>
            </div>
          </div>
        </SectionCard>
      )}

      {sectorLabels.length > 0 && (
        <SectionCard
          title={t("Alloy composition and scrap use")}
          helpTitle={t("Sector-specific parameters")}
          help={
            <p>
              {t("The EU template asks for these fields for this good’s category. They do not change the reported emissions figure — they let an importer sanity-check that the reported SEE is plausible for the declared metal composition, and confirm the good is correctly categorised.")}
            </p>
          }
          blurb={t("Annual, like the rest of this step. Every field here is optional except where the category requires it.")}
        >
          <div id={anchor("mmd-sectorParameters")} className="scroll-mt-32 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sectorLabels.includes("The main reducing agent of the precursor, if known") && (
                <MField tag="35"
                  label={t("Main reducing agent")}
                  optional={!(gid === "pig_iron" || gid === "direct_reduced_iron")}
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
                </MField>
              )}
              {sectorLabels.includes("Steel mill identification number") && (
                <MField tag="35" label={t("Steel mill identification number")} optional>
                  <input className={inputClass} value={sp.steelMillId} onChange={(e) => setSector({ steelMillId: e.target.value })} />
                </MField>
              )}
              {sectorLabels.includes("% Mn") && (
                <MField tag="35" label={t("% Mn")} optional={!isSteelAlloyed} hint={t("Enter 0 if there is none.")}>
                  <NumberInput value={sp.mnPct} min={0} max={100} unit="%" onChange={(v) => setSector({ mnPct: v })} ariaLabel={t("Manganese mass percent")} />
                </MField>
              )}
              {sectorLabels.includes("% Cr") && (
                <MField tag="35" label={t("% Cr")} optional={!isSteelAlloyed} hint={t("Enter 0 if there is none.")}>
                  <NumberInput value={sp.crPct} min={0} max={100} unit="%" onChange={(v) => setSector({ crPct: v })} ariaLabel={t("Chromium mass percent")} />
                </MField>
              )}
              {sectorLabels.includes("% Ni") && (
                <MField tag="35" label={t("% Ni")} optional={!isSteelAlloyed} hint={t("Enter 0 if there is none.")}>
                  <NumberInput value={sp.niPct} min={0} max={100} unit="%" onChange={(v) => setSector({ niPct: v })} ariaLabel={t("Nickel mass percent")} />
                </MField>
              )}
              {sectorLabels.includes("% other alloys") && (
                <MField tag="35" label={t("% other alloys")} optional={!isSteelAlloyed} hint={t("Combined share of any alloying elements not covered by Mn/Cr/Ni above. Enter 0 if there is none.")}>
                  <NumberInput
                    value={sp.otherAlloyingPct}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => setSector({ otherAlloyingPct: v })}
                    ariaLabel={t("Other alloying elements mass percent")}
                  />
                </MField>
              )}
              {sectorLabels.includes("% other materials") && (
                <MField tag="35" label={t("% other materials")} optional>
                  <NumberInput
                    value={sp.otherMaterialsPct}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => setSector({ otherMaterialsPct: v })}
                    ariaLabel={t("Other materials mass percent")}
                  />
                </MField>
              )}
              {sectorLabels.includes("% carbon") && (
                <MField tag="35" label={t("% carbon")}>
                  <NumberInput value={sp.carbonPct} min={0} max={100} unit="%" onChange={(v) => setSector({ carbonPct: v })} ariaLabel={t("Carbon mass percent")} />
                </MField>
              )}
              {sectorLabels.includes("t scrap per t aluminium") && (
                <MField tag="35" label={t("Tonnes of scrap per tonne of aluminium")} optional={!needsScrap} hint={t("Over the year. Your monthly scrap figures give it; enter the annual one here if you keep it. Enter 0 if you use none.")}>
                  <NumberInput
                    value={sp.scrapTonnesPerTonneAluminium}
                    min={0}
                    unit="t/t"
                    onChange={(v) => setSector({ scrapTonnesPerTonneAluminium: v })}
                    ariaLabel={t("Scrap ratio")}
                  />
                </MField>
              )}
              {sectorLabels.includes("% non-aluminium elements") && (
                <MField tag="35" label={t("% non-aluminium elements")} optional hint={t("The share of the metal that is alloying elements, where any one is above 1%.")}>
                  <NumberInput
                    value={sp.nonAluminiumPct}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => setSector({ nonAluminiumPct: v })}
                    ariaLabel={t("Non-aluminium elements mass percent")}
                  />
                </MField>
              )}
              {sectorLabels.includes("t scrap per t steel") && (
                <MField tag="35" label={t("Tonnes of scrap per tonne of steel")} optional={!needsScrap} hint={t("Over the year, for this good — including the steel you buy in. Leave it empty and Certrace works it out from your monthly scrap and your precursors' own figures. Enter 0 if you use none.")}>
                  <NumberInput
                    value={sp.scrapTonnesPerTonneSteel}
                    min={0}
                    unit="t/t"
                    onChange={(v) => setSector({ scrapTonnesPerTonneSteel: v })}
                    ariaLabel={t("Scrap ratio")}
                  />
                </MField>
              )}
              {sectorLabels.includes("% pre-consumer scrap") && (
                <MField tag="35"
                  label={t("% pre-consumer scrap")}
                  optional={!needsScrap}
                  hint={t("Pre-consumer scrap is offcuts, trimmings and rejects from another manufacturer's production. Scrap that goes straight back into the process it came from is not counted. Post-consumer scrap comes from end-of-life products such as scrapped vehicles or appliances.")}
                >
                  <NumberInput
                    value={sp.preConsumerScrapPct}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(v) => setSector({ preConsumerScrapPct: v })}
                    ariaLabel={t("Pre-consumer scrap percent")}
                  />
                </MField>
              )}
            </div>
            {alloyPctTotal >= 8 && (
              <p className="rounded-xl border border-[#f4d9a8] bg-[#fef3e2] px-4 py-3 text-[12.5px] leading-relaxed text-[#92620d]">
                {t("This composition may qualify as high alloy steel rather than non-alloy steel — confirm the CN code and aggregated goods category are still correct for this product report.")}
              </p>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   3 · DOCUMENTS — before the check, not after

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
  allowUpload = true,
  audience,
  uploadedBy,
}: {
  workspaceId: string;
  workspace: { year: number; periodStart: string; periodEnd: string };
  entry: MonthlyEntry;
  onChange: () => void;
  /** false only where something else is the way in — the grid then just shows what is still missing */
  allowUpload?: boolean;
  /** "supplier" on the plant's link: no precursor paperwork */
  audience?: "exporter" | "supplier";
  uploadedBy?: string;
}) {
  const t = useT();
  const price = getCarbonPrice(workspaceId);
  const scope = annualScopeFor(workspaceId, workspace.periodStart, workspace.periodEnd, price.amountPerTonne > 0);

  return (
    <SectionCard
      title={allowUpload ? t("Documents") : t("What's still missing")}
      helpTitle={t("What to attach")}
      help={
        <>
          <p>{t("One document behind each figure — the utility invoice for electricity, the fuel invoice or delivery note for each fuel, the production log for the tonnage.")}</p>
          <p className="mt-2">{t("A figure with nothing behind it is the first thing a verifier removes, and removing it does not make the year smaller — it makes it unverified.")}</p>
          <p className="mt-2">{t("Grouped by who usually holds each document — Operations, Finance, Suppliers, Lab, and Organisation-level — so nothing has to be chased from a list that mixes all five together.")}</p>
        </>
      }
      blurb={
        allowUpload
          ? t("What a verifier will ask to see behind each figure in this month, grouped by who usually holds it.")
          : t("Drop a file on the document it belongs to, or click it to choose one.")
      }
    >
      <div id={anchor("documents")} className="scroll-mt-32">
        <DocumentsCardGrid workspaceId={workspaceId} year={workspace.year} entry={entry} scope={scope} onChange={onChange} allowUpload={allowUpload} audience={audience} uploadedBy={uploadedBy} />
      </div>
    </SectionCard>
  );
}

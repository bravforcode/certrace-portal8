"use client";

/* ════════════════════════════════════════════════════════════
   THE MMD, ON ONE PAGE

   Seven cards, one scroll. Every card says what it is FOR before it asks for
   anything, and every field that wants prose can show a filled example beside
   it — greyed, and never written into the field.

   THREE THINGS THIS SCREEN INSISTS ON:

   1. The included processes are ORDERED. "Raw material handling → melting →
      casting" describes a plant; the same three shuffled describe nothing.

   2. An excluded process is a DECLARATION WITH A GROUND, not a row you deleted.
      A verifier's first completeness question is what happens on this site
      that is not in these numbers and why that is correct, and an exclusion
      with an empty justification is the most common first-engagement finding.

   3. Nothing is saved by pressing a button. The methodology is written over
      weeks by whoever is at the plant that day, so every keystroke persists
      and the header says when it last did.

   Finalising stamps the version; editing afterwards forks v+1, so a document
   handed to a verifier in March still says in December what it said in March.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Lock, Plus, Trash2, Upload } from "lucide-react";
import { AutoSaveBadge, Button, Field, NumberInput, inputClass, useAutoSave, cn } from "@/components/ui";
import { DatePicker, MultiSelect, OrderedMultiSelect, Select, SelectWithOther } from "@/components/controls";
import { ExclusionGroundSelect, ExclusionProcessSelect } from "@/components/workspace/exclusion-process-select";
import { InstrumentRows } from "@/components/workspace/instrument-rows";
import { toast } from "@/components/toast";
import { ExampleToggle, GroupHeading, Note, SectionCard } from "@/components/workspace/chrome";
import { SectionEvidence } from "@/components/workspace/evidence-panel";
import { useWorkspace } from "@/components/workspace/provider";
import { USER } from "@/lib/data";
import { FUEL_FAMILIES, FUEL_TYPES, FUEL_TYPE_OTHER, fuelFamilyLabelIn, fuelTypeLabelIn, fuelTypeNoteIn } from "@/lib/monthly-data";
import { useLanguage, useT } from "@/lib/i18n";
import { ANNUAL_REQUIRED_KEYS } from "@/lib/workspace-evidence";
import {
  DIAGRAM_NOTE,
  DIAGRAM_REQUIREMENTS,
  DIRECT_METHOD_HINT,
  DIRECT_METHOD_LABEL,
  DRAFT_BANNER,
  ELECTRICITY_SUPPLY_OPTIONS,
  EXCLUSION_GROUND_HINT,
  FACTOR_SOURCE_HINT,
  FACTOR_SOURCE_LABEL,
  MMD_EXAMPLE,
  MMD_SECTION_HELP,
  PROCESS_OPTIONS,
  QUALITY_ASSURANCE_LABEL,
  QUALITY_ASSURANCE_OPTIONS,
  READING_FREQUENCY_OPTIONS,
  electricityInstrument,
  isOwnGeneration,
  emptyExclusion,
  emptyGap,
  emptyMeasurement,
  finalVersionCovering,
  finaliseVersion,
  latestVersion,
  loadDraft,
  mmdIssues,
  saveDraft,
  type DirectMethod,
  type FactorSourceOption,
  type QualityAssurance,
  type WorkspaceMmdContent,
  type WorkspaceMmdVersion,
} from "@/lib/workspace-mmd";

/* Reporting-period help. This is the one rule on the screen that an exporter
   cannot infer from the fields in front of them, and getting it wrong produces
   a year of data that describes two different plants averaged together.

   A COMPONENT, not a module-level element. It carries prose, and prose has to
   pass through t() — which is a hook, so it cannot run while the module is
   being evaluated. Rendered as <PeriodHelp /> wherever the constant used to
   be interpolated. */
function PeriodHelp() {
  const t = useT();
  return (
  <>
    <p>
      {t("The period is the calendar year, and it is not stretched. If the way you produce this good changes part-way through — a new furnace, a fuel switch, a change to what is inside the boundary — the figures either side of that date describe two different installations.")}
    </p>
    <p className="mt-2">
      {t("When that happens,")} <strong>{t("close this period at the change and report the rest of the year separately.")}</strong> {t("Averaging across the change hides exactly the difference a verifier is looking for.")}
    </p>
    </>
  );
}

/* The fuel menu, in the interface language.

   Thai rows read "ก๊าซธรรมชาติ (Natural gas)" rather than Thai alone: the
   meter, the invoice and the verifier's report all say the English name, so
   dropping it would break the trail at the language boundary. */
function useFuelOptions() {
  const { lang } = useLanguage();
  return React.useMemo(
    () => [
      ...FUEL_FAMILIES.flatMap((family) =>
        FUEL_TYPES.filter((f) => f.family === family).map((f) => ({
          value: f.id,
          label: fuelTypeLabelIn(lang, f.id),
          hint: [fuelFamilyLabelIn(lang, family), f.typicalNcv, fuelTypeNoteIn(lang, f.id)].filter(Boolean).join(" · "),
        })),
      ),
      {
        value: FUEL_TYPE_OTHER,
        label: lang === "th" ? "เชื้อเพลิงอื่น ๆ (Other fuel) — ระบุ" : "Other fuel — specify",
        hint: "Anything the list does not name. Describe it in the field below.",
      },
    ],
    [lang],
  );
}

export default function WorkspaceMmdPage() {
  const t = useT();
  const { workspace, refresh } = useWorkspace();
  const fuelOptions = useFuelOptions();
  const [content, setContent] = React.useState<WorkspaceMmdContent | null>(null);
  const [final, setFinal] = React.useState<WorkspaceMmdVersion | null>(null);
  const [latest, setLatest] = React.useState<WorkspaceMmdVersion | null>(null);
  const [forking, setForking] = React.useState(false);

  const reload = React.useCallback(() => {
    setContent(loadDraft(workspace.id, workspace.periodStart, workspace.periodEnd));
    setFinal(finalVersionCovering(workspace.id, workspace.periodStart, workspace.periodEnd));
    setLatest(latestVersion(workspace.id));
    refresh();
  }, [workspace, refresh]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  // A final version is read-only until the exporter explicitly chooses to
  // amend it — which forks v+1 rather than editing the stamped document.
  const locked = Boolean(final) && !forking;

  const autosave = useAutoSave(
    content,
    (c) => {
      if (!c) return;
      saveDraft(workspace.id, c);
      refresh();
    },
    { enabled: Boolean(content) && !locked },
  );

  if (!content) return null;

  const shown = locked && final ? final.content : content;
  const issues = mmdIssues(shown);

  const patch = (p: Partial<WorkspaceMmdContent>) => {
    if (locked) return;
    setContent((prev) => (prev ? { ...prev, ...p } : prev));
  };

  /* The electricity row seeds itself the moment a source is chosen, and
     un-seeds itself only while still untouched. Same rule as the supplier
     portal — see the note there. */
  const setElectricitySupply = (next: string, otherText: string) => {
    const rows = content.electricityInstruments;
    const untouched = rows.length === 1 && !rows[0].instrument.trim() && !rows[0].readingFrequency && !rows[0].lastCalibration;
    if (next && rows.length === 0) {
      patch({ electricitySupply: next, electricitySupplyOther: otherText, electricityInstruments: [electricityInstrument()] });
      return;
    }
    if (!next && untouched) {
      patch({ electricitySupply: next, electricitySupplyOther: otherText, electricityInstruments: [] });
      return;
    }
    patch({ electricitySupply: next, electricitySupplyOther: otherText });
  };

  const finalise = () => {
    saveDraft(workspace.id, content);
    const v = finaliseVersion(workspace.id, content, USER.name);
    setForking(false);
    reload();
    toast({ message: `MMD finalised as v${v.n}`, detail: "It is now read-only. Editing forks a new version.", tone: "ok" });
  };

  return (
    <div className="space-y-5">
      {locked && final ? (
        <Note tone="info">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Lock size={14} strokeWidth={1.5} />
              <strong>v{final.n}</strong> · finalised {final.finalisedAt.slice(0, 10)} by {final.author} · covers {final.periodStart} to {final.periodEnd}.
              Read-only.
            </span>
            <Button size="sm" variant="secondary" onClick={() => setForking(true)}>
              Amend — forks v{(latest?.n ?? final.n) + 1}
            </Button>
          </div>
        </Note>
      ) : (
        <Note tone="warn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="max-w-3xl">{t(DRAFT_BANNER)}</span>
            <span className="flex flex-none items-center gap-3">
              <AutoSaveBadge status={autosave.status} savedAt={autosave.savedAt} />
              <Button size="sm" onClick={finalise}>
                Finalise{latest ? ` as v${latest.n + 1}` : ""}
              </Button>
            </span>
          </div>
        </Note>
      )}

      {/* 1 · Boundary */}
      <SectionCard title={t("1 · Boundary")} helpTitle={t("What the boundary is")} help={<p>{t(MMD_SECTION_HELP.boundary)}</p>}>
        <Field label={t("Boundary description")} hint={t("Name the equipment, say where material enters and leaves, and say what is outside the line.")}>
          <textarea
            className={cn(inputClass, "min-h-[110px] resize-y")}
            disabled={locked}
            value={shown.boundaryDescription}
            onChange={(e) => patch({ boundaryDescription: e.target.value })}
            placeholder={t("Start at the weighbridge, end at the cooling bed…")}
          />
        </Field>
        <ExampleToggle example={MMD_EXAMPLE.boundaryDescription} />

        <div className="mt-6">
          <GroupHeading
            helpTitle={t("Processes included")}
            help={
              <>
                <p>{t("List them in the order material moves through the boundary.")}</p>
                <p className="mt-2">
                  {t("A verifier reads this as the sequence on the shop floor and checks it against your diagram. Four process names in the wrong order describe a plant that does not exist.")}
                </p>
              </>
            }
          >
            {t("Processes included")}
          </GroupHeading>
          <OrderedMultiSelect
            values={shown.processesIncluded}
            onChange={(v) => patch({ processesIncluded: v })}
            options={PROCESS_OPTIONS.map((p) => ({ value: p, label: p }))}
            disabled={locked}
            firstPlaceholder={t("Add the process in order")}
            placeholder={t("Add the next process")}
            ariaLabel={t("Processes included")}
            allowOther
            otherLabel={t("Other — name the process yourself")}
            otherPlaceholder={t("e.g. Billet reheating (walking-beam furnace)")}
          />
          <ExampleToggle example={MMD_EXAMPLE.processesIncluded.map((p, i) => `${i + 1}. ${p}`).join("  →  ")} />
        </div>

        <div className="mt-6">
          <GroupHeading
            helpTitle={t("An exclusion is a declaration")}
            help={
              <p>
                {t("These are processes that happen at your installation and that you are declaring to be outside the boundary. That is allowed — but every one of them needs a ground and the detail behind it. An exclusion with an empty note is the most common finding on a first engagement.")}
              </p>
            }
            actions={
              !locked && (
                <Button size="sm" variant="secondary" onClick={() => patch({ exclusions: [...shown.exclusions, emptyExclusion()] })}>
                  <Plus size={13} strokeWidth={1.5} /> {t("Declare an exclusion")}
                </Button>
              )
            }
          >
            {t("Processes excluded")}
          </GroupHeading>

          {shown.exclusions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/10 px-4 py-4 text-[12.5px] leading-relaxed text-black/45">
              {t("Nothing declared as excluded. That is a valid answer if everything on the site is inside the boundary — but offices, canteens, vehicle fleets and separately metered lines almost always are not, and a verifier will ask about them by name.")}
            </p>
          ) : (
            <div className="space-y-3">
              {shown.exclusions.map((x, i) => (
                <div key={x.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">Exclusion {i + 1}</span>
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => patch({ exclusions: shown.exclusions.filter((e) => e.id !== x.id) })}
                        className="text-black/30 hover:text-[#dc2626]"
                        aria-label={t("Remove exclusion")}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Field label={t("Process")} hint={t("The same list the boundary is drawn in. A process already excluded drops off the list.")}>
                      <ExclusionProcessSelect
                        value={x}
                        all={shown.exclusions}
                        disabled={locked}
                        onChange={(process) => patch({ exclusions: shown.exclusions.map((e) => (e.id === x.id ? { ...e, process } : e)) })}
                      />
                    </Field>
                    <Field label={t("Ground for excluding it")} hint={t(EXCLUSION_GROUND_HINT[x.ground])}>
                      <ExclusionGroundSelect
                        value={x}
                        disabled={locked}
                        onChange={(p) => patch({ exclusions: shown.exclusions.map((e) => (e.id === x.id ? { ...e, ...p } : e)) })}
                      />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <Field label={t("Detail")} hint={t("Which meter, which subcontractor, which threshold. This is the part a verifier reads.")}>
                      <input
                        className={cn(inputClass, !x.note.trim() && "border-[#f59e0b]/50")}
                        disabled={locked}
                        value={x.note}
                        placeholder={t("Fed from substation SS-02, meter E-221. Reported under CN 7213 91 10.")}
                        onChange={(e) => patch({ exclusions: shown.exclusions.map((r) => (r.id === x.id ? { ...r, note: e.target.value } : r)) })}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ExampleToggle example={MMD_EXAMPLE.exclusionExample} />
        </div>
      </SectionCard>

      {/* 2 · Reporting period.

          This card used to carry five separate explanations of one dropdown
          pair: a blurb, a hint under each date, a paragraph underneath, and an
          example that was itself three sentences of policy. All of it was
          true and none of it was needed at that moment — the exporter chose
          the year when they created the workspace, and the picker is already
          clamped to it, so the screen was explaining a constraint it was
          simultaneously enforcing. The rule survives, behind the "?". */}
      <SectionCard
        title={t("2 · Reporting period")}
        helpTitle={t("Reporting period")}
        help={
          <>
            <p>{t(MMD_SECTION_HELP.period)}</p>
            <PeriodHelp />
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Start")}>
            <DatePicker
              value={shown.periodStart}
              onChange={(iso) => patch({ periodStart: iso })}
              min={workspace.periodStart}
              max={shown.periodEnd || workspace.periodEnd}
              disabled={locked}
              ariaLabel={t("Reporting period start")}
            />
          </Field>
          <Field label={t("End")}>
            <DatePicker
              value={shown.periodEnd}
              onChange={(iso) => patch({ periodEnd: iso })}
              min={shown.periodStart || workspace.periodStart}
              max={workspace.periodEnd}
              disabled={locked}
              ariaLabel={t("Reporting period end")}
            />
          </Field>
        </div>
        <ExampleToggle example={MMD_EXAMPLE.period} />
      </SectionCard>

      {/* 3 · Fuels ─────────────────────────────────────────────
          Sections 3 and 4 used to be "parameters" and "measurement methods":
          one card naming the fuels and the electricity together, and a second
          holding every instrument in a single undifferentiated list. That let
          one electricity meter satisfy the instrument requirement for a plant
          burning three fuels, and left the on-site-generation double count
          with nowhere to be caught. Three cards, three answerable questions. */}
      <SectionCard
        title={t("3 · Fuels")}
        helpTitle={t("Fuels, and how they are measured")}
        help={
          <>
            <p><strong>{t("What.")}</strong> {t("Every fuel burned inside the boundary across the year, and the instrument measuring each one.")}</p>
            <p className="mt-2"><strong>{t("Why.")}</strong> {t("Combustion is where most direct CO₂ comes from. Naming the fuels makes an unexpected fourth fuel next March visible as an exception.")}</p>
            <p className="mt-2"><strong>{t("How.")}</strong> {t("Select every fuel, then add one instrument row per fuel — parameter, make and model, reading frequency, last calibration date.")}</p>
            <p className="mt-2 text-black/45"><strong>{t("Example.")}</strong> {t("Natural gas · Elster RVG G250 rotary meter · monthly · calibrated 15 Mar 2026.")}</p>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label={t("Direct method")} hint={t(DIRECT_METHOD_HINT[shown.directMethod])}>
            <Select
              value={shown.directMethod}
              onChange={(v) => patch({ directMethod: v as DirectMethod })}
              options={(["calculation", "measurement"] as DirectMethod[]).map((m) => ({
                value: m,
                label: t(DIRECT_METHOD_LABEL[m]),
                hint: t(DIRECT_METHOD_HINT[m]),
              }))}
            />
          </Field>
          <Field label={t("Fuel types burned")} hint={t("The same codes the monthly rows use, so the methodology and the readings cannot name different fuels.")}>
            <MultiSelect
              values={shown.fuelTypeIds}
              onChange={(v) => patch({ fuelTypeIds: v })}
              options={fuelOptions}
              placeholder={t("Select every fuel this installation burns")}
              ariaLabel={t("Fuel types")}
            />
            {shown.fuelTypeIds.includes(FUEL_TYPE_OTHER) && (
              <input
                className={cn(inputClass, "mt-2", !shown.fuelTypesOther.trim() && "border-[#f59e0b]/50")}
                disabled={locked}
                value={shown.fuelTypesOther}
                placeholder={t("Describe the other fuel in the terms your invoices use")}
                onChange={(e) => patch({ fuelTypesOther: e.target.value })}
              />
            )}
          </Field>
        </div>
        <ExampleToggle example={MMD_EXAMPLE.fuelTypes} />

        <div className="mt-5">
          <GroupHeading helpTitle={t("Instruments — fuels")} help={<p>{t("One row per fuel. A fuel with no instrument behind it is a figure a verifier cannot test.")}</p>}>
            {t("Instruments — fuels")}
          </GroupHeading>
          <InstrumentRows
            anchorId="mmd-fuelInstruments"
            rows={shown.fuelInstruments}
            onChange={(rows) => patch({ fuelInstruments: rows })}
            makeRow={() => emptyMeasurement()}
            addLabel={t("Add a fuel instrument")}
            showCems={shown.directMethod === "measurement"}
            disabled={locked}
            parameterPlaceholder={t("Natural gas consumption")}
            instrumentPlaceholder={MMD_EXAMPLE.instrument}
            emptyHint={
              shown.fuelTypeIds.length === 0
                ? t("Select a fuel above first — then add the instrument that measures it.")
                : t("Add one row per fuel selected above.")
            }
          />
        </div>
      </SectionCard>

      {/* 4 · Electricity */}
      <SectionCard
        title={t("4 · Electricity")}
        helpTitle={t("Electricity, and the meter it is read from")}
        help={
          <>
            <p><strong>{t("What.")}</strong> {t("Where the power comes from, and which meter the reported MWh is read off.")}</p>
            <p className="mt-2"><strong>{t("Why.")}</strong> {t("The source category decides which emission factor is admissible — the grid factor, or a specific generator’s, which needs the contract behind it.")}</p>
            <p className="mt-2"><strong>{t("How.")}</strong> {t("Pick the closest match, then name the meter: the feeder, the meter number, whatever the invoice shows.")}</p>
            <p className="mt-2 text-black/45"><strong>{t("Example.")}</strong> {t("Grid — PEA · 115 kV incoming feeder, substation SS-01, meter PEA-88214.")}</p>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label={t("Electricity source")} hint={t("The category decides which emission factor is admissible, which is why it is a list and not a sentence.")}>
            <SelectWithOther
              value={shown.electricitySupply}
              otherText={shown.electricitySupplyOther}
              onChange={({ value, otherText }) => setElectricitySupply(value, otherText)}
              options={ELECTRICITY_SUPPLY_OPTIONS.map((o) => ({ value: o.id, label: o.label, hint: `${o.category} · ${o.hint}` }))}
              placeholder={t("How is this installation supplied?")}
              otherLabel={t("Other arrangement — specify")}
              otherPlaceholder={t("Describe the supply and who generates it")}
              disabled={locked}
              searchable
              ariaLabel={t("Electricity source")}
            />
          </Field>
          {/* NOT "measurement point" — Annex I item 25 of IR 2025/2547 reserves
              that term for CEMS sampling locations. */}
          <Field label={t("Electricity metering point")} hint={t("Which meter, which feeder, and what the reading is reconciled against.")}>
            <input
              className={cn(inputClass, !shown.electricityMeteringPoint.trim() && "border-[#f59e0b]/50")}
              disabled={locked}
              value={shown.electricityMeteringPoint}
              placeholder={t("115 kV incoming feeder, substation SS-01, meter PEA-88214")}
              onChange={(e) => patch({ electricityMeteringPoint: e.target.value })}
            />
          </Field>
        </div>
        <ExampleToggle example={`${MMD_EXAMPLE.electricitySupply} — ${MMD_EXAMPLE.electricityMeteringPoint}`} />

        <div className="mt-5">
          <GroupHeading helpTitle={t("Instruments — electricity")} help={<p>{t("A row appears here as soon as a supply is chosen. Fill in the meter that evidences the MWh you report.")}</p>}>
            {t("Instruments — electricity")}
          </GroupHeading>
          <InstrumentRows
            anchorId="mmd-electricityInstruments"
            rows={shown.electricityInstruments}
            onChange={(rows) => patch({ electricityInstruments: rows })}
            makeRow={() => electricityInstrument()}
            addLabel={t("Add an electricity meter")}
            disabled={locked}
            parameterPlaceholder={t("Electricity consumption")}
            instrumentPlaceholder={t("PEA revenue meter, 115 kV incomer")}
            emptyHint={t("Choose a source above and a row appears here, ready for the meter details.")}
          />
        </div>
      </SectionCard>

      {/* 4b · Own generation — conditional, and a gate on finalising. */}
      {isOwnGeneration(shown.electricitySupply) && (
        <SectionCard
          title={t("Own generation")}
          helpTitle={t("Why this one question matters")}
          help={
            <>
              <p><strong>{t("What.")}</strong> {t("A check that the fuel your own generation burns has not been left out — or counted twice.")}</p>
              <p className="mt-2"><strong>{t("Why.")}</strong> {t("On-site generation is the easiest place in a CBAM return to double-count: the gas the turbine burns is direct emissions, and the electricity it makes is the same carbon again. Only one may be reported.")}</p>
              <p className="mt-2"><strong>{t("How.")}</strong> {t("Report the FUEL in section 3 and tick the box. Do not also enter the generated MWh as purchased electricity.")}</p>
              <p className="mt-2 text-black/45"><strong>{t("Example.")}</strong> {t("A 2 MW gas cogeneration set: the natural gas is a fuel row; its output is not a separate electricity purchase.")}</p>
            </>
          }
        >
          <label
            id="mmd-ownGenerationFuelDeclared"
            className={cn(
              "flex cursor-pointer items-start gap-3 scroll-mt-32 rounded-xl border px-4 py-3 transition-colors",
              shown.ownGenerationFuelDeclared ? "border-[rgba(5,150,105,0.25)] bg-[#ecfdf5]" : "border-[#f59e0b]/50 bg-[#fffbeb]",
              locked && "pointer-events-none opacity-70",
            )}
          >
            <input
              type="checkbox"
              checked={shown.ownGenerationFuelDeclared}
              disabled={locked}
              onChange={(e) => patch({ ownGenerationFuelDeclared: e.target.checked })}
              className="mt-0.5 h-4 w-4 flex-none accent-[#111]"
            />
            <span className="min-w-0">
              <span className="block text-[13px] text-black/80">{t("The fuel this generation burns is already listed in section 3.")}</span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-black/50">
                {t("If it is not, add it — leaving it out understates direct emissions, and entering the generated electricity as well counts the same carbon twice.")}
              </span>
            </span>
          </label>
        </SectionCard>
      )}

      {/* 5 · Data gaps */}
      <SectionCard
        title={t("5 · Data gaps")}
        helpTitle={t("Data gaps")}
        help={<p>{t(MMD_SECTION_HELP.gaps)}</p>}
        actions={
          !locked && (
            <Button size="sm" variant="secondary" onClick={() => patch({ dataGaps: [...shown.dataGaps, emptyGap()] })}>
              <Plus size={13} strokeWidth={1.5} /> {t("Add gap")}
            </Button>
          )
        }
      >
        {shown.dataGaps.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/10 px-4 py-6 text-center text-[13px] text-black/40">
            {t("No data gaps — every month is primary data. That is the answer a verifier wants; leave it empty if it is true.")}
          </p>
        ) : (
          <div className="space-y-4">
            {shown.dataGaps.map((g, i) => (
              <div key={g.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">Gap {i + 1}</span>
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => patch({ dataGaps: shown.dataGaps.filter((x) => x.id !== g.id) })}
                      className="text-black/30 hover:text-[#dc2626]"
                      aria-label={t("Remove gap")}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Field label={t("From")}>
                    <DatePicker
                      value={g.periodStart}
                      onChange={(iso) => patch({ dataGaps: shown.dataGaps.map((x) => (x.id === g.id ? { ...x, periodStart: iso } : x)) })}
                      min={workspace.periodStart}
                      max={workspace.periodEnd}
                      disabled={locked}
                      ariaLabel={t("Gap start")}
                    />
                  </Field>
                  <Field label={t("To")}>
                    <DatePicker
                      value={g.periodEnd}
                      onChange={(iso) => patch({ dataGaps: shown.dataGaps.map((x) => (x.id === g.id ? { ...x, periodEnd: iso } : x)) })}
                      min={g.periodStart || workspace.periodStart}
                      max={workspace.periodEnd}
                      disabled={locked}
                      ariaLabel={t("Gap end")}
                    />
                  </Field>
                  <Field label={t("Reason")}>
                    <input
                      className={inputClass}
                      disabled={locked}
                      value={g.reason}
                      placeholder={t("Gas meter FT-2201 failed")}
                      onChange={(e) => patch({ dataGaps: shown.dataGaps.map((x) => (x.id === g.id ? { ...x, reason: e.target.value } : x)) })}
                    />
                  </Field>
                  <Field label={t("Estimation method")} hint={t("How, precisely. A verifier has to be able to recompute it.")}>
                    <input
                      className={cn(inputClass, !g.estimationMethod.trim() && "border-[#f59e0b]/50")}
                      disabled={locked}
                      value={g.estimationMethod}
                      placeholder={t("Mean of Feb and Apr consumption per tonne × March output")}
                      onChange={(e) => patch({ dataGaps: shown.dataGaps.map((x) => (x.id === g.id ? { ...x, estimationMethod: e.target.value } : x)) })}
                    />
                  </Field>
                  <Field label={t("Estimated")} hint={t("Feeds the 5% materiality self-check.")}>
                    <NumberInput
                      value={g.estimatedTCO2e}
                      min={0}
                      unit="tCO₂e"
                      disabled={locked}
                      onChange={(v) => patch({ dataGaps: shown.dataGaps.map((x) => (x.id === g.id ? { ...x, estimatedTCO2e: v ?? 0 } : x)) })}
                      ariaLabel={t("Estimated tCO2e")}
                    />
                  </Field>
                  <Field label={t("Reviewer of record")} hint={t("A person, not a department — and this gap's reviewer, not necessarily the year's.")}>
                    <input
                      className={cn(inputClass, !g.reviewerName.trim() && "border-[#f59e0b]/50")}
                      disabled={locked}
                      value={g.reviewerName}
                      placeholder={t("Nattapong S., Production Manager")}
                      onChange={(e) => patch({ dataGaps: shown.dataGaps.map((x) => (x.id === g.id ? { ...x, reviewerName: e.target.value } : x)) })}
                    />
                  </Field>
                  <Field label={t("Date reviewed")} hint={t("When the reviewer above signed off this estimate.")}>
                    <DatePicker
                      value={g.gapDate}
                      onChange={(iso) => patch({ dataGaps: shown.dataGaps.map((x) => (x.id === g.id ? { ...x, gapDate: iso } : x)) })}
                      max={workspace.periodEnd}
                      disabled={locked}
                      ariaLabel={t("Date reviewed")}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
        <ExampleToggle example={MMD_EXAMPLE.dataGap} />
      </SectionCard>

      {/* 6 · Quality assurance */}
      <SectionCard title={t("6 · Quality assurance")} helpTitle={t("Quality assurance")} help={<p>{t(MMD_SECTION_HELP.quality)}</p>}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label={t("Method")}>
            <Select
              value={shown.qualityAssurance}
              onChange={(v) => patch({ qualityAssurance: v as QualityAssurance })}
              options={QUALITY_ASSURANCE_OPTIONS.map((q) => ({ value: q, label: t(QUALITY_ASSURANCE_LABEL[q]) }))}
            />
          </Field>
          <Field label={t("Reviewer of record")} hint={t("A person, not a department. A verifier will ask who.")}>
            <input
              className={inputClass}
              disabled={locked}
              value={shown.reviewerName}
              placeholder={MMD_EXAMPLE.reviewerName}
              onChange={(e) => patch({ reviewerName: e.target.value })}
            />
          </Field>
          <Field label={t("Review frequency")} hint={t("When they look, and what they check it against.")}>
            <input
              className={inputClass}
              disabled={locked}
              value={shown.reviewFrequency}
              placeholder={MMD_EXAMPLE.reviewFrequency}
              onChange={(e) => patch({ reviewFrequency: e.target.value })}
            />
          </Field>
        </div>
        <ExampleToggle example={`${MMD_EXAMPLE.qualityAssurance}; reviewer "${MMD_EXAMPLE.reviewerName}"; ${MMD_EXAMPLE.reviewFrequency.toLowerCase()}`} />
      </SectionCard>

      {/* 7 · Installation diagram */}
      <SectionCard title={t("7 · Installation diagram")} helpTitle={t("Installation diagram")} help={<p>{t(MMD_SECTION_HELP.diagram)}</p>}>
        <Note tone="info">{t(DIAGRAM_NOTE)}</Note>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label
            className={cn(
              "cursor-pointer rounded-xl border border-black/10 px-4 py-2.5 text-[13px] text-black/60 hover:border-black/25 hover:text-black",
              locked && "pointer-events-none opacity-50",
            )}
          >
            <Upload size={13} strokeWidth={1.5} className="mr-1.5 inline" />
            {shown.diagramFileName ? t("Replace diagram") : t("Upload diagram")}
            <input
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) patch({ diagramFileName: f.name });
                e.target.value = "";
              }}
            />
          </label>
          <span className="text-[13px] text-black/50">{shown.diagramFileName ?? t("No diagram attached.")}</span>
        </div>

        {/* The checklist is the point. "Upload a diagram" on its own reliably
            produces a site plan or a fire-escape route, because those are the
            drawings a plant already has. Naming what the drawing has to show
            turns the upload into a decision rather than a search. */}
        <div className="mt-5">
          <div className="mb-2 text-[11px] uppercase tracking-[0.1em] text-black/55">{t("What the drawing has to show")}</div>
          <ul className="space-y-1.5">
            {DIAGRAM_REQUIREMENTS.map((req, i) => {
              const on = shown.diagramCovers.includes(i);
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() =>
                      patch({ diagramCovers: on ? shown.diagramCovers.filter((n) => n !== i) : [...shown.diagramCovers, i] })
                    }
                    className="flex w-full items-start gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-[#faf9f7] disabled:pointer-events-none"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-[5px] border text-white",
                        on ? "border-transparent bg-[#111]" : "border-black/20",
                      )}
                    >
                      {on && <span className="text-[10px] leading-none">✓</span>}
                    </span>
                    <span className={cn("text-[12.5px] leading-relaxed", on ? "text-black/70" : "text-black/45")}>{t(req)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {shown.diagramFileName && shown.diagramCovers.length < DIAGRAM_REQUIREMENTS.length && (
            <p className="mt-2 text-[12px] text-[#b45309]">
              {t("{left} of {total} still unticked. Anything left unticked is a question a verifier will have to ask.", {
                left: DIAGRAM_REQUIREMENTS.length - shown.diagramCovers.length,
                total: DIAGRAM_REQUIREMENTS.length,
              })}
            </p>
          )}
        </div>
      </SectionCard>

      {/* 8 · Documents behind the methodology.

          These used to live on an Evidence tab. Installation identity and the
          calibration file are things the MMD asserts — "instrument FT-2201,
          last calibrated 12 March" — and the document that proves the
          assertion belongs beside the assertion, not two tabs away. */}
      <SectionCard
        title={t("8 · Documents")}
        helpTitle={t("What to attach here")}
        help={
          <>
            <p>{t("The paperwork behind what this methodology claims about the installation itself.")}</p>
            <p className="mt-2">
              <strong>{t("Installation identity")}</strong> {t("— a registration certificate, licence or utility bill that ties the legal name and address above to a real site.")}
            </p>
            <p className="mt-2">
              <strong>{t("Calibration records")}</strong> {t("— the certificates for the instruments listed in section 4. An uncalibrated instrument is the fastest route to a qualified opinion, and the certificate is what closes it.")}
            </p>
            <p className="mt-2">{t("Monthly bills and meter logs do not go here — they attach inside the month they belong to.")}</p>
          </>
        }
      >
        <SectionEvidence
          workspaceId={workspace.id}
          keys={ANNUAL_REQUIRED_KEYS}
          emptyLabel={t("Nothing attached yet. A verifier asks for both of these on day one.")}
          onChange={refresh}
        />
        <ExampleToggle example={t("“Factory-licence-TH-RAYONG-01.pdf” for identity; “FT-2201-calibration-2026-03-12.pdf” for the gas meter named in section 4.")} />
      </SectionCard>

      {issues.length > 0 && !locked && (
        <Note tone="warn">
          <strong>{t("Before finalising:")}</strong>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            {issues.map((i, n) => (
              <li key={n}>{t(i.message)}</li>
            ))}
          </ul>
        </Note>
      )}
    </div>
  );
}

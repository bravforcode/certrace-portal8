"use client";

/* ════════════════════════════════════════════════════════════
   THE MONTH'S READINGS — the one form the plant fills in each month

   The same component on the plant's link (app/w/[token]) and on the exporter's
   month screen, field for field, so the two cannot drift.

   WHAT IS IN IT is what Annex IV to Implementing Regulation (EU) 2025/2547
   asks for that only the plant can read off its own meters and records, once a
   month. The box in front of each label is the item it feeds in the operator's
   emissions report; its colour is the marker — ink with white digits is
   required, a white box is optional, and a tap or hover names it.

     13 · 34(a)  production                       Production
     14          other goods on the same process   Production
     16(a)       fuels and process materials       Fuels, Process emissions
     9 · 10 · 11 · 12 · 32 · 33   electricity      Electricity
     16(b)       continuously measured emissions   Also report
     16(d)       CO₂ received and sent on          Also report
     17          heat, waste-gas and electricity balances   Also report
     16(e)       gaps and estimates                Notes

   WHAT IS NOT IN IT: the installation's identity (entered once, on the
   installation's Overview) and the precursors (the product report's Precursors
   tab). Asking a plant manager for either, every month, was asking them for
   something they cannot read off a meter.

   EASY BEFORE CLEVER. A required box is only ever a box the arithmetic needs;
   everything else is optional and out of the way. The checklist on top says in
   one line what the month still needs and jumps to it. Lists that the standard
   closes (fuels, materials, units, electricity sources) are dropdowns with the
   whole standard in them and an "Other, say what" where the standard allows
   one; anything the plant might not have — a CEMS, a CO₂ transfer, heat sold
   to the neighbour — sits in "Also report this month", open when the
   installation's own answers say it applies and shut when they do not.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { AiNumberInput } from "@/components/intake/ai-badge";
import { Button, Checkbox, NumberInput, inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { SectionCard, fmt } from "@/components/workspace/chrome";
import { AnnexLegend, TaggedField } from "@/components/precursor/annex-fields";
import { anchor, EmptyNote, RowCard, useMonthFocus } from "@/components/supplier/month-pieces";
import { CompositionCard, FluxesCard, MaterialsCard, PfcCard, ScrapCard } from "@/components/supplier/sector-blocks";
import { QuantityBasis } from "@/components/supplier/quantity-basis";
import { WasteGasRows } from "@/components/supplier/waste-gas-rows";
import { packFor, type SectorPack } from "@/lib/cbam/sector-pack";
import { COUNTRIES } from "@/lib/config";
import { getInstallation } from "@/lib/installations";
import {
  applyEuStandard,
  biomassEvidenceKey,
  electricityFactorFor,
  ELECTRICITY_FACTOR_SOURCES,
  ELECTRICITY_FACTOR_SOURCE_LABEL,
  emptyElectricitySource,
  emptyFuel,
  emptyProcessEmissionEntry,
  fuelEvidenceKey,
  fuelFamilyLabelIn,
  fuelTypeDef,
  fuelNcvNoteIn,
  fuelTypeLabelIn,
  fuelTypeNoteIn,
  FUEL_FACTOR_SOURCES,
  FUEL_FACTOR_SOURCE_LABEL,
  FUEL_FAMILIES,
  FUEL_TYPE_OTHER,
  FUEL_TYPES,
  isTypeIStandard,
  MEASURED_GAS_LABEL,
  monthIssues,
  MONTHLY_FUEL_UNITS,
  ncvFieldHint,
  processEmissionEntryTCO2,
  resolvedOxidationFactor,
  uid,
  type FlowBalance,
  type FuelEntry,
  type MeasuredGas,
  type MonthlyEntry,
  type MonthlyFuelUnit,
} from "@/lib/monthly-data";
import { CARBON_CONTENTS, STANDARD_MATERIALS } from "@/lib/cbam/process-factors";
import { workspaceRequiresIndirectEmissions } from "@/lib/cbam/product-category-rules";
import { translate, useLanguage, useT } from "@/lib/i18n";
import { coverageForMonth } from "@/lib/workspace-evidence";
import { getWorkspace } from "@/lib/workspace";
import { quantityBasisOf } from "@/lib/monthly-inputs";
import { categoryForCn, specialParametersFor } from "@/lib/cbam/template-reference";

export const UNIT_LABEL: Record<MonthlyFuelUnit, string> = { m3: "m³", kg: "kg", t: "t", l: "litres", GJ: "GJ" };

export { anchor };

export function useFuelOptions() {
  const { lang } = useLanguage();
  return React.useMemo(
    () =>
      FUEL_FAMILIES.flatMap((family) =>
        FUEL_TYPES.filter((f) => f.family === family).map((f) => ({
          value: f.id,
          label: fuelTypeLabelIn(lang, f.id),
          hint: [fuelFamilyLabelIn(lang, family), fuelNcvNoteIn(lang, f.id), fuelTypeNoteIn(lang, f.id)].filter(Boolean).join(" · "),
        })),
      ).concat([{ value: FUEL_TYPE_OTHER, label: translate(lang, "Other fuel"), hint: "" }]),
    [lang],
  );
}

/* ── Small shared pieces ────────────────────────────────────── */

const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: c.name, hint: c.code }));

/* ── What this month still needs ─────────────────────────────── */

type NeedItem = { key: string; label: string; target: string; open: number };

function NeedsStrip({ entry, pack }: { entry: MonthlyEntry; pack: SectorPack | null }) {
  const t = useT();
  const errors = monthIssues(entry).filter((i) => i.severity === "error");
  const count = (test: (field: string) => boolean) => errors.filter((e) => test(e.field)).length;
  const items: NeedItem[] = [
    { key: "production", label: t("Production"), target: "production", open: count((f) => f === "production") },
  ];
  // The materials of a steel or aluminium route sit before the fuels, the way the form does.
  if (pack && (pack.materials.length > 0 || (entry.processEmissionEntries ?? []).some((e) => e.method === "mass_balance"))) {
    items.push({ key: "materials", label: pack.sector === "steel" ? t("Raw materials") : t("Anodes and electrodes"), target: "materials", open: count((f) => f.startsWith("processEntry:") && (entry.processEmissionEntries ?? []).some((e) => e.method === "mass_balance" && f.startsWith(`processEntry:${e.id}:`))) });
  }
  if (pack?.scrapBlock) items.push({ key: "scrap", label: t("Scrap"), target: "scrap", open: count((f) => f.startsWith("scrap:")) });
  items.push(
    { key: "fuels", label: t("Fuels"), target: "fuels", open: count((f) => f.startsWith("fuel:")) },
    { key: "electricity", label: t("Electricity"), target: "electricity", open: count((f) => f === "electricity" || f === "electricityFactor") },
    {
      key: "process",
      label: pack ? t("Fluxes and chemicals") : t("Process emissions"),
      target: "processBasis",
      open: count((f) => f === "processBasis" || (f.startsWith("processEntry:") && (entry.processEmissionEntries ?? []).some((e) => e.method === "standard" && f.startsWith(`processEntry:${e.id}:`)))),
    },
  );
  if (pack?.pfc) items.push({ key: "pfc", label: t("PFC"), target: "pfc", open: count((f) => f.startsWith("pfc:") && f !== "pfc:double") });
  if ((entry.measuredEmissions ?? []).length > 0) {
    items.push({ key: "measured", label: t("Measured emissions"), target: "measured", open: count((f) => f.startsWith("measured:")) });
  }
  const outstanding = items.reduce((a, i) => a + i.open, 0);

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.1em] text-black/40">{t("What this month needs")}</span>
        <span className={cn("font-mono text-[11px]", outstanding === 0 ? "text-[#047857]" : "text-[#b45309]")}>
          {outstanding === 0 ? t("Everything needed is in") : outstanding === 1 ? t("1 thing to fix") : t("{n} things to fix", { n: outstanding })}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <button
            key={i.key}
            type="button"
            onClick={() => document.getElementById(anchor(i.target))?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
              i.open === 0
                ? "border-[rgba(5,150,105,0.25)] bg-[#ecfdf5] text-[#047857] hover:border-[rgba(5,150,105,0.5)]"
                : "border-[rgba(180,83,9,0.25)] bg-[#fffbeb] text-[#b45309] hover:border-[rgba(180,83,9,0.5)]",
            )}
          >
            {i.open === 0 ? <Check size={12} strokeWidth={2} /> : <span className="h-1.5 w-1.5 rounded-full bg-[#b45309]" />}
            {i.label}
            {i.open > 0 && <span className="font-mono text-[10.5px]">· {i.open}</span>}
          </button>
        ))}
      </div>
      <AnnexLegend className="mt-4" showNeed noVr />
    </div>
  );
}

/* ── An optional block that opens when it applies ───────────────
   "Also report this month". Shut by default, so a plant with nothing to say
   scrolls past four lines rather than four forms; open when the installation's
   own monitoring plan says it applies, or when something is already entered,
   so a figure can never be hidden behind a closed block. */
function ExtraBlock({
  id,
  title,
  tag,
  applies,
  hasData,
  help,
  openByDefault,
  children,
}: {
  id: string;
  title: string;
  tag: string;
  applies: boolean;
  hasData: boolean;
  help: string;
  /** a route that almost always has this (process gases at a blast furnace) opens it without claiming the plant said so */
  openByDefault?: boolean;
  children: React.ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = React.useState(applies || hasData || Boolean(openByDefault));
  // Opens itself the moment data lands in it (a smart-upload fill, a copied
  // month) — it never shuts on the reader while they type.
  React.useEffect(() => {
    if (hasData) setOpen(true);
  }, [hasData]);
  return (
    <div id={id} className="scroll-mt-32 rounded-xl border border-black/[0.07]">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <ChevronDown size={15} strokeWidth={1.5} className={cn("flex-none text-black/35 transition-transform", !open && "-rotate-90")} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] text-black/80">{title}</span>
            <span className="rounded-[5px] border border-black/25 bg-white px-1.5 font-mono text-[10px] leading-[18px] text-black/65">{tag}</span>
            {applies && (
              <span className="rounded-full bg-[#eff6ff] px-2 py-[2px] text-[9.5px] uppercase tracking-[0.1em] text-[#1d4ed8]">{t("Applies at this installation")}</span>
            )}
          </span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-black/45">{help}</span>
        </span>
        {hasData && <span className="font-mono text-[10.5px] text-[#047857]">{t("Entered")}</span>}
      </button>
      {open && <div className="border-t border-black/[0.06] px-4 py-4">{children}</div>}
    </div>
  );
}

function FlowEditor({
  value,
  onChange,
  readOnly,
  aria,
}: {
  value: FlowBalance | undefined;
  onChange: (next: FlowBalance) => void;
  readOnly: boolean;
  aria: string;
}) {
  const t = useT();
  const v = value ?? {};
  const set = (p: FlowBalance) => onChange({ ...v, ...p });
  const field = (key: keyof FlowBalance, label: string, hint?: string) => (
    <TaggedField tag="17" need="optional" label={label} hint={hint}>
      <NumberInput value={v[key]} min={0} unit="GJ" disabled={readOnly} onChange={(n) => set({ [key]: n })} ariaLabel={`${aria}: ${label}`} />
    </TaggedField>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {field("imported", t("Came in from other installations"))}
      {field("produced", t("Produced here"))}
      {field("consumed", t("Used here"))}
      {field("exported", t("Sent to other installations"))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */

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
  useMonthFocus();
  const fuelOptions = useFuelOptions();
  const ws = getWorkspace(workspaceId);
  const requiresIndirect = ws ? workspaceRequiresIndirectEmissions(ws.productId) : false;
  const coverage = coverageForMonth(workspaceId, entry, requiresIndirect);
  const fuelIsEvidenced = (fuelId: string) => coverage.rows.find((r) => r.key === fuelEvidenceKey(fuelId))?.covered ?? false;
  // The installation's own answers decide which optional blocks open by themselves.
  const monitoring = ws ? getInstallation(ws.installationId)?.monitoring : undefined;
  // Steel and aluminium open with the rows their route really has; any other good keeps the general form.
  const pack = React.useMemo(() => (ws ? packFor(ws) : null), [ws]);
  // Mn, Cr and Ni are asked for the goods whose category the EU template asks them for.
  const alloyed = React.useMemo(() => {
    const cat = categoryForCn(ws?.cnCode);
    return Boolean(cat && specialParametersFor(cat.id).includes("% Mn"));
  }, [ws?.cnCode]);
  const sources = entry.electricitySources ?? [];
  const setSource = (id: string, p: Partial<(typeof sources)[number]>) => patch({ electricitySources: sources.map((x) => (x.id === id ? { ...x, ...p } : x)) });

  const nonCbam = entry.nonCbamGoods ?? [];
  const measured = entry.measuredEmissions ?? [];
  const heatHas = Object.values(entry.heatGj ?? {}).some((n) => (n ?? 0) > 0);
  const wasteHas = Object.values(entry.wasteGasGj ?? {}).some((n) => (n ?? 0) > 0);

  return (
    <div className={cn("space-y-5", readOnly && "pointer-events-none opacity-60")}>
      {!readOnly && <NeedsStrip entry={entry} pack={pack} />}

      {/* ══ PRODUCTION · 13 · 34(a) · 14 ══ */}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <TaggedField id={anchor("production")} tag="13 · 34(a)" need="required" label={t("Produced this month")} hint={t("Tonnes of saleable output of this good.")}>
            <AiNumberInput
              aiScope={`ws:${workspaceId}`}
              aiKey={`${entry.month}:production`}
              value={entry.productionTonnes || undefined}
              min={0}
              unit="t"
              disabled={readOnly}
              onChange={(v) => patch({ productionTonnes: v ?? 0 })}
              ariaLabel={t("Production tonnes")}
              placeholder="4820.5"
            />
          </TaggedField>
        </div>

        <div className="mt-5 border-t border-black/[0.06] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[13px] text-black/75">{t("Other goods made on the same process")}</span>
              <p className="mt-0.5 text-[12px] leading-relaxed text-black/45">{t("Goods that are not CBAM goods — only if the plant makes any. Leave empty if it does not.")}</p>
            </div>
            {!readOnly && (
              <Button size="sm" variant="secondary" onClick={() => patch({ nonCbamGoods: [...nonCbam, { id: uid(), name: "", tonnes: 0 }] })}>
                <Plus size={12} strokeWidth={1.5} /> {t("Add a good")}
              </Button>
            )}
          </div>
          {nonCbam.length > 0 && (
            <div className="mt-3 space-y-3">
              {nonCbam.map((g, i) => (
                <RowCard key={g.id} title={`${t("Good")} ${i + 1}`} removeLabel={`${t("Remove good")} ${i + 1}`} onRemove={readOnly ? undefined : () => patch({ nonCbamGoods: nonCbam.filter((x) => x.id !== g.id) })}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TaggedField id={anchor(`nonCbam:${g.id}:name`)} tag="14" need="optional" label={t("Name of the good")}>
                      <input
                        className={inputClass}
                        value={g.name}
                        disabled={readOnly}
                        onChange={(e) => patch({ nonCbamGoods: nonCbam.map((x) => (x.id === g.id ? { ...x, name: e.target.value } : x)) })}
                        placeholder={t("Galvanised sheet")}
                      />
                    </TaggedField>
                    <TaggedField tag="14" need="optional" label={t("Quantity made")} hint={t("Tonnes this month.")}>
                      <NumberInput
                        value={g.tonnes || undefined}
                        min={0}
                        unit="t"
                        disabled={readOnly}
                        onChange={(v) => patch({ nonCbamGoods: nonCbam.map((x) => (x.id === g.id ? { ...x, tonnes: v ?? 0 } : x)) })}
                        ariaLabel={`${t("Quantity of")} ${g.name || `${t("good")} ${i + 1}`}`}
                      />
                    </TaggedField>
                  </div>
                </RowCard>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* ══ RAW MATERIALS AND CARBON · SCRAP — steel and aluminium, in the order the plant thinks of them:
             what it makes, what goes in, what it burns ══ */}
      {pack && (pack.materials.length > 0 || (entry.processEmissionEntries ?? []).some((e) => e.method === "mass_balance")) && (
        <MaterialsCard pack={pack} entry={entry} patch={patch} readOnly={readOnly} />
      )}
      {pack?.scrapBlock && <ScrapCard entry={entry} patch={patch} readOnly={readOnly} />}

      {/* ══ FUELS · 16(a) ══ */}
      <SectionCard
        title={t("Fuels burned")}
        helpTitle={t("Fuels")}
        blurb={pack ? `${t("Usually:")} ${t(pack.fuelHint)}` : undefined}
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
        {entry.fuels.length === 0 ? (
          <EmptyNote id={anchor("fuels")}>{t("No fuel recorded. If this installation burned nothing this month, that is a valid answer — leave it empty.")}</EmptyNote>
        ) : (
          <div id={anchor("fuels")} className="scroll-mt-32 space-y-4">
            {entry.fuels.map((f, i) => {
              const def = fuelTypeDef(f.fuelType);
              const needsNcv = f.unit !== "GJ";
              const typeILocked = isTypeIStandard(f.factorSource);
              const evidenced = fuelIsEvidenced(f.id);
              const typeIIWaitingOnDocument = !typeILocked && !evidenced;
              const factorFieldsDisabled = readOnly || typeILocked || typeIIWaitingOnDocument;
              const measuredOf = f.oxidationFactorSource === "measured";
              return (
                <RowCard
                  key={f.id}
                  title={`${t("Fuel")} ${i + 1}`}
                  removeLabel={`${t("Remove fuel")} ${i + 1}`}
                  onRemove={readOnly ? undefined : () => patch({ fuels: entry.fuels.filter((x) => x.id !== f.id) })}
                >
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <TaggedField id={anchor(`fuel:${f.id}:type`)} tag="16(a)" need="required" label={t("Fuel")}>
                      <Select
                        value={f.fuelType}
                        onChange={(v) => {
                          const unit = fuelTypeDef(v)?.typicalUnit ?? f.unit;
                          const locked = applyEuStandard({ ...f, fuelType: v, unit });
                          patchFuel(f.id, { fuelType: v, unit, efTco2PerGj: locked.efTco2PerGj, ncvMjPerUnit: locked.ncvMjPerUnit, ...(v === FUEL_TYPE_OTHER ? {} : { fuelTypeOther: "" }) });
                        }}
                        options={fuelOptions}
                        searchable
                        placeholder={t("Pick a fuel")}
                        ariaLabel={t("Fuel type")}
                      />
                    </TaggedField>
                    {f.fuelType === FUEL_TYPE_OTHER && (
                      <TaggedField tag="16(a)" need="required" label={t("Name of the fuel")} hint={t("In the words your invoices use.")}>
                        <input
                          className={inputClass}
                          value={f.fuelTypeOther ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchFuel(f.id, { fuelTypeOther: e.target.value })}
                          placeholder={t("Rice husk pellets")}
                        />
                      </TaggedField>
                    )}
                    <TaggedField
                      id={anchor(`fuel:${f.id}:quantity`)}
                      tag="16(a)"
                      need="required"
                      label={t("Quantity")}
                      hint={quantityBasisOf(f) === "reading" ? t("The metered figure for this month.") : quantityBasisOf(f) === "stock" ? t("Worked out from the stock change below.") : t("This good's share of the shared meter below.")}
                    >
                      <AiNumberInput
                        aiScope={`ws:${workspaceId}`}
                        aiKey={`${entry.month}:fuel:${f.id}`}
                        value={f.quantity || undefined}
                        min={0}
                        unit={t(UNIT_LABEL[f.unit])}
                        disabled={readOnly || quantityBasisOf(f) !== "reading"}
                        onChange={(v) => patchFuel(f.id, { quantity: v ?? 0 })}
                        ariaLabel={t("Quantity")}
                        placeholder="182400"
                      />
                    </TaggedField>
                    <TaggedField tag="16(a)" need="required" label={t("Unit")}>
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
                    </TaggedField>
                    <TaggedField
                      id={anchor(`fuel:${f.id}:ncv`)}
                      tag="16(a)"
                      need={needsNcv ? "required" : "optional"}
                      label={t("Calorific value")}
                      hint={needsNcv ? (f.fuelType ? t(ncvFieldHint(f, def?.typicalNcv)) : t("Pick the fuel first — the standard value fills in.")) : t("Not needed for GJ.")}
                    >
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
                    </TaggedField>
                    <TaggedField
                      id={anchor(`fuel:${f.id}:ef`)}
                      tag="16(a)"
                      need="required"
                      label={t("Emission factor")}
                      hint={typeILocked ? t("Locked to the EU standard value.") : t("Per gigajoule, never per m³ or litre — a volume factor is roughly 25× out.")}
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
                    </TaggedField>
                    <TaggedField id={anchor(`fuel:${f.id}:factorSource`)} tag="16(a)" need="required" label={t("Factor source")} hint={t("Where the calorific value and factor come from.")}>
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
                    </TaggedField>
                  </div>

                  <QuantityBasis
                    stock={f.stock}
                    shared={f.shared}
                    onChange={(p) => patchFuel(f.id, p)}
                    unit={t(UNIT_LABEL[f.unit])}
                    readOnly={readOnly}
                    workspaceId={workspaceId}
                    entry={entry}
                    fieldKey={`fuel:${f.id}`}
                  />

                  {typeIIWaitingOnDocument && (
                    <p className="mt-3 text-[12px] leading-relaxed text-[#b45309]">
                      {t("Calorific value and emission factor unlock once a spec sheet, invoice or lab report is attached on the Documents step.")}
                    </p>
                  )}

                  {/* ── The optional parts of a fuel row ──
                      Out of the way until they are wanted: a biomass fraction
                      only on a biomass fuel, the oxidation factor behind its
                      own choice, the electricity flag as a tick. */}
                  <div className="mt-4 grid gap-4 border-t border-black/[0.06] pt-4 sm:grid-cols-2 xl:grid-cols-3">
                    <TaggedField
                      id={anchor(`fuel:${f.id}:ox`)}
                      tag="16(a)"
                      need="optional"
                      label={t("Oxidation factor")}
                      hint={t("Leave on 1 unless you measure the carbon left in the ash — 1 is always allowed.")}
                    >
                      <Select
                        value={measuredOf ? "measured" : "conservative_default"}
                        onChange={(v) =>
                          patchFuel(f.id, v === "measured" ? { oxidationFactorSource: "measured" } : { oxidationFactorSource: "conservative_default", oxidationFactor: 1, cAsh: undefined, cTotal: undefined })
                        }
                        options={[
                          { value: "conservative_default", label: t("1 — everything burns (default)") },
                          { value: "measured", label: t("Measured from the ash analysis") },
                        ]}
                        ariaLabel={t("Oxidation factor")}
                      />
                    </TaggedField>
                    {measuredOf && (
                      <>
                        <TaggedField tag="16(a)" need="required" label={t("Carbon in ash and flue-gas dust")} hint={t("From the laboratory result.")}>
                          <NumberInput value={f.cAsh} min={0} unit="t C" disabled={readOnly} onChange={(v) => patchFuel(f.id, { cAsh: v })} ariaLabel={t("Carbon in ash")} />
                        </TaggedField>
                        <TaggedField
                          tag="16(a)"
                          need="required"
                          label={t("Total carbon in the fuel burned")}
                          hint={`${t("Gives an oxidation factor of")} ${fmt(resolvedOxidationFactor(f), 4)}.`}
                        >
                          <NumberInput value={f.cTotal} min={0} unit="t C" disabled={readOnly} onChange={(v) => patchFuel(f.id, { cTotal: v })} ariaLabel={t("Total carbon")} />
                        </TaggedField>
                      </>
                    )}
                    {def?.family === "Biomass" &&
                      (() => {
                        const biomassEvidenced = coverage.rows.find((r) => r.key === biomassEvidenceKey(f.id))?.covered ?? false;
                        const bfLocked = readOnly || !biomassEvidenced;
                        return (
                          <TaggedField
                            id={anchor(`fuel:${f.id}:bf`)}
                            tag="16(a)"
                            need="optional"
                            label={t("Biomass fraction")}
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
                          </TaggedField>
                        );
                      })()}
                  </div>
                  {def?.family === "Biomass" && !coverage.rows.find((r) => r.key === biomassEvidenceKey(f.id))?.covered && !readOnly && (
                    <p className="mt-2 text-[12px] leading-relaxed text-[#b45309]">
                      {t("A biomass fraction above zero needs the sustainability criteria evidenced first — attach it on the Documents step.")}
                    </p>
                  )}
                  <div className="mt-4 flex items-start gap-2">
                    <span className="mt-0.5 inline-flex flex-none rounded-[5px] border border-black/30 bg-white px-1.5 font-mono text-[10px] leading-[18px] text-black/75">12</span>
                    <Checkbox
                      checked={Boolean(f.usedForSelfGeneratedElectricity)}
                      disabled={readOnly}
                      onChange={(v) => patchFuel(f.id, { usedForSelfGeneratedElectricity: v })}
                      label={t("Burned to generate this month’s self-generated electricity.")}
                    />
                  </div>
                </RowCard>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ══ ELECTRICITY · 9 · 10 · 11 · 12 · 32 · 33 ══ */}
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
            <Button size="sm" variant="secondary" onClick={() => patch({ electricitySources: [...sources, emptyElectricitySource()] })}>
              <Plus size={12} strokeWidth={1.5} /> {t("Add source")}
            </Button>
          )
        }
      >
        <div id={anchor("electricity")} className="scroll-mt-32 space-y-4">
          {sources.length === 0 ? (
            <EmptyNote>
              {requiresIndirect
                ? t("No electricity source recorded. Add one, even if the plant drew nothing this month.")
                : t("No electricity source recorded. It is optional for this good — only direct emissions count for it. Add it if you have it.")}
            </EmptyNote>
          ) : (
            sources.map((s, i) => {
              const isGrid = s.sourceType === "grid_default";
              const isSelfGen = s.sourceType === "self_generated";
              const external = !isGrid && !isSelfGen; // a PPA or a direct technical link: somebody else's generator
              const derived = isGrid || isSelfGen;
              const gridAwaiting = isGrid && s.factorTco2PerMwh == null;
              return (
                <RowCard
                  key={s.id}
                  title={`${t("Source")} ${i + 1}`}
                  removeLabel={`${t("Remove source")} ${i + 1}`}
                  onRemove={readOnly ? undefined : () => patch({ electricitySources: sources.filter((x) => x.id !== s.id) })}
                >
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <TaggedField tag="12" need={requiresIndirect ? "required" : "optional"} label={t("Where it comes from")}>
                      <Select
                        value={s.sourceType}
                        onChange={(v) => {
                          const sourceType = v as MonthlyEntry["electricityFactorSource"];
                          setSource(s.id, { sourceType, factorTco2PerMwh: sourceType === "grid_default" ? electricityFactorFor("grid_default") : null });
                        }}
                        options={ELECTRICITY_FACTOR_SOURCES.map((x) => ({ value: x, label: ELECTRICITY_FACTOR_SOURCE_LABEL[x] }))}
                        ariaLabel={t("Electricity source type")}
                      />
                    </TaggedField>
                    <TaggedField tag="10 · 12" need={requiresIndirect ? "required" : "optional"} label={t("Consumed")} hint={t("Absolute MWh, real power only.")}>
                      <AiNumberInput
                        aiScope={`ws:${workspaceId}`}
                        aiKey={`${entry.month}:elec:${s.id}`}
                        value={s.mwh || undefined}
                        min={0}
                        unit="MWh"
                        disabled={readOnly || Boolean(s.shared)}
                        onChange={(v) => setSource(s.id, { mwh: v ?? 0 })}
                        ariaLabel={t("Electricity MWh")}
                        placeholder="2140"
                      />
                    </TaggedField>
                    <TaggedField
                      id={anchor(`electricityFactor`)}
                      tag={s.sourceType === "ppa" ? "12 · 33" : "12 · 32"}
                      need={requiresIndirect ? "required" : "optional"}
                      label={t("Emission factor")}
                      hint={
                        isGrid
                          ? gridAwaiting
                            ? t("Awaiting the published EU country default — cannot be typed.")
                            : t("Locked to the published country default.")
                          : isSelfGen
                            ? t("Worked out from the fuel rows above flagged for self-generation.")
                            : s.sourceType === "ppa"
                              ? t("The factor stated in the power purchase agreement.")
                              : t("The connected generator's own figure.")
                      }
                    >
                      <NumberInput
                        value={s.factorTco2PerMwh ?? undefined}
                        min={0}
                        unit="tCO₂/MWh"
                        disabled={readOnly || derived}
                        invalid={gridAwaiting}
                        /* `null`, not `undefined`, for a cleared box — an
                           ElectricitySourceRow spells "nothing entered" as null,
                           and undefined would drop the key on the way through JSON. */
                        onChange={(v) => setSource(s.id, { factorTco2PerMwh: v ?? null })}
                        ariaLabel={t("Electricity factor")}
                        placeholder="0.45"
                      />
                    </TaggedField>
                    {external && (
                      <>
                        <TaggedField tag="12" need="optional" label={t("Country it is generated in")} hint={t("Leave empty if it is the installation's own country.")}>
                          <Select
                            value={s.country ?? ""}
                            onChange={(v) => setSource(s.id, { country: v })}
                            options={countryOptions}
                            searchable
                            placeholder={t("Same as the installation")}
                            ariaLabel={t("Country of origin of the electricity")}
                          />
                        </TaggedField>
                        <TaggedField tag="11" need="optional" label={t("Installation it comes from")} hint={t("The generator, by name — and its operator if you know it.")}>
                          <input
                            className={inputClass}
                            value={s.supplierInstallation ?? ""}
                            disabled={readOnly}
                            onChange={(e) => setSource(s.id, { supplierInstallation: e.target.value })}
                            placeholder={t("Rayong Solar Farm 2")}
                          />
                        </TaggedField>
                      </>
                    )}
                  </div>
                  <QuantityBasis
                    shared={s.shared}
                    onChange={(p) => setSource(s.id, { shared: p.shared })}
                    unit="MWh"
                    readOnly={readOnly}
                    allowStock={false}
                    sharedTag="26 · 29"
                    workspaceId={workspaceId}
                    entry={entry}
                    fieldKey={`electricity:${s.id}`}
                  />
                </RowCard>
              );
            })
          )}
        </div>
        {requiresIndirect && (
          <div className="mt-5 grid gap-4 border-t border-black/[0.06] pt-4 sm:grid-cols-2">
            <TaggedField
              tag="9"
              need="optional"
              label={t("Everything the whole installation drew")}
              hint={t("Only if the plant makes other goods as well — the figure on the main meter. Leave empty if this good is all it makes.")}
            >
              <NumberInput
                value={entry.electricityInstallationTotalMwh}
                min={0}
                unit="MWh"
                disabled={readOnly}
                onChange={(v) => patch({ electricityInstallationTotalMwh: v })}
                ariaLabel={t("Total electricity of the installation")}
              />
            </TaggedField>
          </div>
        )}
      </SectionCard>

      {/* ══ FLUXES AND CHEMICALS · PFC — steel and aluminium ══ */}
      {pack && <FluxesCard pack={pack} entry={entry} patch={patch} readOnly={readOnly} />}
      {pack?.pfc && <PfcCard pack={pack} entry={entry} patch={patch} readOnly={readOnly} />}
      {pack?.sector === "steel" && alloyed && <CompositionCard entry={entry} patch={patch} readOnly={readOnly} />}

      {/* ══ PROCESS EMISSIONS · 16(a) — every other good ══ */}
      {!pack && (
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
            <Button size="sm" variant="secondary" onClick={() => patch({ processEmissionEntries: [...(entry.processEmissionEntries ?? []), emptyProcessEmissionEntry()] })}>
              <Plus size={12} strokeWidth={1.5} /> {t("Add entry")}
            </Button>
          )
        }
      >
        <div id={anchor("processBasis")} className="scroll-mt-32 space-y-4">
          {(entry.processEmissionEntries ?? []).length === 0 ? (
            <EmptyNote>{t("No process emissions recorded. Leave empty if there are none.")}</EmptyNote>
          ) : (
            (entry.processEmissionEntries ?? []).map((e, i) => {
              const isStandard = e.method === "standard";
              const materialOptions = isStandard
                ? STANDARD_MATERIALS.map((m) => ({ value: m.id, label: m.label, hint: `${m.tco2PerUnit} tCO₂/${m.unit}` }))
                : CARBON_CONTENTS.map((c) => ({ value: c.material, label: c.label, hint: `${c.tCPerT} t C/t` }));
              const rows = entry.processEmissionEntries ?? [];
              return (
                <RowCard
                  key={e.id}
                  title={`${t("Entry")} ${i + 1}`}
                  removeLabel={`${t("Remove entry")} ${i + 1}`}
                  onRemove={readOnly ? undefined : () => patch({ processEmissionEntries: rows.filter((x) => x.id !== e.id) })}
                >
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <TaggedField tag="16(a)" need="required" label={t("Method")} hint={isStandard ? t("Quantity × the material's factor.") : t("Carbon in, carbon out.")}>
                      <Select
                        value={e.method}
                        onChange={(v) => {
                          const method = v as "standard" | "mass_balance";
                          patch({
                            processEmissionEntries: rows.map((x) =>
                              x.id === e.id
                                ? method === "standard"
                                  ? { id: x.id, method: "standard" as const, materialId: "", quantityT: 0, conversionFactor: 1, note: x.note }
                                  : { id: x.id, method: "mass_balance" as const, materialId: "", quantityT: 0, note: x.note }
                                : x,
                            ),
                          });
                        }}
                        options={[
                          { value: "standard", label: t("Standard method") },
                          { value: "mass_balance", label: t("Mass balance") },
                        ]}
                        ariaLabel={t("Process emission method")}
                      />
                    </TaggedField>
                    <TaggedField id={anchor(`processEntry:${e.id}:material`)} tag="16(a)" need="required" label={t("Material")}>
                      <Select
                        value={e.materialId}
                        onChange={(v) => patch({ processEmissionEntries: rows.map((x) => (x.id === e.id ? { ...x, materialId: v } : x)) })}
                        options={materialOptions}
                        searchable
                        placeholder={t("Pick a material")}
                        ariaLabel={t("Process emission material")}
                      />
                    </TaggedField>
                    <TaggedField id={anchor(`processEntry:${e.id}:quantity`)} tag="16(a)" need="required" label={t("Quantity")} hint={isStandard ? t("Tonnes.") : t("Tonnes — negative for an output stream.")}>
                      <NumberInput
                        value={e.quantityT || undefined}
                        unit="t"
                        disabled={readOnly || Boolean(e.stock)}
                        onChange={(v) => patch({ processEmissionEntries: rows.map((x) => (x.id === e.id ? { ...x, quantityT: v ?? 0 } : x)) })}
                        ariaLabel={t("Process emission quantity")}
                      />
                    </TaggedField>
                    {isStandard && (
                      <TaggedField id={anchor(`processEntry:${e.id}:cf`)} tag="16(a)" need="required" label={t("Conversion factor")} hint={t("1 unless only part of the material converts.")}>
                        <NumberInput
                          value={e.conversionFactor ?? 1}
                          min={0.0001}
                          max={1}
                          disabled={readOnly}
                          onChange={(v) =>
                            patch({ processEmissionEntries: rows.map((x) => (x.id === e.id && x.method === "standard" ? { ...x, conversionFactor: v ?? 1 } : x)) })
                          }
                          ariaLabel={t("Conversion factor")}
                        />
                      </TaggedField>
                    )}
                  </div>
                  {e.quantityT >= 0 && (
                    <QuantityBasis
                      stock={e.stock}
                      onChange={(p) => patch({ processEmissionEntries: rows.map((x) => (x.id === e.id ? { ...x, stock: p.stock } : x)) })}
                      unit="t"
                      readOnly={readOnly}
                      allowShared={false}
                      workspaceId={workspaceId}
                      entry={entry}
                      fieldKey={`processEntry:${e.id}`}
                    />
                  )}
                  <p className="mt-3 text-[12px] text-black/50">
                    {t("Computed:")} <span className="font-mono text-black/75">{fmt(processEmissionEntryTCO2(e), 4)} tCO₂</span>
                  </p>
                </RowCard>
              );
            })
          )}
        </div>
      </SectionCard>
      )}

      {/* ══ ALSO REPORT THIS MONTH · 16(b) · 16(d) · 17 ══ */}
      <SectionCard
        title={t("Also report this month")}
        helpTitle={t("Only if it applies")}
        help={
          <p>
            {t("Four things most plants have nothing to say about. Each one opens by itself when the installation's own answers say it applies here, and stays shut otherwise — so an empty block is a correct answer, not a gap.")}
          </p>
        }
        blurb={t("Skip any that do not apply to this plant.")}
      >
        <div className="space-y-3">
          <ExtraBlock
            id={anchor("measured")}
            title={t("Continuously measured emissions")}
            tag="16(b)"
            applies={monitoring?.cems === "yes"}
            hasData={measured.length > 0}
            help={t("Emissions read by a continuous emissions measurement system on a stack — added to the month's emissions.")}
          >
            <div className="space-y-3">
              {measured.map((e, i) => (
                <RowCard
                  key={e.id}
                  title={`${t("Measured source")} ${i + 1}`}
                  removeLabel={`${t("Remove measured source")} ${i + 1}`}
                  onRemove={readOnly ? undefined : () => patch({ measuredEmissions: measured.filter((x) => x.id !== e.id) })}
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <TaggedField id={anchor(`measured:${e.id}:source`)} tag="16(b)" need="required" label={t("Source")} hint={t("The stack or unit the instrument sits on.")}>
                      <input
                        className={inputClass}
                        value={e.source}
                        disabled={readOnly}
                        onChange={(ev) => patch({ measuredEmissions: measured.map((x) => (x.id === e.id ? { ...x, source: ev.target.value } : x)) })}
                        placeholder={t("Furnace 2 stack")}
                      />
                    </TaggedField>
                    <TaggedField tag="16(b)" need="required" label={t("Gas")}>
                      <Select
                        value={e.gas}
                        onChange={(v) => patch({ measuredEmissions: measured.map((x) => (x.id === e.id ? { ...x, gas: v as MeasuredGas } : x)) })}
                        options={(Object.keys(MEASURED_GAS_LABEL) as MeasuredGas[]).map((g) => ({ value: g, label: MEASURED_GAS_LABEL[g] }))}
                        ariaLabel={t("Greenhouse gas")}
                      />
                    </TaggedField>
                    <TaggedField id={anchor(`measured:${e.id}:quantity`)} tag="16(b)" need="required" label={t("Emissions this month")} hint={t("In tonnes of CO₂ equivalent.")}>
                      <NumberInput
                        value={e.tCO2e || undefined}
                        min={0}
                        unit="tCO₂e"
                        disabled={readOnly}
                        onChange={(v) => patch({ measuredEmissions: measured.map((x) => (x.id === e.id ? { ...x, tCO2e: v ?? 0 } : x)) })}
                        ariaLabel={t("Measured emissions")}
                      />
                    </TaggedField>
                  </div>
                </RowCard>
              ))}
              {!readOnly && (
                <Button size="sm" variant="secondary" onClick={() => patch({ measuredEmissions: [...measured, { id: uid(), source: "", gas: "co2", tCO2e: 0 }] })}>
                  <Plus size={12} strokeWidth={1.5} /> {t("Add a measured source")}
                </Button>
              )}
            </div>
          </ExtraBlock>

          <ExtraBlock
            id={anchor("co2Transfer")}
            title={t("CO₂ received and sent on")}
            tag="16(d)"
            applies={monitoring?.co2Transfer === "yes"}
            hasData={(entry.co2ReceivedT ?? 0) > 0 || (entry.co2TransferredOutT ?? 0) > 0}
            help={t("CO₂ that came in from another installation, or went out for permanent storage or to be chemically bound in a product.")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TaggedField tag="16(d)" need="optional" label={t("CO₂ received")} hint={t("Reported only. CO₂ that arrives inside a gas is already in that gas's emission factor.")}>
                <NumberInput value={entry.co2ReceivedT} min={0} unit="t" disabled={readOnly} onChange={(v) => patch({ co2ReceivedT: v })} ariaLabel={t("CO₂ received")} />
              </TaggedField>
              <TaggedField
                id={anchor("co2Transfer:out")}
                tag="16(d)"
                need="optional"
                label={t("CO₂ sent on for storage or permanent use")}
                hint={t("Counted as not emitted, so it comes off the month's emissions. Only what was actually stored or bound.")}
              >
                <NumberInput value={entry.co2TransferredOutT} min={0} unit="t" disabled={readOnly} onChange={(v) => patch({ co2TransferredOutT: v })} ariaLabel={t("CO₂ sent on")} />
              </TaggedField>
            </div>
          </ExtraBlock>

          <ExtraBlock
            id={anchor("heat")}
            title={t("Measurable heat")}
            tag="17"
            applies={monitoring?.heatTrade === "yes"}
            hasData={heatHas}
            help={t("Heat that came in from, or went out to, another installation — and what was made and used on site.")}
          >
            <FlowEditor value={entry.heatGj} onChange={(heatGj) => patch({ heatGj })} readOnly={readOnly} aria={t("Heat")} />
          </ExtraBlock>

          <ExtraBlock
            id={anchor("wasteGas")}
            title={t("Waste gases")}
            tag="17"
            applies={monitoring?.wasteGases === "yes"}
            openByDefault={Boolean(pack?.wasteGases)}
            hasData={wasteHas || (entry.wasteGases ?? []).length > 0}
            help={t("Process gases such as blast-furnace or coke-oven gas, by their energy content — or by volume and composition, gas by gas.")}
          >
            {(entry.wasteGases ?? []).length > 0 ? (
              <div className="space-y-5">
                <WasteGasRows rows={entry.wasteGases ?? []} onChange={(wasteGases) => patch({ wasteGases: wasteGases.length > 0 ? wasteGases : undefined })} readOnly={readOnly} />
                <div>
                  <p className="mb-2 font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">{t("The balance, from the gases above")}</p>
                  <FlowEditor value={entry.wasteGasGj} onChange={() => undefined} readOnly aria={t("Waste gases")} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <FlowEditor value={entry.wasteGasGj} onChange={(wasteGasGj) => patch({ wasteGasGj })} readOnly={readOnly} aria={t("Waste gases")} />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => patch({ wasteGases: [{ id: uid(), gas: pack?.wasteGases ? "bfg" : "other", flow: "produced" }] })}
                    className="text-[12.5px] text-black/55 underline decoration-black/20 underline-offset-2 hover:text-black"
                  >
                    {t("Record it gas by gas — volume and composition")}
                  </button>
                )}
              </div>
            )}
          </ExtraBlock>

          <ExtraBlock
            id={anchor("electricityOut")}
            title={t("Electricity sent out of the production process")}
            tag="17"
            applies={monitoring?.onsiteElectricity === "yes"}
            hasData={(entry.electricityExportedMwh ?? 0) > 0}
            help={t("Power made on site that left the boundary of this production process.")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TaggedField tag="17" need="optional" label={t("Electricity sent out")}>
                <NumberInput value={entry.electricityExportedMwh} min={0} unit="MWh" disabled={readOnly} onChange={(v) => patch({ electricityExportedMwh: v })} ariaLabel={t("Electricity sent out")} />
              </TaggedField>
            </div>
          </ExtraBlock>
        </div>
      </SectionCard>

      {/* ══ GAPS, ESTIMATES AND NOTES · 16(e) ══
          Last, because it is the only free-text box in the step and putting it
          first invites a paragraph in place of a reading. */}
      <SectionCard
        title={t("Gaps, estimates and notes")}
        blurb={t("Anything a verifier should know that the numbers above do not say — a shutdown, a meter swapped mid-month, a figure you had to estimate.")}
      >
        <div className="sm:max-w-3xl">
          <TaggedField id={anchor("notes")} tag="16(e)" need="optional" label={t("What was missing or estimated, and anything unusual")} hint={t("Plain English. Leave it empty if the month was ordinary.")}>
            <textarea
              className={cn(inputClass, "min-h-[80px] resize-y py-2.5")}
              disabled={readOnly}
              value={entry.notes ?? ""}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder={t("The furnace was down for maintenance from the 12th to the 18th, so output is about half a normal month.")}
            />
          </TaggedField>
        </div>
      </SectionCard>
    </div>
  );
}

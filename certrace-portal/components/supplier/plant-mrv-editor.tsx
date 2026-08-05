"use client";

import * as React from "react";

import { Select } from "@/components/controls";
import { inputClass, cn } from "@/components/ui";
import {
  calculatePlantMrv,
  createDefaultPlantMrvPayload,
  type PlantMrvPayload,
} from "@/lib/plant-mrv";
import { formatDecimal } from "@/lib/workflow-measurements";

type DirectMethod = PlantMrvPayload["directMethod"];
type MeasurementDraft = { value: string; unit: string };

const METHOD_LABEL: Record<DirectMethod, string> = {
  STANDARD_CALCULATION: "Calculation-based source streams",
  MASS_BALANCE: "Mass balance",
  CEMS: "Continuous emissions monitoring (CEMS)",
};

const newId = (prefix: string) =>
  `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

function editablePayload(raw: string, method: DirectMethod): PlantMrvPayload {
  const base = createDefaultPlantMrvPayload(method);
  if (!raw.trim()) return base;
  try {
    const candidate = JSON.parse(raw) as Partial<PlantMrvPayload>;
    if (!candidate || typeof candidate !== "object") return base;
    return {
      ...base,
      ...candidate,
      schemaVersion: base.schemaVersion,
      regulatoryDataVersion: base.regulatoryDataVersion,
      directMethod: method,
      standardCalculationSourceStreams: Array.isArray(candidate.standardCalculationSourceStreams) ? candidate.standardCalculationSourceStreams : [],
      massBalances: Array.isArray(candidate.massBalances) ? candidate.massBalances : [],
      cemsSources: Array.isArray(candidate.cemsSources) ? candidate.cemsSources : [],
      electricityInputs: Array.isArray(candidate.electricityInputs) ? candidate.electricityInputs : [],
      measurableHeatInputs: Array.isArray(candidate.measurableHeatInputs) ? candidate.measurableHeatInputs : [],
      chpInputs: Array.isArray(candidate.chpInputs) ? candidate.chpInputs : [],
      wasteGasAllocations: Array.isArray(candidate.wasteGasAllocations) ? candidate.wasteGasAllocations : [],
      aluminiumPfcSlopeInputs: Array.isArray(candidate.aluminiumPfcSlopeInputs) ? candidate.aluminiumPfcSlopeInputs : [],
      aluminiumPfcOvervoltageInputs: Array.isArray(candidate.aluminiumPfcOvervoltageInputs) ? candidate.aluminiumPfcOvervoltageInputs : [],
    };
  } catch {
    return base;
  }
}

function Measure({
  value,
  units,
  label,
  disabled,
  onChange,
}: {
  value: MeasurementDraft;
  units: readonly string[];
  label: string;
  disabled: boolean;
  onChange: (next: MeasurementDraft) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(132px,0.8fr)] gap-1.5">
      <input
        aria-label={`${label} value`}
        inputMode="decimal"
        disabled={disabled}
        value={value.value}
        onChange={(event) => onChange({ ...value, value: event.target.value })}
        placeholder="0"
        className={cn(inputClass, "px-2.5 py-2 font-mono sm:text-[12px]", disabled && "cursor-not-allowed opacity-60")}
      />
      <Select
        value={value.unit}
        onChange={(unit) => onChange({ ...value, unit })}
        options={units.map((unit) => ({ value: unit, label: unit }))}
        ariaLabel={`${label} unit`}
        className="w-full"
        disabled={disabled}
      />
    </div>
  );
}

function TextInput({ label, value, disabled, placeholder, onChange }: { label: string; value: string; disabled: boolean; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <input
      aria-label={label}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(inputClass, "px-2.5 py-2 sm:text-[12px]", disabled && "cursor-not-allowed opacity-60")}
    />
  );
}

function EvidenceInput({ value, disabled, onChange }: { value: readonly string[]; disabled: boolean; onChange: (value: string[]) => void }) {
  return (
    <TextInput
      label="Evidence references"
      value={value.join(", ")}
      disabled={disabled}
      placeholder="Evidence/source references, comma separated"
      onChange={(next) => onChange(next.split(",").map((item) => item.trim()).filter(Boolean))}
    />
  );
}

function RowCard({ title, disabled, onRemove, children }: { title: string; disabled: boolean; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-black/[0.07] bg-[#fafaf8] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-black/45">{title}</span>
        {!disabled && <button type="button" onClick={onRemove} className="text-[11px] text-black/35 hover:text-[#dc2626]">Remove</button>}
      </div>
      {children}
    </div>
  );
}

function AddButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  if (disabled) return null;
  return <button type="button" onClick={onClick} className="rounded-lg border border-dashed border-black/15 px-3 py-1.5 text-[11.5px] text-black/55 hover:border-black/30 hover:text-black">+ {label}</button>;
}

export function PlantMrvEditor({
  raw,
  method,
  productionActivityTne,
  productId,
  installationId,
  isElectrolysis,
  editable,
  onChange,
}: {
  raw: string;
  method: DirectMethod;
  productionActivityTne: string;
  productId: string;
  installationId: string;
  isElectrolysis: boolean;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  const payload = React.useMemo(() => editablePayload(raw, method), [raw, method]);
  const commit = React.useCallback((next: PlantMrvPayload) => onChange(JSON.stringify(next)), [onChange]);
  const calculation = React.useMemo(
    () => calculatePlantMrv(payload, productionActivityTne, { productId, installationId: installationId || "unassigned-installation", processId: `${productId}-process` }),
    [payload, productionActivityTne, productId, installationId],
  );

  const standard = payload.standardCalculationSourceStreams;
  const balances = payload.massBalances;
  const cems = payload.cemsSources;

  return (
    <div className="space-y-3 rounded-xl border border-black/[0.07] bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[12px] font-medium text-black/70">{METHOD_LABEL[method]}</div>
          <p className="mt-0.5 text-[10.5px] text-black/40">Enter monitored plant inputs. Exact calculations use the production activity above, never the commercial shipment quantity.</p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-black/30">EU-CBAM-2026.1</span>
      </div>

      {method === "STANDARD_CALCULATION" && (
        <div className="space-y-2">
          {standard.map((row, index) => (
            <RowCard key={row.id} title={`Source stream ${index + 1}`} disabled={!editable} onRemove={() => commit({ ...payload, standardCalculationSourceStreams: standard.filter((item) => item.id !== row.id) })}>
              <div className="grid gap-2 sm:grid-cols-2">
                <TextInput label="Source stream name" value={row.name} disabled={!editable} placeholder="e.g. Natural gas" onChange={(name) => commit({ ...payload, standardCalculationSourceStreams: standard.map((item) => item.id === row.id ? { ...item, name } : item) })} />
                <TextInput label="Material or fuel" value={row.materialOrFuel} disabled={!editable} placeholder="Material / fuel" onChange={(materialOrFuel) => commit({ ...payload, standardCalculationSourceStreams: standard.map((item) => item.id === row.id ? { ...item, materialOrFuel } : item) })} />
                <Measure label="Activity data" value={row.activityData} units={["TNE", "KGM", "GJ", "MJ", "TJ", "NM3"]} disabled={!editable} onChange={(activityData) => commit({ ...payload, standardCalculationSourceStreams: standard.map((item) => item.id === row.id ? { ...item, activityData: activityData as typeof row.activityData } : item) })} />
                <Measure label="Emission factor" value={row.emissionFactor} units={["TCO2E_PER_TNE", "KGCO2E_PER_TNE", "TCO2E_PER_GJ", "KGCO2E_PER_GJ", "TCO2E_PER_TJ", "TCO2E_PER_NM3", "KGCO2E_PER_NM3"]} disabled={!editable} onChange={(emissionFactor) => commit({ ...payload, standardCalculationSourceStreams: standard.map((item) => item.id === row.id ? { ...item, emissionFactor: emissionFactor as typeof row.emissionFactor } : item) })} />
                <Measure label="Oxidation factor" value={row.oxidationFactor ?? { value: "1", unit: "FRACTION" }} units={["FRACTION", "PERCENT"]} disabled={!editable} onChange={(oxidationFactor) => commit({ ...payload, standardCalculationSourceStreams: standard.map((item) => item.id === row.id ? { ...item, oxidationFactor: oxidationFactor as typeof row.oxidationFactor } : item) })} />
                <Measure label="Conversion factor" value={row.conversionFactor ?? { value: "1", unit: "FRACTION" }} units={["FRACTION", "PERCENT"]} disabled={!editable} onChange={(conversionFactor) => commit({ ...payload, standardCalculationSourceStreams: standard.map((item) => item.id === row.id ? { ...item, conversionFactor: conversionFactor as typeof row.conversionFactor } : item) })} />
              </div>
              <div className="mt-2"><EvidenceInput value={row.evidenceReferences} disabled={!editable} onChange={(evidenceReferences) => commit({ ...payload, standardCalculationSourceStreams: standard.map((item) => item.id === row.id ? { ...item, evidenceReferences } : item) })} /></div>
            </RowCard>
          ))}
          <AddButton label="Add source stream" disabled={!editable} onClick={() => commit({
            ...payload,
            standardCalculationSourceStreams: [...standard, {
              id: newId("stream"), name: "", materialOrFuel: "", activityData: { value: "", unit: "TNE" }, emissionFactor: { value: "", unit: "TCO2E_PER_TNE" }, oxidationFactor: { value: "1", unit: "FRACTION" }, conversionFactor: { value: "1", unit: "FRACTION" }, evidenceReferences: [],
            }],
          })} />
        </div>
      )}

      {method === "MASS_BALANCE" && (
        <div className="space-y-2">
          {balances.map((balance, balanceIndex) => (
            <RowCard key={balance.id} title={`Mass balance ${balanceIndex + 1}`} disabled={!editable} onRemove={() => commit({ ...payload, massBalances: balances.filter((item) => item.id !== balance.id) })}>
              <TextInput label="Mass-balance name" value={balance.name} disabled={!editable} placeholder="Process mass balance" onChange={(name) => commit({ ...payload, massBalances: balances.map((item) => item.id === balance.id ? { ...item, name } : item) })} />
              <div className="mt-2 space-y-2">
                {balance.entries.map((entry, entryIndex) => (
                  <div key={entry.id} className="rounded-lg border border-black/[0.06] bg-white p-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <TextInput label="Mass-balance entry name" value={entry.name} disabled={!editable} placeholder={`Entry ${entryIndex + 1}`} onChange={(name) => commit({ ...payload, massBalances: balances.map((item) => item.id === balance.id ? { ...item, entries: item.entries.map((candidate) => candidate.id === entry.id ? { ...candidate, name } : candidate) } : item) })} />
                      <Select value={entry.direction} onChange={(direction) => commit({ ...payload, massBalances: balances.map((item) => item.id === balance.id ? { ...item, entries: item.entries.map((candidate) => candidate.id === entry.id ? { ...candidate, direction: direction as "INPUT" | "OUTPUT" } : candidate) } : item) })} options={[{ value: "INPUT", label: "Input" }, { value: "OUTPUT", label: "Output" }]} ariaLabel="Mass-balance direction" className="w-full" disabled={!editable} />
                      <Measure label="Quantity" value={entry.quantity} units={["TNE", "KGM"]} disabled={!editable} onChange={(quantity) => commit({ ...payload, massBalances: balances.map((item) => item.id === balance.id ? { ...item, entries: item.entries.map((candidate) => candidate.id === entry.id ? { ...candidate, quantity: quantity as typeof entry.quantity } : candidate) } : item) })} />
                      <Measure label="Carbon content" value={entry.carbonContent} units={["FRACTION", "PERCENT"]} disabled={!editable} onChange={(carbonContent) => commit({ ...payload, massBalances: balances.map((item) => item.id === balance.id ? { ...item, entries: item.entries.map((candidate) => candidate.id === entry.id ? { ...candidate, carbonContent: carbonContent as typeof entry.carbonContent } : candidate) } : item) })} />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <div className="flex-1"><TextInput label="Entry evidence reference" value={entry.evidenceReference ?? ""} disabled={!editable} placeholder="Evidence reference" onChange={(evidenceReference) => commit({ ...payload, massBalances: balances.map((item) => item.id === balance.id ? { ...item, entries: item.entries.map((candidate) => candidate.id === entry.id ? { ...candidate, evidenceReference } : candidate) } : item) })} /></div>
                      {!editable ? null : <button type="button" onClick={() => commit({ ...payload, massBalances: balances.map((item) => item.id === balance.id ? { ...item, entries: item.entries.filter((candidate) => candidate.id !== entry.id) } : item) })} className="text-[11px] text-black/35 hover:text-[#dc2626]">Remove entry</button>}
                    </div>
                  </div>
                ))}
                <AddButton label="Add input/output entry" disabled={!editable} onClick={() => commit({ ...payload, massBalances: balances.map((item) => item.id === balance.id ? { ...item, entries: [...item.entries, { id: newId("mass-entry"), name: "", direction: "INPUT", quantity: { value: "", unit: "TNE" }, carbonContent: { value: "", unit: "FRACTION" }, evidenceReference: "" }] } : item) })} />
              </div>
              <div className="mt-2"><EvidenceInput value={balance.evidenceReferences} disabled={!editable} onChange={(evidenceReferences) => commit({ ...payload, massBalances: balances.map((item) => item.id === balance.id ? { ...item, evidenceReferences } : item) })} /></div>
            </RowCard>
          ))}
          <AddButton label="Add mass balance" disabled={!editable} onClick={() => commit({ ...payload, massBalances: [...balances, { id: newId("mass-balance"), name: "", entries: [], evidenceReferences: [] }] })} />
        </div>
      )}

      {method === "CEMS" && (
        <div className="space-y-2">
          {cems.map((row, index) => (
            <RowCard key={row.id} title={`CEMS source ${index + 1}`} disabled={!editable} onRemove={() => commit({ ...payload, cemsSources: cems.filter((item) => item.id !== row.id) })}>
              <div className="grid gap-2 sm:grid-cols-2">
                <TextInput label="Emission-source name" value={row.name} disabled={!editable} placeholder="Stack / source name" onChange={(name) => commit({ ...payload, cemsSources: cems.map((item) => item.id === row.id ? { ...item, name } : item) })} />
                <TextInput label="Measurement point" value={row.measurementPoint} disabled={!editable} placeholder="Measurement point" onChange={(measurementPoint) => commit({ ...payload, cemsSources: cems.map((item) => item.id === row.id ? { ...item, measurementPoint } : item) })} />
                <Measure label="Average concentration" value={row.averageConcentration} units={["TCO2E_PER_NM3", "KGCO2E_PER_NM3"]} disabled={!editable} onChange={(averageConcentration) => commit({ ...payload, cemsSources: cems.map((item) => item.id === row.id ? { ...item, averageConcentration: averageConcentration as typeof row.averageConcentration } : item) })} />
                <Measure label="Stack-gas volume" value={row.monitoredStackGasVolume} units={["NM3"]} disabled={!editable} onChange={(monitoredStackGasVolume) => commit({ ...payload, cemsSources: cems.map((item) => item.id === row.id ? { ...item, monitoredStackGasVolume: monitoredStackGasVolume as typeof row.monitoredStackGasVolume } : item) })} />
                <TextInput label="Uncertainty percent" value={row.uncertaintyPercent ?? ""} disabled={!editable} placeholder="Uncertainty % (optional)" onChange={(uncertaintyPercent) => commit({ ...payload, cemsSources: cems.map((item) => item.id === row.id ? { ...item, uncertaintyPercent } : item) })} />
              </div>
              <div className="mt-2"><EvidenceInput value={row.evidenceReferences} disabled={!editable} onChange={(evidenceReferences) => commit({ ...payload, cemsSources: cems.map((item) => item.id === row.id ? { ...item, evidenceReferences } : item) })} /></div>
            </RowCard>
          ))}
          <AddButton label="Add CEMS source" disabled={!editable} onClick={() => commit({ ...payload, cemsSources: [...cems, { id: newId("cems"), name: "", measurementPoint: "", uncertaintyPercent: "", averageConcentration: { value: "", unit: "TCO2E_PER_NM3" }, monitoredStackGasVolume: { value: "", unit: "NM3" }, evidenceReferences: [] }] })} />
        </div>
      )}

      <details className="rounded-xl border border-black/[0.06] bg-[#fafaf8] p-3">
        <summary className="cursor-pointer text-[12px] font-medium text-black/60">Energy, allocation and transfer inputs</summary>
        <div className="mt-3 space-y-4">
          <SupplementalRows payload={payload} editable={editable} commit={commit} />
        </div>
      </details>

      {isElectrolysis && <PfcRows payload={payload} editable={editable} commit={commit} />}

      <div className={cn("rounded-lg border px-3 py-2 text-[11px]", calculation.ok ? "border-[#047857]/20 bg-[#ecfdf5] text-[#047857]" : "border-[#b45309]/20 bg-[#fffbeb] text-[#92400e]")}>
        {calculation.ok ? (
          <span>Exact plant result: direct {formatDecimal(calculation.directSpecificEmissions.value)} · indirect {formatDecimal(calculation.indirectSpecificEmissions.value)} TCO2E_PER_TNE · {calculation.traces.length} calculation trace{calculation.traces.length === 1 ? "" : "s"}</span>
        ) : (
          <span>Plant calculation incomplete: {calculation.errors[0]?.message ?? "Complete the active method inputs."}</span>
        )}
      </div>
    </div>
  );
}

function SupplementalRows({ payload, editable, commit }: { payload: PlantMrvPayload; editable: boolean; commit: (payload: PlantMrvPayload) => void }) {
  return (
    <>
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-black/40">Electricity</div>
        {payload.electricityInputs.map((row, index) => (
          <RowCard key={row.id} title={`Electricity input ${index + 1}`} disabled={!editable} onRemove={() => commit({ ...payload, electricityInputs: payload.electricityInputs.filter((item) => item.id !== row.id) })}>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput label="Electricity input name" value={row.name} disabled={!editable} placeholder="Grid / PPA / self-generation" onChange={(name) => commit({ ...payload, electricityInputs: payload.electricityInputs.map((item) => item.id === row.id ? { ...item, name } : item) })} />
              <Measure label="Electricity quantity" value={row.quantity} units={["MWH", "KWH"]} disabled={!editable} onChange={(quantity) => commit({ ...payload, electricityInputs: payload.electricityInputs.map((item) => item.id === row.id ? { ...item, quantity: quantity as typeof row.quantity } : item) })} />
              <Measure label="Electricity emission factor" value={row.emissionFactor} units={["TCO2E_PER_MWH", "KGCO2E_PER_KWH"]} disabled={!editable} onChange={(emissionFactor) => commit({ ...payload, electricityInputs: payload.electricityInputs.map((item) => item.id === row.id ? { ...item, emissionFactor: emissionFactor as typeof row.emissionFactor } : item) })} />
            </div>
            <div className="mt-2"><EvidenceInput value={row.evidenceReferences} disabled={!editable} onChange={(evidenceReferences) => commit({ ...payload, electricityInputs: payload.electricityInputs.map((item) => item.id === row.id ? { ...item, evidenceReferences } : item) })} /></div>
          </RowCard>
        ))}
        <AddButton label="Add electricity input" disabled={!editable} onClick={() => commit({ ...payload, electricityInputs: [...payload.electricityInputs, { id: newId("electricity"), name: "", quantity: { value: "", unit: "MWH" }, emissionFactor: { value: "", unit: "TCO2E_PER_MWH" }, evidenceReferences: [] }] })} />
      </div>

      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-black/40">Measurable heat</div>
        {payload.measurableHeatInputs.map((row, index) => (
          <RowCard key={row.id} title={`Heat input ${index + 1}`} disabled={!editable} onRemove={() => commit({ ...payload, measurableHeatInputs: payload.measurableHeatInputs.filter((item) => item.id !== row.id) })}>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput label="Heat input name" value={row.name} disabled={!editable} placeholder="Imported / generated heat" onChange={(name) => commit({ ...payload, measurableHeatInputs: payload.measurableHeatInputs.map((item) => item.id === row.id ? { ...item, name } : item) })} />
              <Measure label="Net measurable heat" value={row.netMeasurableHeat} units={["GJ", "MJ", "TJ"]} disabled={!editable} onChange={(netMeasurableHeat) => commit({ ...payload, measurableHeatInputs: payload.measurableHeatInputs.map((item) => item.id === row.id ? { ...item, netMeasurableHeat: netMeasurableHeat as typeof row.netMeasurableHeat } : item) })} />
              <Measure label="Heat emission factor" value={row.emissionFactor} units={["TCO2E_PER_GJ", "KGCO2E_PER_GJ", "TCO2E_PER_TJ"]} disabled={!editable} onChange={(emissionFactor) => commit({ ...payload, measurableHeatInputs: payload.measurableHeatInputs.map((item) => item.id === row.id ? { ...item, emissionFactor: emissionFactor as typeof row.emissionFactor } : item) })} />
            </div>
            <div className="mt-2"><EvidenceInput value={row.evidenceReferences} disabled={!editable} onChange={(evidenceReferences) => commit({ ...payload, measurableHeatInputs: payload.measurableHeatInputs.map((item) => item.id === row.id ? { ...item, evidenceReferences } : item) })} /></div>
          </RowCard>
        ))}
        <AddButton label="Add measurable heat" disabled={!editable} onClick={() => commit({ ...payload, measurableHeatInputs: [...payload.measurableHeatInputs, { id: newId("heat"), name: "", netMeasurableHeat: { value: "", unit: "GJ" }, emissionFactor: { value: "", unit: "TCO2E_PER_GJ" }, evidenceReferences: [] }] })} />
      </div>

      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-black/40">Combined heat and power (CHP)</div>
        {payload.chpInputs.map((row, index) => (
          <RowCard key={row.id} title={`CHP unit ${index + 1}`} disabled={!editable} onRemove={() => commit({ ...payload, chpInputs: payload.chpInputs.filter((item) => item.id !== row.id) })}>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput label="CHP unit name" value={row.name} disabled={!editable} placeholder="CHP unit" onChange={(name) => commit({ ...payload, chpInputs: payload.chpInputs.map((item) => item.id === row.id ? { ...item, name } : item) })} />
              <Select value={row.allocationTarget} onChange={(allocationTarget) => commit({ ...payload, chpInputs: payload.chpInputs.map((item) => item.id === row.id ? { ...item, allocationTarget: allocationTarget as typeof row.allocationTarget } : item) })} options={[{ value: "BOTH", label: "Heat and electricity" }, { value: "HEAT_ONLY", label: "Heat only" }, { value: "ELECTRICITY_ONLY", label: "Electricity only" }]} ariaLabel="CHP allocation target" className="w-full" disabled={!editable} />
              <Measure label="Total CHP emissions" value={row.totalChpEmissions} units={["TCO2E", "KGCO2E"]} disabled={!editable} onChange={(totalChpEmissions) => commit({ ...payload, chpInputs: payload.chpInputs.map((item) => item.id === row.id ? { ...item, totalChpEmissions: totalChpEmissions as typeof row.totalChpEmissions } : item) })} />
              <Measure label="Useful heat" value={row.usefulHeat} units={["GJ", "MJ", "TJ"]} disabled={!editable} onChange={(usefulHeat) => commit({ ...payload, chpInputs: payload.chpInputs.map((item) => item.id === row.id ? { ...item, usefulHeat: usefulHeat as typeof row.usefulHeat } : item) })} />
              <Measure label="Electricity output" value={row.electricityOutput} units={["MWH", "KWH"]} disabled={!editable} onChange={(electricityOutput) => commit({ ...payload, chpInputs: payload.chpInputs.map((item) => item.id === row.id ? { ...item, electricityOutput: electricityOutput as typeof row.electricityOutput } : item) })} />
              <Measure label="Reference heat efficiency" value={row.referenceHeatEfficiency} units={["FRACTION", "PERCENT"]} disabled={!editable} onChange={(referenceHeatEfficiency) => commit({ ...payload, chpInputs: payload.chpInputs.map((item) => item.id === row.id ? { ...item, referenceHeatEfficiency: referenceHeatEfficiency as typeof row.referenceHeatEfficiency } : item) })} />
              <Measure label="Reference electric efficiency" value={row.referenceElectricEfficiency} units={["FRACTION", "PERCENT"]} disabled={!editable} onChange={(referenceElectricEfficiency) => commit({ ...payload, chpInputs: payload.chpInputs.map((item) => item.id === row.id ? { ...item, referenceElectricEfficiency: referenceElectricEfficiency as typeof row.referenceElectricEfficiency } : item) })} />
            </div>
            <div className="mt-2"><EvidenceInput value={row.evidenceReferences} disabled={!editable} onChange={(evidenceReferences) => commit({ ...payload, chpInputs: payload.chpInputs.map((item) => item.id === row.id ? { ...item, evidenceReferences } : item) })} /></div>
          </RowCard>
        ))}
        <AddButton label="Add CHP unit" disabled={!editable} onClick={() => commit({ ...payload, chpInputs: [...payload.chpInputs, { id: newId("chp"), name: "", totalChpEmissions: { value: "", unit: "TCO2E" }, usefulHeat: { value: "", unit: "GJ" }, electricityOutput: { value: "", unit: "MWH" }, referenceHeatEfficiency: { value: "", unit: "FRACTION" }, referenceElectricEfficiency: { value: "", unit: "FRACTION" }, allocationTarget: "BOTH", evidenceReferences: [] }] })} />
      </div>

      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-black/40">Waste-gas allocation</div>
        {payload.wasteGasAllocations.map((row, index) => (
          <RowCard key={row.id} title={`Waste-gas transfer ${index + 1}`} disabled={!editable} onRemove={() => commit({ ...payload, wasteGasAllocations: payload.wasteGasAllocations.filter((item) => item.id !== row.id) })}>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput label="Waste-gas allocation name" value={row.name} disabled={!editable} placeholder="Transfer / allocation" onChange={(name) => commit({ ...payload, wasteGasAllocations: payload.wasteGasAllocations.map((item) => item.id === row.id ? { ...item, name } : item) })} />
              <Measure label="Attributable waste-gas emissions" value={row.attributableWasteGasEmissions} units={["TCO2E", "KGCO2E"]} disabled={!editable} onChange={(attributableWasteGasEmissions) => commit({ ...payload, wasteGasAllocations: payload.wasteGasAllocations.map((item) => item.id === row.id ? { ...item, attributableWasteGasEmissions: attributableWasteGasEmissions as typeof row.attributableWasteGasEmissions } : item) })} />
              <Measure label="Target useful energy" value={row.targetUsefulEnergy} units={["GJ", "MJ", "TJ"]} disabled={!editable} onChange={(targetUsefulEnergy) => commit({ ...payload, wasteGasAllocations: payload.wasteGasAllocations.map((item) => item.id === row.id ? { ...item, targetUsefulEnergy: targetUsefulEnergy as typeof row.targetUsefulEnergy } : item) })} />
              <Measure label="Total useful energy" value={row.totalUsefulEnergy} units={["GJ", "MJ", "TJ"]} disabled={!editable} onChange={(totalUsefulEnergy) => commit({ ...payload, wasteGasAllocations: payload.wasteGasAllocations.map((item) => item.id === row.id ? { ...item, totalUsefulEnergy: totalUsefulEnergy as typeof row.totalUsefulEnergy } : item) })} />
              <TextInput label="Source installation" value={row.sourceInstallationId ?? ""} disabled={!editable} placeholder="Source installation ID" onChange={(sourceInstallationId) => commit({ ...payload, wasteGasAllocations: payload.wasteGasAllocations.map((item) => item.id === row.id ? { ...item, sourceInstallationId } : item) })} />
              <TextInput label="Destination installation" value={row.destinationInstallationId ?? ""} disabled={!editable} placeholder="Destination installation ID" onChange={(destinationInstallationId) => commit({ ...payload, wasteGasAllocations: payload.wasteGasAllocations.map((item) => item.id === row.id ? { ...item, destinationInstallationId } : item) })} />
            </div>
            <div className="mt-2"><EvidenceInput value={row.evidenceReferences} disabled={!editable} onChange={(evidenceReferences) => commit({ ...payload, wasteGasAllocations: payload.wasteGasAllocations.map((item) => item.id === row.id ? { ...item, evidenceReferences } : item) })} /></div>
          </RowCard>
        ))}
        <AddButton label="Add waste-gas allocation" disabled={!editable} onClick={() => commit({ ...payload, wasteGasAllocations: [...payload.wasteGasAllocations, { id: newId("waste-gas"), name: "", attributableWasteGasEmissions: { value: "", unit: "TCO2E" }, targetUsefulEnergy: { value: "", unit: "GJ" }, totalUsefulEnergy: { value: "", unit: "GJ" }, sourceInstallationId: "", destinationInstallationId: "", evidenceReferences: [] }] })} />
      </div>
    </>
  );
}

function PfcRows({ payload, editable, commit }: { payload: PlantMrvPayload; editable: boolean; commit: (payload: PlantMrvPayload) => void }) {
  const slopes = payload.aluminiumPfcSlopeInputs ?? [];
  const overvoltages = payload.aluminiumPfcOvervoltageInputs ?? [];
  return (
    <details className="rounded-xl border border-black/[0.06] bg-[#fafaf8] p-3">
      <summary className="cursor-pointer text-[12px] font-medium text-black/60">Primary aluminium PFC emissions</summary>
      <p className="mt-1 text-[10.5px] text-black/40">Add slope or overvoltage inputs only for the electrolysis technology used by this installation.</p>
      <div className="mt-3 space-y-3">
        {slopes.map((row, index) => (
          <RowCard key={row.id} title={`PFC slope input ${index + 1}`} disabled={!editable} onRemove={() => commit({ ...payload, aluminiumPfcSlopeInputs: slopes.filter((item) => item.id !== row.id) })}>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput label="PFC slope input name" value={row.name} disabled={!editable} placeholder="Potline / technology" onChange={(name) => commit({ ...payload, aluminiumPfcSlopeInputs: slopes.map((item) => item.id === row.id ? { ...item, name } : item) })} />
              <TextInput label="PFC measurement point" value={row.measurementPoint} disabled={!editable} placeholder="Potline measurement point" onChange={(measurementPoint) => commit({ ...payload, aluminiumPfcSlopeInputs: slopes.map((item) => item.id === row.id ? { ...item, measurementPoint } : item) })} />
              <Measure label="Primary aluminium production" value={row.primaryAluminiumProduction} units={["TNE", "KGM"]} disabled={!editable} onChange={(primaryAluminiumProduction) => commit({ ...payload, aluminiumPfcSlopeInputs: slopes.map((item) => item.id === row.id ? { ...item, primaryAluminiumProduction: primaryAluminiumProduction as typeof row.primaryAluminiumProduction } : item) })} />
              <Measure label="Anode-effect minutes per cell-day" value={row.anodeEffectMinutesPerCellDay} units={["AEM_MIN_PER_CELL_DAY"]} disabled={!editable} onChange={(anodeEffectMinutesPerCellDay) => commit({ ...payload, aluminiumPfcSlopeInputs: slopes.map((item) => item.id === row.id ? { ...item, anodeEffectMinutesPerCellDay: anodeEffectMinutesPerCellDay as typeof row.anodeEffectMinutesPerCellDay } : item) })} />
              <Measure label="CF4 slope emission factor" value={row.cf4SlopeEmissionFactor} units={["KGM_CF4_PER_TNE_AL_PER_AEM"]} disabled={!editable} onChange={(cf4SlopeEmissionFactor) => commit({ ...payload, aluminiumPfcSlopeInputs: slopes.map((item) => item.id === row.id ? { ...item, cf4SlopeEmissionFactor: cf4SlopeEmissionFactor as typeof row.cf4SlopeEmissionFactor } : item) })} />
              <Measure label="C2F6 to CF4 weight fraction" value={row.c2f6ToCf4WeightFraction} units={["TNE_C2F6_PER_TNE_CF4"]} disabled={!editable} onChange={(c2f6ToCf4WeightFraction) => commit({ ...payload, aluminiumPfcSlopeInputs: slopes.map((item) => item.id === row.id ? { ...item, c2f6ToCf4WeightFraction: c2f6ToCf4WeightFraction as typeof row.c2f6ToCf4WeightFraction } : item) })} />
              <Measure label="Collection efficiency" value={row.collectionEfficiency} units={["FRACTION", "PERCENT"]} disabled={!editable} onChange={(collectionEfficiency) => commit({ ...payload, aluminiumPfcSlopeInputs: slopes.map((item) => item.id === row.id ? { ...item, collectionEfficiency: collectionEfficiency as typeof row.collectionEfficiency } : item) })} />
            </div>
            <div className="mt-2"><EvidenceInput value={row.evidenceReferences} disabled={!editable} onChange={(evidenceReferences) => commit({ ...payload, aluminiumPfcSlopeInputs: slopes.map((item) => item.id === row.id ? { ...item, evidenceReferences } : item) })} /></div>
          </RowCard>
        ))}
        {overvoltages.map((row, index) => (
          <RowCard key={row.id} title={`PFC overvoltage input ${index + 1}`} disabled={!editable} onRemove={() => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.filter((item) => item.id !== row.id) })}>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput label="PFC overvoltage input name" value={row.name} disabled={!editable} placeholder="Potline / technology" onChange={(name) => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.map((item) => item.id === row.id ? { ...item, name } : item) })} />
              <TextInput label="PFC measurement point" value={row.measurementPoint} disabled={!editable} placeholder="Potline measurement point" onChange={(measurementPoint) => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.map((item) => item.id === row.id ? { ...item, measurementPoint } : item) })} />
              <Measure label="Primary aluminium production" value={row.primaryAluminiumProduction} units={["TNE", "KGM"]} disabled={!editable} onChange={(primaryAluminiumProduction) => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.map((item) => item.id === row.id ? { ...item, primaryAluminiumProduction: primaryAluminiumProduction as typeof row.primaryAluminiumProduction } : item) })} />
              <Measure label="Anode-effect overvoltage" value={row.anodeEffectOvervoltage} units={["MILLIVOLT"]} disabled={!editable} onChange={(anodeEffectOvervoltage) => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.map((item) => item.id === row.id ? { ...item, anodeEffectOvervoltage: anodeEffectOvervoltage as typeof row.anodeEffectOvervoltage } : item) })} />
              <Measure label="Current efficiency" value={row.currentEfficiency} units={["FRACTION", "PERCENT"]} disabled={!editable} onChange={(currentEfficiency) => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.map((item) => item.id === row.id ? { ...item, currentEfficiency: currentEfficiency as typeof row.currentEfficiency } : item) })} />
              <Measure label="CF4 overvoltage coefficient" value={row.cf4OvervoltageCoefficient} units={["KGM_CF4_PER_TNE_AL_PER_MILLIVOLT"]} disabled={!editable} onChange={(cf4OvervoltageCoefficient) => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.map((item) => item.id === row.id ? { ...item, cf4OvervoltageCoefficient: cf4OvervoltageCoefficient as typeof row.cf4OvervoltageCoefficient } : item) })} />
              <Measure label="C2F6 to CF4 weight fraction" value={row.c2f6ToCf4WeightFraction} units={["TNE_C2F6_PER_TNE_CF4"]} disabled={!editable} onChange={(c2f6ToCf4WeightFraction) => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.map((item) => item.id === row.id ? { ...item, c2f6ToCf4WeightFraction: c2f6ToCf4WeightFraction as typeof row.c2f6ToCf4WeightFraction } : item) })} />
              <Measure label="Collection efficiency" value={row.collectionEfficiency} units={["FRACTION", "PERCENT"]} disabled={!editable} onChange={(collectionEfficiency) => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.map((item) => item.id === row.id ? { ...item, collectionEfficiency: collectionEfficiency as typeof row.collectionEfficiency } : item) })} />
            </div>
            <div className="mt-2"><EvidenceInput value={row.evidenceReferences} disabled={!editable} onChange={(evidenceReferences) => commit({ ...payload, aluminiumPfcOvervoltageInputs: overvoltages.map((item) => item.id === row.id ? { ...item, evidenceReferences } : item) })} /></div>
          </RowCard>
        ))}
        <div className="flex flex-wrap gap-2">
          <AddButton label="Add PFC slope input" disabled={!editable} onClick={() => commit({ ...payload, aluminiumPfcSlopeInputs: [...slopes, { id: newId("pfc-slope"), name: "", measurementPoint: "", primaryAluminiumProduction: { value: "", unit: "TNE" }, anodeEffectMinutesPerCellDay: { value: "", unit: "AEM_MIN_PER_CELL_DAY" }, cf4SlopeEmissionFactor: { value: "", unit: "KGM_CF4_PER_TNE_AL_PER_AEM" }, c2f6ToCf4WeightFraction: { value: "", unit: "TNE_C2F6_PER_TNE_CF4" }, collectionEfficiency: { value: "", unit: "FRACTION" }, evidenceReferences: [] }] })} />
          <AddButton label="Add PFC overvoltage input" disabled={!editable} onClick={() => commit({ ...payload, aluminiumPfcOvervoltageInputs: [...overvoltages, { id: newId("pfc-overvoltage"), name: "", measurementPoint: "", primaryAluminiumProduction: { value: "", unit: "TNE" }, anodeEffectOvervoltage: { value: "", unit: "MILLIVOLT" }, currentEfficiency: { value: "", unit: "FRACTION" }, cf4OvervoltageCoefficient: { value: "", unit: "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT" }, c2f6ToCf4WeightFraction: { value: "", unit: "TNE_C2F6_PER_TNE_CF4" }, collectionEfficiency: { value: "", unit: "FRACTION" }, evidenceReferences: [] }] })} />
        </div>
      </div>
    </details>
  );
}

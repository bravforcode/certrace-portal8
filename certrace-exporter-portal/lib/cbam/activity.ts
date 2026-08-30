/* ════════════════════════════════════════════════════════════
   ACTIVITY DATA — the layer that makes verification possible

   The portal used to collect ANSWERS: a supplier typed SEE = 0.42 and the
   portal stored 0.42 and the report said 0.42. Nothing about that chain is
   provable, and a verifier does not accept answers — a verifier re-derives
   them. So this module models the INPUTS instead:

     fuel volumes · calorific values · emission factors · absolute electricity
     · process material masses · and the production quantity they divide by

   From those, lib/cbam/engine.ts COMPUTES 0.42 through a versioned formula,
   and a verifier who re-runs the same formula lands on the same number.

   Every entry carries Provenance — where the figure came from, which document
   proves it, who typed it and when. That is what turns a spreadsheet into
   evidence. An entry sourced 'ASSUMPTION' is still allowed; it just has to
   say so, and it surfaces as a warning everywhere it touches a filed figure
   (spec §0, validation V15).
   ════════════════════════════════════════════════════════════ */

import type { FuelUnit } from "./units";
import type { ReportingPeriod } from "./boundary";

/* ── Provenance ─────────────────────────────────────────────────
   Ordered from strongest to weakest evidence. The ordering is not cosmetic:
   the readiness score and the data-gap register both treat 'ASSUMPTION' as a
   gap, and a verifier's conservativeness test asks specifically what was
   assumed and whether the assumption was biased in the exporter's favour. */
export type ProvenanceSource =
  | "meter"
  | "invoice"
  | "lab"
  | "erp"
  | "national_dataset"
  | "eu_default"
  | "ASSUMPTION";

export const PROVENANCE_SOURCES: ProvenanceSource[] = [
  "meter",
  "invoice",
  "lab",
  "erp",
  "national_dataset",
  "eu_default",
  "ASSUMPTION",
];

export const PROVENANCE_LABEL: Record<ProvenanceSource, string> = {
  meter: "Meter reading",
  invoice: "Invoice / bill",
  lab: "Laboratory analysis",
  erp: "ERP / production system",
  national_dataset: "National dataset",
  eu_default: "EU default value",
  ASSUMPTION: "Assumption",
};

export const PROVENANCE_HINT: Record<ProvenanceSource, string> = {
  meter: "A physical meter on site. Give the meter id and keep the log.",
  invoice: "A supplier invoice or utility bill. Give the invoice number.",
  lab: "A laboratory certificate, e.g. a fuel calorific-value analysis.",
  erp: "Your production or energy system. Give the report or export reference.",
  national_dataset: "A published national factor, e.g. the TGO grid factor. Name the dataset and year.",
  eu_default: "The EU fallback value. Carries a markup in the definitive period — see the data-gap register.",
  ASSUMPTION: "An engineering estimate with no document behind it. Allowed, but it is declared as an assumption and a verifier will test it.",
};

/** Sources a verifier can trace to a document. Anything outside this set has
    to justify itself in the MMD's assumptions register. */
export const EVIDENCED_SOURCES = new Set<ProvenanceSource>(["meter", "invoice", "lab", "erp"]);

export type Provenance = {
  source: ProvenanceSource;
  /** invoice no. / meter id / dataset name — what a verifier asks for by name */
  reference?: string;
  /** links to the Evidence Pack entry (lib/cbam/evidence.ts) */
  evidenceFileId?: string;
  enteredBy: string;
  /** ISO timestamp */
  enteredAt: string;
};

export const emptyProvenance = (enteredBy: string): Provenance => ({
  source: "invoice",
  reference: "",
  enteredBy,
  enteredAt: new Date().toISOString(),
});

export const isAssumption = (p: Provenance | undefined): boolean => p?.source === "ASSUMPTION";

export const hasEvidence = (p: Provenance | undefined): boolean => Boolean(p?.evidenceFileId);

/* ── Fuels ──────────────────────────────────────────────────────
   The emission factor is tCO₂ per GJ, always. A quantity in m³/kg/l/t reaches
   GJ only through the NCV — see lib/cbam/units.ts, and V1/V2 in the validator
   for the two rules that catch the ways this goes wrong. */
/* ── Fuels, and why this list matches lib/monthly-data.ts ───────
   The supplier form and the exporter's month editor are two ends of ONE
   conversation: the supplier reports what they burned, the exporter reads it
   into the workspace. They used to offer different lists — six kinds here,
   twenty-five there — so a supplier who burned coking coal picked "Coal", the
   exporter looked for coking coal and did not find it, and the reconciliation
   happened over email.

   Same ten fuels, same ids, both sides. `coal` survives in the type but not in
   FUEL_KINDS: rows submitted under it still render, and nothing new can be
   created with it. */
export type FuelKind =
  | "coking_coal"
  | "coke"
  | "anthracite_bituminous"
  | "fuel_oil_heavy"
  | "diesel"
  | "lpg"
  | "natural_gas"
  | "coke_oven_gas"
  | "blast_furnace_gas"
  | "biomass"
  | "other"
  /** retired — kept so previously submitted rows still read */
  | "coal";

export const FUEL_KINDS: FuelKind[] = [
  "coking_coal",
  "coke",
  "anthracite_bituminous",
  "fuel_oil_heavy",
  "diesel",
  "lpg",
  "natural_gas",
  "coke_oven_gas",
  "blast_furnace_gas",
  "biomass",
  "other",
];

export const FUEL_LABEL: Record<FuelKind, string> = {
  coking_coal: "Coking coal / metallurgical coal",
  coke: "Coke",
  anthracite_bituminous: "Anthracite / bituminous coal",
  fuel_oil_heavy: "Fuel oil / heavy fuel oil",
  diesel: "Diesel",
  lpg: "LPG",
  natural_gas: "Natural gas",
  coke_oven_gas: "Coke oven gas",
  blast_furnace_gas: "Blast furnace gas",
  biomass: "Biomass / biofuel",
  other: "Other fuel",
  coal: "Coal",
};

export type FuelEntry = {
  id: string;
  fuel: FuelKind;
  quantity: number;
  unit: FuelUnit;
  /** GJ per one of `unit`. Required whenever `unit` is not already GJ. */
  ncv?: number;
  ncvProvenance?: Provenance;
  /** tCO₂ per GJ — the canonical fuel EF. Never per m³. */
  emissionFactor: number;
  efProvenance: Provenance;
  /** fraction of carbon actually oxidised, default 1.0 */
  oxidationFactor?: number;
  provenance: Provenance;
};

/* ── Electricity ────────────────────────────────────────────────
   ABSOLUTE MWh for the period. Per-tonne is derived by the engine, once, by
   dividing by annual production — never stored, never entered. */
export type ElectricityFactorSource = "grid_national" | "ppa" | "self_generated" | "eu_default";

export const ELECTRICITY_FACTOR_SOURCES: ElectricityFactorSource[] = [
  "grid_national",
  "ppa",
  "self_generated",
  "eu_default",
];

export const ELECTRICITY_FACTOR_LABEL: Record<ElectricityFactorSource, string> = {
  grid_national: "National grid factor",
  ppa: "Power purchase agreement",
  self_generated: "Self-generated on site",
  eu_default: "EU default factor",
};

export type ElectricityEntry = {
  id: string;
  /** ABSOLUTE MWh for the period. Never MWh/t. */
  mwhAbsolute: number;
  /** tCO₂ per MWh */
  emissionFactor: number;
  factorSource: ElectricityFactorSource;
  provenance: Provenance;
};

/* ── Process emissions ──────────────────────────────────────────
   Carbon that leaves as CO₂ without being burned as fuel: graphite
   electrodes consumed in an EAF, limestone calcined in a flux. Mass × carbon
   content × 44/12. */
export type ProcessEmissionEntry = {
  id: string;
  /** e.g. 'graphite electrode', 'limestone' */
  material: string;
  massTonnes: number;
  /** mass fraction, 0..1 */
  carbonContent: number;
  provenance: Provenance;
};

/* ── The dataset ────────────────────────────────────────────────
   One per declaration. The production quantity is THE denominator of every
   per-tonne figure the portal produces, which is why it gets its own
   provenance and its own hard rule below. */
export type ActivityDataset = {
  declarationId: string;
  period: ReportingPeriod;
  /** THE denominator. Never derived from shipments — see the note below. */
  annualProductionTonnes: number;
  annualProductionProvenance: Provenance;
  fuels: FuelEntry[];
  electricity: ElectricityEntry[];
  processEmissions: ProcessEmissionEntry[];
  /* Which months the readings above actually cover, as 'YYYY-MM'. A period
     total does not say whether it came from twelve readings or from nine and
     a shrug, and that is precisely what a verifier asks. Months absent from
     this list need an entry in the data-gap register instead (validation
     V11) — the two together are what completeness means. */
  monthsCovered?: string[];
  updatedAt?: number;
};

/* ⚠️ SHIPPED ≠ PRODUCED.
   annualProductionTonnes must never be auto-filled from summed shipment
   quantities. Output can be sold domestically, held as inventory, or shipped
   under another declaration — auto-filling understates the denominator and
   therefore INFLATES the SEE per tonne on every good in the filing. Shipment
   totals may be offered as context with a visible diff and an explicit
   confirmation, never as a silent default. Spec §4.2, validation V4. */
export const PRODUCTION_NEVER_AUTOFILL_NOTE =
  "Shipped is not produced. Output can be sold domestically, held as stock, or shipped under another declaration — " +
  "so the production quantity is entered from your own production records, not derived from shipments.";

export const emptyDataset = (declarationId: string, period: ReportingPeriod, enteredBy: string): ActivityDataset => ({
  declarationId,
  period,
  annualProductionTonnes: 0,
  annualProductionProvenance: emptyProvenance(enteredBy),
  fuels: [],
  electricity: [],
  processEmissions: [],
  monthsCovered: [],
});

export const emptyFuelEntry = (id: string, enteredBy: string): FuelEntry => ({
  id,
  fuel: "natural_gas",
  quantity: 0,
  unit: "m3",
  ncv: undefined,
  emissionFactor: 0,
  efProvenance: emptyProvenance(enteredBy),
  oxidationFactor: 1,
  provenance: emptyProvenance(enteredBy),
});

export const emptyElectricityEntry = (id: string, enteredBy: string): ElectricityEntry => ({
  id,
  mwhAbsolute: 0,
  emissionFactor: 0,
  factorSource: "grid_national",
  provenance: emptyProvenance(enteredBy),
});

export const emptyProcessEntry = (id: string, enteredBy: string): ProcessEmissionEntry => ({
  id,
  material: "",
  massTonnes: 0,
  carbonContent: 1,
  provenance: emptyProvenance(enteredBy),
});

/** Every provenance record in the dataset, with a human label for the input it
    belongs to. Drives the assumptions register (V15) and evidence coverage
    (V10) without either of them re-walking the shape of the dataset. */
export type ProvenanceRef = {
  /** stable id: '<section>:<entryId>:<slot>' */
  key: string;
  label: string;
  provenance: Provenance;
  /** an input a filed figure depends on — missing evidence here is an error,
      not a warning */
  critical: boolean;
};

export function provenanceRefs(d: ActivityDataset): ProvenanceRef[] {
  const out: ProvenanceRef[] = [
    {
      key: "production:annual:value",
      label: "Annual production quantity",
      provenance: d.annualProductionProvenance,
      critical: true,
    },
  ];
  for (const f of d.fuels) {
    const name = FUEL_LABEL[f.fuel];
    out.push({ key: `fuel:${f.id}:quantity`, label: `${name} — quantity`, provenance: f.provenance, critical: true });
    out.push({ key: `fuel:${f.id}:ef`, label: `${name} — emission factor`, provenance: f.efProvenance, critical: true });
    if (f.ncvProvenance) {
      out.push({ key: `fuel:${f.id}:ncv`, label: `${name} — net calorific value`, provenance: f.ncvProvenance, critical: true });
    }
  }
  for (const e of d.electricity) {
    out.push({ key: `electricity:${e.id}:mwh`, label: "Electricity — consumption & factor", provenance: e.provenance, critical: true });
  }
  for (const p of d.processEmissions) {
    out.push({
      key: `process:${p.id}:mass`,
      label: `${p.material || "Process material"} — mass & carbon content`,
      provenance: p.provenance,
      critical: true,
    });
  }
  return out;
}

/** Every input declared as an assumption — the MMD's assumptions register and
    validation V15 read from exactly this. */
export const assumptionRefs = (d: ActivityDataset): ProvenanceRef[] =>
  provenanceRefs(d).filter((r) => isAssumption(r.provenance));

/** Has the exporter entered anything at all yet? */
export const datasetIsEmpty = (d: ActivityDataset): boolean =>
  d.fuels.length === 0 && d.electricity.length === 0 && d.processEmissions.length === 0 && !(d.annualProductionTonnes > 0);

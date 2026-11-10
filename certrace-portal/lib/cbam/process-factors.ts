/* ════════════════════════════════════════════════════════════
   PROCESS EMISSION FACTORS — structured entry, not narrated arithmetic

   Bug 5's whole point: asking a person to type "electrode consumption ×
   carbon content × 3.664" into a text box is asking them to narrate
   arithmetic the engine should perform. A prose sentence cannot be checked
   by a verifier; a stored (method, material, quantity, factor) tuple can be
   recomputed by anyone who reads it. Every seed value below traces to a
   named source, the same discipline lib/cbam/fuel-defaults.ts already
   applies to fuels.

   TWO PATHS, BOTH STRUCTURED, NEVER A BARE TYPED NUMBER:

     Path A — Standard method    Em_j = AD_j × EF_j × CF_j
     Path B — Mass balance       Em_k = 3.664 × AD_k × CC_k

   Path B's negative sign on an OUTPUT stream is the whole point of the
   method: carbon leaving inside the finished product was never emitted, so
   it is subtracted rather than ignored. See lib/cbam/units.ts's CO2_PER_C
   for why 3.664 (not 3.67) is what this codebase implements — reused here,
   not redefined. */

import { CO2_PER_C } from "./units";

export type CarbonateFactor = {
  material: string;
  tco2PerTCarbonate: number;
  source: string;
};

/** tCO₂ per tonne of carbonate, as the carbonate decomposes to oxide + CO₂. */
export const CARBONATE_FACTORS: CarbonateFactor[] = [
  {
    material: "CaCO3",
    tco2PerTCarbonate: 0.44,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "MgCO3",
    tco2PerTCarbonate: 0.522,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "Na2CO3",
    tco2PerTCarbonate: 0.415,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "BaCO3",
    tco2PerTCarbonate: 0.223,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "Li2CO3",
    tco2PerTCarbonate: 0.596,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "K2CO3",
    tco2PerTCarbonate: 0.318,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "SrCO3",
    tco2PerTCarbonate: 0.298,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "NaHCO3",
    tco2PerTCarbonate: 0.524,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "FeCO3",
    tco2PerTCarbonate: 0.38,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
];

export type OxideFactor = {
  material: string;
  tco2PerTOxide: number;
  source: string;
};

/** Output-based — tCO₂ per tonne of OXIDE produced, not per tonne of the
    carbonate that went in. A different denominator to CARBONATE_FACTORS on
    purpose: some processes measure the output (lime kilns), not the feed. */
export const OXIDE_FACTORS: OxideFactor[] = [
  {
    material: "CaO",
    tco2PerTOxide: 0.785,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "MgO",
    tco2PerTOxide: 1.092,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    material: "BaO",
    tco2PerTOxide: 0.287,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
];

export type OtherFixedFactor = {
  id: string;
  label: string;
  tco2PerUnit: number;
  unit: string;
  source: string;
};

export const OTHER_FIXED_FACTORS: OtherFixedFactor[] = [
  {
    id: "desulphurisation",
    label: "Desulphurisation (gypsum)",
    tco2PerUnit: 0.2558,
    unit: "t gypsum",
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    id: "de_nox_urea",
    label: "De-NOx via urea",
    tco2PerUnit: 0.7328,
    unit: "t urea",
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
  {
    id: "flaring",
    label: "Flaring (fallback)",
    tco2PerUnit: 0.00393,
    unit: "Nm³",
    source: "IR (EU) 2025/2547 Annex II Point G, Table 4",
  },
];

/** All Path A materials in one list, for a single Material picker — each
    row already carries which table it came from and the right unit label. */
export type StandardMaterial = {
  id: string;
  label: string;
  tco2PerUnit: number;
  unit: string;
  source: string;
};

export const STANDARD_MATERIALS: StandardMaterial[] = [
  ...CARBONATE_FACTORS.map((c) => ({
    id: c.material,
    label: `${c.material} (carbonate)`,
    tco2PerUnit: c.tco2PerTCarbonate,
    unit: "t carbonate",
    source: c.source,
  })),
  ...OXIDE_FACTORS.map((o) => ({
    id: o.material,
    label: `${o.material} (oxide, output-based)`,
    tco2PerUnit: o.tco2PerTOxide,
    unit: "t oxide",
    source: o.source,
  })),
  ...OTHER_FIXED_FACTORS.map((f) => ({
    id: f.id,
    label: f.label,
    tco2PerUnit: f.tco2PerUnit,
    unit: f.unit,
    source: f.source,
  })),
];

export const standardMaterialFor = (id: string): StandardMaterial | undefined =>
  STANDARD_MATERIALS.find((m) => m.id === id);

export type CarbonContent = {
  material: string;
  label: string;
  tCPerT: number;
  source: string;
};

/** t carbon per tonne of material — Path B's CC_k. BF, BOF, EAF and
    ferro-alloy routes use this method; see the mass-balance section of the
    build spec for why an integrated route cannot use Path A alone.

    These figures now cite the Annex rather than the internal build spec that
    transcribed them. The screens print the source beside the number so a
    verifier can check it, and "Build spec §5" is not something anyone outside
    this company can look up — the citation has to name the regulation or it
    is decoration. Values are unchanged; only their provenance is. */
export const CARBON_CONTENTS: CarbonContent[] = [
  {
    material: "dri",
    label: "DRI",
    tCPerT: 0.0191,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 5",
  },
  {
    material: "eaf_carbon_electrodes",
    label: "EAF carbon electrodes",
    tCPerT: 0.8188,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 5",
  },
  {
    material: "eaf_charge_carbon",
    label: "EAF charge carbon",
    tCPerT: 0.8297,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 5",
  },
  {
    material: "hbi",
    label: "HBI",
    tCPerT: 0.0191,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 5",
  },
  {
    material: "bof_gas",
    label: "Oxygen steel furnace gas",
    tCPerT: 0.3493,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 5",
  },
  {
    material: "petroleum_coke",
    label: "Petroleum coke",
    tCPerT: 0.8706,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 5",
  },
  {
    material: "pig_iron",
    label: "Pig iron",
    tCPerT: 0.0409,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 5",
  },
  {
    material: "iron_scrap",
    label: "Iron / iron scrap",
    tCPerT: 0.0409,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 5",
  },
  {
    material: "steel_scrap",
    label: "Steel / steel scrap",
    tCPerT: 0.0109,
    source: "IR (EU) 2025/2547 Annex II Point G, Table 5",
  },
];

export const carbonContentFor = (material: string): CarbonContent | undefined =>
  CARBON_CONTENTS.find((c) => c.material === material);

/** Path A: Em_j = AD_j × EF_j × CF_j. CF defaults to 1 and must sit in
    (0, 1] — a conversion factor above 1 or at/below 0 is not a fraction of
    anything. */
export function standardProcessEmission(
  materialId: string,
  quantityT: number,
  conversionFactor = 1,
): number {
  const m = standardMaterialFor(materialId);
  if (!m) return 0;
  return quantityT * m.tco2PerUnit * conversionFactor;
}

/** Path B: Em_k = 3.664 × AD_k × CC_k. `quantityT` is NEGATIVE for an output
    stream — carbon leaving inside the finished good was never emitted, and
    the sign is what subtracts it rather than ignoring it. Reuses
    CO2_PER_C.value (3.664) from lib/cbam/units.ts rather than redefining
    it — one constant, one place its provenance is argued for. */
export function massBalanceProcessEmission(
  material: string,
  quantityT: number,
  carbonContentOverride?: number,
): number {
  // The plant's own analysis, where it gave one, replaces the table; a material the table does not list needs it.
  const cc =
    carbonContentOverride != null && carbonContentOverride > 0
      ? carbonContentOverride
      : carbonContentFor(material)?.tCPerT;
  if (cc == null) return 0;
  return CO2_PER_C.value * quantityT * cc;
}

/* ════════════════════════════════════════════════════════════
   FUEL DENSITY — standard reference densities, step 2 of the NCV conversion

   Point G (lib/cbam/fuel-defaults.ts) gives NCV mass-based — MJ per kilogram,
   for every fuel, gases and liquids included. The portal's monthly form asks
   for MJ per the unit an invoice actually uses, and a Thai invoice for
   natural gas is in m³, for diesel in litres. This table is step 2 of that
   conversion: kilograms per one of those volume units.

   THIS IS ITS OWN TABLE, DELIBERATELY, NOT A FIELD INSIDE fuel-defaults.ts.
   A density is an assumption about a specific fuel at reference conditions —
   it is not a Point G value, it does not share Point G's citation, and it can
   be superseded (a plant with its own gas chromatograph gets a Type II
   figure) independently of anything Point G does. Merging the two into one
   pre-multiplied lookup would make it impossible to say afterwards which half
   of a wrong number was wrong. Do not inline a density into form logic either
   — every row here is named so a verifier reading a locked NCV can see
   exactly what was assumed and when it took effect. */

import type { MonthlyFuelUnit } from "../monthly-data";

export type FuelDensityRow = {
  /** the portal's fuel-type id, e.g. "diesel" */
  fuel: string;
  phase: "liquid" | "gas";
  /** kilograms per one of `unit` */
  kgPerUnit: number;
  unit: Extract<MonthlyFuelUnit, "l" | "m3">;
  source: string;
  /** when this figure took effect — carried so a report filed against an
      older edition of this table remains reproducible after an update */
  effectiveFrom: string;
};

export const FUEL_DENSITY_TABLE: FuelDensityRow[] = [
  /* ISO 13443 reference conditions (15 °C, 101.325 kPa) for a typical Gulf of
     Thailand / imported LNG pipeline composition. Density moves with
     composition, so a plant with a gas chromatograph on the incomer has a
     Type II figure and should use it. */
  {
    fuel: "natural_gas",
    phase: "gas",
    kgPerUnit: 0.7156,
    unit: "m3",
    source:
      "ISO 13443 reference conditions, 15 °C and 101.325 kPa, typical pipeline composition",
    effectiveFrom: "2026-01-01",
  },
  /* Hydrogen-rich, so light. */
  {
    fuel: "coke_oven_gas",
    phase: "gas",
    kgPerUnit: 0.45,
    unit: "m3",
    source: "typical coke oven gas at 15 °C and 101.325 kPa",
    effectiveFrom: "2026-01-01",
  },
  /* CO/CO₂/N₂ heavy, so denser than air. */
  {
    fuel: "blast_furnace_gas",
    phase: "gas",
    kgPerUnit: 1.35,
    unit: "m3",
    source: "typical blast furnace gas at 15 °C and 101.325 kPa",
    effectiveFrom: "2026-01-01",
  },
  /* EN 590 limits automotive diesel to 820-845 kg/m³ at 15 °C; the midpoint
     is what a fuel with no batch certificate is assumed to be. */
  {
    fuel: "diesel",
    phase: "liquid",
    kgPerUnit: 0.8325,
    unit: "l",
    source: "EN 590 density band 820-845 kg/m³ at 15 °C, midpoint",
    effectiveFrom: "2026-01-01",
  },
  /* ISO 8217 residual grades cap at 991 kg/m³ at 15 °C; Thai RMG/HFO sits
     just under that. */
  {
    fuel: "fuel_oil_heavy",
    phase: "liquid",
    kgPerUnit: 0.98,
    unit: "l",
    source: "ISO 8217 residual marine fuel grades at 15 °C",
    effectiveFrom: "2026-01-01",
  },
];

/** Keyed lookup — the shape most call sites want. */
export const FUEL_DENSITY: Record<string, FuelDensityRow> = Object.fromEntries(
  FUEL_DENSITY_TABLE.map((r) => [r.fuel, r]),
);

export const fuelDensityRow = (
  fuelTypeId: string,
): FuelDensityRow | undefined => FUEL_DENSITY[fuelTypeId];

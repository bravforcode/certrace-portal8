/* ════════════════════════════════════════════════════════════
   EU STANDARD VALUES FOR FUELS — Annex II, Point G

   IR (EU) 2025/2547, Annex II, Point G, Table 1 (fossil fuels, 39 rows) and
   Table 2 (biomass materials, 11 rows). Every figure traces to the IPCC 2006
   Guidelines, as the source tables themselves state.

   THIS TABLE IS THE LAST RESORT, NOT THE PREFERRED ANSWER. Point B.5.2 makes a
   Type I standard value admissible only where no Type II value exists — a
   supplier-certified figure, a national inventory value, a laboratory result.
   Nothing in this file or in the screens that read it may present the EU
   default as the recommended option, because the regulation ranks it last.

   ── THE UNIT CONVERSION IS TWO STEPS, AND MUST STAY TWO STEPS ──

   Point G quotes NCV as TJ/Gg, which is GJ/t, which is MJ/kg — MASS-BASED for
   EVERY fuel, gases and liquids included. The portal's monthly form asks for
   MJ per the unit the invoice uses, and a Thai invoice for natural gas is in
   m³ and for diesel is in litres. So:

     step 1 · Point G gives MJ per KILOGRAM of the fuel.
     step 2 · `FUEL_DENSITY` gives KILOGRAMS per the UI's unit.

   MJ per UI unit = (step 1) × (step 2). Do not collapse these into one
   pre-multiplied lookup table: the density is an assumption about a specific
   fuel at reference conditions and the Point G figure is not, and a merged
   table makes it impossible to say afterwards which half of a wrong number
   was wrong.

   ── WHAT IS NOT IN HERE ──

   The grid electricity factor. It is not a Point G value — it comes from a
   five-year moving average under Point D.2.3, Equation 37 — so it changes
   every year and lives in lib/monthly-data.ts with its own dating. Point G
   changes only when the Commission amends Annex II.
   ════════════════════════════════════════════════════════════ */

import type { MonthlyFuelUnit } from "../monthly-data";
import { FUEL_DENSITY, type FuelDensityRow } from "./fuel-density";

/** Re-exported so existing imports of `FUEL_DENSITY`/`DensityEntry` from this
    file keep working — the table itself now lives in its own file,
    fuel-density.ts, per the rule at the top of that file. */
export { FUEL_DENSITY };
export type DensityEntry = FuelDensityRow;

/** The table's own citation, printed beside every locked field. */
export const POINT_G_CITATION = "IR (EU) 2025/2547, Annex II Point G";

/** When this version of the table took effect. Point G has no mandatory review
    cycle — unlike the country default embedded emissions of IR 2025/2621, which
    must be reviewed by December 2027 — so this moves only when the Commission
    amends the Annex. It is carried anyway so a report filed in 2027 can still
    say which edition of the table it was computed against. */
export const POINT_G_EFFECTIVE_FROM = "2026-01-01";

export type PointGRow = {
  /** the fuel name exactly as Point G prints it */
  fuel: string;
  category: "fossil" | "biomass";
  /** tCO₂ per TJ, as printed. Divide by 1000 for the tCO₂/GJ the form uses. */
  efTco2PerTj: number;
  /** TJ/Gg = GJ/t = MJ/kg. Null where the table prints "n.a." */
  ncvGjPerT: number | null;
  table: 1 | 2;
  note?: string;
};

/* ── Table 1 · Fossil fuels ─────────────────────────────────────
   Transcribed from the supplied dataset rather than re-keyed from the PDF.
   Two rows carry a note because they are the waste gases a steel plant feeds
   back into another process, and their EF looks wrong until you notice their
   NCV is a tenth of everything else's. */
export const POINT_G_TABLE: PointGRow[] = [
  { fuel: "Crude oil", category: "fossil", efTco2PerTj: 73.3, ncvGjPerT: 42.3, table: 1 },
  { fuel: "Orimulsion", category: "fossil", efTco2PerTj: 77.0, ncvGjPerT: 27.5, table: 1 },
  { fuel: "Natural gas liquids", category: "fossil", efTco2PerTj: 64.2, ncvGjPerT: 44.2, table: 1 },
  { fuel: "Motor gasoline", category: "fossil", efTco2PerTj: 69.3, ncvGjPerT: 44.3, table: 1 },
  { fuel: "Kerosene (other than jet kerosene)", category: "fossil", efTco2PerTj: 71.9, ncvGjPerT: 43.8, table: 1 },
  { fuel: "Shale oil", category: "fossil", efTco2PerTj: 73.3, ncvGjPerT: 38.1, table: 1 },
  { fuel: "Gas/Diesel oil", category: "fossil", efTco2PerTj: 74.1, ncvGjPerT: 43.0, table: 1 },
  { fuel: "Residual fuel oil", category: "fossil", efTco2PerTj: 77.4, ncvGjPerT: 40.4, table: 1 },
  { fuel: "Liquefied petroleum gases", category: "fossil", efTco2PerTj: 63.1, ncvGjPerT: 47.3, table: 1 },
  { fuel: "Ethane", category: "fossil", efTco2PerTj: 61.6, ncvGjPerT: 46.4, table: 1 },
  { fuel: "Naphtha", category: "fossil", efTco2PerTj: 73.3, ncvGjPerT: 44.5, table: 1 },
  { fuel: "Bitumen", category: "fossil", efTco2PerTj: 80.7, ncvGjPerT: 40.2, table: 1 },
  { fuel: "Lubricants", category: "fossil", efTco2PerTj: 73.3, ncvGjPerT: 40.2, table: 1 },
  { fuel: "Petroleum coke", category: "fossil", efTco2PerTj: 97.5, ncvGjPerT: 32.5, table: 1 },
  { fuel: "Refinery feedstocks", category: "fossil", efTco2PerTj: 73.3, ncvGjPerT: 43.0, table: 1 },
  { fuel: "Refinery gas", category: "fossil", efTco2PerTj: 57.6, ncvGjPerT: 49.5, table: 1 },
  { fuel: "Paraffin waxes", category: "fossil", efTco2PerTj: 73.3, ncvGjPerT: 40.2, table: 1 },
  { fuel: "White spirit and SBP", category: "fossil", efTco2PerTj: 73.3, ncvGjPerT: 40.2, table: 1 },
  { fuel: "Other petroleum products", category: "fossil", efTco2PerTj: 73.3, ncvGjPerT: 40.2, table: 1 },
  { fuel: "Anthracite", category: "fossil", efTco2PerTj: 98.3, ncvGjPerT: 26.7, table: 1 },
  { fuel: "Coking coal", category: "fossil", efTco2PerTj: 94.6, ncvGjPerT: 28.2, table: 1 },
  { fuel: "Other bituminous coal", category: "fossil", efTco2PerTj: 94.6, ncvGjPerT: 25.8, table: 1 },
  { fuel: "Sub-bituminous coal", category: "fossil", efTco2PerTj: 96.1, ncvGjPerT: 18.9, table: 1 },
  { fuel: "Lignite", category: "fossil", efTco2PerTj: 101.0, ncvGjPerT: 11.9, table: 1 },
  { fuel: "Oil shale and tar sands", category: "fossil", efTco2PerTj: 107.0, ncvGjPerT: 8.9, table: 1 },
  { fuel: "Patent fuel", category: "fossil", efTco2PerTj: 97.5, ncvGjPerT: 20.7, table: 1 },
  { fuel: "Coke oven coke and lignite coke", category: "fossil", efTco2PerTj: 107.0, ncvGjPerT: 28.2, table: 1 },
  { fuel: "Gas coke", category: "fossil", efTco2PerTj: 107.0, ncvGjPerT: 28.2, table: 1 },
  { fuel: "Coal tar", category: "fossil", efTco2PerTj: 80.7, ncvGjPerT: 28.0, table: 1 },
  { fuel: "Gas works gas", category: "fossil", efTco2PerTj: 44.4, ncvGjPerT: 38.7, table: 1 },
  { fuel: "Coke oven gas", category: "fossil", efTco2PerTj: 44.4, ncvGjPerT: 38.7, table: 1 },
  {
    fuel: "Blast furnace gas",
    category: "fossil",
    efTco2PerTj: 260.0,
    ncvGjPerT: 2.47,
    table: 1,
    note: "A waste gas. Where it is burned in a DIFFERENT production process from the one that made it, Annex III Equations 53–54 correct the transfer against the standard factor for natural gas rather than this one.",
  },
  {
    fuel: "Oxygen steel furnace gas",
    category: "fossil",
    efTco2PerTj: 182.0,
    ncvGjPerT: 7.06,
    table: 1,
    note: "A waste gas. Same Annex III Equations 53–54 treatment as blast furnace gas when it crosses a production-process boundary.",
  },
  { fuel: "Natural gas", category: "fossil", efTco2PerTj: 56.1, ncvGjPerT: 48.0, table: 1 },
  { fuel: "Industrial wastes", category: "fossil", efTco2PerTj: 143.0, ncvGjPerT: null, table: 1, note: "Point G prints no NCV for this row." },
  { fuel: "Waste oils", category: "fossil", efTco2PerTj: 73.3, ncvGjPerT: 40.2, table: 1 },
  { fuel: "Peat", category: "fossil", efTco2PerTj: 106.0, ncvGjPerT: 9.76, table: 1 },
  {
    fuel: "Waste tyres",
    category: "fossil",
    efTco2PerTj: 85.0,
    ncvGjPerT: null,
    table: 1,
    note: "WBCSD CSI value. A preliminary factor — the biomass fraction is applied to it under Equation 10. Point G prints no NCV.",
  },
  { fuel: "Carbon monoxide", category: "fossil", efTco2PerTj: 155.2, ncvGjPerT: 10.1, table: 1 },
  { fuel: "Methane", category: "fossil", efTco2PerTj: 54.9, ncvGjPerT: 50.0, table: 1 },

  /* ── Table 2 · Biomass materials ──────────────────────────────
     Every EF here is PRELIMINARY. Equation 10 multiplies it by (1 − BF), and
     BF is zero unless the sustainability criteria of Directive (EU) 2018/2001
     Article 29(2)–(7) and (10) are evidenced — Annex II Point B.3.3. */
  { fuel: "Wood / Wood waste (air dry)", category: "biomass", efTco2PerTj: 112.0, ncvGjPerT: 15.6, table: 2, note: "~15% moisture assumed." },
  { fuel: "Sulphite lyes (black liquor)", category: "biomass", efTco2PerTj: 95.3, ncvGjPerT: 11.8, table: 2 },
  { fuel: "Other primary solid biomass", category: "biomass", efTco2PerTj: 100.0, ncvGjPerT: 11.6, table: 2 },
  { fuel: "Charcoal", category: "biomass", efTco2PerTj: 112.0, ncvGjPerT: 29.5, table: 2 },
  { fuel: "Biogasoline", category: "biomass", efTco2PerTj: 70.8, ncvGjPerT: 27.0, table: 2 },
  { fuel: "Biodiesels", category: "biomass", efTco2PerTj: 70.8, ncvGjPerT: 37.0, table: 2, note: "NCV from Annex III of Directive (EU) 2018/2001." },
  { fuel: "Other liquid biofuels", category: "biomass", efTco2PerTj: 79.6, ncvGjPerT: 27.4, table: 2 },
  { fuel: "Landfill gas", category: "biomass", efTco2PerTj: 54.6, ncvGjPerT: 50.4, table: 2, note: "Pure biomethane — correct for the methane content of the actual gas." },
  { fuel: "Sludge gas", category: "biomass", efTco2PerTj: 54.6, ncvGjPerT: 50.4, table: 2, note: "Pure biomethane — correct for the methane content of the actual gas." },
  { fuel: "Other biogas", category: "biomass", efTco2PerTj: 54.6, ncvGjPerT: 50.4, table: 2, note: "Pure biomethane — correct for the methane content of the actual gas." },
  {
    fuel: "Municipal waste (biomass fraction)",
    category: "biomass",
    efTco2PerTj: 100.0,
    ncvGjPerT: 11.6,
    table: 2,
    note: "The fossil fraction of municipal waste is a separate row — EF 91.7, NCV 10 GJ/t — and is tracked on its own.",
  },
];

export const pointGRow = (fuel: string): PointGRow | undefined => POINT_G_TABLE.find((r) => r.fuel === fuel);

/* ── The portal's fuel list, mapped onto Point G ────────────────
   lib/monthly-data.ts carries ten fuels chosen for a Thai steel and aluminium
   portal; Point G carries fifty categories. The mapping is here, and it is
   explicit rather than fuzzy-matched on the label, because "Coke" matching
   "Gas coke" instead of "Coke oven coke" is a 0% error nobody would see.

   Where the portal merged two Point G categories into one row, the mapping
   picks the MORE CONSERVATIVE of the two — the one that produces the higher
   tCO₂ per tonne — and says so. Understating is the failure that costs an
   exporter a verifier's opinion; overstating only costs them certificates
   they can avoid by supplying a Type II figure. */
export type FuelDefaultMapping = {
  /** the Point G row name */
  pointG: string;
  /** shown beside the locked fields when the portal's row is not a 1:1 match */
  caveat?: string;
};

export const FUEL_TYPE_TO_POINT_G: Record<string, FuelDefaultMapping> = {
  coking_coal: { pointG: "Coking coal" },
  coke: { pointG: "Coke oven coke and lignite coke" },
  anthracite_bituminous: {
    pointG: "Anthracite",
    caveat:
      "This row covers two Point G categories — Anthracite (98.3) and Other bituminous coal (94.6). The anthracite figure is used because it is the higher of the two per tonne. If you burn bituminous coal and have a spec sheet, enter it as a laboratory or supplier value instead.",
  },
  fuel_oil_heavy: { pointG: "Residual fuel oil" },
  diesel: { pointG: "Gas/Diesel oil" },
  lpg: { pointG: "Liquefied petroleum gases" },
  natural_gas: { pointG: "Natural gas" },
  coke_oven_gas: { pointG: "Coke oven gas" },
  blast_furnace_gas: { pointG: "Blast furnace gas" },
  biomass: {
    pointG: "Other primary solid biomass",
    caveat:
      "A PRELIMINARY factor. Annex II Equation 10 multiplies it by (1 − biomass fraction), and the fraction stays at zero until the sustainability criteria of Directive (EU) 2018/2001 are evidenced.",
  },
};

/** Kilograms in one of the UI's units, for this fuel. Null when the unit is
    GJ (energy already) or when the fuel has no density on file for a volume
    unit — the second case is what stops a silent 1 kg/litre assumption. */
export function kgPerUnit(fuelTypeId: string, unit: MonthlyFuelUnit): number | null {
  if (unit === "GJ") return null;
  if (unit === "t") return 1000;
  if (unit === "kg") return 1;
  const density = FUEL_DENSITY[fuelTypeId];
  if (!density || density.unit !== unit) return null;
  return density.kgPerUnit;
}

export type FuelDefault = {
  /** MJ per one of the requested units. Null when it cannot be derived. */
  ncvMjPerUnit: number | null;
  /** tCO₂ per GJ */
  efTco2PerGj: number;
  /** one line naming the table and, where used, the density behind the NCV */
  citation: string;
  /** the mapping's caveat, if the portal's row is not a 1:1 match */
  caveat?: string;
  /** true for Table 2 rows — the EF is preliminary until Equation 10 is applied */
  biomass: boolean;
  row: PointGRow;
};

/** The EU standard values for one of the portal's fuels, in the unit the form
    is asking in. THE SINGLE PLACE THE TWO-STEP CONVERSION HAPPENS, AND IT
    MUST STAY TWO STEPS — deliberately not collapsed into one pre-multiplied
    lookup (see the file header). Step 1 divides Point G's TJ-basis EF by
    1000 to reach tCO₂/GJ; step 2 multiplies Point G's mass-basis NCV
    (GJ/t = MJ/kg) by fuel-density.ts's kg-per-UI-unit figure. Collapsing
    these into one number would make it impossible to tell afterwards which
    of the two source tables a wrong figure came from. */
export function euStandardFor(fuelTypeId: string, unit: MonthlyFuelUnit): FuelDefault | null {
  const mapping = FUEL_TYPE_TO_POINT_G[fuelTypeId];
  if (!mapping) return null;
  const row = pointGRow(mapping.pointG);
  if (!row) return null;

  // step 1 · TJ → GJ. Point G quotes the emission factor per terajoule; the
  // form works in gigajoules, a thousandth of that — not a thousand.
  const efTco2PerGj = round(row.efTco2PerTj / 1000, 6);

  // step 2 · Point G's NCV is MJ per kilogram (mass-basis, every fuel).
  // fuel-density.ts converts that to MJ per the UI's volume unit.
  const perKg = row.ncvGjPerT;
  const kg = kgPerUnit(fuelTypeId, unit);
  const ncvMjPerUnit = perKg == null || kg == null ? null : round(perKg * kg, 4);

  const density = FUEL_DENSITY[fuelTypeId];
  const usedDensity = density && density.unit === unit;

  return {
    ncvMjPerUnit,
    efTco2PerGj,
    citation: usedDensity
      ? `${row.fuel} — ${POINT_G_CITATION}. NCV converted from ${row.ncvGjPerT} GJ/t using ${density.kgPerUnit} kg/${unit === "m3" ? "m³" : "litre"} (${density.source}).`
      : `${row.fuel} — ${POINT_G_CITATION}.`,
    caveat: mapping.caveat,
    biomass: row.category === "biomass",
    row,
  };
}

/** The locked-field copy for a Type I (EU standard) row — states the source,
    never disclaims it. "Certrace will not substitute a standard value" is the
    right sentence for a Type II field with nothing entered; it is the wrong
    sentence here, because substituting the standard value is exactly what
    Type I means. */
export function euStandardLockedHint(fuelTypeId: string, unit: MonthlyFuelUnit): string | null {
  const d = euStandardFor(fuelTypeId, unit);
  if (!d) return null;
  const ncv = d.ncvMjPerUnit != null ? ` · ${round(d.ncvMjPerUnit / 1000, 4)} GJ/${unit === "m3" ? "m³" : unit === "l" ? "litre" : unit}` : "";
  return `${d.efTco2PerGj} tCO₂/GJ${ncv} — EU standard value, IPCC 2006 GL (${POINT_G_CITATION}). Locked.`;
}

/** Does this fuel have EU standard values at all? Fuels typed as "Other" never
    do — Point G names categories, and an unlisted fuel is by definition not
    one of them, so its factors must come from a laboratory or the supplier. */
export const hasEuStandard = (fuelTypeId: string): boolean => Boolean(FUEL_TYPE_TO_POINT_G[fuelTypeId]);

/** Whether an entered pair matches the standard values, within the tolerance
    a rounded display needs. Used by validation to refuse a row claiming to be
    an EU standard value while carrying something else — the API-side half of
    the lock, which a disabled input alone cannot provide. */
export function matchesEuStandard(fuelTypeId: string, unit: MonthlyFuelUnit, ncvMjPerUnit: number | undefined, efTco2PerGj: number): boolean {
  const d = euStandardFor(fuelTypeId, unit);
  if (!d) return false;
  const efOk = close(efTco2PerGj, d.efTco2PerGj, 1e-6);
  if (unit === "GJ") return efOk;
  if (d.ncvMjPerUnit == null) return efOk;
  return efOk && close(Number(ncvMjPerUnit), d.ncvMjPerUnit, 1e-3);
}

/* Waste gases recovered from another production process. Annex III Equations
   53–54 correct these against the standard factor for natural gas when they
   cross a production-process boundary, and their own Point G factor is an
   order of magnitude outside every other fuel's — 0.26 tCO₂/GJ for blast
   furnace gas — because the NCV underneath it is a tenth of everything else's.
   Anything that range-checks an emission factor has to know that, or it
   reports every integrated steel plant in Thailand as out of band. */
export const WASTE_GAS_FUEL_IDS = ["blast_furnace_gas", "coke_oven_gas", "bof_gas"] as const;

export const isWasteGas = (fuelTypeId: string): boolean => (WASTE_GAS_FUEL_IDS as readonly string[]).includes(fuelTypeId);

const round = (n: number, dp: number): number => Number(n.toFixed(dp));
const close = (a: number, b: number, tol: number): boolean => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;

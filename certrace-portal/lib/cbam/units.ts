/* ════════════════════════════════════════════════════════════
   CANONICAL UNITS — the single most load-bearing file in lib/cbam/

   A verifier does not accept an emissions figure, they re-derive it. Every
   re-derivation that has ever gone wrong in this domain went wrong the same
   way: two people carried the same number in two different units and neither
   said which. So the canon is fixed here, once, and every conversion happens
   at the point of ENTRY — never again downstream.

     energy         GJ
     fuel EF        tCO₂ / GJ        ← never per m³, per kg, per litre
     electricity    MWh, ABSOLUTE    ← never MWh per tonne
     electricity EF tCO₂ / MWh
     mass           t
     SEE            tCO₂e / t

   The fuel rule is the one that silently destroys a number. Emission factors
   for fuels are published per unit of ENERGY, not per unit of volume: natural
   gas is ≈0.0561 tCO₂/GJ, and the same figure read as tCO₂/m³ overstates the
   result by roughly 25×. A quantity in m³/kg/l/t therefore cannot become
   energy without a net calorific value, and `toGJ` refuses to guess one — a
   hardcoded fallback NCV would be exactly the invisible assumption this
   module exists to prevent.
   ════════════════════════════════════════════════════════════ */

export const CANONICAL = {
  energy: "GJ",
  fuelEF: "tCO2/GJ",
  electricity: "MWh",
  elecEF: "tCO2/MWh",
  mass: "t",
  see: "tCO2e/t",
} as const;

/** Display strings for the canon, for labels and hints. */
export const CANONICAL_LABEL = {
  energy: "GJ",
  fuelEF: "tCO₂/GJ",
  electricity: "MWh (absolute)",
  elecEF: "tCO₂/MWh",
  mass: "t",
  see: "tCO₂e/t",
} as const;

/* ── Fuel quantity units ────────────────────────────────────────
   The units a fuel is actually invoiced or metered in. Only GJ is already
   energy; everything else needs an NCV to reach the canon. */
export type FuelUnit = "m3" | "kg" | "t" | "l" | "GJ";

export const FUEL_UNITS: FuelUnit[] = ["m3", "kg", "t", "l", "GJ"];

export const FUEL_UNIT_LABEL: Record<FuelUnit, string> = {
  m3: "m³",
  kg: "kg",
  t: "t",
  l: "litres",
  GJ: "GJ",
};

/** NCV is the bridge from a physical quantity to energy — GJ per one of THIS
    unit. Only a quantity already in GJ can skip it. */
export const needsNcv = (unit: FuelUnit): boolean => unit !== "GJ";

/** The NCV a given unit must be expressed in, for labels and error copy. */
export const ncvUnitLabel = (unit: FuelUnit): string =>
  `GJ per ${FUEL_UNIT_LABEL[unit]}`;

/* ── Sourced constants ──────────────────────────────────────────
   Build rule (spec §0): every numeric constant names its origin. "ASSUMPTION"
   is a legal origin — it just has to say so out loud, and the UI renders it
   with a warning wherever it reaches a number a verifier would test. */
export type SourcedNumber = {
  value: number;
  /** regulation article, national dataset name, or the literal "ASSUMPTION" */
  source: string;
};

export const isAssumedSource = (source: string): boolean =>
  source.trim().toUpperCase() === "ASSUMPTION";

/* Conversion of elemental carbon to CO₂.

   Written "44/12" everywhere as shorthand, but the operative constant is
   3.664 — the ratio of the actual molar masses (44.010 / 12.011), which is
   the figure EU MRR 2018/2066 fixes and the one a verifier recomputes with.
   The naive 44/12 = 3.6667 is 0.07% high, which sounds like nothing until it
   moves a process-emissions line by a tonne and the recomputation no longer
   ties out.

   ⚠️ The source specification for this build states the formula as "44/12 =
   3.664" — the two are not the same number, and its own §5.6 check values
   were produced with 3.664. 3.664 is what is implemented here, because it is
   what the regulation says and what the fixture reproduces. */
export const CO2_PER_C: SourcedNumber = {
  value: 3.664,
  source:
    "EU MRR (EU) 2018/2066 — standard conversion factor t CO₂ / t C, from molar masses 44.010 / 12.011",
};

/* ── Errors ─────────────────────────────────────────────────────
   A unit failure is not a validation warning to be overridden — it is a
   refusal to compute. Everything that catches this must show the message,
   never swallow it into a zero. */
export class UnitError extends Error {
  readonly code = "UNIT_ERROR";
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "UnitError";
    this.field = field;
  }
}

/* ── The one conversion ─────────────────────────────────────────
   Applied ONCE, at entry:

     E_fuel_GJ = Q_fuel × NCV

   where Q_fuel is the quantity in its native unit and NCV is the net
   calorific value in GJ per that same unit. Spec §5.1. */
export function toGJ(quantity: number, unit: FuelUnit, ncv?: number): number {
  if (!Number.isFinite(quantity)) {
    throw new UnitError("Fuel quantity is not a number.", "quantity");
  }
  if (unit === "GJ") return quantity;
  if (ncv == null || !Number.isFinite(ncv) || ncv <= 0) {
    throw new UnitError(
      `A quantity in ${FUEL_UNIT_LABEL[unit]} cannot be converted to energy without a net calorific value. ` +
        `Enter the NCV in ${ncvUnitLabel(unit)} — taken from the fuel's spec sheet or supplier invoice. ` +
        `Certrace will not substitute a standard value: the wrong NCV moves the emissions figure a verifier recomputes.`,
      "ncv",
    );
  }
  return quantity * ncv;
}

/* ── Electricity ────────────────────────────────────────────────
   Absolute MWh for the period is the canon. Legacy records collected the
   field per tonne of output, and a per-tonne value divided by production a
   second time understates indirect emissions by the square of the tonnage —
   the double-division bug this build exists to close (spec §5.3, gap G1). */
export type ElectricityUnit = "MWh_absolute" | "MWh_per_tonne";

export const ELECTRICITY_UNIT_LABEL: Record<ElectricityUnit, string> = {
  MWh_absolute: "MWh (absolute, whole period)",
  MWh_per_tonne: "MWh per tonne (legacy)",
};

/** Absolute MWh for the period, whichever way the value was stored.
    Converts a legacy per-tonne value ONCE, by multiplying by production —
    after this the engine only ever divides. */
export function toAbsoluteMWh(
  value: number,
  unit: ElectricityUnit,
  annualProductionTonnes: number,
): number {
  if (!Number.isFinite(value))
    throw new UnitError("Electricity quantity is not a number.", "mwh");
  if (unit === "MWh_absolute") return value;
  if (!(annualProductionTonnes > 0)) {
    throw new UnitError(
      "A legacy per-tonne electricity value needs the annual production quantity before it can be converted to absolute MWh.",
      "annualProductionTonnes",
    );
  }
  return value * annualProductionTonnes;
}

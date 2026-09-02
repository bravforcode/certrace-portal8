/* ════════════════════════════════════════════════════════════
   THE ELECTRICITY UNIT MIGRATION (gap G1)

   The field `elec-consumed` used to be labelled "Electricity consumed
   (MWh/t)" — a value already divided by output. The calculation then divided
   by output a SECOND time, so indirect emissions came out low by a factor of
   the tonnage. On a 10,500 t installation that is not a rounding error, it is
   a four-orders-of-magnitude understatement, and it is precisely the kind of
   thing a verifier finds by recomputing one number by hand.

   The field now collects ABSOLUTE MWh for the reporting period. Per-tonne is
   derived once, inside the engine, by dividing by the production quantity.

   Values already in the store have no way to say which convention they were
   typed under — so absence of the unit tag IS the legacy signal:

     tagged 'MWh_absolute'   → new value, use as-is
     tagged 'MWh_per_tonne'  → explicitly legacy, multiply by output ONCE
     no tag at all           → collected before this change, treat as legacy

   Nothing here ever divides. Multiplying a legacy value by output converts it
   INTO the canon; the engine's single division then takes it back out.
   ════════════════════════════════════════════════════════════ */

import { valueKey } from "../supplier";
import type { ElectricityUnit } from "./units";
import { toAbsoluteMWh } from "./units";

/** Sibling value key holding the unit convention of `elec-consumed`. Not a
    question the supplier answers — it is stamped whenever the value is
    written, so every future read knows what it is looking at. */
export const ELEC_UNIT_FIELD = "elec-consumed-unit";

/** The field that carries the denominator on the supplier side: the
    installation's own output of this good in the period. Distinct from
    `quantity`, which is only what THIS exporter bought. */
export const OUTPUT_FIELD = "production-output";

export const elecUnitKey = (productId?: string) => valueKey(ELEC_UNIT_FIELD, productId);

const num = (raw: string | undefined): number | null => {
  if (!raw || !raw.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export type ElectricityReading = {
  /** the number as stored, in whatever unit it was stored in */
  raw: number | null;
  unit: ElectricityUnit;
  /** true when the value predates the unit change and had to be assumed per-tonne */
  legacy: boolean;
  /** the installation's output of this good in the period, tonnes */
  outputTonnes: number | null;
  /** canonical absolute MWh — null when a legacy value has no output to convert with */
  mwhAbsolute: number | null;
  /** MWh per tonne, derived. Only ever computed here, never stored. */
  perTonne: number | null;
  /** a legacy value that cannot be converted until output is entered */
  blockedOnOutput: boolean;
};

/** Read one product's electricity figure in canonical absolute MWh.
    `outputOverride` lets the exporter side pass the activity dataset's
    production quantity when the supplier's own output field is empty. */
export function readElectricity(
  values: Record<string, string>,
  productId?: string,
  outputOverride?: number | null,
): ElectricityReading {
  const raw = num(values[valueKey("elec-consumed", productId)]);
  const tag = values[elecUnitKey(productId)];
  const unit: ElectricityUnit = tag === "MWh_absolute" ? "MWh_absolute" : "MWh_per_tonne";
  const legacy = tag !== "MWh_absolute" && tag !== "MWh_per_tonne";
  const outputTonnes = num(values[valueKey(OUTPUT_FIELD, productId)]) ?? outputOverride ?? null;

  if (raw == null) {
    return { raw: null, unit, legacy, outputTonnes, mwhAbsolute: null, perTonne: null, blockedOnOutput: false };
  }

  if (unit === "MWh_absolute") {
    return {
      raw,
      unit,
      legacy,
      outputTonnes,
      mwhAbsolute: raw,
      perTonne: outputTonnes && outputTonnes > 0 ? raw / outputTonnes : null,
      blockedOnOutput: false,
    };
  }

  // Legacy per-tonne. Convert UP to absolute exactly once; never divide.
  if (!(outputTonnes && outputTonnes > 0)) {
    return { raw, unit, legacy, outputTonnes, mwhAbsolute: null, perTonne: raw, blockedOnOutput: true };
  }
  return {
    raw,
    unit,
    legacy,
    outputTonnes,
    mwhAbsolute: toAbsoluteMWh(raw, "MWh_per_tonne", outputTonnes),
    perTonne: raw,
    blockedOnOutput: false,
  };
}

/** The patch to merge into a value map when the electricity figure is written.
    One place, so a value can never be saved without its unit. */
export const stampElectricityUnit = (productId?: string): Record<string, string> => ({
  [elecUnitKey(productId)]: "MWh_absolute",
});

/* ── The one-time notice ────────────────────────────────────────
   Affected declarations get a banner rather than a silent reinterpretation:
   the exporter sees the stored number, what it is now read as, and what the
   indirect figure becomes — then confirms. A migration nobody was told about
   is indistinguishable from a bug. */
export type ElectricityMigrationRow = {
  productId: string;
  productName: string;
  /** stored value, read as MWh per tonne */
  beforeMWhPerTonne: number;
  outputTonnes: number | null;
  /** the same figure in the canon */
  afterMWhAbsolute: number | null;
  /** indirect SEE it produces, tCO₂e/t, when a factor is on file */
  indirectPerTonne: number | null;
  blockedOnOutput: boolean;
};

export type ElectricityMigration = {
  rows: ElectricityMigrationRow[];
  /** nothing to say — either no electricity data or everything already tagged */
  clean: boolean;
};

/** Extract the numeric part of a factor field that may read "0.4999 tCO₂/MWh
    (TGO 2023)". Same tolerance the AI check has always applied. */
export function factorNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = /-?\d+(?:\.\d+)?/.exec(raw);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

export function planElectricityMigration(
  values: Record<string, string>,
  products: { id: string; name: string }[],
  outputOverride?: number | null,
): ElectricityMigration {
  const rows: ElectricityMigrationRow[] = [];
  for (const p of products) {
    const reading = readElectricity(values, p.id, outputOverride);
    if (reading.raw == null || !reading.legacy) continue;
    const factor = factorNumber(values[valueKey("elec-factor", p.id)]);
    rows.push({
      productId: p.id,
      productName: p.name,
      beforeMWhPerTonne: reading.raw,
      outputTonnes: reading.outputTonnes,
      afterMWhAbsolute: reading.mwhAbsolute,
      indirectPerTonne: factor != null && factor > 0 ? reading.raw * factor : null,
      blockedOnOutput: reading.blockedOnOutput,
    });
  }
  return { rows, clean: rows.length === 0 };
}

/** Mark a declaration's migration notice as seen, so it appears once. */
const ACK_KEY = "certrace:elec-migration-ack";

export function migrationAcknowledged(declId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(ACK_KEY);
    return raw ? (JSON.parse(raw) as string[]).includes(declId) : false;
  } catch {
    return false;
  }
}

export function acknowledgeMigration(declId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ACK_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(declId)) window.localStorage.setItem(ACK_KEY, JSON.stringify([...list, declId]));
  } catch {
    /* ignore */
  }
}

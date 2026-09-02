/* ════════════════════════════════════════════════════════════
   THE CALCULATION ENGINE

   Six formulas, implemented verbatim from the specification, as pure
   functions of an ActivityDataset and a precursor tree. No localStorage, no
   React, no Date.now() inside the maths — which is what makes it testable
   against a fixture, and what lets a verifier re-run it and land on the same
   number to seven decimal places.

     F1  E_dir  = Σ_f [ Q_f × NCV_f × EF_f × OX_f ] + Σ_p [ m_p × CC_p × 44/12 ]
         SEE_dir = E_dir / Q_prod
     F2  E_ind  = Σ_e [ MWh_e × EF_e ]        (MWh ABSOLUTE, never per tonne)
         SEE_ind = E_ind / Q_prod
     F3  precursor contribution, depth-first  (lib/cbam/precursor-tree.ts)
     F4  SEE_total_reported   = dir + ind + prec
         SEE_total_chargeable = dir + prec        (Annex II sectors)
                              = dir + ind + prec  (everywhere else)
     F5  T_buyer = Σ_s [ q_s × SEE_chargeable(decl valid on that shipment's date) ]
     F6  Exposure = (D_default − SEE_chargeable) × q × P_cert × (1 + markup)

   Two disciplines the rest of the codebase depends on:

   FULL PRECISION THROUGHOUT. Nothing here rounds. Rounding is a display
   decision and it belongs at the edge — round in the middle and the verifier's
   recomputation drifts from yours in the fourth decimal, which is exactly the
   kind of discrepancy that turns a half-day review into a week.

   THE SECTOR RULE LIVES IN ONE MAP. Whether indirect emissions are chargeable
   is a property of the aggregated goods category, stated once in
   INDIRECT_CHARGEABLE below. There is no `if (steel)` anywhere else in this
   codebase, and there must never be: scattering it is how one screen ends up
   billing for Scope 2 while another doesn't.
   ════════════════════════════════════════════════════════════ */

import { toGJ, UnitError, CO2_PER_C } from "./units";
import type { ActivityDataset, FuelEntry, ElectricityEntry, ProcessEmissionEntry } from "./activity";
import { precursorSEE, type PrecursorNode } from "./precursor-tree";

/* ── The sector rule, stated once ───────────────────────────────
   Annex II to Regulation (EU) 2023/956: for iron & steel, aluminium and
   hydrogen only DIRECT emissions enter the financial obligation, because
   those sectors receive indirect-cost compensation under the EU ETS
   State-aid framework. Indirect emissions are still REPORTED for every good
   — they just don't reach the certificate bill. */
export type GoodsCategory = "Iron & Steel" | "Aluminium" | "Cement" | "Fertilisers" | "Hydrogen" | "Electricity";

export const INDIRECT_CHARGEABLE: Record<GoodsCategory, boolean> = {
  "Iron & Steel": false, // Annex II — direct only
  Aluminium: false, // Annex II — direct only
  Hydrogen: false, // Annex II — direct only
  Cement: true,
  Fertilisers: true,
  Electricity: true,
};

export const indirectIsChargeable = (category: GoodsCategory): boolean => INDIRECT_CHARGEABLE[category] ?? true;

/* ── Errors ─────────────────────────────────────────────────────
   A missing denominator is not a zero. Dividing by an absent production
   quantity would silently produce Infinity or NaN and carry it into a filing,
   so the engine refuses instead. */
export class EngineError extends Error {
  readonly code: "NO_DENOMINATOR";

  constructor(code: "NO_DENOMINATOR", message: string) {
    super(message);
    this.name = "EngineError";
    this.code = code;
  }
}

function denominator(dataset: Pick<ActivityDataset, "annualProductionTonnes">): number {
  const q = dataset.annualProductionTonnes;
  if (!(q > 0) || !Number.isFinite(q)) {
    throw new EngineError(
      "NO_DENOMINATOR",
      "Annual production quantity is missing or zero. Every per-tonne figure divides by it, so nothing can be computed until it is entered — and it is entered from production records, never derived from shipments.",
    );
  }
  return q;
}

/* ── F1 · Direct ────────────────────────────────────────────────
   Fuel combustion plus process emissions. A fuel row whose unit is not
   already GJ and carries no NCV throws out of toGJ rather than contributing
   a wrong number — see lib/cbam/units.ts and validation V1. */
export type EntryResult = { id: string; label: string; tCO2: number };

export type DirectResult = {
  /** tCO₂ for the whole period */
  total: number;
  /** tCO₂e per tonne of output */
  perTonne: number;
  byEntry: EntryResult[];
  /** the fuel/process split, because they are monitored by different teams */
  fuelTCO2: number;
  processTCO2: number;
};

export function fuelTCO2(f: FuelEntry): number {
  const gj = toGJ(f.quantity, f.unit, f.ncv);
  return gj * f.emissionFactor * (f.oxidationFactor ?? 1);
}

export const processTCO2 = (p: ProcessEmissionEntry): number => p.massTonnes * p.carbonContent * CO2_PER_C.value;

export const electricityTCO2 = (e: ElectricityEntry): number => e.mwhAbsolute * e.emissionFactor;

export function directSEE(dataset: ActivityDataset): DirectResult {
  const q = denominator(dataset);
  const byEntry: EntryResult[] = [];
  let fuelTotal = 0;
  let processTotal = 0;

  for (const f of dataset.fuels) {
    const tCO2 = fuelTCO2(f);
    fuelTotal += tCO2;
    byEntry.push({ id: f.id, label: `${f.fuel} (${f.quantity} ${f.unit})`, tCO2 });
  }
  for (const p of dataset.processEmissions) {
    const tCO2 = processTCO2(p);
    processTotal += tCO2;
    byEntry.push({ id: p.id, label: `${p.material || "process material"} (${p.massTonnes} t)`, tCO2 });
  }

  const total = fuelTotal + processTotal;
  return { total, perTonne: total / q, byEntry, fuelTCO2: fuelTotal, processTCO2: processTotal };
}

/* ── F2 · Indirect ──────────────────────────────────────────────
   MWh is ABSOLUTE for the period. The single division below is the ONLY
   place per-tonne electricity is derived; a value stored per tonne must be
   converted up before it arrives here (lib/cbam/electricity-migration.ts). */
export type IndirectResult = {
  total: number;
  perTonne: number;
  byEntry: EntryResult[];
  /** MWh per tonne — the sanity check a steelmaker recognises instantly */
  mwhPerTonne: number;
};

export function indirectSEE(dataset: ActivityDataset): IndirectResult {
  const q = denominator(dataset);
  const byEntry: EntryResult[] = [];
  let total = 0;
  let mwh = 0;

  for (const e of dataset.electricity) {
    const tCO2 = electricityTCO2(e);
    total += tCO2;
    mwh += e.mwhAbsolute;
    byEntry.push({ id: e.id, label: `${e.mwhAbsolute} MWh @ ${e.emissionFactor} tCO₂/MWh`, tCO2 });
  }

  return { total, perTonne: total / q, byEntry, mwhPerTonne: mwh / q };
}

/* ── F3 · Precursors ───────────────────────────────────────────
   Delegates to the tree, which owns the depth-first recursion, the scrap
   short-circuit and the cycle guard. */
export const precursorContribution = (tree: PrecursorNode[]) => precursorSEE(tree);

/* ── F4 · Totals ────────────────────────────────────────────────
   Reported is what the filing discloses. Chargeable is what it costs. They
   differ for Annex II goods, and conflating them is the single most expensive
   mistake an exporter can make in either direction. */
export type TotalResult = {
  direct: number;
  indirect: number;
  precursor: number;
  reported: number;
  chargeable: number;
  /** did indirect enter the chargeable figure for this category? */
  indirectCounted: boolean;
  category: GoodsCategory;
};

export function totalSEE(dataset: ActivityDataset, tree: PrecursorNode[], category: GoodsCategory): TotalResult {
  const dir = directSEE(dataset).perTonne;
  const ind = indirectSEE(dataset).perTonne;
  const prec = precursorSEE(tree).perTonne;
  const indirectCounted = indirectIsChargeable(category);

  return {
    direct: dir,
    indirect: ind,
    precursor: prec,
    reported: dir + ind + prec,
    chargeable: dir + prec + (indirectCounted ? ind : 0),
    indirectCounted,
    category,
  };
}

/* ── F5 · Per-buyer totals ─────────────────────────────────────
   T_buyer = Σ_s [ q_s × SEE_chargeable(decl(s)) ]

   `seeForShipment` is asked per shipment WITH ITS DATE, so a caller that
   versions its calculation returns the snapshot valid then. Blending across
   versions after a mid-year re-baseline is the failure this signature exists
   to make impossible; a null return leaves the tonnes visible and unpriced
   rather than silently counted as zero. */
export type ShipmentLike = { buyer: string; buyerEori?: string; date: string; declarationId: string | null; quantityTonnes: number };

export type BuyerRow = {
  buyer: string;
  buyerEori?: string;
  shipments: number;
  tonnes: number;
  embeddedTCO2e: number;
  unpricedTonnes: number;
};

export function perBuyerTotals(
  shipments: ShipmentLike[],
  seeForShipment: (declarationId: string, shipmentDate: string) => number | null,
): BuyerRow[] {
  const rows = new Map<string, BuyerRow>();
  for (const s of shipments) {
    if (!s.declarationId) continue; // pending shipments are never attributed
    const row = rows.get(s.buyer) ?? { buyer: s.buyer, buyerEori: s.buyerEori, shipments: 0, tonnes: 0, embeddedTCO2e: 0, unpricedTonnes: 0 };
    const see = seeForShipment(s.declarationId, s.date);
    row.shipments += 1;
    row.tonnes += s.quantityTonnes;
    if (see == null) row.unpricedTonnes += s.quantityTonnes;
    else row.embeddedTCO2e += s.quantityTonnes * see;
    rows.set(s.buyer, row);
  }
  return [...rows.values()].sort((a, b) => b.embeddedTCO2e - a.embeddedTCO2e);
}

/* ── F6 · Default-value exposure ───────────────────────────────
   Framed as RISK, never as a saving.

   Falling back to a published default is not a discount an exporter earns —
   it is what happens when the data is not there, and in the definitive period
   it carries a markup that rises every year. So the output of this function
   is the cost of NOT having the data. And when the installation is genuinely
   worse than the default, `delta` goes negative: that is an ADDED cost of
   reporting actual data, and it is presented as a cost, never as a negative
   saving. */
export type ExposureParams = {
  /** published default value for the CN code, tCO₂e/t — see reference.ts */
  defaultValue: number;
  /** the installation's own chargeable figure, tCO₂e/t */
  chargeableSEE: number;
  /** tonnes exposed */
  quantityTonnes: number;
  /** certificate price, currency per tCO₂e — INJECTED, never hardcoded */
  certificatePrice: number;
  /** DEFAULT_VALUE_MARKUP for the reporting year (2026: 0.1, 2027: 0.2, 2028: 0.3) */
  markup: number;
};

export type ExposureResult = {
  /** D_default − SEE_chargeable, tCO₂e/t. Negative = worse than the default. */
  delta: number;
  /** the tonnes at stake across the quantity */
  tCO2e: number;
  /** the money at stake, in whatever currency certificatePrice was given in */
  currency: number;
  /** true when the installation is WORSE than the default — an added cost */
  worseThanDefault: boolean;
};

export function defaultExposure(p: ExposureParams): ExposureResult {
  const delta = p.defaultValue - p.chargeableSEE;
  const tCO2e = delta * p.quantityTonnes;
  const currency = tCO2e * p.certificatePrice * (1 + p.markup);
  return { delta, tCO2e, currency, worseThanDefault: delta < 0 };
}

/* ── Convenience: the whole chain in one call ───────────────────
   What the declaration workspace and the freeze snapshot both want. Kept as a
   thin composition so there is still only one implementation of each formula. */
export type EngineResult = {
  direct: DirectResult;
  indirect: IndirectResult;
  precursor: ReturnType<typeof precursorSEE>;
  totals: TotalResult;
  productionTonnes: number;
};

/** Engine version string — stamped into every frozen snapshot so a figure can
    always be traced to the arithmetic that produced it. Bump on any change to
    a formula, never on a comment or a rename. */
export const ENGINE_VERSION = "cbam-engine/1.0.0";

export function runEngine(dataset: ActivityDataset, tree: PrecursorNode[], category: GoodsCategory): EngineResult {
  return {
    direct: directSEE(dataset),
    indirect: indirectSEE(dataset),
    precursor: precursorSEE(tree),
    totals: totalSEE(dataset, tree, category),
    productionTonnes: dataset.annualProductionTonnes,
  };
}

export { UnitError };

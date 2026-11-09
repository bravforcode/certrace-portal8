/* ════════════════════════════════════════════════════════════
   THE MONTH'S FIGURES THAT ARE WORKED OUT, NOT READ

   Seven things a plant knows that a single "quantity" box cannot hold. Each one
   is a way of arriving at a figure the month already carries — so each one
   DERIVES that figure, in one place, and everything downstream (the SEE, the
   checks, the reports) keeps reading the figure it always read:

     stock change      Annex II B.4.1   what was burned is what came in, plus what was
                                        on hand at the start, minus what is left
     shared meter      Annex IV 26·29·30  one meter feeds several product reports; the
                                        month takes its share by an allocation key
     waste gas rows    Annex IV 17      blast-furnace, coke-oven and converter gas by
                                        volume and composition → the GJ balance
     scrap deliveries  Annex IV 35      supplier, grade and pre- or post-consumer origin
                                        of each delivery → tonnes and the pre-consumer share
     composition       Annex IV 35      Mn, Cr, Ni and the rest, from the mill certificates
     potlines          Annex II B.7     (in lib/cbam/sector-pack.ts — one row per line of cells)

   `deriveMonth` is the only place a derived figure is written. It is applied by
   `saveMonth`, by `monthResult` and `monthIssues`, and by the screens' own
   patch, so a form and a stored month cannot show two different quantities.

   No import from lib/monthly-data.ts at run time: that file imports this one.
   ════════════════════════════════════════════════════════════ */

import type { MonthlyEntry } from "./monthly-data";

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const has = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/* ── Stock change (Annex II B.4.1) ───────────────────────────────── */
export type StockChange = { delivered?: number; opening?: number; closing?: number };

/** Used = delivered + opening − closing. Never below zero: a closing stock larger than what was available is reported, not hidden. */
export const consumedFromStock = (s: StockChange | undefined): number => Math.max(0, num(s?.delivered) + num(s?.opening) - num(s?.closing));

export function stockProblem(s: StockChange | undefined): string | null {
  if (!s) return null;
  if ([s.delivered, s.opening, s.closing].some((v) => has(v) && v < 0)) return "Stock figures cannot be negative.";
  if (num(s.closing) > num(s.delivered) + num(s.opening)) return "The stock left at the end is larger than what came in plus what was there at the start.";
  if (!has(s.delivered) && !has(s.opening) && !has(s.closing)) return "Enter what was delivered and the stock at the start and the end of the month.";
  return null;
}

/* ── Shared meter (Annex IV items 26, 29, 30) ────────────────────── */
export type SharedKey = "production" | "energy" | "manual";

export const SHARED_KEY_LABEL: Record<SharedKey, string> = {
  production: "Tonnes made",
  energy: "Energy burned",
  manual: "A share I set",
};

export type SharedMeter = {
  /** the meter's name or tag — "Main incomer E-221" */
  meter: string;
  /** the WHOLE meter's reading for the month, in the row's own unit */
  reading?: number;
  key: SharedKey;
  /** this good's value of the key: tonnes it made, or GJ it burned */
  thisValue?: number;
  /** the same key summed over every product report the meter feeds */
  totalValue?: number;
  /** the share, %, when the key is "a share I set" */
  manualPct?: number;
};

/** This good's share of the meter, 0–1, or null while it cannot be worked out. */
export function sharedFraction(s: SharedMeter | undefined): number | null {
  if (!s) return null;
  if (s.key === "manual") return has(s.manualPct) && s.manualPct >= 0 && s.manualPct <= 100 ? s.manualPct / 100 : null;
  if (!has(s.thisValue) || !has(s.totalValue) || !(s.totalValue > 0) || s.thisValue < 0 || s.thisValue > s.totalValue) return null;
  return s.thisValue / s.totalValue;
}

export const sharedQuantity = (s: SharedMeter | undefined): number => {
  const f = sharedFraction(s);
  return f == null ? 0 : num(s?.reading) * f;
};

export function sharedProblem(s: SharedMeter | undefined): string | null {
  if (!s) return null;
  if (!has(s.reading) || s.reading < 0) return "Enter the whole meter's reading for the month.";
  if (s.key === "manual") return sharedFraction(s) == null ? "Enter this good's share of the meter, from 0 to 100 %." : null;
  if (!has(s.thisValue) || !has(s.totalValue)) return `Enter this good's ${s.key === "energy" ? "energy" : "tonnes"} and the total of every product report the meter feeds.`;
  if (!(s.totalValue > 0)) return "The total the meter is split across has to be above zero.";
  if (s.thisValue > s.totalValue) return "This good's figure cannot be larger than the total it is a part of.";
  return null;
}

/* ── Waste gases (Annex IV item 17) ──────────────────────────────── */
export type WasteGasKind = "bfg" | "cog" | "bofg" | "other";
export type WasteGasFlow = "produced" | "consumed" | "imported" | "exported";

export const WASTE_GAS_LABEL: Record<WasteGasKind, string> = {
  bfg: "Blast furnace gas",
  cog: "Coke oven gas",
  bofg: "Converter (oxygen steel furnace) gas",
  other: "Another process gas",
};
export const WASTE_GAS_FLOW_LABEL: Record<WasteGasFlow, string> = {
  produced: "Produced here",
  consumed: "Used here",
  imported: "Came in from another installation",
  exported: "Sent to another installation",
};

/** Typical net calorific values, MJ/Nm³ — a starting point the plant overrides with its own analysis, never a figure it is held to. */
export const WASTE_GAS_TYPICAL_NCV: Record<WasteGasKind, number | undefined> = { bfg: 3.2, cog: 17.5, bofg: 8.4, other: undefined };

export type WasteGasRow = {
  id: string;
  gas: WasteGasKind;
  /** what an "another process gas" is called */
  label?: string;
  flow: WasteGasFlow;
  /** Nm³ in the month */
  volumeNm3?: number;
  /** MJ/Nm³ — typed, or worked out from the composition when left empty */
  ncvMjPerNm3?: number;
  /** composition, % by volume */
  coPct?: number;
  co2Pct?: number;
  h2Pct?: number;
  ch4Pct?: number;
};

/* Lower heating values of the burnable gases, MJ/Nm³. */
const NCV_CO = 12.63;
const NCV_H2 = 10.78;
const NCV_CH4 = 35.8;

export const compositionSum = (r: Pick<WasteGasRow, "coPct" | "co2Pct" | "h2Pct" | "ch4Pct">): number => num(r.coPct) + num(r.co2Pct) + num(r.h2Pct) + num(r.ch4Pct);
export const hasComposition = (r: Pick<WasteGasRow, "coPct" | "co2Pct" | "h2Pct" | "ch4Pct">): boolean => [r.coPct, r.co2Pct, r.h2Pct, r.ch4Pct].some(has);

/** The row's NCV and where it came from: the plant's own, its composition, or the typical value for the gas. */
export function wasteGasNcv(r: WasteGasRow): { value: number | null; from: "entered" | "composition" | "typical" | "none" } {
  if (has(r.ncvMjPerNm3) && r.ncvMjPerNm3 > 0) return { value: r.ncvMjPerNm3, from: "entered" };
  if (hasComposition(r)) return { value: (num(r.coPct) * NCV_CO + num(r.h2Pct) * NCV_H2 + num(r.ch4Pct) * NCV_CH4) / 100, from: "composition" };
  const typical = WASTE_GAS_TYPICAL_NCV[r.gas];
  return typical != null ? { value: typical, from: "typical" } : { value: null, from: "none" };
}

export const wasteGasGj = (r: WasteGasRow): number => {
  const ncv = wasteGasNcv(r).value;
  return ncv != null && has(r.volumeNm3) && r.volumeNm3 > 0 ? (r.volumeNm3 * ncv) / 1000 : 0;
};

export function wasteGasProblem(r: WasteGasRow): string | null {
  if (r.gas === "other" && !r.label?.trim()) return "Name the gas.";
  if (!has(r.volumeNm3) || !(r.volumeNm3 > 0)) return "Enter the volume in Nm³.";
  if ([r.coPct, r.co2Pct, r.h2Pct, r.ch4Pct].some((v) => has(v) && (v < 0 || v > 100))) return "A composition figure is a percentage, 0 to 100.";
  if (compositionSum(r) > 100.0001) return "The composition adds up to more than 100 %.";
  if (wasteGasNcv(r).value == null) return "Give the calorific value or the composition, so the energy can be worked out.";
  return null;
}

/** The four flows of the item 17 balance, summed from the rows. */
export function wasteGasBalance(rows: WasteGasRow[]): { imported: number; produced: number; consumed: number; exported: number } {
  const out = { imported: 0, produced: 0, consumed: 0, exported: 0 };
  for (const r of rows) out[r.flow] += wasteGasGj(r);
  return out;
}

/* ── Scrap deliveries (Annex IV item 35) ─────────────────────────── */
export type ScrapMaterial = "steel_scrap" | "iron_scrap" | "aluminium_scrap";
export type ScrapOrigin = "pre_consumer" | "post_consumer";

export const SCRAP_ORIGIN_LABEL: Record<ScrapOrigin, string> = {
  pre_consumer: "Pre-consumer (offcuts, runaround, from manufacturing)",
  post_consumer: "Post-consumer (end of life)",
};

export type ScrapDelivery = {
  id: string;
  material: ScrapMaterial;
  supplier: string;
  /** the grade or category the supplier sells it as — "HMS 1&2", "Taint tabor" */
  grade: string;
  origin: ScrapOrigin;
  tonnes?: number;
};

export function scrapDeliveryProblem(d: ScrapDelivery): string | null {
  if (!d.supplier.trim()) return "Name the supplier.";
  if (!has(d.tonnes) || !(d.tonnes > 0)) return "Enter the tonnes delivered.";
  return null;
}

export const scrapDeliveryTotals = (rows: ScrapDelivery[], material?: ScrapMaterial) => {
  const mine = rows.filter((d) => (material ? d.material === material : true));
  const tonnes = mine.reduce((a, d) => a + num(d.tonnes), 0);
  const pre = mine.filter((d) => d.origin === "pre_consumer").reduce((a, d) => a + num(d.tonnes), 0);
  return { tonnes, preConsumerT: pre, count: mine.length };
};

/* ── Product composition (Annex IV item 35) ──────────────────────── */
export type ProductComposition = {
  mnPct?: number;
  crPct?: number;
  niPct?: number;
  /** the rest of the alloying elements together */
  otherPct?: number;
  /** where the figures come from — "mill certificates, weighted by heat" */
  basis?: string;
};

export const compositionTotal = (c: ProductComposition | undefined): number => num(c?.mnPct) + num(c?.crPct) + num(c?.niPct) + num(c?.otherPct);
export const hasProductComposition = (c: ProductComposition | undefined): boolean => Boolean(c) && [c!.mnPct, c!.crPct, c!.niPct, c!.otherPct].some(has);

export function productCompositionProblem(c: ProductComposition | undefined): string | null {
  if (!c || !hasProductComposition(c)) return null;
  if ([c.mnPct, c.crPct, c.niPct, c.otherPct].some((v) => has(v) && (v < 0 || v > 100))) return "A composition figure is a percentage, 0 to 100.";
  if (compositionTotal(c) > 100.0001) return "The alloying elements add up to more than 100 %.";
  return null;
}

/** Production-weighted composition over the months that carry one. Null while no month does. */
export function weightedComposition(months: Pick<MonthlyEntry, "productionTonnes" | "composition">[]): ProductComposition | null {
  const withData = months.filter((m) => hasProductComposition(m.composition) && num(m.productionTonnes) > 0);
  if (withData.length === 0) return null;
  const weight = withData.reduce((a, m) => a + num(m.productionTonnes), 0);
  const avg = (pick: (c: ProductComposition) => number | undefined) => {
    const given = withData.filter((m) => has(pick(m.composition!)));
    if (given.length === 0) return undefined;
    const w = given.reduce((a, m) => a + num(m.productionTonnes), 0);
    return Math.round((given.reduce((a, m) => a + num(pick(m.composition!)) * num(m.productionTonnes), 0) / w) * 1000) / 1000;
  };
  void weight;
  return { mnPct: avg((c) => c.mnPct), crPct: avg((c) => c.crPct), niPct: avg((c) => c.niPct), otherPct: avg((c) => c.otherPct) };
}

/* ── Deriving the month ──────────────────────────────────────────── */
/** How a quantity on a fuel or a material row is found. */
export type QuantityBasis = "reading" | "stock" | "shared";
export const quantityBasisOf = (r: { stock?: StockChange; shared?: SharedMeter }): QuantityBasis => (r.shared ? "shared" : r.stock ? "stock" : "reading");

/** Writes every derived figure into the month. Pure; returns the same object when there is nothing to derive. */
export function deriveMonth<T extends MonthlyEntry>(entry: T): T {
  const anyFuel = entry.fuels.some((f) => f.stock || f.shared);
  const anySource = (entry.electricitySources ?? []).some((s) => s.shared);
  const anyMaterial = (entry.processEmissionEntries ?? []).some((e) => e.stock && e.quantityT >= 0);
  const gases = entry.wasteGases ?? [];
  const deliveries = entry.scrapDeliveries ?? [];
  if (!anyFuel && !anySource && !anyMaterial && gases.length === 0 && deliveries.length === 0) return entry;

  let next: T = entry;
  if (anyFuel) {
    next = { ...next, fuels: next.fuels.map((f) => (f.shared ? { ...f, quantity: sharedQuantity(f.shared) } : f.stock ? { ...f, quantity: consumedFromStock(f.stock) } : f)) };
  }
  if (anySource) {
    next = { ...next, electricitySources: (next.electricitySources ?? []).map((s) => (s.shared ? { ...s, mwh: sharedQuantity(s.shared) } : s)) };
  }
  if (anyMaterial || deliveries.length > 0) {
    next = {
      ...next,
      processEmissionEntries: (next.processEmissionEntries ?? []).map((e) => {
        if (e.stock && e.quantityT >= 0) return { ...e, quantityT: consumedFromStock(e.stock) };
        if (e.method === "mass_balance" && (e.materialId === "steel_scrap" || e.materialId === "iron_scrap") && deliveries.some((d) => d.material === e.materialId)) {
          const t = scrapDeliveryTotals(deliveries, e.materialId as ScrapMaterial);
          return { ...e, quantityT: t.tonnes, preConsumerT: t.preConsumerT };
        }
        return e;
      }),
    };
  }
  if (deliveries.some((d) => d.material === "aluminium_scrap")) {
    const t = scrapDeliveryTotals(deliveries, "aluminium_scrap");
    next = { ...next, scrap: { ...next.scrap, tonnes: t.tonnes, preConsumerT: t.preConsumerT } };
  }
  if (gases.length > 0) next = { ...next, wasteGasGj: wasteGasBalance(gases) };
  return next;
}

/* ── What a month still owes, for these inputs ───────────────────── */
export type InputIssue = { severity: "error" | "warn"; field: string; message: string };

export function inputIssues(entry: MonthlyEntry): InputIssue[] {
  const out: InputIssue[] = [];
  const err = (field: string, message: string) => out.push({ severity: "error", field, message });

  entry.fuels.forEach((f, i) => {
    const name = f.fuelType ? f.fuelType : `Fuel row ${i + 1}`;
    if (f.stock) {
      const p = stockProblem(f.stock);
      if (p) err(`fuel:${f.id}:stock`, `${name} (row ${i + 1}) — stock change: ${p}`);
    }
    if (f.shared) {
      const p = sharedProblem(f.shared);
      if (p) err(`fuel:${f.id}:shared`, `${name} (row ${i + 1}) — shared meter: ${p}`);
    }
  });
  (entry.electricitySources ?? []).forEach((s, i) => {
    if (s.shared) {
      const p = sharedProblem(s.shared);
      if (p) err(`electricity:${s.id}:shared`, `Electricity source ${i + 1} — shared meter: ${p}`);
    }
  });
  (entry.processEmissionEntries ?? []).forEach((e, i) => {
    if (e.stock) {
      const p = stockProblem(e.stock);
      if (p) err(`processEntry:${e.id}:stock`, `Material row ${i + 1} — stock change: ${p}`);
    }
  });
  (entry.wasteGases ?? []).forEach((r, i) => {
    const p = wasteGasProblem(r);
    if (p) err(`wasteGas:${r.id}`, `Waste gas row ${i + 1}: ${p}`);
  });
  (entry.scrapDeliveries ?? []).forEach((d, i) => {
    const p = scrapDeliveryProblem(d);
    if (p) err(`scrapDelivery:${d.id}`, `Scrap delivery ${i + 1}: ${p}`);
  });
  const c = productCompositionProblem(entry.composition);
  if (c) err("composition", `Product composition: ${c}`);
  return out;
}

import type { Sheet } from "../workspace-sheets";
import { euStandardFor } from "../cbam/fuel-defaults";
import { gridFactorFor } from "../cbam/electricity-grid-factors";
import { defaultFor } from "../cbam/precursor-basis";
import { indirectCounts } from "../cbam/product-category-rules";
import { aggregatedGoodsCategory } from "../config";
import { MONTHLY_FUEL_UNITS, type MonthlyFuelUnit } from "../monthly-data";
import { MASS_TO_TONNES, parseQuantity, stepKey, toTonnes } from "./balance";

/* A message the panel translates: `key` is the English text, `params` fill its placeholders. */
export type Note = { key: string; params?: Record<string, string> };

const FUELS: [RegExp, string][] = [
  [/\bnatural gas\b|\bng\b|ก๊าซธรรมชาติ/i, "natural_gas"],
  [/\blpg\b|ก๊าซหุงต้ม/i, "lpg"],
  [/\bdiesel\b|ดีเซล/i, "diesel"],
  [/\bfuel oil\b|\bbunker\b|น้ำมันเตา/i, "fuel_oil_heavy"],
  [/\bcoke\b(?!\s+oven)/i, "coke"],
  [/\bcoal\b|ถ่านหิน/i, "anthracite_bituminous"],
  [/\bbiomass\b|ชีวมวล/i, "biomass"],
];
export function matchFuel(item: string, unit: string): string | "electricity" | null {
  if (/electric|ไฟฟ้า|grid power/i.test(item) || /^(k|m)wh$/i.test(unit.trim())) return "electricity";
  return FUELS.find(([re]) => re.test(item))?.[1] ?? null;
}

const UNIT_ALIAS: Record<string, string> = { "m³": "m3", litre: "l", liter: "l", litres: "l", liters: "l", gj: "GJ" };
/** A fuel unit. Mass units resolve through the same table as toTonnes; the rest through the fuel-unit list. */
function fuelUnit(unit: string): MonthlyFuelUnit | null {
  const u = unit.trim().toLowerCase();
  const mass = MASS_TO_TONNES[u];
  if (mass !== undefined) return mass === 1 ? "t" : mass === MASS_TO_TONNES.kg ? "kg" : null;
  const wanted = UNIT_ALIAS[u] ?? unit.trim();
  return MONTHLY_FUEL_UNITS.find((m) => m.toLowerCase() === wanted.toLowerCase()) ?? null;
}

/* Whether a product's CN counts indirect (electricity) emissions. Null when the CN is not on the CBAM
   goods list: aggregatedGoodsCategory falls back to a sector default for those, so the two category
   fallbacks disagree and the CN is treated as unknown rather than guessed. */
function indirectGate(cn: string): boolean | null {
  if (!cn.replace(/\D/g, "")) return null;
  const asAluminium = aggregatedGoodsCategory({ cnCode: cn, category: "Aluminium" });
  const asSteel = aggregatedGoodsCategory({ cnCode: cn, category: "Iron & Steel" });
  return asAluminium === asSteel ? indirectCounts(asSteel, cn) : null;
}

export type PrecursorLine = { key: string; item: string; cn: string; tonnes: number; defaultSee: number; step: string };
export type EmissionEstimate = {
  productionT: number; directT: number; indirectT: number; indirectExcludedT: number; precursorT: number;
  totalT: number; perTonne: number | null;
  /** Keyed by stepKey(); rows with no step use the empty key. indirectT here is only the counted part. */
  byStep: Record<string, { directT: number; indirectT: number; precursorT: number }>;
  precursors: PrecursorLine[]; unmatched: Note[]; notes: Note[]; biomass: boolean;
};

export function estimateEmissions(sheets: Sheet[], ctx: { country: string; year: number }): EmissionEstimate {
  const rows = (id: string) => sheets.find((x) => x.id === id)?.rows ?? [];
  const e: EmissionEstimate = {
    productionT: 0, directT: 0, indirectT: 0, indirectExcludedT: 0, precursorT: 0, totalT: 0, perTonne: null,
    byStep: {}, precursors: [], unmatched: [], notes: [], biomass: false,
  };
  const bucket = (step: string | undefined) => (e.byStep[stepKey(step)] ??= { directT: 0, indirectT: 0, precursorT: 0 });
  const pushUnmatched = (n: Note) => {
    if (!e.unmatched.some((u) => u.key === n.key && JSON.stringify(u.params) === JSON.stringify(n.params))) e.unmatched.push(n);
  };
  const qtyLabel = (qty: string, unit: string) => (unit.trim() ? `${qty.trim()} ${unit.trim()}` : qty.trim());

  // Products first: their CNs decide whether indirect emissions count at all.
  let validProducts = 0, requiresIndirect = false, unknownCn = false;
  for (const { cells: c } of rows("products")) {
    if (!c.qty?.trim()) continue;
    const t = toTonnes(c.qty, c.unit ?? "");
    if (t === null) {
      pushUnmatched({ key: "{item} ({qty})", params: { item: (c.item ?? "").trim() || (c.cn ?? "").trim(), qty: qtyLabel(c.qty, c.unit ?? "") } });
      continue;
    }
    e.productionT += t;
    validProducts++;
    const gate = indirectGate(c.cn ?? "");
    if (gate === null) unknownCn = true;
    if (gate !== false) requiresIndirect = true;
  }
  const indirectCounted = validProducts === 0 || requiresIndirect;

  for (const { cells: c } of rows("energy")) {
    if (!c.item?.trim() || !c.qty?.trim()) continue;
    const unit = (c.unit ?? "").trim();
    const row = { key: "{item} ({qty})", params: { item: c.item.trim(), qty: qtyLabel(c.qty, unit) } };
    const qty = parseQuantity(c.qty);
    const fuel = matchFuel(c.item, c.unit ?? "");
    if (qty === null || qty < 0 || !fuel) { pushUnmatched(row); continue; }

    if (fuel === "electricity") {
      const mwh = unit.toLowerCase() === "kwh" ? qty / 1000 : unit.toLowerCase() === "mwh" ? qty : null;
      if (mwh === null) { pushUnmatched(row); continue; }
      if (!ctx.country.trim()) { pushUnmatched({ key: "Set the installation country to estimate electricity" }); continue; }
      const factor = gridFactorFor(ctx.country)?.value ?? null;
      if (factor === null) { pushUnmatched({ key: "Electricity: no EU grid default for {country} yet", params: { country: ctx.country.trim() } }); continue; }
      const t = mwh * factor;
      if (indirectCounted) {
        e.indirectT += t;
        bucket(c.step).indirectT += t;
      } else e.indirectExcludedT += t;
      continue;
    }

    const fu = fuelUnit(unit);
    const std = fu ? euStandardFor(fuel, fu) : null;
    const gj = !std || !fu ? null : fu === "GJ" ? qty : std.ncvMjPerUnit === null ? null : (qty * std.ncvMjPerUnit) / 1000;
    if (gj === null || !std) { pushUnmatched(row); continue; }
    if (std.biomass) e.biomass = true;
    const t = gj * std.efTco2PerGj;
    e.directT += t;
    bucket(c.step).directT += t;
  }

  for (const { cells: c } of rows("materials")) {
    if (!c.cn?.trim() || !c.qty?.trim()) continue;
    const cn = c.cn.trim();
    const item = (c.item ?? "").trim() || cn;
    const tonnes = toTonnes(c.qty, c.unit ?? "");
    const d = defaultFor(cn, undefined, ctx.year);
    if (tonnes === null || !d) { pushUnmatched({ key: "{item} (CN {cn})", params: { item, cn } }); continue; }
    const t = tonnes * d.total;
    e.precursorT += t;
    bucket(c.step).precursorT += t;
    e.precursors.push({ key: `materials:${e.precursors.length}`, item, cn, tonnes, defaultSee: d.total, step: (c.step ?? "").trim() });
  }

  e.totalT = e.directT + e.indirectT + e.precursorT;
  e.perTonne = e.productionT > 0 ? e.totalT / e.productionT : null;

  if (validProducts === 0) e.notes.push({ key: "No products entered; indirect emissions included" });
  else if (!indirectCounted && e.indirectExcludedT > 0) e.notes.push({ key: "Indirect emissions excluded: products are direct-only goods" });
  if (unknownCn) e.notes.push({ key: "Products without a recognised CN code count indirect emissions" });
  if (e.biomass) e.notes.push({ key: "Biomass emission factor is preliminary (Table 2)" });
  return e;
}

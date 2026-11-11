import type { Sheet } from "../workspace-sheets";
import { euStandardFor } from "../cbam/fuel-defaults";
import { gridFactorFor } from "../cbam/electricity-grid-factors";
import { defaultFor } from "../cbam/precursor-basis";
import { MONTHLY_FUEL_UNITS, type MonthlyFuelUnit } from "../monthly-data";
import { toTonnes } from "./balance";

const FUELS: [RegExp, string][] = [
  [/natural gas|\bng\b|ก๊าซธรรมชาติ/i, "natural_gas"],
  [/lpg|ก๊าซหุงต้ม/i, "lpg"],
  [/diesel|ดีเซล/i, "diesel"],
  [/fuel oil|bunker|น้ำมันเตา/i, "fuel_oil_heavy"],
  [/coke/i, "coke"],
  [/coal|ถ่านหิน/i, "anthracite_bituminous"],
  [/biomass|ชีวมวล/i, "biomass"],
];
export function matchFuel(item: string, unit: string): string | "electricity" | null {
  if (/electric|ไฟฟ้า|grid power/i.test(item) || /^(k|m)wh$/i.test(unit.trim())) return "electricity";
  return FUELS.find(([re]) => re.test(item))?.[1] ?? null;
}

const UNIT_ALIAS: Record<string, string> = { "m³": "m3", litre: "l", liter: "l", litres: "l", liters: "l", gj: "GJ" };
function fuelUnit(unit: string): MonthlyFuelUnit | null {
  const u = unit.trim();
  const wanted = UNIT_ALIAS[u.toLowerCase()] ?? u;
  return MONTHLY_FUEL_UNITS.find((m) => m.toLowerCase() === wanted.toLowerCase()) ?? null;
}

export type PrecursorLine = { key: string; item: string; cn: string; tonnes: number; defaultSee: number; step: string };
export type EmissionEstimate = {
  productionT: number; directT: number; indirectT: number; precursorT: number; totalT: number; perTonne: number | null;
  byStep: Record<string, { directT: number; indirectT: number; precursorT: number }>;
  precursors: PrecursorLine[]; unmatched: string[];
};

const num = (v: string | undefined) => Number((v ?? "").replace(/,/g, "").trim());

export function estimateEmissions(sheets: Sheet[], ctx: { country: string; year: number }): EmissionEstimate {
  const rows = (id: string) => sheets.find((x) => x.id === id)?.rows ?? [];
  const e: EmissionEstimate = { productionT: 0, directT: 0, indirectT: 0, precursorT: 0, totalT: 0, perTonne: null, byStep: {}, precursors: [], unmatched: [] };
  const bucket = (step: string | undefined) =>
    (e.byStep[(step ?? "").trim() || "Unassigned step"] ??= { directT: 0, indirectT: 0, precursorT: 0 });

  for (const { cells: c } of rows("products")) e.productionT += toTonnes(c.qty ?? "", c.unit ?? "") ?? 0;

  for (const { cells: c } of rows("energy")) {
    if (!c.item?.trim() || !c.qty?.trim()) continue;
    const label = `${c.item.trim()} (${c.qty.trim()} ${(c.unit ?? "").trim()})`.replace(" )", ")");
    const qty = num(c.qty), fuel = matchFuel(c.item, c.unit ?? "");
    if (!Number.isFinite(qty) || !fuel) { e.unmatched.push(label); continue; }
    if (fuel === "electricity") {
      const factor = gridFactorFor(ctx.country)?.value ?? null;
      if (factor === null) { e.unmatched.push(`Electricity: no EU grid default for ${ctx.country} yet`); continue; }
      const mwh = /^kwh$/i.test((c.unit ?? "").trim()) ? qty / 1000 : qty;
      const t = mwh * factor;
      e.indirectT += t;
      bucket(c.step).indirectT += t;
      continue;
    }
    const unit = fuelUnit(c.unit ?? "");
    const std = unit ? euStandardFor(fuel, unit) : null;
    const gj = !std ? null : unit === "GJ" ? qty : std.ncvMjPerUnit === null ? null : (qty * std.ncvMjPerUnit) / 1000;
    if (gj === null || !std) { e.unmatched.push(label); continue; }
    const t = gj * std.efTco2PerGj;
    e.directT += t;
    bucket(c.step).directT += t;
  }

  rows("materials").forEach(({ cells: c }, i) => {
    if (!c.cn?.trim()) return;
    const tonnes = toTonnes(c.qty ?? "", c.unit ?? "");
    const d = defaultFor(c.cn, undefined, ctx.year);
    if (tonnes === null || !d) { e.unmatched.push(`${c.item ?? c.cn} (CN ${c.cn})`); return; }
    const t = tonnes * d.total;
    e.precursorT += t;
    bucket(c.step).precursorT += t;
    e.precursors.push({ key: `materials:${i}`, item: (c.item ?? "").trim(), cn: c.cn.trim(), tonnes, defaultSee: d.total, step: (c.step ?? "").trim() });
  });

  e.totalT = e.directT + e.indirectT + e.precursorT;
  e.perTonne = e.productionT > 0 ? e.totalT / e.productionT : null;
  return e;
}

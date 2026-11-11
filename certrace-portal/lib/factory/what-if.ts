import { aggregatedGoodsCategory, type AggregatedGoodsCategory } from "../config";
import { indirectIsChargeable, type GoodsCategory } from "../cbam/engine";
import { defaultFor } from "../cbam/precursor-basis";
import type { EmissionEstimate } from "../workbook/estimate";
import type { Derived } from "./opportunities";

export type WhatIfInput = {
  productionT: number; exportedT: number; priceEur: number;
  /** null when no product CN is entered yet: indirect emissions then count, as the estimate does */
  category: GoodsCategory | null; productCn: string; year: number;
  /** precursorActual[line.key] = the supplier's actual SEE in tCO₂e/t */
  precursorActual: Record<string, number>;
};
export type WhatIfResult = {
  perTonne: number; chargeablePerTonne: number; certificatesT: number; costEur: number;
  defaultPerTonne: number | null; defaultCostEur: number | null; savingVsDefaultEur: number | null;
};

const ZERO: WhatIfResult = {
  perTonne: 0, chargeablePerTonne: 0, certificatesT: 0, costEur: 0,
  defaultPerTonne: null, defaultCostEur: null, savingVsDefaultEur: null,
};

export function whatIf(e: EmissionEstimate, input: WhatIfInput): WhatIfResult {
  if (e.productionT <= 0) return ZERO;
  const price = Number.isFinite(input.priceEur) ? input.priceEur : 0;
  const direct = e.directT / e.productionT;
  const indirect = e.indirectT / e.productionT;
  const precursor = e.precursors.reduce(
    (sum, p) => sum + (p.tonnes / e.productionT) * (input.precursorActual[p.key] ?? p.defaultSee),
    0,
  );
  const indirectCounts = input.category === null || indirectIsChargeable(input.category);
  const chargeablePerTonne = direct + precursor + (indirectCounts ? indirect : 0);
  const exportedT = Math.max(0, Math.min(input.exportedT, input.productionT));
  const certificatesT = chargeablePerTonne * exportedT;
  const costEur = certificatesT * price;
  const d = input.productCn ? defaultFor(input.productCn, undefined, input.year) : null;
  const defaultCostEur = d ? d.total * exportedT * price : null;
  return {
    perTonne: direct + indirect + precursor,
    chargeablePerTonne, certificatesT, costEur,
    defaultPerTonne: d?.total ?? null,
    defaultCostEur,
    savingVsDefaultEur: defaultCostEur === null ? null : defaultCostEur - costEur,
  };
}

export function compareWhatIf(e: EmissionEstimate, base: WhatIfInput, next: WhatIfInput) {
  const a = whatIf(e, base), b = whatIf(e, next);
  return { base: a, next: b, deltaEur: b.costEur - a.costEur, deltaT: b.certificatesT - a.certificatesT };
}

/* Goods category of a catalogue group. Aluminium and steel groups map to the engine's coarse categories. */
const GOODS_OF: Record<AggregatedGoodsCategory, GoodsCategory> = {
  "Sintered ore": "Iron & Steel",
  "Pig iron": "Iron & Steel",
  "Ferro-alloys": "Iron & Steel",
  "Direct reduced iron": "Iron & Steel",
  "Crude steel": "Iron & Steel",
  "Iron or steel products": "Iron & Steel",
  "Unwrought aluminium": "Aluminium",
  "Aluminium products": "Aluminium",
  "Calcined clay": "Cement",
  "Cement clinker": "Cement",
  Cement: "Cement",
  "Aluminous cement": "Cement",
  Hydrogen: "Hydrogen",
  Ammonia: "Fertilisers",
  "Nitric acid": "Fertilisers",
  Urea: "Fertilisers",
  "Mixed fertilisers": "Fertilisers",
};

/* Null when the CN is not on the goods list, or when the steel and aluminium fallbacks disagree: the
   same rule the estimate uses, so an unknown CN is treated as unknown rather than guessed. */
export function goodsCategoryOfCn(cn: string): GoodsCategory | null {
  if (!cn.replace(/\D/g, "")) return null;
  const asAluminium = aggregatedGoodsCategory({ cnCode: cn, category: "Aluminium" });
  const asSteel = aggregatedGoodsCategory({ cnCode: cn, category: "Iron & Steel" });
  if (asAluminium !== asSteel) return null;
  return GOODS_OF[asSteel] ?? null;
}

/* A stable id for a scenario: the same inputs always give the same id, so saving it again updates its card. */
export function scenarioId(input: WhatIfInput): string {
  const overrides = Object.entries(input.precursorActual).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return [input.productionT, input.exportedT, input.priceEur, ...overrides.map(([k, v]) => `${k}=${v}`)].join("|");
}

/* The opportunity card for a saved scenario. The saving is against today's inputs, so a positive number means money saved. */
export function scenarioOpportunity(a: {
  installationId: string; year: number; input: WhatIfInput; savingEur: number; savingT: number;
}): Derived {
  const eur = Math.round(a.savingEur);
  return {
    key: `what-if:${a.installationId}:${a.year}:${scenarioId(a.input)}`,
    installationId: a.installationId,
    year: a.year,
    source: "what-if",
    title: `Scenario saves €${eur} a year`,
    text: { key: "Scenario saves €{eur} a year", params: { eur: String(eur) } },
    detail: "What-if scenario",
    impactEur: a.savingEur,
    impactT: a.savingT,
    href: "/dashboard",
  };
}

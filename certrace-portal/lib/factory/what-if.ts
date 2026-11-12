import { defaultFor } from "../cbam/precursor-basis";
import type { EmissionEstimate } from "../workbook/estimate";
import type { Derived } from "./opportunities";

/* A null value means the input is missing or not a number yet. It is never coerced to 0: a cleared field shows as "—". */
export type WhatIfInput = {
  exportedT: number | null;
  priceEur: number | null;
  productCn: string;
  year: number;
  /** precursorActual[line.key] = the supplier's actual SEE in tCO₂e/t */
  precursorActual: Record<string, number | null | undefined>;
};
export type WhatIfResult = {
  perTonne: number;
  chargeablePerTonne: number;
  certificatesT: number | null;
  costEur: number | null;
  defaultPerTonne: number | null;
  defaultCostEur: number | null;
  savingVsDefaultEur: number | null;
};

const ZERO: WhatIfResult = {
  perTonne: 0,
  chargeablePerTonne: 0,
  certificatesT: 0,
  costEur: 0,
  defaultPerTonne: null,
  defaultCostEur: null,
  savingVsDefaultEur: null,
};

const finite = (v: number | null | undefined): v is number =>
  v !== null && v !== undefined && Number.isFinite(v);

/* Direct and indirect intensities come from the estimate. Indirect is already gated there (indirectT is 0 for direct-only goods). */
export function whatIf(e: EmissionEstimate, input: WhatIfInput): WhatIfResult {
  if (e.productionT <= 0) return ZERO;
  const direct = e.directT / e.productionT;
  const indirect = e.indirectT / e.productionT;
  const precursor = e.precursors.reduce((sum, p) => {
    const actual = input.precursorActual[p.key];
    const see = finite(actual) ? Math.max(0, actual) : p.defaultSee;
    return sum + (p.tonnes / e.productionT) * see;
  }, 0);
  const chargeablePerTonne = direct + precursor + indirect;
  const perTonne = direct + indirect + precursor;
  const d = input.productCn
    ? defaultFor(input.productCn, undefined, input.year)
    : null;

  const exportedT = finite(input.exportedT)
    ? Math.max(0, Math.min(input.exportedT, e.productionT))
    : null;
  const certificatesT =
    exportedT === null ? null : chargeablePerTonne * exportedT;
  const price = finite(input.priceEur) ? Math.max(0, input.priceEur) : null;
  const costEur =
    certificatesT === null || price === null ? null : certificatesT * price;

  const defaultCostEur =
    d && exportedT !== null && price !== null
      ? d.total * exportedT * price
      : null;
  return {
    perTonne,
    chargeablePerTonne,
    certificatesT,
    costEur,
    defaultPerTonne: d?.total ?? null,
    defaultCostEur,
    savingVsDefaultEur:
      defaultCostEur === null || costEur === null
        ? null
        : defaultCostEur - costEur,
  };
}

export function compareWhatIf(
  e: EmissionEstimate,
  base: WhatIfInput,
  next: WhatIfInput,
) {
  const a = whatIf(e, base),
    b = whatIf(e, next);
  const deltaEur =
    a.costEur === null || b.costEur === null ? null : b.costEur - a.costEur;
  const deltaT =
    a.certificatesT === null || b.certificatesT === null
      ? null
      : b.certificatesT - a.certificatesT;
  return { base: a, next: b, deltaEur, deltaT };
}

/* The card's key is per installation and year: saving again overwrites the card with the latest scenario. */
export const scenarioKey = (installationId: string, year: number) =>
  `what-if:${installationId}:${year}`;

/* Short English list of the inputs that differ from today, stored as the card's detail. */
export function changedInputs(
  e: EmissionEstimate,
  base: WhatIfInput,
  next: WhatIfInput,
): string {
  const parts: string[] = [];
  if (base.exportedT !== next.exportedT)
    parts.push(
      `exported ${base.exportedT ?? "—"} → ${next.exportedT ?? "—"} t`,
    );
  if (base.priceEur !== next.priceEur)
    parts.push(`price ${base.priceEur ?? "—"} → ${next.priceEur ?? "—"} EUR/t`);
  for (const p of e.precursors) {
    const actual = next.precursorActual[p.key];
    if (finite(actual))
      parts.push(
        `${p.item || p.cn} actual ${actual} (default ${p.defaultSee})`,
      );
  }
  return parts.length > 0 ? parts.join("; ") : "No inputs changed";
}

/* The opportunity card for a saved scenario. The saving is against today's inputs, so a positive number means money saved. */
export function scenarioOpportunity(a: {
  installationId: string;
  year: number;
  e: EmissionEstimate;
  base: WhatIfInput;
  next: WhatIfInput;
  savingEur: number;
  savingT: number;
}): Derived {
  const eur = Math.round(a.savingEur);
  return {
    key: scenarioKey(a.installationId, a.year),
    installationId: a.installationId,
    year: a.year,
    source: "what-if",
    title: `Scenario saves €${eur} a year`,
    text: { key: "Scenario saves €{eur} a year", params: { eur: String(eur) } },
    detail: changedInputs(a.e, a.base, a.next),
    impactEur: a.savingEur,
    impactT: a.savingT,
    href: "/dashboard",
  };
}

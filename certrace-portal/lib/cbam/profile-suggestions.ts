/* ════════════════════════════════════════════════════════════
   WHAT THE MONTHLY DATA ALREADY SAYS ABOUT THE SITE

   Annex IV items 2(d) and 2(e) ask for the five fuels that give the most energy and the five materials that lead to
   the most process emissions. The plant has already entered both, month by month; asking it to rank them again by
   hand is how the two lists come to disagree with the readings. So the Overview offers the ranking the months give,
   as a suggestion the reader accepts with one press — never written into the box on its own.

   The names are the English ones the portal uses for the fuel and the material, because the field is a line of the
   operator's emissions report and the report is in English.
   ════════════════════════════════════════════════════════════ */

import { fuelGJ, fuelTypeLabel, monthCounts, monthsForWorkspace, processEmissionEntryTCO2, processEntryLabel } from "../monthly-data";
import type { VerificationWorkspace } from "../workspace";

export type Ranked = { name: string; value: number };

const top = (m: Map<string, number>, n = 5): Ranked[] =>
  [...m.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));

/** The most recent year that has any submitted month, across the installation's product reports — the ranking describes the site as it runs now. */
function liveWorkspaces(workspaces: VerificationWorkspace[]): VerificationWorkspace[] {
  const withData = workspaces.filter((w) => !w.archivedAt).map((w) => ({ w, months: monthsForWorkspace(w).filter(monthCounts) })).filter((x) => x.months.length > 0);
  if (withData.length === 0) return [];
  const year = Math.max(...withData.map((x) => x.w.year));
  return withData.filter((x) => x.w.year === year).map((x) => x.w);
}

/** Fuels by energy (GJ). A row with no net calorific value cannot be put in energy, so it is left out rather than guessed. */
export function topFuels(workspaces: VerificationWorkspace[]): Ranked[] {
  const energy = new Map<string, number>();
  for (const w of liveWorkspaces(workspaces)) {
    for (const mo of monthsForWorkspace(w).filter(monthCounts)) {
      for (const fu of mo.fuels) {
        try {
          const gj = fuelGJ(fu);
          if (!Number.isFinite(gj) || gj <= 0) continue;
          const name = fuelTypeLabel(fu.fuelType, fu.fuelTypeOther);
          energy.set(name, (energy.get(name) ?? 0) + gj);
        } catch {
          /* no calorific value — not rankable */
        }
      }
    }
  }
  return top(energy);
}

/** Process-emission materials by the emissions they lead to (tCO₂) — carbonates and fluxes, and the carbon balance's inputs. */
export function topMaterials(workspaces: VerificationWorkspace[]): Ranked[] {
  const emissions = new Map<string, number>();
  for (const w of liveWorkspaces(workspaces)) {
    for (const mo of monthsForWorkspace(w).filter(monthCounts)) {
      for (const e of mo.processEmissionEntries ?? []) {
        if (!(Number(e.quantityT) > 0)) continue;
        const tco2 = processEmissionEntryTCO2(e);
        if (!Number.isFinite(tco2) || tco2 <= 0) continue;
        const name = processEntryLabel(e);
        emissions.set(name, (emissions.get(name) ?? 0) + tco2);
      }
    }
  }
  return top(emissions);
}

/** The ranking as the line that goes in the field. */
export const asLine = (r: Ranked[]): string => r.map((x) => x.name).join(", ");

/** The names in a field, however the plant separated them, to compare with a suggestion without caring about order or case. */
export const namesIn = (s: string): string[] =>
  s
    .split(/[,;\n]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

/** Whether what is in the field already lists every suggested name — then there is nothing to offer. */
export const covers = (fieldValue: string, suggestion: Ranked[]): boolean => {
  const have = new Set(namesIn(fieldValue));
  return suggestion.length > 0 && suggestion.every((x) => have.has(x.name.toLowerCase()));
};

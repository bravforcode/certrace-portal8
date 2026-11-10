import { accountStorage } from "./account-storage";
/* ════════════════════════════════════════════════════════════
   THE EXPORTER'S OWN PRICES — what the good sells for and what its energy costs

   Carbon & Cost turns tonnes of CO₂e into baht; the question a finance team asks next is what that is per piece, beside the energy the plant
   burns and the price the good sells at. None of those three are in the regulation and none are measured by the plant, so they are the
   exporter's own answers: one set per product report (installation × good × year), typed on the Carbon & Cost tab.

   COMMERCIAL, SO IT STAYS HOME. The selling price is not something a plant or a precursor supplier is shown — and it must not ride along
   in the slice a monthly link moves (WORKSPACE_STORE_KEYS in lib/workspace-link-sync.ts). This key is deliberately absent from that list.

   A price that was never entered is absent, not zero: a per-piece energy cost computed on a missing electricity tariff would claim the
   plant's power is free.
   ════════════════════════════════════════════════════════════ */

import type { CostInputs } from "./cbam/carbon-cost-model";

export type UnitCostRecord = CostInputs & {
  workspaceId: string;
  updatedAt: string;
};

const KEY = "certrace:unit-costs";

type Store = Record<string, UnitCostRecord>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = accountStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    accountStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export const getUnitCosts = (workspaceId: string): UnitCostRecord | null =>
  read()[workspaceId] ?? null;

export function saveUnitCosts(
  workspaceId: string,
  inputs: CostInputs,
): UnitCostRecord {
  const store = read();
  const next: UnitCostRecord = {
    ...inputs,
    workspaceId,
    updatedAt: new Date().toISOString(),
  };
  store[workspaceId] = next;
  write(store);
  return next;
}

export function removeUnitCosts(workspaceId: string): void {
  const store = read();
  delete store[workspaceId];
  write(store);
}

/** A fuel is priced per ONE unit it was entered in, so the key carries the unit — gas in m³ and gas in GJ are two different prices. */
export const fuelKey = (
  fuelType: string,
  other: string | undefined,
  unit: string,
): string =>
  `${fuelType === "other" ? `other:${(other ?? "").trim().toLowerCase()}` : fuelType}|${unit}`;

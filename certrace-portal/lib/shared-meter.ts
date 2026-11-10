/* The allocation key of a shared meter, read from the other product reports of the installation.

   One meter often feeds several product reports — the main incomer of a works that
   rolls two products. Its reading belongs to the installation; each product report
   takes a share. The share is a ratio of two numbers the portal already holds
   (tonnes made, or energy burned, this good against every product report the meter
   feeds), so it is suggested from them rather than typed — and kept on the row as
   those two numbers, so a verifier can recompute it. */

import { fuelGJ, getMonth, type MonthlyEntry } from "./monthly-data";
import { deriveMonth } from "./monthly-inputs";
import { getWorkspace, listWorkspaces } from "./workspace";

export type ShareKey = "production" | "energy";

/** Energy burned in the month, GJ. A fuel row that cannot be converted (no calorific value yet) counts for nothing. */
export function energyGjOf(entry: MonthlyEntry): number {
  let gj = 0;
  for (const f of deriveMonth(entry).fuels) {
    try {
      gj += fuelGJ(f);
    } catch {
      /* no calorific value yet — the fuel row itself says so */
    }
  }
  return gj;
}

export type ShareSuggestion = {
  thisValue: number;
  totalValue: number;
  /** each product report of the installation and its value of the key */
  parts: { name: string; value: number; self: boolean }[];
};

/** This good's value and the sum over every product report of the installation, for the same month. Null when it is the only one. */
export function suggestShare(
  workspaceId: string,
  current: MonthlyEntry,
  key: ShareKey,
): ShareSuggestion | null {
  const me = getWorkspace(workspaceId);
  if (!me) return null;
  const valueOf = (m: MonthlyEntry) =>
    key === "production" ? m.productionTonnes || 0 : energyGjOf(m);
  const group = listWorkspaces().filter(
    (w) =>
      w.installationId === me.installationId &&
      w.year === me.year &&
      !w.archivedAt,
  );
  if (group.length < 2) return null;
  const parts = group.map((w) => {
    const m = w.id === workspaceId ? current : getMonth(w.id, current.month);
    return {
      name: w.productName,
      value: m ? valueOf(m) : 0,
      self: w.id === workspaceId,
    };
  });
  return {
    thisValue: parts.find((p) => p.self)?.value ?? 0,
    totalValue: parts.reduce((a, p) => a + p.value, 0),
    parts,
  };
}

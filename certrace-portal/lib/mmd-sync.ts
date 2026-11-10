/* ════════════════════════════════════════════════════════════
   THE METHODOLOGY AND THE MONTH, KEPT IN STEP

   Two screens describe the same plant and used to disagree freely. The
   methodology says "we burn natural gas and diesel"; the month says what was
   burned. When those two lists differ, one of them is wrong, and a verifier
   finds it by reading them side by side — which is the one review outcome
   this product exists to prevent.

   So they are RECONCILED, not merely validated. Declaring a fuel in the
   methodology puts a row for it on the month; deleting the row takes the fuel
   back out of the methodology. There is one list, reachable from two places.

   ── Why the electricity mapping is not symmetric ─────────────

   Fuels share a vocabulary: both sides hold FUEL_TYPES ids, so the sync is a
   set operation and loses nothing.

   Electricity does not. The methodology asks WHERE THE POWER COMES FROM in 13
   commercially meaningful options (MEA, PEA, EGAT, a PPA, own solar…); the
   month asks WHICH FACTOR was applied, in the 3 the calculation distinguishes
   (grid default, PPA, self-generated). Thirteen collapse into three, so:

     methodology → month   is EXACT. The category determines the factor class.
     month → methodology   is LOSSY. "Grid default factor" cannot say whether
                           that grid is MEA, PEA, EGAT or an estate operator.

   Rather than guess, the lossy direction only fires when the CATEGORY itself
   changed, and it clears the specific option so the exporter re-picks it. A
   silent guess here would put "MEA" against a plant in Rayong, which PEA
   supplies — a wrong fact that reads as a confirmed one.
   ════════════════════════════════════════════════════════════ */

import {
  applyEuStandard,
  emptyFuel,
  fuelTypeDef,
  type FuelEntry,
  type MonthlyEntry,
  type ElectricityFactorSource,
} from "./monthly-data";
import {
  ELECTRICITY_SUPPLY_OPTIONS,
  type WorkspaceMmdContent,
} from "./workspace-mmd";

/* ── Fuels ─────────────────────────────────────────────────── */

/** The fuels a month's rows actually name. */
export const fuelIdsInMonth = (fuels: FuelEntry[]): string[] => [
  ...new Set(fuels.map((f) => f.fuelType).filter(Boolean)),
];

/** Has this row been filled in at all? A row with a quantity or a factor is
    the supplier's work; an untouched one is scaffolding we put there. The
    distinction decides whether removing a fuel from the methodology can
    delete the row silently. */
export const fuelRowHasData = (f: FuelEntry): boolean =>
  f.quantity > 0 ||
  f.efTco2PerGj > 0 ||
  Boolean(f.ncvMjPerUnit) ||
  Boolean(f.fuelTypeOther?.trim());

export type FuelReconcile = {
  fuels: FuelEntry[];
  /** rows added because the methodology declared a fuel the month had no row for */
  added: string[];
  /** rows removed because the methodology no longer declares that fuel */
  removed: string[];
  /** declared fuels whose row HAS data and was therefore kept — the caller
      warns rather than destroying somebody's readings */
  keptWithData: string[];
};

/** Bring a month's fuel rows in line with the fuels the methodology declares.

    Order follows the methodology, so the month reads in the same sequence the
    methodology lists — twelve months of rows in a stable order is what makes
    a year comparable at a glance. */
export function reconcileFuelRows(
  declared: string[],
  fuels: FuelEntry[],
): FuelReconcile {
  const wanted = new Set(declared);
  const added: string[] = [];
  const removed: string[] = [];
  const keptWithData: string[] = [];

  // Keep every row whose fuel is still declared, plus any undeclared row that
  // carries data — deleting a supplier's readings because somebody edited the
  // methodology would be the worst possible reading of "keep them in step".
  const kept = fuels.filter((f) => {
    if (!f.fuelType) return true; // a blank row the supplier is mid-way through
    if (wanted.has(f.fuelType)) return true;
    if (fuelRowHasData(f)) {
      keptWithData.push(f.fuelType);
      return true;
    }
    removed.push(f.fuelType);
    return false;
  });

  /* A ROW BORN HERE ARRIVES WITH ITS UNIT AND ITS STANDARD VALUES.

     It used to arrive as a bare `emptyFuel()` with the fuel id pasted on, and
     that was survivable while every field was typable. It is not survivable now
     that a Type I row locks its calorific value and emission factor: the row
     would open locked AND empty, and there would be no way to fill it from the
     screen at all. `applyEuStandard` is the same function the form calls when
     the reader picks a fuel by hand — one path, one answer. */
  const present = new Set(kept.map((f) => f.fuelType));
  const fresh: FuelEntry[] = [];
  for (const id of declared) {
    if (present.has(id)) continue;
    fresh.push(
      applyEuStandard({
        ...emptyFuel(),
        fuelType: id,
        unit: fuelTypeDef(id)?.typicalUnit ?? emptyFuel().unit,
      }),
    );
    added.push(id);
  }

  const byDeclaredOrder = (a: FuelEntry, b: FuelEntry) => {
    const ia = declared.indexOf(a.fuelType);
    const ib = declared.indexOf(b.fuelType);
    return (
      (ia === -1 ? declared.length : ia) - (ib === -1 ? declared.length : ib)
    );
  };

  return {
    fuels: [...kept, ...fresh].sort(byDeclaredOrder),
    added,
    removed,
    keptWithData,
  };
}

/* ── Electricity ───────────────────────────────────────────── */

const CATEGORY_TO_FACTOR_SOURCE: Record<string, ElectricityFactorSource> = {
  Grid: "grid_default",
  // A dedicated line from one generator is priced on that generator's factor,
  // not the grid average — the same treatment a PPA gets, and the closest of
  // the three the monthly calculation offers.
  "Direct technical link": "ppa",
  "Power purchase agreement": "ppa",
  "Own generation": "self_generated",
};

/** The category behind a methodology option id, or null for "other"/unset. */
export const supplyCategory = (supplyId: string): string | null =>
  ELECTRICITY_SUPPLY_OPTIONS.find((o) => o.id === supplyId)?.category ?? null;

/** methodology → month. Exact: the category determines the factor class.
    Returns null when the methodology has no answer yet, so the month keeps
    whatever it had rather than being reset to a default. */
export function factorSourceForSupply(
  supplyId: string,
): ElectricityFactorSource | null {
  const category = supplyCategory(supplyId);
  return category ? (CATEGORY_TO_FACTOR_SOURCE[category] ?? null) : null;
}

/** month → methodology. Lossy, so it reports rather than decides.

    `changed` is false when the methodology's existing option already sits in
    the right category — picking "Grid default factor" when the methodology
    says PEA must not wipe PEA. It is true only when the category genuinely
    moved, and then `supply` comes back empty for the exporter to re-pick. */
export function supplyForFactorSource(
  factorSource: ElectricityFactorSource,
  currentSupply: string,
): { changed: boolean; supply: string; category: string | null } {
  const target = Object.keys(CATEGORY_TO_FACTOR_SOURCE).filter(
    (c) => CATEGORY_TO_FACTOR_SOURCE[c] === factorSource,
  );
  const current = supplyCategory(currentSupply);
  if (current && target.includes(current))
    return { changed: false, supply: currentSupply, category: current };
  return { changed: true, supply: "", category: target[0] ?? null };
}

/* ── One call, both directions ─────────────────────────────── */

export type SyncResult = {
  mmd: WorkspaceMmdContent;
  entry: MonthlyEntry;
  /** plain-language lines describing what was changed, for a toast. Empty when
      nothing moved — the caller must not announce a no-op. */
  notes: string[];
};

/** Applied when the METHODOLOGY changed. */
export function syncFromMmd(
  mmd: WorkspaceMmdContent,
  entry: MonthlyEntry,
  fuelLabel: (id: string) => string,
): SyncResult {
  const notes: string[] = [];
  const r = reconcileFuelRows(mmd.fuelTypeIds, entry.fuels);
  if (r.added.length)
    notes.push(`Added a row for ${r.added.map(fuelLabel).join(", ")}.`);
  if (r.removed.length)
    notes.push(
      `Removed the empty row for ${r.removed.map(fuelLabel).join(", ")}.`,
    );
  if (r.keptWithData.length)
    notes.push(
      `${r.keptWithData.map(fuelLabel).join(", ")} is no longer in the methodology but this month has readings for it — the row was kept. Delete it here if it is genuinely wrong.`,
    );

  const factorSource = factorSourceForSupply(mmd.electricitySupply);
  const nextEntry: MonthlyEntry = {
    ...entry,
    fuels: r.fuels,
    electricityFactorSource: factorSource ?? entry.electricityFactorSource,
  };
  if (factorSource && factorSource !== entry.electricityFactorSource)
    notes.push(
      "Updated where the electricity factor comes from to match the methodology.",
    );

  return { mmd, entry: nextEntry, notes };
}

/** Applied when the MONTH changed — a fuel row deleted, or the factor source
    re-picked. */
export function syncFromMonth(
  mmd: WorkspaceMmdContent,
  entry: MonthlyEntry,
  fuelLabel: (id: string) => string,
): SyncResult {
  const notes: string[] = [];
  const inMonth = new Set(fuelIdsInMonth(entry.fuels));
  const dropped = mmd.fuelTypeIds.filter((id) => !inMonth.has(id));
  const nextFuelIds = mmd.fuelTypeIds.filter((id) => inMonth.has(id));
  if (dropped.length)
    notes.push(
      `${dropped.map(fuelLabel).join(", ")} removed from the methodology too — it is one list.`,
    );

  const supply = supplyForFactorSource(
    entry.electricityFactorSource,
    mmd.electricitySupply,
  );
  if (supply.changed && mmd.electricitySupply)
    notes.push(
      `The electricity source no longer matches the methodology. Re-pick it there — ${supply.category ?? "the new category"} has several options and they use different factors.`,
    );

  /* DELETING THE "OTHER FUEL" ROW TAKES ITS NAME WITH IT.
     The methodology's `fuelTypesOther` is the description of the row the month
     no longer has, and leaving it behind means the next reader of the
     methodology sees a plant that burns rice husk with no rice husk anywhere
     in the year's readings — a contradiction between the two documents a
     verifier reads side by side, produced by a deletion that looked complete. */
  const keepsOther = nextFuelIds.includes("other");

  return {
    mmd: {
      ...mmd,
      fuelTypeIds: nextFuelIds,
      fuelTypesOther: keepsOther ? mmd.fuelTypesOther : "",
      electricitySupply: supply.changed ? supply.supply : mmd.electricitySupply,
    },
    entry,
    notes,
  };
}

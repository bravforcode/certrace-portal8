/* ════════════════════════════════════════════════════════════
   PRODUCTS MADE AT THE SAME SITE — Annex IV items 18, 19 and 27

   A precursor is not always bought. Billet made in the melt shop is rolled into
   wire rod on the same site; both are product reports of the one installation.
   The regulation asks the rolling mill to state the precursors "produced at the
   installation and used in each production process" (items 18 and 19), with the
   embedded emissions they carry (item 27) — and the figure to carry is the one
   the melt shop's own report already computes, not one anybody types a second
   time.

   So a row here is a LINK, not a supplier: the other product report of the same
   installation and year, and how many tonnes of it this good used. The rest —
   its specific embedded emissions — is read from that report each time it is
   needed (`internalContribution` in lib/workspace-see.ts), so changing a month
   in the melt shop moves the rolling mill's figure with it and nothing goes stale.

   Kept apart from lib/precursor-suppliers.ts on purpose. A bought precursor owes
   a producer, a country, a period and a verification report; one made on the
   site owes none of them, and putting it through that form is how a wire-rod
   mill ends up asking itself for a verification report.
   ════════════════════════════════════════════════════════════ */

const KEY = "certrace:internal-precursors";

export type InternalPrecursor = {
  id: string;
  /** the product report that USES the precursor */
  workspaceId: string;
  /** the product report that MADE it — same installation, same year */
  sourceWorkspaceId: string;
  /** tonnes of it used in the year, including what never reached the finished good (offcuts, scale, scrap) */
  quantityUsedT?: number;
};

type Store = Record<string, InternalPrecursor[]>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage full or blocked — the screen keeps its state; nothing else to do */
  }
}

export const newInternalId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID ? `ip-${crypto.randomUUID().slice(0, 8)}` : `ip-${Date.now().toString(36)}`;

export const listInternal = (workspaceId: string): InternalPrecursor[] => read()[workspaceId] ?? [];

export function saveInternal(row: InternalPrecursor): InternalPrecursor {
  const store = read();
  const rows = store[row.workspaceId] ?? [];
  const i = rows.findIndex((r) => r.id === row.id);
  if (i >= 0) rows[i] = row;
  else rows.push(row);
  store[row.workspaceId] = rows;
  write(store);
  return row;
}

export function removeInternal(workspaceId: string, id: string): void {
  const store = read();
  store[workspaceId] = (store[workspaceId] ?? []).filter((r) => r.id !== id);
  write(store);
}

/** Would making `sourceId` a precursor of `workspaceId` close a loop — the source (or something it uses) already using `workspaceId`? */
export function wouldLoop(workspaceId: string, sourceId: string): boolean {
  if (workspaceId === sourceId) return true;
  const seen = new Set<string>();
  const stack = [sourceId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === workspaceId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const r of listInternal(id)) stack.push(r.sourceWorkspaceId);
  }
  return false;
}

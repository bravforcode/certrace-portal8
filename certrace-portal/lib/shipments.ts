import { accountStorage } from "./account-storage";
/* ════════════════════════════════════════════════════════════
   SHIPMENT LOG — what actually left the gate, and for whom

   A declaration is a period. A shipment is an event inside it. Keeping them
   apart matters for three reasons a verifier will press on:

     1. Shipped ≠ produced. The log is evidence of sales, never of output —
        see lib/annual-production.ts for why auto-filling one from the other
        inflates every per-tonne figure in the filing.

     2. Buyer totals are built from shipments, not from declarations. One
        declaration's dataset can be communicated to several EU importers, and
        each importer's declarant only files for what THEY imported.

     3. A shipment resolves to the declaration version valid ON ITS OWN DATE.
        After a mid-year re-baseline, blending shipments across versions
        silently mixes two different emission factors into one buyer total
        (spec §5.5, Formula 5). The resolver signature below makes that
        impossible to do by accident: it is asked per shipment, with the date.

   A shipment logged before its declaration exists stays `pending` — visible,
   excluded from every total, and never silently absorbed into whichever
   declaration happens to overlap its date.

   One account document key, the same seam as the other stores.
   ════════════════════════════════════════════════════════════ */

import { getCatalogProduct } from "./config";
import type { Declaration } from "./data";

export type Shipment = {
  id: string;
  /** ISO 'YYYY-MM-DD' — the date the goods left, which is what decides which
      declaration version prices them */
  date: string;
  buyer: string;
  /** EORI of the EU importer, when known — the key their declarant files under */
  buyerEori?: string;
  /** catalogue product id */
  productId: string;
  quantityTonnes: number;
  invoiceRef?: string;
  /** free text about this consignment — a verifier reads it beside the row */
  notes?: string;
  /** null = not yet attributable to any declaration ("pending") */
  declarationId: string | null;
  /* The verification workspace this shipment belongs to — a shipment is
     evidence about a specific product, from a specific installation, in a
     specific year, which is exactly what a workspace is.

     null = legacy or unassigned. Every existing function keeps working for
     null rows, and every existing screen keeps rendering them: a log written
     before workspaces existed must not vanish because a new column arrived. */
  workspaceId?: string | null;
  linkedAt?: number;
  createdAt: number;
};

const KEY = "certrace:shipments";

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `shp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function listShipments(): Shipment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = accountStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Shipment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(all: Shipment[]): Shipment[] {
  if (typeof window === "undefined") return all;
  try {
    accountStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
  return all;
}

export function addShipment(
  input: Omit<Shipment, "id" | "createdAt">,
): Shipment[] {
  const s: Shipment = { ...input, id: uid(), createdAt: Date.now() };
  return persist([...listShipments(), s]);
}

export function updateShipment(
  id: string,
  patch: Partial<Shipment>,
): Shipment[] {
  return persist(
    listShipments().map((s) =>
      s.id === id ? { ...s, ...patch, id: s.id } : s,
    ),
  );
}

export function removeShipment(id: string): Shipment[] {
  return persist(listShipments().filter((s) => s.id !== id));
}

/** Shipments already attributed to a declaration. */
export const shipmentsFor = (declarationId: string): Shipment[] =>
  listShipments()
    .filter((s) => s.declarationId === declarationId)
    .sort((a, b) => a.date.localeCompare(b.date));

/** Net mass attributed to a declaration — the figure validation V4 compares
    against the production denominator. */
export const shippedTonnesFor = (declarationId: string): number =>
  shipmentsFor(declarationId).reduce((a, s) => a + s.quantityTonnes, 0);

/** Shipments with no declaration whose date falls inside this one's period.

    A CANDIDATE list, never an action. Periods overlap (a quarterly buyer
    request and an annual CBAM filing cover the same weeks), so linking on
    date alone would absorb rows into whichever declaration was opened first.
    The exporter confirms; this function only proposes. */
export function unlinkedShipmentsFor(
  decl: Pick<Declaration, "id" | "periodStart" | "periodEnd">,
): Shipment[] {
  const start = decl.periodStart;
  const end = decl.periodEnd;
  return listShipments()
    .filter((s) => s.declarationId === null)
    .filter((s) => (!start || s.date >= start) && (!end || s.date <= end))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Every shipment still waiting for a declaration — shown as "not yet
    attributable" rather than hidden, because an unattributed shipment is a
    hole in the buyer totals, not an absence of one. */
export const pendingShipments = (): Shipment[] =>
  listShipments()
    .filter((s) => s.declarationId === null)
    .sort((a, b) => a.date.localeCompare(b.date));

export function linkShipments(
  ids: string[],
  declarationId: string,
): Shipment[] {
  const set = new Set(ids);
  const now = Date.now();
  return persist(
    listShipments().map((s) =>
      set.has(s.id) ? { ...s, declarationId, linkedAt: now } : s,
    ),
  );
}

export function unlinkShipments(ids: string[]): Shipment[] {
  const set = new Set(ids);
  return persist(
    listShipments().map((s) =>
      set.has(s.id) ? { ...s, declarationId: null, linkedAt: undefined } : s,
    ),
  );
}

/* ── Formula 5 — per-buyer embedded emissions ───────────────────
   T_buyer = Σ_s [ q_s × SEE_total_chargeable(decl(s)) ]

   `resolveSee` is asked once per shipment and receives the shipment's DATE
   alongside its declaration id, so an implementation that versions its
   calculation (lib/cbam/freeze.ts) returns the snapshot that was valid then.
   Returning null means "no approved figure for that date" — the tonnes still
   show, the emissions do not, and the row is marked unpriced rather than
   quietly counted as zero. */
export type BuyerTotal = {
  buyer: string;
  buyerEori?: string;
  shipments: number;
  tonnes: number;
  /** tCO₂e embedded across the shipments that resolved to a figure */
  embeddedTCO2e: number;
  /** tonnes whose declaration had no chargeable figure to apply */
  unpricedTonnes: number;
};

export function emissionsByBuyer(
  shipments: Shipment[],
  resolveSee: (declarationId: string, shipmentDate: string) => number | null,
): BuyerTotal[] {
  const byBuyer = new Map<string, BuyerTotal>();
  for (const s of shipments) {
    if (!s.declarationId) continue; // pending stays out of buyer totals, always
    const row = byBuyer.get(s.buyer) ?? {
      buyer: s.buyer,
      buyerEori: s.buyerEori,
      shipments: 0,
      tonnes: 0,
      embeddedTCO2e: 0,
      unpricedTonnes: 0,
    };
    const see = resolveSee(s.declarationId, s.date);
    row.shipments += 1;
    row.tonnes += s.quantityTonnes;
    if (see == null) row.unpricedTonnes += s.quantityTonnes;
    else row.embeddedTCO2e += s.quantityTonnes * see;
    byBuyer.set(s.buyer, row);
  }
  return [...byBuyer.values()].sort(
    (a, b) => b.embeddedTCO2e - a.embeddedTCO2e,
  );
}

/* The same formula, keyed on the WORKSPACE a shipment belongs to.

   Declarations were retired as the spine, so "which figure prices this
   shipment" is now answered by the workspace it is linked to: the workspace
   owns the year's SEE, and one workspace can feed several buyers. Same
   contract as `emissionsByBuyer` — a null from the resolver means no figure
   for that date, the tonnes still show, and the row is marked unpriced rather
   than quietly counted as zero. */
export function emissionsByBuyerForWorkspaces(
  shipments: Shipment[],
  resolveSee: (workspaceId: string, shipmentDate: string) => number | null,
): BuyerTotal[] {
  const byBuyer = new Map<string, BuyerTotal>();
  for (const s of shipments) {
    if (!s.workspaceId) continue; // unlinked stays out of buyer totals, always
    const row = byBuyer.get(s.buyer) ?? {
      buyer: s.buyer,
      buyerEori: s.buyerEori,
      shipments: 0,
      tonnes: 0,
      embeddedTCO2e: 0,
      unpricedTonnes: 0,
    };
    const see = resolveSee(s.workspaceId, s.date);
    row.shipments += 1;
    row.tonnes += s.quantityTonnes;
    if (see == null) row.unpricedTonnes += s.quantityTonnes;
    else row.embeddedTCO2e += s.quantityTonnes * see;
    byBuyer.set(s.buyer, row);
  }
  return [...byBuyer.values()].sort(
    (a, b) => b.embeddedTCO2e - a.embeddedTCO2e,
  );
}

/** Display helper — the good behind a shipment row. */
export const shipmentProductName = (s: Shipment): string =>
  getCatalogProduct(s.productId)?.name ?? s.productId;
export const shipmentCnCode = (s: Shipment): string =>
  getCatalogProduct(s.productId)?.cnCode ?? "—";

/* ── Workspace view (§A7) ───────────────────────────────────────
   The same shipment log, sliced by workspace. `/shipments` stays as the
   global cross-workspace list — an exporter still needs one place to see
   everything that left the gate, and deleting it would trade one useful view
   for another. */

export const shipmentsForWorkspace = (workspaceId: string): Shipment[] =>
  listShipments()
    .filter((s) => s.workspaceId === workspaceId)
    .sort((a, b) => a.date.localeCompare(b.date));

export const shippedTonnesForWorkspace = (workspaceId: string): number =>
  shipmentsForWorkspace(workspaceId).reduce((a, s) => a + s.quantityTonnes, 0);

/** Unassigned shipments whose product and date fit this workspace.

    A CANDIDATE LIST, NEVER AN ACTION. Two workspaces for the same product in
    overlapping periods — an ordinary mid-year re-baseline — would otherwise
    have the first one opened silently absorb the other's rows, and nothing on
    screen would show it happened. The exporter confirms; this only proposes. */
export function unassignedCandidatesFor(ws: {
  id: string;
  productId: string;
  periodStart: string;
  periodEnd: string;
}): Shipment[] {
  return listShipments()
    .filter((s) => !s.workspaceId)
    .filter((s) => s.productId === ws.productId)
    .filter((s) => s.date >= ws.periodStart && s.date <= ws.periodEnd)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function assignToWorkspace(
  ids: string[],
  workspaceId: string,
): Shipment[] {
  const set = new Set(ids);
  return persist(
    listShipments().map((s) => (set.has(s.id) ? { ...s, workspaceId } : s)),
  );
}

export function unassignFromWorkspace(ids: string[]): Shipment[] {
  const set = new Set(ids);
  return persist(
    listShipments().map((s) =>
      set.has(s.id) ? { ...s, workspaceId: null } : s,
    ),
  );
}

/* ── Mass reconciliation (§A7.4) ────────────────────────────────
   Σ net mass against annual production.

   The two thresholds are deliberately asymmetric. Shipping MORE than the
   installation produced is an ERROR — the mass has to come from somewhere,
   and it is usually a shipment attributed to the wrong period. Shipping a
   SMALL FRACTION is INFORMATION, not a warning: exporting a minority of
   output is completely normal for a mill that also sells domestically, and
   warning about it would train the exporter to ignore the panel. */
export const SHIPPED_RATIO_LOW_INFO = 0.3;

export type MassReconciliation = {
  shippedTonnes: number;
  producedTonnes: number | null;
  /** shipped ÷ produced */
  ratio: number | null;
  level: "ok" | "info" | "error" | "unknown";
  message: string;
};

export function reconcileMass(
  shippedTonnes: number,
  producedTonnes: number | null,
): MassReconciliation {
  if (producedTonnes == null || !(producedTonnes > 0)) {
    return {
      shippedTonnes,
      producedTonnes,
      ratio: null,
      level: "unknown",
      message:
        "Annual production is not yet complete, so shipped mass cannot be reconciled against it.",
    };
  }
  const ratio = shippedTonnes / producedTonnes;
  if (ratio > 1) {
    return {
      shippedTonnes,
      producedTonnes,
      ratio,
      level: "error",
      message: `Shipped exceeds produced — ${shippedTonnes.toLocaleString("en-GB")} t shipped against ${producedTonnes.toLocaleString("en-GB")} t produced (${(ratio * 100).toFixed(1)}%). Mass cannot leave that was never made: check for a shipment attributed to the wrong period, or a production month still missing.`,
    };
  }
  if (ratio < SHIPPED_RATIO_LOW_INFO) {
    return {
      shippedTonnes,
      producedTonnes,
      ratio,
      level: "info",
      message: `${(ratio * 100).toFixed(2)}% of production was shipped under this workspace. Exporting a minority of output is normal — this is context, not a problem.`,
    };
  }
  return {
    shippedTonnes,
    producedTonnes,
    ratio,
    level: "ok",
    message: `${(ratio * 100).toFixed(1)}% of production shipped under this workspace.`,
  };
}

/* ── Field help that removes the two errors people actually make ── */
export const NET_MASS_HELP =
  "Net mass — the goods only, excluding packaging, pallets and dunnage. Take it from the commercial invoice's net weight line.";

export const EORI_HELP =
  "Your EU buyer's EORI. Format: 2-letter country code + up to 15 characters, e.g. DE123456789012345.";

/** Shape check only — there is no EORI registry to validate against here, and
    a false rejection of a valid number is worse than a permissive field. */
export const eoriLooksValid = (v: string): boolean =>
  /^[A-Z]{2}[A-Z0-9]{1,15}$/.test(v.trim().toUpperCase());

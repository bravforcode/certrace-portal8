/* ════════════════════════════════════════════════════════════
   THE VERIFICATION WORKSPACE — one per (installation × product × year)

   "Steel billet · Plant A · 2026" is one workspace. It is the screen an
   exporter opens every month while getting ready for verification, and the
   screen they hand to a verifier at the end of the year.

   Why this shape and not "one big declaration": a verifier's questions are
   always scoped to an installation, a good and a period. Asking "show me
   March" has no answer if March's gas reading belongs to a filing that also
   covers two other plants and four other CN codes. The triple IS the unit of
   verification, so it is the unit of the workspace.

   Six tabs hang off it:

     Overview · MMD · Monthly Data · Precursors · Evidence · Readiness

   RELATIONSHIP TO lib/cbam/. This is a layer ON TOP of the Part-1 engine, not
   a replacement for it. The arithmetic still lives in lib/cbam/engine.ts and
   lib/cbam/precursor-tree.ts; lib/workspace-see.ts feeds monthly aggregates
   into it. Nothing here re-implements a formula. A declaration remains what
   gets FILED; a workspace is what gets VERIFIED, and one workspace can feed
   several declarations (`declarationIds`).

   Frontend-only MVP: one localStorage key, the same seam as lib/shipments.ts
   and lib/annual-production.ts, and the same seam a real API slots into.
   ════════════════════════════════════════════════════════════ */

import { getCatalogProduct, isComplexGood, type AggregatedGoodsCategory, type CatalogProduct, type ProductCategory } from "./config";
import { refuseWrite } from "./seat";
import { pickerOptions } from "./installations";
import type { GoodsCategory } from "./cbam/engine";
import { secureId } from "./secure-id";

/* ── Production routes ──────────────────────────────────────────
   The route is not decoration: it decides which precursors are even possible
   (a Scrap-EAF billet has no pig iron above it), and it is the first thing a
   verifier checks the MMD's boundary description against. Declared once per
   workspace because a route does not change month to month — if it does, that
   is a re-baseline and it belongs in a new workspace, not a silent edit. */
export type ProductionRoute = {
  id: string;
  /** the short name people say out loud */
  label: string;
  /** the coarse sector split — still useful for grouping the picker, but no
      longer what the picker FILTERS by. See aggregatedCategories. */
  category: ProductCategory;
  /** which aggregated goods categories this route is actually valid for.
      BF-BOF makes crude steel, not "iron or steel products" — a route
      belongs to the specific stage it produces, and the two coarse
      categories above (Iron & Steel / Aluminium) span several stages each
      that do not share a route set. */
  aggregatedCategories: AggregatedGoodsCategory[];
  /** ONE plain sentence: what actually happens on the shop floor. */
  hint: string;
  /** the name the standard uses, so the same route survives into a filing */
  standardName: string;
  /** what sits ABOVE the good — the precursors this route implies */
  precursors: string;
  /** where the emissions actually come from on this route */
  dominantSource: string;
};

/* ── The routes ────────────────────────────────────────────────
   Aluminium and steel are NOT the same list wearing different labels, and the
   difference is not a naming detail:

     · Steel routes differ mainly in WHAT IS CHARGED — scrap, DRI or hot metal
       — and that choice decides which precursors exist above the good.
     · Aluminium routes differ mainly in WHERE THE CARBON IS — primary smelting
       puts it in electricity and in the anode, secondary melting puts almost
       none anywhere because scrap is zero-rated.

   So the picker filters by the product's category and each option says what
   the route implies rather than expanding an acronym. `standardName` carries
   the wording the EU methodology uses, because a route recorded as "EAF" in
   the portal and "Electric arc furnace" in the filing is two answers to the
   question a verifier asks once. */
export const PRODUCTION_ROUTES: ProductionRoute[] = [
  {
    id: "scrap_eaf",
    label: "Scrap-EAF",
    category: "Iron & Steel",
    // An electric arc furnace makes CRUDE STEEL, whatever it is charged
    // with — the charge (scrap vs DRI) decides the precursor set, not the
    // aggregated category the output belongs to.
    aggregatedCategories: ["Crude steel"],
    standardName: "Electric arc furnace — scrap-based",
    hint: "You melt scrap in an electric arc furnace.",
    precursors: "Usually none in scope. Scrap is zero-rated, so nothing carries embedded emissions into the furnace.",
    dominantSource: "Electricity, plus electrode and flux consumption as process emissions.",
  },
  {
    id: "dri_eaf",
    label: "DRI-EAF",
    category: "Iron & Steel",
    aggregatedCategories: ["Crude steel"],
    standardName: "Electric arc furnace — direct reduced iron",
    hint: "You melt direct reduced iron, usually with some scrap, in an electric arc furnace.",
    precursors: "The DRI itself. It is a CBAM good with its own SEE, and it is normally the largest single number in the chain.",
    dominantSource: "The DRI's embedded emissions, then electricity.",
  },
  {
    id: "bf_bof",
    label: "BF-BOF",
    category: "Iron & Steel",
    // The bug this route set exists to fix: BF-BOF makes crude steel. It was
    // offered for "Iron or steel products" — the DOWNSTREAM category — which
    // is a different aggregated good with a different route set entirely
    // (see rolling_only below).
    aggregatedCategories: ["Crude steel"],
    standardName: "Blast furnace — basic oxygen furnace",
    hint: "You reduce iron ore with coke in a blast furnace, then blow the hot metal to steel in a converter.",
    precursors: "Sintered ore, coke and pig iron — three tiers, each with its own installation and SEE.",
    dominantSource: "Coke and coal burned as reductant. The most carbon-intensive steel route.",
  },
  {
    id: "smelting_reduction",
    label: "Smelting reduction",
    category: "Iron & Steel",
    // Produces hot metal (pig iron), not crude steel — the alternative to a
    // blast furnace for that stage, not to a converter.
    aggregatedCategories: ["Pig iron"],
    standardName: "Smelting reduction (Corex / Finex and equivalent)",
    hint: "You reduce iron ore with coal directly, skipping the coke oven.",
    precursors: "Iron ore, and pig iron where hot metal is bought in. No coke tier.",
    dominantSource: "Coal burned as reductant.",
  },
  {
    id: "rolling_only",
    label: "Rolling / finishing only",
    category: "Iron & Steel",
    // Re-heating, re-melting, casting, rolling, forging, annealing, coating,
    // galvanizing, wire drawing, pickling — the process set Iron or steel
    // products actually covers. Crude steel is its precursor, not its route.
    aggregatedCategories: ["Iron or steel products"],
    standardName: "Downstream processing of purchased steel",
    hint: "You buy semi-finished steel and roll, draw, coat or cut it. You do not melt.",
    precursors: "The purchased billet, slab or coil. Nearly all of the SEE arrives with it.",
    dominantSource: "Reheat-furnace fuel. Small next to what the input already carries.",
  },
  {
    id: "sintering",
    label: "Sintering",
    category: "Iron & Steel",
    aggregatedCategories: ["Sintered ore"],
    standardName: "Sinter plant",
    hint: "You agglomerate iron ore fines into sinter, ready for the blast furnace.",
    precursors: "Iron ore fines and the fuels burned on the sinter strand. No tier above this one.",
    dominantSource: "Coke breeze burned on the strand, plus the strand's own fuel.",
  },
  {
    id: "blast_furnace",
    label: "Blast furnace",
    category: "Iron & Steel",
    // Standalone hot-metal production — distinct from the combined bf_bof
    // route, which also carries the converter step through to crude steel.
    aggregatedCategories: ["Pig iron"],
    standardName: "Blast furnace — hot metal",
    hint: "You reduce iron ore with coke in a blast furnace and cast the hot metal as pig iron, without converting it to steel on site.",
    precursors: "Sintered ore and coke, each with its own installation and SEE.",
    dominantSource: "Coke burned as reductant.",
  },
  {
    id: "direct_reduction",
    label: "Direct reduction",
    category: "Iron & Steel",
    aggregatedCategories: ["Direct reduced iron"],
    standardName: "Direct reduction plant",
    hint: "You reduce iron ore to DRI using natural gas or hydrogen, without melting it.",
    precursors: "Iron ore or pellets. No tier above this one.",
    dominantSource: "Reducing gas — natural gas reforming, or hydrogen where available.",
  },
  {
    id: "ferro_alloy_smelting",
    label: "Ferro-alloy smelting",
    category: "Iron & Steel",
    // FeMn, FeCr and FeNi collapse to one aggregated category in this
    // catalogue (CN 7202) — one route covers all three, per the spec.
    aggregatedCategories: ["Ferro-alloys"],
    standardName: "Submerged-arc furnace — ferro-alloy production",
    hint: "You smelt ore with a reductant in a submerged-arc furnace to make FeMn, FeCr or FeNi.",
    precursors: "Ore and reductant (coke or coal). No tier above this one.",
    dominantSource: "Electricity and the reductant burned in the furnace.",
  },
  {
    id: "hall_heroult",
    label: "Primary smelting (Hall-Héroult, pre-baked anode)",
    category: "Aluminium",
    aggregatedCategories: ["Unwrought aluminium"],
    standardName: "Primary aluminium production — electrolysis, pre-baked anode",
    hint: "You reduce alumina to aluminium electrolytically in pots with pre-baked carbon anodes.",
    precursors: "Alumina and anodes, where these are bought in rather than made on site.",
    dominantSource:
      "Electricity, by a wide margin — which is why the grid factor matters more here than anywhere else in CBAM — plus anode consumption and PFCs from anode effects.",
  },
  {
    id: "soderberg",
    label: "Primary smelting (Søderberg)",
    category: "Aluminium",
    aggregatedCategories: ["Unwrought aluminium"],
    standardName: "Primary aluminium production — electrolysis, Søderberg anode",
    hint: "You reduce alumina to aluminium electrolytically in pots with a continuous, self-baking Søderberg anode.",
    precursors: "Alumina. The anode is formed in the pot rather than bought in pre-baked.",
    dominantSource: "Electricity, plus higher PFC emissions from anode effects than the pre-baked route.",
  },
  {
    id: "remelt",
    label: "Secondary / remelt",
    category: "Aluminium",
    aggregatedCategories: ["Unwrought aluminium"],
    standardName: "Secondary aluminium production — remelting",
    hint: "You remelt scrap and process returns into ingot or billet.",
    precursors: "Usually none in scope. Scrap is zero-rated.",
    dominantSource: "Furnace fuel. The lowest-intensity aluminium route by a large margin.",
  },
  {
    id: "extrusion",
    label: "Extrusion",
    category: "Aluminium",
    aggregatedCategories: ["Aluminium products"],
    standardName: "Downstream processing — extrusion of purchased billet",
    hint: "You buy billet and press it into profiles.",
    precursors: "The purchased billet, which carries the smelter's SEE.",
    dominantSource: "Billet-heating fuel. Small next to what the billet already carries.",
  },
  {
    id: "rolling_al",
    label: "Rolling / finishing",
    category: "Aluminium",
    aggregatedCategories: ["Aluminium products"],
    standardName: "Downstream processing — rolling and finishing",
    hint: "You buy slab or ingot and roll it to sheet, plate or foil.",
    precursors: "The purchased slab or ingot.",
    dominantSource: "Annealing and rolling energy. Small next to what the input already carries.",
  },
];

/** Filtered by the FINE aggregated category, not the coarse Iron & Steel /
    Aluminium split — see the type comment on ProductionRoute for why that
    distinction is the whole point of this function existing. */
export const routesForCategory = (aggCategory: AggregatedGoodsCategory): ProductionRoute[] =>
  PRODUCTION_ROUTES.filter((r) => r.aggregatedCategories.includes(aggCategory));

export const getRoute = (id: string): ProductionRoute | undefined => PRODUCTION_ROUTES.find((r) => r.id === id);

export const routeLabel = (id: string): string => getRoute(id)?.label ?? id;

/** Does this stored route actually belong to this stored aggregated
    category? For surfacing a warning on existing records — a workspace
    created before this fix could hold a combination like BF-BOF ×
    "Iron or steel products" that was never valid. */
export const routeMatchesCategory = (routeId: string, aggCategory: AggregatedGoodsCategory): boolean => {
  const route = getRoute(routeId);
  return route != null && route.aggregatedCategories.includes(aggCategory);
};

/* ── The workspace ──────────────────────────────────────────────
   `cnCode` and `productName` are denormalised from the catalogue on purpose.
   The catalogue is master data that can be corrected; a workspace already
   handed to a verifier must keep saying what it said, so the values are
   copied at creation and the catalogue id is kept alongside for lookups. */
export type VerificationWorkspace = {
  id: string;
  installationId: string;
  installationName: string;
  /** catalogue product id, from PRODUCT_CATALOG in lib/config.ts */
  productId: string;
  productName: string;
  cnCode: string;
  /** ProductionRoute id — Scrap-EAF | DRI-EAF | BF-BOF | … */
  productionRoute: string;
  /** reporting year */
  year: number;
  /** ISO 'YYYY-MM-DD' */
  periodStart: string;
  periodEnd: string;
  /** declarations that draw on this workspace */
  declarationIds: string[];
  createdAt: string;
  /** true when the installation is the exporter's own site rather than a
      third-party supplier's. Decides whether the monthly request is sent out
      or lands in the exporter's own inbox. */
  selfSupplied?: boolean;
  /* ── Who owns the installation ────────────────────────────────
     An installation belongs to a company, and the company is the level an
     exporter actually organises by: "what is outstanding at G J Steel" spans
     several of their plants, and each plant makes several goods. So the estate
     reads supplier → installation → good, and the two fields below are what
     make that grouping possible without a join to a store the workspace may
     not have loaded.

     Denormalised for the same reason as `productName` and `cnCode`: a supplier
     can be renamed, and a workspace already handed to a verifier must keep
     saying what it said. Optional so workspaces created before suppliers
     became first-class still load — those group under the exporter's own name
     when `selfSupplied`, and under "Unassigned" otherwise. */
  supplierId?: string;
  supplierName?: string;
  /** when the monthly ask goes out, and who gets chased. Optional so
      workspaces created before this existed still load; `scheduleFor` fills
      the defaults rather than every reader repeating them. */
  schedule?: WorkspaceSchedule;
  /* ── Archived, not deleted ────────────────────────────────────
     A year that is finished, or a workspace opened by mistake, has to be able
     to LEAVE the estate — a dashboard counting a 2024 workspace nobody will
     touch again is a dashboard that reads as permanently behind. It must not
     leave by being destroyed: the readings, the MMD and the precursor rows
     behind it are the evidence for a declaration that has already been filed,
     and a verifier asking about it two years later is the normal case, not
     the exception.

     So archiving is the only way out. `archivedAt` is the ISO timestamp it
     happened; absent or null means active. listWorkspaces() filters archived
     rows out, which is what takes them off the dashboard, the inbox, Reports
     and Carbon & Cost in one move — getWorkspace() still returns them, so an
     archived workspace opened from the archive still reads normally. */
  archivedAt?: string | null;
  /** set when the exporter has signed the year off internally */
  internalSignoff?: Signoff | null;
  /** set when a verifier has signed the year off */
  verifierSignoff?: Signoff | null;
};

/* ── The monthly cadence ────────────────────────────────────────
   A workspace is not a form, it is a standing request that goes out twelve
   times. Who it goes to is decided by `selfSupplied`; WHEN it goes out is no
   longer a choice.

   THE REQUEST GOES OUT AT THE END OF THE MONTH IT COVERS, always. That used to
   be a picker — "ask on the Nth of the following month" — and it was a choice
   nobody could answer well. A month cannot be reported before it has ended, so
   the earliest honest moment to ask is the moment it ends; asking later only
   shortens the time the other end has to answer. Making it a setting invited an
   exporter to pick the 25th, then wonder in December why every month ran late.

   WHAT IS STILL A CHOICE is the DEADLINE — the last date the data can come in.
   That is genuinely per-workspace, because a supplier who closes their books on
   the 5th and one who closes on the 25th cannot share one, and it is the only
   date anything in the portal measures against. */
export type WorkspaceSchedule = {
  /** The LAST DATE the month's data may be sent, as a day of the month AFTER
      the one being reported. January's data is asked for on 31 January and,
      with `dueDay: 15`, is due by 15 February. 1–28. */
  dueDay: number;
};

/* WARNINGS ARE NOT A SETTING. There used to be a "warn me N days before" list
   and a "flag it to me as well" switch here. Neither was ever read: nothing in
   the codebase branched on them, and the dashboard, Readiness and the Inbox
   already surface a month as it approaches its due date and again once it
   passes. Two controls that look like they configure warnings, next to
   warnings that ignore them, is worse than no controls — an exporter who turns
   "flag it to me" off would still be flagged, and would stop trusting the flag.
   The due date is the setting; the warning follows from it. */

/* 28 rather than 31: a deadline set for the 30th silently never arrives in
   February, and a missing February is exactly the gap this is meant to close. */
export const MAX_DUE_DAY = 28;

export const DEFAULT_SCHEDULE: WorkspaceSchedule = { dueDay: 15 };

/* ── Reading a schedule written under the old shape ──────────────
   Workspaces created before this change hold `{ requestDay, sendTime,
   dueAfterDays, paused }` and no `dueDay`. Dropping them on the floor would
   silently move every deadline twelve months are measured against, so the old
   pair is converted rather than ignored: the deadline they actually had was
   `requestDay + dueAfterDays` days into the following month, and that is the
   day this returns. Clamped to 28 for the February reason above. */
type LegacySchedule = { requestDay?: number; dueAfterDays?: number };

export function scheduleFor(w: Pick<VerificationWorkspace, "schedule">): WorkspaceSchedule {
  const raw = (w.schedule ?? {}) as Partial<WorkspaceSchedule> & LegacySchedule;
  if (Number.isFinite(raw.dueDay) && (raw.dueDay as number) > 0) {
    return { dueDay: Math.min(MAX_DUE_DAY, Math.max(1, Math.round(raw.dueDay as number))) };
  }
  if (Number.isFinite(raw.requestDay) || Number.isFinite(raw.dueAfterDays)) {
    const legacy = (raw.requestDay ?? 5) + (raw.dueAfterDays ?? 7);
    return { dueDay: Math.min(MAX_DUE_DAY, Math.max(1, legacy)) };
  }
  return { ...DEFAULT_SCHEDULE };
}

/** The deadline picker's options — every day a February can also have. */
export const dueDayOptions = (): number[] => Array.from({ length: MAX_DUE_DAY }, (_, i) => i + 1);

export type Signoff = {
  name: string;
  role: string;
  /** ISO timestamp */
  at: string;
  note?: string;
};

const KEY = "certrace:workspaces";

export const uid = () => secureId("ws");

function read(): VerificationWorkspace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VerificationWorkspace[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(all: VerificationWorkspace[]): VerificationWorkspace[] {
  if (typeof window === "undefined") return all;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
  return all;
}

const byYearThenName = (a: VerificationWorkspace, b: VerificationWorkspace) =>
  b.year - a.year || a.installationName.localeCompare(b.installationName) || a.productName.localeCompare(b.productName);

/** The ACTIVE estate — everything not archived. Every screen that counts,
    chases or reports on workspaces reads this, so archiving one removes it
    from all of them at once. */
export const listWorkspaces = (): VerificationWorkspace[] => read().filter((w) => !w.archivedAt).sort(byYearThenName);

/** What has been put away, most recently archived first — the archive view on
    the estate screen, and nothing else. */
export const listArchivedWorkspaces = (): VerificationWorkspace[] =>
  read()
    .filter((w) => Boolean(w.archivedAt))
    .sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? "") || byYearThenName(a, b));

/* Archived rows are still found by id: an archived workspace opened from the
   archive has to render its months and its readiness exactly as it did, or
   "archived" would mean "unreadable". */
export const getWorkspace = (id: string): VerificationWorkspace | null => read().find((w) => w.id === id) ?? null;

export type NewWorkspaceInput = {
  installationId: string;
  installationName: string;
  productId: string;
  productionRoute: string;
  year: number;
  selfSupplied?: boolean;
  supplierId?: string;
  supplierName?: string;
  schedule?: Partial<WorkspaceSchedule>;
};

export function createWorkspace(input: NewWorkspaceInput): VerificationWorkspace {
  /* The seat backstop — see refuseWrite() in lib/seat.ts. The UI guard
     refuses first; this is what makes the refusal true for a path nobody
     thought about. Path-scoped, so a SUPPLIER filling this same store through
     /w/<token> is never caught by it. */
  if (refuseWrite("buildWorkspaces")) throw new Error("This seat cannot create a workspace.");
  const product = getCatalogProduct(input.productId);
  const ws: VerificationWorkspace = {
    id: uid(),
    installationId: input.installationId.trim(),
    installationName: input.installationName.trim(),
    productId: input.productId,
    productName: product?.name ?? input.productId,
    cnCode: product?.cnCode ?? "",
    productionRoute: input.productionRoute,
    year: input.year,
    periodStart: `${input.year}-01-01`,
    periodEnd: `${input.year}-12-31`,
    declarationIds: [],
    createdAt: new Date().toISOString(),
    selfSupplied: input.selfSupplied ?? false,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    schedule: { ...DEFAULT_SCHEDULE, ...(input.schedule ?? {}) },
    internalSignoff: null,
    verifierSignoff: null,
  };
  write([...read(), ws]);
  return ws;
}

export function updateWorkspace(id: string, patch: Partial<VerificationWorkspace>): VerificationWorkspace | null {
  /* The seat backstop — see refuseWrite() in lib/seat.ts. The UI guard
     refuses first; this is what makes the refusal true for a path nobody
     thought about. Path-scoped, so a SUPPLIER filling this same store through
     /w/<token> is never caught by it. */
  if (refuseWrite("enterFigures")) return getWorkspace(id);
  const all = read();
  const next = all.map((w) => (w.id === id ? { ...w, ...patch, id: w.id } : w));
  write(next);
  return next.find((w) => w.id === id) ?? null;
}

export function removeWorkspace(id: string): VerificationWorkspace[] {
  /* The seat backstop — see refuseWrite() in lib/seat.ts. The UI guard
     refuses first; this is what makes the refusal true for a path nobody
     thought about. Path-scoped, so a SUPPLIER filling this same store through
     /w/<token> is never caught by it. */
  if (refuseWrite("deleteWorkspace")) return read();
  return write(read().filter((w) => w.id !== id));
}

/** Take a workspace out of the active estate, keeping everything behind it.
    Idempotent — archiving twice must not rewrite the date, or "archived
    3 months ago" becomes "archived today" on a second click. */
export function archiveWorkspace(id: string): VerificationWorkspace | null {
  /* The seat backstop — see refuseWrite() in lib/seat.ts. The UI guard
     refuses first; this is what makes the refusal true for a path nobody
     thought about. Path-scoped, so a SUPPLIER filling this same store through
     /w/<token> is never caught by it. */
  if (refuseWrite("archiveWorkspace")) return getWorkspace(id);
  const current = getWorkspace(id);
  if (!current) return null;
  if (current.archivedAt) return current;
  return updateWorkspace(id, { archivedAt: new Date().toISOString() });
}

/** Put it back. Nothing else changes — the months, the MMD and the precursor
    chain were never touched, so a restored workspace resumes where it was. */
export function restoreWorkspace(id: string): VerificationWorkspace | null {
  /* The seat backstop — see refuseWrite() in lib/seat.ts. The UI guard
     refuses first; this is what makes the refusal true for a path nobody
     thought about. Path-scoped, so a SUPPLIER filling this same store through
     /w/<token> is never caught by it. */
  if (refuseWrite("archiveWorkspace")) return getWorkspace(id);
  return updateWorkspace(id, { archivedAt: null });
}

export const isArchived = (w: Pick<VerificationWorkspace, "archivedAt">): boolean => Boolean(w.archivedAt);

/** Attach a declaration that draws on this workspace's numbers. Idempotent —
    a declaration re-opened twice must not appear twice in the trail. */
export function linkDeclaration(workspaceId: string, declarationId: string): VerificationWorkspace | null {
  const ws = getWorkspace(workspaceId);
  if (!ws) return null;
  if (ws.declarationIds.includes(declarationId)) return ws;
  return updateWorkspace(workspaceId, { declarationIds: [...ws.declarationIds, declarationId] });
}

/* ── Duplicate detection ────────────────────────────────────────
   WARN, never block. Two workspaces for the same triple is usually a mistake,
   but it is also how an exporter legitimately re-baselines mid-year after a
   furnace rebuild — and a hard block would leave them with nowhere to put the
   second half of the year. So the creation screen says "one already exists"
   and lets them through. */
export const existingForTriple = (installationId: string, productId: string, year: number): VerificationWorkspace | null =>
  /* Archived rows do not count as duplicates. Archiving a workspace opened by
     mistake and then being warned that it already exists when recreating it
     is the archive failing to mean anything. */
  read().find((w) => !w.archivedAt && w.installationId === installationId && w.productId === productId && w.year === year) ?? null;

/* ── Installations ──────────────────────────────────────────────
   There is no installation registry in this MVP, and inventing one would be a
   bigger change than this work stream needs. So the picker offers every
   installation already used by a workspace, plus the exporter's own from the
   org profile, and lets them type a new one. The id is what groups the
   dashboard; the name is what a verifier reads. */
export type Installation = { id: string; name: string; self?: boolean };

/** The picker's list: every registered installation (lib/installations.ts),
    plus any installation an older workspace already refers to, plus the
    exporter's own site synthesised from the org profile when they have not
    registered one yet. Own site first — it is the one picked most often. */
export function knownInstallations(): Installation[] {
  const used = read().map((w) => ({ id: w.installationId, name: w.installationName, self: Boolean(w.selfSupplied) }));
  return pickerOptions(used);
}

/* ── Grouping for the dashboard ─────────────────────────────────
   Installation first, then product, because that is how an exporter thinks
   about their own estate ("what is Plant A missing?") and how a verifier
   scopes an engagement. */
export type WorkspaceGroup = {
  installationId: string;
  installationName: string;
  workspaces: VerificationWorkspace[];
};

/* ── Supplier → installation → good ─────────────────────────────
   The estate as an exporter actually holds it in their head. A supplier is a
   company they chase; an installation is a plant that company runs; a good is
   what that plant makes. Grouping by installation alone flattened the first
   level away, so two plants belonging to one mill read as two unrelated sites
   and "where is G J Steel" had no single answer on the screen.

   `selfName` is passed in rather than read here so this stays a pure function
   — the exporter's own company name comes from the org profile, which is a
   client-only store. */
export type SupplierGroup = {
  supplierId: string;
  supplierName: string;
  /** the exporter's own company, rather than a third party */
  self: boolean;
  installations: WorkspaceGroup[];
};

export const UNASSIGNED_SUPPLIER = "__unassigned";

export function groupBySupplier(workspaces: VerificationWorkspace[], selfName = "Your own site"): SupplierGroup[] {
  const groups = new Map<string, SupplierGroup>();

  for (const w of workspaces) {
    // A self-supplied workspace belongs to the exporter whether or not a
    // supplier record was ever attached — they are the supplier.
    const self = Boolean(w.selfSupplied);
    const id = self ? "__self" : w.supplierId || UNASSIGNED_SUPPLIER;
    const name = self ? selfName : w.supplierName || "Unassigned supplier";

    const g = groups.get(id) ?? { supplierId: id, supplierName: name, self, installations: [] };
    const inst =
      g.installations.find((i) => i.installationId === w.installationId) ??
      ({ installationId: w.installationId, installationName: w.installationName, workspaces: [] } as WorkspaceGroup);
    if (!g.installations.includes(inst)) g.installations.push(inst);
    inst.workspaces.push(w);
    groups.set(id, g);
  }

  return [...groups.values()]
    .map((g) => ({
      ...g,
      installations: g.installations
        .map((i) => ({ ...i, workspaces: i.workspaces.sort((a, b) => b.year - a.year || a.productName.localeCompare(b.productName)) }))
        .sort((a, b) => a.installationName.localeCompare(b.installationName)),
    }))
    // Own site first — it is the one most Thai CBAM exporters work on most —
    // then alphabetical, with the unassigned bucket last so it reads as a
    // loose end rather than as a supplier called "U".
    .sort(
      (a, b) =>
        Number(b.self) - Number(a.self) ||
        Number(a.supplierId === UNASSIGNED_SUPPLIER) - Number(b.supplierId === UNASSIGNED_SUPPLIER) ||
        a.supplierName.localeCompare(b.supplierName),
    );
}

export function groupByInstallation(workspaces: VerificationWorkspace[]): WorkspaceGroup[] {
  const groups = new Map<string, WorkspaceGroup>();
  for (const w of workspaces) {
    const g = groups.get(w.installationId) ?? {
      installationId: w.installationId,
      installationName: w.installationName,
      workspaces: [],
    };
    g.workspaces.push(w);
    groups.set(w.installationId, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, workspaces: g.workspaces.sort((a, b) => b.year - a.year || a.productName.localeCompare(b.productName)) }))
    .sort((a, b) => a.installationName.localeCompare(b.installationName));
}

/* ── Derived identity ───────────────────────────────────────────
   The engine's sector rule (INDIRECT_CHARGEABLE) keys off the aggregated
   goods category, which is derived from the CN code via the catalogue — never
   typed. §2.1 of the spec: "Aggregated goods category | derived | auto". */
export const workspaceProduct = (w: VerificationWorkspace): CatalogProduct | undefined => getCatalogProduct(w.productId);

export function goodsCategory(w: VerificationWorkspace): GoodsCategory {
  const product = workspaceProduct(w);
  // The catalogue only carries the two CBAM sectors this portal supports; the
  // cast is safe because ProductCategory is a subset of GoodsCategory, and an
  // unknown product falls back to the portal's primary sector rather than to
  // a category whose Annex II treatment would be wrong.
  return (product?.category ?? "Iron & Steel") as GoodsCategory;
}

/** A complex good has precursors in CBAM scope; a primary input does not, and
    its Precursors tab is `not_applicable` rather than incomplete. */
export function isComplexWorkspace(w: VerificationWorkspace): boolean {
  const product = workspaceProduct(w);
  if (!product) return true;
  // Delegates to lib/config.ts's isComplexGood rather than re-declaring the
  // primary-groups set here — two copies of the same literal array is how
  // the two definitions drift apart unnoticed.
  return isComplexGood(product);
}

/** "Steel billet · Plant A · 2026" — the workspace's name everywhere. */
export const workspaceTitle = (w: VerificationWorkspace): string => `${w.productName} · ${w.installationName} · ${w.year}`;

/** The twelve months of the reporting year, as 'YYYY-MM'.

    Jan–Dec, deliberately: §6 of the spec flags fiscal-year reporters as a
    known limitation rather than a supported case. A workspace's period is
    always the calendar year, so this reads from `year` and cannot drift from
    periodStart/periodEnd. */
export function monthsOf(w: Pick<VerificationWorkspace, "year">): string[] {
  return Array.from({ length: 12 }, (_, i) => `${w.year}-${String(i + 1).padStart(2, "0")}`);
}

/** 'Mar 2026' — the label used on every month row, chip and deep link. */
export function monthName(ym: string): string {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return `${date.toLocaleString("en-GB", { month: "short" })} ${y}`;
}

/** 'March 2026' — the long form, for prose like "March 2026 not submitted". */
export function monthNameLong(ym: string): string {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return `${date.toLocaleString("en-GB", { month: "long" })} ${y}`;
}

/** Does an ISO date fall inside the workspace's reporting period? */
export const withinWorkspacePeriod = (isoDate: string, w: Pick<VerificationWorkspace, "periodStart" | "periodEnd">): boolean =>
  isoDate >= w.periodStart && isoDate <= w.periodEnd;

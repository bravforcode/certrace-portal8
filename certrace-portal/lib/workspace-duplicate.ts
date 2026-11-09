/* ════════════════════════════════════════════════════════════
   DUPLICATING A PRODUCT REPORT

   The next year's report for the same good at the same site is the same decisions
   again — the CN code, the route, the supplier, the schedule, and most of the
   methodology. Duplicating carries those across, and the reader chooses, part by part,
   what comes across and what starts new.

   THREE KINDS OF PART:

     always      the good, its CN code, the route, the country and who makes it. They ARE the
                 report; a copy without them is not a copy.
     choice      the schedule, each part of the monitoring plan, the chain of precursors and the
                 carbon price claim. Brought across as a DRAFT the reader edits, never as an
                 answer given.
     never       monthly figures, documents, sign-offs and finished monitoring-plan versions.
                 They belong to the year they describe, and a copy that arrived with last year's
                 readings in it would be a year of numbers filed under the wrong date.

   What comes across from the chain is its SHAPE — who supplies what, where, under which CN
   code, and who to ask — and none of what they said: no figures, no verification reports, no
   links already sent. Those are asked again, for the year.

   Duplicating WARNS about a report that is already there and never blocks it — the same rule as
   creating one (lib/workspace.ts, `existingForTriple`): re-baselining mid-year is a real reason
   to have two.
   ════════════════════════════════════════════════════════════ */

import { emptyCarbonPrice, getCarbonPrice, saveCarbonPrice } from "./carbon-price";
import { emptySupplier, listSuppliers, saveSupplier, uid as supplierUid } from "./precursor-suppliers";
import { createWorkspace, type VerificationWorkspace } from "./workspace";
import { loadDraft, saveDraft, type WorkspaceMmdContent } from "./workspace-mmd";

/** The parts the reader chooses between. Order is the order the dialog shows them in. */
export type CarrySection =
  | "schedule"
  | "mmd_boundary"
  | "mmd_sources"
  | "mmd_instruments"
  | "mmd_gaps"
  | "mmd_quality"
  | "mmd_diagram"
  | "mmd_sector"
  | "mmd_sampling"
  | "mmd_control"
  | "precursors"
  | "carbon_price";

export const CARRY_SECTIONS: CarrySection[] = ["schedule", "mmd_boundary", "mmd_sources", "mmd_instruments", "mmd_gaps", "mmd_quality", "mmd_diagram", "mmd_sector", "mmd_sampling", "mmd_control", "precursors", "carbon_price"];

export type Carry = Record<CarrySection, boolean>;

/** The parts that describe the PLANT rather than the organisation: a copy for a different site must not quietly bring the old site's fuels, meters or suppliers. */
export const SITE_BOUND: CarrySection[] = ["mmd_boundary", "mmd_sources", "mmd_instruments", "mmd_diagram", "mmd_sector", "precursors"];

/** What is switched on when the dialog opens. Data gaps start off — they are last year's estimates for last year's missing readings. */
export function defaultCarry(sameSite: boolean): Carry {
  const carry = Object.fromEntries(CARRY_SECTIONS.map((s) => [s, true])) as Carry;
  carry.mmd_gaps = false;
  if (!sameSite) for (const s of SITE_BOUND) carry[s] = false;
  return carry;
}

export const setAll = (value: boolean, sections: CarrySection[] = CARRY_SECTIONS): Carry => Object.fromEntries(CARRY_SECTIONS.map((s) => [s, sections.includes(s) ? value : false])) as Carry;

/* ── What there is to bring ──────────────────────────────────── */
export type CarryPreview = {
  /** rows in each list, so a part with nothing in it can say so */
  instruments: number;
  gaps: number;
  exclusions: number;
  precursors: number;
  hasDiagram: boolean;
  carbonPrice: boolean;
};

export function carryPreview(source: Pick<VerificationWorkspace, "id" | "periodStart" | "periodEnd">): CarryPreview {
  const draft = loadDraft(source.id, source.periodStart, source.periodEnd);
  return {
    instruments: draft.fuelInstruments.length + draft.electricityInstruments.length,
    gaps: draft.dataGaps.length,
    exclusions: draft.exclusions.length,
    precursors: listSuppliers(source.id).length,
    hasDiagram: Boolean(draft.diagramFileName),
    carbonPrice: getCarbonPrice(source.id).recorded,
  };
}

/* ── The monitoring plan, part by part ─────────────────────────── */
const MMD_PARTS: Record<Extract<CarrySection, `mmd_${string}`>, (src: WorkspaceMmdContent) => Partial<WorkspaceMmdContent>> = {
  mmd_boundary: (m) => ({ boundaryDescription: m.boundaryDescription, processesIncluded: m.processesIncluded, exclusions: m.exclusions }),
  mmd_sources: (m) => ({
    directMethod: m.directMethod,
    fuelTypeIds: m.fuelTypeIds,
    fuelTypesOther: m.fuelTypesOther,
    electricitySupply: m.electricitySupply,
    electricitySupplyOther: m.electricitySupplyOther,
    electricityMeteringPoint: m.electricityMeteringPoint,
    ownGenerationFuelDeclared: m.ownGenerationFuelDeclared,
  }),
  mmd_instruments: (m) => ({ fuelInstruments: m.fuelInstruments, electricityInstruments: m.electricityInstruments }),
  mmd_gaps: (m) => ({ dataGaps: m.dataGaps }),
  mmd_quality: (m) => ({ qualityAssurance: m.qualityAssurance, reviewerName: m.reviewerName, reviewFrequency: m.reviewFrequency }),
  mmd_diagram: (m) => ({ diagramFileName: m.diagramFileName, diagramDataUrl: m.diagramDataUrl, diagramCovers: m.diagramCovers }),
  mmd_sector: (m) => ({ sectorParameters: m.sectorParameters, ...(m.pfcMethodology ? { pfcMethodology: m.pfcMethodology } : {}) }),
  mmd_sampling: (m) => ({ samplingPlan: m.samplingPlan }),
  mmd_control: (m) => ({ controlSystem: m.controlSystem }),
};

function carryMonitoringPlan(source: VerificationWorkspace, copy: VerificationWorkspace, carry: Carry): void {
  const chosen = (Object.keys(MMD_PARTS) as (keyof typeof MMD_PARTS)[]).filter((k) => carry[k]);
  if (chosen.length === 0) return;
  // The draft, never a finalised version: a stamped version says what was true of the year it was signed for.
  const from = loadDraft(source.id, source.periodStart, source.periodEnd);
  let next = loadDraft(copy.id, copy.periodStart, copy.periodEnd);
  for (const k of chosen) next = { ...next, ...MMD_PARTS[k](from) };
  saveDraft(copy.id, { ...next, periodStart: copy.periodStart, periodEnd: copy.periodEnd });
}

/* ── The chain: its shape, not its answers ─────────────────────── */
function carryPrecursors(source: VerificationWorkspace, copy: VerificationWorkspace): void {
  const rows = listSuppliers(source.id);
  const fresh = new Map(rows.map((r) => [r.id, supplierUid()]));
  for (const r of rows) {
    saveSupplier({
      ...emptySupplier(copy.id, r.parentId ? (fresh.get(r.parentId) ?? null) : null),
      id: fresh.get(r.id) as string,
      // who supplies what, and where
      name: r.name,
      installationName: r.installationName,
      country: r.country,
      precursorName: r.precursorName,
      cnCode: r.cnCode,
      catalogProductId: r.catalogProductId,
      productionRoute: r.productionRoute,
      isScrap: r.isScrap,
      origin: r.origin,
      sourceProcessId: r.sourceProcessId,
      originUnknown: r.originUnknown,
      // which installation it is, so the same producer is recognised next year
      latitude: r.latitude,
      longitude: r.longitude,
      installationUniqueId: r.installationUniqueId,
      unlocode: r.unlocode,
      fullAddress: r.fullAddress,
      // and who to ask
      supplierCompanyId: r.supplierCompanyId,
      contactName: r.contactName,
      contactEmail: r.contactEmail,
      contactPhone: r.contactPhone,
      addedBy: r.addedBy,
    });
  }
}

/* ── The carbon price claim: what it is, not what was paid ────── */
function carryCarbonPrice(source: VerificationWorkspace, copy: VerificationWorkspace): void {
  const was = getCarbonPrice(source.id);
  if (!was.recorded) return;
  saveCarbonPrice({
    ...emptyCarbonPrice(copy.id),
    instrument: was.instrument,
    currency: was.currency,
    amountPerTonne: was.amountPerTonne,
    legalBasis: was.legalBasis,
    certifiedBy: was.certifiedBy,
    shareOfEmissionsCovered: was.shareOfEmissionsCovered,
    // the receipt and any rebate are facts of the year they were paid in
  });
}

export type DuplicateOptions = {
  year: number;
  /** a different site of the same supplier — the same site when left out */
  installationId?: string;
  installationName?: string;
  /** which parts come across; a part left out starts new */
  carry: Carry;
};

export function duplicateWorkspace(source: VerificationWorkspace, opts: DuplicateOptions): VerificationWorkspace {
  const copy = createWorkspace({
    installationId: opts.installationId ?? source.installationId,
    installationName: opts.installationName ?? source.installationName,
    productId: source.productId,
    productionRoute: source.productionRoute,
    country: source.country,
    year: opts.year,
    selfSupplied: source.selfSupplied,
    supplierId: source.supplierId,
    supplierName: source.supplierName,
    // left out, the schedule is the default one — createWorkspace fills it in
    schedule: opts.carry.schedule ? source.schedule : undefined,
  });
  carryMonitoringPlan(source, copy, opts.carry);
  if (opts.carry.precursors) carryPrecursors(source, copy);
  if (opts.carry.carbon_price) carryCarbonPrice(source, copy);
  return copy;
}

/** The year a copy most likely wants: the one after the report's own, or the first one after it with no report for this good at this site. */
export function suggestedYear(source: Pick<VerificationWorkspace, "year" | "installationId" | "productId">, all: Pick<VerificationWorkspace, "year" | "installationId" | "productId" | "archivedAt">[]): number {
  const taken = new Set(all.filter((w) => !w.archivedAt && w.installationId === source.installationId && w.productId === source.productId).map((w) => w.year));
  let y = source.year + 1;
  while (taken.has(y) && y < source.year + 10) y += 1;
  return y;
}

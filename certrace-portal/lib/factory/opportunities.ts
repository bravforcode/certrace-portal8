import { defaultFor } from "../cbam/precursor-basis";
import type { EmissionEstimate } from "../workbook/estimate";
import { buildSheets } from "../workspace-sheets";
import type { FactoryGap } from "./profile";

export type OpportunityStatus = "open" | "in-progress" | "done" | "dismissed";
export type Opportunity = {
  id: string;
  key: string;
  installationId: string;
  source: "data-gap" | "what-if";
  title: string;
  detail: string;
  impactEur: number | null;
  impactT: number | null;
  assignee: string;
  status: OpportunityStatus;
  due: string;
  href: string;
  createdAt: string;
  updatedAt: string;
};
export type Derived = Omit<Opportunity, "id" | "assignee" | "status" | "due" | "createdAt" | "updatedAt">;

export const OPPORTUNITY_LIMIT = 500;
const ACTIVE: OpportunityStatus[] = ["open", "in-progress"];
const SHEET_NAMES = new Map(buildSheets([]).map((s) => [s.id, s.name]));

/** The workspace display name of a sheet, or its id when it is not a workspace sheet. */
export const sheetTitle = (id: string) => SHEET_NAMES.get(id) ?? id;

/** Cards derived from one installation's workbook and factory profile.
    Impact is the mark-up part of each default (its money is lost to the mark-up), share of the exported tonnes. */
export function gapOpportunities(
  installationId: string,
  e: EmissionEstimate,
  ctx: {
    year: number;
    exportedT: number;
    priceEur: number | null;
    factoryGaps: FactoryGap[];
    emptySheets: string[];
  },
): Derived[] {
  const share = e.productionT > 0 ? Math.min(ctx.exportedT, e.productionT) / e.productionT : 0;
  const out: Derived[] = e.precursors.map((p) => {
    const markup = defaultFor(p.cn, undefined, ctx.year)?.markup ?? 0;
    const impactT = markup > 0 ? p.defaultSee * (markup / (1 + markup)) * p.tonnes * share : null;
    return {
      key: `precursor:${installationId}:${p.key}`,
      installationId,
      source: "data-gap",
      title: `Get actual emissions for ${p.item || p.cn} (CN ${p.cn})`,
      detail:
        impactT === null
          ? "Saving depends on the supplier's value."
          : "Default values include a mark-up. The supplier's actual value removes at least that part.",
      impactT,
      impactEur: impactT === null || ctx.priceEur === null ? null : impactT * ctx.priceEur,
      href: `/smart-links?installation=${encodeURIComponent(installationId)}`,
    };
  });
  for (const g of ctx.factoryGaps)
    out.push({
      key: `factory:${installationId}:${g.key}`,
      installationId,
      source: "data-gap",
      title: g.message,
      detail: "Factory profile",
      impactEur: null,
      impactT: null,
      href: `/workspace?installation=${encodeURIComponent(installationId)}&view=factory`,
    });
  for (const id of ctx.emptySheets)
    out.push({
      key: `sheet:${installationId}:${id}`,
      installationId,
      source: "data-gap",
      title: `Fill in the ${sheetTitle(id)} sheet`,
      detail: "Workspace",
      impactEur: null,
      impactT: null,
      href: `/workspace?installation=${encodeURIComponent(installationId)}&sheet=${id}`,
    });
  return out;
}

/** Fresh derived cards carry over the stored assignment and status. A stored data-gap card whose gap
    is gone closes, but only for installations this run derived. What-if cards are kept as stored. */
export function mergeOpportunities(derived: Derived[], stored: Opportunity[], now: string): Opportunity[] {
  const byKey = new Map(stored.map((o) => [o.key, o]));
  const fresh = new Set(derived.map((d) => d.key));
  const derivedInstallations = new Set(derived.map((d) => d.installationId));
  const out: Opportunity[] = derived.map((d) => {
    const old = byKey.get(d.key);
    return old
      ? { ...old, ...d }
      : { ...d, id: crypto.randomUUID(), assignee: "", status: "open", due: "", createdAt: now, updatedAt: now };
  });
  for (const o of stored) {
    if (fresh.has(o.key)) continue;
    const closes = o.source === "data-gap" && derivedInstallations.has(o.installationId) && ACTIVE.includes(o.status);
    out.push(closes ? { ...o, status: "done", updatedAt: now } : o);
  }
  return out.sort(
    (a, b) =>
      Number(!ACTIVE.includes(a.status)) - Number(!ACTIVE.includes(b.status)) ||
      (b.impactEur ?? -Infinity) - (a.impactEur ?? -Infinity) ||
      a.title.localeCompare(b.title),
  );
}

export function summarize(list: Opportunity[]) {
  const open = list.filter((o) => ACTIVE.includes(o.status));
  return {
    open: list.filter((o) => o.status === "open").length,
    inProgress: list.filter((o) => o.status === "in-progress").length,
    done: list.filter((o) => o.status === "done").length,
    impactEur: open.reduce((a, o) => a + (o.impactEur ?? 0), 0),
    impactT: open.reduce((a, o) => a + (o.impactT ?? 0), 0),
  };
}

/** At most OPPORTUNITY_LIMIT cards. The oldest closed ones (done, then dismissed) go first. */
export function capOpportunities(list: Opportunity[]): Opportunity[] {
  if (list.length <= OPPORTUNITY_LIMIT) return list;
  const excess = list.length - OPPORTUNITY_LIMIT;
  const closed = list
    .filter((o) => o.status === "done" || o.status === "dismissed")
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    .slice(0, excess);
  const drop = new Set(closed.map((o) => o.id));
  const kept = list.filter((o) => !drop.has(o.id));
  return kept.slice(0, OPPORTUNITY_LIMIT);
}

import { defaultFor } from "../cbam/precursor-basis";
import type { SeatRole } from "../data";
import type { EmissionEstimate } from "../workbook/estimate";
import { buildSheets } from "../workspace-sheets";
import { type FactoryGap, type FactoryProfile } from "./profile";

export type OpportunityStatus = "open" | "in-progress" | "done" | "dismissed";
/** A translatable sentence: `key` is the Thai-keyed template, `params` fill its {placeholders}. */
export type TextRef = { key: string; params?: Record<string, string> };
export type Opportunity = {
  id: string;
  key: string;
  installationId: string;
  year: number;
  source: "data-gap" | "what-if";
  title: string;
  text?: TextRef;
  detail: string;
  impactEur: number | null;
  impactT: number | null;
  assignee: string;
  status: OpportunityStatus;
  due: string;
  href: string;
  /** Set when this run closed the card because its gap was filled. Reopened if the gap returns. */
  closedBy?: "auto";
  createdAt: string;
  updatedAt: string;
};
export type Derived = Omit<Opportunity, "id" | "assignee" | "status" | "due" | "closedBy" | "createdAt" | "updatedAt">;
/** Which installations were read in full this run. Only those may close their cards. */
export type Scope = { year: number; loaded: Set<string>; factoryLoaded: Set<string> };

export const OPPORTUNITY_LIMIT = 500;
const ACTIVE: OpportunityStatus[] = ["open", "in-progress"];
const STATUSES: string[] = ["open", "in-progress", "done", "dismissed"];
const SOURCES: string[] = ["data-gap", "what-if"];
const SHEET_NAMES = new Map(buildSheets([]).map((s) => [s.id, s.name]));

/** The workspace display name of a sheet, or its id when it is not a workspace sheet. */
export const sheetTitle = (id: string) => SHEET_NAMES.get(id) ?? id;

/** The translatable form of a factory gap. Falls back to the English message when no template fits. */
export function factoryGapText(g: FactoryGap, p: FactoryProfile): TextRef {
  if (g.refId) {
    const proc = p.processes.find((x) => x.id === g.refId);
    if (proc && g.key.endsWith(":no-source")) return { key: "{name} has no emission source.", params: { name: proc.name } };
    const src = p.sources.find((x) => x.id === g.refId);
    if (src && g.key.endsWith(":no-meter")) return { key: "{name} has no meter or data source.", params: { name: src.name } };
    const m = p.meters.find((x) => x.id === g.refId);
    if (m && g.key.endsWith(":owner")) return { key: "Who reads {name}?", params: { name: m.name } };
    if (m && g.key.endsWith(":calibration"))
      return { key: "{name} calibration expired on {date}.", params: { name: m.name, date: m.calibratedUntil } };
  }
  return { key: g.message };
}

/** Cards derived from one installation's workbook and factory profile.
    Impact is the mark-up part of each default, scaled to the exported share of production.
    Impact is null when production is unknown or zero, because a share cannot be taken. */
export function gapOpportunities(
  installationId: string,
  e: EmissionEstimate,
  ctx: {
    year: number;
    exportedT: number;
    priceEur: number | null;
    profile: FactoryProfile;
    factoryGaps: FactoryGap[];
    emptySheets: string[];
  },
): Derived[] {
  const share = e.productionT > 0 ? Math.min(ctx.exportedT, e.productionT) / e.productionT : 0;
  const seen = new Map<string, number>();
  const out: Derived[] = e.precursors.map((p) => {
    const markup = defaultFor(p.cn, undefined, ctx.year)?.markup ?? 0;
    const impactT = e.productionT > 0 && markup > 0 ? p.defaultSee * (markup / (1 + markup)) * p.tonnes * share : null;
    // Same material on two rows: the second gets "#2". Keyed by name and CN, not by row, so deleting a row above keeps the rest.
    const base = `precursor:${installationId}:${ctx.year}:${p.item.trim().toLowerCase()}|${p.cn}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const name = p.item || p.cn;
    return {
      key: n === 1 ? base : `${base}#${n}`,
      installationId,
      year: ctx.year,
      source: "data-gap",
      title: `Get actual emissions for ${name} (CN ${p.cn})`,
      text: { key: "Get actual emissions for {item} (CN {cn})", params: { item: name, cn: p.cn } },
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
      year: ctx.year,
      source: "data-gap",
      title: g.message,
      text: factoryGapText(g, ctx.profile),
      detail: "Factory profile",
      impactEur: null,
      impactT: null,
      href: `/workspace?installation=${encodeURIComponent(installationId)}&view=factory`,
    });
  for (const id of ctx.emptySheets)
    out.push({
      key: `sheet:${installationId}:${ctx.year}:${id}`,
      installationId,
      year: ctx.year,
      source: "data-gap",
      title: `Fill in the ${sheetTitle(id)} sheet`,
      text: { key: "Fill in the {name} sheet", params: { name: sheetTitle(id) } },
      detail: "Workspace",
      impactEur: null,
      impactT: null,
      href: `/workspace?installation=${encodeURIComponent(installationId)}&sheet=${id}`,
    });
  return out;
}

/** Fresh derived cards carry over the stored assignment and status. A stored data-gap card whose gap is gone
    closes (closedBy "auto") only when its installation was read in full this year. An auto-closed card reopens
    when its gap returns. A card the user closed stays closed. What-if cards are kept as stored. */
export function mergeOpportunities(derived: Derived[], stored: Opportunity[], now: string, scope: Scope): Opportunity[] {
  const byKey = new Map(stored.map((o) => [o.key, o]));
  const fresh = new Set(derived.map((d) => d.key));
  const out: Opportunity[] = derived.map((d) => {
    const old = byKey.get(d.key);
    if (!old) return { ...d, id: crypto.randomUUID(), assignee: "", status: "open", due: "", createdAt: now, updatedAt: now };
    if (old.closedBy === "auto" && old.status === "done")
      return { ...old, ...d, closedBy: undefined, status: "open", updatedAt: now };
    return { ...old, ...d };
  });
  for (const o of stored) {
    if (fresh.has(o.key)) continue;
    const read = (o.key.startsWith("factory:") ? scope.factoryLoaded : scope.loaded).has(o.installationId);
    const closes = o.source === "data-gap" && o.year === scope.year && read && ACTIVE.includes(o.status);
    out.push(closes ? { ...o, status: "done", closedBy: "auto", updatedAt: now } : o);
  }
  return out.sort(
    (a, b) =>
      Number(!ACTIVE.includes(a.status)) - Number(!ACTIVE.includes(b.status)) ||
      (b.impactEur ?? -1) - (a.impactEur ?? -1) ||
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

/** At most OPPORTUNITY_LIMIT cards. The oldest stored closed cards go first. Stored active cards are never dropped.
    New derived cards that do not fit are skipped and counted, so the caller can report them. */
export function capOpportunities(list: Opportunity[], storedIds: Set<string>): { list: Opportunity[]; skipped: number } {
  if (list.length <= OPPORTUNITY_LIMIT) return { list, skipped: 0 };
  let excess = list.length - OPPORTUNITY_LIMIT;
  const closed = list
    .filter((o) => !ACTIVE.includes(o.status) && storedIds.has(o.id))
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    .slice(0, excess);
  const drop = new Set(closed.map((o) => o.id));
  excess -= drop.size;
  const kept = list.filter((o) => !drop.has(o.id));
  let skipped = 0;
  for (let i = kept.length - 1; i >= 0 && excess > 0; i--) {
    if (storedIds.has(kept[i]!.id)) continue;
    kept.splice(i, 1);
    excess--;
    skipped++;
  }
  return { list: kept, skipped };
}

/** A stored card read from browser storage must have the shape of an Opportunity. */
export function isOpportunity(v: unknown): v is Opportunity {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  const str = (k: string) => typeof o[k] === "string";
  const numOrNull = (k: string) => o[k] === null || (typeof o[k] === "number" && Number.isFinite(o[k]));
  return (
    str("id") && str("key") && str("installationId") && Number.isInteger(o.year) &&
    SOURCES.includes(o.source as string) && str("title") && str("detail") && numOrNull("impactEur") &&
    numOrNull("impactT") && str("assignee") && STATUSES.includes(o.status as string) && str("due") &&
    str("href") && str("createdAt") && str("updatedAt") &&
    (o.closedBy === undefined || o.closedBy === "auto") &&
    (o.text === undefined || (typeof o.text === "object" && o.text !== null && typeof (o.text as { key?: unknown }).key === "string"))
  );
}

/** Cards are read-only when the account is locked or the seat is a verifier or legal seat. */
export function opportunityEditable(locked: boolean, seat: SeatRole | null): boolean {
  return !locked && seat !== "verifier" && seat !== "legal";
}

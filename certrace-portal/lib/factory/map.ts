import { buildFlow, namedStep, stepNamesOf, type FlowEdge, type FlowNode } from "../workbook/flow";
import { missingCells, startedRow } from "../workbook/status";
import { stepKey, type StepBalance } from "../workbook/balance";
import type { EmissionEstimate } from "../workbook/estimate";
import type { Sheet } from "../workspace-sheets";

export type MapStatus = "ok" | "warn" | "err" | "muted";
/** A gap is an i18n key with its placeholders, the same shape as estimate.ts notes. */
export type MapGap = { key: string; params?: Record<string, string> };
/** A node badge is an i18n key with its placeholders, so the page translates it. */
export type MapBadge = { key: string; params?: Record<string, string> };
export type MapNode = FlowNode & { status: MapStatus; tCO2e: number | null; gaps: MapGap[] };

/* Status colours are the design tokens (globals.css), not raw hex. */
export const MAP_TONE: Record<MapStatus, string> = {
  ok: "var(--color-ok-text)",
  warn: "var(--color-warn-text)",
  err: "var(--color-err-text)",
  muted: "var(--flow-edge)",
};

const RANK: MapStatus[] = ["muted", "ok", "warn", "err"];
const worst = (a: MapStatus | undefined, b: MapStatus) => (a && RANK.indexOf(a) > RANK.indexOf(b) ? a : b);
const itemKey = (s: string | undefined) => (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
/** An item's status is scoped to its sheet, its step and its name, so the same name in two steps stays apart. */
const slot = (sheet: string, step: string, item: string) => `${sheet}|${step}|${item}`;

type StepRows = { gaps: MapGap[]; err: boolean; review: boolean };

export function buildFactoryMap(sheets: Sheet[], estimate: EmissionEstimate, balance: StepBalance[]) {
  const flow = buildFlow(sheets);
  const names = stepNamesOf(sheets);
  const lastStep = names[names.length - 1] ?? "";
  // A row lands on the step it names, exactly as buildFlow places it; "" is Unassigned.
  // An output row with no known step lands on the last step, as buildFlow does.
  const byStep = new Map<string, StepRows>();
  const itemStatus = new Map<string, MapStatus>();

  for (const id of ["materials", "energy", "output", "products"]) {
    const sheet = sheets.find((x) => x.id === id);
    if (!sheet) continue;
    const missing = new Map(missingCells(sheet).map((m) => [m.row, m.cols]));
    sheet.rows.forEach((r, i) => {
      if (!startedRow(r)) return;
      const cols = missing.get(i) ?? [];
      const err = cols.length > 0 || r.status === "missing";
      const status: MapStatus = err ? "err" : r.status === "review" ? "warn" : "ok";

      if (id === "products") {
        const item = itemKey(r.cells.item) || itemKey(r.cells.cn);
        itemStatus.set(slot(id, "", item), worst(itemStatus.get(slot(id, "", item)), status));
        return;
      }
      const named = namedStep(r.cells.step, names);
      const landed = named ?? (id === "output" ? lastStep : "");
      const item = itemKey(r.cells.item);
      itemStatus.set(slot(id, landed, item), worst(itemStatus.get(slot(id, landed, item)), status));

      const entry = byStep.get(landed) ?? { gaps: [], err: false, review: false };
      const where = { sheet: sheet.name, row: String(i + 1) };
      if (cols.length)
        entry.gaps.push({
          key: "{sheet} row {row}: {cols} missing",
          params: { ...where, cols: cols.map((c) => sheet.cols.find((x) => x.key === c)?.label ?? c).join(", ") },
        });
      else if (r.status === "missing") entry.gaps.push({ key: "{sheet} row {row} is marked missing", params: where });
      entry.err ||= err;
      entry.review ||= r.status === "review";
      byStep.set(landed, entry);
    });
  }

  const balanceOf = new Map(balance.map((b) => [stepKey(b.step), b]));
  const tone: Record<string, string> = {};
  const badge: Record<string, MapBadge> = {};
  const nodes: MapNode[] = flow.nodes.map((n) => {
    let status: MapStatus;
    let tCO2e: number | null = null;
    const gaps: MapGap[] = [];
    if (n.kind === "step") {
      const rows = byStep.get(n.label);
      const k = stepKey(n.label);
      const b = balanceOf.get(k);
      const e = estimate.byStep[k];
      tCO2e = e ? e.directT + e.indirectT + e.precursorT : null;
      if (rows) gaps.push(...rows.gaps);
      if (b && !b.ok && b.diffPct !== null)
        gaps.push({ key: "Inputs and outputs differ by {pct} %", params: { pct: String(Math.round(Math.abs(b.diffPct) * 100)) } });
      status = !rows ? "muted" : rows.err ? "err" : gaps.length || rows.review ? "warn" : "ok";
      if (gaps.length && tCO2e !== null)
        badge[n.id] = { key: "{n} gaps · {t} t CO₂e", params: { n: String(gaps.length), t: tCO2e.toFixed(1) } };
      else if (gaps.length) badge[n.id] = { key: "{n} gaps", params: { n: String(gaps.length) } };
      else if (tCO2e !== null) badge[n.id] = { key: "{t} t CO₂e", params: { t: tCO2e.toFixed(1) } };
    } else {
      const sheet = n.kind === "material" ? "materials" : n.kind === "product" ? "products" : n.kind;
      status = itemStatus.get(slot(sheet, n.step ?? "", itemKey(n.label))) ?? "muted";
    }
    tone[n.id] = MAP_TONE[status];
    return { ...n, status, tCO2e, gaps };
  });
  return { nodes, edges: flow.edges as FlowEdge[], width: flow.width, height: flow.height, tone, badge };
}

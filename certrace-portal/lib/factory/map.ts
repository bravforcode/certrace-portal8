import { buildFlow, type FlowEdge, type FlowNode } from "../workbook/flow";
import { missingCells } from "../workbook/status";
import { stepKey, type StepBalance } from "../workbook/balance";
import type { EmissionEstimate } from "../workbook/estimate";
import type { Sheet } from "../workspace-sheets";

export type MapStatus = "ok" | "warn" | "err" | "muted";
/** A gap is an i18n key with its placeholders, the same shape as estimate.ts notes. */
export type MapGap = { key: string; params?: Record<string, string> };
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

type StepRows = { gaps: MapGap[]; err: boolean; review: boolean };

export function buildFactoryMap(sheets: Sheet[], estimate: EmissionEstimate, balance: StepBalance[]) {
  const flow = buildFlow(sheets);
  const byStep = new Map<string, StepRows>();
  const itemStatus = new Map<string, MapStatus>();

  for (const id of ["materials", "energy", "output", "products"]) {
    const sheet = sheets.find((x) => x.id === id);
    if (!sheet) continue;
    const missing = new Map(missingCells(sheet).map((m) => [m.row, m.cols]));
    sheet.rows.forEach((r, i) => {
      const cols = missing.get(i) ?? [];
      const err = cols.length > 0 || r.status === "missing";
      const status: MapStatus = err ? "err" : r.status === "review" ? "warn" : "ok";
      const item = id === "products" ? itemKey(r.cells.item) || itemKey(r.cells.cn) : itemKey(r.cells.item);
      itemStatus.set(`${id}:${item}`, worst(itemStatus.get(`${id}:${item}`), status));
      if (id === "products") return;

      const k = stepKey(r.cells.step);
      const entry = byStep.get(k) ?? { gaps: [], err: false, review: false };
      const where = { sheet: sheet.name, row: String(i + 1) };
      if (cols.length)
        entry.gaps.push({
          key: "{sheet} row {row}: {cols} missing",
          params: { ...where, cols: cols.map((c) => sheet.cols.find((x) => x.key === c)?.label ?? c).join(", ") },
        });
      else if (r.status === "missing") entry.gaps.push({ key: "{sheet} row {row} is marked missing", params: where });
      entry.err ||= err;
      entry.review ||= r.status === "review";
      byStep.set(k, entry);
    });
  }

  const balanceOf = new Map(balance.map((b) => [stepKey(b.step), b]));
  const tone: Record<string, string> = {};
  const badge: Record<string, string> = {};
  const nodes: MapNode[] = flow.nodes.map((n) => {
    let status: MapStatus;
    let tCO2e: number | null = null;
    const gaps: MapGap[] = [];
    if (n.kind === "step") {
      const k = stepKey(n.label);
      const rows = byStep.get(k);
      const b = balanceOf.get(k);
      const e = estimate.byStep[k];
      tCO2e = e ? e.directT + e.indirectT + e.precursorT : null;
      if (rows) gaps.push(...rows.gaps);
      if (b && !b.ok && b.diffPct !== null)
        gaps.push({ key: "Inputs and outputs differ by {pct} %", params: { pct: String(Math.round(Math.abs(b.diffPct) * 100)) } });
      status = !rows ? "muted" : rows.err ? "err" : gaps.length || rows.review ? "warn" : "ok";
      if (tCO2e !== null) badge[n.id] = `${tCO2e.toFixed(1)} t CO₂e`;
    } else {
      const sheet = n.kind === "material" ? "materials" : n.kind === "product" ? "products" : n.kind;
      status = itemStatus.get(`${sheet}:${itemKey(n.label)}`) ?? "muted";
    }
    tone[n.id] = MAP_TONE[status];
    return { ...n, status, tCO2e, gaps };
  });
  return { nodes, edges: flow.edges as FlowEdge[], width: flow.width, height: flow.height, tone, badge };
}

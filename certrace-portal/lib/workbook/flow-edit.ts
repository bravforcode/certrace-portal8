import { cellKey, rowsUsed } from "./cells";

export type CellPatch = Record<string, string | null>;
export type FlowAction =
  | { kind: "add-step"; name: string; what?: string }
  | { kind: "add-input"; sheet: "materials" | "energy"; step: string; item: string; qty?: string; unit?: string }
  | { kind: "add-output"; step: string; item: string; qty?: string; unit?: string }
  | { kind: "connect"; from: string; to: string; item?: string }
  | { kind: "disconnect"; from: string; to: string }
  | { kind: "rename-step"; from: string; to: string };

const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();
const same = (a: string | undefined, b: string | undefined) => norm(a) !== "" && norm(a) === norm(b);

// Every cell that names a step, by sheet and column.
const STEP_REFS: [string, string][] = [
  ["steps", "step"],
  ["materials", "step"],
  ["energy", "step"],
  ["output", "step"],
  ["flow", "from"],
  ["flow", "to"],
];

function column(cells: Record<string, string>, sheet: string, col: string) {
  const out: { row: number; value: string }[] = [];
  for (let row = 0; row < rowsUsed(cells, sheet); row++) {
    const value = cells[cellKey(sheet, row, col)];
    if (value?.trim()) out.push({ row, value });
  }
  return out;
}

export const stepNames = (cells: Record<string, string>) => column(cells, "steps", "step").map((c) => c.value.trim());

export function missingSteps(cells: Record<string, string>) {
  const known = new Set(stepNames(cells).map(norm));
  const seen = new Map<string, string>();
  for (const [sheet, col] of STEP_REFS.slice(1))
    for (const { value } of column(cells, sheet, col))
      if (!known.has(norm(value)) && !seen.has(norm(value))) seen.set(norm(value), value.trim());
  return [...seen.values()];
}

function row(sheet: string, index: number, values: Record<string, string | undefined>): CellPatch {
  const patch: CellPatch = {};
  for (const [col, v] of Object.entries(values)) if (v?.trim()) patch[cellKey(sheet, index, col)] = v.trim();
  return patch;
}

function requireStep(cells: Record<string, string>, step: string) {
  if (!stepNames(cells).some((s) => same(s, step))) throw new Error(`Add the step "${step.trim()}" first.`);
}
function refuseDuplicate(cells: Record<string, string>, name: string) {
  if (stepNames(cells).some((s) => same(s, name))) throw new Error(`A step named "${name.trim()}" already exists.`);
}

export function flowActionToCells(action: FlowAction, cells: Record<string, string>): CellPatch {
  switch (action.kind) {
    case "add-step":
      refuseDuplicate(cells, action.name);
      return row("steps", rowsUsed(cells, "steps"), { step: action.name, what: action.what });
    case "add-input":
    case "add-output": {
      requireStep(cells, action.step);
      const sheet = action.kind === "add-output" ? "output" : action.sheet;
      const { step, item, qty, unit } = action;
      return row(sheet, rowsUsed(cells, sheet), { step, item, qty, unit, status: "review" });
    }
    case "connect": {
      requireStep(cells, action.from);
      requireStep(cells, action.to);
      const edges = column(cells, "flow", "from").map(({ row: r, value }) => ({
        from: value,
        to: cells[cellKey("flow", r, "to")],
      }));
      if (edges.some((e) => same(e.from, action.from) && same(e.to, action.to))) return {};
      const patch: CellPatch = {};
      let next = rowsUsed(cells, "flow");
      if (!edges.length) {
        const order = stepNames(cells);
        for (let i = 0; i + 1 < order.length; i++)
          Object.assign(patch, row("flow", next++, { from: order[i], to: order[i + 1] }));
        if (edges.length === 0 && order.some((s, i) => same(s, action.from) && same(order[i + 1], action.to)))
          return patch;
      }
      return Object.assign(patch, row("flow", next, { from: action.from, to: action.to, item: action.item }));
    }
    case "disconnect": {
      const patch: CellPatch = {};
      for (const { row: r, value } of column(cells, "flow", "from"))
        if (same(value, action.from) && same(cells[cellKey("flow", r, "to")], action.to))
          for (const key of Object.keys(cells)) if (key.startsWith(`flow:${r}:`)) patch[key] = null;
      return patch;
    }
    case "rename-step": {
      requireStep(cells, action.from);
      if (!same(action.from, action.to)) refuseDuplicate(cells, action.to);
      const patch: CellPatch = {};
      for (const [sheet, col] of STEP_REFS)
        for (const { row: r, value } of column(cells, sheet, col))
          if (same(value, action.from)) patch[cellKey(sheet, r, col)] = action.to.trim();
      return patch;
    }
  }
}

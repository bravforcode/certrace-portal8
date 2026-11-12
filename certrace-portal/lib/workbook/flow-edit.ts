import { cellKey, rowsUsed } from "./cells";

export type CellPatch = Record<string, string | null>;
export type FlowAction =
  | { kind: "add-step"; name: string; what?: string }
  | {
      kind: "add-input";
      sheet: "materials" | "energy";
      step: string;
      item: string;
      qty?: string;
      unit?: string;
    }
  | {
      kind: "add-output";
      step: string;
      item: string;
      qty?: string;
      unit?: string;
    }
  | { kind: "connect"; from: string; to: string; item?: string }
  | { kind: "disconnect"; from: string; to: string }
  | { kind: "rename-step"; from: string; to: string };

/** Message templates for each error code. The UI runs them through t(template, params). */
export const FLOW_ERROR_TEMPLATE = {
  blank: "Fill in the required fields.",
  "missing-step": 'Add the step "{name}" first.',
  "duplicate-step": 'A step named "{name}" already exists.',
  "same-step": "Connect two different steps.",
} as const;

export type FlowErrorCode = keyof typeof FLOW_ERROR_TEMPLATE;

/** A refused edit. `params` fill the template; `message` is the English text for logs. */
export class FlowEditError extends Error {
  readonly code: FlowErrorCode;
  readonly params: Record<string, string>;
  constructor(code: FlowErrorCode, params: Record<string, string> = {}) {
    super(
      FLOW_ERROR_TEMPLATE[code].replace(
        /\{(\w+)\}/g,
        (_, k: string) => params[k] ?? "",
      ),
    );
    this.name = "FlowEditError";
    this.code = code;
    this.params = params;
  }
}

const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();
const same = (a: string | undefined, b: string | undefined) =>
  norm(a) !== "" && norm(a) === norm(b);

// Cells that name a step, outside the Steps sheet itself.
const REFERENCES: [string, string][] = [
  ["materials", "step"],
  ["energy", "step"],
  ["output", "step"],
  ["flow", "from"],
  ["flow", "to"],
];
const STEP_REFS: [string, string][] = [["steps", "step"], ...REFERENCES];

function column(cells: Record<string, string>, sheet: string, col: string) {
  const out: { row: number; value: string }[] = [];
  for (let row = 0; row < rowsUsed(cells, sheet); row++) {
    const value = cells[cellKey(sheet, row, col)];
    if (value?.trim()) out.push({ row, value });
  }
  return out;
}

export const stepNames = (cells: Record<string, string>) =>
  column(cells, "steps", "step").map((c) => c.value.trim());

/** Names used by rows (materials, energy, output, flow) that the Steps sheet does not have. */
export function missingSteps(cells: Record<string, string>) {
  const known = new Set(stepNames(cells).map(norm));
  const seen = new Map<string, string>();
  for (const [sheet, col] of REFERENCES)
    for (const { value } of column(cells, sheet, col))
      if (!known.has(norm(value)) && !seen.has(norm(value)))
        seen.set(norm(value), value.trim());
  return [...seen.values()];
}

/** Flow rows that name both ends: the explicit edges. Rows with one end only are not edges. */
export function explicitEdges(cells: Record<string, string>) {
  const out: { row: number; from: string; to: string; item?: string }[] = [];
  for (const { row, value } of column(cells, "flow", "from")) {
    const to = cells[cellKey("flow", row, "to")]?.trim();
    if (to)
      out.push({
        row,
        from: value.trim(),
        to,
        item: cells[cellKey("flow", row, "item")],
      });
  }
  return out;
}

function row(
  sheet: string,
  index: number,
  values: Record<string, string | undefined>,
): CellPatch {
  const patch: CellPatch = {};
  for (const [col, v] of Object.entries(values))
    if (v?.trim()) patch[cellKey(sheet, index, col)] = v.trim();
  return patch;
}

function need(v: string | undefined) {
  if (!v?.trim()) throw new FlowEditError("blank");
  return v.trim();
}
function requireStep(cells: Record<string, string>, step: string) {
  if (!stepNames(cells).some((s) => same(s, step)))
    throw new FlowEditError("missing-step", { name: step.trim() });
}
function refuseDuplicate(cells: Record<string, string>, name: string) {
  if (stepNames(cells).some((s) => same(s, name)))
    throw new FlowEditError("duplicate-step", { name: name.trim() });
}

export function flowActionToCells(
  action: FlowAction,
  cells: Record<string, string>,
): CellPatch {
  switch (action.kind) {
    case "add-step": {
      const name = need(action.name);
      refuseDuplicate(cells, name);
      return row("steps", rowsUsed(cells, "steps"), {
        step: name,
        what: action.what,
      });
    }
    case "add-input":
    case "add-output": {
      const step = need(action.step);
      const item = need(action.item);
      requireStep(cells, step);
      const sheet = action.kind === "add-output" ? "output" : action.sheet;
      return row(sheet, rowsUsed(cells, sheet), {
        step,
        item,
        qty: action.qty,
        unit: action.unit,
        status: "review",
      });
    }
    case "connect": {
      const from = need(action.from);
      const to = need(action.to);
      if (same(from, to)) throw new FlowEditError("same-step");
      requireStep(cells, from);
      requireStep(cells, to);
      const edges = explicitEdges(cells);
      if (edges.some((e) => same(e.from, from) && same(e.to, to))) return {};

      const patch: CellPatch = {};
      let next = rowsUsed(cells, "flow");
      if (edges.length === 0) {
        // The first explicit link replaces the implied chain (Task 15 rule), so write the chain out first.
        const order = stepNames(cells);
        const pairs = order
          .slice(0, -1)
          .map((s, i) => ({ from: s, to: order[i + 1] }));
        const base = next;
        pairs.forEach((p, i) => Object.assign(patch, row("flow", base + i, p)));
        const hit = pairs.findIndex(
          (p) => same(p.from, from) && same(p.to, to),
        );
        if (hit >= 0)
          return Object.assign(
            patch,
            row("flow", base + hit, { item: action.item }),
          );
        next = base + pairs.length;
      }
      return Object.assign(
        patch,
        row("flow", next, { from, to, item: action.item }),
      );
    }
    case "disconnect": {
      const patch: CellPatch = {};
      for (const { row: r, value } of column(cells, "flow", "from"))
        if (
          same(value, action.from) &&
          same(cells[cellKey("flow", r, "to")], action.to)
        )
          for (const key of Object.keys(cells))
            if (key.startsWith(`flow:${r}:`)) patch[key] = null;
      return patch;
    }
    case "rename-step": {
      const from = need(action.from);
      const to = need(action.to);
      requireStep(cells, from);
      if (!same(from, to)) refuseDuplicate(cells, to);
      const patch: CellPatch = {};
      for (const [sheet, col] of STEP_REFS)
        for (const { row: r, value } of column(cells, sheet, col))
          if (same(value, from)) patch[cellKey(sheet, r, col)] = to;
      return patch;
    }
  }
}

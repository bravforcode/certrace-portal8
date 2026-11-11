import type { Sheet } from "../workspace-sheets";

/* The production flow model: the workbook's rows as nodes and edges with positions.
   Holds no display text. A node the workbook left unnamed has an empty label and a
   `fallback` the component translates. */

export type FlowKind = "material" | "energy" | "step" | "output" | "product";
export type FlowFallback = "unassigned" | "material" | "energy" | "output" | "product";
export type FlowNode = {
  id: string;
  kind: FlowKind;
  label: string;
  fallback?: FlowFallback;
  detail?: string;
  x: number;
  y: number;
};
export type FlowEdge = { from: string; to: string; label?: string };

const COL = 220; // column pitch; a stack wraps into a new column every PER_COL items
const ROW = 64; // vertical gap between stacked items
const PER_COL = 12;
const PAD = 24;
const NODE_W = 168;
const NODE_H = 44;
export const FLOW_NODE = { w: NODE_W, h: NODE_H };
/** Reserved id: step ids are "step:<index>", so this cannot collide with a real step. */
export const UNASSIGNED_ID = "step:__unassigned";

type Cells = Record<string, string>;
const clean = (v: string | undefined) => (v ?? "").trim();

const rowsOf = (sheets: Sheet[], id: string): Cells[] =>
  (sheets.find((s) => s.id === id)?.rows ?? [])
    .map((r) => Object.fromEntries(Object.entries(r.cells).filter(([k]) => k !== "status").map(([k, v]) => [k, clean(v)])))
    .filter((c) => Object.values(c).some(Boolean));

const detail = (c: Cells) => [c.qty, c.unit].filter(Boolean).join(" ") || undefined;

const UNASSIGNED = "\u0000unassigned";

export function buildFlow(sheets: Sheet[]) {
  const stepNames = [...new Set(rowsOf(sheets, "steps").map((c) => c.step).filter(Boolean))];
  const materials = rowsOf(sheets, "materials");
  const energy = rowsOf(sheets, "energy");
  const outputs = rowsOf(sheets, "output");
  const products = rowsOf(sheets, "products");
  const flows = rowsOf(sheets, "flow");

  const known = new Set(stepNames);
  const named = (name: string) => (known.has(name) ? name : undefined);
  const lastStep = stepNames[stepNames.length - 1];
  // Where a material, energy row or Flow end lands; an output lands on the last step when unnamed.
  const keyOf = (c: Cells) => named(c.step ?? "") ?? UNASSIGNED;
  const outKey = (c: Cells) => named(c.step ?? "") ?? lastStep ?? UNASSIGNED;

  const needUnassigned =
    materials.some((c) => keyOf(c) === UNASSIGNED) ||
    energy.some((c) => keyOf(c) === UNASSIGNED) ||
    outputs.some((c) => outKey(c) === UNASSIGNED) ||
    flows.some((c) => (c.from && !named(c.from)) || (c.to && !named(c.to)));
  const order = needUnassigned ? [...stepNames, UNASSIGNED] : stepNames;

  const stepId = (key: string) => (key === UNASSIGNED ? UNASSIGNED_ID : `step:${stepNames.indexOf(key)}`);
  const stacks = order.map((key) => ({
    key,
    above: materials.filter((c) => keyOf(c) === key),
    below: energy.filter((c) => keyOf(c) === key),
  }));
  const rowsAbove = Math.min(PER_COL, Math.max(0, ...stacks.map((s) => s.above.length)));
  const baseY = PAD + rowsAbove * ROW;
  const subs = (n: number) => Math.max(1, Math.ceil(n / PER_COL));

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let x0 = PAD;
  stacks.forEach(({ key, above, below }, i) => {
    const sid = stepId(key);
    nodes.push(
      key === UNASSIGNED
        ? { id: sid, kind: "step", label: "", fallback: "unassigned", x: x0, y: baseY }
        : { id: sid, kind: "step", label: key, x: x0, y: baseY },
    );
    above.forEach((c, k) => {
      const id = `material:${i}:${k}`;
      const x = x0 + Math.floor(k / PER_COL) * COL;
      const y = baseY - ((k % PER_COL) + 1) * ROW;
      nodes.push({ id, kind: "material", label: c.item ?? "", fallback: c.item ? undefined : "material", detail: detail(c), x, y });
      edges.push({ from: id, to: sid });
    });
    below.forEach((c, k) => {
      const id = `energy:${i}:${k}`;
      const x = x0 + Math.floor(k / PER_COL) * COL;
      const y = baseY + ((k % PER_COL) + 1) * ROW;
      nodes.push({ id, kind: "energy", label: c.item ?? "", fallback: c.item ? undefined : "energy", detail: detail(c), x, y });
      edges.push({ from: id, to: sid });
    });
    x0 += Math.max(subs(above.length), subs(below.length)) * COL;
  });

  // Explicit Flow rows replace the default chain; a row whose ends are unknown lands on Unassigned.
  const flowEdges: FlowEdge[] = flows
    .filter((c) => c.from && c.to)
    .map((c) => ({ from: stepId(named(c.from) ?? UNASSIGNED), to: stepId(named(c.to) ?? UNASSIGNED), label: c.item || undefined }));
  if (flowEdges.length) edges.push(...flowEdges);
  else for (let i = 0; i + 1 < stepNames.length; i++) edges.push({ from: stepId(stepNames[i]!), to: stepId(stepNames[i + 1]!) });

  const outX = x0;
  outputs.forEach((c, k) => {
    const id = `output:${k}`;
    nodes.push({ id, kind: "output", label: c.item ?? "", fallback: c.item ? undefined : "output", detail: detail(c), x: outX + Math.floor(k / PER_COL) * COL, y: baseY + ((k % PER_COL)) * ROW });
    edges.push({ from: stepId(outKey(c)), to: id });
  });
  const prodX = outX + subs(outputs.length) * COL;
  products.forEach((c, k) => {
    const id = `product:${k}`;
    nodes.push({
      id,
      kind: "product",
      label: c.item || c.cn || "",
      fallback: c.item || c.cn ? undefined : "product",
      detail: c.cn || undefined,
      x: prodX + Math.floor(k / PER_COL) * COL,
      y: baseY + (k % PER_COL) * ROW,
    });
    outputs.forEach((o, j) => {
      if (c.item && o.item === c.item) edges.push({ from: `output:${j}`, to: id });
    });
  });

  if (!nodes.length) return { nodes, edges: [], width: 0, height: 0 };
  const width = Math.max(...nodes.map((n) => n.x)) + NODE_W + PAD;
  const height = Math.max(...nodes.map((n) => n.y)) + NODE_H + PAD;
  return { nodes, edges, width, height };
}

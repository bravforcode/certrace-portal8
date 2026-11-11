import type { Sheet } from "../workspace-sheets";

export type FlowNode = {
  id: string;
  kind: "material" | "energy" | "step" | "output" | "product";
  label: string;
  detail?: string;
  x: number;
  y: number;
};
export type FlowEdge = { from: string; to: string; label?: string };

const COL = 220; // horizontal gap between steps
const ROW = 64; // vertical gap between stacked inputs
const NODE_W = 168;
const NODE_H = 44;
export const FLOW_NODE = { w: NODE_W, h: NODE_H };

const rowsOf = (sheets: Sheet[], id: string) =>
  (sheets.find((s) => s.id === id)?.rows ?? [])
    .map((r) => r.cells)
    .filter((c) => Object.entries(c).some(([k, v]) => k !== "status" && v?.trim()));
const detail = (c: Record<string, string>) =>
  [c.qty, c.unit].filter(Boolean).join(" ") || undefined;

export function buildFlow(sheets: Sheet[]) {
  const stepNames = rowsOf(sheets, "steps").map((c) => c.step?.trim()).filter(Boolean) as string[];
  const materials = rowsOf(sheets, "materials");
  const energy = rowsOf(sheets, "energy");
  const outputs = rowsOf(sheets, "output");
  const products = rowsOf(sheets, "products");
  const flows = rowsOf(sheets, "flow");

  const steps = [...new Set(stepNames)];
  const known = new Set(steps);
  const orphan = [...materials, ...energy, ...outputs].some((c) => !known.has(c.step?.trim() ?? ""));
  if (orphan) steps.push("Unassigned step");
  const stepOf = (c: Record<string, string>) =>
    known.has(c.step?.trim() ?? "") ? c.step!.trim() : "Unassigned step";

  const maxAbove = Math.max(0, ...steps.map((st) => materials.filter((c) => stepOf(c) === st).length));
  const baseY = 24 + maxAbove * ROW;
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const stepId = (st: string) => `step:${steps.indexOf(st)}`;

  steps.forEach((st, i) => {
    const x = 24 + i * COL;
    nodes.push({ id: stepId(st), kind: "step", label: st, x, y: baseY });
    materials.filter((c) => stepOf(c) === st).forEach((c, k) => {
      const id = `material:${i}:${k}`;
      nodes.push({ id, kind: "material", label: c.item || "Material", detail: detail(c), x, y: baseY - (k + 1) * ROW });
      edges.push({ from: id, to: stepId(st) });
    });
    energy.filter((c) => stepOf(c) === st).forEach((c, k) => {
      const id = `energy:${i}:${k}`;
      nodes.push({ id, kind: "energy", label: c.item || "Energy", detail: detail(c), x, y: baseY + (k + 1) * ROW });
      edges.push({ from: id, to: stepId(st) });
    });
  });

  if (flows.length)
    for (const c of flows) {
      const a = steps.includes(c.from ?? "") ? stepId(c.from!) : null;
      const b = steps.includes(c.to ?? "") ? stepId(c.to!) : null;
      if (a && b) edges.push({ from: a, to: b, label: c.item || undefined });
    }
  else
    for (let i = 0; i + 1 < steps.length; i++)
      if (steps[i + 1] !== "Unassigned step") edges.push({ from: stepId(steps[i]!), to: stepId(steps[i + 1]!) });

  const outX = 24 + steps.length * COL;
  outputs.forEach((c, k) => {
    const id = `output:${k}`;
    nodes.push({ id, kind: "output", label: c.item || "Output", detail: detail(c), x: outX, y: baseY + k * ROW });
    edges.push({ from: stepId(stepOf(c)), to: id });
  });
  products.forEach((c, k) => {
    const id = `product:${k}`;
    nodes.push({ id, kind: "product", label: c.item || c.cn || "Product", detail: c.cn, x: outX + COL, y: baseY + k * ROW });
    const out = outputs.findIndex((o) => o.item && o.item === c.item);
    if (out >= 0) edges.push({ from: `output:${out}`, to: id });
  });

  const width = nodes.length ? Math.max(...nodes.map((n) => n.x)) + NODE_W + 24 : 0;
  const height = nodes.length ? Math.max(...nodes.map((n) => n.y)) + NODE_H + 24 : 0;
  return { nodes, edges, width, height };
}

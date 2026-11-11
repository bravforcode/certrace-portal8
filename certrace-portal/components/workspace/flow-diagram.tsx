"use client";

/* ════════════════════════════════════════════════════════════
   THE PRODUCTION FLOW — the workbook drawn as the factory floor

   Steps run left to right in the order of the Steps sheet; each step's raw
   materials stack above it, its energy sources below, its outputs and then
   the products to the right. Every node opens the sheet it came from.
   Inline SVG only; the colours are tokens in app/globals.css (--flow-*).
   One tab stop for the whole diagram; the arrow keys move between nodes.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import type { TFunction } from "@/lib/i18n";
import { FLOW_NODE, buildFlow, type FlowFallback, type FlowKind, type FlowNode } from "@/lib/workbook/flow";
import type { Sheet } from "@/lib/workspace-sheets";

const SHEET_OF: Record<FlowKind, string> = {
  step: "steps",
  material: "materials",
  energy: "energy",
  output: "output",
  product: "products",
};
const FILL: Record<FlowKind, string> = {
  step: "var(--flow-step)",
  material: "var(--flow-material)",
  energy: "var(--flow-energy)",
  output: "var(--flow-output)",
  product: "var(--flow-product)",
};
// Kind is shown as a caption on the node and in the legend, so it is not carried by colour alone.
const KIND_LABEL: Record<FlowKind, string> = {
  step: "Process step",
  material: "Raw material",
  energy: "Energy source",
  output: "Output",
  product: "Product",
};
const FALLBACK_LABEL: Record<FlowFallback, string> = {
  unassigned: "Unassigned step",
  material: "Material",
  energy: "Energy",
  output: "Output",
  product: "Product",
};
const MAX_LABEL = 22;
const clip = (s: string) => (s.length > MAX_LABEL ? `${s.slice(0, MAX_LABEL - 1)}…` : s);
const stacked = (n: FlowNode) => n.kind === "material" || n.kind === "energy";

export function FlowDiagram({
  sheets,
  onOpenSheet,
  t,
}: {
  sheets: Sheet[];
  onOpenSheet: (sheetId: string) => void;
  t: TFunction;
}) {
  const arrowId = `flow-arrow-${React.useId().replace(/:/g, "")}`;
  const f = React.useMemo(() => buildFlow(sheets), [sheets]);
  const ordered = React.useMemo(() => [...f.nodes].sort((a, b) => a.x - b.x || a.y - b.y), [f.nodes]);
  const byId = React.useMemo(() => new Map(f.nodes.map((n) => [n.id, n])), [f.nodes]);
  const [stop, setStop] = React.useState<string | null>(null);
  const [focused, setFocused] = React.useState<string | null>(null);
  const refs = React.useRef(new Map<string, SVGGElement>());
  const tabStop = ordered.some((n) => n.id === stop) ? stop : ordered[0]?.id;

  if (!f.nodes.length)
    return (
      <div className="grid min-h-[420px] place-items-center px-6 text-center" style={{ backgroundColor: "var(--flow-canvas)" }}>
        <div>
          <p className="text-[14px] text-black/55">{t("Add steps in sheet 02 to see your production flow.")}</p>
          <button
            type="button"
            onClick={() => onOpenSheet("steps")}
            className="mt-3 rounded-md border border-black/10 bg-white px-3 py-1.5 text-[12.5px] text-black/75 hover:text-black"
          >
            {t("Open process steps")}
          </button>
        </div>
      </div>
    );

  const nameOf = (n: FlowNode) => n.label || (n.fallback ? t(FALLBACK_LABEL[n.fallback]) : "");
  const open = (n: FlowNode) => onOpenSheet(SHEET_OF[n.kind]);
  const move = (id: string, d: number) => {
    const i = ordered.findIndex((n) => n.id === id);
    const next = ordered[Math.min(ordered.length - 1, Math.max(0, i + d))]!;
    setStop(next.id);
    refs.current.get(next.id)?.focus();
  };

  // Stacked inputs connect vertically to their step; everything else runs right edge to left edge.
  const path = (a: FlowNode, b: FlowNode) => {
    const W = FLOW_NODE.w;
    const H = FLOW_NODE.h;
    let p1: { x: number; y: number };
    let p2: { x: number; y: number };
    if (stacked(a) || stacked(b)) {
      const down = a.y < b.y;
      p1 = { x: a.x + W / 2, y: down ? a.y + H : a.y };
      p2 = { x: b.x + W / 2, y: down ? b.y : b.y + H };
    } else {
      p1 = { x: a.x + W, y: a.y + H / 2 };
      p2 = { x: b.x, y: b.y + H / 2 };
    }
    const mx = (p1.x + p2.x) / 2;
    return { d: `M ${p1.x} ${p1.y} C ${mx} ${p1.y}, ${mx} ${p2.y}, ${p2.x} ${p2.y}`, mx, my: (p1.y + p2.y) / 2 };
  };

  return (
    <div style={{ backgroundColor: "var(--flow-canvas)" }}>
      <ul aria-label={t("Legend")} className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 pt-3 text-[11.5px] text-black/60">
        {(Object.keys(FILL) as FlowKind[]).map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span aria-hidden="true" style={{ backgroundColor: FILL[k] }} className="inline-block h-3 w-3 rounded-sm border border-black/15" />
            {t(KIND_LABEL[k])}
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto p-4">
        <svg
          role="group"
          aria-label={t("Production flow diagram")}
          viewBox={`0 0 ${f.width} ${f.height}`}
          width={f.width}
          height={f.height}
          className="block max-w-none"
        >
          <title>{t("Production flow diagram")}</title>
          <defs>
            <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" style={{ fill: "var(--flow-edge)" }} />
            </marker>
          </defs>

          {f.edges.map((e, i) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            const p = path(a, b);
            return (
              <g key={`e${i}`}>
                <path d={p.d} fill="none" strokeWidth={1.5} style={{ stroke: "var(--flow-edge)" }} markerEnd={`url(#${arrowId})`} />
                {e.label && (
                  <text x={p.mx} y={p.my - 4} textAnchor="middle" fontSize={11} fill="currentColor" className="text-black/60">
                    {clip(e.label)}
                  </text>
                )}
              </g>
            );
          })}

          {ordered.map((n) => {
            const name = nameOf(n);
            const full = n.detail ? `${name} · ${n.detail}` : name;
            return (
              <g
                key={n.id}
                ref={(el) => {
                  if (el) refs.current.set(n.id, el);
                  else refs.current.delete(n.id);
                }}
                role="button"
                tabIndex={n.id === tabStop ? 0 : -1}
                aria-label={`${t(KIND_LABEL[n.kind])}: ${full}`}
                onClick={() => open(n)}
                onFocus={() => {
                  setStop(n.id);
                  setFocused(n.id);
                }}
                onBlur={() => setFocused((cur) => (cur === n.id ? null : cur))}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    move(n.id, 1);
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    move(n.id, -1);
                  } else if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open(n);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <title>{full}</title>
                <rect
                  x={n.x}
                  y={n.y}
                  width={FLOW_NODE.w}
                  height={FLOW_NODE.h}
                  rx={8}
                  style={{ fill: FILL[n.kind], stroke: n.kind === "step" ? "var(--flow-step-stroke)" : "var(--flow-line)" }}
                  strokeWidth={n.kind === "step" ? 1.5 : 1}
                  strokeDasharray={n.kind === "output" || n.kind === "product" ? "4 3" : undefined}
                />
                <text x={n.x + 10} y={n.y + 12} fontSize={9} fill="currentColor" className="text-black/50">
                  {t(KIND_LABEL[n.kind])}
                </text>
                <text x={n.x + 10} y={n.y + 26} fontSize={13} fontWeight={600} style={{ fill: "var(--flow-ink)" }}>
                  {clip(name)}
                </text>
                {n.detail && (
                  <text x={n.x + 10} y={n.y + 39} fontSize={11} fill="currentColor" className="text-black/50">
                    {clip(n.detail)}
                  </text>
                )}
                {focused === n.id && (
                  <rect
                    x={n.x - 3}
                    y={n.y - 3}
                    width={FLOW_NODE.w + 6}
                    height={FLOW_NODE.h + 6}
                    rx={10}
                    fill="none"
                    strokeWidth={2.5}
                    style={{ stroke: "var(--flow-focus)" }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

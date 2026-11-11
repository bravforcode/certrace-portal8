"use client";

/* ════════════════════════════════════════════════════════════
   THE PRODUCTION FLOW — the workbook drawn as the factory floor

   Steps run left to right in the order of the Steps sheet; each step's raw
   materials stack above it, its energy sources below, its outputs and then
   the products to the right. Every node opens the sheet it came from.
   Inline SVG only; the colours are tokens in app/globals.css (--flow-*).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import type { TFunction } from "@/lib/i18n";
import { FLOW_NODE, buildFlow, type FlowNode } from "@/lib/workbook/flow";
import type { Sheet } from "@/lib/workspace-sheets";

const SHEET_OF: Record<FlowNode["kind"], string> = {
  step: "steps",
  material: "materials",
  energy: "energy",
  output: "output",
  product: "products",
};
const FILL: Record<FlowNode["kind"], string> = {
  step: "var(--flow-step)",
  material: "var(--flow-material)",
  energy: "var(--flow-energy)",
  output: "var(--flow-output)",
  product: "var(--flow-product)",
};
const KIND_LABEL: Record<FlowNode["kind"], string> = {
  step: "Process step",
  material: "Raw material",
  energy: "Energy source",
  output: "Output",
  product: "Product",
};
const MAX_LABEL = 22;
const clip = (s: string) => (s.length > MAX_LABEL ? `${s.slice(0, MAX_LABEL - 1)}…` : s);

export function FlowDiagram({
  sheets,
  onOpenSheet,
  t,
}: {
  sheets: Sheet[];
  onOpenSheet: (sheetId: string) => void;
  t: TFunction;
}) {
  const f = React.useMemo(() => buildFlow(sheets), [sheets]);
  const byId = new Map(f.nodes.map((n) => [n.id, n]));

  if (!f.nodes.length)
    return (
      <div className="grid min-h-[420px] place-items-center bg-[#fafaf8] px-6 text-center">
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

  const anchor = (n: FlowNode, side: "left" | "right" | "top" | "bottom") => {
    const cx = n.x + FLOW_NODE.w / 2;
    const cy = n.y + FLOW_NODE.h / 2;
    if (side === "left") return { x: n.x, y: cy };
    if (side === "right") return { x: n.x + FLOW_NODE.w, y: cy };
    if (side === "top") return { x: cx, y: n.y };
    return { x: cx, y: n.y + FLOW_NODE.h };
  };

  return (
    <div className="bg-[#fafaf8]">
      <ul aria-label={t("Legend")} className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 pt-3 text-[11.5px] text-black/60">
        {(Object.keys(FILL) as FlowNode["kind"][]).map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span aria-hidden="true" style={{ backgroundColor: FILL[k] }} className="inline-block h-3 w-3 rounded-sm border border-black/15" />
            {t(KIND_LABEL[k])}
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto p-4">
        <svg
          role="img"
          aria-label={t("Production flow diagram")}
          viewBox={`0 0 ${f.width} ${f.height}`}
          width={f.width}
          height={f.height}
          className="block max-w-none"
          style={{ fontFamily: "inherit" }}
        >
          <title>{t("Production flow diagram")}</title>
          <defs>
            <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" style={{ fill: "var(--flow-edge)" }} />
            </marker>
          </defs>

          {f.edges.map((e, i) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            // Stacked inputs sit in the same column: connect bottom/top; otherwise right edge to left edge.
            const vertical = a.x === b.x;
            const down = b.y > a.y;
            const p1 = vertical ? anchor(a, down ? "bottom" : "top") : anchor(a, "right");
            const p2 = vertical ? anchor(b, down ? "top" : "bottom") : anchor(b, "left");
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            return (
              <g key={`e${i}`}>
                <path
                  d={`M ${p1.x} ${p1.y} C ${mx} ${p1.y}, ${mx} ${p2.y}, ${p2.x} ${p2.y}`}
                  fill="none"
                  strokeWidth={1.5}
                  style={{ stroke: "var(--flow-edge)" }}
                  markerEnd="url(#flow-arrow)"
                />
                {e.label && (
                  <text x={mx} y={my - 4} textAnchor="middle" fontSize={11} fill="currentColor" className="text-black/60">
                    {clip(e.label)}
                  </text>
                )}
              </g>
            );
          })}

          {f.nodes.map((n) => {
            const sheetId = SHEET_OF[n.kind];
            const open = () => onOpenSheet(sheetId);
            const full = n.detail ? `${n.label} · ${n.detail}` : n.label;
            return (
              <g
                key={n.id}
                role="button"
                tabIndex={0}
                aria-label={`${t(KIND_LABEL[n.kind])}: ${full}`}
                onClick={open}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open();
                  }
                }}
                className="cursor-pointer focus:outline-none focus-visible:[&>rect]:stroke-[#111]"
              >
                <title>{full}</title>
                <rect
                  x={n.x}
                  y={n.y}
                  width={FLOW_NODE.w}
                  height={FLOW_NODE.h}
                  rx={8}
                  style={{
                    fill: FILL[n.kind],
                    stroke: n.kind === "step" ? "var(--flow-step-stroke)" : "var(--flow-line)",
                  }}
                  strokeWidth={n.kind === "step" ? 1.5 : 1}
                />
                <text x={n.x + 10} y={n.y + (n.detail ? 18 : 26)} fontSize={13} fontWeight={600} fill="currentColor" className="text-[#111]">
                  {clip(n.label)}
                </text>
                {n.detail && (
                  <text x={n.x + 10} y={n.y + 34} fontSize={11} fill="currentColor" className="text-black/50">
                    {clip(n.detail)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

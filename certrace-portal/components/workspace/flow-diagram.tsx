"use client";

/* ════════════════════════════════════════════════════════════
   THE PRODUCTION FLOW — the workbook drawn as the factory floor

   Steps run left to right in the order of the Steps sheet; each step's raw
   materials stack above it, its energy sources below, its outputs and then
   the products to the right. Every node opens the sheet it came from.
   Inline SVG only; the colours are tokens in app/globals.css (--flow-*).
   One tab stop for the whole diagram; the arrow keys move between nodes.

   Edit mode (editable + savePatch): the toolbar and dialogs turn each edit into
   a cell patch (lib/workbook/flow-edit.ts) and send it through savePatch. The
   diagram is always drawn from the cells, so nothing else needs to change.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Button, Field, Modal } from "@/components/ui";
import { toast } from "@/components/toast";
import type { TFunction } from "@/lib/i18n";
import { rowsUsed } from "@/lib/workbook/cells";
import { FLOW_NODE, buildFlow, type FlowEdge, type FlowFallback, type FlowKind, type FlowNode } from "@/lib/workbook/flow";
import { flowActionToCells, missingSteps, stepNames, type CellPatch, type FlowAction } from "@/lib/workbook/flow-edit";
import type { SyncResult } from "@/lib/workbook/sync-queue";
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
const edgeKey = (e: FlowEdge) => `${e.from}|${e.to}`;
const NO_CELLS: Record<string, string> = {};

type Dialog =
  | { kind: "add-step" }
  | { kind: "add-input"; sheet: "materials" | "energy" | "output" }
  | { kind: "link" }
  | { kind: "rename"; from: string };

const titleOf = (d: Dialog) =>
  d.kind === "add-step"
    ? "Add step"
    : d.kind === "link"
      ? "Link steps"
      : d.kind === "rename"
        ? "Rename step"
        : d.sheet === "materials"
          ? "Add material"
          : d.sheet === "energy"
            ? "Add energy"
            : "Add output";

/** The action a dialog submits, from its form values. */
function actionOf(d: Dialog, v: Record<string, string>): FlowAction {
  switch (d.kind) {
    case "add-step":
      return { kind: "add-step", name: v.name ?? "", what: v.what };
    case "add-input":
      return d.sheet === "output"
        ? { kind: "add-output", step: v.step ?? "", item: v.item ?? "", qty: v.qty, unit: v.unit }
        : { kind: "add-input", sheet: d.sheet, step: v.step ?? "", item: v.item ?? "", qty: v.qty, unit: v.unit };
    case "link":
      return { kind: "connect", from: v.from ?? "", to: v.to ?? "", item: v.item };
    case "rename":
      return { kind: "rename-step", from: d.from, to: v.name ?? "" };
  }
}

/** True when the action is missing a field the form must have before it can be built. */
function incomplete(a: FlowAction) {
  switch (a.kind) {
    case "add-step":
      return !a.name.trim();
    case "add-input":
    case "add-output":
      return !a.step.trim() || !a.item.trim();
    case "connect":
      return !a.from.trim() || !a.to.trim();
    case "rename-step":
      return !a.to.trim();
    default:
      return false;
  }
}

/** The cells as they will be once a patch lands, so a batch of patches can be computed one after another. */
function applyPatch(cells: Record<string, string>, patch: CellPatch) {
  const out = { ...cells };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k];
    else out[k] = v;
  }
  return out;
}

export function FlowDiagram({
  sheets,
  cells = NO_CELLS,
  onOpenSheet,
  t,
  editable = false,
  savePatch,
  nodeTone,
  nodeBadge,
  onSelect,
}: {
  sheets: Sheet[];
  cells?: Record<string, string>;
  onOpenSheet: (sheetId: string) => void;
  t: TFunction;
  editable?: boolean;
  savePatch?: (p: CellPatch) => Promise<SyncResult>;
  /** Fill colour per node id; overrides the kind's colour. Used by Task 23. */
  nodeTone?: Record<string, string>;
  /** A small label drawn under a node, per node id. Used by Task 23. */
  nodeBadge?: Record<string, string>;
  onSelect?: (node: FlowNode | null) => void;
}) {
  const arrowId = `flow-arrow-${React.useId().replace(/:/g, "")}`;
  const f = React.useMemo(() => buildFlow(sheets), [sheets]);
  const ordered = React.useMemo(() => [...f.nodes].sort((a, b) => a.x - b.x || a.y - b.y), [f.nodes]);
  const byId = React.useMemo(() => new Map(f.nodes.map((n) => [n.id, n])), [f.nodes]);
  const missing = React.useMemo(() => missingSteps(cells), [cells]);
  const [stop, setStop] = React.useState<string | null>(null);
  const [focused, setFocused] = React.useState<string | null>(null);
  const [sel, setSel] = React.useState<string | null>(null);
  const [selEdge, setSelEdge] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<Dialog | null>(null);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const refs = React.useRef(new Map<string, SVGGElement>());
  const tabStop = ordered.some((n) => n.id === stop) ? stop : ordered[0]?.id;

  const canEdit = Boolean(editable && savePatch);
  const selected = sel ? (byId.get(sel) ?? null) : null;
  const selStep = selected?.kind === "step" ? selected.label : "";
  const edge = selEdge ? f.edges.find((e) => edgeKey(e) === selEdge) : undefined;
  const edgeFrom = edge ? byId.get(edge.from) : undefined;
  const edgeTo = edge ? byId.get(edge.to) : undefined;
  // Only an explicit Flow row can be unlinked; while the Flow sheet is empty the chain is implied.
  const unlinkable = edgeFrom?.kind === "step" && edgeTo?.kind === "step" && rowsUsed(cells, "flow") > 0;

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

  // In edit mode a click selects; otherwise it opens the node's sheet, as before.
  const activate = (n: FlowNode) => {
    if (!canEdit) return open(n);
    const next = sel === n.id ? null : n;
    setSel(next?.id ?? null);
    setSelEdge(null);
    onSelect?.(next);
  };
  const pickEdge = (k: string) => {
    setSelEdge((cur) => (cur === k ? null : k));
    setSel(null);
    onSelect?.(null);
  };

  const notify = (r: SyncResult) => {
    if (r === "saved") return;
    toast({
      message: t(r === "failed" ? "Not saved. Nothing changed; try again." : "Skipped because an earlier change did not save."),
      tone: "err",
    });
  };

  const openDialog = (d: Dialog) => {
    const initial: Record<string, string> =
      d.kind === "add-input" ? { step: selStep || (stepNames(cells)[0] ?? "") } : d.kind === "link" ? { from: selStep } : {};
    if (d.kind === "rename") initial.name = d.from;
    setForm(initial);
    setFormError(null);
    setDialog(d);
  };
  const closeDialog = () => {
    setDialog(null);
    setFormError(null);
  };

  const submit = async () => {
    if (!dialog || !savePatch) return;
    const action = actionOf(dialog, form);
    if (incomplete(action)) {
      setFormError(t("Fill in the required fields."));
      return;
    }
    let patch: CellPatch;
    try {
      patch = flowActionToCells(action, cells);
    } catch (e) {
      setFormError(t((e as Error).message));
      return;
    }
    setBusy(true);
    const result = await savePatch(patch);
    setBusy(false);
    if (result === "saved") closeDialog();
    else notify(result);
  };

  const unlink = async () => {
    if (!savePatch || !edgeFrom || !edgeTo) return;
    setBusy(true);
    const result = await savePatch(flowActionToCells({ kind: "disconnect", from: edgeFrom.label, to: edgeTo.label }, cells));
    setBusy(false);
    if (result === "saved") setSelEdge(null);
    else notify(result);
  };

  // One add-step patch per missing name, each built on the cells the previous one leaves behind.
  const addMissing = async () => {
    if (!savePatch) return;
    const patches: CellPatch[] = [];
    let acc = cells;
    for (const name of missing) {
      const patch = flowActionToCells({ kind: "add-step", name }, acc);
      patches.push(patch);
      acc = applyPatch(acc, patch);
    }
    const results = await Promise.all(patches.map((p) => savePatch(p)));
    const bad = results.find((r) => r !== "saved");
    if (bad) notify(bad);
  };

  const field = (key: string) => ({
    value: form[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((cur) => ({ ...cur, [key]: e.target.value })),
  });
  const inputCls =
    "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-[13.5px] text-black/85 focus:border-[var(--flow-focus)] focus:outline-none";
  const stepSelect = (key: string) => (
    <select {...field(key)} className={inputCls}>
      <option value="">—</option>
      {stepNames(cells).map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
  const dialogFields = (d: Dialog) => {
    switch (d.kind) {
      case "add-step":
        return (
          <>
            <Field label={t("Name")}>
              <input {...field("name")} className={inputCls} autoFocus />
            </Field>
            <Field label={t("What happens here")}>
              <input {...field("what")} className={inputCls} />
            </Field>
          </>
        );
      case "add-input":
        return (
          <>
            <Field label={t("Step")}>{stepSelect("step")}</Field>
            <Field label={t("Item")}>
              <input {...field("item")} className={inputCls} autoFocus />
            </Field>
            <Field label={t("Quantity")}>
              <input {...field("qty")} className={inputCls} />
            </Field>
            <Field label={t("Unit")}>
              <input {...field("unit")} className={inputCls} />
            </Field>
          </>
        );
      case "link":
        return (
          <>
            <Field label={t("From")}>{stepSelect("from")}</Field>
            <Field label={t("To")}>{stepSelect("to")}</Field>
            <Field label={t("Item")}>
              <input {...field("item")} className={inputCls} />
            </Field>
          </>
        );
      case "rename":
        return (
          <Field label={t("New name")}>
            <input {...field("name")} className={inputCls} autoFocus />
          </Field>
        );
    }
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

      {canEdit && missing.length > 0 && (
        <div
          role="status"
          className="mx-4 mt-3 flex flex-wrap items-center gap-3 rounded-md border border-[var(--color-warn)] bg-amber-50 px-3 py-2 text-[12.5px] text-[var(--color-warn-text)]"
        >
          <span>
            {t("Rows name steps that are not in the Steps sheet:")} {missing.join(", ")}
          </span>
          <Button variant="secondary" size="sm" onClick={addMissing}>
            {t("Add these steps")}
          </Button>
        </div>
      )}

      {canEdit && (
        <div role="toolbar" aria-label={t("Edit the flow")} className="flex flex-wrap gap-2 px-4 pt-3">
          <Button variant="secondary" size="sm" onClick={() => openDialog({ kind: "add-step" })}>
            {t("Add step")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openDialog({ kind: "add-input", sheet: "materials" })}>
            {t("Add material")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openDialog({ kind: "add-input", sheet: "energy" })}>
            {t("Add energy")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openDialog({ kind: "add-input", sheet: "output" })}>
            {t("Add output")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openDialog({ kind: "link" })}>
            {t("Link steps")}
          </Button>
          {selStep && (
            <>
              <Button variant="secondary" size="sm" onClick={() => openDialog({ kind: "rename", from: selStep })}>
                {t("Rename step")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onOpenSheet(SHEET_OF.step)}>
                {t("Open sheet")}
              </Button>
            </>
          )}
          {unlinkable && (
            <Button variant="secondary" size="sm" onClick={unlink} disabled={busy}>
              {t("Unlink")}
            </Button>
          )}
        </div>
      )}

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
            const k = edgeKey(e);
            const isSel = selEdge === k;
            const line = (
              <>
                {canEdit && <path d={p.d} fill="none" strokeWidth={12} stroke="transparent" />}
                <path
                  d={p.d}
                  fill="none"
                  strokeWidth={isSel ? 2.5 : 1.5}
                  style={{ stroke: isSel ? "var(--flow-ink)" : focused === k ? "var(--flow-focus)" : "var(--flow-edge)" }}
                  markerEnd={`url(#${arrowId})`}
                />
                {e.label && (
                  <text x={p.mx} y={p.my - 4} textAnchor="middle" fontSize={11} fill="currentColor" className="text-black/60">
                    {clip(e.label)}
                  </text>
                )}
              </>
            );
            if (!canEdit) return <g key={`e${i}`}>{line}</g>;
            return (
              <g
                key={`e${i}`}
                role="button"
                tabIndex={0}
                aria-label={`${t("Link steps")}: ${nameOf(a)} → ${nameOf(b)}`}
                aria-pressed={isSel}
                onClick={() => pickEdge(k)}
                onFocus={() => setFocused(k)}
                onBlur={() => setFocused((cur) => (cur === k ? null : cur))}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    pickEdge(k);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                {line}
              </g>
            );
          })}

          {ordered.map((n) => {
            const name = nameOf(n);
            const full = n.detail ? `${name} · ${n.detail}` : name;
            const isSel = sel === n.id;
            const badge = nodeBadge?.[n.id];
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
                aria-pressed={canEdit ? isSel : undefined}
                onClick={() => activate(n)}
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
                    activate(n);
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
                  style={{ fill: nodeTone?.[n.id] ?? FILL[n.kind], stroke: n.kind === "step" ? "var(--flow-step-stroke)" : "var(--flow-line)" }}
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
                {badge && (
                  <text x={n.x} y={n.y + FLOW_NODE.h + 13} fontSize={10} fontWeight={600} style={{ fill: "var(--flow-ink)" }}>
                    {clip(badge)}
                  </text>
                )}
                {isSel && (
                  <rect
                    x={n.x - 1}
                    y={n.y - 1}
                    width={FLOW_NODE.w + 2}
                    height={FLOW_NODE.h + 2}
                    rx={9}
                    fill="none"
                    strokeWidth={2}
                    style={{ stroke: "var(--flow-ink)" }}
                  />
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

      {canEdit && (
        <Modal
          open={dialog !== null}
          onClose={closeDialog}
          title={dialog ? t(titleOf(dialog)) : ""}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeDialog}>
                {t("Cancel")}
              </Button>
              <Button onClick={submit} disabled={busy}>
                {t("Save")}
              </Button>
            </div>
          }
        >
          <div className="grid gap-4">
            {dialog && dialogFields(dialog)}
            {formError && (
              <p role="alert" className="text-[12.5px] text-[var(--color-err-text)]">
                {formError}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

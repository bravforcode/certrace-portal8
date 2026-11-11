"use client";

/* ════════════════════════════════════════════════════════════
   THE PRODUCTION FLOW — the workbook drawn as the factory floor

   Steps run left to right in the order of the Steps sheet; each step's raw
   materials stack above it, its energy sources below, its outputs and then
   the products to the right. Every node opens the sheet it came from.
   Inline SVG only; the colours are tokens in app/globals.css (--flow-*).
   One tab stop for the whole diagram; the arrow keys move between nodes.
   Edges are drawn, not focusable: links are changed from the toolbar dialogs.

   Edit mode (editable + savePatch): the toolbar and dialogs turn each edit into
   a cell patch (lib/workbook/flow-edit.ts) and send it through savePatch. The
   diagram is always drawn from the cells, so nothing else needs to change.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Button, Field, Modal } from "@/components/ui";
import { toast } from "@/components/toast";
import type { TFunction } from "@/lib/i18n";
import { FLOW_NODE, buildFlow, type FlowFallback, type FlowKind, type FlowNode } from "@/lib/workbook/flow";
import {
  FLOW_ERROR_TEMPLATE,
  FlowEditError,
  explicitEdges,
  flowActionToCells,
  missingSteps,
  stepNames,
  type CellPatch,
  type FlowAction,
} from "@/lib/workbook/flow-edit";
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
const FAILED_MSG = "Not saved. Nothing changed; try again.";
const SKIPPED_MSG = "{count} skipped because an earlier change did not save.";
const MAX_LABEL = 22;
const clip = (s: string) => (s.length > MAX_LABEL ? `${s.slice(0, MAX_LABEL - 1)}…` : s);
const stacked = (n: FlowNode) => n.kind === "material" || n.kind === "energy";
const NO_CELLS: Record<string, string> = {};
const FORM_ID = "flow-dialog-form";

type Dialog =
  | { kind: "add-step" }
  | { kind: "add-input"; sheet: "materials" | "energy" | "output" }
  | { kind: "link" }
  | { kind: "rename"; from: string }
  | { kind: "unlink" };

const titleOf = (d: Dialog) =>
  d.kind === "add-step"
    ? "Add step"
    : d.kind === "link"
      ? "Link steps"
      : d.kind === "rename"
        ? "Rename step"
        : d.kind === "unlink"
          ? "Unlink"
          : d.sheet === "materials"
            ? "Add material"
            : d.sheet === "energy"
              ? "Add energy"
              : "Add output";

/** The action a dialog submits, from its form values. Validation happens in flowActionToCells. */
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
    case "unlink":
      return { kind: "disconnect", from: "", to: "" }; // replaced by the chosen edge in submit()
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
  // Explicit edges between two real steps: the only links the Unlink dialog offers.
  const links = React.useMemo(() => {
    const known = new Set(stepNames(cells).map((s) => s.toLowerCase()));
    return explicitEdges(cells).filter((e) => known.has(e.from.toLowerCase()) && known.has(e.to.toLowerCase()));
  }, [cells]);
  const [stop, setStop] = React.useState<string | null>(null);
  const [focused, setFocused] = React.useState<string | null>(null);
  const [sel, setSel] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<Dialog | null>(null);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const refs = React.useRef(new Map<string, SVGGElement>());
  const opener = React.useRef<HTMLElement | null>(null);
  const tabStop = ordered.some((n) => n.id === stop) ? stop : ordered[0]?.id;

  // Closing a dialog hands focus back to the control that opened it.
  React.useEffect(() => {
    if (dialog) return;
    opener.current?.focus();
    opener.current = null;
  }, [dialog]);

  const canEdit = Boolean(editable && savePatch);
  const selected = sel ? (byId.get(sel) ?? null) : null;
  const selStep = selected?.kind === "step" ? selected.label : "";

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
    onSelect?.(next);
  };

  /** Show the result of one or more patches as a single notice: how many failed and how many were skipped. */
  const notifyResults = (results: SyncResult[]) => {
    const failed = results.filter((r) => r === "failed").length;
    const skipped = results.filter((r) => r === "skipped").length;
    if (!failed && !skipped) return;
    toast({
      message: failed ? t(FAILED_MSG) : t(SKIPPED_MSG, { count: String(skipped) }),
      detail: failed && skipped ? t(SKIPPED_MSG, { count: String(skipped) }) : undefined,
      tone: "err",
    });
  };

  const openDialog = (d: Dialog) => {
    opener.current = document.activeElement as HTMLElement | null;
    const initial: Record<string, string> =
      d.kind === "add-input"
        ? { step: selStep || (stepNames(cells)[0] ?? "") }
        : d.kind === "link"
          ? { from: selStep }
          : d.kind === "unlink"
            ? { edge: "0" }
            : {};
    if (d.kind === "rename") initial.name = d.from;
    setForm(initial);
    setFormError(null);
    setDialog(d);
  };
  // Blocked while a save is in flight, so Escape and Cancel cannot drop an unfinished change.
  const closeDialog = () => {
    if (busy) return;
    setDialog(null);
    setFormError(null);
  };

  const submit = async () => {
    if (!dialog || !savePatch || busy) return;
    let patch: CellPatch;
    try {
      if (dialog.kind === "unlink") {
        const link = links[Number(form.edge)];
        if (!link) throw new FlowEditError("blank");
        patch = flowActionToCells({ kind: "disconnect", from: link.from, to: link.to }, cells);
      } else {
        patch = flowActionToCells(actionOf(dialog, form), cells);
      }
    } catch (e) {
      if (e instanceof FlowEditError) {
        setFormError(t(FLOW_ERROR_TEMPLATE[e.code], e.params));
        return;
      }
      throw e;
    }
    setBusy(true);
    const result = await savePatch(patch);
    setBusy(false);
    if (result === "saved") closeDialog();
    else notifyResults([result]);
  };

  // One add-step patch per missing name, each built on the cells the previous one leaves behind.
  const addMissing = async () => {
    if (!savePatch || busy) return;
    const patches: CellPatch[] = [];
    let acc = cells;
    for (const name of missing) {
      const patch = flowActionToCells({ kind: "add-step", name }, acc);
      patches.push(patch);
      acc = applyPatch(acc, patch);
    }
    setBusy(true);
    const results = await Promise.all(patches.map((p) => savePatch(p)));
    setBusy(false);
    notifyResults(results);
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
      case "unlink":
        return (
          <Field label={t("Flow")}>
            <select {...field("edge")} className={inputCls}>
              {links.map((e, i) => (
                <option key={e.row} value={String(i)}>
                  {t("Flow: {from} to {to}", { from: e.from, to: e.to })}
                </option>
              ))}
            </select>
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
          className="mx-4 mt-3 flex flex-wrap items-center gap-3 rounded-md border border-[var(--color-warn)] px-3 py-2 text-[12.5px] text-[var(--color-warn-text)]"
          style={{ backgroundColor: "var(--flow-warn-bg)" }}
        >
          <span>
            {t("Rows name steps that are not in the Steps sheet:")} {missing.join(", ")}
          </span>
          <Button variant="secondary" size="sm" onClick={addMissing} disabled={busy}>
            {t("Add these steps")}
          </Button>
        </div>
      )}

      {canEdit && (
        <div role="group" aria-label={t("Edit the flow")} className="flex flex-wrap gap-2 px-4 pt-3">
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
          {links.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => openDialog({ kind: "unlink" })}>
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
            return (
              <g key={`e${i}`}>
                <title>{t("Flow: {from} to {to}", { from: nameOf(a), to: nameOf(b) })}</title>
                <path
                  d={p.d}
                  fill="none"
                  strokeWidth={1.5}
                  style={{ stroke: "var(--flow-edge)" }}
                  markerEnd={`url(#${arrowId})`}
                />
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
              <Button variant="secondary" onClick={closeDialog} disabled={busy}>
                {t("Cancel")}
              </Button>
              <Button type="submit" form={FORM_ID} disabled={busy}>
                {t("Save")}
              </Button>
            </div>
          }
        >
          <form
            id={FORM_ID}
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            {dialog && dialogFields(dialog)}
            {formError && (
              <p role="alert" className="text-[12.5px] text-[var(--color-err-text)]">
                {formError}
              </p>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}

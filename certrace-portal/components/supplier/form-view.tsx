"use client";

/* The regulation-specific questionnaire (flow step 1). Generated entirely from
   the request's resolved CBAM fields — installation-level sections are filled
   once, goods/emissions sections repeat per product. Exporter-supplied context
   (CN code, category, quantity) is locked and shown read-only; the supplier
   fills the rest. Saves automatically. During a revision only unlocked fields
   are editable. */

import * as React from "react";
import { ArrowRight, ArrowDown, Lock, Info, Building2, FlaskConical, Zap, Boxes, Coins, BadgeCheck, Users, TriangleAlert, PenLine, History, Factory, Trash2 } from "lucide-react";
import { Card, Button, Eyebrow, OptionalTag, inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { FUEL_KINDS, FUEL_LABEL, PROVENANCE_SOURCES, PROVENANCE_LABEL, type FuelKind, type ProvenanceSource } from "@/lib/cbam/activity";
import { FUEL_UNITS, FUEL_UNIT_LABEL, needsNcv, toGJ, UnitError, CO2_PER_C, type FuelUnit } from "@/lib/cbam/units";
import { useSupplier, type FieldFlag } from "./context";
import { valueKey, fieldAppliesTo, fieldRequiredFor, type SupplierSection } from "@/lib/supplier";
import type { ResolvedCbamField } from "@/lib/config";
import { useT } from "@/lib/i18n";
import {
  parsePrecursorTree,
  serializePrecursorTree,
  emptyNode,
  updateNode,
  addChild,
  removeSubtree,
  precursorSEE,
  looksLikeScrap,
  PrecursorTreeError,
  type PrecursorNode,
} from "@/lib/cbam/precursor-tree";

/* How a flagged field's stroke + inline note look. `ring` is the resting stroke;
   `ringStrong` is the brief pulse when the supplier is led to the field. */
const FLAG_STYLE: Record<FieldFlag["severity"], { ring: string; ringStrong: string; text: string; tag: string; icon: React.ElementType }> = {
  critical: { ring: "ring-2 ring-[#dc2626]/40", ringStrong: "ring-4 ring-[#dc2626]/60", text: "text-[#dc2626]", tag: "AI check", icon: TriangleAlert },
  warning: { ring: "ring-2 ring-[#d97706]/40", ringStrong: "ring-4 ring-[#d97706]/60", text: "text-[#b45309]", tag: "AI check", icon: TriangleAlert },
  revision: { ring: "ring-2 ring-[#2563eb]/40", ringStrong: "ring-4 ring-[#2563eb]/55", text: "text-[#2563eb]", tag: "Exporter", icon: PenLine },
};

/* ── Remove a repeated row ────────────────────────────────────
   An icon, not the word "Remove".

   These sections repeat: a supplier adds a fuel, another fuel, a meter, a
   precursor. Each repeat carried a text button reading "Remove", so a page
   with six fuels had six of them stacked down the right-hand edge — a column
   of identical words that reads as a heading for the column rather than as six
   separate actions, and sits close enough to the "Add" affordance to be
   pressed instead of it. The bin says the same thing in one glyph, and it says
   it in the same shape as every other destructive control in the portal. */
function RemoveRow({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 flex-none place-items-center rounded-lg text-black/30 transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626] disabled:pointer-events-none disabled:opacity-40"
    >
      <Trash2 size={14} strokeWidth={1.5} />
    </button>
  );
}

function FlagNote({ severity, message }: { severity: FieldFlag["severity"]; message: string }) {
  const fs = FLAG_STYLE[severity];
  const Icon = fs.icon;
  return (
    <p className={cn("mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed", fs.text)}>
      <Icon size={12} strokeWidth={1.8} className="mt-[2px] flex-none" />
      <span>
        <span className="font-pixel text-[9px] uppercase tracking-[0.14em] opacity-70">{fs.tag} · </span>
        {message}
      </span>
    </p>
  );
}

const NUMERIC = new Set(["direct-emissions", "indirect-emissions", "elec-consumed", "production-output", "carbon-price"]);
const UNIT: Record<string, string> = {
  "direct-emissions": "tCO₂e/t",
  "indirect-emissions": "tCO₂e/t",
  // Absolute for the period, not per tonne — the suffix is half the instruction.
  "elec-consumed": "MWh",
  "production-output": "t",
  "carbon-price": "/ tCO₂e",
};
const SELECTS: Record<string, { value: string; label: string }[]> = {
  method: [
    { value: "actual", label: "Actual installation data" },
    { value: "default", label: "Default values" },
  ],
  "carbon-price-currency": [
    { value: "THB", label: "THB — Thai baht" },
    { value: "EUR", label: "EUR — Euro" },
  ],
  "carbon-price-form": [
    { value: "ets", label: "Emissions Trading System (ETS)" },
    { value: "tax", label: "Carbon tax" },
    { value: "levy", label: "Levy" },
    { value: "none", label: "None / not applicable" },
  ],
  "al-process": [
    { value: "prebake", label: "Prebake" },
    { value: "soderberg", label: "Søderberg" },
  ],
};
const SECTION_ICON: Record<string, React.ElementType> = {
  installation: Building2,
  goods: Boxes,
  emissions: FlaskConical,
  activity: Factory,
  electricity: Zap,
  precursors: Boxes,
  carbon: Coins,
  verification: BadgeCheck,
};

function FieldControl({ field, productId }: { field: ResolvedCbamField; productId?: string }) {
  const t = useT();
  const { getValue, setValue, isEditable, autoValue, flagged, focusKey, clearFocus, carriedKeys, carriedPending } = useSupplier();
  const auto = autoValue(field.id, productId);
  const key = valueKey(field.id, productId);
  const editable = isEditable(key);
  const value = getValue(field.id, productId);
  /* Pre-filled from this company's own record rather than typed for this
     request. Marked until confirmed, because an unmarked carried-over number
     is indistinguishable from one somebody actually checked this period. */
  const carried = carriedPending && carriedKeys.has(key);

  // Flag (AI check or revision request). A "missing" flag clears the moment the
  // field has a value — fixing it gives feedback without re-running the check.
  const rawFlag = flagged.get(key);
  const flag = rawFlag && !(rawFlag.kind === "missing" && value.trim()) ? rawFlag : null;
  const fs = flag ? FLAG_STYLE[flag.severity] : null;

  // When this field becomes the focus target, scroll it to the centre, pulse the
  // stroke and move the caret into it — the "lead me to the field" behaviour.
  const ref = React.useRef<HTMLDivElement>(null);
  const [pulse, setPulse] = React.useState(false);
  const isTarget = focusKey === key;
  React.useEffect(() => {
    if (!isTarget || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    setPulse(true);
    const el = ref.current.querySelector("input,textarea,button") as HTMLElement | null;
    const t1 = setTimeout(() => el?.focus({ preventScroll: true }), 420);
    const t2 = setTimeout(() => {
      setPulse(false);
      clearFocus();
    }, 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isTarget, key, clearFocus]);

  // Stroke wraps the control only (not the label/hint), so the *box* is what
  // lights up — exactly what "highlight the stroke of that box" asks for.
  const ringCls = fs ? cn("rounded-xl transition-shadow duration-700", pulse ? fs.ringStrong : fs.ring) : "rounded-xl";

  // Auto-derived (locked) — CN code, category, quantity, total emissions
  if (auto !== null) {
    return (
      <div ref={ref} className="scroll-mt-28">
        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-black/45">
          {field.label} <Lock size={10} strokeWidth={1.5} className="text-black/30" />
        </span>
        <div className={ringCls}>
          <div className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#faf9f7] px-4 py-3 text-sm text-black/60">
            <span className="font-mono">{auto || "—"}</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-black/30">{t("auto")}</span>
          </div>
        </div>
        {flag && <FlagNote severity={flag.severity} message={flag.message} />}
      </div>
    );
  }

  const label = (
    <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-black/55">
      {field.label}
      {!field.required && <OptionalTag />}
      {!editable && <Lock size={10} strokeWidth={1.5} className="text-black/30" />}
      {carried && (
        <span
          title={t("Carried over from your last submission — confirm it still holds for this period.")}
          className="inline-flex items-center gap-1 rounded-full border border-[#3C7ACB]/25 bg-[#3C7ACB]/[0.07] px-1.5 py-0.5 text-[8.5px] tracking-[0.1em] text-[#2f63a8]"
        >
          <History size={8} strokeWidth={1.8} /> {t("carried over")}
        </span>
      )}
    </span>
  );

  /* A specimen answer, prefixed so it can never be mistaken for a value that
     is already in the box. Fields without one show nothing rather than
     repeating the hint — an empty placeholder is honest, a duplicated
     sentence is noise the reader has to resolve. */
  const placeholder = field.example ? `e.g. ${field.example}` : "";

  let control: React.ReactNode;
  if (SELECTS[field.id]) {
    control = (
      <Select
        value={value}
        onChange={(v) => setValue(field.id, productId, v)}
        options={SELECTS[field.id]}
        placeholder={t("Select…")}
        className="w-full"
        ariaLabel={field.label}
      />
    );
  } else if (field.id === "precursors") {
    control = (
      <PrecursorEditor
        value={value}
        editable={editable}
        onChange={(v) => setValue(field.id, productId, v)}
      />
    );
  } else if (field.id === "activity-data") {
    control = (
      <SupplierActivityEditor
        value={value}
        editable={editable}
        onChange={(v) => setValue(field.id, productId, v)}
        outputTonnes={Number(getValue("production-output", productId)) || null}
      />
    );
  } else if (field.id === "precursor-route" || field.id === "inst-address") {
    control = (
      <textarea
        disabled={!editable}
        value={value}
        onChange={(e) => setValue(field.id, productId, e.target.value)}
        /* `example`, never `hint` — the hint already prints under the box, and
           passing it here printed the identical sentence twice. */
        placeholder={placeholder}
        className={cn(inputClass, "min-h-[72px] resize-y", !editable && "cursor-not-allowed opacity-60")}
      />
    );
  } else if (NUMERIC.has(field.id)) {
    control = (
      <div className="relative">
        <input
          type="number"
          min={0}
          step="any"
          disabled={!editable}
          value={value}
          onChange={(e) => setValue(field.id, productId, e.target.value)}
          placeholder="0.00"
          className={cn(inputClass, "pr-20", !editable && "cursor-not-allowed opacity-60")}
        />
        {UNIT[field.id] && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[11px] text-black/35">{UNIT[field.id]}</span>
        )}
      </div>
    );
  } else {
    control = (
      <input
        disabled={!editable}
        value={value}
        onChange={(e) => setValue(field.id, productId, e.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, !editable && "cursor-not-allowed opacity-60")}
      />
    );
  }

  return (
    <div ref={ref} className="scroll-mt-28">
      <label className="block">
        {label}
        <div className={ringCls}>{control}</div>
        {!flag && <span className="mt-1 block text-[11px] text-black/35">{field.hint}</span>}
      </label>
      {flag && <FlagNote severity={flag.severity} message={flag.message} />}
    </div>
  );
}

/* ── Multi-tier precursor tree ─────────────────────────────────
   Real CBAM chains are not a list, they are a chain: ore → pig iron → billet
   → rebar, each tier carrying the tier above it forward. So each precursor is
   a node that can hold its own inputs, and the good's embedded emissions
   resolve depth-first from the leaves down (lib/cbam/precursor-tree.ts).

   Two behaviours are deliberate. A node WITH children stops asking for its own
   embedded-emissions figure — that number is derived from what feeds it, and
   accepting a typed one as well would let a supplier declare two different
   answers to the same question. And scrap forces the figure to exactly 0 with
   the input disabled, because a scrap input carries no embedded emissions
   under CBAM however carefully someone fills it in.

   Legacy free-text entries are shown for reference and replaced the moment
   nodes are saved; legacy flat rows migrate to a single tier automatically. */
function PrecursorEditor({ value, editable, onChange }: { value: string; editable: boolean; onChange: (v: string) => void }) {
  const t = useT();
  const roots = React.useMemo(() => parsePrecursorTree(value) ?? [], [value]);
  const legacyText = value.trim() && parsePrecursorTree(value) === null ? value : null;

  const commit = (next: PrecursorNode[]) => onChange(next.length ? serializePrecursorTree(next) : "");

  const patch = (id: string, p: Partial<PrecursorNode>) => commit(updateNode(roots, id, p));
  const addRoot = () => commit([...roots, emptyNode(null)]);
  const addTier = (parentId: string) => commit(addChild(roots, parentId));
  const remove = (id: string) => commit(removeSubtree(roots, id));

  /* The total and the per-node breakdown come from the same pure function the
     engine and the PDF use, so what the supplier sees while typing is what
     gets filed. A cycle throws rather than hanging — surfaced, not swallowed. */
  let total: number | null = null;
  let treeError: string | null = null;
  try {
    total = precursorSEE(roots).perTonne;
  } catch (err) {
    treeError = err instanceof PrecursorTreeError ? err.message : "This precursor chain cannot be calculated.";
  }

  const cell = cn(inputClass, "px-2.5 py-2 text-[12.5px]", !editable && "cursor-not-allowed opacity-60");

  const renderNode = (n: PrecursorNode, depth: number): React.ReactNode => {
    const derived = n.children.length > 0;
    const scrapHint = looksLikeScrap(n);
    return (
      <div key={n.id} style={{ marginLeft: depth > 1 ? 16 : 0 }} className={cn(depth > 1 && "border-l border-black/[0.08] pl-3")}>
        <div className="rounded-xl border border-black/[0.07] bg-[#fafaf8] p-2.5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr]">
            <input disabled={!editable} value={n.name} onChange={(e) => patch(n.id, { name: e.target.value })} placeholder={depth === 1 ? "Material, e.g. Steel billet" : "Input to the tier above"} aria-label={t("Precursor material")} className={cell} />
            <input disabled={!editable} value={n.cnCode ?? ""} onChange={(e) => patch(n.id, { cnCode: e.target.value })} placeholder={t("CN code")} aria-label={t("Precursor CN code")} className={cell} />
            <div className="relative">
              <input type="number" min={0} step="any" disabled={!editable} value={n.qtyPerTonneOutput || ""} onChange={(e) => patch(n.id, { qtyPerTonneOutput: Number(e.target.value) || 0 })} placeholder="0.00" aria-label={depth === 1 ? "Tonnes consumed per tonne of this good" : "Tonnes consumed per tonne of the tier above"} className={cn(cell, "pr-9 w-full")} />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-black/35">t/t</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step="any"
                disabled={!editable || n.isScrap || derived}
                value={n.isScrap ? 0 : derived ? "" : (n.seeDeclared ?? "")}
                onChange={(e) => patch(n.id, { seeDeclared: e.target.value === "" ? undefined : Number(e.target.value) || 0 })}
                placeholder={derived ? "derived" : "0.00"}
                aria-label={t("Embedded emissions of the precursor")}
                className={cn(cell, "pr-14 w-full")}
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-black/35">{t("tCO₂e/t")}</span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input disabled={!editable} value={n.route ?? ""} onChange={(e) => patch(n.id, { route: e.target.value })} placeholder={t("Production route of this precursor (optional)")} aria-label={t("Precursor production route")} className={cn(cell, "min-w-[180px] flex-1")} />
            <label className="inline-flex flex-none items-center gap-1.5 text-[11.5px] text-black/55">
              <input
                type="checkbox"
                disabled={!editable}
                checked={n.isScrap}
                onChange={(e) => patch(n.id, { isScrap: e.target.checked, seeDeclared: e.target.checked ? 0 : n.seeDeclared })}
                className="h-3.5 w-3.5 accent-[#111]"
              />
              {t("Scrap / waste")}
            </label>
            {editable && (
              <>
                <button type="button" onClick={() => addTier(n.id)} className="flex-none text-[11px] text-black/40 hover:text-black">
                  {t("+ Add input")}
                </button>
                <RemoveRow onClick={() => remove(n.id)} label={t("Remove this precursor and everything under it")} />
              </>
            )}
          </div>

          {n.isScrap && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-black/40">
              {t("Scrap carries an embedded emission factor of exactly 0 under CBAM — the figure is locked, not withheld.")}
            </p>
          )}
          {scrapHint && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#b45309]">
              {t("This looks like scrap. If it is, tick the box — scrap must be declared at 0, and leaving a figure on it overstates your own emissions.")}
            </p>
          )}
          {derived && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-black/40">
              Derived from the {n.children.length} input{n.children.length === 1 ? "" : "s"} below.
            </p>
          )}
        </div>
        {n.children.length > 0 && <div className="mt-2 space-y-2">{n.children.map((c) => renderNode(c, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {legacyText && (
        <div className="rounded-lg border border-[#d97706]/30 bg-[#fffbeb] px-3 py-2 text-[11.5px] leading-relaxed text-[#92400e]">
          Previously entered as free text: “{legacyText.slice(0, 160)}{legacyText.length > 160 ? "…" : ""}”. Re-enter it as rows below — free text can’t be calculated or sent to the Registry.
        </div>
      )}
      {roots.map((n) => renderNode(n, 1))}
      {editable && (
        <button type="button" onClick={addRoot} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-black/15 px-3 py-1.5 text-[11.5px] text-black/55 hover:border-black/30 hover:text-black">
          {t("+ Add precursor")}
        </button>
      )}
      {treeError && (
        <p className="rounded-lg border border-[#dc2626]/30 bg-[#fef2f2] px-3 py-2 text-[11.5px] leading-relaxed text-[#dc2626]">{treeError}</p>
      )}
      {roots.length > 0 && total != null && (
        <p className="text-right font-mono text-[11px] text-black/40">precursor contribution: {total.toFixed(4)} tCO₂e/t</p>
      )}
    </div>
  );
}

/* ── Supplier-side activity data ───────────────────────────────
   The optional field that changes what a submission IS. Instead of "our
   embedded emissions are 0.42", a supplier who fills this in says "we burned
   148,800 m³ of gas at this calorific value and drew 4,725 MWh, over 10,500
   tonnes of output" — and the figure becomes something the exporter and the
   verifier can both recompute.

   Deliberately a compact subset of the exporter's own activity screen
   (app/(portal)/declarations/[id]/activity): same shapes, same units, same
   refusal to guess an NCV. Provenance is collected at the row level here
   rather than per input, because a supplier filling this in on a phone at a
   mill will abandon a six-field sub-form and a half-filled provenance is
   worse than an honest one. */
type SupplierActivity = {
  fuels: { id: string; fuel: FuelKind; quantity: number; unit: FuelUnit; ncv?: number; emissionFactor: number; source: ProvenanceSource; reference: string }[];
  electricity: { id: string; mwhAbsolute: number; emissionFactor: number; source: ProvenanceSource; reference: string }[];
  process: { id: string; material: string; massTonnes: number; carbonContent: number; source: ProvenanceSource; reference: string }[];
};

const emptyActivity = (): SupplierActivity => ({ fuels: [], electricity: [], process: [] });

function parseActivity(raw: string): SupplierActivity {
  if (!raw.trim().startsWith("{")) return emptyActivity();
  try {
    const v = JSON.parse(raw) as Partial<SupplierActivity>;
    return {
      fuels: Array.isArray(v.fuels) ? v.fuels : [],
      electricity: Array.isArray(v.electricity) ? v.electricity : [],
      process: Array.isArray(v.process) ? v.process : [],
    };
  } catch {
    return emptyActivity();
  }
}

const rowId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

function SupplierActivityEditor({
  value,
  editable,
  onChange,
  outputTonnes,
}: {
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
  outputTonnes: number | null;
}) {
  const t = useT();
  const data = React.useMemo(() => parseActivity(value), [value]);
  const commit = (next: SupplierActivity) =>
    onChange(next.fuels.length || next.electricity.length || next.process.length ? JSON.stringify(next) : "");

  const cell = cn(inputClass, "px-2.5 py-2 text-[12.5px]", !editable && "cursor-not-allowed opacity-60");
  const n = (v: string) => Number(v) || 0;

  /* The whole point: what these inputs actually come to. Computed with the
     same guards the engine uses, so a missing NCV shows as a blocked row here
     rather than as a wrong number later. */
  let directTCO2 = 0;
  let blocked = 0;
  for (const f of data.fuels) {
    try {
      directTCO2 += toGJ(f.quantity, f.unit, f.ncv) * f.emissionFactor;
    } catch {
      blocked += 1;
    }
  }
  for (const p of data.process) directTCO2 += p.massTonnes * p.carbonContent * CO2_PER_C.value;
  const indirectTCO2 = data.electricity.reduce((a, e) => a + e.mwhAbsolute * e.emissionFactor, 0);
  const anyRows = data.fuels.length + data.electricity.length + data.process.length > 0;

  const sourceSelect = (v: ProvenanceSource, set: (s: ProvenanceSource) => void) => (
    <Select
      value={v}
      onChange={(x) => set(x as ProvenanceSource)}
      options={PROVENANCE_SOURCES.map((s) => ({ value: s, label: PROVENANCE_LABEL[s] }))}
      ariaLabel={t("Where this figure came from")}
      className="w-full"
    />
  );

  return (
    <div className="space-y-3">
      <p className="text-[11.5px] leading-relaxed text-black/45">
        {t("Optional — but a figure you can show the workings for is worth far more than one you cannot. Enter what the installation consumed over the whole reporting period; Certrace divides by your output to get the per-tonne figure.")}
      </p>

      {/* Fuels */}
      <div className="rounded-xl border border-black/[0.07] bg-[#fafaf8] p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{t("Fuel burned")}</span>
          {editable && (
            <button
              type="button"
              onClick={() => commit({ ...data, fuels: [...data.fuels, { id: rowId("f"), fuel: "natural_gas", quantity: 0, unit: "m3", emissionFactor: 0, source: "invoice", reference: "" }] })}
              className="text-[11px] text-black/45 hover:text-black"
            >
              {t("+ Add fuel")}
            </button>
          )}
        </div>
        {data.fuels.map((f, i) => {
          const patch = (p: Partial<(typeof data.fuels)[number]>) =>
            commit({ ...data, fuels: data.fuels.map((x, ix) => (ix === i ? { ...x, ...p } : x)) });
          let gjError: string | null = null;
          try {
            toGJ(f.quantity, f.unit, f.ncv);
          } catch (err) {
            gjError = err instanceof UnitError ? err.message : "Cannot convert to energy.";
          }
          return (
            <div key={f.id} className="mb-2 last:mb-0">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.1fr_0.8fr_0.6fr_0.8fr_0.9fr]">
                <Select value={f.fuel} onChange={(v) => patch({ fuel: v as FuelKind })} options={FUEL_KINDS.map((k) => ({ value: k, label: FUEL_LABEL[k] }))} ariaLabel={t("Fuel")} className="w-full" />
                <input disabled={!editable} type="number" min={0} step="any" value={f.quantity || ""} onChange={(e) => patch({ quantity: n(e.target.value) })} placeholder={t("Quantity")} aria-label={t("Fuel quantity")} className={cell} />
                <Select value={f.unit} onChange={(v) => patch({ unit: v as FuelUnit })} options={FUEL_UNITS.map((u) => ({ value: u, label: FUEL_UNIT_LABEL[u] }))} ariaLabel={t("Unit")} className="w-full" />
                <input disabled={!editable || !needsNcv(f.unit)} type="number" min={0} step="any" value={f.ncv ?? ""} onChange={(e) => patch({ ncv: e.target.value === "" ? undefined : n(e.target.value) })} placeholder={needsNcv(f.unit) ? "NCV" : "—"} aria-label={t("Net calorific value")} className={cell} />
                <input disabled={!editable} type="number" min={0} step="any" value={f.emissionFactor || ""} onChange={(e) => patch({ emissionFactor: n(e.target.value) })} placeholder={t("tCO₂/GJ")} aria-label={t("Emission factor")} className={cell} />
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                {sourceSelect(f.source, (s) => patch({ source: s }))}
                <input disabled={!editable} value={f.reference} onChange={(e) => patch({ reference: e.target.value })} placeholder={t("Invoice no. / meter id")} aria-label={t("Reference")} className={cell} />
                {editable && (
                  <RemoveRow onClick={() => commit({ ...data, fuels: data.fuels.filter((_, ix) => ix !== i) })} label={`Remove fuel ${i + 1}`} />
                )}
              </div>
              {gjError && <p className="mt-1 text-[11px] leading-relaxed text-[#dc2626]">{gjError}</p>}
              {f.source === "ASSUMPTION" && (
                <p className="mt-1 text-[11px] leading-relaxed text-[#b45309]">{t("Declared as an assumption — it will appear in the assumptions register a verifier reads.")}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Electricity */}
      <div className="rounded-xl border border-black/[0.07] bg-[#fafaf8] p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{t("Electricity drawn (total MWh)")}</span>
          {editable && (
            <button
              type="button"
              onClick={() => commit({ ...data, electricity: [...data.electricity, { id: rowId("e"), mwhAbsolute: 0, emissionFactor: 0, source: "invoice", reference: "" }] })}
              className="text-[11px] text-black/45 hover:text-black"
            >
              {t("+ Add meter")}
            </button>
          )}
        </div>
        {data.electricity.map((e, i) => {
          const patch = (p: Partial<(typeof data.electricity)[number]>) =>
            commit({ ...data, electricity: data.electricity.map((x, ix) => (ix === i ? { ...x, ...p } : x)) });
          return (
            <div key={e.id} className="mb-2 last:mb-0">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
                <input disabled={!editable} type="number" min={0} step="any" value={e.mwhAbsolute || ""} onChange={(ev) => patch({ mwhAbsolute: n(ev.target.value) })} placeholder={t("MWh (period)")} aria-label={t("Electricity, absolute MWh")} className={cell} />
                <input disabled={!editable} type="number" min={0} step="any" value={e.emissionFactor || ""} onChange={(ev) => patch({ emissionFactor: n(ev.target.value) })} placeholder={t("tCO₂/MWh")} aria-label={t("Grid emission factor")} className={cell} />
                {sourceSelect(e.source, (s) => patch({ source: s }))}
                <input disabled={!editable} value={e.reference} onChange={(ev) => patch({ reference: ev.target.value })} placeholder={t("Bill reference / dataset")} aria-label={t("Reference")} className={cell} />
                {editable && (
                  <RemoveRow onClick={() => commit({ ...data, electricity: data.electricity.filter((_, ix) => ix !== i) })} label={`Remove electricity row ${i + 1}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Process materials */}
      <div className="rounded-xl border border-black/[0.07] bg-[#fafaf8] p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{t("Process materials")}</span>
          {editable && (
            <button
              type="button"
              onClick={() => commit({ ...data, process: [...data.process, { id: rowId("p"), material: "", massTonnes: 0, carbonContent: 1, source: "erp", reference: "" }] })}
              className="text-[11px] text-black/45 hover:text-black"
            >
              {t("+ Add material")}
            </button>
          )}
        </div>
        {data.process.map((p, i) => {
          const patch = (x: Partial<(typeof data.process)[number]>) =>
            commit({ ...data, process: data.process.map((y, iy) => (iy === i ? { ...y, ...x } : y)) });
          return (
            <div key={p.id} className="mb-2 last:mb-0">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.3fr_0.8fr_0.8fr_1fr_auto]">
                <input disabled={!editable} value={p.material} onChange={(e) => patch({ material: e.target.value })} placeholder={t("e.g. graphite electrode")} aria-label={t("Material")} className={cell} />
                <input disabled={!editable} type="number" min={0} step="any" value={p.massTonnes || ""} onChange={(e) => patch({ massTonnes: n(e.target.value) })} placeholder={t("Mass (t)")} aria-label={t("Mass in tonnes")} className={cell} />
                <input disabled={!editable} type="number" min={0} max={1} step="any" value={p.carbonContent} onChange={(e) => patch({ carbonContent: n(e.target.value) })} placeholder={t("C fraction")} aria-label={t("Carbon content")} className={cell} />
                {sourceSelect(p.source, (s) => patch({ source: s }))}
                {editable && (
                  <RemoveRow onClick={() => commit({ ...data, process: data.process.filter((_, ix) => ix !== i) })} label={`Remove process material ${i + 1}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {anyRows && (
        <div className="rounded-xl border border-black/[0.07] bg-white px-3 py-2.5 font-mono text-[11.5px] text-black/55">
          direct {directTCO2.toFixed(2)} tCO₂ · indirect {indirectTCO2.toFixed(2)} tCO₂
          {outputTonnes && outputTonnes > 0 ? (
            <>
              {" → "}
              <span className="text-black/80">
                {(directTCO2 / outputTonnes).toFixed(4)} + {(indirectTCO2 / outputTonnes).toFixed(4)} tCO₂e/t
              </span>{" "}
              over {outputTonnes.toLocaleString("en-US")} t
            </>
          ) : (
            <span className="font-sans text-[#b45309]"> {t("· enter your output in Production to get the per-tonne figure")}</span>
          )}
          {blocked > 0 && <span className="font-sans text-[#dc2626]"> · {blocked} row{blocked === 1 ? "" : "s"} blocked on a missing NCV</span>}
        </div>
      )}
    </div>
  );
}

function AssignChip({ section }: { section: SupplierSection }) {
  const { state, setView } = useSupplier();
  const seat = state.seats.find((s) => s.sections.includes(section.key));
  return (
    <button
      onClick={() => setView("team")}
      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-black/45 hover:border-black/25 hover:text-black"
    >
      <Users size={11} strokeWidth={1.5} />
      {seat ? `${seat.name.split(" ")[0]} · ${seat.department}` : section.department}
    </button>
  );
}

function SectionCard({ section, productId }: { section: SupplierSection; productId?: string }) {
  const { req, sectionProgress } = useSupplier();
  // Show every field in the section's groups — auto-derived ones (CN, category,
  // quantity, total) render locked for context; the rest are editable inputs.
  // Per-product sections only show the fields that apply to THAT good, with
  // required-ness resolved against it (precursors → complex goods only,
  // electricity detail mandatory only for aluminium).
  const product = productId ? req.products.find((rp) => rp.product.id === productId)?.product : undefined;
  const shown = req.fields
    .filter((f) => section.groups.includes(f.group) && (!product || fieldAppliesTo(f, product)))
    .map((f) => (product ? { ...f, required: fieldRequiredFor(f, product) } : f));
  const Icon = SECTION_ICON[section.key] ?? Info;
  const prog = section.scope === "once" ? sectionProgress(section) : null;

  if (shown.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-black/[0.08] bg-white text-black/55">
            <Icon size={15} strokeWidth={1.5} />
          </span>
          <div>
            <div className="text-[15px] text-black/80">{section.label}</div>
            <div className="text-[11px] text-black/40">{section.blurb}</div>
          </div>
        </div>
        <AssignChip section={section} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {shown.map((f) => (
          <div key={f.id} className={f.id === "inst-address" || f.id === "precursors" ? "sm:col-span-2" : ""}>
            <FieldControl field={f} productId={productId} />
          </div>
        ))}
      </div>
      {prog && prog.total > 0 && (
        <div className="mt-3 text-right font-mono text-[11px] text-black/35">
          {prog.done}/{prog.total} filled
        </div>
      )}
    </Card>
  );
}

export function FormView() {
  const t = useT();
  const { req, sections, state, setView, flagged, firstFlagKey, focusField, focusRevision } = useSupplier();
  const productSections = sections.filter((s) => s.scope === "product");
  const installation = sections.find((s) => s.key === "installation");
  const tailOnce = sections.filter((s) => s.key === "carbon" || s.key === "verification");

  // Open AI issues still needing attention (a filled-in "missing" no longer counts).
  const issueCount = React.useMemo(
    () => [...flagged].filter(([k, f]) => !(f.kind === "missing" && state.values[k]?.trim())).length,
    [flagged, state.values],
  );
  const isRevision = state.status === "revision_requested";

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{req.regulationShort} questionnaire</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">{t("Your carbon data")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-black/50">
          Generated from exactly what {req.exporterName} needs for {req.regulationShort}. The greyed fields are locked context they provided — you fill the rest. Everything saves as you type.
        </p>
      </div>

      {isRevision && (
        <Card className="border-[#2563eb]/30 bg-[#eff6ff] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#dbeafe] text-[#2563eb]">
              <PenLine size={15} strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-black/65">
              <span className="text-black/80">{t("Revision requested.")}</span> Only the {state.unlocked.length} field{state.unlocked.length === 1 ? "" : "s"} {req.exporterName} flagged are editable — they’re outlined in blue below. Everything else stays locked from your last submission.
              <p className="mt-1.5 text-black/55">“{state.revisionNote}”</p>
              {firstFlagKey && (
                <Button size="sm" className="mt-3" onClick={focusRevision}>
                  {t("Take me to the field")} <ArrowDown size={13} strokeWidth={1.5} />
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {!isRevision && issueCount > 0 && firstFlagKey && (
        <Card className="border-[#d97706]/30 bg-[#fffbeb] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#fef3c7] text-[#b45309]">
              <TriangleAlert size={15} strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-black/65">
              <span className="text-black/80">The quality check flagged {issueCount} field{issueCount === 1 ? "" : "s"}.</span> {t("They’re outlined below with a note on what to check. Fix them and re-run the check before you sign.")}
              <Button size="sm" className="mt-3" onClick={() => focusField(firstFlagKey)}>
                {t("Jump to first flagged field")} <ArrowDown size={13} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {installation && <SectionCard section={installation} />}

      {productSections.length > 0 &&
        req.products.map((rp) => (
          <div key={rp.product.id} className="space-y-3">
            <div className="flex items-center gap-2 pt-1">
              <span className="font-[family-name:var(--font-plex)] text-lg font-light text-[#111]">{rp.product.name}</span>
              <span className="font-mono text-[11px] text-black/35">CN {rp.product.cnCode}</span>
              <span className="ml-auto font-mono text-[11px] text-black/35">{rp.totalTonnes.toLocaleString("en-US")} t · {rp.lots.length} lot{rp.lots.length === 1 ? "" : "s"}</span>
            </div>
            {productSections.map((s) => (
              <SectionCard key={s.key} section={s} productId={rp.product.id} />
            ))}
          </div>
        ))}

      {tailOnce.map((s) => (
        <SectionCard key={s.key} section={s} />
      ))}

      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-[#f5f4f0]/90 px-1 py-4 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => setView("overview")}>
          {t("Back to overview")}
        </Button>
        <Button size="sm" onClick={() => setView("documents")}>
          {t("Continue to documents")} <ArrowRight size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

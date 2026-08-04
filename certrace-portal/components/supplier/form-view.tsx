"use client";

/* The regulation-specific questionnaire (flow step 1). Generated entirely from
   the request's resolved CBAM fields — installation-level sections are filled
   once, goods/emissions sections repeat per product. Exporter-supplied context
   (CN code, category, quantity) is locked and shown read-only; the supplier
   fills the rest. Saves automatically. During a revision only unlocked fields
   are editable. */

import * as React from "react";
import { ArrowRight, ArrowDown, Lock, Info, Building2, FlaskConical, Zap, Boxes, Coins, BadgeCheck, Users, TriangleAlert, PenLine } from "lucide-react";
import { Card, Button, Eyebrow, inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { useSupplier, type FieldFlag } from "./context";
import { AUTO_FIELDS, valueKey, fieldAppliesTo, fieldRequiredFor, type SupplierSection } from "@/lib/supplier";
import { isElectrolysisGood, type ResolvedCbamField } from "@/lib/config";
import { parsePrecursors, serializePrecursors, emptyPrecursorRow, precursorContributionExact, type PrecursorRow } from "@/lib/precursors";
import { formatDecimal } from "@/lib/workflow-measurements";
import { PlantMrvEditor } from "./plant-mrv-editor";
import { classifyCnCode } from "@/lib/mrv";

/* How a flagged field's stroke + inline note look. `ring` is the resting stroke;
   `ringStrong` is the brief pulse when the supplier is led to the field. */
const FLAG_STYLE: Record<FieldFlag["severity"], { ring: string; ringStrong: string; text: string; tag: string; icon: React.ElementType }> = {
  critical: { ring: "ring-2 ring-[#dc2626]/40", ringStrong: "ring-4 ring-[#dc2626]/60", text: "text-[#dc2626]", tag: "Quality check", icon: TriangleAlert },
  warning: { ring: "ring-2 ring-[#d97706]/40", ringStrong: "ring-4 ring-[#d97706]/60", text: "text-[#b45309]", tag: "Quality check", icon: TriangleAlert },
  revision: { ring: "ring-2 ring-[#2563eb]/40", ringStrong: "ring-4 ring-[#2563eb]/55", text: "text-[#2563eb]", tag: "Exporter", icon: PenLine },
};

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

const NUMERIC = new Set(["direct-emissions", "indirect-emissions", "elec-consumed", "elec-factor", "carbon-price", "production-activity"]);
const UNIT: Record<string, string> = {
  "direct-emissions": "tCO₂e/t",
  "indirect-emissions": "tCO₂e/t",
  "elec-consumed": "MWh/t",
  "elec-factor": "TCO2E_PER_MWH",
  "carbon-price": "/ tCO₂e",
  "production-activity": "TNE",
};
const SELECTS: Record<string, { value: string; label: string }[]> = {
  method: [
    { value: "actual", label: "Actual installation data" },
    { value: "default", label: "Default values" },
  ],
  "emissions-method": [
    { value: "STANDARD_CALCULATION", label: "Calculation-based" },
    { value: "MASS_BALANCE", label: "Mass balance" },
    { value: "CEMS", label: "Continuous emissions monitoring (CEMS)" },
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
  electricity: Zap,
  precursors: Boxes,
  carbon: Coins,
  verification: BadgeCheck,
};

function FieldControl({ field, productId }: { field: ResolvedCbamField; productId?: string }) {
  const { req, state, getValue, setValue, isEditable, autoValue, flagged, focusKey, clearFocus } = useSupplier();
  const auto = autoValue(field.id, productId);
  const key = valueKey(field.id, productId);
  const workflowEditable = isEditable(key);
  const value = getValue(field.id, productId);
  const calculationDerived = Boolean(productId) && (field.id === "direct-emissions" || field.id === "indirect-emissions") && getValue("method", productId) !== "default";
  const editable = workflowEditable && !calculationDerived;
  const methodConditionalRequired = Boolean(productId) && (
    (field.id === "plant-mrv" && getValue("method", productId) !== "default") ||
    (field.id === "default-value-reference" && getValue("method", productId) === "default")
  );

  // Flag (deterministic check or revision request). A "missing" flag clears the moment the
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
  if (AUTO_FIELDS.has(field.id)) {
    return (
      <div ref={ref} className="scroll-mt-28">
        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-black/45">
          {field.label} <Lock size={10} strokeWidth={1.5} className="text-black/30" />
        </span>
        <div className={ringCls}>
          <div className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#faf9f7] px-4 py-3 text-sm text-black/60">
            <span className="font-mono">{auto || "—"}</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-black/30">auto</span>
          </div>
        </div>
        {flag && <FlagNote severity={flag.severity} message={flag.message} />}
      </div>
    );
  }

  const label = (
    <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-black/55">
      {field.label}
      {!field.required && !methodConditionalRequired && <span className="text-[9px] tracking-[0.1em] text-black/30">optional</span>}
      {methodConditionalRequired && <span className="text-[9px] tracking-[0.1em] text-[#b45309]">required for selected method</span>}
      {!editable && <Lock size={10} strokeWidth={1.5} className="text-black/30" />}
    </span>
  );

  let control: React.ReactNode;
  if (field.id === "process-route" && productId) {
    const requestProduct = req.products.find((candidate) => candidate.product.id === productId);
    const regulatoryProduct = requestProduct ? classifyCnCode(requestProduct.product.cnCode) : null;
    const options = (regulatoryProduct?.productionRoutes ?? []).map((route) => ({ value: route, label: route.replaceAll("_", " ") }));
    control = (
      <Select
        value={value}
        onChange={(selection) => setValue(field.id, productId, selection)}
        options={options}
        placeholder={options.length > 0 ? "Select regulatory production route" : "CN classification required"}
        className="w-full"
        ariaLabel={field.label}
        disabled={!editable || options.length === 0}
      />
    );
  } else if (field.id === "installation-reference") {
    const options = [
      { value: "primary", label: `${state.profile?.installationName || getValue("inst-name") || "Primary installation"} (primary)` },
      ...(state.profile?.additionalInstallations ?? []).map((installation) => ({ value: installation.id, label: installation.name || installation.id })),
    ];
    control = (
      <Select
        value={value}
        onChange={(selection) => setValue(field.id, productId, selection)}
        options={options}
        placeholder="Select installation"
        className="w-full"
        ariaLabel={field.label}
        disabled={!editable}
      />
    );
  } else if (field.id === "plant-mrv" && productId) {
    const requestProduct = req.products.find((candidate) => candidate.product.id === productId);
    const selectedMethod = (getValue("emissions-method", productId) || "STANDARD_CALCULATION") as "STANDARD_CALCULATION" | "MASS_BALANCE" | "CEMS";
    control = getValue("method", productId) === "default" ? (
      <div className="rounded-xl border border-black/[0.06] bg-[#fafaf8] px-4 py-3 text-[12px] text-black/50">
        Plant monitoring inputs are not used while Commission default values are selected. Any saved draft inputs remain local and will be validated if you switch back to actual data.
      </div>
    ) : requestProduct ? (
      <PlantMrvEditor
        raw={value}
        method={selectedMethod}
        productionActivityTne={getValue("production-activity", productId)}
        productId={productId}
        installationId={getValue("installation-reference", productId)}
        isElectrolysis={isElectrolysisGood(requestProduct.product)}
        editable={workflowEditable}
        onChange={(next) => setValue(field.id, productId, next)}
      />
    ) : null;
  } else if (SELECTS[field.id]) {
    control = (
      <Select
        value={value}
        onChange={(v) => setValue(field.id, productId, v)}
        options={SELECTS[field.id]}
        placeholder="Select…"
        className="w-full"
        ariaLabel={field.label}
        disabled={!editable}
      />
    );
  } else if (field.id === "precursors") {
    control = (
      <PrecursorEditor
        value={value}
        editable={editable}
        reportingPeriod={req.period}
        onChange={(v) => setValue(field.id, productId, v)}
      />
    );
  } else if (["precursor-route", "inst-address", "system-boundary", "excluded-activities", "data-gap-methodology", "control-activities"].includes(field.id)) {
    control = (
      <textarea
        disabled={!editable}
        value={value}
        onChange={(e) => setValue(field.id, productId, e.target.value)}
        placeholder={field.hint}
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
        placeholder={field.hint}
        className={cn(inputClass, !editable && "cursor-not-allowed opacity-60")}
      />
    );
  }

  return (
    <div ref={ref} className="scroll-mt-28">
      {field.id === "plant-mrv" || field.id === "precursors" ? (
        <div className="block">
          {label}
          <div className={ringCls}>{control}</div>
          {!flag && <span className="mt-1 block text-[11px] text-black/35">{field.hint}</span>}
        </div>
      ) : (
        <label className="block">
          {label}
          <div className={ringCls}>{control}</div>
          {!flag && <span className="mt-1 block text-[11px] text-black/35">{field.hint}</span>}
        </label>
      )}
      {flag && <FlagNote severity={flag.severity} message={flag.message} />}
    </div>
  );
}

/* ── Structured precursor rows ─────────────────────────────────
   Each relevant precursor is a row: material, CN code, tonnes consumed per
   tonne of the good, its embedded emissions, and its route. The rows are the
   ONLY calculable form — the good's total embedded emissions derive from them
   (own direct + own indirect + Σ qty × SEE). Legacy free-text entries are
   shown for reference and replaced the moment rows are saved. */
function PrecursorEditor({ value, editable, reportingPeriod, onChange }: { value: string; editable: boolean; reportingPeriod: string; onChange: (v: string) => void }) {
  const rows = React.useMemo(() => parsePrecursors(value) ?? [], [value]);
  const legacyText = value.trim() && parsePrecursors(value) === null ? value : null;
  const contribution = React.useMemo(() => {
    try {
      return precursorContributionExact(serializePrecursors(rows), reportingPeriod);
    } catch {
      return null;
    }
  }, [rows, reportingPeriod]);

  const patch = (i: number, p: Partial<PrecursorRow>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...p } : r));
    onChange(serializePrecursors(next));
  };
  const addRow = () => onChange(serializePrecursors([...rows, emptyPrecursorRow()]));
  const removeRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next.length ? serializePrecursors(next) : "");
  };

  const cell = cn(inputClass, "px-2.5 py-2 text-[12.5px]", !editable && "cursor-not-allowed opacity-60");

  return (
    <div className="space-y-2">
      {legacyText && (
        <div className="rounded-lg border border-[#d97706]/30 bg-[#fffbeb] px-3 py-2 text-[11.5px] leading-relaxed text-[#92400e]">
          Previously entered as free text: “{legacyText.slice(0, 160)}{legacyText.length > 160 ? "…" : ""}”. Re-enter it as rows below so the draft calculation and manual-entry worksheet can map it deterministically.
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className="rounded-xl border border-black/[0.07] bg-[#fafaf8] p-2.5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr]">
            <input disabled={!editable} value={r.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder="Material, e.g. Steel billet" aria-label="Precursor material" className={cell} />
            <input disabled={!editable} value={r.cn} onChange={(e) => patch(i, { cn: e.target.value })} placeholder="CN code" aria-label="Precursor CN code" className={cell} />
            <div className="space-y-1">
              <input type="number" min={0} step="any" disabled={!editable} value={r.qty} onChange={(e) => patch(i, { qty: e.target.value })} placeholder="Quantity ratio" aria-label="Precursor quantity per tonne of this good" className={cn(cell, "w-full")} />
              <Select
                value={r.qtyUnit}
                onChange={(unit) => patch(i, { qtyUnit: unit as PrecursorRow["qtyUnit"] })}
                options={[
                  { value: "TNE_PER_TNE", label: "TNE_PER_TNE (t/t)" },
                  { value: "KGM_PER_TNE", label: "KGM_PER_TNE (kg/t)" },
                ]}
                className="w-full"
                ariaLabel="Precursor quantity unit"
                disabled={!editable}
              />
            </div>
            <div className="relative">
              <input type="number" min={0} step="any" disabled={!editable} value={r.see} onChange={(e) => patch(i, { see: e.target.value })} placeholder="0.00" aria-label="Embedded emissions of the precursor" className={cn(cell, "pr-14 w-full")} />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-black/35">tCO₂e/t</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input disabled={!editable} value={r.route} onChange={(e) => patch(i, { route: e.target.value })} placeholder="Production route of this precursor (optional)" aria-label="Precursor production route" className={cn(cell, "flex-1")} />
            {editable && (
              <button type="button" onClick={() => removeRow(i)} aria-label="Remove precursor row" className="flex-none text-[11px] text-black/40 hover:text-[#dc2626]">
                Remove
              </button>
            )}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Select
              value={r.method}
              onChange={(method) => patch(i, { method: method as PrecursorRow["method"] })}
              options={[{ value: "actual", label: "Actual precursor value" }, { value: "default", label: "Default precursor value" }]}
              className="w-full"
              ariaLabel="Precursor value method"
              disabled={!editable}
            />
            {r.method === "default" && (
              <Select
                value={r.defaultValueBasis}
                onChange={(basis) => patch(i, { defaultValueBasis: basis as PrecursorRow["defaultValueBasis"] })}
                options={[
                  { value: "published_includes_markup", label: "Published final value (markup included)" },
                  { value: "unmarked_base", label: "Unmarked base (apply reporting-year markup)" },
                ]}
                className="w-full"
                ariaLabel="Default precursor value basis"
                disabled={!editable}
              />
            )}
            {r.method === "actual" && (
              <input
                disabled={!editable}
                value={r.verificationReference}
                onChange={(event) => patch(i, { verificationReference: event.target.value })}
                placeholder="Verifier report reference (reference only)"
                aria-label="Precursor verifier report reference"
                className={cell}
              />
            )}
          </div>
          {r.method === "actual" && (
            <p className="mt-1.5 text-[10.5px] text-black/35">A typed reference does not make the value verified; an accredited report remains required.</p>
          )}
        </div>
      ))}
      {editable && (
        <button type="button" onClick={addRow} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-black/15 px-3 py-1.5 text-[11.5px] text-black/55 hover:border-black/30 hover:text-black">
          + Add precursor
        </button>
      )}
      {rows.length > 0 && contribution !== null && (
        <p className="text-right font-mono text-[11px] text-black/40">
          precursor contribution: {formatDecimal(contribution)} TCO2E_PER_TNE
        </p>
      )}
      {rows.length > 0 && contribution === null && (
        <p className="text-right text-[11px] text-[#b45309]">Complete the reporting year and default basis before a deterministic contribution can be shown.</p>
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
          <div key={f.id} className={f.id === "inst-address" || f.id === "precursors" || f.id === "plant-mrv" ? "sm:col-span-2" : ""}>
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
  const { req, sections, state, setView, flagged, firstFlagKey, focusField, focusRevision } = useSupplier();
  const productSections = sections.filter((s) => s.scope === "product");
  const installation = sections.find((s) => s.key === "installation");
  const tailOnce = sections.filter((s) => s.key === "carbon" || s.key === "verification");

  // Open validation issues still needing attention (a filled-in "missing" no longer counts).
  const issueCount = React.useMemo(
    () => [...flagged].filter(([k, f]) => !(f.kind === "missing" && state.values[k]?.trim())).length,
    [flagged, state.values],
  );
  const isRevision = state.status === "revision_requested";

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{req.regulationShort} questionnaire</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">Your carbon data</h1>
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
              <span className="text-black/80">Revision requested.</span> Only the {state.unlocked.length} field{state.unlocked.length === 1 ? "" : "s"} {req.exporterName} flagged are editable — they’re outlined in blue below. Everything else stays locked from your last submission.
              <p className="mt-1.5 text-black/55">“{state.revisionNote}”</p>
              {firstFlagKey && (
                <Button size="sm" className="mt-3" onClick={focusRevision}>
                  Take me to the field <ArrowDown size={13} strokeWidth={1.5} />
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
              <span className="text-black/80">The quality check flagged {issueCount} field{issueCount === 1 ? "" : "s"}.</span> They’re outlined below with a note on what to check. Fix them and re-run the check before recording a local attestation.
              <Button size="sm" className="mt-3" onClick={() => focusField(firstFlagKey)}>
                Jump to first flagged field <ArrowDown size={13} strokeWidth={1.5} />
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
              <span className="ml-auto font-mono text-[11px] text-black/35">{formatDecimal(rp.commercialQuantityTonnes)} TNE · {rp.lots.length} lot{rp.lots.length === 1 ? "" : "s"}</span>
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
          Back to overview
        </Button>
        <Button size="sm" onClick={() => setView("documents")}>
          Continue to documents <ArrowRight size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

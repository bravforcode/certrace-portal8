/* ════════════════════════════════════════════════════════════
   AI AUTOMATIC QUALITY CHECK (flow step 2)

   Runs on the assembled submission just before the supplier signs. Four checks:
     • Completeness    — every required field + requested document present
     • Validation      — values are numeric, in range, internally consistent
     • Anomaly         — figures that are plausible but unusual (flagged, not blocked)
     • Standardization — units / formats normalised to the CBAM canonical form

   Critical findings BLOCK submission; warnings PASS THROUGH with a flag the
   supplier acknowledges. A data-quality score summarises the result.

   Deterministic mock engine — this is the seam where a real model call slots in.
   ════════════════════════════════════════════════════════════ */

import type { SupplierRequest, SectionKey } from "./supplier";
import { AUTO_FIELDS, valueKey, isOnceField, fieldAppliesTo, fieldRequiredFor, verificationRequired } from "./supplier";
import { parsePrecursors, precursorContribution, rowComplete } from "./precursors";
import { isComplexGood, type ProductCategory } from "./config";
import type { DocState } from "./supplier-store";

export type Severity = "critical" | "warning" | "pass";
export type Category = "Completeness" | "Validation" | "Anomaly" | "Standardization";

export type Finding = {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  detail: string;
  section?: SectionKey;
  productId?: string;
  fieldId?: string;
  docId?: string;
  fix?: string;
};

export type CheckResult = {
  findings: Finding[];
  score: number; // 0–100 data-quality score
  critical: number;
  warnings: number;
  passes: number;
  passable: boolean; // can the supplier submit? (no criticals)
  ranAt: number;
};

const num = (v: string | undefined) => {
  if (v == null || v.trim() === "") return NaN;
  return Number(v.replace(/,/g, ""));
};

/* Plausible OWN-PROCESS direct-emission bands per goods category (tCO₂e/t).
   The band must match the good being checked — flagging an aluminium smelter
   against "a realistic steel route" (the pre-fix behaviour) is noise for the
   supplier and cover for real errors. Downstream steps (rolling, extrusion)
   legitimately sit near the low end, so `low` is a soft nudge only. */
const DIRECT_BANDS: Record<ProductCategory, { low: number; high: number; hardMax: number; word: string }> = {
  "Iron & Steel": { low: 0.1, high: 2.8, hardMax: 6, word: "steel" },
  Aluminium: { low: 0.02, high: 2.2, hardMax: 5, word: "aluminium" },
};

/** First numeric token in a free-text electricity factor ("0.399 tCO₂/MWh — grid OM"). */
const factorNumber = (v: string | undefined): number => {
  const m = /-?\d+(?:\.\d+)?/.exec(v ?? "");
  return m ? Number(m[0]) : NaN;
};

export function runQualityCheck(req: SupplierRequest, values: Record<string, string>, docs: Record<string, DocState>): CheckResult {
  const findings: Finding[] = [];
  const push = (f: Omit<Finding, "id">) => findings.push({ id: `${f.category}-${findings.length}`, ...f });

  /* ── Completeness ─────────────────────────────────────────── */
  const verifRequired = verificationRequired(req, values);
  let missingRequired = 0;
  for (const f of req.fields) {
    if (AUTO_FIELDS.has(f.id)) continue;
    if (isOnceField(f.group)) {
      if (!f.required) continue;
      // verification relaxes to optional when every good is on default values
      if (f.id === "verification" && !verifRequired) continue;
      if (!values[valueKey(f.id)]?.trim()) {
        missingRequired++;
        push({ category: "Completeness", severity: "critical", title: `${f.label} is missing`, detail: `${f.group} · required by ${req.regulationShort}.`, fieldId: f.id, fix: "Fill this field in the questionnaire." });
      }
    } else {
      // Per-product: a field is only demanded of the goods it applies to —
      // precursors of complex goods, electricity detail of aluminium.
      for (const { product } of req.products) {
        if (!fieldAppliesTo(f, product) || !fieldRequiredFor(f, product)) continue;
        if (!values[valueKey(f.id, product.id)]?.trim()) {
          missingRequired++;
          push({ category: "Completeness", severity: "critical", title: `${f.label} missing for ${product.name}`, detail: `${f.group} · required per good.`, productId: product.id, fieldId: f.id, fix: "Fill this field for the product." });
        }
      }
    }
  }
  // Requested documents — missing required docs are warnings the supplier can
  // acknowledge (the data can still be reviewed), missing optional docs are noted.
  for (const d of req.documents) {
    const state = docs[d.id];
    if (!state || state.status !== "uploaded") {
      push({
        category: "Completeness",
        severity: "warning",
        title: `${d.label} not attached`,
        detail: d.required ? "Requested by the buyer — attach before the exporter reviews if you can." : "Optional — attach if available.",
        section: "documents",
        docId: d.id,
        fix: "Upload in the Documents section.",
      });
    }
  }
  if (missingRequired === 0) push({ category: "Completeness", severity: "pass", title: "All required fields present", detail: "Every CBAM-required data point has a value." });

  /* ── Validation + Anomaly + Standardization (per product) ─── */
  let nonTonneUnits = false;
  let defaultMethodUsed = false;
  for (const { product, lots } of req.products) {
    const band = DIRECT_BANDS[product.category] ?? DIRECT_BANDS["Iron & Steel"];
    const direct = num(values[valueKey("direct-emissions", product.id)]);
    const indirect = num(values[valueKey("indirect-emissions", product.id)]);
    const elec = num(values[valueKey("elec-consumed", product.id)]);
    const method = values[valueKey("method", product.id)] ?? "";
    const rawPrecursors = values[valueKey("precursors", product.id)];

    // Validation — numbers present & positive
    if (Number.isNaN(direct)) {
      push({ category: "Validation", severity: "critical", title: `Direct emissions not a number (${product.name})`, detail: "Enter specific direct emissions in tCO₂e per tonne.", productId: product.id, fieldId: "direct-emissions" });
    } else if (direct <= 0) {
      push({ category: "Validation", severity: "critical", title: `Direct emissions must be greater than zero (${product.name})`, detail: "A produced good cannot have zero direct emissions.", productId: product.id, fieldId: "direct-emissions" });
    } else if (direct > band.hardMax) {
      push({ category: "Validation", severity: "critical", title: `Direct emissions look impossibly high (${product.name})`, detail: `${direct} tCO₂e/t exceeds any realistic ${band.word} production route — check the unit and decimal point.`, productId: product.id, fieldId: "direct-emissions" });
    }
    // Indirect — same rigour as direct (a negative or nonsense value must never
    // silently shrink the total, which is exactly what happened pre-fix)
    if (values[valueKey("indirect-emissions", product.id)]?.trim()) {
      if (Number.isNaN(indirect)) {
        push({ category: "Validation", severity: "critical", title: `Indirect emissions not a number (${product.name})`, detail: "Enter specific indirect (electricity) emissions in tCO₂e per tonne.", productId: product.id, fieldId: "indirect-emissions" });
      } else if (indirect < 0) {
        push({ category: "Validation", severity: "critical", title: `Indirect emissions cannot be negative (${product.name})`, detail: `${indirect} tCO₂e/t is physically impossible — electricity use cannot remove emissions.`, productId: product.id, fieldId: "indirect-emissions" });
      }
    }
    if (values[valueKey("elec-consumed", product.id)]?.trim() && !Number.isNaN(elec) && elec < 0) {
      push({ category: "Validation", severity: "critical", title: `Electricity consumption cannot be negative (${product.name})`, detail: "MWh per tonne must be zero or more.", productId: product.id, fieldId: "elec-consumed" });
    }

    // Cross-check — indirect should reconcile with electricity × grid factor
    // when both are given (±35% tolerance covers PPAs and partial self-supply).
    const factor = factorNumber(values[valueKey("elec-factor", product.id)]);
    if (!Number.isNaN(elec) && elec > 0 && !Number.isNaN(factor) && factor > 0 && !Number.isNaN(indirect) && indirect >= 0) {
      const expected = elec * factor;
      if (expected > 0.05 && Math.abs(indirect - expected) / expected > 0.35) {
        push({ category: "Validation", severity: "warning", title: `Indirect emissions don't match electricity data (${product.name})`, detail: `Electricity ${elec} MWh/t × factor ${factor} ≈ ${expected.toFixed(2)} tCO₂e/t, but indirect reads ${indirect}. Explain the gap (PPA, self-generation) or correct one of them.`, productId: product.id, fieldId: "indirect-emissions" });
      }
    }

    // Precursors — structured rows are the only calculable form. A complex good
    // on ACTUAL data must carry at least one complete row; legacy prose is
    // flagged for restructuring, never silently accepted as a number.
    if (isComplexGood(product)) {
      const rows = parsePrecursors(rawPrecursors);
      if (rawPrecursors?.trim() && rows === null) {
        push({ category: "Validation", severity: "warning", title: `Precursors are free text (${product.name})`, detail: "Re-enter precursors as structured rows (material, quantity per tonne, embedded emissions) so they can be calculated and communicated.", productId: product.id, fieldId: "precursors" });
      }
      if (method !== "default") {
        const complete = (rows ?? []).filter(rowComplete);
        if (complete.length === 0) {
          push({ category: "Validation", severity: "critical", title: `Precursor breakdown missing (${product.name})`, detail: "A complex good on actual data must list each relevant precursor with quantity per tonne and its embedded emissions.", productId: product.id, fieldId: "precursors" });
        }
      }
      if (rows) {
        for (const r of rows) {
          if (!r.name.trim()) continue;
          if (!(Number(r.qty) > 0) || !(Number(r.see) > 0)) {
            push({ category: "Validation", severity: "critical", title: `Precursor "${r.name}" incomplete (${product.name})`, detail: "Each precursor row needs a positive quantity per tonne and positive embedded emissions.", productId: product.id, fieldId: "precursors" });
          }
        }
      }
    }

    // Internal consistency — total must equal own direct + own indirect +
    // precursor contribution (auto-derived; fails only on hand-edited stores).
    if (!Number.isNaN(direct) && !Number.isNaN(indirect)) {
      const total = num(values[valueKey("total-emissions", product.id)]);
      const expected = direct + indirect + (isComplexGood(product) ? precursorContribution(rawPrecursors) : 0);
      if (!Number.isNaN(total) && Math.abs(total - expected) > 0.05) {
        push({ category: "Validation", severity: "critical", title: `Total ≠ own emissions + precursors (${product.name})`, detail: `Total reads ${total} but own direct + own indirect + precursor contribution = ${expected.toFixed(2)} tCO₂e/t.`, productId: product.id, fieldId: "total-emissions" });
      }
    }

    // Anomaly — plausible but unusual
    if (!Number.isNaN(direct) && direct > 0 && direct <= band.hardMax) {
      if (direct > band.high) {
        push({ category: "Anomaly", severity: "warning", title: `Direct emissions above typical (${product.name})`, detail: `${direct} tCO₂e/t is high for a ${band.word} route (typical ${band.low}–${band.high}). Fine for the most carbon-intensive routes — just confirm.`, productId: product.id, fieldId: "direct-emissions" });
      }
      if (direct < band.low) {
        push({ category: "Anomaly", severity: "warning", title: `Direct emissions unusually low (${product.name})`, detail: `${direct} tCO₂e/t is below typical for ${band.word} — double-check scope and that all sources are counted.`, productId: product.id, fieldId: "direct-emissions" });
      }
    }
    if (method === "default") {
      defaultMethodUsed = true;
      push({ category: "Anomaly", severity: "warning", title: `Default factors used (${product.name})`, detail: "Actual installation data is preferred and reduces the importer's risk margin. Default values are accepted but flagged.", productId: product.id, fieldId: "method" });
    }

    // Standardization — units
    if (lots.some((l) => l.unit && l.unit !== "tonnes (t)")) nonTonneUnits = true;
  }

  if (!findings.some((f) => f.category === "Validation" && f.severity === "critical")) {
    push({ category: "Validation", severity: "pass", title: "Values pass validation", detail: "Emissions are numeric, positive and internally consistent." });
  }
  if (!findings.some((f) => f.category === "Anomaly" && f.severity !== "pass")) {
    push({ category: "Anomaly", severity: "pass", title: "No anomalies detected", detail: "Figures sit within expected ranges for the route." });
  }

  // Standardization — always normalise + report
  if (nonTonneUnits) {
    push({ category: "Standardization", severity: "warning", title: "Quantities converted to tonnes", detail: "Some lots were invoiced in other units — normalised to net mass (tonnes) for the CBAM calculation.", fix: "Confirm the conversion is correct." });
  } else {
    push({ category: "Standardization", severity: "pass", title: "Units standardised", detail: "Quantities in tonnes, emissions in tCO₂e per tonne — CBAM canonical form." });
  }

  /* ── Score ────────────────────────────────────────────────── */
  const critical = findings.filter((f) => f.severity === "critical").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const passes = findings.filter((f) => f.severity === "pass").length;
  const score = Math.max(0, Math.min(100, 100 - critical * 20 - warnings * 6));

  // Keep the unused signal explicit for the summary copy.
  void defaultMethodUsed;

  return { findings, score, critical, warnings, passes, passable: critical === 0, ranAt: Date.now() };
}

export const CATEGORIES: Category[] = ["Completeness", "Validation", "Anomaly", "Standardization"];
export const CATEGORY_BLURB: Record<Category, string> = {
  Completeness: "Every required field and requested document is present.",
  Validation: "Values are the right type, in range and internally consistent.",
  Anomaly: "Figures that are possible but unusual are flagged for a second look.",
  Standardization: "Units and formats normalised to the CBAM canonical form.",
};

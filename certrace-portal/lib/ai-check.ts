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
import { AUTO_FIELDS, valueKey, isOnceField } from "./supplier";
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

// Plausible specific direct-emission bands for steel/iron (tCO₂e per tonne).
const STEEL_DIRECT_TYPICAL = { low: 0.3, high: 2.8, hardMax: 6 };

export function runQualityCheck(req: SupplierRequest, values: Record<string, string>, docs: Record<string, DocState>): CheckResult {
  const findings: Finding[] = [];
  const push = (f: Omit<Finding, "id">) => findings.push({ id: `${f.category}-${findings.length}`, ...f });

  /* ── Completeness ─────────────────────────────────────────── */
  let missingRequired = 0;
  for (const f of req.fields) {
    if (AUTO_FIELDS.has(f.id)) continue;
    if (!f.required) continue;
    if (isOnceField(f.group)) {
      if (!values[valueKey(f.id)]?.trim()) {
        missingRequired++;
        push({ category: "Completeness", severity: "critical", title: `${f.label} is missing`, detail: `${f.group} · required by ${req.regulationShort}.`, fieldId: f.id, fix: "Fill this field in the questionnaire." });
      }
    } else {
      for (const { product } of req.products) {
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
    const direct = num(values[valueKey("direct-emissions", product.id)]);
    const indirect = num(values[valueKey("indirect-emissions", product.id)]);
    const method = values[valueKey("method", product.id)] ?? "";

    // Validation — numbers present & positive
    if (Number.isNaN(direct)) {
      push({ category: "Validation", severity: "critical", title: `Direct emissions not a number (${product.name})`, detail: "Enter specific direct emissions in tCO₂e per tonne.", productId: product.id, fieldId: "direct-emissions" });
    } else if (direct <= 0) {
      push({ category: "Validation", severity: "critical", title: `Direct emissions must be greater than zero (${product.name})`, detail: "A produced good cannot have zero direct emissions.", productId: product.id, fieldId: "direct-emissions" });
    } else if (direct > STEEL_DIRECT_TYPICAL.hardMax) {
      push({ category: "Validation", severity: "critical", title: `Direct emissions look impossibly high (${product.name})`, detail: `${direct} tCO₂e/t exceeds any realistic steel route — check the unit and decimal point.`, productId: product.id, fieldId: "direct-emissions" });
    }

    // Internal consistency — total must equal direct + indirect (auto-derived, so
    // this only fails if a value was hand-edited inconsistently)
    if (!Number.isNaN(direct) && !Number.isNaN(indirect)) {
      const total = num(values[valueKey("total-emissions", product.id)]);
      const expected = direct + indirect;
      if (!Number.isNaN(total) && Math.abs(total - expected) > 0.05) {
        push({ category: "Validation", severity: "critical", title: `Total ≠ direct + indirect (${product.name})`, detail: `Total reads ${total} but direct + indirect = ${expected.toFixed(2)} tCO₂e/t.`, productId: product.id, fieldId: "total-emissions" });
      }
    }

    // Anomaly — plausible but unusual
    if (!Number.isNaN(direct) && direct > 0 && direct <= STEEL_DIRECT_TYPICAL.hardMax) {
      if (direct > STEEL_DIRECT_TYPICAL.high) {
        push({ category: "Anomaly", severity: "warning", title: `Direct emissions above typical (${product.name})`, detail: `${direct} tCO₂e/t is high for a Thai steel route (typical ${STEEL_DIRECT_TYPICAL.low}–${STEEL_DIRECT_TYPICAL.high}). Fine if it's an integrated BF-BOF mill — just confirm.`, productId: product.id, fieldId: "direct-emissions" });
      }
      if (direct < STEEL_DIRECT_TYPICAL.low) {
        push({ category: "Anomaly", severity: "warning", title: `Direct emissions unusually low (${product.name})`, detail: `${direct} tCO₂e/t is below typical — double-check scope and that all sources are counted.`, productId: product.id, fieldId: "direct-emissions" });
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

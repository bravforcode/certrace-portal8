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
import {
  AUTO_FIELDS,
  valueKey,
  isOnceField,
  fieldAppliesTo,
  fieldRequiredFor,
  verificationRequired,
} from "./supplier";
import { precursorContribution } from "./precursors";
import {
  parsePrecursorTree,
  seeForNode,
  flattenTree,
  nodeComplete,
  PrecursorTreeError,
} from "./cbam/precursor-tree";
import { isComplexGood, type ProductCategory } from "./config";
import { readElectricity } from "./cbam/electricity-migration";
import type { DocState } from "./supplier-store";

export type Severity = "critical" | "warning" | "pass";
export type Category =
  | "Completeness"
  | "Validation"
  | "Anomaly"
  | "Standardization";

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
const DIRECT_BANDS: Record<
  ProductCategory,
  { low: number; high: number; hardMax: number; word: string }
> = {
  "Iron & Steel": { low: 0.1, high: 2.8, hardMax: 6, word: "steel" },
  Aluminium: { low: 0.02, high: 2.2, hardMax: 5, word: "aluminium" },
  /* ASSUMPTION — bands for the three sectors added when the catalogue grew to
     the full CBAM scope. Wide on purpose, drawn from the spread of the
     published default values (Implementing Regulation (EU) 2025/2621, Annex I,
     direct emissions): they exist to catch unit errors, not to second-guess a
     plant. Narrow them once a sector has real submissions behind it. */
  Cement: { low: 0.2, high: 1.5, hardMax: 3, word: "cement" },
  Fertilisers: { low: 0.05, high: 3.5, hardMax: 8, word: "fertiliser" },
  Hydrogen: { low: 1, high: 14, hardMax: 25, word: "hydrogen" },
};

/** First numeric token in a free-text electricity factor ("0.399 tCO₂/MWh — grid OM"). */
const factorNumber = (v: string | undefined): number => {
  const m = /-?\d+(?:\.\d+)?/.exec(v ?? "");
  return m ? Number(m[0]) : NaN;
};

export function runQualityCheck(
  req: SupplierRequest,
  values: Record<string, string>,
  docs: Record<string, DocState>,
): CheckResult {
  const findings: Finding[] = [];
  const push = (f: Omit<Finding, "id">) =>
    findings.push({ id: `${f.category}-${findings.length}`, ...f });

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
        push({
          category: "Completeness",
          severity: "critical",
          title: `${f.label} is missing`,
          detail: `${f.group} · required by ${req.regulationShort}.`,
          fieldId: f.id,
          fix: "Fill this field in the questionnaire.",
        });
      }
    } else {
      // Per-product: a field is only demanded of the goods it applies to —
      // precursors of complex goods, electricity detail of aluminium.
      for (const { product } of req.products) {
        if (!fieldAppliesTo(f, product) || !fieldRequiredFor(f, product))
          continue;
        if (!values[valueKey(f.id, product.id)]?.trim()) {
          missingRequired++;
          push({
            category: "Completeness",
            severity: "critical",
            title: `${f.label} missing for ${product.name}`,
            detail: `${f.group} · required per good.`,
            productId: product.id,
            fieldId: f.id,
            fix: "Fill this field for the product.",
          });
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
        detail: d.required
          ? "Requested by the buyer — attach before the exporter reviews if you can."
          : "Optional — attach if available.",
        section: "documents",
        docId: d.id,
        fix: "Upload in the Documents section.",
      });
    }
  }
  if (missingRequired === 0)
    push({
      category: "Completeness",
      severity: "pass",
      title: "All required fields present",
      detail: "Every CBAM-required data point has a value.",
    });

  /* ── Validation + Anomaly + Standardization (per product) ─── */
  let nonTonneUnits = false;
  let defaultMethodUsed = false;
  for (const { product, lots } of req.products) {
    const band = DIRECT_BANDS[product.category] ?? DIRECT_BANDS["Iron & Steel"];
    const direct = num(values[valueKey("direct-emissions", product.id)]);
    const indirect = num(values[valueKey("indirect-emissions", product.id)]);
    /* Electricity is stored as ABSOLUTE MWh for the period; the per-tonne
       figure the cross-check needs is derived here, once, against the
       installation's own output. A legacy per-tonne value is converted up by
       the same reader rather than being compared in the wrong unit. */
    const elecReading = readElectricity(values, product.id);
    const elec = elecReading.perTonne ?? NaN;
    const method = values[valueKey("method", product.id)] ?? "";
    const rawPrecursors = values[valueKey("precursors", product.id)];

    // Validation — numbers present & positive
    if (Number.isNaN(direct)) {
      push({
        category: "Validation",
        severity: "critical",
        title: `Direct emissions not a number (${product.name})`,
        detail: "Enter specific direct emissions in tCO₂e per tonne.",
        productId: product.id,
        fieldId: "direct-emissions",
      });
    } else if (direct <= 0) {
      push({
        category: "Validation",
        severity: "critical",
        title: `Direct emissions must be greater than zero (${product.name})`,
        detail: "A produced good cannot have zero direct emissions.",
        productId: product.id,
        fieldId: "direct-emissions",
      });
    } else if (direct > band.hardMax) {
      push({
        category: "Validation",
        severity: "critical",
        title: `Direct emissions look impossibly high (${product.name})`,
        detail: `${direct} tCO₂e/t exceeds any realistic ${band.word} production route — check the unit and decimal point.`,
        productId: product.id,
        fieldId: "direct-emissions",
      });
    }
    // Indirect — same rigour as direct (a negative or nonsense value must never
    // silently shrink the total, which is exactly what happened pre-fix)
    if (values[valueKey("indirect-emissions", product.id)]?.trim()) {
      if (Number.isNaN(indirect)) {
        push({
          category: "Validation",
          severity: "critical",
          title: `Indirect emissions not a number (${product.name})`,
          detail:
            "Enter specific indirect (electricity) emissions in tCO₂e per tonne.",
          productId: product.id,
          fieldId: "indirect-emissions",
        });
      } else if (indirect < 0) {
        push({
          category: "Validation",
          severity: "critical",
          title: `Indirect emissions cannot be negative (${product.name})`,
          detail: `${indirect} tCO₂e/t is physically impossible — electricity use cannot remove emissions.`,
          productId: product.id,
          fieldId: "indirect-emissions",
        });
      }
    }
    if (elecReading.raw != null && elecReading.raw < 0) {
      push({
        category: "Validation",
        severity: "critical",
        title: `Electricity consumption cannot be negative (${product.name})`,
        detail: "Total MWh for the period must be zero or more.",
        productId: product.id,
        fieldId: "elec-consumed",
      });
    }
    /* An absolute MWh figure with no output to divide by cannot become a
       per-tonne emission at all — it is not a soft warning, the number is
       simply not computable until the denominator exists. */
    if (
      elecReading.raw != null &&
      elecReading.raw > 0 &&
      !(elecReading.outputTonnes && elecReading.outputTonnes > 0)
    ) {
      push({
        category: "Validation",
        severity: "critical",
        title: `Output quantity missing (${product.name})`,
        detail:
          "Electricity is reported as a total for the period, so your output of this good is what turns it into a per-tonne figure. Without it the indirect emissions cannot be calculated.",
        productId: product.id,
        fieldId: "production-output",
        fix: "Enter your output of this good in the Production section.",
      });
    }
    /* Sold more to this exporter than the installation made — one of the two
       figures is wrong, and it is always worth asking which. */
    const boughtTonnes = lots.reduce(
      (a, l) =>
        a +
        (l.unit === "tonnes (t)" ? l.qty : l.unit === "kg" ? l.qty / 1000 : 0),
      0,
    );
    if (
      elecReading.outputTonnes &&
      elecReading.outputTonnes > 0 &&
      boughtTonnes > elecReading.outputTonnes * 1.001
    ) {
      push({
        category: "Validation",
        severity: "warning",
        title: `Output is smaller than the quantity supplied (${product.name})`,
        detail: `You reported ${elecReading.outputTonnes.toLocaleString("en-US")} t of output but ${boughtTonnes.toLocaleString("en-US")} t was supplied to this exporter. Output should cover everything you produced, including what went to other customers.`,
        productId: product.id,
        fieldId: "production-output",
      });
    }

    // Cross-check — indirect should reconcile with electricity × grid factor
    // when both are given (±35% tolerance covers PPAs and partial self-supply).
    const factor = factorNumber(values[valueKey("elec-factor", product.id)]);
    if (
      !Number.isNaN(elec) &&
      elec > 0 &&
      !Number.isNaN(factor) &&
      factor > 0 &&
      !Number.isNaN(indirect) &&
      indirect >= 0
    ) {
      const expected = elec * factor;
      if (expected > 0.05 && Math.abs(indirect - expected) / expected > 0.35) {
        const derivation =
          elecReading.outputTonnes && elecReading.outputTonnes > 0
            ? `${elecReading.mwhAbsolute?.toLocaleString("en-US")} MWh ÷ ${elecReading.outputTonnes.toLocaleString("en-US")} t = ${elec.toFixed(3)} MWh/t`
            : `${elec.toFixed(3)} MWh/t`;
        push({
          category: "Validation",
          severity: "warning",
          title: `Indirect emissions don't match electricity data (${product.name})`,
          detail: `${derivation} × factor ${factor} ≈ ${expected.toFixed(2)} tCO₂e/t, but indirect reads ${indirect}. Explain the gap (PPA, self-generation) or correct one of them.`,
          productId: product.id,
          fieldId: "indirect-emissions",
        });
      }
    }

    /* Precursors — a structured chain is the only calculable form. A complex
       good on ACTUAL data must carry at least one complete node; legacy prose
       is flagged for restructuring, never silently accepted as a number. The
       chain can be several tiers deep, so every tier is checked, and a loop or
       an over-deep chain is reported rather than quietly contributing zero. */
    if (isComplexGood(product)) {
      const roots = parsePrecursorTree(rawPrecursors);
      if (rawPrecursors?.trim() && roots === null) {
        push({
          category: "Validation",
          severity: "warning",
          title: `Precursors are free text (${product.name})`,
          detail:
            "Re-enter precursors as structured rows (material, quantity per tonne, embedded emissions) so they can be calculated and communicated.",
          productId: product.id,
          fieldId: "precursors",
        });
      }
      if (method !== "default") {
        const complete = (roots ?? []).filter(nodeComplete);
        if (complete.length === 0) {
          push({
            category: "Validation",
            severity: "critical",
            title: `Precursor breakdown missing (${product.name})`,
            detail:
              "A complex good on actual data must list each relevant precursor with quantity per tonne and its embedded emissions.",
            productId: product.id,
            fieldId: "precursors",
          });
        }
      }
      if (roots) {
        try {
          for (const n of roots) seeForNode(n);
          for (const { node } of flattenTree(roots)) {
            if (!node.name.trim()) continue;
            const derived = node.children.length > 0;
            const seeOk =
              node.isScrap || derived || Number(node.seeDeclared) > 0;
            if (!(node.qtyPerTonneOutput > 0) || !seeOk) {
              push({
                category: "Validation",
                severity: "critical",
                title: `Precursor "${node.name}" incomplete (${product.name})`,
                detail: derived
                  ? "Each tier needs a positive quantity per tonne of the tier above it."
                  : "Each precursor needs a positive quantity per tonne and positive embedded emissions — unless it is scrap, which is declared at zero.",
                productId: product.id,
                fieldId: "precursors",
              });
            }
          }
        } catch (err) {
          push({
            category: "Validation",
            severity: "critical",
            title: `Precursor chain cannot be calculated (${product.name})`,
            detail:
              err instanceof PrecursorTreeError
                ? err.message
                : "The precursor chain loops or runs too deep to resolve.",
            productId: product.id,
            fieldId: "precursors",
          });
        }
      }
    }

    // Internal consistency — total must equal own direct + own indirect +
    // precursor contribution (auto-derived; fails only on hand-edited stores).
    if (!Number.isNaN(direct) && !Number.isNaN(indirect)) {
      const total = num(values[valueKey("total-emissions", product.id)]);
      const expected =
        direct +
        indirect +
        (isComplexGood(product) ? precursorContribution(rawPrecursors) : 0);
      if (!Number.isNaN(total) && Math.abs(total - expected) > 0.05) {
        push({
          category: "Validation",
          severity: "critical",
          title: `Total ≠ own emissions + precursors (${product.name})`,
          detail: `Total reads ${total} but own direct + own indirect + precursor contribution = ${expected.toFixed(2)} tCO₂e/t.`,
          productId: product.id,
          fieldId: "total-emissions",
        });
      }
    }

    // Anomaly — plausible but unusual
    if (!Number.isNaN(direct) && direct > 0 && direct <= band.hardMax) {
      if (direct > band.high) {
        push({
          category: "Anomaly",
          severity: "warning",
          title: `Direct emissions above typical (${product.name})`,
          detail: `${direct} tCO₂e/t is high for a ${band.word} route (typical ${band.low}–${band.high}). Fine for the most carbon-intensive routes — just confirm.`,
          productId: product.id,
          fieldId: "direct-emissions",
        });
      }
      if (direct < band.low) {
        push({
          category: "Anomaly",
          severity: "warning",
          title: `Direct emissions unusually low (${product.name})`,
          detail: `${direct} tCO₂e/t is below typical for ${band.word} — double-check scope and that all sources are counted.`,
          productId: product.id,
          fieldId: "direct-emissions",
        });
      }
    }
    if (method === "default") {
      defaultMethodUsed = true;
      push({
        category: "Anomaly",
        severity: "warning",
        title: `Default factors used (${product.name})`,
        detail:
          "Actual installation data is preferred and reduces the importer's risk margin. Default values are accepted but flagged.",
        productId: product.id,
        fieldId: "method",
      });
    }

    // Standardization — units
    if (lots.some((l) => l.unit && l.unit !== "tonnes (t)"))
      nonTonneUnits = true;
  }

  if (
    !findings.some(
      (f) => f.category === "Validation" && f.severity === "critical",
    )
  ) {
    push({
      category: "Validation",
      severity: "pass",
      title: "Values pass validation",
      detail: "Emissions are numeric, positive and internally consistent.",
    });
  }
  if (
    !findings.some((f) => f.category === "Anomaly" && f.severity !== "pass")
  ) {
    push({
      category: "Anomaly",
      severity: "pass",
      title: "No anomalies detected",
      detail: "Figures sit within expected ranges for the route.",
    });
  }

  // Standardization — always normalise + report
  if (nonTonneUnits) {
    push({
      category: "Standardization",
      severity: "warning",
      title: "Quantities converted to tonnes",
      detail:
        "Some lots were invoiced in other units — normalised to net mass (tonnes) for the CBAM calculation.",
      fix: "Confirm the conversion is correct.",
    });
  } else {
    push({
      category: "Standardization",
      severity: "pass",
      title: "Units standardised",
      detail:
        "Quantities in tonnes, emissions in tCO₂e per tonne — CBAM canonical form.",
    });
  }

  /* ── Score ────────────────────────────────────────────────── */
  const critical = findings.filter((f) => f.severity === "critical").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const passes = findings.filter((f) => f.severity === "pass").length;
  const score = Math.max(0, Math.min(100, 100 - critical * 20 - warnings * 6));

  // Keep the unused signal explicit for the summary copy.
  void defaultMethodUsed;

  return {
    findings,
    score,
    critical,
    warnings,
    passes,
    passable: critical === 0,
    ranAt: Date.now(),
  };
}

export const CATEGORIES: Category[] = [
  "Completeness",
  "Validation",
  "Anomaly",
  "Standardization",
];
export const CATEGORY_BLURB: Record<Category, string> = {
  Completeness: "Every required field and requested document is present.",
  Validation: "Values are the right type, in range and internally consistent.",
  Anomaly:
    "Figures that are possible but unusual are flagged for a second look.",
  Standardization: "Units and formats normalised to the CBAM canonical form.",
};

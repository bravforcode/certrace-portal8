/* ════════════════════════════════════════════════════════════
   DETERMINISTIC QUALITY CHECK (flow step 2)

   Runs on the assembled submission just before the supplier signs. Four checks:
     • Completeness    — every required field + requested document present
     • Validation      — values are numeric, in range, internally consistent
     • Anomaly         — figures that are plausible but unusual (flagged, not blocked)
     • Standardization — units / formats normalised to the CBAM canonical form

   Critical findings BLOCK submission; warnings PASS THROUGH with a flag the
   supplier acknowledges. A data-quality score summarises the result.

   Validation is authoritative and deterministic. Only the explicitly labelled
   anomaly bands are advisory; an AI integration may never override a result.
   ════════════════════════════════════════════════════════════ */

import type { SupplierRequest, SectionKey } from "./supplier";
import { AUTO_FIELDS, valueKey, isOnceField, fieldAppliesTo, fieldRequiredFor, verificationRequired } from "./supplier";
import { parsePrecursors, rowComplete } from "./precursors";
import { isComplexGood, isElectrolysisGood, type ProductCategory } from "./config";
import type { DocState, SupplierProfile } from "./supplier-store";
import { classifyCnCode, decimal, decimalToString } from "./mrv";
import { embeddedEmissionsPerTonne } from "./workflow-measurements";
import { calculatePlantMrv, parsePlantMrvPayload } from "./plant-mrv";

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

const exact = (value: string | undefined) => {
  if (!value?.trim()) return null;
  try {
    return decimal(value.trim());
  } catch {
    return null;
  }
};

/* Plausible OWN-PROCESS direct-emission bands per goods category (tCO₂e/t).
   The band must match the good being checked — flagging an aluminium smelter
   against "a realistic steel route" (the pre-fix behaviour) is noise for the
   supplier and cover for real errors. Downstream steps (rolling, extrusion)
   legitimately sit near the low end, so `low` is a soft nudge only. */
const DIRECT_BANDS: Record<ProductCategory, { low: number; high: number; word: string }> = {
  "Iron & Steel": { low: 0.1, high: 2.8, word: "steel" },
  Aluminium: { low: 0.02, high: 2.2, word: "aluminium" },
};

export function runQualityCheck(req: SupplierRequest, values: Record<string, string>, docs: Record<string, DocState>, profile?: SupplierProfile | null): CheckResult {
  const findings: Finding[] = [];
  const push = (f: Omit<Finding, "id">) => findings.push({ id: `${f.category}-${findings.length}`, ...f });

  if (req.classificationIssue || req.products.length === 0) {
    push({
      category: "Validation",
      severity: "critical",
      title: "Regulatory product classification is unresolved",
      detail: req.classificationIssue ?? "No in-scope regulatory product was resolved for this request.",
      fix: "Return to the exporter and select an approved CN classification. Certrace will not apply a fallback product.",
    });
  }

  /* ── Completeness ─────────────────────────────────────────── */
  const verifRequired = verificationRequired(req, values);
  if (profile?.actorRole === "trader") {
    const actualProducts = req.products.filter(({ product }) => values[valueKey("method", product.id)] !== "default");
    if (actualProducts.length > 0) {
      push({
        category: "Completeness",
        severity: "critical",
        title: "Upstream operator attestation is required",
        detail: `This profile is a trader forwarding data from ${profile.upstreamProducer || "an unnamed producer"}. A trader cannot attest installation-specific actual values on the operator's behalf in this browser-only workflow.`,
        fix: "Have the installation operator complete and attest the plant data through a production backend workflow.",
      });
    } else {
      push({ category: "Anomaly", severity: "warning", title: "Trader-provided default data", detail: `The trader identifies ${profile.upstreamProducer || "an upstream producer"}; confirm the operator identity and source before EU-side use.` });
    }
  }
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
        title: `${d.label} file reference is missing`,
        detail: d.required ? "Requested by the buyer — record safe filename metadata for the demo. Secure evidence bytes remain unavailable." : "Optional — record a filename reference if available.",
        section: "documents",
        docId: d.id,
        fix: "Record a file reference in the Documents section.",
      });
    }
  }
  if (missingRequired === 0) push({ category: "Completeness", severity: "pass", title: "All required fields present", detail: "Every CBAM-required data point has a value." });

  /* ── Validation + Anomaly + Standardization (per product) ─── */
  let nonTonneUnits = false;
  let defaultMethodUsed = false;
  for (const { product, lots } of req.products) {
    const band = DIRECT_BANDS[product.category] ?? DIRECT_BANDS["Iron & Steel"];
    const directRaw = values[valueKey("direct-emissions", product.id)];
    const indirectRaw = values[valueKey("indirect-emissions", product.id)];
    const electricityRaw = values[valueKey("elec-consumed", product.id)];
    const factorRaw = values[valueKey("elec-factor", product.id)];
    const direct = exact(directRaw);
    const indirect = exact(indirectRaw);
    const electricity = exact(electricityRaw);
    const factor = exact(factorRaw);
    const method = values[valueKey("method", product.id)] ?? "";
    const mrvMethod = values[valueKey("emissions-method", product.id)] ?? "";
    const plantMrvRaw = values[valueKey("plant-mrv", product.id)];
    const rawPrecursors = values[valueKey("precursors", product.id)];

    const regulatoryProduct = classifyCnCode(product.cnCode);
    const selectedRoute = values[valueKey("process-route", product.id)] ?? "";
    if (!regulatoryProduct || !(regulatoryProduct.productionRoutes as readonly string[]).includes(selectedRoute)) {
      push({
        category: "Validation",
        severity: "critical",
        title: `Production route is not valid for the classified CN code (${product.name})`,
        detail: selectedRoute
          ? `${selectedRoute} is not one of the effective routes for CN ${product.cnCode}.`
          : `Select an effective-dated production route for CN ${product.cnCode}.`,
        productId: product.id,
        fieldId: "process-route",
      });
    }

    if (method !== "default") {
      let parsedPlant: ReturnType<typeof parsePlantMrvPayload> | null = null;
      try {
        parsedPlant = parsePlantMrvPayload(plantMrvRaw);
        if (parsedPlant.directMethod !== mrvMethod) {
          push({
            category: "Validation",
            severity: "critical",
            title: `MRV method and plant inputs disagree (${product.name})`,
            detail: `The questionnaire selects ${mrvMethod || "no method"}, while the structured plant model selects ${parsedPlant.directMethod}.`,
            productId: product.id,
            fieldId: "plant-mrv",
          });
        }
      } catch {
        // calculatePlantMrv below supplies the field-scoped blocking reason.
      }
      if (parsedPlant) {
        const pfcCount = (parsedPlant.aluminiumPfcSlopeInputs?.length ?? 0) + (parsedPlant.aluminiumPfcOvervoltageInputs?.length ?? 0);
        if (!isElectrolysisGood(product) && pfcCount > 0) {
          push({ category: "Validation", severity: "critical", title: `PFC inputs do not apply to this product (${product.name})`, detail: "Aluminium PFC slope/overvoltage inputs are permitted only for primary electrolysis goods.", productId: product.id, fieldId: "plant-mrv" });
        }
        if (isElectrolysisGood(product) && selectedRoute === "PRIMARY_HALL_HEROULT" && pfcCount === 0) {
          push({ category: "Completeness", severity: "critical", title: `Primary aluminium PFC method is missing (${product.name})`, detail: "Record at least one applicable slope or overvoltage calculation input, including zero monitored values where supported by evidence.", productId: product.id, fieldId: "plant-mrv" });
        }
      }
      const plant = calculatePlantMrv(
        plantMrvRaw,
        values[valueKey("production-activity", product.id)],
        {
          productId: product.id,
          installationId: values[valueKey("installation-reference", product.id)] || "unassigned-installation",
          processId: `${product.id}-process`,
        },
      );
      if (!plant.ok) {
        push({
          category: "Validation",
          severity: "critical",
          title: `Plant MRV inputs are incomplete (${product.name})`,
          detail: plant.errors.map((error) => `${error.path}: ${error.message}`).join("; "),
          productId: product.id,
          fieldId: "plant-mrv",
          fix: "Complete the selected calculation method and every populated energy, allocation, transfer and PFC input.",
        });
      } else {
        const directMatches = direct?.equals(decimal(plant.directSpecificEmissions.value)) ?? false;
        const indirectMatches = indirect?.equals(decimal(plant.indirectSpecificEmissions.value)) ?? false;
        if (!directMatches || !indirectMatches) {
          push({
            category: "Validation",
            severity: "critical",
            title: `Aggregate emissions do not match plant MRV (${product.name})`,
            detail: `Plant traces calculate direct ${plant.directSpecificEmissions.value} and indirect ${plant.indirectSpecificEmissions.value} TCO2E_PER_TNE. Aggregate fields must be derived from those traces.`,
            productId: product.id,
            fieldId: "plant-mrv",
          });
        }
        const missingEvidence = [...plant.sourceStreams, ...plant.emissionSources, ...plant.energyFlows]
          .filter((input) => input.evidenceReferences.length === 0)
          .map((input) => ("name" in input ? input.name : input.id));
        if (missingEvidence.length > 0) {
          push({
            category: "Completeness",
            severity: "critical",
            title: `Plant MRV source references are missing (${product.name})`,
            detail: `Add evidence/source references for: ${missingEvidence.join(", ")}. Browser metadata still does not replace secure evidence custody.`,
            productId: product.id,
            fieldId: "plant-mrv",
          });
        }
      }
    }

    // Validation — numbers present & positive
    if (!direct) {
      push({ category: "Validation", severity: "critical", title: `Direct emissions are not an exact decimal (${product.name})`, detail: "Enter a plain decimal string in TCO2E_PER_TNE without separators or exponent notation.", productId: product.id, fieldId: "direct-emissions" });
    } else if (direct.isNegative()) {
      push({ category: "Validation", severity: "critical", title: `Direct emissions cannot be negative (${product.name})`, detail: `${directRaw} TCO2E_PER_TNE is below zero.`, productId: product.id, fieldId: "direct-emissions" });
    }
    // Indirect — same rigour as direct (a negative or nonsense value must never
    // silently shrink the total, which is exactly what happened pre-fix)
    if (indirectRaw?.trim()) {
      if (!indirect) {
        push({ category: "Validation", severity: "critical", title: `Indirect emissions are not an exact decimal (${product.name})`, detail: "Enter a plain decimal string in TCO2E_PER_TNE.", productId: product.id, fieldId: "indirect-emissions" });
      } else if (indirect.isNegative()) {
        push({ category: "Validation", severity: "critical", title: `Indirect emissions cannot be negative (${product.name})`, detail: `${indirectRaw} TCO2E_PER_TNE is below zero.`, productId: product.id, fieldId: "indirect-emissions" });
      }
    }
    if (electricityRaw?.trim() && (!electricity || electricity.isNegative())) {
      push({ category: "Validation", severity: "critical", title: `Electricity consumption is invalid (${product.name})`, detail: "Enter a non-negative plain decimal in MWH per tonne.", productId: product.id, fieldId: "elec-consumed" });
    }
    if (factorRaw?.trim() && (!factor || factor.isNegative())) {
      push({ category: "Validation", severity: "critical", title: `Electricity factor is invalid (${product.name})`, detail: "Enter a non-negative plain decimal in TCO2E_PER_MWH; put provenance in the separate source field.", productId: product.id, fieldId: "elec-factor" });
    }

    // Cross-check — indirect should reconcile with electricity × grid factor
    // when both are given (±35% tolerance covers PPAs and partial self-supply).
    if (electricity?.isPositive() && factor?.isPositive() && indirect && !indirect.isNegative()) {
      const expected = electricity.times(factor);
      const relativeDifference = indirect.minus(expected).abs().dividedBy(expected);
      if (expected.greaterThan("0.05") && relativeDifference.greaterThan("0.35")) {
        push({ category: "Validation", severity: "warning", title: `Indirect emissions don't match electricity data (${product.name})`, detail: `Electricity ${electricityRaw} MWH/t × factor ${factorRaw} = ${decimalToString(expected)} TCO2E_PER_TNE, but indirect reads ${indirectRaw}. Explain the gap (PPA, self-generation) or correct one of them.`, productId: product.id, fieldId: "indirect-emissions" });
      }
    }

    // Precursors — structured rows are the only calculable form. A complex good
    // on ACTUAL data must carry at least one complete row; legacy prose is
    // flagged for restructuring, never silently accepted as a number.
    if (isComplexGood(product)) {
      const rows = parsePrecursors(rawPrecursors);
      if (rawPrecursors?.trim() && rows === null) {
        push({ category: "Validation", severity: "critical", title: `Precursors are not calculable (${product.name})`, detail: "Re-enter precursors as structured rows (material, quantity per tonne, embedded emissions) before any deterministic result can be produced.", productId: product.id, fieldId: "precursors" });
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
          if (!rowComplete(r)) {
            push({ category: "Validation", severity: "critical", title: `Precursor "${r.name}" incomplete (${product.name})`, detail: "Each precursor row needs a positive quantity per tonne and positive embedded emissions.", productId: product.id, fieldId: "precursors" });
          }
          if (/^\d{8}$/.test(r.cn.replace(/\s/g, "")) && !classifyCnCode(r.cn)) {
            push({ category: "Validation", severity: "critical", title: `Precursor CN is outside the effective master data (${product.name})`, detail: `CN ${r.cn} was not classified. No fallback precursor category was applied.`, productId: product.id, fieldId: "precursors" });
          }
          if (r.method === "actual" && !r.verificationReference.trim()) {
            push({ category: "Completeness", severity: "critical", title: `Actual precursor verifier reference missing (${product.name})`, detail: `${r.name || "The precursor"} is marked actual and needs an accredited-verifier report reference. A reference alone will still not satisfy secure evidence custody.`, productId: product.id, fieldId: "precursors" });
          }
        }
      }
    }

    // Authoritative exact consistency — Annex-II indirect emissions remain a
    // trace input but do not enter steel/aluminium embedded emissions.
    if (direct && indirect) {
      const total = values[valueKey("total-emissions", product.id)]?.trim();
      try {
        const expected = embeddedEmissionsPerTonne({
          product,
          direct: values[valueKey("direct-emissions", product.id)],
          indirect: values[valueKey("indirect-emissions", product.id)],
          precursors: rawPrecursors,
          reportingPeriod: req.period,
        });
        if (total && expected !== null && !decimal(total).equals(decimal(expected))) {
          push({ category: "Validation", severity: "critical", title: `Embedded result does not match exact inputs (${product.name})`, detail: `Stored result ${total} TCO2E_PER_TNE differs from the authoritative exact result ${expected}. Indirect emissions are excluded under Annex II.`, productId: product.id, fieldId: "total-emissions" });
        }
      } catch {
        // Individual invalid-decimal findings above remain the blocking cause.
      }
    }

    // Anomaly — plausible but unusual
    if (direct && !direct.isNegative()) {
      if (direct.greaterThan(band.high)) {
        push({ category: "Anomaly", severity: "warning", title: `Direct emissions above typical (${product.name})`, detail: `${directRaw} TCO2E_PER_TNE is high for the advisory ${band.word} band (${band.low}–${band.high}); confirm the route, scope and unit.`, productId: product.id, fieldId: "direct-emissions" });
      }
      if (direct.lessThan(band.low)) {
        push({ category: "Anomaly", severity: "warning", title: `Direct emissions unusually low (${product.name})`, detail: `${directRaw} TCO2E_PER_TNE is below the advisory ${band.word} band — double-check scope and source coverage.`, productId: product.id, fieldId: "direct-emissions" });
      }
    }
    if (method === "default") {
      defaultMethodUsed = true;
      if (!values[valueKey("default-value-reference", product.id)]?.trim()) {
        push({ category: "Completeness", severity: "critical", title: `Default-value source missing (${product.name})`, detail: "Record the effective Commission default-value dataset/version and exact row. Certrace will not invent a factor or source.", productId: product.id, fieldId: "default-value-reference" });
      }
      push({ category: "Anomaly", severity: "warning", title: `Default factors used (${product.name})`, detail: "Actual installation data is preferred and reduces the importer's risk margin. Default values are accepted but flagged.", productId: product.id, fieldId: "method" });
    }

    // Standardization — units
    if (lots.some((lot) => lot.unit === "KGM")) nonTonneUnits = true;
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

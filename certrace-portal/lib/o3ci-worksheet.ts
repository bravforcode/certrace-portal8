/* Manual O3CI entry aid.

   The Commission does not expose a public O3CI write API or a public upload
   schema for this workflow. This CSV is therefore a human-readable mapping
   worksheet only. It must never be described as Registry XML, schema-valid or
   proof that any external submission occurred. */

import type { Declaration } from "./data";
import type { ReviewSubmission } from "./exporter-review";
import { valueKey } from "./supplier";
import { formatPrecursors } from "./precursors";
import { isPositiveMass } from "./workflow-measurements";

export type ManualEntryIssue = {
  supplierId: string;
  supplierName: string;
  issue: string;
};

const safeCsvCell = (value: unknown): string => {
  let text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  // Prevent spreadsheet formula injection when a user-entered value is opened.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export function manualEntryIssues(submissions: ReviewSubmission[]): ManualEntryIssue[] {
  const issues: ManualEntryIssue[] = [];
  const add = (sub: ReviewSubmission, issue: string) => issues.push({ supplierId: sub.supplier.id, supplierName: sub.supplier.name, issue });

  for (const sub of submissions) {
    if (sub.request.classificationIssue || sub.request.products.length === 0) {
      add(sub, sub.request.classificationIssue ?? "Regulatory product classification is unresolved.");
      continue;
    }
    if (!sub.values[valueKey("inst-name")]?.trim()) add(sub, "Installation name is missing.");
    if (!sub.values[valueKey("inst-country")]?.trim()) add(sub, "Installation country is missing.");
    if (!sub.values[valueKey("inst-address")]?.trim()) add(sub, "Installation address is missing.");
    if (!sub.values[valueKey("inst-coords")]?.trim()) add(sub, "Installation coordinates are missing.");
    if (sub.profile?.actorRole === "trader" && sub.request.products.some(({ product }) => sub.values[valueKey("method", product.id)] !== "default")) {
      add(sub, "Trader profile cannot attest upstream installation-specific actual values; operator completion is required.");
    }
    if (!sub.mrvReportDraft || sub.mrvAssemblyBlockers.length > 0) add(sub, "The versioned MRV report draft has structural blockers.");

    for (const requestProduct of sub.request.products) {
      const productId = requestProduct.product.id;
      if (!sub.values[valueKey("process-route", productId)]?.trim()) add(sub, `${requestProduct.product.name}: production route is missing.`);
      if (!sub.values[valueKey("monitoring-plan-id", productId)]?.trim()) add(sub, `${requestProduct.product.name}: monitoring plan reference is missing.`);
      if (!sub.values[valueKey("monitoring-plan-version", productId)]?.trim()) add(sub, `${requestProduct.product.name}: monitoring plan version is missing.`);
      if (!sub.values[valueKey("system-boundary", productId)]?.trim()) add(sub, `${requestProduct.product.name}: system boundary is missing.`);
      if (!sub.values[valueKey("data-gap-methodology", productId)]?.trim()) add(sub, `${requestProduct.product.name}: data-gap methodology is missing.`);
      if (!sub.values[valueKey("control-activities", productId)]?.trim()) add(sub, `${requestProduct.product.name}: monitoring controls are missing.`);
      const installationReference = sub.values[valueKey("installation-reference", productId)]?.trim();
      const knownInstallation = installationReference === "primary" || sub.profile?.additionalInstallations.some((installation) => installation.id === installationReference);
      if (!installationReference || !knownInstallation) add(sub, `${requestProduct.product.name}: a valid producing installation is not assigned.`);
      if (!isPositiveMass(sub.values[valueKey("production-activity", productId)] ?? "", "TNE")) add(sub, `${requestProduct.product.name}: exact process production activity in TNE is missing or invalid.`);
      if (!sub.values[valueKey("method", productId)]?.trim()) add(sub, `${requestProduct.product.name}: determination method is missing.`);
      if (!sub.values[valueKey("emissions-method", productId)]?.trim()) add(sub, `${requestProduct.product.name}: MRV method is missing.`);
      if (!sub.values[valueKey("total-emissions", productId)]?.trim()) add(sub, `${requestProduct.product.name}: total embedded emissions are missing.`);
    }
  }
  return issues;
}

export function buildO3ciManualWorksheet(declaration: Declaration, submissions: ReviewSubmission[]): string {
  const headers = [
    "worksheet_status",
    "reporting_period",
    "supplier",
    "installation_name",
    "installation_country",
    "installation_address",
    "installation_coordinates",
    "un_locode",
    "monitoring_plan_reference",
    "monitoring_plan_version",
    "system_boundary",
    "excluded_activities",
    "data_gap_methodology",
    "control_activities",
    "installation_reference",
    "cn_code",
    "goods_description",
    "production_route",
    "commercial_shipment_quantity_tne",
    "process_production_activity_tne",
    "specific_direct_emissions_tco2e_per_tne",
    "specific_indirect_emissions_tco2e_per_tne",
    "specific_total_emissions_tco2e_per_tne",
    "determination_method",
    "mrv_method",
    "calculation_formula_trace",
    "precursors_human_readable",
    "verifier_reference_unvalidated",
    "evidence_availability",
    "operator_action",
  ];

  const rows = submissions.flatMap((sub) =>
    sub.request.products.map((requestProduct) => {
      const productId = requestProduct.product.id;
      return [
        "DRAFT MANUAL-ENTRY AID — NOT AN O3CI UPLOAD",
        declaration.period,
        sub.supplier.name,
        sub.values[valueKey("inst-name")],
        sub.values[valueKey("inst-country")] || sub.supplier.country,
        sub.values[valueKey("inst-address")],
        sub.values[valueKey("inst-coords")],
        sub.values[valueKey("inst-unlocode")],
        sub.values[valueKey("monitoring-plan-id", productId)],
        sub.values[valueKey("monitoring-plan-version", productId)],
        sub.values[valueKey("system-boundary", productId)],
        sub.values[valueKey("excluded-activities", productId)],
        sub.values[valueKey("data-gap-methodology", productId)],
        sub.values[valueKey("control-activities", productId)],
        sub.values[valueKey("installation-reference", productId)],
        requestProduct.product.cnCode,
        requestProduct.product.name,
        sub.values[valueKey("process-route", productId)],
        String(requestProduct.commercialQuantityTonnes),
        sub.values[valueKey("production-activity", productId)],
        sub.values[valueKey("direct-emissions", productId)],
        sub.values[valueKey("indirect-emissions", productId)],
        sub.values[valueKey("total-emissions", productId)],
        sub.values[valueKey("method", productId)],
        sub.values[valueKey("emissions-method", productId)],
        sub.emissions.find((line) => line.productId === productId)?.calculationTraces.map((trace) => `${trace.method}: ${trace.formula}`).join(" | "),
        formatPrecursors(sub.values[valueKey("precursors", productId)] ?? ""),
        sub.values[valueKey("verification")],
        "FILE METADATA ONLY — EVIDENCE BYTES NOT STORED",
        "Enter and verify manually in the operator's own O3CI account",
      ];
    }),
  );

  return [headers, ...rows].map((row) => row.map(safeCsvCell).join(",")).join("\r\n");
}

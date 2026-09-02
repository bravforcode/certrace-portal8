/* Assembling the validator's input from the portal's stores.

   lib/cbam/validate.ts is pure by design — it takes a fully-resolved
   ValidationInput and knows nothing about localStorage. This module is the
   adapter that gathers that input, and it lives apart precisely so the rules
   stay testable without a browser.

   It also decides two things the validator should not have to: which
   electricity band applies (a scrap EAF and an aluminium smelter differ by an
   order of magnitude), and which supplier records were already stale when the
   period closed. */

import type { Declaration } from "../data";
import { valueKey } from "../supplier";
import { isComplexGood } from "../config";
import { getRecord, recordFreshnessAtPeriodEnd } from "../supplier-records";
import type { ReviewRollup } from "../exporter-review";
import { calendarYear, type ReportingPeriod } from "./boundary";
import { loadDataset } from "./activity-store";
import { listGaps } from "./data-gaps";
import { listEvidence } from "./evidence";
import { parsePrecursorTree, type PrecursorNode } from "./precursor-tree";
import { shippedTonnesFor } from "../shipments";
import { activeSnapshot } from "./freeze";
import { latestVersion } from "./mmd";
import { validate, readiness, type Readiness, type ValidationInput } from "./validate";

export function periodFor(decl: Declaration): ReportingPeriod {
  if (decl.periodStart && decl.periodEnd) return { start: decl.periodStart, end: decl.periodEnd, type: "calendar_year" };
  return calendarYear(Number(/(20\d\d)/.exec(decl.period)?.[1] ?? new Date().getFullYear()));
}

/** The exporter's own precursor chain, taken from the self-supplied
    submission so there is one tree rather than a second copy of it. */
export function precursorTreeFor(roll: ReviewRollup): PrecursorNode[] {
  const self = roll.submissions.find((s) => s.supplier.selfSupplied) ?? roll.submissions[0];
  if (!self) return [];
  for (const rp of self.request.products) {
    const parsed = parsePrecursorTree(self.values[valueKey("precursors", rp.product.id)]);
    if (parsed && parsed.length) return parsed;
  }
  return [];
}

export function buildValidationInput(decl: Declaration, roll: ReviewRollup, enteredBy: string): ValidationInput {
  const period = periodFor(decl);
  const dataset = loadDataset(decl.id, period, enteredBy);
  const evidence = listEvidence(decl.id);
  const snapshot = activeSnapshot(decl.id);
  const mmd = latestVersion(decl.id);

  /* Aluminium smelting draws 13–16 MWh/t, scrap EAF steel 0.35–0.70. One
     shared band would wave through both a typo and the truth. */
  const categories = new Set(roll.submissions.flatMap((s) => s.request.products.map((p) => p.product.category)));
  const electricityBand = categories.has("Aluminium") && categories.size === 1 ? ("aluminium_smelting" as const) : ("eaf_steel" as const);

  const defaultOnlyComplexGoods: string[] = [];
  const unverifiedActualGoods: string[] = [];
  const staleSupplierRecords: string[] = [];

  for (const sub of roll.submissions.filter((s) => s.submitted)) {
    const verification = (sub.values[valueKey("verification")] || "").trim();
    for (const rp of sub.request.products) {
      const method = sub.values[valueKey("method", rp.product.id)] || "";
      if (method === "default" && isComplexGood(rp.product)) defaultOnlyComplexGoods.push(`${sub.supplier.name} — ${rp.product.name}`);
      if (method === "actual" && !verification) unverifiedActualGoods.push(`${sub.supplier.name} — ${rp.product.name}`);
    }
    const record = getRecord(sub.supplier.name);
    if (recordFreshnessAtPeriodEnd(record, decl.periodEnd).level === "stale") staleSupplierRecords.push(sub.supplier.name);
  }

  /* V15 asks whether each assumption is DISCLOSED, which means present in a
     finalised MMD — not merely typed into the activity screen. An unfinalised
     MMD discloses nothing. */
  const disclosedAssumptions = new Set<string>();
  if (mmd) {
    const dataForKeys = loadDataset(decl.id, period, enteredBy);
    for (const entry of mmd.content.assumptions) {
      // The register stores labels; match them back to the provenance keys.
      const match = [
        { key: "production:annual:value", label: "Annual production quantity" },
        ...dataForKeys.fuels.flatMap((f) => [
          { key: `fuel:${f.id}:quantity`, label: `${f.fuel} — quantity` },
          { key: `fuel:${f.id}:ef`, label: `${f.fuel} — emission factor` },
          { key: `fuel:${f.id}:ncv`, label: `${f.fuel} — net calorific value` },
        ]),
        ...dataForKeys.electricity.map((e) => ({ key: `electricity:${e.id}:mwh`, label: "Electricity — consumption & factor" })),
        ...dataForKeys.processEmissions.map((p) => ({ key: `process:${p.id}:mass`, label: `${p.material || "Process material"} — mass & carbon content` })),
      ].find((m) => entry.input.toLowerCase().includes(m.label.toLowerCase().split(" — ")[0]));
      if (match) disclosedAssumptions.add(match.key);
    }
  }

  return {
    declarationId: decl.id,
    dataset,
    precursorTree: precursorTreeFor(roll),
    gaps: listGaps(decl.id),
    shippedTonnes: shippedTonnesFor(decl.id),
    electricityBand,
    liveEvidenceIds: new Set(evidence.map((e) => e.id)),
    defaultOnlyComplexGoods,
    unverifiedActualGoods,
    staleSupplierRecords,
    preparerId: snapshot?.preparerId,
    approverId: snapshot?.approverId,
    disclosedAssumptions,
    totalTCO2e: snapshot ? snapshot.outputs.directTotalTCO2 + snapshot.outputs.indirectTotalTCO2 : roll.submissions.reduce((a, s) => a + s.totalTCO2e, 0),
  };
}

/** One call for the screens: gather, validate, score. */
export function computeReadiness(decl: Declaration, roll: ReviewRollup, enteredBy: string): Readiness {
  return readiness(validate(buildValidationInput(decl, roll, enteredBy)), decl.id);
}

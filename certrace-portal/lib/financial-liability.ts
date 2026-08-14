/* ════════════════════════════════════════════════════════════
   COST OUTCOME — the single source for the CBAM certificate-cost figure

   Every surface that shows or exports a money number (the Financials page,
   the dashboard liability card, the PDF/Excel/XML/JSON handoff) resolves it
   HERE. Nothing re-derives gross cost, re-picks an as-of date, or re-reads
   the ECB rate on its own, so the four surfaces cannot drift apart.

   Two rules this module exists to enforce:

     1. The as-of date is DERIVED from the reporting period and the current
        date — never a hardcoded constant. A constant silently pins the
        forecast to one published quarter and hides the fact that a newer
        quarter has no official price yet.

     2. When no official certificate price is published for the resolved
        as-of date, the cost outcome is UNAVAILABLE. No proxy, no carry-
        forward of the previous quarter, no historic substitute — the same
        doctrine lib/mrv/compliance.ts already applies to the price table.
   ════════════════════════════════════════════════════════════ */

import { computeComplianceFacts, yearFromPeriod, type ComplianceFacts } from "./compliance-engine";
import type { Declaration } from "./data";
import { loadExporterState, rollup as buildRollup, type ReviewRollup } from "./exporter-review";
import { fetchEcbThbEur, type ThbEurRate } from "./fx";
import { decimal, decimalToString } from "./mrv";
import { addExact, multiplyExact } from "./workflow-measurements";

/** The reporting period a cost outcome is forecast for. */
export type LiabilityPeriod = {
  periodStart?: string;
  periodEnd?: string;
  /** Human label, e.g. "Annual 2026 (Jan–Dec)" — parsed only as a fallback. */
  periodLabel?: string;
};

/** Resolved, self-describing money view. Every amount is a decimal string. */
export type CostOutcome = {
  /** False when no official price covers `asOf`; every amount below is null. */
  available: boolean;
  /** Why the outcome is unavailable, verbatim from the compliance engine. */
  unavailableReason: string | null;
  /** Date the certificate price was looked up at (ISO). */
  asOf: string;
  year: number;
  chargeableTCO2e: string;
  certificatePriceEURPerTCO2e: string | null;
  /** chargeable × price, before any carbon-price offset. */
  grossCostEUR: string | null;
  /** Declared origin-country carbon price, converted to EUR and billed across
      chargeable tonnes. Always present — it does not depend on the EU price. */
  carbonPricePaidEUR: string;
  /** Gross − paid, floored at zero per supplier by the compliance engine. */
  netExposureEUR: string | null;
  /** Convenience conversion of `netExposureEUR` at the ECB reference rate. */
  netExposureTHB: string | null;
  fx: {
    thbPerEur: string;
    asOf: string;
    source: ThbEurRate["source"];
    stale: boolean;
  };
};

export type LiabilityView = {
  /** The review rollup the facts were computed from — kept so consumers can
      render the full supplier roster, not just the suppliers that submitted. */
  rollup: ReviewRollup;
  facts: ComplianceFacts;
  rate: ThbEurRate;
  cost: CostOutcome;
};

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Date to price the declaration at: today, clamped into the reporting period.
 *
 * A period that has not started prices at its first day, a closed period at
 * its last, and a period in progress at today — so an in-progress forecast
 * tracks the current quarter instead of freezing on the one that happened to
 * be published when the code was written. If the resolved date falls in a
 * quarter with no official publication, `computeComplianceFacts` reports the
 * outcome as unavailable rather than reusing an older price.
 */
export function resolveCertificatePriceAsOf(period: LiabilityPeriod, today: Date = new Date()): string {
  const year = yearFromPeriod(period.periodStart, period.periodLabel);
  const start = period.periodStart ?? `${year}-01-01`;
  const end = period.periodEnd ?? `${year}-12-31`;
  const now = isoDay(today);
  if (now < start) return start;
  if (now > end) return end;
  return now;
}

/** Pure assembly — no storage, no network. The unit-testable core. */
export function buildLiabilityView(
  period: LiabilityPeriod,
  rollup: ReviewRollup,
  rate: ThbEurRate,
  today: Date = new Date(),
): LiabilityView {
  const year = yearFromPeriod(period.periodStart, period.periodLabel);
  const asOf = resolveCertificatePriceAsOf(period, today);
  const facts = computeComplianceFacts(rollup, year, asOf, rate);

  const price = facts.certificatePriceEURPerTCO2e;
  const chargeable = facts.totalChargeableTCO2e;
  const netExposureEUR = facts.totalNetExposureEUR;

  // Every supplier's carbon-price figure is already in EUR by the time the
  // engine returns it, so this is a plain sum, not a second conversion.
  const carbonPricePaidEUR = addExact(
    Object.values(facts.perSupplier).map((supplier) => supplier.carbonPricePaidEUR ?? "0"),
  );

  return {
    rollup,
    facts,
    rate,
    cost: {
      available: netExposureEUR !== null,
      unavailableReason: facts.certificatePriceWarning,
      asOf,
      year,
      chargeableTCO2e: chargeable,
      certificatePriceEURPerTCO2e: price,
      grossCostEUR: price === null ? null : multiplyExact(chargeable, price),
      carbonPricePaidEUR,
      netExposureEUR,
      netExposureTHB:
        netExposureEUR === null
          ? null
          : decimalToString(decimal(netExposureEUR).times(decimal(rate.thbPerEur)).toDecimalPlaces(2)),
      fx: { thbPerEur: rate.thbPerEur, asOf: rate.asOf, source: rate.source, stale: rate.stale },
    },
  };
}

/** Browser-side entry point: ECB rate + localStorage exporter state + assembly. */
export async function loadLiabilityView(declaration: Declaration, today?: Date): Promise<LiabilityView> {
  const rate = await fetchEcbThbEur();
  const rollup = buildRollup(declaration, loadExporterState(declaration.id));
  return buildLiabilityView(
    { periodStart: declaration.periodStart, periodEnd: declaration.periodEnd, periodLabel: declaration.period },
    rollup,
    rate,
    today,
  );
}

/* ════════════════════════════════════════════════════════════
   DEFAULT OR ACTUAL — what a direct precursor's basis means for the number

   Implementing Regulation (EU) 2025/2547, Annex II A.1:

     (2) an operator can determine actual values, use the default values made
         available under Annex IV to Regulation 2023/956, or combine the two —
         Article 15 says the same for precursors;
     (4) for a precursor produced outside the installation in a third country,
         actual data from its operator may be used ONLY from a verification
         report (a) issued by a verifier whose accreditation was valid when it
         was issued and covers the sectoral scope of the precursor's category,
         and (b) covering the period in which the precursor was produced;
     (5) with no such report, the default value for the precursor applies.

   So "actual" is a REQUEST, not a switch. The row records the choice and
   whatever the precursor's operator has supplied; the number the calculation
   uses is the actual figure only once all of it is in and every condition of
   (4) holds. Until then the default stands in, and the screen says so. That
   keeps the exporter's report correct at every moment — never an unverified
   figure in a filing — while letting them start the request the day they
   choose it.

   Everything here is pure arithmetic over the EU tables and the stored row;
   the one write is `commitPrecursor`, the single path a basis change takes to
   the store.
   ════════════════════════════════════════════════════════════ */

import { isEuOrExempt } from "../config";
import { precursorContribution, saveSupplier, validateVerificationReport, valueType, listSuppliers, type PrecursorSupplier } from "../precursor-suppliers";
import { workspaceCountry, type VerificationWorkspace } from "../workspace";
import { defaultMarkup, lookupDefault, lookupUnknownOrigin, rateForYear, rateSheet, rowForAnyCn } from "./eu-rates";
import { basisCompleteness, fieldStatuses } from "./precursor-fields";

/* ── The default value of one precursor ─────────────────────────── */
export type PrecursorDefault = {
  /** tCO₂e per tonne, mark-up included — the figure item 22 reports */
  total: number;
  direct: number;
  indirect: number | null;
  year: number;
  markup: number;
  /** the CBAM route letter the EU built the value on */
  route: string;
  /** which table the figure came from */
  source: "country" | "other" | "unknown_origin";
  usedCountry: string;
  /** false when the country is unknown: Annex IV to the Regulation publishes one highest value, not a direct/indirect split */
  splitKnown: boolean;
};

/** The default value for a precursor in a reporting year. With no country — or
    one flagged unknown — it is the HIGHEST national default for the CN code
    (Annex IV to Regulation 2023/956). */
export function defaultFor(cn: string, country: string | undefined, year: number, opts: { unknownOrigin?: boolean } = {}): PrecursorDefault | null {
  if (!cn.trim()) return null;
  const y = Math.max(2026, year);
  const row = rowForAnyCn(cn);
  const markup = row ? defaultMarkup(row.sector, y) : 0;

  if (opts.unknownOrigin || !country) {
    const u = lookupUnknownOrigin(cn);
    if (u) {
      const total = y <= 2026 ? u.y2026 : y === 2027 ? u.y2027 : u.y2028;
      return { total, direct: total, indirect: null, year: y, markup, route: u.route, source: "unknown_origin", usedCountry: "", splitKnown: false };
    }
  }
  const hit = lookupDefault(cn, country || "ZZ");
  if (!hit) return null;
  const total = rateForYear(hit.rates, y);
  const scale = hit.rates.total > 0 ? total / hit.rates.total : 1;
  return {
    total,
    direct: hit.rates.direct * scale,
    indirect: hit.rates.indirect == null ? null : hit.rates.indirect * scale,
    year: y,
    markup,
    route: hit.rates.route,
    source: hit.usedOther ? "other" : "country",
    usedCountry: hit.usedCountry,
    splitKnown: true,
  };
}

/* ── Where a row stands ─────────────────────────────────────────── */
export type BasisState =
  | "default" // the exporter chose a default value
  | "needs_you" // actual: the exporter's own fields are not all in
  | "not_requested" // actual: nothing sent to the precursor's operator yet
  | "awaiting_precursor" // actual: asked, not all answered
  | "not_admissible" // actual: everything in, but a condition of A.1(4) fails
  | "actual"; // actual: in use

export type Admissibility = {
  state: BasisState;
  /** every required answer is in */
  complete: boolean;
  /** the figure may be used in place of the default */
  usable: boolean;
  /** plain sentences for a figure that is complete but cannot be used */
  reasons: string[];
};

const iso = (d: string | undefined) => (d ? d.slice(0, 10) : "");

export function admissibility(row: PrecursorSupplier, period: { periodStart: string; periodEnd: string }): Admissibility {
  if (row.valueBasis !== "actual") return { state: "default", complete: true, usable: false, reasons: [] };

  /* An unidentified country of production is a default, whatever else is on the row.
     An actual value is reported under Annex IV item 23 (country of origin required —
     not "where known", as item 22 has it) and item 28 (the operator and installation
     of origin); Annex II A.1(4) lets third-country data in only from the producing
     operator's verification report. Without a country there is no operator to hold
     one, and 2025/2621 Article 1(5) says which default applies instead: Annex IV. */
  if (row.originUnknown) {
    return { state: "default", complete: true, usable: false, reasons: ["The country of production cannot be identified, so the highest default value applies (Annex IV to Implementing Regulation 2025/2621)."] };
  }

  // Made inside the EU or an exempted territory: nothing to verify, zero by construction.
  if (isEuOrExempt(row.country)) {
    const c = basisCompleteness(row, {});
    return { state: c.complete ? "actual" : "needs_you", complete: c.complete, usable: c.complete, reasons: [] };
  }

  const c = basisCompleteness(row, { report: Boolean(row.verificationReportFileId) });
  if (!c.complete) {
    const mine = c.exporter.answered < c.exporter.total;
    return {
      state: mine ? "needs_you" : row.smartLinkSentAt ? "awaiting_precursor" : "not_requested",
      complete: false,
      usable: false,
      reasons: [],
    };
  }

  const reasons: string[] = [];
  const checks = validateVerificationReport(row);
  reasons.push(...checks.failedReasons);
  if (row.verifierReasonableAssurance === false) reasons.push("The verification statement does not conclude with reasonable assurance.");

  /* Condition (b): the report must cover the period in which the precursor
     was made. Unless the exporter has evidenced another time of production,
     that is presumed to be the period of the good itself (recital 25). */
  const start = iso(row.reportingPeriodStart);
  const end = iso(row.reportingPeriodEnd);
  if (start && end) {
    if (end < start) reasons.push("The reporting period ends before it starts.");
    else if ((row.reportingPeriodBasis ?? "default_period") === "default_period") {
      if (start > iso(period.periodStart) || end < iso(period.periodEnd)) {
        reasons.push(`The precursor's reporting period (${start} to ${end}) does not cover this good's reporting year (${iso(period.periodStart)} to ${iso(period.periodEnd)}). If it was made at another time, say so under “reporting period” and keep the evidence for the verifier.`);
      }
    }
  }
  const usable = reasons.length === 0;
  return { state: usable ? "actual" : "not_admissible", complete: true, usable, reasons };
}

/* ── The one write path ─────────────────────────────────────────── */
type WorkspaceYear = Pick<VerificationWorkspace, "year" | "periodStart" | "periodEnd">;

/** Applies a row's basis and saves it. `default` takes the EU table's value;
    `actual` takes the operator's figure when — and only when — it is complete
    and admissible, and the default otherwise. */
export function commitPrecursor(row: PrecursorSupplier, ws: WorkspaceYear): PrecursorSupplier {
  // See `admissibility`: no country of production, no actual value. Enforced here, at the
  // one write path, so a row saved before this rule — or one that arrived from a link —
  // is settled onto the default the next time it is touched.
  if (row.originUnknown && row.valueBasis === "actual") row = { ...row, valueBasis: "default" };
  if (!row.valueBasis) return saveSupplier(row);
  const d = defaultFor(row.cnCode, row.country, ws.year, { unknownOrigin: row.originUnknown });

  if (row.valueBasis === "default") {
    return saveSupplier({
      ...row,
      origin: "purchased",
      dataOrigin: "default_value",
      seeTco2ePerT: d?.total ?? null,
      verificationChecks: undefined,
    });
  }

  const probe = admissibility({ ...row, origin: "purchased" }, ws);
  let saved = saveSupplier({ ...row, origin: "purchased", dataOrigin: probe.complete ? "supplier_verified" : "supplier_unverified" });

  const now = admissibility(saved, ws);
  const keep = now.usable && (isEuOrExempt(saved.country) || valueType(saved) === "actual");
  if (!keep) {
    // The default stands in. The operator's declared figures stay on the row,
    // untouched, ready for the day the report is complete.
    saved = saveSupplier({ ...saved, dataOrigin: "default_value", seeTco2ePerT: d?.total ?? null });
  }
  return saved;
}

/* ── What using a default does to the whole good ────────────────── */
export type DefaultExposure = {
  /** direct precursors on a default value */
  onDefault: number;
  /** direct precursors in all, scrap excluded */
  total: number;
  /** tCO₂e per tonne of the good that the precursors add, at today's figures — null until production is known */
  precursorPerTonne: number | null;
  /** the EU default value for the finished good itself, this country and year */
  finishedGoodDefault: number | null;
  /** the share of the precursor emissions that rests on a default, 0–1 */
  defaultShare: number | null;
  /** the precursors alone are at or above the finished good's own default */
  atOrAboveFinishedDefault: boolean;
  /** the largest mark-up on a default in use, as a fraction (0.1 = +10 %) */
  markup: number;
  /** a default rests on the highest value for the CN code because the origin is unknown */
  anyUnknownOrigin: boolean;
};

export function defaultExposure(ws: VerificationWorkspace): DefaultExposure {
  const direct = listSuppliers(ws.id).filter((s) => !s.parentId && !s.isScrap);
  const onDefault = direct.filter((s) => s.dataOrigin === "default_value");
  const result = precursorContribution(ws);
  const sheet = ws.cnCode ? rateSheet({ cn: ws.cnCode, country: workspaceCountry(ws), year: ws.year }) : null;

  const known = result.byNode.some((n) => n.ratioFromGood != null);
  const precursorPerTonne = known ? result.perTonne : null;
  const finishedGoodDefault = sheet?.defaultValue ?? null;

  let markup = 0;
  for (const s of onDefault) {
    const d = defaultFor(s.cnCode, s.country, ws.year, { unknownOrigin: s.originUnknown });
    if (d && d.markup > markup) markup = d.markup;
  }

  return {
    onDefault: onDefault.length,
    total: direct.length,
    precursorPerTonne,
    finishedGoodDefault,
    defaultShare: known ? result.defaultValueShare : null,
    atOrAboveFinishedDefault: precursorPerTonne != null && finishedGoodDefault != null && precursorPerTonne >= finishedGoodDefault,
    markup,
    anyUnknownOrigin: onDefault.some((s) => s.originUnknown || !s.country),
  };
}

/* ── What the PRECURSOR's operator still has to answer ───────────
   The supplier's form gates Submit on its own side of the request only. The
   exporter's fields (the good, where it came from, the quantity) are the
   exporter's to supply, and a supplier must not be stuck on a box they cannot
   fill in. Required items only; a "no" to reasonable assurance is an answer,
   but not one that lets the figure be used, so it is reported as a gap too. */
export function supplierGaps(row: PrecursorSupplier): string[] {
  const attached = { report: Boolean(row.verificationReportFileId) };
  const gaps = fieldStatuses(row, attached, "precursor")
    .filter((x) => x.field.need === "required" && !x.answered)
    .map((x) => x.field.label);
  if (row.verifierReasonableAssurance === false) gaps.push("A verification statement that concludes with reasonable assurance");
  return gaps;
}

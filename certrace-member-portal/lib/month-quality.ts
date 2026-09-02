/* ════════════════════════════════════════════════════════════
   THE QUALITY CHECK — everything wrong with this month, in one list

   What the supplier meets between filling the form in and signing it, and what
   the exporter reads before confirming it. Four kinds of finding, and the
   distinction between the first two is the whole point:

     MANDATORY   a required field is empty or unusable. BLOCKS submission.
                 Not a suggestion — a month missing production has no
                 denominator, and one missing an emission factor computes zero
                 CO₂ from a furnace that ran.

     VALIDATION  a figure is present but outside what the quantity can
                 physically be, or outside the band the sector reports. Warns.

     ANOMALY     a figure is plausible on its own and strange next to the rest
                 of the year — output halved, intensity doubled, a fuel that
                 has never appeared before. Warns.

     CONSISTENCY the month contradicts itself: fuel burned with no production,
                 precursors received into a month that made nothing.

   EVERY FINDING CARRIES A JUMP TARGET. A list that says "electricity factor
   missing" and leaves the reader to find it is a list they read once and stop
   reading. `step` and `field` are what the screen scrolls to.

   WHY IT IS ARITHMETIC AND NOT A MODEL. Every rule here is checkable, states
   its threshold, and gives the same answer twice. A language model asked "does
   this look right" produces a different opinion each run and cannot be shown
   to a verifier. Where judgement genuinely helps — reading an invoice, naming
   a fuel — that lives in the extraction path, not here.
   ════════════════════════════════════════════════════════════ */

import { fuelTypeLabel, monthIssues, monthResult, type MonthlyEntry } from "./monthly-data";
import { kgPerUnit } from "./cbam/fuel-defaults";
import { mmdIssues, type WorkspaceMmdContent } from "./workspace-mmd";
import type { PrecursorSupplier } from "./precursor-suppliers";

export type FindingKind = "mandatory" | "validation" | "anomaly" | "consistency";

/** Which step of the supplier flow the finding belongs to, so the list can
    send the reader to the screen that fixes it. */
export type FindingStep = "installation" | "mmd" | "monthly" | "precursors" | "documents";

export type QualityFinding = {
  kind: FindingKind;
  step: FindingStep;
  /** DOM id on the offending control — `qf-<field>` */
  field: string;
  title: string;
  /** what is wrong and what to do about it, in one or two sentences */
  detail: string;
};

export type QualityReport = {
  findings: QualityFinding[];
  mandatory: QualityFinding[];
  warnings: QualityFinding[];
  /** true when nothing blocks submission */
  canSubmit: boolean;
  /** 0–100. Completeness only — it is NOT a judgement about the figures. */
  score: number;
};

/* ── Sector bands ───────────────────────────────────────────────
   Not limits, and deliberately wide. These are the ranges CBAM iron & steel
   and aluminium installations actually report in; a figure outside one is
   usually a unit error — MJ typed where GJ was wanted, kWh where MWh was — and
   almost never a plant that emits forty times the industry.

   A band that is too tight is worse than none: it trains the reader that the
   warnings are noise, and the next one they scroll past is the real one. */
const BANDS = {
  /** tCO₂e per tonne of product, total */
  intensity: { min: 0.05, max: 6.0 },
  /** MWh per tonne of product */
  electricityPerTonne: { min: 0.01, max: 20 },
  /** tCO₂ per GJ — every fossil fuel sits between roughly 0.05 and 0.11 */
  fuelEf: { min: 0.02, max: 0.15 },
  /** tCO₂ per MWh — a grid factor above 1.2 is a coal grid at its worst */
  gridFactor: { min: 0.0, max: 1.2 },
} as const;

/** How far a month may move from the year's own average before it is worth a
    second look. 60% either way — a steel plant genuinely has quiet months. */
const ANOMALY_RATIO = 0.6;

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export type QualityInput = {
  entry: MonthlyEntry;
  mmd: WorkspaceMmdContent;
  precursors: PrecursorSupplier[];
  month: string;
  /** the other months of the same year that already have data, for the
      anomaly pass. Empty in month one, which is why that pass is skipped. */
  peers: MonthlyEntry[];
  /** how many documents are attached to this month */
  documentCount: number;
  /** whether the installation record a verifier will ask about is complete */
  installationGaps: string[];
};

export function runMonthQualityCheck(input: QualityInput): QualityReport {
  const { entry, mmd, precursors, peers, documentCount, installationGaps } = input;
  const findings: QualityFinding[] = [];

  /* ── 1 · Installation ──────────────────────────────────────── */
  if (installationGaps.length > 0) {
    findings.push({
      kind: "mandatory",
      step: "installation",
      field: "qf-installation",
      title: "The installation record is incomplete",
      detail: `A verifier asks for all of these about a producing site: ${installationGaps.join(", ")}. Correct them at the top of the form — your changes go back to the exporter.`,
    });
  }

  /* ── 2 · Methodology ───────────────────────────────────────── */
  for (const issue of mmdIssues(mmd)) {
    findings.push({
      kind: "mandatory",
      step: "mmd",
      field: `qf-mmd-${issue.field}`,
      title: "Methodology is incomplete",
      detail: issue.message,
    });
  }

  /* ── 3 · The month's own rules ─────────────────────────────── */
  for (const issue of monthIssues(entry)) {
    findings.push({
      kind: issue.severity === "error" ? "mandatory" : "validation",
      step: "monthly",
      field: `qf-${issue.field}`,
      title: issue.severity === "error" ? "Required figure missing or unusable" : "Worth checking",
      detail: issue.message,
    });
  }

  /* ── 4 · Physically-implausible figures ────────────────────── */
  entry.fuels.forEach((f, i) => {
    const ef = num(f.efTco2PerGj);
    if (ef > 0 && (ef < BANDS.fuelEf.min || ef > BANDS.fuelEf.max)) {
      findings.push({
        kind: "validation",
        step: "monthly",
        field: `qf-fuel:${f.id}:ef`,
        title: `${fuelTypeLabel(f.fuelType)} — emission factor out of band`,
        detail: `${ef} tCO₂/GJ is outside the ${BANDS.fuelEf.min}–${BANDS.fuelEf.max} range every fossil fuel sits in. The usual cause is a factor stated per m³ or per litre rather than per gigajoule, which is roughly 25× out.`,
      });
    }
    /* The 1000 MJ/kg ceiling is calibrated per KILOGRAM — no real fuel clears
       it, hydrogen included. A tonne is a thousand kilograms, so the same
       ceiling applied to `ncvMjPerUnit` directly would flag every correctly
       entered mass-basis row (Point G's own natural gas figure is 48,000 MJ
       per TONNE) as a unit error. Convert through `kgPerUnit` first — the
       same conversion `euStandardFor` uses — so the check compares like with
       like regardless of which unit the row happens to be in. A fuel with no
       density on file for its unit is skipped rather than guessed at. */
    const kg = f.unit === "GJ" ? null : kgPerUnit(f.fuelType, f.unit);
    const ncvPerKg = kg != null && kg > 0 ? num(f.ncvMjPerUnit) / kg : null;
    if (num(f.quantity) > 0 && ncvPerKg != null && ncvPerKg > 1000) {
      findings.push({
        kind: "validation",
        step: "monthly",
        field: `qf-fuel:${f.id}:ncv`,
        title: `${fuelTypeLabel(f.fuelType)} — calorific value looks like the wrong unit`,
        detail: `${f.ncvMjPerUnit} MJ per ${f.unit} (${ncvPerKg.toLocaleString("en-GB", { maximumFractionDigits: 1 })} MJ/kg) is far above any real fuel. Check whether the figure on the spec sheet is in kJ or in MJ.`,
      });
    }
    void i;
  });

  const grid = num(entry.electricityFactorTco2PerMwh);
  if (grid > BANDS.gridFactor.max) {
    findings.push({
      kind: "validation",
      step: "monthly",
      field: "qf-electricityFactor",
      title: "Grid emission factor is implausibly high",
      detail: `${grid} tCO₂/MWh is above the dirtiest grid on record. Thailand's published factor is 0.4999. A factor given in kgCO₂/kWh is the same number 1000× out.`,
    });
  }

  const production = num(entry.productionTonnes);
  const result = monthResult(entry);
  const totalCO2 = num(result.directTCO2) + num(result.indirectTCO2);

  if (production > 0 && totalCO2 > 0) {
    const intensity = totalCO2 / production;
    if (intensity > BANDS.intensity.max || intensity < BANDS.intensity.min) {
      findings.push({
        kind: "validation",
        step: "monthly",
        field: "qf-production",
        title: "Emissions per tonne are outside the sector range",
        detail: `This month works out at ${intensity.toFixed(3)} tCO₂e per tonne. CBAM iron & steel and aluminium installations report between ${BANDS.intensity.min} and ${BANDS.intensity.max}. Check the production tonnage and the fuel quantities are both for this month, and both in the units the form asks for.`,
      });
    }
  }

  if (production > 0 && num(entry.electricityMwh) > 0) {
    const perTonne = num(entry.electricityMwh) / production;
    if (perTonne > BANDS.electricityPerTonne.max) {
      findings.push({
        kind: "validation",
        step: "monthly",
        field: "qf-electricity",
        title: "Electricity per tonne is very high",
        detail: `${perTonne.toFixed(2)} MWh per tonne. Even a primary aluminium smelter is around 15. Check the meter reading is in MWh rather than kWh.`,
      });
    }
  }

  /* ── 5 · The month against itself ──────────────────────────── */
  if (production === 0 && entry.fuels.some((f) => num(f.quantity) > 0)) {
    findings.push({
      kind: "consistency",
      step: "monthly",
      field: "qf-production",
      title: "Fuel burned in a month with no production",
      detail: "Fuel is recorded but production is zero. If the plant ran, the tonnage is missing; if it was idle, the fuel belongs outside the boundary and the methodology should say so.",
    });
  }

  const precursorsThisMonth = precursors.filter((p) => (p.monthlyQuantities ?? []).some((q) => q.month === input.month && q.tonnes > 0));
  if (production === 0 && precursorsThisMonth.length > 0) {
    findings.push({
      kind: "consistency",
      step: "precursors",
      field: "qf-precursors",
      title: "Precursors received into a month with no output",
      detail: "Material arrived but nothing was produced. That happens — stock builds — but a verifier asks, so make sure the production figure is right.",
    });
  }

  const precursorsExpected = precursors.filter((p) => p.parentId === null);
  const missingPrecursors = precursorsExpected.filter((p) => !(p.monthlyQuantities ?? []).some((q) => q.month === input.month));
  if (production > 0 && missingPrecursors.length > 0) {
    findings.push({
      kind: "mandatory",
      step: "precursors",
      field: "qf-precursors",
      title: `${missingPrecursors.length} precursor(s) have no figure for this month`,
      detail: `${missingPrecursors.map((p) => p.precursorName || "Unnamed precursor").join(", ")}. A blank month is read as a gap, not as zero — and a gap understates the finished good. Enter 0 if genuinely none arrived.`,
    });
  }

  /* ── 6 · This month against the others ─────────────────────── */
  const counted = peers.filter((p) => p.productionTonnes > 0);
  if (counted.length >= 2 && production > 0) {
    const avg = counted.reduce((a, p) => a + p.productionTonnes, 0) / counted.length;
    if (avg > 0) {
      const ratio = production / avg;
      if (ratio < 1 - ANOMALY_RATIO || ratio > 1 + ANOMALY_RATIO) {
        findings.push({
          kind: "anomaly",
          step: "monthly",
          field: "qf-production",
          title: ratio > 1 ? "Production is well above the rest of the year" : "Production is well below the rest of the year",
          detail: `${production.toFixed(1)} t against an average of ${avg.toFixed(1)} t across the ${counted.length} months already reported. A shutdown, a campaign or a big order all explain it — but so does a decimal point, so it is worth one look.`,
        });
      }
    }

    const peerFuels = new Set(counted.flatMap((p) => p.fuels.map((f) => f.fuelType)));
    for (const f of entry.fuels) {
      if (num(f.quantity) > 0 && peerFuels.size > 0 && !peerFuels.has(f.fuelType)) {
        findings.push({
          kind: "anomaly",
          step: "monthly",
          field: `qf-fuel:${f.id}:quantity`,
          title: `${fuelTypeLabel(f.fuelType)} has not appeared in any other month`,
          detail: "A new fuel is fine if the plant genuinely switched or trialled one. If it is the same fuel under a different name, pick the name the other months use so the year can be summed.",
        });
      }
    }
  }

  /* ── 7 · Evidence ──────────────────────────────────────────── */
  if (documentCount === 0) {
    findings.push({
      kind: "validation",
      step: "documents",
      field: "qf-documents",
      title: "Nothing is attached to this month",
      detail: "A figure with no document behind it is the first thing a verifier removes. Attach the utility invoice, the fuel delivery notes and the production log.",
    });
  }

  const mandatory = findings.filter((f) => f.kind === "mandatory");
  const warnings = findings.filter((f) => f.kind !== "mandatory");

  /* Completeness only, and the label on screen says so. A score that also
     graded the FIGURES would be an opinion presented as a percentage, and the
     first person to read it as "87% accurate" would be reading something the
     product never claimed. */
  const checks = 12;
  const score = Math.max(0, Math.round(((checks - Math.min(checks, mandatory.length * 2 + warnings.length)) / checks) * 100));

  return { findings, mandatory, warnings, canSubmit: mandatory.length === 0, score };
}

export const KIND_LABEL: Record<FindingKind, string> = {
  mandatory: "Must be fixed",
  validation: "Out of range",
  anomaly: "Unusual",
  consistency: "Contradicts itself",
};

export const KIND_BLURB: Record<FindingKind, string> = {
  mandatory: "The form will not submit until these are answered. Each one is a figure something downstream divides by or multiplies with.",
  validation: "Present, but outside what the quantity can physically be or what the sector reports. Usually a unit.",
  anomaly: "Plausible on its own, unusual next to the rest of the year. Worth one look, then carry on.",
  consistency: "Two answers in this month disagree with each other.",
};

export const STEP_LABEL: Record<FindingStep, string> = {
  installation: "Installation",
  mmd: "Methodology",
  monthly: "Monthly data",
  precursors: "Precursors",
  documents: "Documents",
};

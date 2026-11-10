/* ════════════════════════════════════════════════════════════
   WHAT A DIRECT PRECURSOR'S ACTUAL VALUE NEEDS, AND WHO SUPPLIES IT

   One registry, read by the exporter's Precursors tab, the supplier's
   /p/<token> form, the completeness meter and the report set — so a field's
   label, its Annex IV number, whether it is required and who fills it in are
   stated once and cannot drift between the two sides of the same request.

   WHERE THE LIST COMES FROM. A precursor is "used by the installation", so its
   data lands in the exporter's operator's emissions report under the items of
   Annex IV to Implementing Regulation (EU) 2025/2547:

       item 20/21   quantity of each precursor produced outside the installation
       item 22      a precursor on a DEFAULT value: CN code, name of the good,
                    country of origin (where known), the applicable default value
       item 23      a precursor on an ACTUAL value: CN code, name of the good,
                    country of origin, reporting period (and whether it is the
                    default period or the actual time of production), specific
                    embedded emissions — direct and, where applicable, indirect
       item 25      precursors from several installations
       item 28      the operator and the installation of origin: operator name,
                    installation name, CBAM Registry installation identifier
                    (if available), reporting period
       item 35      the sector-specific parameters of point 2 of that Annex

   The verifier's own details are the matching items of the verification report
   template in Implementing Regulation (EU) 2025/2546, point 2.5(b)(7) — those
   carry a "VR" tag so nobody mistakes them for an Annex IV number.

   ACTUAL DATA IS ADMISSIBLE ONLY WITH A REPORT BEHIND IT. Annex II A.1(4) to
   2025/2547: a precursor made outside the installation, in a third country, may
   be used on actual data only if the figure comes from a verification report
   (a) issued by a verifier whose accreditation was valid when the report was
   issued and covers the precursor's sectoral scope, and (b) covering the period
   in which the precursor was produced. Otherwise A.1(5): the default value
   applies. That is why the verifier fields below are required, not optional.

   WHAT IS DELIBERATELY OPTIONAL: anything the regulation does not ask the
   operator to pass on — the installation's UN/LOCODE, address and coordinates
   (Annex IV item 28 names none of them), the verifier's address and lead
   auditor, the precursor's own summary emissions report, and purchase
   documents. They help a verifier find and test the figure; they are not
   conditions of using it.
   ════════════════════════════════════════════════════════════ */

import {
  aggregatedGoodsCategory,
  isEuOrExempt,
  type AggregatedGoodsCategory,
} from "../config";
import type { PrecursorSupplier } from "../precursor-suppliers";
import { categoryRequiresIndirect } from "./product-category-rules";
import { cnProductByCode } from "./cn-catalogue";

export type FieldOwner = "exporter" | "precursor";
export type FieldNeed = "required" | "optional";
export type FieldInput =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "country"
  | "select"
  | "yesno"
  | "checkbox"
  | "file";

export type FieldGroup =
  | "identity"
  | "quantity"
  | "origin"
  | "period"
  | "installation"
  | "emissions"
  | "sector"
  | "verifier"
  | "documents";

export const GROUP_LABEL: Record<FieldGroup, string> = {
  identity: "The good",
  quantity: "Quantity used",
  origin: "Where it was made",
  period: "Reporting period",
  installation: "Operator and installation of origin",
  emissions: "Specific embedded emissions",
  sector: "Sector-specific parameters",
  verifier: "The verifier and the verification statement",
  documents: "Documents",
};

/** The six sectors CBAM covers (Annex I to Regulation (EU) 2023/956) — and so the six
    sectoral scopes a verifier can be accredited for. Electricity is in the list
    because an accreditation can be held for it, even though no electricity CN code
    is in this portal's catalogue. */
export const ACCREDITATION_SECTORS = [
  "Cement",
  "Electricity",
  "Fertilisers",
  "Iron and steel",
  "Aluminium",
  "Hydrogen",
] as const;

export type PrecursorField = {
  /** a PrecursorSupplier property, or a `sector:` / `file:` virtual key */
  key: string;
  label: string;
  /** one sentence, plain words */
  hint?: string;
  /** the item of Annex IV (operator's emissions report) this field feeds, e.g. "23(e)"; "VR …" for the verification report template */
  tag: string;
  owner: FieldOwner;
  need: FieldNeed;
  input: FieldInput;
  group: FieldGroup;
  unit?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** the file slot an upload field writes to — an evidence key */
  slot?: "report" | "summary" | "purchase";
  /** shown, never edited: the good is chosen once, when the precursor is added. To
      change it, remove the precursor and add the right one — a CN code that could be
      retyped under an existing row would quietly re-point its default value, its
      sector parameters and its verification at a different good. */
  locked?: boolean;
  /** a sentence shown when the field is optional, saying why it still helps */
  whyOptional?: string;
};

/* ── Sector-specific parameters (Annex IV, point 2) ─────────────
   Keyed by aggregated goods category, copied from the table in the regulation.
   "N.a." categories have none. Stored on `sectorParams` under the keys below. */
type SectorParam = {
  key: string;
  label: string;
  unit?: string;
  input?: FieldInput;
  hint?: string;
  options?: { value: string; label: string }[];
  optional?: boolean;
};

const SCRAP: SectorParam[] = [
  { key: "scrapUsedTPerT", label: "Scrap used to produce 1 t", unit: "t/t" },
  {
    key: "preConsumerScrapPct",
    label: "Share of that scrap that is pre-consumer scrap",
    unit: "%",
  },
];
const ALLOY: SectorParam[] = [
  { key: "mnPct", label: "Manganese (Mn)", unit: "mass %" },
  { key: "crPct", label: "Chromium (Cr)", unit: "mass %" },
  { key: "niPct", label: "Nickel (Ni)", unit: "mass %" },
  {
    key: "otherAlloyPct",
    label: "Total of other alloying elements",
    unit: "mass %",
  },
];
const REDUCING: SectorParam = {
  key: "reducingAgent",
  label: "Main reducing agent used",
  input: "text",
  hint: "For example coke, natural gas, hydrogen.",
};
const AL_OTHER: SectorParam = {
  key: "alOtherElementsPct",
  label: "Total content of elements other than aluminium",
  unit: "mass %",
  hint: "Only if it exceeds 1 %.",
  optional: true,
};

const SECTOR_PARAMS: Partial<Record<AggregatedGoodsCategory, SectorParam[]>> = {
  Cement: [
    {
      key: "clinkerRatioPct",
      label: "Clinker-to-cement ratio",
      unit: "%",
      hint: "Mass of clinker consumed per tonne of cement produced.",
    },
  ],
  Urea: [
    { key: "ureaPurityPct", label: "Purity (urea)", unit: "mass %" },
    { key: "nContentPct", label: "Content of nitrogen (N)", unit: "mass %" },
  ],
  "Nitric acid": [
    { key: "concentrationPct", label: "Concentration", unit: "mass %" },
    { key: "nContentPct", label: "Content of nitrogen (N)", unit: "mass %" },
  ],
  Ammonia: [
    {
      key: "concentrationPct",
      label: "Concentration, if a hydrous solution",
      unit: "mass %",
      optional: true,
    },
    { key: "nContentPct", label: "Content of nitrogen (N)", unit: "mass %" },
  ],
  "Mixed fertilisers": [
    {
      key: "nAmmoniumPct",
      label: "Nitrogen as ammonium (NH₄⁺)",
      unit: "mass %",
    },
    { key: "nNitratePct", label: "Nitrogen as nitrate (NO₃⁻)", unit: "mass %" },
    { key: "nUreaPct", label: "Nitrogen as urea", unit: "mass %" },
    {
      key: "nOrganicPct",
      label: "Nitrogen in other (organic) forms",
      unit: "mass %",
    },
    { key: "nTotalPct", label: "Total nitrogen (N)", unit: "mass %" },
  ],
  "Pig iron": [REDUCING, ...ALLOY],
  "Direct reduced iron": [REDUCING, ...ALLOY],
  "Ferro-alloys": [
    {
      key: "mnPct",
      label: "Manganese (Mn) — for FeMn",
      unit: "mass %",
      optional: true,
    },
    {
      key: "crPct",
      label: "Chromium (Cr) — for FeCr",
      unit: "mass %",
      optional: true,
    },
    {
      key: "niPct",
      label: "Nickel (Ni) — for FeNi",
      unit: "mass %",
      optional: true,
    },
    { key: "carbonPct", label: "Carbon", unit: "mass %" },
  ],
  "Crude steel": [
    { ...REDUCING, label: "Main reducing agent, if known", optional: true },
    ...ALLOY,
    ...SCRAP,
  ],
  "Iron or steel products": [
    {
      ...REDUCING,
      label: "Main reducing agent used in precursor production, if known",
      optional: true,
    },
    ...ALLOY,
    ...SCRAP,
  ],
  "Unwrought aluminium": [...SCRAP, AL_OTHER],
  "Aluminium products": [...SCRAP, AL_OTHER],
};

export const sectorParamsFor = (agg: AggregatedGoodsCategory): SectorParam[] =>
  SECTOR_PARAMS[agg] ?? [];

/** The aggregated goods category of a precursor, from its CN code. */
export function categoryOf(
  row: Pick<PrecursorSupplier, "cnCode" | "catalogProductId">,
): AggregatedGoodsCategory | null {
  const p = row.cnCode ? cnProductByCode(row.cnCode) : undefined;
  return p ? aggregatedGoodsCategory(p) : null;
}

/** Does this precursor's good count indirect emissions at all? Annex II to
    Regulation (EU) 2023/956: not for steel, aluminium or hydrogen. When the
    category cannot be resolved the answer is yes — never silently drop a
    field the regulation might ask for. */
export function needsIndirect(
  row: Pick<PrecursorSupplier, "cnCode" | "catalogProductId">,
): boolean {
  const c = categoryOf(row);
  return c ? categoryRequiresIndirect(c) : true;
}

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/* ── The fields of an ACTUAL value, in the order they are asked ── */
export function actualFields(
  row: Pick<PrecursorSupplier, "cnCode" | "catalogProductId"> & {
    country?: string;
  },
): PrecursorField[] {
  const indirect = needsIndirect(row);
  const agg = categoryOf(row);
  const sector = agg ? sectorParamsFor(agg) : [];

  const f: PrecursorField[] = [
    /* ── What the exporter already knows ──────────────────────── */
    {
      key: "cnCode",
      label: "CN code",
      tag: "23(a)",
      owner: "exporter",
      need: "required",
      input: "text",
      group: "identity",
      locked: true,
    },
    {
      key: "precursorName",
      label: "Name of the good",
      tag: "23(b)",
      owner: "exporter",
      need: "required",
      input: "text",
      group: "identity",
      locked: true,
    },
    {
      key: "country",
      label: "Country of origin",
      tag: "23(c)",
      owner: "exporter",
      need: "required",
      input: "country",
      group: "origin",
      hint: "Where the precursor was produced.",
    },
    {
      key: "originUnknown",
      label: "The country of production cannot be identified",
      tag: "23(c)",
      owner: "exporter",
      need: "optional",
      input: "checkbox",
      group: "origin",
      hint: "An actual value needs a country of origin (item 23(c)) and an identified operator (item 28), so the highest default value for the CN code applies instead — Annex IV to Implementing Regulation 2025/2621.",
    },
    {
      key: "quantityUsedT",
      label: "Quantity used in the reporting year",
      tag: "20 · 21",
      owner: "exporter",
      need: "required",
      input: "number",
      unit: "t",
      group: "quantity",
      hint: "Everything bought for this good over the year, including material that never reached the finished product — offcuts, spillage, burn-off.",
    },
    {
      key: "reportingPeriodBasis",
      label: "How the precursor's reporting period was fixed",
      tag: "23(d)",
      owner: "exporter",
      need: "required",
      input: "select",
      group: "period",
      options: [
        {
          value: "default_period",
          label: "Default — the same period as this good",
        },
        {
          value: "actual_time",
          label: "Actual time of production (evidence for the verifier)",
        },
      ],
      hint: "Unless you can show the precursor was made in another period, it is presumed to have been made in the period this good was.",
    },
    {
      key: "alsoFromOtherInstallations",
      label: "Is the same CN code also bought from other installations?",
      tag: "25",
      owner: "exporter",
      need: "optional",
      input: "yesno",
      options: YES_NO,
      group: "origin",
      whyOptional:
        "If it is, the value used is the weighted average across installations unless you show a single source (Article 14).",
    },
    {
      key: "file:purchase",
      label: "Delivery notes or purchase invoices",
      tag: "20 · 21",
      owner: "exporter",
      need: "optional",
      input: "file",
      slot: "purchase",
      group: "documents",
      whyOptional: "They let the verifier test the quantity above.",
    },

    /* ── What only the precursor's operator knows ─────────────── */
    {
      key: "name",
      label: "Name of the operator",
      tag: "28",
      owner: "precursor",
      need: "required",
      input: "text",
      group: "installation",
      hint: "The company that runs the installation — not a trader.",
    },
    {
      key: "installationName",
      label: "Name of the installation",
      tag: "28",
      owner: "precursor",
      need: "required",
      input: "text",
      group: "installation",
    },
    {
      key: "installationUniqueId",
      label: "Unique installation identifier in the CBAM Registry",
      tag: "28",
      owner: "precursor",
      need: "optional",
      input: "text",
      group: "installation",
      whyOptional:
        "The regulation asks for it “if available” — many third-country operators have none yet.",
    },
    {
      key: "reportingPeriodStart",
      label: "Reporting period — from",
      tag: "28 · 23(d)",
      owner: "precursor",
      need: "required",
      input: "date",
      group: "period",
    },
    {
      key: "reportingPeriodEnd",
      label: "Reporting period — to",
      tag: "28 · 23(d)",
      owner: "precursor",
      need: "required",
      input: "date",
      group: "period",
    },
    {
      key: "specificEmbeddedDirectTco2PerT",
      label: "Specific direct embedded emissions",
      tag: "23(e)",
      owner: "precursor",
      need: "required",
      input: "number",
      unit: "tCO₂e/t",
      group: "emissions",
      hint: "Per tonne of this precursor, as verified. Up to five decimals.",
    },
    indirect
      ? {
          key: "specificEmbeddedIndirectTco2PerT",
          label: "Specific indirect embedded emissions",
          tag: "23(e)",
          owner: "precursor",
          need: "required",
          input: "number",
          unit: "tCO₂e/t",
          group: "emissions",
          hint: "Electricity-related, per tonne. Required because this good counts indirect emissions.",
        }
      : {
          key: "specificEmbeddedIndirectTco2PerT",
          label: "Specific indirect embedded emissions",
          tag: "23(e)",
          owner: "precursor",
          need: "optional",
          input: "number",
          unit: "tCO₂e/t",
          group: "emissions",
          whyOptional:
            "Annex II to the Regulation counts direct emissions only for this good, so it is not used in the calculation.",
        },
  ];

  for (const p of sector) {
    f.push({
      key: `sector:${p.key}`,
      label: p.label,
      tag: "35",
      owner: "precursor",
      need: p.optional ? "optional" : "required",
      input: p.input ?? "number",
      unit: p.unit,
      group: "sector",
      hint: p.hint,
      whyOptional: p.optional
        ? "Only where it applies to this good."
        : undefined,
    });
  }

  f.push(
    {
      key: "verifierName",
      label: "Name of the verifier",
      tag: "VR 2.5(b)(7)(a)",
      owner: "precursor",
      need: "required",
      input: "text",
      group: "verifier",
    },
    {
      key: "verifierAddress",
      label: "Address where the verifier is established",
      tag: "VR 2.5(b)(7)(b)",
      owner: "precursor",
      need: "optional",
      input: "text",
      group: "verifier",
      whyOptional: "Printed on the statement; not needed to test the figure.",
    },
    {
      key: "verifierLeadAuditor",
      label: "CBAM lead auditor — name and contact",
      tag: "VR 2.5(b)(7)(d)",
      owner: "precursor",
      need: "optional",
      input: "text",
      group: "verifier",
      whyOptional: "Useful if your own verifier wants to confirm the report.",
    },
    {
      key: "verifierAccreditationNumber",
      label: "Accreditation number of the verifier",
      tag: "VR 2.5(b)(7)(e)",
      owner: "precursor",
      need: "required",
      input: "text",
      group: "verifier",
    },
    {
      key: "verifierAccreditationBody",
      label: "National accreditation body",
      tag: "VR 2.5(b)(7)(f)",
      owner: "precursor",
      need: "required",
      input: "text",
      group: "verifier",
    },
    {
      key: "verifierAccreditationIssuingCountry",
      label: "Country of the accreditation body",
      tag: "VR 2.5(b)(7)(g)",
      owner: "precursor",
      need: "required",
      input: "country",
      group: "verifier",
    },
    {
      key: "verifierAccreditationExpiryDate",
      label: "Accreditation valid until",
      tag: "VR 2.5(b)(7)(h)",
      owner: "precursor",
      need: "required",
      input: "date",
      group: "verifier",
      hint: "It must have been valid on the day the statement was issued.",
    },
    {
      key: "verificationSectoralScope",
      label: "Scope of accreditation",
      tag: "VR 2.5(b)(7)(i)",
      owner: "precursor",
      need: "required",
      input: "select",
      options: ACCREDITATION_SECTORS.map((v) => ({ value: v, label: v })),
      group: "verifier",
      hint: "It must cover this good's sector.",
    },
    {
      key: "verifierReasonableAssurance",
      label:
        "Does the statement conclude with reasonable assurance, with no material misstatement or non-conformity?",
      tag: "VR 2.5(b)(7)(j)",
      owner: "precursor",
      need: "required",
      input: "yesno",
      options: YES_NO,
      group: "verifier",
    },
    {
      key: "verificationReportIssueDate",
      label: "Date the verification statement was issued",
      tag: "VR 2.5(b)(7)(k)",
      owner: "precursor",
      need: "required",
      input: "date",
      group: "verifier",
    },
    {
      key: "file:report",
      label: "Verification report (PDF)",
      tag: "VR 2.6",
      owner: "precursor",
      need: "required",
      input: "file",
      slot: "report",
      group: "documents",
      hint: "The verifier's statement and report covering the period above.",
    },
    {
      key: "file:summary",
      label: "Operator's summary emissions report",
      tag: "1.2",
      owner: "precursor",
      need: "optional",
      input: "file",
      slot: "summary",
      group: "documents",
      whyOptional:
        "The shortened report the operator already produces for declarants — it shows how the figure was built.",
    },
    {
      key: "unlocode",
      label: "UN/LOCODE of the installation",
      tag: "28",
      owner: "precursor",
      need: "optional",
      input: "text",
      placeholder: "THLCH",
      group: "installation",
      whyOptional:
        "Helps a verifier place the site; item 28 asks only for the operator, the installation and its Registry identifier.",
    },
    {
      key: "fullAddress",
      label: "Full address of the installation (in English)",
      tag: "28",
      owner: "precursor",
      need: "optional",
      input: "text",
      group: "installation",
      whyOptional:
        "Helps a verifier place the site; item 28 asks only for the operator, the installation and its Registry identifier.",
    },
  );

  /* A precursor made inside the EU or in an exempted territory carries no CBAM
     liability — its figure is zero by construction and there is no verifier to
     ask. The exporter still names the good, where it came from and how much. */
  if (row.country && isEuOrExempt(row.country))
    return f.filter(
      (x) =>
        x.owner === "exporter" &&
        x.group !== "documents" &&
        x.group !== "period",
    );
  return f;
}

/* ── The fields of a DEFAULT value ──────────────────────────────
   Item 22 — nothing to ask a precursor for. The exporter names the good and,
   where known, where it was made; the value comes from the EU tables. */
export function defaultFields(): PrecursorField[] {
  return [
    {
      key: "cnCode",
      label: "CN code",
      tag: "22(a)",
      owner: "exporter",
      need: "required",
      input: "text",
      group: "identity",
      locked: true,
    },
    {
      key: "precursorName",
      label: "Name of the good",
      tag: "22(b)",
      owner: "exporter",
      need: "required",
      input: "text",
      group: "identity",
      locked: true,
    },
    {
      key: "country",
      label: "Country of origin, where known",
      tag: "22(c)",
      owner: "exporter",
      need: "optional",
      input: "country",
      group: "origin",
      hint: "Only where it is known — otherwise tick the box below.",
    },
    {
      key: "originUnknown",
      label: "The country of production cannot be identified",
      tag: "22(c)",
      owner: "exporter",
      need: "optional",
      input: "checkbox",
      group: "origin",
      hint: "The highest default value for the CN code applies — Annex IV to Implementing Regulation 2025/2621, Article 1(5).",
    },
    {
      key: "quantityUsedT",
      label: "Quantity used in the reporting year",
      tag: "20 · 21",
      owner: "exporter",
      need: "required",
      input: "number",
      unit: "t",
      group: "quantity",
    },
  ];
}

/* ── Reading a value off a row, by registry key ─────────────────── */
export function readField(row: PrecursorSupplier, key: string): unknown {
  if (key.startsWith("sector:"))
    return row.sectorParams?.[key.slice("sector:".length)];
  if (key.startsWith("file:")) return undefined;
  if (key === "originUnknown") return Boolean(row.originUnknown);
  if (key === "alsoFromOtherInstallations")
    return row.alsoFromOtherInstallations == null
      ? undefined
      : row.alsoFromOtherInstallations
        ? "yes"
        : "no";
  if (key === "verifierReasonableAssurance")
    return row.verifierReasonableAssurance == null
      ? undefined
      : row.verifierReasonableAssurance
        ? "yes"
        : "no";
  return (row as unknown as Record<string, unknown>)[key];
}

export function writeField(
  row: PrecursorSupplier,
  key: string,
  value: unknown,
): PrecursorSupplier {
  if (key.startsWith("sector:")) {
    const k = key.slice("sector:".length);
    return {
      ...row,
      sectorParams: {
        ...(row.sectorParams ?? {}),
        [k]: value == null ? "" : String(value),
      },
    };
  }
  if (key === "originUnknown") {
    /* No country → no operator to ask → no actual value. Ticking it clears the
       country and puts the precursor on the default value, in the same step, so the
       row can never be left saying "actual" about a country nobody could name. */
    const unknown = Boolean(value);
    return unknown
      ? { ...row, originUnknown: true, country: "", valueBasis: "default" }
      : { ...row, originUnknown: false };
  }
  if (key === "alsoFromOtherInstallations")
    return {
      ...row,
      alsoFromOtherInstallations:
        value === "yes" ? true : value === "no" ? false : undefined,
    };
  if (key === "verifierReasonableAssurance")
    return {
      ...row,
      verifierReasonableAssurance:
        value === "yes" ? true : value === "no" ? false : undefined,
    };
  return { ...row, [key]: value } as PrecursorSupplier;
}

const filled = (v: unknown): boolean => {
  if (v == null) return false;
  if (typeof v === "number") return Number.isFinite(v);
  if (typeof v === "string") return v.trim() !== "";
  return Boolean(v);
};

/** Is a field answered? File fields are answered by an attached document, so
    the caller says which slots hold one. */
export function isAnswered(
  row: PrecursorSupplier,
  field: PrecursorField,
  attached: Partial<Record<NonNullable<PrecursorField["slot"]>, boolean>> = {},
): boolean {
  if (field.input === "file")
    return Boolean(field.slot && attached[field.slot]);
  const v = readField(row, field.key);
  /* Direct emissions of 0 is an answer; "no" to reasonable assurance is an
     answer too — but not an acceptable one, which is checked separately. */
  return filled(v);
}

export type FieldStatus = { field: PrecursorField; answered: boolean };

/** Every field the row is asked, with whether it has an answer, for the
    owner named (or both). */
export function fieldStatuses(
  row: PrecursorSupplier,
  attached: Partial<Record<NonNullable<PrecursorField["slot"]>, boolean>> = {},
  owner?: FieldOwner,
): FieldStatus[] {
  const list =
    row.valueBasis === "default" ? defaultFields() : actualFields(row);
  return list
    .filter((f) => !owner || f.owner === owner)
    .map((field) => ({ field, answered: isAnswered(row, field, attached) }));
}

export type BasisCompleteness = {
  /** required fields answered / required fields asked, per side */
  exporter: { answered: number; total: number };
  precursor: { answered: number; total: number };
  /** the labels still outstanding, required only */
  outstanding: { field: PrecursorField; owner: FieldOwner }[];
  /** every required answer is in */
  complete: boolean;
};

export function basisCompleteness(
  row: PrecursorSupplier,
  attached: Partial<Record<NonNullable<PrecursorField["slot"]>, boolean>> = {},
): BasisCompleteness {
  const statuses = fieldStatuses(row, attached);
  const side = (owner: FieldOwner) => {
    const req = statuses.filter(
      (s) => s.field.owner === owner && s.field.need === "required",
    );
    return {
      answered: req.filter((s) => s.answered).length,
      total: req.length,
    };
  };
  const outstanding = statuses
    .filter((s) => s.field.need === "required" && !s.answered)
    .map((s) => ({ field: s.field, owner: s.field.owner }));
  return {
    exporter: side("exporter"),
    precursor: side("precursor"),
    outstanding,
    complete: outstanding.length === 0,
  };
}

/** The period and the verifier checks that decide whether the figure may be
    used at all — Annex II A.1(4). Plain sentences, for the status line. */
export function admissibilityGaps(row: PrecursorSupplier): string[] {
  const gaps: string[] = [];
  if (row.verifierReasonableAssurance === false)
    gaps.push(
      "The verification statement does not conclude with reasonable assurance, so the figure cannot be used.",
    );
  return gaps;
}

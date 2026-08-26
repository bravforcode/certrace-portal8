/* ════════════════════════════════════════════════════════════
   MONTHLY EVIDENCE PACKS, WITH AI EXTRACTION THAT ONLY EVER PROPOSES

   Part 1 bound evidence to a data point (lib/cbam/evidence.ts) at declaration
   scope. This binds it to a data point IN A MONTH, because that is the unit a
   verifier samples: "show me March" has to produce March's utility bill,
   March's meter log and March's production record, and show that the numbers
   in the workspace came from exactly those documents.

   ── THE ONE RULE THAT MATTERS ──────────────────────────────────
   EXTRACTION NEVER WRITES A VALUE INTO THE RECORD. It proposes.

   The exporter sees each extracted field with its confidence and an
   Accept / Edit / Reject control, and only accepting writes it into the
   MonthlyEntry. Anything below 0.8 renders as needs_review with a visible
   warning. An unreviewed extraction does not count toward evidence coverage.

   This is not caution for its own sake. The entire point of evidence is that
   a HUMAN tied a number to a document. An AI silently filling the field
   destroys exactly the traceability a verifier is testing — the exporter
   could no longer answer "who checked this?", which is the first question
   asked about any figure that came out of a PDF.

   ── THE PRIVACY DECISION, STATED OUT LOUD ──────────────────────
   Extraction runs CLIENT-SIDE against the Anthropic API with the file as
   base64. Real utility bills carry customer account numbers, addresses and
   meter identifiers, and the API key lives in the browser. §6 of the build
   spec flags this as a decision to make before enabling it for customers:

     · the key is entered by the exporter and kept in localStorage — it is
       never bundled, never committed, and never sent anywhere but Anthropic
     · extraction is OFF until a key is entered; the whole tab works without it
     · the honest production answer is a backend proxy, and that is what the
       banner in the UI says

   Nothing here is enabled by default. A workspace with no key still uploads,
   stores and indexes evidence — it just asks a human to type the numbers.
   ════════════════════════════════════════════════════════════ */

import Anthropic from "@anthropic-ai/sdk";
import { applyEuStandard, fuelEvidenceKey, fuelTypeDef, fuelTypeLabel, isTypeIStandard, listMonths, type MonthlyEntry } from "./monthly-data";
import { listSuppliers } from "./precursor-suppliers";
import { loadDraft, listVersions } from "./workspace-mmd";
import { getWorkspace } from "./workspace";
import { workspaceRequiresIndirectEmissions } from "./cbam/product-category-rules";
import { planAllows } from "./plan";

/* ── Source types ───────────────────────────────────────────────
   The document kinds a CBAM verifier actually asks for, named the way they
   are named in the engagement rather than as "file 1, file 2". */
export type EvidenceSourceType =
  | "utility_invoice"
  | "fuel_invoice"
  | "meter_log"
  | "erp_export"
  | "lab_report"
  | "supplier_cti"
  | "mill_test_certificate"
  | "calibration_record"
  | "carbon_price_receipt"
  | "calculation_sheet"
  | "other";

export const EVIDENCE_SOURCE_TYPES: EvidenceSourceType[] = [
  "utility_invoice",
  "fuel_invoice",
  "meter_log",
  "erp_export",
  "lab_report",
  "supplier_cti",
  "mill_test_certificate",
  "calibration_record",
  "carbon_price_receipt",
  "calculation_sheet",
  "other",
];

export const EVIDENCE_SOURCE_LABEL: Record<EvidenceSourceType, string> = {
  utility_invoice: "Utility invoice",
  fuel_invoice: "Fuel invoice",
  meter_log: "Meter log",
  erp_export: "ERP export",
  lab_report: "Laboratory report",
  supplier_cti: "Supplier CTI / communication",
  mill_test_certificate: "Mill test certificate",
  calibration_record: "Calibration record",
  carbon_price_receipt: "Carbon price receipt",
  calculation_sheet: "Calculation sheet",
  other: "Other",
};

/* ── Extraction ─────────────────────────────────────────────────
   `accepted` starts false on every field and only a human sets it true.
   `status` is needs_review whenever any field lands under the confidence
   floor, so the UI never has to re-derive that judgement. */
export type ExtractionStatus = "pending" | "done" | "failed" | "needs_review";

export type ExtractedField = {
  key: string;
  value: string;
  unit?: string;
  /** 0–1 */
  confidence: number;
  /** only a human sets this true */
  accepted: boolean;
};

export type ExtractionResult = {
  status: ExtractionStatus;
  fields: ExtractedField[];
  rawSummary?: string;
  extractedAt?: string;
  /** why it failed, when it did — shown so the exporter knows to type it in */
  error?: string;
};

/** Below this, a proposed value is `needs_review` and carries a visible
    warning. Chosen high on purpose: a 0.75-confidence meter reading that
    looks right is more dangerous than one that obviously failed. */
export const CONFIDENCE_FLOOR = 0.8;

export const isLowConfidence = (f: ExtractedField): boolean => f.confidence < CONFIDENCE_FLOOR;

export type EvidenceItem = {
  id: string;
  workspaceId: string;
  /** 'YYYY-MM'; omitted for annual-scope evidence */
  month?: string;
  /** which values this substantiates */
  fieldKeys: string[];
  sourceType: EvidenceSourceType;
  fileName: string;
  fileDataUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  extraction?: ExtractionResult;
  capturedAt: string;
  /** who attached the file — defaults to the acting user, matching how the
      rest of the app attributes actions. Shown on the Documents card so a
      reviewer can see who to ask without leaving the screen. */
  uploadedBy?: string;
  /** the specific instance this file substantiates — a month ("2026-03") for
      a recurring monthly document, a shipment/supplier id for a per-shipment
      one. Distinct from `fieldKeys`, which says WHAT the file is; this says
      WHICH occurrence of it. A recurring key with no bind target is real
      evidence sitting unattached to any figure, so it must not count. */
  boundTo?: string;
};

/* ── Store ──────────────────────────────────────────────────────
   Keyed by workspace. Above the inline limit only the metadata is kept — a
   handful of 5 MB scans in localStorage takes the whole store down with it,
   and §6 of the spec names exactly this as the forcing function for a real
   backend. */
const KEY = "certrace:workspace-evidence";

/** Same threshold Part 1 uses in lib/cbam/evidence.ts. */
export const INLINE_BYTES_LIMIT = 1_500_000;

type Store = Record<string, EvidenceItem[]>;

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? `ev-${crypto.randomUUID().slice(0, 10)}` : `ev-${Date.now().toString(36)}`;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
    return true;
  } catch {
    /* Quota. The caller is told, because an evidence file the exporter
       believes is stored but isn't is worse than a visible failure. */
    return false;
  }
}

export const listEvidence = (workspaceId: string): EvidenceItem[] =>
  (read()[workspaceId] ?? []).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

export const getEvidenceItem = (workspaceId: string, id: string): EvidenceItem | null =>
  listEvidence(workspaceId).find((e) => e.id === id) ?? null;

export const evidenceForMonth = (workspaceId: string, month: string): EvidenceItem[] =>
  listEvidence(workspaceId).filter((e) => e.month === month);

export const annualEvidence = (workspaceId: string): EvidenceItem[] => listEvidence(workspaceId).filter((e) => !e.month);

export function saveEvidence(item: EvidenceItem): { item: EvidenceItem; stored: boolean } {
  const store = read();
  const rows = store[item.workspaceId] ?? [];
  const idx = rows.findIndex((r) => r.id === item.id);
  if (idx >= 0) rows[idx] = item;
  else rows.push(item);
  store[item.workspaceId] = rows;
  const stored = write(store);
  if (!stored && item.fileDataUrl) {
    // Retry without the bytes rather than losing the record entirely: the
    // exporter keeps the index entry and the field binding, and the UI tells
    // them the file itself needs re-attaching once a backend exists.
    const lite = { ...item, fileDataUrl: undefined };
    store[item.workspaceId] = rows.map((r) => (r.id === item.id ? lite : r));
    write(store);
    return { item: lite, stored: false };
  }
  return { item, stored };
}

export function removeEvidence(workspaceId: string, id: string): EvidenceItem[] {
  const store = read();
  store[workspaceId] = (store[workspaceId] ?? []).filter((e) => e.id !== id);
  write(store);
  return store[workspaceId];
}

export function removeEvidenceForWorkspace(workspaceId: string): void {
  const store = read();
  delete store[workspaceId];
  write(store);
}

/* ── Required field keys ────────────────────────────────────────
   §A4: per month — production, electricity-consumed, electricity-factor, and
   one per fuel row. Annual scope — carbon-price (when > 0), installation
   identity, calibration records.

   Keys are stable strings, not indexes: a fuel row deleted in June must not
   silently re-point July's evidence at a different fuel.

   ── THE KEY IS THE CONTRACT, THE LABEL IS NOT ──────────────────
   Every uploaded evidence item stores the key it substantiates. A key renamed
   is a key orphaned: the document stays in the store, pointing at a name
   nothing asks for any more, and the checklist reads as though it was never
   attached. So labels and citations below were rewritten freely and NOT ONE
   KEY CHANGED. Anything that ever needs a key renamed needs a migration, the
   way `migrateMmd` migrates old MMD records.

   ── WHY EACH ROW CARRIES A CITATION ────────────────────────────
   "Calibration records" is Certrace's name for a thing the regulation names
   itself, and an exporter arguing with their own finance department about
   whether a document is really required is in a much better position quoting
   the Annex than quoting a portal. Same pattern as the "measurement point"
   note in lib/workspace-mmd.ts.

   THE CITATIONS ARE REAL OR ABSENT. `cite` is optional precisely so that a
   document Certrace asks for on practical grounds, with no Annex behind it,
   says nothing rather than something invented. Every citation below was read
   against the text of the regulation itself, not against a summary — the
   first pass of this file was drafted from a truncated read of Annex II and
   got two of them wrong, which is exactly the failure the rule exists to
   prevent. */

/** Who at the exporter usually holds the document. Matches the department
    grouping on the printed checklist, so a pack can be split and handed out
    rather than chased one item at a time by one person. */
export type EvidenceDepartment = "operations" | "finance" | "suppliers" | "lab" | "organisation";

/* Formal, professional labels — the names a verifier or a buyer's declarant
   sees on the checklist, in the exported reports and on every filter chip.
   The enum KEYS below (operations/finance/suppliers/lab/organisation) are
   unchanged — this is a display-string rename only, so no stored evidence
   key, RequiredKey.department value or filter logic needs to move. */
export const EVIDENCE_DEPARTMENT_LABEL: Record<EvidenceDepartment, string> = {
  operations: "Production & Process Records",
  finance: "Financial & Procurement Records",
  suppliers: "Supplier-Submitted Documentation",
  lab: "Laboratory Analysis & Third-Party Verification",
  organisation: "Organisational & Compliance Documentation",
};

/** The five categories, in the order the Documents screen presents them —
    A (Operations) through E (Organisation), the same lettering the spec and
    the onboarding banner both use. This is NOT the order the banner
    recommends working them in — that is B → A → C (Finance first, since it
    is usually already on file; Operations second; Suppliers last, since it
    depends on someone else responding) — see `acknowledgeEvidenceOnboarding`. */
export const EVIDENCE_CATEGORY_ORDER: EvidenceDepartment[] = ["operations", "finance", "suppliers", "lab", "organisation"];

/** The B → A → C completion order the onboarding banner recommends, as
    department keys — distinct from `EVIDENCE_CATEGORY_ORDER`, which is the
    A-through-E order the cards are always laid out in on the page. */
export const EVIDENCE_RECOMMENDED_ORDER: EvidenceDepartment[] = ["finance", "operations", "suppliers"];

/** Who to ask for a document in this department, and why that department is
    or isn't the easy starting point — shown once per category header, not
    repeated on every card. */
export const EVIDENCE_DEPARTMENT_WHO_TO_ASK: Record<EvidenceDepartment, string> = {
  operations: "Engineering / technical staff, the ERP administrator",
  finance: "Finance department — these are usually already on file for bill payment",
  suppliers: "Nobody internal — these arrive from external suppliers through their Smart Link",
  lab: "An external fuel-testing company",
  organisation: "HR or management, once per company — not once per month",
};

export type EvidenceFrequency = "monthly" | "per_shipment" | "one_time" | "as_needed";

export const EVIDENCE_FREQUENCY_LABEL: Record<EvidenceFrequency, string> = {
  monthly: "Monthly",
  per_shipment: "Per shipment / per purchase",
  one_time: "One-time — reviewed annually, not re-asked",
  as_needed: "As needed",
};

export type RequiredKey = {
  /** STABLE. Saved evidence points at this — see the header. */
  key: string;
  /** the name the regulation or the EU communication template uses */
  label: string;
  /** Annex/Article + regulation. Omitted where no such provision exists. */
  cite?: string;
  department?: EvidenceDepartment;
  /** how often this document is asked for — defaults to the department's
      usual cadence when omitted, but several documents genuinely differ
      from their category's norm (an installation diagram grouped under
      Operations is one-time, not monthly) so it is set per key, not
      inferred from department alone. */
  frequency?: EvidenceFrequency;
  /** overrides EVIDENCE_DEPARTMENT_WHO_TO_ASK when a specific document has
      a narrower answer than its department's general one (a calibration
      certificate comes from the instrument's manufacturer, not from
      "engineering staff" generally). */
  whoToAsk?: string;
};

/* ── Electricity documents — conditional on the category actually counting
   indirect emissions ──────────────────────────────────────────────
   SEE = (Direct EE + Indirect EE [if applicable]) / Production. The indirect
   term — electricity consumed × the electricity emission factor — is
   dropped entirely from the calculation for every aggregated goods category
   this platform serves except Sintered Ore (see
   lib/cbam/product-category-rules.ts). A meter log, an emission factor and a
   utility bill exist only to support that term, so none of the three is a
   real requirement where the term itself does not apply — the same reason
   CONTRACT_OR_PPA_KEY below is already conditional on electricity actually
   being sourced from a PPA. Exported as named constants, not inline
   literals, so evidence-cards.tsx can render them as "Not required"
   placeholders the same way it already does for ALL_CONDITIONAL_ANNUAL_KEYS
   when this workspace's category does not trigger them. */
export const ELECTRICITY_CONSUMED_KEY: RequiredKey = {
  key: "electricity-consumed",
  // The METER READING — operations' job, not finance's. The BILL that
  // states the same number is UTILITY_INVOICE_KEY, below — a separate
  // document under Finance (Category B), for the same month: reading a
  // meter and receiving an invoice are different people's jobs even when
  // they describe the same MWh.
  label: "Electricity meter log — consumption readings",
  cite: "Annex II D · A.2(4), IR (EU) 2025/2547",
  department: "operations",
  frequency: "monthly",
  whoToAsk: "Engineering/technical staff who read the meter",
};

export const ELECTRICITY_FACTOR_KEY: RequiredKey = {
  key: "electricity-factor",
  label: "Emission factor for electricity consumed",
  cite: "Annex II D, IR (EU) 2025/2547",
  department: "finance",
  frequency: "monthly",
};

export const UTILITY_INVOICE_KEY: RequiredKey = {
  key: "utility-invoice",
  // THE BILL for THIS month, not a sample bill standing in for the whole
  // year — moved here from the fixed annual list, where it read as
  // satisfied everywhere the instant one file landed on it anywhere, which
  // is what "the electricity bill for the reporting month" promised and did
  // not deliver.
  label: "Utility invoice — the electricity bill for the reporting month",
  cite: "Annex II D · A.2(4), IR (EU) 2025/2547",
  department: "finance",
  frequency: "monthly",
  whoToAsk: "Finance department — the electricity authority's bill (MEA/PEA) for the reporting month",
};

/** Every electricity-only document, whether or not THIS workspace's category
    triggers it — evidence-cards.tsx uses this to render the "Not required"
    placeholder cards, the same way ALL_CONDITIONAL_ANNUAL_KEYS already does
    for the PPA/precursor/lab-analysis cards. */
export const ALL_ELECTRICITY_KEYS: RequiredKey[] = [ELECTRICITY_CONSUMED_KEY, ELECTRICITY_FACTOR_KEY, UTILITY_INVOICE_KEY];

export function requiredKeysForMonth(entry: MonthlyEntry, requiresIndirect: boolean): RequiredKey[] {
  const keys: RequiredKey[] = [
    {
      key: "production",
      // Covers both the meter/scale log AND the ERP export, deliberately
      // one line rather than two — a plant that already logs to its ERP
      // has one document, not two, and a checklist that demanded both
      // would read as broken to the one exporter who does this correctly.
      label: "ERP production export / meter log — monthly production volume for the reporting period",
      cite: "Annex II A.2(4), IR (EU) 2025/2547",
      department: "operations",
      frequency: "monthly",
      whoToAsk: "Engineering/technical staff, or the ERP administrator (SAP, Odoo, etc.)",
    },
  ];
  if (requiresIndirect) keys.push(ELECTRICITY_CONSUMED_KEY, ELECTRICITY_FACTOR_KEY, UTILITY_INVOICE_KEY);
  /* THE LABEL COMES FROM THE ROW, not from a guess.

     This used to call `fuelTypeLabel(f.fuelType)` with no second argument, so
     every "Other fuel" row rendered as the literal string "Other fuel" and a
     row whose type had not been picked yet fell through to `?? id` and
     rendered as the empty string. Three rows on the Documents checklist came
     out reading the same thing, and an exporter looking at three identical
     lines cannot tell which invoice goes against which — so they attach one
     and the other two stay uncovered.

     `fuelTypeOther` is what distinguishes one unlisted fuel from another, and
     an unpicked row is numbered rather than left blank: "Fuel 2" is at least
     an instruction to go and name it. */
  entry.fuels.forEach((f, i) => {
    const named = fuelTypeLabel(f.fuelType, f.fuelTypeOther);
    const label = f.fuelType ? named : `Fuel ${i + 1} — not named yet`;
    keys.push({
      key: `fuel:${f.id}`,
      // "Source stream" is the regulation's unit for this, and it is the unit
      // the methods are chosen per — see Annex II B.2 and the monitoring
      // method on each instrument row in lib/workspace-mmd.ts.
      label: `${label} — consumption records and calculation factors for the source stream`,
      cite: "Annex II A.2(4) · A.3, IR (EU) 2025/2547",
      department: "operations",
      frequency: "monthly",
      whoToAsk: "Engineering/technical staff who read the meter or log the delivery",
    });
    // A separate line from the row above on purpose: the meter reading and
    // the vendor's invoice are two different documents held by two
    // different people, even when they describe the same delivery.
    keys.push({
      key: `fuel-invoice:${f.id}`,
      label: `${label} — fuel invoice / delivery note`,
      cite: "Annex II A.2(4), IR (EU) 2025/2547",
      department: "finance",
      frequency: "monthly",
      whoToAsk: "Finance department — the vendor's receipt (e.g. PTT, oil companies)",
    });
    // A biomass row can only be reported at less than the full fossil-
    // equivalent factor once the sustainability criteria behind that are
    // evidenced (Annex II Point B.3.3). The row asks for this document
    // whether or not a fraction has been claimed yet, mirroring the Type II
    // factor lock above — so the checklist line exists before the claim, not
    // in response to it.
    if (fuelTypeDef(f.fuelType)?.family === "Biomass") {
      keys.push({
        key: `biomass:${f.id}`,
        label: `${label} — sustainability documentation supporting a biomass zero-rating claim`,
        cite: "Annex II Point B.3.3, IR (EU) 2025/2547 · Directive (EU) 2018/2001 Art. 29(2)–(7), (10)",
        department: "operations",
        frequency: "monthly",
        whoToAsk: "Whoever holds the supplier's sustainability certification or self-declaration for this biomass",
      });
    }
  });
  return keys;
}

/* ── Annual scope ───────────────────────────────────────────────
   Three of these are always required and the rest are conditional, because a
   requirement that does not apply must not read as a gap. A workspace with no
   purchased precursors permanently one document short would teach its reader
   that the checklist is wrong, and the next item they scroll past is the real
   one. Same rule the Precursors tab already applies to a simple good. */
export type AnnualScope = {
  /** a carbon price above zero is claimed for this workspace */
  carbonPricePaid: boolean;
  /** the precursor chain contains at least one PURCHASED precursor */
  hasPurchasedPrecursors?: boolean;
  /** a calculation factor anywhere rests on the operator's own laboratory analysis */
  usesLabAnalysis?: boolean;
  /** a figure anywhere rests on a default value rather than actual data */
  usesDefaultValues?: boolean;
  /** the electricity section declares a PPA or direct technical link row */
  hasPpaOrDirectLink?: boolean;
  /** does this workspace's own aggregated goods category count indirect
      (electricity) emissions toward SEE at all — see
      lib/cbam/product-category-rules.ts. false for every category this
      platform serves except Sintered Ore. Gates the three electricity-only
      evidence keys the same way hasPpaOrDirectLink already gates the PPA
      card: none of them is a real requirement where the indirect term
      itself does not apply. */
  requiresIndirectEmissions?: boolean;
  /** at least one prior reporting period has a FINAL, frozen figure — the
      workspace has been through verification before */
};

/** Always required, whatever the workspace looks like. */
export const ANNUAL_REQUIRED_KEYS: RequiredKey[] = [
  {
    key: "installation-identity",
    // The template's own heading for these facts, so the exporter recognises
    // the document by the name their buyer's workbook uses.
    label: "Installation identity — name, address and operator",
    cite: "Annex II A.5(2), IR (EU) 2025/2547 · A_InstData §2 of the CBAM communication template",
    department: "organisation",
    frequency: "one_time",
  },
  {
    key: "calibration-records",
    /* Not "calibration records": A.3(1)(b) asks for calibrations AND
       validations — a QAL2 certificate for a CEMS is a validation record —
       and A.5(22)(a) is the stronger anchor, requiring that all relevant
       measuring equipment is "calibrated, adjusted, and checked at regular
       intervals including prior to use, and checked against measurement
       standards traceable to international measurement standards". */
    label: "Calibration certificate for measuring instruments",
    cite: "Annex II A.5(22)(a) · A.3(1)(b)–(c), IR (EU) 2025/2547",
    department: "operations",
    frequency: "monthly",
    whoToAsk: "The meter manufacturer, or a contracted calibration company — must show the most recent calibration date",
  },
  {
    key: "installation-diagram",
    label: "Installation diagram — process flow with measurement points marked",
    cite: "Annex II A.5(13), IR (EU) 2025/2547",
    department: "operations",
    frequency: "one_time",
    whoToAsk: "The engineering/plant design team",
  },
  {
    key: "internal-qa-record",
    label: "Internal QA record — the review log before data is submitted",
    department: "organisation",
    frequency: "one_time",
  },
];

/* ── Conditional annual keys ────────────────────────────────────
   Each is added only when the thing it evidences is actually in play. */

/** Purchased precursors reported on ACTUAL data need the precursor producer's
    verification report — a supplier's own number without one is not actual
    data under the Annex, it is a default with extra steps. */
export const PRECURSOR_VERIFICATION_KEY: RequiredKey = {
  key: "precursor-verification-report",
  label: "Verification report for purchased precursor emissions data",
  /* A.1(4) is unusually specific and worth quoting to a supplier who pushes
     back: actual data from an outside precursor producer "shall be used only
     if" it is taken from a verification report issued by an accredited
     verifier AND that report covers the reporting period the precursor was
     produced in. Miss either and A.1(5) forces the default value instead. */
  cite: "Annex II A.1(4), IR (EU) 2025/2547",
  department: "suppliers",
  frequency: "monthly",
};

/** Normally already attached with the shipment, so this is often a matter of
    retrieving an existing file rather than requesting a new one. */
export const MILL_TEST_CERTIFICATE_KEY: RequiredKey = {
  key: "mill-test-certificate",
  label: "Mill test certificate",
  department: "suppliers",
  frequency: "per_shipment",
};

/** Only where a special electricity purchase agreement exists. */
export const CONTRACT_OR_PPA_KEY: RequiredKey = {
  key: "contract-or-ppa",
  label: "Contract or PPA — the electricity purchase agreement",
  department: "organisation",
  frequency: "one_time",
  whoToAsk: "Procurement",
};

/** Where a calculation factor came from the operator's own sampling rather
    than a published value, the Annex wants the analysis behind it and the
    standard it was performed to. */
export const LAB_ANALYSIS_KEY: RequiredKey = {
  key: "lab-analysis",
  label: "Laboratory analysis reports for calculation factors",
  // A.3(1)(d) sends laboratory analyses, sample treatment, calibrations and
  // method validations to the requirements in B.5.4.3, which is where the
  // accreditation and competence questions a verifier asks actually live.
  cite: "Annex II A.3(1)(d) · B.5.4.3, IR (EU) 2025/2547",
  department: "lab",
  frequency: "as_needed",
};

/** A default value is allowed where actual data is unavailable — and the
    unavailability is the thing a verifier tests, so it has to be written
    down rather than assumed. */
export const DEFAULT_VALUE_JUSTIFICATION_KEY: RequiredKey = {
  key: "default-value-justification",
  label: "Justification for using default values",
  /* NOT Article 11 — that governs the DECLARANT determining embedded
     emissions from published defaults. The operator's obligation is in the
     Annex: A.3(1)(a) allows a default where a method is technically not
     feasible or costs are unreasonable, and A.3(7) and A.3(8) each require
     the justification for that claim to be "laid down in the monitoring
     plan". A.1(5) is the precursor case. */
  cite: "Annex II A.3(1)(a) · A.3(7)–(8) · A.1(5), IR (EU) 2025/2547",
  department: "organisation",
  frequency: "one_time",
};

/* The legal basis is the PARENT regulation, not one of the implementing acts:
   IR (EU) 2025/2548 turned out to cover only how the CBAM certificate price
   is calculated and published. Recital 26 of IR (EU) 2025/2547 names the real
   home — "the reporting period applicable to the determination of the carbon
   price paid in accordance with Article 9 of Regulation (EU) 2023/956". */
export const CARBON_PRICE_KEY: RequiredKey = {
  key: "carbon-price",
  label: "Evidence of the carbon price due or paid in the country of origin",
  cite: "Article 9, Regulation (EU) 2023/956",
  department: "finance",
  frequency: "per_shipment",
};

/* ── Which department a piece of evidence belongs to ────────────
   The final report (lib/cbam/final-report.ts) appends evidence in the five
   formal-category order above, but an `EvidenceItem` itself carries only
   `fieldKeys` — the department lives on the `RequiredKey` it substantiates,
   and required keys are built per month/per workspace rather than kept in
   one static list. This is the static half: every literal key above,
   mirroring the `department` already declared on its own RequiredKey
   constant, plus the two dynamic per-fuel prefixes from
   `requiredKeysForMonth` and the precursor chain's own `precursor:<id>` key
   (defined in the Supplier and Precursor Tree page, not here — it has no
   RequiredKey of its own, so it is mapped to "suppliers" here, the same
   department PRECURSOR_VERIFICATION_KEY already uses for the same evidence). */
const STATIC_KEY_DEPARTMENT: Record<string, EvidenceDepartment> = {
  production: "operations",
  "electricity-consumed": "operations",
  "electricity-factor": "finance",
  "installation-identity": "organisation",
  "calibration-records": "operations",
  "installation-diagram": "operations",
  "utility-invoice": "finance",
  "internal-qa-record": "organisation",
  "precursor-verification-report": "suppliers",
  // Retired as a RequiredKey — it duplicated what the Supply Chain — Precursor
  // Tree's own per-node Documents section now tracks precisely. Kept as a
  // literal here only so a file uploaded under this key before the retirement
  // still classifies correctly if it is ever displayed, rather than falling
  // through to "organisation".
  "supplier-communication-template": "suppliers",
  "mill-test-certificate": "suppliers",
  "contract-or-ppa": "organisation",
  "lab-analysis": "lab",
  "default-value-justification": "organisation",
  "carbon-price": "finance",
};

export function departmentForFieldKey(key: string): EvidenceDepartment {
  if (key.startsWith("fuel-invoice:")) return "finance";
  if (key.startsWith("fuel:")) return "operations";
  if (key.startsWith("precursor:")) return "suppliers";
  return STATIC_KEY_DEPARTMENT[key] ?? "organisation";
}

/** An item can in principle carry more than one field key; the first is
    always the one it was uploaded against, so that is what decides its
    category. */
export const departmentForEvidenceItem = (item: Pick<EvidenceItem, "fieldKeys">): EvidenceDepartment =>
  departmentForFieldKey(item.fieldKeys[0] ?? "");

/** What is actually in play for one workspace, read from what it already
    records — the precursor chain's data origins and the methodology's factor
    sources. Derived rather than asked, because a checkbox saying "we use
    default values" is a second copy of an answer the workspace already has,
    and the two would drift. */
export function annualScopeFor(workspaceId: string, periodStart: string, periodEnd: string, carbonPricePaid: boolean): AnnualScope {
  const suppliers = listSuppliers(workspaceId);
  const mmd = loadDraft(workspaceId, periodStart, periodEnd);
  const instruments = [...mmd.fuelInstruments, ...mmd.electricityInstruments];
  // Read off the workspace's own product, not asked — same reasoning as the
  // rest of this function: a checkbox duplicating a fact the workspace
  // already has is a second answer free to drift from the first.
  const ws = getWorkspace(workspaceId);
  return {
    carbonPricePaid,
    requiresIndirectEmissions: ws ? workspaceRequiresIndirectEmissions(ws.productId) : false,
    // Scrap carries no embedded emissions, so it is not a precursor whose
    // producer has anything to verify — same short-circuit the SEE walk makes.
    hasPurchasedPrecursors: suppliers.some((s) => !s.isScrap && s.dataOrigin !== "default_value"),
    usesLabAnalysis: instruments.some((m) => m.factorSource === "lab_analysis"),
    usesDefaultValues: suppliers.some((s) => s.dataOrigin === "default_value"),
    // A PPA or a direct technical link is the only case where the electricity
    // factor comes from a signed agreement rather than a published default —
    // read off whatever a month actually recorded, source list or (on an
    // older entry that never adopted it) the legacy scalar field.
    hasPpaOrDirectLink: listMonths(workspaceId).some((m) => {
      const isPpaOrLink = (t: string) => t === "ppa" || t === "direct_technical_link";
      if (m.electricitySources && m.electricitySources.length > 0) return m.electricitySources.some((s) => isPpaOrLink(s.sourceType));
      return isPpaOrLink(m.electricityFactorSource);
    }),
    // A finalised version covering a period that ends before this one starts
    // is the only honest signal of "not the first verification year" — a
    // stored flag would drift the moment a workspace's first period changed.
  };
}

/** The annual checklist for one workspace. One function, so the readiness
    score, the Documents card and the printed pack cannot disagree about what
    is being asked for. */
export function annualRequiredKeys(scope: AnnualScope): RequiredKey[] {
  const keys = [...ANNUAL_REQUIRED_KEYS];
  if (scope.hasPurchasedPrecursors) {
    keys.push(PRECURSOR_VERIFICATION_KEY, MILL_TEST_CERTIFICATE_KEY);
  }
  if (scope.usesLabAnalysis) keys.push(LAB_ANALYSIS_KEY);
  if (scope.usesDefaultValues) keys.push(DEFAULT_VALUE_JUSTIFICATION_KEY);
  if (scope.carbonPricePaid) keys.push(CARBON_PRICE_KEY);
  if (scope.hasPpaOrDirectLink) keys.push(CONTRACT_OR_PPA_KEY);
  return keys;
}

/** Every conditional annual key that COULD apply, whether or not it applies
    to the workspace being looked at right now — the Documents card uses this
    to render the ones a scope did not trigger as "Not required" placeholders
    rather than leaving them off the page, so a card that vanished cannot be
    mistaken for one that was never asked about. */
export const ALL_CONDITIONAL_ANNUAL_KEYS: RequiredKey[] = [
  PRECURSOR_VERIFICATION_KEY,
  MILL_TEST_CERTIFICATE_KEY,
  LAB_ANALYSIS_KEY,
  DEFAULT_VALUE_JUSTIFICATION_KEY,
  CARBON_PRICE_KEY,
  CONTRACT_OR_PPA_KEY,
];

/* ── Onboarding banner (§1.5) ───────────────────────────────────
   Same one-time-acknowledgement mechanism as lib/cbam/electricity-migration.ts
   — a fresh key, because this notice is about the Documents screen's B → A → C
   suggested order, not the electricity unit migration. Per workspace, not
   global: a exporter running several installations sees it once for each. */
const ONBOARDING_ACK_KEY = "certrace:evidence-onboarding-ack";

export function evidenceOnboardingAcknowledged(workspaceId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_ACK_KEY);
    return raw ? (JSON.parse(raw) as string[]).includes(workspaceId) : false;
  } catch {
    return false;
  }
}

export function acknowledgeEvidenceOnboarding(workspaceId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_ACK_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(workspaceId)) window.localStorage.setItem(ONBOARDING_ACK_KEY, JSON.stringify([...list, workspaceId]));
  } catch {
    /* ignore */
  }
}

/* ── Coverage ───────────────────────────────────────────────────
   A key is COVERED when at least one evidence item lists it AND that item is
   not sitting on an unreviewed extraction. The second half is the rule that
   makes the coverage figure mean something: a bill uploaded and never looked
   at proves nothing, and counting it green would put a number in front of a
   verifier that nobody has tied to a document. */
export function isReviewed(item: EvidenceItem): boolean {
  const x = item.extraction;
  // No extraction at all = a human attached it deliberately. That counts.
  if (!x) return true;
  if (x.status === "failed") return true; // degraded to manual entry
  if (x.status === "pending") return false;
  // done / needs_review: every proposed field must have been acted on. A
  // rejected field is removed from the list, so anything still here and
  // unaccepted is unreviewed.
  return x.fields.every((f) => f.accepted);
}

/** A recurring document (monthly or per-shipment) has more than one possible
    instance, so a file attached to the key alone is ambiguous about WHICH
    month or shipment it covers until someone says. A one-time or as-needed
    key has exactly one instance ever, so there is nothing left to bind. */
function needsExplicitBinding(rk: RequiredKey): boolean {
  return rk.frequency === "monthly" || rk.frequency === "per_shipment";
}

/** Bound if the item already carries a bind target — its own month (the
    normal case for anything attached through the per-month evidence flow) or
    an explicit `boundTo` — or if the key it substantiates has only one
    possible instance to begin with. */
export function isBound(item: EvidenceItem, rk: RequiredKey): boolean {
  if (item.month != null || item.boundTo != null) return true;
  return !needsExplicitBinding(rk);
}

export type CoverageRow = {
  key: string;
  label: string;
  /** carried through so the checklist can print the Annex beside the row */
  cite?: string;
  department?: EvidenceDepartment;
  frequency?: EvidenceFrequency;
  whoToAsk?: string;
  covered: boolean;
  /** items that list this key but are not yet reviewed */
  awaitingReview: number;
  /** items that are reviewed but still need a month/shipment picked before
      they can count — the "Uploaded — needs binding" chip state */
  awaitingBinding: number;
  items: EvidenceItem[];
};

/** One place that turns a required key plus the items attached to it into a
    coverage row, so no caller can drift on what "covered" means or on which of
    a key's fields survive into the row.

    Exported because `SectionEvidence` builds its rows from a `keys` prop
    rather than from a coverage function — and building them by hand is how
    the citation stopped reaching the screen the first time. */
export function coverageRowFor(rk: RequiredKey, items: EvidenceItem[]): CoverageRow {
  const matching = items.filter((i) => i.fieldKeys.includes(rk.key));
  const reviewed = matching.filter(isReviewed);
  const bound = reviewed.filter((i) => isBound(i, rk));
  return {
    key: rk.key,
    label: rk.label,
    cite: rk.cite,
    department: rk.department,
    frequency: rk.frequency,
    whoToAsk: rk.whoToAsk,
    covered: bound.length > 0,
    awaitingReview: matching.length - reviewed.length,
    awaitingBinding: reviewed.length - bound.length,
    items: matching,
  };
}

export type MonthCoverage = {
  month: string;
  rows: CoverageRow[];
  covered: number;
  total: number;
  /** 0–1 */
  ratio: number;
  complete: boolean;
};

export function coverageForMonth(workspaceId: string, entry: MonthlyEntry, requiresIndirect: boolean): MonthCoverage {
  const items = evidenceForMonth(workspaceId, entry.month);
  const rows = requiredKeysForMonth(entry, requiresIndirect).map((rk) => coverageRowFor(rk, items));
  const covered = rows.filter((r) => r.covered).length;
  return {
    month: entry.month,
    rows,
    covered,
    total: rows.length,
    ratio: rows.length > 0 ? covered / rows.length : 1,
    complete: rows.length > 0 && covered === rows.length,
  };
}

/** Coverage across the WHOLE YEAR — every month's required keys plus the
    annual-scope ones, as one figure. Shown beside the per-month percentages
    because "March is 75% covered" and "the year is 62% covered" answer
    different questions, and only the second one tells an exporter whether
    they are ready to call a verifier. */
export type YearCoverage = { covered: number; total: number; ratio: number; complete: boolean; awaitingReview: number };

export function yearCoverage(workspaceId: string, entries: MonthlyEntry[], scope: AnnualScope): YearCoverage {
  let covered = 0;
  let total = 0;
  let awaitingReview = 0;

  for (const entry of entries) {
    const cov = coverageForMonth(workspaceId, entry, scope.requiresIndirectEmissions ?? false);
    covered += cov.covered;
    total += cov.total;
    awaitingReview += cov.rows.reduce((a, r) => a + r.awaitingReview, 0);
  }
  for (const row of annualCoverage(workspaceId, scope)) {
    total += 1;
    if (row.covered) covered += 1;
    awaitingReview += row.awaitingReview;
  }

  return { covered, total, ratio: total > 0 ? covered / total : 1, complete: total > 0 && covered === total, awaitingReview };
}

export function annualCoverage(workspaceId: string, scope: AnnualScope): CoverageRow[] {
  const items = annualEvidence(workspaceId);
  return annualRequiredKeys(scope).map((rk) => coverageRowFor(rk, items));
}

/* ════════════════════════════════════════════════════════════
   AI EXTRACTION
   ════════════════════════════════════════════════════════════ */

/* The spec fixes the model and the token cap. Both are named constants so
   changing them is one line rather than a grep, and so the verifier pack can
   state which model read which document. */
export const EXTRACTION_MODEL = "claude-sonnet-4-6";
export const EXTRACTION_MAX_TOKENS = 1000;

const API_KEY_STORAGE = "certrace:anthropic-key";

export const getApiKey = (): string => {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(API_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
};

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (key.trim()) window.localStorage.setItem(API_KEY_STORAGE, key.trim());
    else window.localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

/* TWO CONDITIONS, AND BOTH ARE REAL. A key has to be on the device — that is
   the technical one — and the PLAN has to include extraction, which it does
   from Standard up. Reading a document with a model costs money per document,
   which is why it is the one thing in the whole workflow a tier switches off;
   nothing about the CALCULATION is ever gated (see the pricing block in
   lib/config.ts). With it off, every field is still typed in by hand and the
   file is still attached to the month — the tab loses a shortcut, not a
   capability. */
export const extractionAvailable = (): boolean => planAllows("aiExtraction") && getApiKey().length > 0;

/** Why it is unavailable, when it is — so the panel can say which of the two
    it is rather than going quiet. */
export const extractionBlockedByPlan = (): boolean => !planAllows("aiExtraction");

export const EXTRACTION_PRIVACY_NOTE =
  "Extraction sends the uploaded file to the Anthropic API directly from this browser, using a key stored on this device. " +
  "Real utility bills carry account numbers and addresses. For production, route this through your own backend so the key " +
  "never reaches a browser and you control what leaves your network. Everything else on this tab works without it.";

/* The instruction. Deliberately narrow — it asks for the fields a utility or
   fuel invoice actually carries, tells the model to omit what is not there
   rather than guess, and requires a confidence per field so the UI can apply
   the 0.8 floor. "ONLY JSON" is stated twice because a single stray sentence
   of prose breaks the parse. */
const SYSTEM_PROMPT = [
  "You read utility and fuel invoices, meter logs and production records for a CBAM emissions workspace.",
  "Return ONLY a JSON object. No prose, no explanation, no markdown fences.",
  "",
  "Shape:",
  '{"fields":[{"key":string,"value":string,"unit":string|null,"confidence":number}],"summary":string}',
  "",
  "Use these keys where the document contains them, and OMIT any key the document does not contain:",
  '  "billing-period-start"  (YYYY-MM-DD)',
  '  "billing-period-end"    (YYYY-MM-DD)',
  '  "electricity-consumed"  (unit "kWh" or "MWh", exactly as printed)',
  '  "total-amount"          (unit = the currency)',
  '  "meter-number"',
  '  "supplier-name"',
  "",
  "confidence is 0 to 1 and reflects how clearly the value is printed. Use a low value when a figure is",
  "handwritten, partially obscured, ambiguous between several numbers on the page, or inferred rather than read.",
  "Never invent a value to fill a key. Return ONLY the JSON object.",
].join("\n");

/** Strip ``` fences before parsing. Models sometimes wrap JSON despite being
    told not to, and a fence is not a reason to lose a good extraction. */
export function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  return (fenced ? fenced[1] : trimmed).trim();
}

/** Defensive parse. Anything unexpected returns null, and the caller degrades
    to manual entry — never to a half-populated field list. */
export function parseExtraction(text: string): { fields: ExtractedField[]; summary?: string } | null {
  try {
    const parsed = JSON.parse(stripFences(text)) as { fields?: unknown; summary?: unknown };
    if (!parsed || !Array.isArray(parsed.fields)) return null;
    const fields: ExtractedField[] = [];
    for (const raw of parsed.fields as Record<string, unknown>[]) {
      const key = typeof raw?.key === "string" ? raw.key.trim() : "";
      if (!key) continue;
      const value = raw?.value == null ? "" : String(raw.value).trim();
      if (!value) continue;
      const confidence = Number(raw?.confidence);
      fields.push({
        key,
        value,
        unit: typeof raw?.unit === "string" && raw.unit.trim() ? raw.unit.trim() : undefined,
        // An absent or nonsense confidence is treated as LOW, not as high —
        // the failure mode of a missing number must be more review, not less.
        confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
        accepted: false,
      });
    }
    return { fields, summary: typeof parsed.summary === "string" ? parsed.summary : undefined };
  } catch {
    return null;
  }
}

const base64Of = (dataUrl: string): string => dataUrl.slice(dataUrl.indexOf(",") + 1);

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Build the content block for the file. A PDF goes in as a document block, an
    image as an image block; anything else the API cannot read is refused here
    rather than sent and rejected. */
function fileBlock(dataUrl: string, mimeType: string): Anthropic.ContentBlockParam | null {
  const data = base64Of(dataUrl);
  if (!data) return null;
  if (mimeType === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data } };
  }
  if (IMAGE_TYPES.includes(mimeType)) {
    return {
      type: "image",
      source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data },
    };
  }
  return null;
}

/** Run extraction over one uploaded file.

    NEVER THROWS. Every failure path returns a `failed` ExtractionResult with
    a message, because the contract with the caller is that a failed
    extraction degrades to manual entry and the uploaded file survives. */
export async function runExtraction(item: EvidenceItem): Promise<ExtractionResult> {
  const failed = (error: string): ExtractionResult => ({ status: "failed", fields: [], extractedAt: new Date().toISOString(), error });

  const apiKey = getApiKey();
  if (!apiKey) return failed("No Anthropic API key is set on this device. Enter one to enable extraction, or type the values in by hand.");
  if (!item.fileDataUrl) return failed("The file was too large to keep in the browser, so there is nothing to read. Enter the values by hand.");

  const block = fileBlock(item.fileDataUrl, item.mimeType ?? "");
  if (!block) {
    return failed(`${item.mimeType || "This file type"} cannot be read automatically — extraction handles PDFs and images. Enter the values by hand.`);
  }

  try {
    const client = new Anthropic({
      apiKey,
      // The whole feature is a browser call; the flag is the SDK's way of
      // making that an explicit, greppable decision rather than an accident.
      dangerouslyAllowBrowser: true,
    });

    const response = await client.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: EXTRACTION_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            block,
            {
              type: "text",
              text: `Read this ${EVIDENCE_SOURCE_LABEL[item.sourceType].toLowerCase()} and return the JSON object.`,
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const parsed = parseExtraction(text);
    if (!parsed || parsed.fields.length === 0) {
      return failed("Nothing readable came back from the document. Enter the values by hand — the file is still attached.");
    }

    return {
      // needs_review the moment ANY field is under the floor, so the warning
      // is on the panel rather than buried on one row.
      status: parsed.fields.some(isLowConfidence) ? "needs_review" : "done",
      fields: parsed.fields,
      rawSummary: parsed.summary,
      extractedAt: new Date().toISOString(),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return failed(`Extraction failed: ${message}. The file is still attached — enter the values by hand.`);
  }
}

/* ── Accepting a proposal ───────────────────────────────────────
   The only path from an extracted value into a MonthlyEntry, and it runs
   only when a human clicks Accept.

   kWh → MWh is applied here, once. A bill printed in kWh accepted straight
   into `electricityMwh` would overstate indirect emissions by 1000× and look
   entirely plausible on the screen — the field would just read "393,750". */
export type AcceptOutcome = { entry: MonthlyEntry; applied: string | null; note: string };

export function applyAcceptedField(entry: MonthlyEntry, field: ExtractedField): AcceptOutcome {
  const numeric = Number(String(field.value).replace(/[,\s]/g, ""));

  if (field.key === "electricity-consumed") {
    if (!Number.isFinite(numeric)) return { entry, applied: null, note: `"${field.value}" is not a number.` };
    const unit = (field.unit ?? "").toLowerCase();
    const mwh = unit === "kwh" ? numeric / 1000 : numeric;
    return {
      entry: { ...entry, electricityMwh: mwh },
      applied: "electricityMwh",
      note:
        unit === "kwh"
          ? `${numeric.toLocaleString("en-GB")} kWh converted to ${mwh.toLocaleString("en-GB")} MWh.`
          : `${mwh.toLocaleString("en-GB")} MWh written to this month.`,
    };
  }

  /* Every other extracted field is CONTEXT, not an input to the calculation:
     a billing period, a meter number and a supplier name are what let a
     verifier tie the document to the month, but none of them belongs in a
     figure. They are recorded on the evidence item and appended to the
     month's notes, never written over a number. */
  return { entry, applied: null, note: "Recorded against the document. This field is context for the verifier, not a calculation input." };
}

/** Which extracted keys can actually write into a month. Everything else is
    accepted as context — the UI says so rather than implying a silent write. */
export const WRITEABLE_KEYS = new Set(["electricity-consumed"]);

export const extractionSummaryLine = (x: ExtractionResult | undefined): string => {
  if (!x) return "No extraction run";
  if (x.status === "failed") return x.error ?? "Extraction failed — enter values by hand";
  if (x.status === "pending") return "Reading the document…";
  const accepted = x.fields.filter((f) => f.accepted).length;
  return `${accepted} of ${x.fields.length} proposed values accepted`;
};

/* ── A Type II factor is only as good as the document under it ───
   Type I is a published standard value and needs nothing behind it. Type II is
   the installation's OWN measured factor, and what makes it admissible is the
   lab report or invoice attached to it. Remove that document and the figure
   does not become unevidenced — it becomes inadmissible, and leaving it in the
   field is the portal holding a number a verifier will strike out while the
   screen shows it as settled.

   So removing the last document behind a Type II row reverts that row to the
   EU standard value. It fires ONLY on a row that WAS evidenced a moment ago:
   a Type II row still waiting for its first upload is the normal starting
   state, not a reversion, and resetting it would fight the person typing.

   `before` is the caller's snapshot of which fuels were covered — the
   comparison cannot be made from the store alone, because after the removal
   the store says only "not covered", which is also what a fresh row says.

   Shared, because both sides of a month attach documents to it: the exporter's
   month screen and the supplier's Documents step. A rule that fired on one of
   them was a rule an installation could walk around by using the other. */
export function reconcileFuelEvidence(
  workspaceId: string,
  entry: MonthlyEntry,
  before: Record<string, boolean>,
  requiresIndirect: boolean,
): { entry: MonthlyEntry; covered: Record<string, boolean>; reverted: string[] } {
  const cov = coverageForMonth(workspaceId, entry, requiresIndirect);
  const covered: Record<string, boolean> = {};
  const reverted: string[] = [];
  let next = entry;

  for (const f of entry.fuels) {
    const isCovered = cov.rows.find((r) => r.key === fuelEvidenceKey(f.id))?.covered ?? false;
    covered[f.id] = isCovered;
    if (before[f.id] !== true || isCovered || isTypeIStandard(f.factorSource)) continue;

    const locked = applyEuStandard({ ...f, factorSource: "eu_standard" });
    next = {
      ...next,
      fuels: next.fuels.map((x) =>
        x.id === f.id ? { ...x, factorSource: "eu_standard" as const, efTco2PerGj: locked.efTco2PerGj, ncvMjPerUnit: locked.ncvMjPerUnit } : x,
      ),
    };
    reverted.push(fuelTypeLabel(f.fuelType, f.fuelTypeOther));
  }

  return { entry: next, covered, reverted };
}

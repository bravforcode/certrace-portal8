import { accountStorage } from "./account-storage";
/* ════════════════════════════════════════════════════════════
   THE DATA HUB — a supplier's data record, owned by the supplier

   Before this module a supplier's answers belonged to ONE declaration: they
   lived under `certrace:supplier:<token>`, and a token is a (declaration ×
   supplier) pair. Ask the same mill for the same mill's numbers on a second
   declaration and they typed everything again, because nothing survived the
   request it was born in.

   A SupplierRecord inverts that. The record is the durable thing — one per
   producing company, keyed by the company itself, holding:

     • identity + installation      (who they are, where they produce)
     • per-product answers          (SEE, route, method, precursors …), keyed
                                     by CATALOGUE product id so the same good
                                     carries across declarations
     • evidence                     (the documents they've already attached)
     • an access policy             (who may see which part — lib section keys)
     • provenance                   (which declarations this record has fed)

   A declaration then becomes a FILTERED REQUEST against these records:
   `readRequestFromRecord()` returns only the fields THIS request asks for, for
   only the products THIS request covers. The declaration owns the ask, never
   the data.

   Frontend-only MVP: one localStorage key holds every record — the same seam
   lib/supplier-store.ts and lib/declarations-store.ts use, and the same seam a
   real per-supplier API would slot into. The per-token store still exists and
   still owns the live draft; this is what that draft is distilled INTO on
   submit, and seeded FROM on open.
   ════════════════════════════════════════════════════════════ */

import { valueKey, type SectionKey, type SupplierRequest } from "./supplier";
import type {
  DocState,
  SupplierProfile,
  SupplierState,
} from "./supplier-store";

/* ── Identity ──────────────────────────────────────────────────
   A record is keyed by the producing company, not by any id the exporter
   minted — that's what lets the same mill be recognised across declarations,
   across exporters, and (for self-supply) as the exporter's own installation. */
export const recordKey = (company: string) =>
  company
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "unknown";

/* ── Access control (feature 7) ────────────────────────────────
   The supplier answers the exporter who asked — that part isn't in question.
   What IS in question, the moment one record can feed several buyers, is how
   far their data travels. So the policy governs ONWARD sharing:

     buyer     — the EU importer(s)/declarant(s) the exporter forwards to
     verifier  — the accredited verifier reviewing the dataset

   The split follows the regulation, not preference. A DECLARED FIGURE — who
   produced the goods, what they are, what they emit, what carbon price was
   paid, who verified it — is what the declarant's filing is made of, and
   withholding it would only mean the goods can't clear. Those are locked on.

   SUPPORTING DETAIL is a different thing: the certificates and test reports,
   the electricity consumption behind the indirect figure, the precursor rows
   that name the supplier's own upstream. The declarant needs the numbers, not
   the derivation, and that derivation is a supplier's commercial position.
   Those are genuinely theirs to hold back.

   Scope note: this governs the buyer-facing package. A push into the CBAM
   Registry's O3CI module is the legal filing and always carries the full
   required dataset — a supplier cannot restrict their way out of the
   regulation, only out of handing competitors their process. */
export type Audience = "buyer" | "verifier";

export type SectionAccessMeta = {
  key: SectionKey;
  /** false = required in the buyer's CBAM filing, so it always travels */
  restrictable: boolean;
  /** Audiences this section reaches regardless of the supplier's preference.
      The verifier is the case that matters: their job is to re-derive the
      figure, and a derivation they are not allowed to see is not a
      verification. A supplier can withhold their process from a BUYER — a
      commercial competitor — but not from the accredited verifier whose
      opinion is what makes their actual-data claim usable at all. */
  alwaysSharedWith?: Audience[];
  /** why it's locked, or what holding it back actually costs them */
  note: string;
};

export const SECTION_ACCESS: Record<SectionKey, SectionAccessMeta> = {
  installation: {
    key: "installation",
    restrictable: false,
    note: "CBAM identifies the producing installation by name, country, address and coordinates — all four are required in the filing.",
  },
  goods: {
    key: "goods",
    restrictable: false,
    note: "CN code, production route and quantity are the goods being declared. The filing cannot be made without them.",
  },
  emissions: {
    key: "emissions",
    restrictable: false,
    note: "Embedded emissions per tonne are the declaration itself. Required.",
  },
  activity: {
    key: "activity",
    restrictable: true,
    alwaysSharedWith: ["verifier"],
    note: "Fuel, power and materials are your process. A buyer never needs them — the emissions figure is what they file. The verifier always does: re-deriving your figure from these inputs is the whole of their engagement, so this section reaches them whatever you set here.",
  },
  electricity: {
    key: "electricity",
    restrictable: true,
    alwaysSharedWith: ["verifier"],
    note: "Consumption and grid factor are the derivation behind your indirect figure. The figure still travels; hold this back and the buyer sees the number without your energy contract. The verifier sees it either way.",
  },
  precursors: {
    key: "precursors",
    restrictable: true,
    alwaysSharedWith: ["verifier"],
    note: "These rows name your own upstream suppliers and what you pay them in carbon. Their contribution stays inside your reported total either way — only the breakdown is withheld from the buyer. Precursor integrity is one of the seven things a verifier tests, so it always reaches them.",
  },
  carbon: {
    key: "carbon",
    restrictable: false,
    note: "A carbon price you've already paid reduces the buyer's certificate bill. Withholding it would cost them money and you goodwill.",
  },
  verification: {
    key: "verification",
    restrictable: false,
    note: "The verifier's identity and opinion are what make an actual-data claim credible. Required.",
  },
  documents: {
    key: "documents",
    restrictable: true,
    note: "Certificates and test reports. The exporter reviewing you always sees these — whether they travel onward to their buyers is your call.",
  },
};

export type AccessPolicy = {
  /** section key → audience → allowed onward. Missing = allowed. */
  sections: Partial<Record<SectionKey, Partial<Record<Audience, boolean>>>>;
  /** exporter org → may pre-fill new requests from this saved record */
  reuseByOrg: Record<string, boolean>;
};

export const defaultAccessPolicy = (): AccessPolicy => ({
  sections: {},
  reuseByOrg: {},
});

/** Is this section shared onward with this audience? Locked sections always
    are, and so are sections a given audience is never allowed to be cut out
    of — see `alwaysSharedWith`. */
export function isShared(
  policy: AccessPolicy | undefined,
  section: SectionKey,
  audience: Audience,
): boolean {
  const meta = SECTION_ACCESS[section];
  if (!meta?.restrictable) return true;
  if (meta.alwaysSharedWith?.includes(audience)) return true;
  const v = policy?.sections?.[section]?.[audience];
  return v !== false;
}

/** Every restrictable section the supplier has actually held back. */
export function restrictedSections(
  policy: AccessPolicy | undefined,
  audience: Audience,
): SectionKey[] {
  return (Object.keys(SECTION_ACCESS) as SectionKey[]).filter(
    (k) => SECTION_ACCESS[k].restrictable && !isShared(policy, k, audience),
  );
}

/** May this exporter's next request pre-fill from the saved record? */
export const canReuse = (
  record: SupplierRecord | null,
  org: string,
): boolean => (record ? record.access.reuseByOrg[org] !== false : true);

/* ── The record ────────────────────────────────────────────────
   Product answers are keyed by CATALOGUE product id (`hrc`, `rebar`, …), not
   by the namespaced value key, so the same good's numbers are found again from
   any declaration that asks about that good. */
export type ProductRecord = {
  productId: string;
  values: Record<string, string>; // bare field id → value
  /** the reporting period this good's numbers were reported FOR */
  periodLabel: string;
  periodEnd: string; // ISO, "" when the declaration carried no bounds
  updatedAt: number;
};

export type RecordContribution = {
  declId: string;
  declName: string;
  exporterOrg: string;
  periodLabel: string;
  productIds: string[];
  version: number;
  at: number;
};

/* ── Attestation ───────────────────────────────────────────────
   A named person putting their role behind the numbers. This is the line
   between data an exporter collected and data a verifier can rely on: without
   it, a submission is an anonymous spreadsheet, and the first question at
   engagement is "who says so?".

   Deliberately not a signature image or a checkbox on its own — a name, a
   role, a date and an explicit statement, which is the shape the Annex IV
   communication template and every verification body actually ask for. */
export type Attestation = {
  signatoryName: string;
  signatoryRole: string;
  /** ISO date the statement was made */
  signedAt: string;
  /** the statement they agreed to, stored verbatim so it can be reproduced */
  statement: string;
};

export const ATTESTATION_STATEMENT =
  "I confirm that the data submitted is complete and accurate to the best of my knowledge, that it relates to the installation and reporting period stated, and that supporting records are available for verification on request.";

export const attestationComplete = (
  a: Attestation | null | undefined,
): boolean =>
  Boolean(a && a.signatoryName.trim() && a.signatoryRole.trim() && a.signedAt);

export type SupplierRecord = {
  key: string;
  company: string;
  country: string;
  /** true when this record is the exporter's own installation (self-supply) */
  selfSupplied: boolean;
  profile: SupplierProfile | null;
  /** installation-scope answers (inst-*, carbon price, verification) by bare field id */
  installation: Record<string, string>;
  products: Record<string, ProductRecord>;
  docs: Record<string, DocState>;
  access: AccessPolicy;
  /** who stood behind these numbers, and when. Null = not verification-grade. */
  attestation: Attestation | null;
  contributions: RecordContribution[];
  createdAt: number;
  updatedAt: number;
};

/** A record is verification-grade once someone named has attested to it. An
    exporter can still use an unattested record — they just cannot present it
    to a verifier as anything more than an internal figure. */
export const isVerificationGrade = (
  r: SupplierRecord | null | undefined,
): boolean => attestationComplete(r?.attestation);

const KEY = "certrace:supplier-records";

export function emptyRecord(
  company: string,
  country = "—",
  selfSupplied = false,
): SupplierRecord {
  const now = Date.now();
  return {
    key: recordKey(company),
    company,
    country,
    selfSupplied,
    profile: null,
    installation: {},
    products: {},
    docs: {},
    access: defaultAccessPolicy(),
    attestation: null,
    contributions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function loadRecords(): Record<string, SupplierRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = accountStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SupplierRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveRecords(all: Record<string, SupplierRecord>): void {
  if (typeof window === "undefined") return;
  try {
    accountStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota — a lost record must never block a submission */
  }
}

export const listRecords = (): SupplierRecord[] =>
  Object.values(loadRecords()).sort((a, b) => b.updatedAt - a.updatedAt);

export function getRecord(company: string): SupplierRecord | null {
  return loadRecords()[recordKey(company)] ?? null;
}

/** Read-modify-write one record. Creates it when it doesn't exist yet. */
export function mutateRecord(
  company: string,
  fn: (r: SupplierRecord) => SupplierRecord,
  seed?: Partial<SupplierRecord>,
): SupplierRecord {
  const all = loadRecords();
  const k = recordKey(company);
  const base = all[k] ?? { ...emptyRecord(company), ...seed };
  const next = { ...fn(base), key: k, updatedAt: Date.now() };
  all[k] = next;
  saveRecords(all);
  return next;
}

/* ── Write: a submission distils into the record ────────────────
   Called when a supplier submits (and whenever their draft is worth keeping).
   Splits the flat value map back into installation-scope answers and
   per-product answers, so the next declaration can find them by product. */
export function writeSubmissionToRecord(
  req: SupplierRequest,
  state: Pick<
    SupplierState,
    "values" | "docs" | "profile" | "versions" | "attestation"
  >,
  meta: {
    declId: string;
    declName: string;
    periodLabel: string;
    periodEnd?: string;
    selfSupplied?: boolean;
  },
): SupplierRecord {
  const productIds = new Set(req.products.map((p) => p.product.id));
  const installation: Record<string, string> = {};
  const perProduct: Record<string, Record<string, string>> = {};

  for (const [key, value] of Object.entries(state.values)) {
    if (!value || !value.trim()) continue;
    const i = key.indexOf("::");
    if (i < 0) {
      installation[key] = value;
      continue;
    }
    const pid = key.slice(0, i);
    const fieldId = key.slice(i + 2);
    if (!productIds.has(pid)) continue; // never absorb a stray key from another request
    (perProduct[pid] ??= {})[fieldId] = value;
  }

  const now = Date.now();
  const version = state.versions[state.versions.length - 1]?.n ?? 0;

  return mutateRecord(
    req.supplierName,
    (r) => {
      const products = { ...r.products };
      for (const [pid, values] of Object.entries(perProduct)) {
        products[pid] = {
          productId: pid,
          values: { ...(products[pid]?.values ?? {}), ...values },
          periodLabel: meta.periodLabel,
          periodEnd: meta.periodEnd ?? "",
          updatedAt: now,
        };
      }
      const contributions = [
        ...r.contributions.filter((c) => c.declId !== meta.declId),
        {
          declId: meta.declId,
          declName: meta.declName,
          exporterOrg: req.exporterName,
          periodLabel: meta.periodLabel,
          productIds: [...productIds],
          version,
          at: now,
        },
      ].sort((a, b) => b.at - a.at);

      return {
        ...r,
        company: req.supplierName,
        country: req.supplierCountry || r.country,
        selfSupplied: meta.selfSupplied ?? r.selfSupplied,
        profile: state.profile ?? r.profile,
        attestation: state.attestation ?? r.attestation,
        installation: { ...r.installation, ...installation },
        products,
        docs: { ...r.docs, ...state.docs },
        contributions,
      };
    },
    {
      company: req.supplierName,
      country: req.supplierCountry,
      selfSupplied: meta.selfSupplied ?? false,
    },
  );
}

/* ── Read: the declaration as a filtered request ────────────────
   Returns ONLY what this request asks for: installation-scope answers for the
   fields it includes, product answers for the products it covers. Nothing from
   a good this exporter never asked about leaks into their view. */
export type RecordRead = {
  values: Record<string, string>;
  docs: Record<string, DocState>;
  /** value keys that came from the saved record rather than this request */
  carriedKeys: string[];
  /** oldest source timestamp behind the carried data */
  sourceAt: number | null;
  /** periods the carried product data was originally reported for */
  sourcePeriods: string[];
};

export function readRequestFromRecord(
  req: SupplierRequest,
  record?: SupplierRecord | null,
): RecordRead {
  const r = record ?? getRecord(req.supplierName);
  const empty: RecordRead = {
    values: {},
    docs: {},
    carriedKeys: [],
    sourceAt: null,
    sourcePeriods: [],
  };
  if (!r) return empty;

  const values: Record<string, string> = {};
  const carriedKeys: string[] = [];
  const stamps: number[] = [];
  const periods = new Set<string>();

  const askedOnce = new Set(req.fields.map((f) => f.id));
  for (const [fieldId, value] of Object.entries(r.installation)) {
    if (!askedOnce.has(fieldId)) continue;
    values[fieldId] = value;
    carriedKeys.push(fieldId);
  }
  if (Object.keys(r.installation).length > 0) stamps.push(r.updatedAt);

  for (const rp of req.products) {
    const pr = r.products[rp.product.id];
    if (!pr) continue;
    for (const [fieldId, value] of Object.entries(pr.values)) {
      if (!askedOnce.has(fieldId)) continue;
      const k = valueKey(fieldId, rp.product.id);
      values[k] = value;
      carriedKeys.push(k);
    }
    stamps.push(pr.updatedAt);
    if (pr.periodLabel) periods.add(pr.periodLabel);
  }

  // Evidence carries too, but only the slots this request actually asks for.
  const docs: Record<string, DocState> = {};
  for (const d of req.documents) {
    const existing = r.docs[d.id];
    if (existing?.status === "uploaded") docs[d.id] = existing;
  }

  return {
    values,
    docs,
    carriedKeys,
    sourceAt: stamps.length ? Math.min(...stamps) : null,
    sourcePeriods: [...periods],
  };
}

/* ── Freshness (feature 8) ──────────────────────────────────────
   Two independent signals, because they fail differently:

     age    — how long since the supplier last touched these numbers. A mill's
              emission factor drifts with fuel mix, scrap ratio and grid; a
              figure past a year has to be re-confirmed, not re-used.
     period — the data was reported FOR a period. Carrying a 2025 figure into
              a 2026 declaration is stale on day one, however recently it was
              typed.

   Anything the supplier confirms in a new submission resets both. */
export type Freshness = "fresh" | "aging" | "stale" | "unknown";

export const FRESH_DAYS = 90;
export const AGING_DAYS = 365;

export const FRESHNESS_META: Record<
  Freshness,
  { label: string; tone: "ok" | "warn" | "err" | "muted" }
> = {
  fresh: { label: "current", tone: "ok" },
  aging: { label: "ageing", tone: "warn" },
  stale: { label: "stale", tone: "err" },
  unknown: { label: "no data yet", tone: "muted" },
};

export const daysSince = (ts: number | null | undefined): number | null =>
  ts == null ? null : Math.floor((Date.now() - ts) / 86_400_000);

export function freshnessOf(ts: number | null | undefined): Freshness {
  const d = daysSince(ts);
  if (d == null) return "unknown";
  if (d <= FRESH_DAYS) return "fresh";
  if (d <= AGING_DAYS) return "aging";
  return "stale";
}

export type StaleVerdict = {
  level: Freshness;
  days: number | null;
  /** the carried data was reported for a period that isn't the one being asked about */
  periodMismatch: boolean;
  sourcePeriods: string[];
  /** one plain sentence — what's wrong and what to do */
  message: string | null;
};

/** Judge carried-forward data against the period it's now being reused in. */
export function assessFreshness(
  read: Pick<RecordRead, "sourceAt" | "sourcePeriods">,
  requestPeriod: string,
): StaleVerdict {
  const level = freshnessOf(read.sourceAt);
  const days = daysSince(read.sourceAt);
  const others = read.sourcePeriods.filter((p) => p && p !== requestPeriod);
  const periodMismatch = others.length > 0;

  let message: string | null = null;
  if (level === "unknown") message = null;
  else if (periodMismatch) {
    message = `These figures were reported for ${others.join(", ")}, not ${requestPeriod}. Emissions move between periods — confirm each one still holds or replace it.`;
  } else if (level === "stale") {
    message = `This data is ${days} days old. Anything past a year needs re-confirming before it can be filed — check each figure and update what's changed.`;
  } else if (level === "aging") {
    message = `This data is ${days} days old. Have a look before you submit — fuel mix, scrap ratio and grid factors all drift.`;
  }

  return {
    level,
    days,
    periodMismatch,
    sourcePeriods: read.sourcePeriods,
    message,
  };
}

/** Worst of the two signals — what a badge should show. */
export const staleLevel = (v: StaleVerdict): Freshness =>
  v.periodMismatch && v.level !== "unknown" ? "stale" : v.level;

/* ── Freshness at the point of use (validation V14) ─────────────
   `freshnessOf` above asks "how old is this today". A verifier asks a
   different question: how old was it at the END OF THE PERIOD it is being
   reported for. A figure typed in March 2026 is fresh today and fresh for a
   2026 filing — but reused in a 2028 dossier it was already two years stale
   on the day that period closed, and "we checked it recently" is not an
   answer. This is the version the precursor chain is judged by, because
   precursor data is the part exporters reuse hardest. */
export type PointOfUseFreshness = {
  level: Freshness;
  /** age in days measured at the period end, not today */
  daysAtPeriodEnd: number | null;
  message: string | null;
};

export function freshnessAtPeriodEnd(
  sourceAt: number | null | undefined,
  periodEndISO: string | undefined,
): PointOfUseFreshness {
  if (sourceAt == null)
    return { level: "unknown", daysAtPeriodEnd: null, message: null };
  const end = periodEndISO
    ? Date.parse(`${periodEndISO}T23:59:59Z`)
    : Date.now();
  const reference = Number.isFinite(end) ? end : Date.now();
  // A figure reported after the period closed is not "negative days old" — it
  // is current for that period, which is the normal case.
  const days = Math.max(0, Math.floor((reference - sourceAt) / 86_400_000));
  const level: Freshness =
    days <= FRESH_DAYS ? "fresh" : days <= AGING_DAYS ? "aging" : "stale";
  const message =
    level === "stale"
      ? `This data was already ${days} days old when the reporting period closed. Anything past a year has to be re-confirmed before a verifier will accept it.`
      : level === "aging"
        ? `This data was ${days} days old at the end of the reporting period. Worth re-confirming — fuel mix, scrap ratio and grid factors all drift.`
        : null;
  return { level, daysAtPeriodEnd: days, message };
}

/** The same judgement for a whole supplier record — what a precursor row
    drawing on that record inherits. */
export const recordFreshnessAtPeriodEnd = (
  record: SupplierRecord | null | undefined,
  periodEndISO: string | undefined,
): PointOfUseFreshness =>
  freshnessAtPeriodEnd(record?.updatedAt ?? null, periodEndISO);

/* ── Access mutations ─────────────────────────────────────────── */
export function setSectionAccess(
  company: string,
  section: SectionKey,
  audience: Audience,
  allowed: boolean,
): SupplierRecord {
  return mutateRecord(company, (r) => ({
    ...r,
    access: {
      ...r.access,
      sections: {
        ...r.access.sections,
        [section]: { ...r.access.sections[section], [audience]: allowed },
      },
    },
  }));
}

export function setReuseForOrg(
  company: string,
  org: string,
  allowed: boolean,
): SupplierRecord {
  return mutateRecord(company, (r) => ({
    ...r,
    access: {
      ...r.access,
      reuseByOrg: { ...r.access.reuseByOrg, [org]: allowed },
    },
  }));
}

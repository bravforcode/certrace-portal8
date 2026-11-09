/* ════════════════════════════════════════════════════════════
   NESTED PRECURSOR SUPPLIERS — each with its own SEE and its own chain

   Part 1 modelled precursors as a tree of MATERIALS (lib/cbam/precursor-tree.ts):
   "rebar is 1.02 t of billet, billet is 0.85 t of pig iron". That is the right
   arithmetic and it stays. What it cannot say is WHO made the billet, at which
   installation, in which country, and how good the evidence behind their
   figure is — and those are the questions a verifier asks about a complex
   good, because the answer decides whether the number is admissible at all.

   So this promotes each tier to a SUPPLIER with an installation, a country, a
   route, its own SEE and its own data origin. Steel routinely runs four tiers:

     sinter / coke → pig iron → crude steel → hot-rolled → cold-rolled / coated

   THE RULE THAT MATTERS MOST: a chain is only as verified as its weakest
   link. `weakestOrigin` propagates the weakest dataOrigin up the tree, because
   a supplier_verified billet built on a default_value pig iron is not a
   verified billet — and presenting it as one is precisely the misstatement a
   verifier tests for on complex goods.

   Scrap short-circuits to zero at ANY depth, before anything else is read.
   A scrap input carries no embedded emissions under CBAM however carefully
   somebody fills in a figure for it.
   ════════════════════════════════════════════════════════════ */

import { annualProductionFor } from "./monthly-data";
import { fieldStatuses } from "./cbam/precursor-fields";
import { cnProductByCode } from "./cbam/cn-catalogue";
import { aggregatedGoodsCategory, getCatalogProduct, isEuOrExempt } from "./config";
import type { VerificationWorkspace } from "./workspace";
import { secureId } from "./secure-id";

/* ── Data origin ────────────────────────────────────────────────
   Ordered strongest to weakest. The ordering is load-bearing: `weakestOrigin`
   and `defaultValueShare` both read it, and the 20% cap below is expressed
   against the weakest tier. */
export type DataOrigin = "supplier_verified" | "supplier_unverified" | "default_value";

export const DATA_ORIGINS: DataOrigin[] = ["supplier_verified", "supplier_unverified", "default_value"];

export const DATA_ORIGIN_LABEL: Record<DataOrigin, string> = {
  supplier_verified: "Supplier — verified",
  supplier_unverified: "Supplier — unverified",
  default_value: "Default value",
};

export const DATA_ORIGIN_HINT: Record<DataOrigin, string> = {
  supplier_verified: "The supplier's own figure, with an accredited verification statement behind it.",
  supplier_unverified: "The supplier gave a figure but no verification statement. Usable, and a verifier will test it.",
  default_value: "No supplier figure — a published default was used. Carries a markup, and is capped for complex goods.",
};

/** Weakest wins. Rank ascending: 0 is strongest. */
const ORIGIN_RANK: Record<DataOrigin, number> = {
  supplier_verified: 0,
  supplier_unverified: 1,
  default_value: 2,
};

/* ── The cap ────────────────────────────────────────────────────
   No more than 20% of a complex good's precursor contribution may rest on
   default values. Above it, the Precursors tab is BLOCKED — not warned —
   because a filing built on it would be rejected rather than queried. */
export const DEFAULT_VALUE_SHARE_CAP = {
  value: 0.2,
  source: "Build spec §4 — per-tab completion rules: 'complex good with a default_value share > 20%' blocks the Precursors tab",
};

/** Real iron & steel chains are two to four tiers. Six is generous headroom;
    beyond it, something points back into the chain. */
export const MAX_SUPPLIER_DEPTH = 6;

export type MonthlyQuantity = { month: string; tonnes: number };

/** Where the precursor actually came from — the split that decides which
    field set applies and, downstream, whether a verification report is even
    a meaningful concept for this row. A tier made at the SAME installation in
    a different production process is not a "supplier" in any sense a
    verifier cares about; a tier bought in from elsewhere is, and only that
    case ever needs the purchased-only fields below. */
export type PrecursorOrigin = "same_installation" | "purchased";

export const PRECURSOR_ORIGINS: PrecursorOrigin[] = ["purchased", "same_installation"];

export const PRECURSOR_ORIGIN_LABEL: Record<PrecursorOrigin, string> = {
  purchased: "Purchased from another installation",
  same_installation: "Produced here, in a different production process",
};

/** The four checks Annex II A.1(4) makes a purchased precursor's verification
    report clear before its figure counts as actual data. Written by
    `validateVerificationReport`, never hand-edited — a screen that let
    somebody tick these directly would be grading its own homework. */
export type VerificationCheckResult = {
  accreditationValid: boolean;
  sectoralScopeMatch: boolean;
  periodCovered: boolean;
  fileIntact: boolean;
  failedReasons: string[];
};

export type PrecursorSupplier = {
  id: string;
  workspaceId: string;
  /** null = a direct input to our good */
  parentId: string | null;
  /** the company — "Chonburi Foundry" */
  name: string;
  /** where it was ACTUALLY produced. A trader's name is not an installation,
      and naming the trader is the most common precursor finding there is. */
  installationName: string;
  country: string;
  precursorName: string;
  cnCode: string;
  /* Set when the precursor was picked from the CBAM catalogue rather than
     typed. It is what lets the screen LOCK the pair: choose a product and the
     CN code is the catalogue's, choose a CN code and the name is the
     catalogue's, and neither can then drift from the other.

     Optional, and deliberately so — a tier-4 supplier sometimes ships
     something whose CN code nobody upstream has ever established, and a chain
     that cannot record that is a chain that gets recorded wrongly instead. A
     typed pair is allowed; it is just not locked. */
  catalogProductId?: string;
  productionRoute: string;
  isScrap: boolean;
  /** tCO₂e per tonne of this precursor. null while unknown; forced to 0 when
      isScrap. Only meaningful on a leaf — a node with children derives it.
      Kept in sync with the direct/indirect split below by `saveSupplier` —
      whichever of the two was written last is the one that wins, so an old
      caller that only ever knew this single field still works unchanged. */
  seeTco2ePerT: number | null;
  /** the direct/indirect split of the figure above — Annex II asks for both
      separately, not just their sum, and the split is what lets the workings
      display show which half of the number carries which kind of evidence */
  specificEmbeddedDirectTco2PerT?: number | null;
  specificEmbeddedIndirectTco2PerT?: number | null;
  dataOrigin: DataOrigin;
  monthlyQuantities: MonthlyQuantity[];

  /* ── Smart Link lifecycle ─────────────────────────────────────
     `linkStatus()` below derives the six-state status purely from these
     timestamps (plus `verificationChecks`) — none of them is ever set by
     hand, and there is deliberately no separate "status" field to drift out
     of sync with them. */
  /** stamped by `sendAllPrecursorLinks` / the single-node "send" action */
  smartLinkToken?: string;
  smartLinkSentAt?: string;
  /** stamped on EVERY send, where `smartLinkSentAt` only records the first.
      The two are different questions: "has this supplier ever been asked"
      drives the link-status state machine, and "when were they last asked"
      is what the once-a-day resend throttle reads. Undefined on any row sent
      before this field existed — the throttle falls back to
      `smartLinkSentAt`, which is the same answer for a row sent once. */
  smartLinkLastSentAt?: string;
  /** stamped by app/p/[token]/page.tsx on mount, the first time it is opened */
  smartLinkOpenedAt?: string;
  /** stamped on submit */
  smartLinkSubmittedAt?: string;

  /** who created this row — the exporter, working down from the finished
      good, or the supplier, working up from their own precursor via their
      Smart Link. Undefined reads as "exporter", for every row saved before
      this field existed. */
  addedBy?: "exporter" | "supplier";

  /* ── The row at the TOP of the chain ──────────────────────────
     THIS IS NOT A PRECURSOR. It is the installation the product is made at
     — the chain's own root — carrying a supplier-form answer set so that
     "Enter verified data" opens the SAME dialog on every row of the chain
     instead of a differently-shaped one at tier 1.

     It lives in this store rather than in a new one because it is the same
     kind of answer: who produced it, where, what the figure is, and which
     verification report stands behind it. What it must never be is a
     PRECURSOR of the good it IS — so `listSuppliers` filters it out, which
     keeps it out of `treeFor`, every count, the readiness rules, the
     dashboards, the action queue and the bulk invite in one move. The only
     readers that see it are the ones that ask for a row BY ID
     (`getSupplier`, and therefore the Smart Link resolver) plus
     `chainRootSupplier` below.

     Seeded from the Installation record the first time the dialog is opened
     — see lib/chain-root-supplier.ts. */
  isChainRoot?: boolean;

  /** set when a SUPPLIER added this node and named a producing installation
      (`installationUniqueId` / `unlocode`) that does not match anything
      already on file for this chain — surfaced to the exporter as a node to
      confirm, merge or reject, never auto-matched by company name. */
  pendingExporterConfirmation?: boolean;

  /* Upstream tiers rarely give monthly tonnages — a tier-3 supplier quotes a
     ratio ("0.85 t pig iron per t billet") and nothing else. When
     monthlyQuantities is empty this is used instead, so a real four-tier
     chain can be built without inventing twelve fake monthly readings. */
  qtyPerTonneOverride?: number;

  /** Total consumed to produce the output in THIS process — including
      material that never reached the finished good (offcuts, spillage,
      scrap, burn-off). The same number `totalTonnes`/monthlyQuantities
      already represent; carried here too as an explicit, named field so the
      quantity's meaning is unambiguous wherever it is read rather than
      relying on a reader to have found the hint text on the form. */
  quantityUsedT?: number;

  origin: PrecursorOrigin;

  /* ── Who to chase, and where the link goes ─────────────────────
     A precursor row is created from the SAME form as a supplier company
     (components/workspace/supplier-form.tsx's SupplierFields), so it
     carries the same three contact facts. They are stored on the row and
     not only on the SupplierCompany record because the row is what the
     Smart Link is sent FROM, and a chain that has to join through a second
     store to answer "who do I email about this figure" is a chain where
     that answer eventually goes missing.

     `supplierCompanyId` links the two: the row's own copy is what the
     screens read, and the company record is what the Suppliers page lists.
     Optional throughout — every row saved before this existed loads
     unchanged, and every reader defaults to "". */
  supplierCompanyId?: string;
  /** the named person who answers for this precursor's figures */
  contactName?: string;
  /** REQUIRED at creation time (see canSaveSupplier in
      lib/supplier-companies.ts, which this form reuses verbatim): it is the
      address the Smart Link is sent to, and the one field that stops the
      whole arrangement working if it is wrong. */
  contactEmail?: string;
  /** stored joined, "+66 38 123 456" — see lib/dial-codes.ts */
  contactPhone?: string;

  /** same_installation only — which of the workspace's own production
      processes made this precursor. Free text: the portal has no structured
      registry of "production processes" independent of workspaces, so this
      names the process rather than referencing a record. */
  sourceProcessId?: string;

  /* ── purchased only ──────────────────────────────────────────── */
  latitude?: number;
  longitude?: number;
  installationUniqueId?: string;
  unlocode?: string;
  fullAddress?: string;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
  /** links to a lib/workspace-evidence.ts EvidenceItem carrying the
      verifier's report — the PDF. Validation does not read it: a scanned
      report is not machine-checkable, so the facts it states are entered
      separately, below, and THOSE are what `validateVerificationReport`
      checks against. */
  verificationReportFileId?: string;
  /* ── the report's facts, entered by hand — never parsed from the PDF ──
     Annex II A.1(4)'s two live conditions, each backed by its own field
     rather than a single "I confirm this is valid" checkbox: a verifier
     grading their own homework is exactly what a screen that let this be
     ticked directly would invite. */
  verifierName?: string;
  verifierAccreditationNumber?: string;
  verifierAccreditationIssuingCountry?: string;
  /** the accreditation must still be valid on the report's OWN issue date
      below — not on the date somebody happens to be looking at this screen */
  verifierAccreditationExpiryDate?: string;
  verificationReportIssueDate?: string;
  /** when THIS REPORT itself needs renewing — a forward-looking date, unlike
      verifierAccreditationExpiryDate above (which only ever checks a fact
      about the past: was the accreditation valid on the day the report was
      issued). Read by lib/supplier-tree.ts's computeNodeStatus() to tell a
      currently-valid verification from one that has lapsed since. Optional
      and not yet set by any UI — the Tree's "Enter Verified Data" flow that
      collects it is a later phase; until then this is simply never past due. */
  verificationReportExpiresAt?: string;
  /** free text, matched against this precursor's aggregated goods category
      when one is on file (see `validateVerificationReport`) */
  verificationSectoralScope?: string;
  /** written by validateVerificationReport, read by the UI and by
      precursorReadiness — never hand-edited */
  verificationChecks?: VerificationCheckResult;

  /* ── sector-specific — Iron or steel products, shown conditionally ──── */
  reducingAgent?: string;
  mnPct?: number;
  crPct?: number;
  niPct?: number;
  otherAlloyingPct?: number;
  scrapRatioTPerT?: number;
  preConsumerScrapPct?: number;

  /* ── In-platform report workspace ───────────────────────────────
     Set when the exporter has created a real VerificationWorkspace
     (lib/workspace.ts) on this precursor's behalf, rather than waiting on a
     Smart Link submission — the path for a supplier who has never produced
     a report of their own. That workspace runs through the exact same
     Overview → Monthly data → Readiness pipeline as any of the exporter's
     own workspaces, including its own MMD generation and sign-off gate;
     nothing here re-implements or shortcuts that. Once the resulting
     document has been verified externally, the result still comes back the
     ordinary way — Enter Verified Data plus an attached document, same as
     any other precursor. */
  linkedWorkspaceId?: string;

  /* ── Default or actual, per direct precursor ──────────────────
     Annex II A.1(2) to Implementing Regulation (EU) 2025/2547 lets an operator
     take actual values, default values, or a mix — precursor by precursor.
     `valueBasis` is that choice. Undefined on every row saved before the
     Precursors tab existed; those keep the behaviour they always had.

     "default" — Annex IV item 22: CN code, name of the good, country of origin
                 where known, and the default value from the EU tables (the
                 highest default for the CN code when the country is unknown).
     "actual"  — Annex IV item 23: the precursor's operator supplies a verified
                 figure. Until it is complete AND admissible under Annex II
                 A.1(4), the default value stands in — see
                 lib/cbam/precursor-basis.ts. */
  valueBasis?: "default" | "actual";
  /** the country of production cannot be identified — Annex IV to the
      Regulation: the highest country default for the CN code applies */
  originUnknown?: boolean;
  /** Annex IV item 23(d): the precursor's period is presumed to be the one of
      the complex good unless the operator evidences the actual time of production */
  reportingPeriodBasis?: "default_period" | "actual_time";
  /** Annex IV item 25 — the same CN code also arrives from other installations */
  alsoFromOtherInstallations?: boolean;
  /** Annex IV item 35, keyed by the registry's sector-parameter keys */
  sectorParams?: Record<string, string>;
  /* The verification report template, point 2.5(b)(7) */
  verifierAddress?: string;
  verifierLeadAuditor?: string;
  verifierAccreditationBody?: string;
  /** the statement concludes with reasonable assurance and no material
      misstatement or non-conformity — only `true` makes the figure usable */
  verifierReasonableAssurance?: boolean;
};

/* ── Store ──────────────────────────────────────────────────────
   Flat rows keyed by workspace; the tree is assembled on read. Storing it
   flat is what makes "re-parent this supplier" a one-field edit instead of a
   subtree move. */
const KEY = "certrace:precursor-suppliers";

type Store = Record<string, PrecursorSupplier[]>;

export const uid = () => secureId("ps");

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

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

/* Every row in this workspace's bucket, INCLUDING the chain-root row. Private:
   almost nothing wants this. The two callers that do are the ones that address
   a row by its id (`getSupplier`) and the one that rewrites the whole bucket
   (`removeSupplier`) — a delete built on the filtered list would drop the root
   row on the floor as a side effect of removing an unrelated precursor. */
const allRows = (workspaceId: string): PrecursorSupplier[] => read()[workspaceId] ?? [];

/** The workspace's PRECURSORS. The chain-root row is not one of them — see
    `isChainRoot` — so it is filtered here, once, rather than in each of the
    twenty-odd readers that ask "what hangs under this product". */
export const listSuppliers = (workspaceId: string): PrecursorSupplier[] => allRows(workspaceId).filter((s) => !s.isChainRoot);

/** By id, chain-root row included: a row addressed by its own id is a row
    somebody already holds a reference to — a Smart Link token, an open
    dialog — and answering "no such row" for the top of the chain would break
    the link the supplier was handed. */
export const getSupplier = (workspaceId: string, id: string): PrecursorSupplier | null =>
  allRows(workspaceId).find((s) => s.id === id) ?? null;

/** The chain-root row for this workspace, if it has been created yet.
    `ensureChainRootSupplier` (lib/chain-root-supplier.ts) is what creates it. */
export const chainRootSupplier = (workspaceId: string): PrecursorSupplier | null =>
  allRows(workspaceId).find((s) => s.isChainRoot) ?? null;

/* ── Which workspaces exist because a precursor was tracked ─────
   "Track report" on a chain row creates a REAL VerificationWorkspace and
   stores its id on the precursor as `linkedWorkspaceId`. From the workspace's
   own side there is nothing to distinguish it from one the exporter opened
   directly — deliberately, because it runs the identical Overview → Monthly
   data → Readiness pipeline and must not be a second-class one.

   But the two are different CONVERSATIONS. "This is my plant's January" and
   "this is my supplier's January, which I am filling in on their behalf" go
   to different people and mean different things on a report list, so every
   screen that lists workspaces needs to be able to tell them apart.

   ONE PASS OVER EVERY CHAIN, and the answer keyed by workspace id — the
   alternative is asking the question per workspace, which walks every chain
   once per workspace. The value is the precursor row itself rather than a
   bare `true`, because the useful label is not "tracked" but "tracked for
   Chonburi Foundry's pig iron", and only the row knows that. */
export function trackedWorkspaceIndex(workspaces: Pick<VerificationWorkspace, "id">[]): Map<string, PrecursorSupplier> {
  const out = new Map<string, PrecursorSupplier>();
  for (const w of workspaces) {
    for (const s of listSuppliers(w.id)) {
      if (s.linkedWorkspaceId) out.set(s.linkedWorkspaceId, s);
    }
  }
  return out;
}

export type PrecursorSupplierRow = { supplier: PrecursorSupplier; workspace: VerificationWorkspace };

/** Every precursor node across every workspace the account owns, each
    carrying the workspace it belongs to — the cross-workspace query the
    unified Suppliers page needs (§3) that nothing before it required, since
    every other reader of this store already had one workspace in view.
    Scrap is excluded: it is never invited, never verified, and has nothing
    to show on a page about supplier RESPONSIVENESS. Takes the workspace
    list as a parameter rather than calling listWorkspaces() itself, so this
    file never has to import lib/workspace.ts for anything but its type. */
export function allPrecursorSuppliers(workspaces: VerificationWorkspace[]): PrecursorSupplierRow[] {
  return workspaces.flatMap((workspace) => listSuppliers(workspace.id).filter((s) => !s.isScrap).map((supplier) => ({ supplier, workspace })));
}

export const emptySupplier = (workspaceId: string, parentId: string | null = null): PrecursorSupplier => ({
  id: uid(),
  workspaceId,
  parentId,
  name: "",
  installationName: "",
  country: "TH",
  precursorName: "",
  cnCode: "",
  productionRoute: "",
  isScrap: false,
  seeTco2ePerT: null,
  dataOrigin: "supplier_unverified",
  monthlyQuantities: [],
  origin: "purchased",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
});

/** The four checks Annex II A.1(4) requires of a purchased precursor's
    verification report before its figure counts as actual data: the
    verifier's accreditation was valid on the report's issue date, its
    sectoral scope covers this precursor's category, the report's period
    covers the precursor's declared reporting period, and the uploaded file
    is actually there.

    EACH CHECK READS STRUCTURED METADATA THE SUPPLIER TYPED, NEVER THE PDF
    ITSELF — a scanned report is not machine-checkable, and pretending to
    read one would be a worse lie than asking the two dates and the scope
    directly. The PDF is still required (`fileIntact`), but only as evidence
    a human can open, not as an input to this function.

    Pure — reads only what is stored on the row, writes nothing.
    `saveSupplier` is the only caller that acts on the result. */
const SECTOR_WORDS: Record<string, string[]> = {
  "Iron & Steel": ["iron", "steel"],
  Aluminium: ["alumin"],
  Cement: ["cement", "clinker", "clay"],
  Fertilisers: ["fertili", "ammonia", "nitric", "urea", "nitrogen"],
  Hydrogen: ["hydrogen"],
};

export function validateVerificationReport(
  s: Pick<
    PrecursorSupplier,
    | "reportingPeriodStart"
    | "reportingPeriodEnd"
    | "verificationReportFileId"
    | "verifierAccreditationExpiryDate"
    | "verificationReportIssueDate"
    | "verificationSectoralScope"
    | "catalogProductId"
  > & { cnCode?: string },
): VerificationCheckResult {
  const failedReasons: string[] = [];

  const hasPeriod = Boolean(s.reportingPeriodStart && s.reportingPeriodEnd);
  const hasFile = Boolean(s.verificationReportFileId);
  const fileIntact = hasFile;
  const periodCovered = hasPeriod;

  // Accreditation must still be valid ON the report's own issue date — not
  // on whatever date somebody happens to be looking at this screen, which is
  // why both dates are required and compared to each other rather than
  // either being compared to "now".
  const hasAccreditationDates = Boolean(s.verifierAccreditationExpiryDate && s.verificationReportIssueDate);
  const accreditationValid = hasAccreditationDates && s.verificationReportIssueDate! <= s.verifierAccreditationExpiryDate!;

  // Matched against the CBAM catalogue's own category for this precursor
  // when one is on file — a typed precursor with no catalogue link has
  // nothing to check the claim against, so a non-empty self-declaration is
  // taken as the claim rather than rejected outright.
  // The catalogue link when there is one; otherwise the CN code itself — a
  // typed precursor still has a sector, and "Cement" does not cover steel.
  const catalogProduct = s.catalogProductId ? getCatalogProduct(s.catalogProductId) : s.cnCode ? cnProductByCode(s.cnCode) : undefined;
  const expectedScope = catalogProduct ? aggregatedGoodsCategory(catalogProduct) : null;
  const claimedScope = s.verificationSectoralScope?.trim();
  /* A verifier's accreditation is scoped to a SECTOR — "iron and steel",
     "cement", "fertilisers" — not to the regulation's aggregated goods category.
     Demanding the category's own name would reject “Iron and steel” on a
     crude-steel precursor, which is exactly the scope that covers it. So the
     claim matches on the category name OR on its sector's words. */
  const sectorWords = catalogProduct ? SECTOR_WORDS[catalogProduct.category] ?? [] : [];
  const claimed = (claimedScope ?? "").toLowerCase();
  const sectoralScopeMatch =
    Boolean(claimedScope) &&
    (expectedScope == null || claimed.includes(expectedScope.toLowerCase()) || sectorWords.some((w) => claimed.includes(w)));

  if (!hasFile) failedReasons.push("No verification report is attached.");
  if (!hasAccreditationDates) failedReasons.push("The verifier's accreditation expiry date and the report's issue date are not both recorded.");
  else if (!accreditationValid) failedReasons.push(`The accreditation expired ${s.verifierAccreditationExpiryDate}, before the report was issued on ${s.verificationReportIssueDate}.`);
  if (!claimedScope) failedReasons.push("The verifier's sectoral scope is not recorded.");
  else if (expectedScope != null && !sectoralScopeMatch) failedReasons.push(`The verifier's stated sectoral scope ("${claimedScope}") does not cover ${expectedScope}.`);
  if (!hasPeriod) failedReasons.push("The producing installation's reporting period is not recorded, so the report's coverage cannot be checked.");

  return { accreditationValid, sectoralScopeMatch, periodCovered, fileIntact, failedReasons };
}

export function saveSupplier(s: PrecursorSupplier): PrecursorSupplier {
  // SupplierEditor's draft state is typed PrecursorSupplier but initialised
  // from a SupplierNode (treeFor's own PrecursorSupplier & {depth, children}
  // shape) — structurally a valid PrecursorSupplier, so TypeScript allows
  // the assignment, but the extra fields ride along through every `{...s}`
  // spread unless stripped here. Left in, a single autosave nests that
  // moment's whole subtree snapshot into this one row, permanently, and
  // every future read of it carries a second, stale copy of its own
  // children alongside the real ones in the flat store. This is the one
  // place every write passes through, so it is the one place this is worth
  // guarding rather than trusting every caller to spread cleanly.
  const { depth: _depth, children: _children, ...clean } = s as PrecursorSupplier & { depth?: number; children?: unknown };
  let row: PrecursorSupplier = { ...clean };

  // Scrap forces SEE to 0 at the store layer, not in the UI, so no screen and
  // no import path can write a non-zero figure onto a scrap row.
  if (row.isScrap) {
    row = { ...row, seeTco2ePerT: 0, specificEmbeddedDirectTco2PerT: 0, specificEmbeddedIndirectTco2PerT: 0 };
  } else if (
    row.dataOrigin !== "default_value" &&
    (row.specificEmbeddedDirectTco2PerT != null || row.specificEmbeddedIndirectTco2PerT != null)
  ) {
    // The direct/indirect split, when present, is the figure of record — the
    // combined seeTco2ePerT is kept as its sum so every existing reader of
    // the single field (effectiveSee, the readiness rules) needs no change.
    // Skipped for a default-value row: there the published table's total is
    // the figure of record, and a stale split left over from before the
    // switch must not silently override it.
    row = { ...row, seeTco2ePerT: (row.specificEmbeddedDirectTco2PerT ?? 0) + (row.specificEmbeddedIndirectTco2PerT ?? 0) };
  }

  // EU / exempted-territory origin: SEE is 0 by construction, locked, no
  // verification report required — this is not a data-quality tier, it is
  // that no CBAM liability exists to evidence.
  if (row.origin === "purchased" && isEuOrExempt(row.country)) {
    row = {
      ...row,
      seeTco2ePerT: 0,
      specificEmbeddedDirectTco2PerT: 0,
      specificEmbeddedIndirectTco2PerT: 0,
      dataOrigin: "supplier_verified",
      verificationChecks: undefined,
    };
  } else if (row.origin === "purchased" && !row.isScrap && row.dataOrigin === "supplier_verified") {
    // The 4-check gate is what "verified" means — it is the origin that
    // claims an accredited verification statement stands behind the figure
    // (see DATA_ORIGIN_HINT), so it is the only one the checks apply to. An
    // unverified figure makes no such claim and has nothing to fail.
    const checks = validateVerificationReport(row);
    row = { ...row, verificationChecks: checks };
    const allPassed = checks.accreditationValid && checks.sectoralScopeMatch && checks.periodCovered && checks.fileIntact;
    // The mandatory fallback: any failed check drops the row to a default
    // value automatically, not as a warning beside a figure that stays put.
    if (!allPassed) row = { ...row, dataOrigin: "default_value" };
  } else if (row.origin === "purchased") {
    row = { ...row, verificationChecks: undefined };
  }

  const store = read();
  const rows = store[row.workspaceId] ?? [];
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx >= 0) rows[idx] = row;
  else rows.push(row);
  store[row.workspaceId] = rows;
  write(store);
  return row;
}

/* ── Toggling scrap ─────────────────────────────────────────────
   Ticking "this input is scrap" forces SEE to 0. UN-ticking it has to put the
   field back to UNKNOWN, not leave the 0 behind.

   The difference is not cosmetic. A 0 that survives the untick is a claim —
   "this pig iron carries no embedded emissions" — and it is a claim the row
   now makes silently, with a `supplier_verified` chip beside it, because
   nothing on the screen distinguishes a zero the operator meant from a zero
   the checkbox left there. `null` renders as an empty field that reads as a
   question, which is what an unanswered figure should look like. */
export function setScrap(s: PrecursorSupplier, isScrap: boolean): PrecursorSupplier {
  return saveSupplier({ ...s, isScrap, seeTco2ePerT: isScrap ? 0 : null });
}

/** Removing a supplier removes everything beneath it — a subtree is one claim
    about one chain, and orphaning its upstream tiers would leave rows that
    contribute to nothing and can never be found again. */
export function removeSupplier(workspaceId: string, id: string): PrecursorSupplier[] {
  /* allRows, not listSuppliers: this rewrites the whole bucket from what it
     reads, so reading the filtered list would delete the chain-root row as a
     silent side effect of removing any precursor. */
  const rows = allRows(workspaceId);
  const doomed = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const r of rows) {
      if (r.parentId && doomed.has(r.parentId) && !doomed.has(r.id)) {
        doomed.add(r.id);
        grew = true;
      }
    }
  }
  const store = read();
  store[workspaceId] = rows.filter((r) => !doomed.has(r.id));
  write(store);
  return store[workspaceId];
}

export function removeSuppliersForWorkspace(workspaceId: string): void {
  const store = read();
  delete store[workspaceId];
  write(store);
}

/* ── Errors ─────────────────────────────────────────────────────
   A cycle is not a warning to be rendered next to a number. It means the
   arithmetic cannot be performed, and the traversal raises rather than
   looping the browser into silence. */
export class PrecursorSupplierError extends Error {
  readonly code: "CYCLE" | "DEPTH";
  readonly nodeName: string;

  constructor(code: "CYCLE" | "DEPTH", message: string, nodeName: string) {
    super(message);
    this.name = "PrecursorSupplierError";
    this.code = code;
    this.nodeName = nodeName;
  }
}

/* ── The tree ───────────────────────────────────────────────────
   Assembled from flat rows. A row whose parentId points at a missing row is
   promoted to a root rather than dropped — a lost row is a visible orphan,
   never a silently vanished tonne. */
export type SupplierNode = PrecursorSupplier & { children: SupplierNode[]; depth: number };

export function treeFor(workspaceId: string): SupplierNode[] {
  const rows = listSuppliers(workspaceId);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const byParent = new Map<string | null, PrecursorSupplier[]>();

  for (const r of rows) {
    const parent = r.parentId && byId.has(r.parentId) ? r.parentId : null;
    byParent.set(parent, [...(byParent.get(parent) ?? []), r]);
  }

  const visited = new Set<string>();

  const build = (parentId: string | null, depth: number, ancestry: Set<string>): SupplierNode[] => {
    if (depth > MAX_SUPPLIER_DEPTH) {
      throw new PrecursorSupplierError(
        "DEPTH",
        `The precursor chain is more than ${MAX_SUPPLIER_DEPTH} tiers deep. Real iron & steel chains run two to four — check for a supplier that points back into the chain.`,
        "",
      );
    }
    return (byParent.get(parentId) ?? []).map((r) => {
      if (ancestry.has(r.id)) {
        throw new PrecursorSupplierError(
          "CYCLE",
          `"${r.name || r.precursorName || "unnamed supplier"}" appears inside its own supply chain. A precursor cannot be made from itself — remove the loop before this can be calculated.`,
          r.name || r.precursorName,
        );
      }
      visited.add(r.id);
      const next = new Set(ancestry);
      next.add(r.id);
      return { ...r, depth, children: build(r.id, depth + 1, next) };
    });
  };

  const roots = build(null, 1, new Set());

  /* A cycle that never touches a root is invisible to the walk above: with
     A→B and B→A neither row is reachable from null, so the traversal simply
     returns nothing and both suppliers vanish from the tree, the calculation
     and the screen — a silently deleted tonne, which is worse than an error.

     So anything the walk did not reach is a cycle by construction (orphans
     were already promoted to roots), and it raises. */
  const unreached = rows.filter((r) => !visited.has(r.id));
  if (unreached.length > 0) {
    const names = unreached.map((r) => r.name || r.precursorName || "unnamed supplier");
    throw new PrecursorSupplierError(
      "CYCLE",
      `${names.length === 1 ? `"${names[0]}" is` : `${names.map((n) => `"${n}"`).join(", ")} are`} inside a loop in the supply chain — each is reachable only from the other, so nothing connects to the finished good. A precursor cannot be made from itself; remove the loop before this can be calculated.`,
      names[0],
    );
  }

  return roots;
}

/** Depth-first flatten, for tables and the verifier pack. */
export function flatten(nodes: SupplierNode[]): SupplierNode[] {
  const out: SupplierNode[] = [];
  const walk = (list: SupplierNode[]) => {
    for (const n of list) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** Every row transitively parented under `id` (not including `id` itself),
    depth-first — flat rather than treeFor's cycle-checking nested build,
    for callers that just need "everything under this node" without the
    workspace-wide throw-on-cycle behavior (e.g. the /p/<token> portal's
    submit-time walk, lib/supplier-tree.ts's buildPrecursorSubtree). Stops
    descending into a branch that loops back on itself rather than
    throwing — a supplier acting on their own submission can't fix a cycle
    elsewhere in the chain anyway. */
export function descendantsOf(workspaceId: string, id: string): PrecursorSupplier[] {
  const byParent = new Map<string, PrecursorSupplier[]>();
  for (const r of listSuppliers(workspaceId)) {
    if (!r.parentId) continue;
    byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), r]);
  }

  const out: PrecursorSupplier[] = [];
  const walk = (parentId: string, ancestry: Set<string>) => {
    for (const child of byParent.get(parentId) ?? []) {
      if (ancestry.has(child.id)) continue;
      out.push(child);
      walk(child.id, new Set(ancestry).add(child.id));
    }
  };
  walk(id, new Set([id]));
  return out;
}

/** Whether a supplier-typed installation identity (unique ID or UN/LOCODE)
    matches any OTHER row already on file for this workspace — the check
    behind `pendingExporterConfirmation`. Extracted so every node a supplier
    can add through /p/<token> applies the identical rule, not just the
    direct children the old inline check covered. Never matched on company
    name alone — that's exactly the string collision this scheme exists to
    avoid. */
export function matchesExistingInstallation(workspaceId: string, draft: Pick<PrecursorSupplier, "id" | "installationUniqueId" | "unlocode">): boolean {
  const others = listSuppliers(workspaceId).filter((s) => s.id !== draft.id);
  const named = draft.installationUniqueId?.trim() || draft.unlocode?.trim() || "";
  if (!named) return false;
  return others.some(
    (o) => (draft.installationUniqueId && o.installationUniqueId === draft.installationUniqueId) || (draft.unlocode && o.unlocode === draft.unlocode),
  );
}

/* ── Quantities and ratios ──────────────────────────────────────
   m_i for a DIRECT input is Σ monthly tonnes ÷ annual production of the good
   (M7). For an upstream tier it is Σ its tonnes ÷ Σ its PARENT's tonnes —
   tonnes of pig iron per tonne of billet — which is the same question one
   level up. */
export const totalTonnes = (s: Pick<PrecursorSupplier, "monthlyQuantities"> & { quantityUsedT?: number }): number => {
  const monthly = s.monthlyQuantities.reduce((a, q) => a + (q.tonnes || 0), 0);
  /* The Precursors tab asks for ONE annual figure (Annex IV items 20/21), not
     twelve. It counts only when no monthly readings exist, so a row that has
     both never counts the same tonne twice. */
  if (monthly > 0) return monthly;
  return s.quantityUsedT != null && Number.isFinite(s.quantityUsedT) && s.quantityUsedT > 0 ? s.quantityUsedT : 0;
};

/** Tonnes of this node per tonne of its parent's output (or of the finished
    good, for a direct input). Returns null when it cannot be established —
    never 0, because 0 would silently delete the tier from the calculation. */
export function qtyPerTonne(node: SupplierNode, parentTonnes: number | null): number | null {
  const own = totalTonnes(node);
  if (own > 0 && parentTonnes != null && parentTonnes > 0) return own / parentTonnes;
  if (node.qtyPerTonneOverride != null && node.qtyPerTonneOverride > 0) return node.qtyPerTonneOverride;
  return null;
}

/* ── effectiveSee ───────────────────────────────────────────────
   0 if scrap · own declared SEE if a leaf · otherwise recurse into children
   and sum them weighted by their per-tonne ratios.

   Scrap is checked FIRST, at every depth, before a declared figure is read. */
export function effectiveSee(node: SupplierNode): number {
  if (node.isScrap) return 0;

  /* A direct precursor whose basis has been chosen is a leaf: its own figure —
     default, or the operator's verified actual — IS its specific embedded
     emissions. Any upstream tiers recorded before the Precursors tab existed
     are kept, but they no longer feed the number. */
  if (node.children.length === 0 || node.valueBasis) {
    const declared = node.seeTco2ePerT;
    return declared != null && Number.isFinite(declared) ? declared : 0;
  }

  const own = totalTonnes(node);
  let total = 0;
  for (const child of node.children) {
    const ratio = qtyPerTonne(child, own > 0 ? own : null);
    if (ratio == null) continue; // an unquantified tier contributes nothing yet — and shows as incomplete
    total += ratio * effectiveSee(child);
  }
  return total;
}

/* ── weakestOrigin ──────────────────────────────────────────────
   A chain is only as verified as its weakest link. Scrap is excluded from the
   walk: a scrap tier has no emissions figure to be verified or not, and
   letting it drag the chain down would penalise the cleanest input there is. */
export function weakestOrigin(node: SupplierNode): DataOrigin {
  let weakest: DataOrigin = node.isScrap ? "supplier_verified" : node.dataOrigin;
  for (const child of node.children) {
    const childWeakest = weakestOrigin(child);
    if (ORIGIN_RANK[childWeakest] > ORIGIN_RANK[weakest]) weakest = childWeakest;
  }
  return weakest;
}

/* ── M7 / M8 · Contribution to the finished good ────────────────
   m_i = Σ_m qty_i,m / production_annual          [t/t]
   SEE_prec = Σ_i ( m_i × effectiveSee(i) )       over DEPTH-1 nodes only

   Depth-1 only is not an oversight: an upstream tier already reaches the
   finished good through its parent's effectiveSee. Adding it again at the top
   would double-count the whole chain. */
export type NodeContribution = {
  id: string;
  name: string;
  precursorName: string;
  depth: number;
  /** tonnes of this node per tonne of its parent's output */
  ratio: number | null;
  /** tonnes of this node per tonne of the FINISHED GOOD */
  ratioFromGood: number | null;
  /** this node's own embedded emissions, tCO₂e/t of the node */
  see: number;
  /** what this node adds to one tonne of the finished good, tCO₂e/t */
  contribution: number;
  /** the node's OWN declared figure's share, before its children — what
      `defaultValueShare` sums when the origin is default_value */
  ownContribution: number;
  dataOrigin: DataOrigin;
  weakestOrigin: DataOrigin;
  isScrap: boolean;
  complete: boolean;
};

export type PrecursorResult = {
  /** SEE_prec — tCO₂e per tonne of the finished good */
  perTonne: number;
  byNode: NodeContribution[];
  /** the fraction of `perTonne` resting on default values, 0–1 */
  defaultValueShare: number;
  /** true when defaultValueShare exceeds the 20% cap */
  overDefaultCap: boolean;
  /** nodes missing a quantity, an installation or a SEE */
  incomplete: NodeContribution[];
  /** raised by the traversal, when the tree could not be walked at all */
  error: PrecursorSupplierError | null;
};

const EMPTY_RESULT: PrecursorResult = {
  perTonne: 0,
  byNode: [],
  defaultValueShare: 0,
  overDefaultCap: false,
  incomplete: [],
  error: null,
};

/** A node is complete when it names its installation, has a quantity or a
    ratio, and either declares a SEE, is scrap, or has children that do. */
export function nodeComplete(node: SupplierNode, ratio: number | null): boolean {
  if (node.valueBasis === "default") return ratio != null && Boolean(node.precursorName.trim() || node.cnCode.trim());
  if (node.valueBasis === "actual" && node.dataOrigin === "default_value") return false; // still waiting for an admissible actual value
  if (!node.name.trim() || !node.installationName.trim()) return false;
  if (ratio == null) return false;
  if (node.isScrap) return true;
  if (node.children.length > 0) return true;
  return node.seeTco2ePerT != null && Number.isFinite(node.seeTco2ePerT);
}

export function precursorContribution(workspace: Pick<VerificationWorkspace, "id" | "year">): PrecursorResult {
  let roots: SupplierNode[];
  try {
    roots = treeFor(workspace.id);
  } catch (e) {
    return { ...EMPTY_RESULT, error: e instanceof PrecursorSupplierError ? e : null };
  }
  if (roots.length === 0) return EMPTY_RESULT;

  const annual = annualProductionFor(workspace).tonnes;
  const byNode: NodeContribution[] = [];
  let perTonne = 0;
  let defaultContribution = 0;

  const walk = (node: SupplierNode, parentTonnes: number | null, ratioFromGoodOfParent: number | null) => {
    const ratio = qtyPerTonne(node, parentTonnes);
    const ratioFromGood = ratio != null && ratioFromGoodOfParent != null ? ratio * ratioFromGoodOfParent : ratio != null && node.depth === 1 ? ratio : null;
    const see = effectiveSee(node);

    /* The node's OWN declared figure, isolated from its children. A tier that
       derives its SEE from upstream contributes through those children, so
       counting its derived figure here as well would attribute the same
       tonnes to two different data origins. */
    const ownSee = node.isScrap ? 0 : node.children.length > 0 ? 0 : (node.seeTco2ePerT ?? 0);
    const ownContribution = ratioFromGood != null ? ratioFromGood * ownSee : 0;
    if (node.dataOrigin === "default_value" && !node.isScrap) defaultContribution += ownContribution;

    const row: NodeContribution = {
      id: node.id,
      name: node.name,
      precursorName: node.precursorName,
      depth: node.depth,
      ratio,
      ratioFromGood,
      see,
      contribution: ratioFromGood != null ? ratioFromGood * see : 0,
      ownContribution,
      dataOrigin: node.dataOrigin,
      weakestOrigin: weakestOrigin(node),
      isScrap: node.isScrap,
      complete: nodeComplete(node, ratio),
    };
    byNode.push(row);

    const own = totalTonnes(node);
    for (const child of node.children) walk(child, own > 0 ? own : null, ratioFromGood);
  };

  for (const root of roots) {
    const ratio = qtyPerTonne(root, annual > 0 ? annual : null);
    if (ratio != null) perTonne += ratio * effectiveSee(root);
    walk(root, annual > 0 ? annual : null, null);
  }

  const share = perTonne > 0 ? defaultContribution / perTonne : 0;
  return {
    perTonne,
    byNode,
    defaultValueShare: share,
    /* No longer a gate. Implementing Regulation (EU) 2025/2547 Article 15 and
       Annex II A.1(2) allow default values for one, several or all precursors;
       the 20 % ceiling came from the transitional-period rules and is not in
       the definitive-period text. The share is still reported — it is what the
       Precursors tab tells the exporter about — but it blocks nothing. */
    overDefaultCap: false,
    incomplete: byNode.filter((n) => !n.complete),
    error: null,
  };
}

/** §4/§A6 — the fraction of precursor contribution coming from default_value
    nodes. Exposed on its own because the Precursors tab header shows it
    against the cap, and the readiness rules read it directly. */
export const defaultValueShare = (workspace: Pick<VerificationWorkspace, "id" | "year">): number =>
  precursorContribution(workspace).defaultValueShare;

/** The weakest origin anywhere in the workspace's chains — what the Overview
    reports as the quality of the precursor data as a whole. */
export function weakestOriginForWorkspace(workspaceId: string): DataOrigin | null {
  let roots: SupplierNode[];
  try {
    roots = treeFor(workspaceId);
  } catch {
    return null;
  }
  if (roots.length === 0) return null;
  return roots.map(weakestOrigin).reduce((a, b) => (ORIGIN_RANK[b] > ORIGIN_RANK[a] ? b : a));
}

/** A row that reads like scrap but is not flagged. Surfaced as a prompt in
    the editor, never applied — the difference between helping and silently
    rewriting somebody's declaration. */
export const looksLikeScrap = (s: Pick<PrecursorSupplier, "precursorName" | "isScrap">): boolean =>
  !s.isScrap && /\b(scrap|waste|swarf|turnings|offcut|เศษ)\b/i.test(s.precursorName);

/* ── Smart Link status ─────────────────────────────────────────
   Six states, every one of them read off a timestamp rather than set by
   hand — a status field that could be changed independently of the events
   it describes would be a status field that lies. */
export type LinkStatus =
  | "not_invited"
  | "invited_not_opened"
  | "opened_in_progress"
  | "submitted_pending_validation"
  | "submitted_verified"
  | "submitted_failed_validation";

export const LINK_STATUS_LABEL: Record<LinkStatus, string> = {
  not_invited: "Not invited",
  invited_not_opened: "Invited — not opened",
  opened_in_progress: "Opened — in progress",
  submitted_pending_validation: "Submitted — pending validation",
  submitted_verified: "Submitted — verified",
  submitted_failed_validation: "Submitted — failed validation",
};

export function linkStatus(
  s: Partial<Pick<PrecursorSupplier, "smartLinkSentAt" | "smartLinkOpenedAt" | "smartLinkSubmittedAt" | "dataOrigin" | "verificationChecks">>,
): LinkStatus {
  if (!s.smartLinkSentAt) return "not_invited";
  if (!s.smartLinkOpenedAt) return "invited_not_opened";
  if (!s.smartLinkSubmittedAt) return "opened_in_progress";
  // Nothing to validate yet (an unverified claim, or a default value) —
  // submitted is not the same as checked.
  if (s.dataOrigin !== "supplier_verified" || !s.verificationChecks) return "submitted_pending_validation";
  const c = s.verificationChecks;
  return c.accreditationValid && c.sectoralScopeMatch && c.periodCovered && c.fileIntact ? "submitted_verified" : "submitted_failed_validation";
}

/** Whether a verification report's own renewal date has passed — a report
    that once passed the four-check gate can still lapse afterward. This is
    the ONE place that answers "is this still current", deliberately separate
    from the four-check gate itself (validateVerificationReport), which only
    ever checks accreditation validity against the report's OWN issue date —
    a fact about the past that a later reload can't change. Compared against
    "now" at call time, so the answer moves as the calendar does with no
    write ever needed.

    Both LinkStatusChip (Precursors tab) and computeNodeStatus (Tree page,
    lib/supplier-tree.ts) call this — not two independent date comparisons —
    so the two screens can never quietly drift on what counts as expired. */
export function isVerificationExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

/** Actual iff the row claims a verified figure AND the four-check gate
    passed — every other case is a default, whatever the origin label says,
    because a claim without the checks behind it is not admissible as actual
    data under Annex II A.1(4). Never settable by hand; purely a read of
    `dataOrigin` and `verificationChecks`, both already governed elsewhere. */
export function valueType(s: Pick<PrecursorSupplier, "dataOrigin" | "verificationChecks" | "isScrap">): "default" | "actual" {
  if (s.isScrap) return "actual"; // zero is the true figure, not an estimate standing in for one
  if (s.dataOrigin !== "supplier_verified") return "default";
  const c = s.verificationChecks;
  if (!c) return "default";
  return c.accreditationValid && c.sectoralScopeMatch && c.periodCovered && c.fileIntact ? "actual" : "default";
}

/** Marks a node's Smart Link as opened — idempotent, called on mount by
    app/p/[token]/page.tsx. Never overwrites an existing timestamp; the
    FIRST open is what "opened" means. */
export function markLinkOpened(workspaceId: string, id: string): PrecursorSupplier | null {
  const s = getSupplier(workspaceId, id);
  if (!s || s.smartLinkOpenedAt) return s;
  return saveSupplier({ ...s, smartLinkOpenedAt: new Date().toISOString() });
}

/** Marks a node's Smart Link as submitted. Idempotent in the sense that a
    re-submission just re-stamps the time — a supplier correcting an earlier
    answer within the same period is still "submitted", not "re-invited". */
export function markLinkSubmitted(workspaceId: string, id: string): PrecursorSupplier | null {
  const s = getSupplier(workspaceId, id);
  if (!s) return null;
  return saveSupplier({ ...s, smartLinkSubmittedAt: new Date().toISOString() });
}

/* ── Required-field gates ────────────────────────────────────────
   One place that decides what a precursor row needs before it can be
   submitted, so the Precursors page (exporter, continuous autosave) and the
   /p/<token> supplier form (one-shot submit) read the SAME list rather than
   inventing their own idea of "complete". Every check here is a POSITIVE
   test — "is this thing there" — so a bug that forgets to add a check fails
   OPEN (nothing blocks) rather than a bug that inverts one failing closed by
   accident; the caller side of that trade is that `gaps.length > 0` is what
   disables Submit, never a separate "isValid" flag that could drift from
   this list. */

/** What the row itself needs, regardless of which surface is filling it in
    — the fields §4 of the prompt pack names for "the precursor pages",
    scoped to whichever of the two origins is actually selected. Scrap and
    EU/exempt rows are excused from the SEE and reporting-period checks:
    §A.1 of the Annex gives them nothing to report there. */
export type RequirementScope = "row" | "submission";

/** One thing this row is required to answer, and whether it has. */
export type PrecursorRequirement = {
  /** stable, so a UI can key on it without matching prose */
  key: string;
  /** the same sentence the gap lists have always shown */
  label: string;
  met: boolean;
};

/* ── EVERY REQUIREMENT, IN ORDER, WITH WHETHER IT IS MET ────────
   The one place the rules live. Both gap lists below are this list filtered
   to the unmet ones, and the completeness meter in Enter verified data is
   this list COUNTED — which is the whole reason it exists: a list of what is
   missing cannot answer "how far through am I", because it never knew the
   denominator.

   THE SET OF REQUIREMENTS IS CONDITIONAL ON THE ROW, and deliberately so. A
   scrap input is not missing an emissions figure — it does not have one, and
   counting it as an unanswered question would leave a correctly-finished
   scrap row reading 90%. Same for an EU-origin precursor and the whole
   verification package. So the denominator moves with the row, and a row
   that is genuinely finished always reads 100%.

   `scope`:
     · "row"        — what the chain needs to carry this figure at all.
     · "submission" — the above plus the full verification package, which is
                      what the /p/<token> form and Enter verified data are
                      for. Not conditional on dataOrigin: a submission
                      through those forms is required to bring it, or to be
                      scrap / EU-exempt, which need none of it. */
export function precursorRequirements(s: PrecursorSupplier, scope: RequirementScope = "row"): PrecursorRequirement[] {
  /* A row whose basis has been chosen is asked exactly what the registry says
     (lib/cbam/precursor-fields.ts) — Annex IV items 22/23/28/35 — and nothing
     more. The older, longer list below stays for rows that predate it. */
  if (s.valueBasis) {
    const attached = { report: Boolean(s.verificationReportFileId) };
    const reqs = fieldStatuses(s, attached)
      .filter((x) => x.field.need === "required")
      .map((x) => ({ key: x.field.key, label: `${x.field.label} is required.`, met: x.answered }));
    if (s.valueBasis === "actual" && s.verifierReasonableAssurance === false) {
      reqs.push({ key: "assurance", label: "The verification statement must conclude with reasonable assurance.", met: false });
    }
    return reqs;
  }
  const out: PrecursorRequirement[] = [];
  const need = (key: string, label: string, met: boolean) => out.push({ key, label, met: Boolean(met) });

  need("name", "Company name is required.", s.name.trim() !== "");
  need("identity", "What this precursor is — a name or a CN code — is required.", s.precursorName.trim() !== "" || s.cnCode.trim() !== "");
  need("route", "Production route is required.", s.productionRoute.trim() !== "");

  if (s.origin === "same_installation") {
    need("process", "Which of your own production processes made this is required.", Boolean(s.sourceProcessId?.trim()));
  } else {
    need("installation", "The producing installation's name is required.", s.installationName.trim() !== "");
    need("country", "Country of origin is required.", s.country.trim() !== "");
  }

  const exempt = s.origin === "purchased" && isEuOrExempt(s.country);
  if (!s.isScrap && !exempt) {
    const hasSee = s.specificEmbeddedDirectTco2PerT != null || s.specificEmbeddedIndirectTco2PerT != null || s.seeTco2ePerT != null;
    need("see", "Specific embedded emissions — direct and indirect — are required.", hasSee);
    if (s.origin === "purchased") {
      need("period", "The producing installation's reporting period is required.", Boolean(s.reportingPeriodStart && s.reportingPeriodEnd));
    }
  }

  const hasQuantity = totalTonnes(s) > 0 || (s.qtyPerTonneOverride != null && s.qtyPerTonneOverride > 0);
  need("quantity", "A quantity — monthly tonnage or a per-tonne ratio — is required.", hasQuantity);

  if (scope === "submission") {
    /* WHERE the installation is, not just what it is called. The row-level
       gate is satisfied by a name, because a name is enough to carry a
       figure through the chain; a SUBMISSION is the thing a verifier scopes
       to a plant, and a plant it cannot be sent to is not identified. These
       are the fields the supplier's own form marks required — same rules,
       one place, so the form and the gate cannot disagree. */
    if (s.origin === "purchased") {
      need("installationRef", "The installation reference is required.", Boolean(s.installationUniqueId?.trim()));
      need("unlocode", "UN/LOCODE is required.", Boolean(s.unlocode?.trim()));
      need("address", "The installation's full address is required.", Boolean(s.fullAddress?.trim()));
      need("coordinates", "The installation's latitude and longitude are required.", s.latitude != null && s.longitude != null);
    }

    const noVerificationNeeded = s.isScrap || (s.origin === "purchased" && isEuOrExempt(s.country));
    if (!noVerificationNeeded) {
      need("report", "The verification report (PDF) is required.", Boolean(s.verificationReportFileId));
      need("verifier", "Verifier name is required.", Boolean(s.verifierName?.trim()));
      need("accreditation", "Verifier accreditation number is required.", Boolean(s.verifierAccreditationNumber?.trim()));
      need("accreditationCountry", "Accreditation issuing country is required.", Boolean(s.verifierAccreditationIssuingCountry?.trim()));
      need("accreditationExpiry", "Accreditation expiry date is required.", Boolean(s.verifierAccreditationExpiryDate));
      need("issueDate", "Report issue date is required.", Boolean(s.verificationReportIssueDate));
      need("sectoralScope", "Sectoral scope is required.", Boolean(s.verificationSectoralScope?.trim()));
    }
  }

  return out;
}

const unmet = (reqs: PrecursorRequirement[]): string[] => reqs.filter((r) => !r.met).map((r) => r.label);

/** The row-level gate — what the chain needs before this figure can be
    carried at all. Unchanged in behaviour and wording; it is now a filter
    over `precursorRequirements` rather than a second copy of the rules. */
export function supplierPrecursorGaps(s: PrecursorSupplier): string[] {
  return unmet(precursorRequirements(s, "row"));
}

/** The /p/<token> supplier form's own gate, and Enter verified data's — the
    row-level requirements plus the full verification package. See
    `precursorRequirements` for why the package is not conditional on
    `dataOrigin`. */
export function precursorSubmissionGaps(s: PrecursorSupplier): string[] {
  return unmet(precursorRequirements(s, "submission"));
}

/** HOW FAR THROUGH THIS ROW IS, as a fraction of what it actually has to
    answer. Read by the completeness meter at the top of Enter verified data,
    so somebody filling a long form can see it moving rather than only
    learning at the end which boxes are still empty. */
export type PrecursorCompleteness = {
  answered: number;
  total: number;
  /** 0-100, rounded. 100 exactly when nothing is outstanding. */
  percent: number;
  requirements: PrecursorRequirement[];
  outstanding: string[];
};

export function precursorCompleteness(s: PrecursorSupplier, scope: RequirementScope = "submission"): PrecursorCompleteness {
  const requirements = precursorRequirements(s, scope);
  const answered = requirements.filter((r) => r.met).length;
  const total = requirements.length;
  return {
    answered,
    total,
    // Never round 100% up from an unfinished row: 16/17 is 94.1, which
    // rounds to 94, but a scheme with more requirements could round a single
    // outstanding item away entirely and show a finished-looking 100.
    percent: total === 0 ? 100 : answered === total ? 100 : Math.min(99, Math.round((answered / total) * 100)),
    requirements,
    outstanding: unmet(requirements),
  };
}

/* ── The device-local "account" flag ──────────────────────────────
   Set by app/p/[token]/page.tsx's "Save on this device" screen after a
   precursor supplier submits — explicitly NOT a real account (no password,
   no server session, see that page's own copy). Widget K's stickiness
   metric ("X of Y precursor suppliers have a Certrace account") and the
   conversion-funnel prompt both read this same flag, keyed the same way it
   is written: by installationUniqueId, falling back to unlocode, so a
   supplier is matched by their installation's stable identity rather than
   by name. */
const ACCOUNT_KEY = "certrace:precursor-supplier-account";

function accountKeyFor(s: Pick<PrecursorSupplier, "installationUniqueId" | "unlocode" | "id">): string {
  return s.installationUniqueId || s.unlocode || s.id;
}

export function hasCertraceAccount(s: Pick<PrecursorSupplier, "installationUniqueId" | "unlocode" | "id">): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw) as { installationId: string; createdAt: string }[];
    return list.some((r) => r.installationId === accountKeyFor(s));
  } catch {
    return false;
  }
}

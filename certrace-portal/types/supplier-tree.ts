/* ════════════════════════════════════════════════════════════
   THE SUPPLIER AND PRECURSOR TREE — one shape, two kinds of node

   Not a new store. Every node here is a VIEW onto something that already
   exists: Tier 1 is the installation one VerificationWorkspace names, and IS
   that workspace; Tier 2+ is the existing PrecursorSupplier chain
   (lib/precursor-suppliers.ts's SupplierNode), walked exactly as it already
   is for the Precursors tab. There is no product tier — a chain belongs to
   one product, so the product is the page rather than a node. See
   lib/supplier-tree.ts for the read-time composition.
   ════════════════════════════════════════════════════════════ */

export type TreeNodeKind = "installation" | "precursor";

/** Mirrors the six-state `LinkStatus` (lib/precursor-suppliers.ts) and
    workspace readiness down to the five states the tree actually renders a
    pill for — "blocked" covers both a failed verification check and a
    workspace with a blocked readiness tab. */
export type TrackingStatus =
  | "not_sent"
  | "invited"
  | "in_progress"
  | "ready"
  | "blocked";

/** The Foundation Pack's node-status vocabulary — computed live by
    computeNodeStatus() (lib/supplier-tree.ts), never stored. `BLOCKED`
    covers a failed verification check or a blocked workspace readiness tab
    (kept as a real, distinct state rather than folded into
    VERIFICATION_EXPIRED — a report that failed its checks and a report that
    simply lapsed are different findings, and collapsing them loses that). */
export type NodeStatus =
  | "NOT_SENT"
  | "SENT_PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED_PENDING_VERIFICATION"
  | "VERIFIED"
  | "VERIFICATION_EXPIRED"
  | "BLOCKED";

/** A precursor row's mass-consumed / output-produced ratio — see
    lib/precursor-suppliers.ts's qtyPerTonneOverride and monthlyQuantities.
    Never defaulted to 1:1: null means the ratio genuinely isn't on file yet,
    not that it's assumed equal. */
export type PrecursorRatio = {
  precursorMassConsumed: number;
  outputMassProduced: number;
};

export interface TreeNode {
  /** stable id of the underlying record — a synthetic `installation:<id>`
      for the tier-1 root, the PrecursorSupplier id for tier 2+ */
  id: string;
  kind: TreeNodeKind;
  /** the id of this node's own parent in the tree — null only for the
      tier-1 installation root(s). Added alongside `children` (not instead
      of it) because §2's cycle check walks UP from a candidate parent to
      the root, which `children` alone cannot do. */
  parentNodeId: string | null;
  /** 1 = the installation the product is made at, 2 = a direct precursor
      input, 3+ = nested precursor */
  tier: number;
  /** tier 1 has no role of its own; tier 2+ is always "precursor" — derived
      from `kind`, kept alongside it because the Foundation Pack's own
      vocabulary names this field `role`. */
  role?: "product" | "precursor";
  /** tier 2+ only — the identity §2's wouldCreateCycle() blocks on:
      PrecursorSupplier.installationUniqueId when set, else a normalised
      name|installationName|country composite. Two rows with the same
      cnCode but a different entityId are a different real-world supplier
      and must never be treated as the same node for cycle purposes. */
  entityId?: string;
  name: string;
  cnCode?: string;
  supplierId?: string;
  hasVerificationReport: boolean;
  verificationReportFileId?: string | null;
  /** tier 2+ only — true when this row was submitted AND its four-check
      verification gate failed. Read directly off the checks that were left
      behind, not off `trackingStatus`/`linkStatus()`: `saveSupplier()`
      downgrades `dataOrigin` away from "supplier_verified" in the same
      write a check fails, so `linkStatus()` itself can never actually
      observe "submitted_failed_validation" afterwards (see
      lib/cbam/precursor-risk.ts's own comment on this, which this field
      mirrors the same workaround from). */
  verificationFailed?: boolean;
  trackingStatus?: TrackingStatus;
  /** true when the precursor chain beneath this node could not be walked —
      a cycle was detected. Children is left empty; the page surfaces the
      underlying error message (the same one lib/readiness.ts already
      blocks the Precursors readiness tab on). */
  cyclicReference?: boolean;
  /** which workspace this node's chain belongs to — set on EVERY node,
      including the tier-1 root, which is that workspace. */
  workspaceId?: string;
  /** tier-1 only: whether this product is made at the exporter's own
      installation (no invite needed — they enter their own data directly) or
      a third-party producer's (Button 1 invites them). */
  selfSupplied?: boolean;
  /** tier 2+ Smart Link lifecycle timestamps — the raw facts
      computeNodeStatus() derives its answer from, surfaced here because the
      collapsed trackingStatus/linkStatus enums alone can't answer "when". */
  sentAt?: string | null;
  submittedAt?: string | null;
  /** when the underlying verification report was confirmed valid, and when
      it needs renewing — see PrecursorSupplier.verificationReportExpiresAt.
      Both null until the (not-yet-built) "Enter Verified Data" flow sets
      them; a node can be `hasVerificationReport` without either being set
      yet, which is exactly why VERIFICATION_EXPIRED cannot be computed for
      every historical row today. */
  verifiedAt?: string | null;
  expiresAt?: string | null;
  /** tCO2e per functional unit. A leaf's own PrecursorSupplier.seeTco2ePerT,
      null when not yet declared — but a node WITH children instead carries
      effectiveSee(node): the same weighted roll-up of its own children that
      precursorContribution() uses for the real, compliance-facing figure, so
      an upper tier shows what its chain resolves to rather than reading as
      blank the moment it has any precursor of its own. */
  see?: number | null;
  /** No unit field exists on PrecursorSupplier yet — every value in this
      codebase today is per tonne, so this is a constant until a real
      functional-unit field is added (Section 7 of the pack, deferred). */
  functionalUnit?: "tonne" | "kg_nitrogen" | "tonne_clinker";
  /** Sintered Ore only — carried forward so a parent's roll-up doesn't drop
      it just because the parent's own category doesn't track indirect
      emissions independently. No source field exists yet (Section 7.3,
      deferred), so this is always null today. */
  indirectEmissionsSee?: number | null;
  /** the mass ratio this precursor was linked to its parent with — see
      `PrecursorRatio`'s own note on why 1:1 is never assumed. Null for the
      tier-1 root and for any tier-2+ row with no ratio on file yet. */
  quantityRatio?: PrecursorRatio | null;
  children: TreeNode[];
}

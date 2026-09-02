/* ════════════════════════════════════════════════════════════
   SUPPLIER AND PRECURSOR TREE — built at read time, from what already exists

   A CHAIN BELONGS TO ONE PRODUCT. The root is the installation that MAKES
   that product — the exporter's own site, or the supplier's — and every tier
   of precursor hangs directly beneath it. Tier 2+ (Precursor) is the existing
   precursor chain (treeFor, lib/precursor-suppliers.ts), walked exactly as
   the Precursors tab already walks it — same cycle detection, same depth,
   same everything.

   THERE IS NO PRODUCT TIER, AND NO SIBLING PRODUCT. The root used to be a
   GROUPING of every workspace sharing an installationId, each carrying its
   own chain underneath. That answers "what is made at this plant", which is
   a question about the estate — and it made the chain the reader actually
   asked for one branch among several. A product is the same level as its
   supply chain, not a row inside it: the product's name and CN code are the
   chain page's own identity, and what the page LISTS is the chain.

   This is why there is no new store here: every fact the tree shows already
   lives in lib/workspace.ts or lib/precursor-suppliers.ts, and a workspace's
   own readiness/sign-off already answers "does this need chasing". Building
   a second, standalone Installation → Product registry would be a bigger
   change than the tree needs, and it would immediately disagree with the
   workspace it was describing the moment either one was edited.
   ════════════════════════════════════════════════════════════ */

import { workspaceReadiness } from "./readiness";
import { effectiveSee, getSupplier, isVerificationExpired, linkStatus, listSuppliers, totalTonnes, treeFor, MAX_SUPPLIER_DEPTH, PrecursorSupplierError, type PrecursorSupplier, type SupplierNode } from "./precursor-suppliers";
import { annualProductionFor } from "./monthly-data";
import { getWorkspace, type VerificationWorkspace } from "./workspace";
import type { NodeStatus, PrecursorRatio, TrackingStatus, TreeNode } from "@/types/supplier-tree";

/** Entity identity for cycle detection (lib/cbam/tree-validation.ts) and for
    `TreeNode.entityId` — the real-world supplier/installation a precursor
    row names, as distinct from the row's own id. `PrecursorSupplier` has no
    single canonical FK to an installation record for third-party suppliers
    (unlike the exporter's own site, which uses lib/installations.ts), so
    this falls back to a normalised name/installation/country composite when
    `installationUniqueId` isn't set. Exported so the tree builder and the
    cycle check can never compute this two different ways. */
export function precursorEntityId(s: Pick<PrecursorSupplier, "installationUniqueId" | "name" | "installationName" | "country">): string {
  const id = s.installationUniqueId?.trim();
  if (id) return `id:${id.toLowerCase()}`;
  return `composite:${[s.name, s.installationName, s.country].map((v) => (v || "").trim().toLowerCase()).join("|")}`;
}

/** THE canonical node-status derivation — Foundation Pack Section A. Pure
    function of a TreeNode's own fields; never reads or writes a stored
    "status" property anywhere. UI components must call this rather than
    reading `trackingStatus` directly, which stays on the type only because
    `computeNodeStatus` itself is built from it for the installation root. */
export function computeNodeStatus(node: TreeNode): NodeStatus {
  if (node.cyclicReference || node.trackingStatus === "blocked") return "BLOCKED";

  if (node.kind === "precursor") {
    if (node.verificationFailed) return "BLOCKED";
    if (!node.sentAt) return "NOT_SENT";
    // "Verified" means passed the app's real four-check verification gate
    // (dataOrigin === "supplier_verified" AND every check in
    // linkStatus()/trackingStatusForPrecursor passed — trackingStatus
    // "ready" is exactly that) — NOT merely "a file id is attached".
    // hasVerificationReport/verificationReportFileId only says a document
    // exists; a supplier can attach a file and still be sitting on an
    // unverified claim, which must read as SUBMITTED_PENDING_VERIFICATION,
    // not VERIFIED.
    if (node.trackingStatus === "ready") {
      // isVerificationExpired (lib/precursor-suppliers.ts) is the ONE place
      // this comparison is made — LinkStatusChip on the Precursors tab calls
      // the same function, so the two screens can't drift on what "expired"
      // means the way they briefly did before this was extracted.
      return isVerificationExpired(node.expiresAt) ? "VERIFICATION_EXPIRED" : "VERIFIED";
    }
    if (node.submittedAt) return "SUBMITTED_PENDING_VERIFICATION";
    return node.trackingStatus === "in_progress" ? "IN_PROGRESS" : "SENT_PENDING";
  }

  // The tier-1 installation root: no per-node Smart Link timeline to derive
  // SENT_PENDING/IN_PROGRESS from directly, so this maps the
  // workspace-readiness-derived trackingStatus onto the nearest equivalent
  // state instead.
  switch (node.trackingStatus) {
    case "invited":
      return "SENT_PENDING";
    case "in_progress":
      return "IN_PROGRESS";
    case "ready":
      return node.hasVerificationReport ? "VERIFIED" : "SUBMITTED_PENDING_VERIFICATION";
    case "not_sent":
    default:
      return "NOT_SENT";
  }
}

function trackingStatusForWorkspace(ws: VerificationWorkspace): TrackingStatus {
  const r = workspaceReadiness(ws);
  if (r.overall === "blocked") return "blocked";
  if (r.overall === "complete") return "ready";
  return r.percentComplete > 0 ? "in_progress" : "not_sent";
}

function trackingStatusForPrecursor(node: SupplierNode): TrackingStatus {
  switch (linkStatus(node)) {
    case "not_invited":
      return "not_sent";
    case "invited_not_opened":
      return "invited";
    case "opened_in_progress":
    case "submitted_pending_validation":
      return "in_progress";
    case "submitted_verified":
      return "ready";
    case "submitted_failed_validation":
      return "blocked";
  }
}

function mapPrecursorNode(node: SupplierNode, workspaceId: string, parentNodeId: string | null, parentTonnes: number | null): TreeNode {
  const own = totalTonnes(node);
  // Never assumed 1:1 — null unless both this row's own consumed tonnage and
  // its parent's produced tonnage are actually on file. See PrecursorRatio's
  // own note (types/supplier-tree.ts) for why.
  const quantityRatio: PrecursorRatio | null =
    own > 0 && parentTonnes != null && parentTonnes > 0 ? { precursorMassConsumed: own, outputMassProduced: parentTonnes } : null;

  return {
    id: node.id,
    kind: "precursor",
    parentNodeId,
    // treeFor's depth starts at 1 for a direct input — tier 2 here, since
    // tier 1 is the installation the product is made at and there is no
    // product tier between them.
    tier: node.depth + 1,
    role: "precursor",
    entityId: precursorEntityId(node),
    name: node.name || node.precursorName || "Unnamed precursor",
    cnCode: node.cnCode || undefined,
    hasVerificationReport: Boolean(node.verificationReportFileId),
    verificationReportFileId: node.verificationReportFileId ?? null,
    // See the field's own comment (types/supplier-tree.ts) — read directly
    // off the checks left behind, since saveSupplier's mandatory fallback
    // makes trackingStatus/linkStatus() blind to this the moment it happens.
    verificationFailed: Boolean(
      node.smartLinkSubmittedAt &&
        node.verificationChecks &&
        !(node.verificationChecks.accreditationValid && node.verificationChecks.sectoralScopeMatch && node.verificationChecks.periodCovered && node.verificationChecks.fileIntact),
    ),
    trackingStatus: trackingStatusForPrecursor(node),
    workspaceId,
    sentAt: node.smartLinkSentAt ?? null,
    submittedAt: node.smartLinkSubmittedAt ?? null,
    // Issue date, not the verifier's accreditation expiry — see
    // PrecursorSupplier.verificationReportIssueDate's own comment on why
    // those are two different dates answering two different questions.
    verifiedAt: node.verificationReportIssueDate ?? null,
    expiresAt: node.verificationReportExpiresAt ?? null,
    // A LEAF's own declared figure, unchanged — but a node WITH children
    // never has its own seeTco2ePerT (that field is only ever meaningful on
    // a leaf; see effectiveSee's own comment), so showing it directly left
    // every parent tier blank even once every child under it was fully
    // priced. effectiveSee() is the exact function precursorContribution()
    // already uses for the real, compliance-facing number — reused here so
    // the Tree shows the same rolled-up figure at every tier, not a second
    // calculation that could disagree with it.
    see: node.children.length > 0 ? effectiveSee(node) : node.seeTco2ePerT,
    functionalUnit: "tonne",
    indirectEmissionsSee: null,
    quantityRatio,
    children: node.children.map((c) => mapPrecursorNode(c, workspaceId, node.id, own > 0 ? own : null)),
  };
}

/** The chain of ONE product, as a single-root forest.

    The root is the installation the product is made at — the exporter's own
    site, or the supplier's — and it IS the product's workspace: its months,
    its readiness and its settings are the ones held at that site for this
    good, which is why `workspaceId` is set on it and why entityWorkspaceId()
    (lib/tree-entity.ts) hands its four tabs the real routes rather than four
    locks. Every tier of precursor hangs directly under it.

    Returns [] if the workspace does not exist. */
export function buildSupplierPrecursorTree(workspaceId: string): TreeNode[] {
  const ws = getWorkspace(workspaceId);
  if (!ws) return [];

  const rootId = `installation:${ws.installationId}`;
  let children: TreeNode[] = [];
  let cyclicReference = false;
  const annual = annualProductionFor(ws).tonnes;
  try {
    children = treeFor(ws.id).map((n) => mapPrecursorNode(n, ws.id, rootId, annual > 0 ? annual : null));
  } catch (e) {
    // A cycle stops the WHOLE chain from being walked (see treeFor's own
    // comment on why an unreached row still has to raise) — so the node it is
    // flagged against is the root, the nearest ancestor the walk could
    // actually reach. The underlying message is the same one lib/readiness.ts
    // already blocks the Precursors readiness tab on.
    cyclicReference = e instanceof PrecursorSupplierError;
    if (!cyclicReference) throw e;
  }

  const installation: TreeNode = {
    id: rootId,
    kind: "installation",
    parentNodeId: null,
    tier: 1,
    name: ws.installationName,
    // The good made here, on the node that makes it. The chain page's own
    // identity bar carries the product name; this is what keeps the ROW
    // unambiguous once it is read on its own — in the sidebar, or on its
    // entity page.
    cnCode: ws.cnCode || undefined,
    // A verifier having signed the workspace off is the closest existing fact
    // to "a verification report exists for this product" — nothing else in
    // the data model records that a report was received for an entire
    // workspace rather than for one figure inside it.
    hasVerificationReport: Boolean(ws.verifierSignoff),
    verificationReportFileId: null,
    trackingStatus: trackingStatusForWorkspace(ws),
    cyclicReference,
    workspaceId: ws.id,
    // Whether the exporter enters this month's readings themselves or has to
    // ask the plant that made it — the one fact that decides who is chased.
    selfSupplied: Boolean(ws.selfSupplied),
    supplierId: ws.supplierId,
    quantityRatio: null,
    children,
  };

  return [installation];
}

/** Same TreeNode shape as buildSupplierPrecursorTree's precursor tiers, but
    rooted at one arbitrary PrecursorSupplier row instead of a workspace —
    for /p/<token>, which must show only this node and what hangs beneath
    it, never siblings, ancestors, or an unrelated branch's problems.

    Deliberately does NOT reuse treeFor(): that walk is workspace-wide and
    THROWS on any cycle anywhere in the workspace, including a chain this
    supplier has nothing to do with — a problem elsewhere in the same
    workspace must never break this supplier's own page. This walk is local
    to the subtree and fails soft: a cycle or over-depth branch simply stops
    descending rather than raising, since there is nothing a supplier could
    do about a chain that isn't theirs anyway.

    Returns null if rootNodeId doesn't exist. */
export function buildPrecursorSubtree(workspaceId: string, rootNodeId: string): TreeNode | null {
  const root = getSupplier(workspaceId, rootNodeId);
  if (!root) return null;

  const byParent = new Map<string, PrecursorSupplier[]>();
  for (const r of listSuppliers(workspaceId)) {
    if (!r.parentId) continue;
    byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), r]);
  }

  const build = (row: PrecursorSupplier, depth: number, ancestry: Set<string>): SupplierNode => {
    const next = new Set(ancestry).add(row.id);
    const kids = depth >= MAX_SUPPLIER_DEPTH ? [] : (byParent.get(row.id) ?? []).filter((c) => !ancestry.has(c.id));
    return { ...row, depth, children: kids.map((c) => build(c, depth + 1, next)) };
  };

  const rootNode = build(root, 1, new Set());
  return mapPrecursorNode(rootNode, workspaceId, null, null);
}

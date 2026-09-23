/* ════════════════════════════════════════════════════════════
   WORKSPACES AS QUERIES — same shape as lib/declarations-query.ts

   Today the data under these hooks is localStorage (lib/workspace.ts,
   lib/workspace-drafts.ts); the day a backend endpoint exists, the swap
   happens inside the store modules and no screen moves. What the hooks buy
   NOW is one cache with real identity: archive a workspace in the menu and
   every list, count and dashboard stat refetches itself — no hand-wired
   refresh callbacks threading through props.

   staleTime 0 (overriding the provider's 30s): a localStorage read costs
   nothing, and flows that still write outside these mutations (workspace
   settings, monthly tabs) must be picked up the moment a list remounts.
   ════════════════════════════════════════════════════════════ */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TreeNode } from "@/types/supplier-tree";
import { getOrgIdentity } from "./org";
import { cnCodeCap, seatCap, siteCap, yearCap } from "./plan";
import { buildSupplierPrecursorTree, computeNodeStatus } from "./supplier-tree";
import { findChainNode, trackedParentOf } from "./tree-entity";
import {
  archiveWorkspace,
  createWorkspace,
  getWorkspace,
  knownInstallations,
  listArchivedWorkspaces,
  listWorkspaces,
  restoreWorkspace,
  updateWorkspace,
  type NewWorkspaceInput,
  type VerificationWorkspace,
} from "./workspace";
import { resolveWorkspaceRequest } from "./workspace-link";
import { apiConfigured } from "./api/config";
import { isServerToken, openWorkspaceLink } from "./workspace-link-sync";
import {
  deleteWorkspaceDraft,
  loadWorkspaceDrafts,
  saveWorkspaceDraft,
  type WorkspaceDraft,
} from "./workspace-drafts";

const KEY = ["workspaces"] as const;
const DRAFTS_KEY = ["workspace-drafts"] as const;

export function useWorkspaces() {
  return useQuery({ queryKey: [...KEY, "active"], queryFn: listWorkspaces, staleTime: 0 });
}

export function useArchivedWorkspaces() {
  return useQuery({ queryKey: [...KEY, "archived"], queryFn: listArchivedWorkspaces, staleTime: 0 });
}

export function useWorkspace(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => getWorkspace(id ?? ""),
    enabled: Boolean(id),
    staleTime: 0,
  });
}

/* ── Reads derived from the workspace list ─────────────────────
   Everything below is computed FROM workspaces (plus the supplier and
   installation stores), so it lives under KEY: the mutations above and
   useInvalidateWorkspaces already refresh it, no second escape hatch. */

export function useTrackedParent(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "tracked-parent", id],
    queryFn: () => trackedParentOf(id ?? ""),
    enabled: Boolean(id),
    staleTime: 0,
  });
}

export type ChainCounts = { suppliers: number; tiers: number; blocked: number; verified: number };

/* Derived with computeNodeStatus() — the same function the node pills use —
   so a "1 blocked" here is always the one red pill below. The root
   installation is the exporter's own place in the chain, not somebody they
   chase, so it never counts as a supplier; `tiers` is how far the
   precursors reach below it. */
function chainCounts(roots: TreeNode[]): ChainCounts {
  let suppliers = 0;
  let tiers = 0;
  let blocked = 0;
  let verified = 0;
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      const s = computeNodeStatus(n);
      if (s === "BLOCKED") blocked += 1;
      if (s === "VERIFIED") verified += 1;
      if (n.kind === "precursor") {
        suppliers += 1;
        tiers = Math.max(tiers, n.tier - 1);
      }
      walk(n.children);
    }
  };
  walk(roots);
  return { suppliers, tiers, blocked, verified };
}

export function useChainCounts(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "chain", id, "counts"],
    queryFn: () => chainCounts(buildSupplierPrecursorTree(id ?? "")),
    enabled: Boolean(id),
    staleTime: 0,
  });
}

/** `segment` is the URL entity segment findChainNode resolves — the
    INSTALLATION_SEGMENT constant or a precursor node id. */
export function useChainNode(id: string | undefined, segment: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "chain", id, "node", segment],
    queryFn: () => findChainNode(id ?? "", segment ?? ""),
    enabled: Boolean(id) && Boolean(segment),
    staleTime: 0,
  });
}

/** Seats use the fixture default — the team screen keeps its live list in
    React state and passes seatCap(used) itself (see lib/plan.ts). */
export function useCaps() {
  return useQuery({
    queryKey: [...KEY, "caps"],
    queryFn: () => ({ cnCodes: cnCodeCap(), sites: siteCap(), years: yearCap(), seats: seatCap() }),
    staleTime: 0,
  });
}

/** Re-measure only the plan caps — the caps read a localStorage plan override
    that changes outside any workspace mutation (a plan switch, the trial
    re-read). Scoped so it does not nuke the whole ["workspaces"] prefix. */
export function useInvalidateCaps(): () => void {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: [...KEY, "caps"] });
}

export function useWorkspaceRequest(token: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "request", token],
    /* A server-issued token loads the workspace slice into this browser
       first (lib/workspace-link-sync.ts); a legacy base64 one resolves from
       what is already here, as it always has. */
    queryFn: () =>
      apiConfigured() && isServerToken(token ?? "") ? openWorkspaceLink(token ?? "") : resolveWorkspaceRequest(token ?? ""),
    enabled: Boolean(token),
    staleTime: 0,
  });
}

/* ── Organisation identity ─────────────────────────────────────
   Not workspace data: read from the profile store (lib/org.ts), written
   out-of-band by lib/profile.tsx — hence its own key and escape hatch. */

const ORG_KEY = ["org"] as const;

export function useOrgIdentity() {
  return useQuery({ queryKey: [...ORG_KEY, "identity"], queryFn: getOrgIdentity, staleTime: 0 });
}

export function useInvalidateOrgIdentity(): () => void {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: ORG_KEY });
}

export function useKnownInstallations() {
  return useQuery({
    queryKey: ["installations", "known"],
    queryFn: () => knownInstallations(),
    staleTime: 0,
  });
}

/** For the places that mutate outside these hooks (legacy flows) but still
    need every list to notice — same signature as the old refresh callbacks. */
export function useInvalidateWorkspaces(): () => void {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: KEY });
}

export function useCreateWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWorkspaceInput) => Promise.resolve(createWorkspace(input)),
    onSuccess: () => void client.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<VerificationWorkspace> }) =>
      Promise.resolve(updateWorkspace(id, patch)),
    onSuccess: () => void client.invalidateQueries({ queryKey: KEY }),
  });
}

export function useArchiveWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(archiveWorkspace(id)),
    onSuccess: () => void client.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRestoreWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(restoreWorkspace(id)),
    onSuccess: () => void client.invalidateQueries({ queryKey: KEY }),
  });
}

/* ── New-workspace wizard drafts ───────────────────────────── */

export function useWorkspaceDrafts() {
  return useQuery({ queryKey: DRAFTS_KEY, queryFn: loadWorkspaceDrafts, staleTime: 0 });
}

export function useSaveWorkspaceDraft() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (draft: WorkspaceDraft) => Promise.resolve(saveWorkspaceDraft(draft)),
    onSuccess: () => void client.invalidateQueries({ queryKey: DRAFTS_KEY }),
  });
}

export function useDeleteWorkspaceDraft() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(deleteWorkspaceDraft(id)),
    onSuccess: () => void client.invalidateQueries({ queryKey: DRAFTS_KEY }),
  });
}

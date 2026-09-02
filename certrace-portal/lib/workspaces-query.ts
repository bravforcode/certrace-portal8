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
import {
  archiveWorkspace,
  createWorkspace,
  knownInstallations,
  listArchivedWorkspaces,
  listWorkspaces,
  restoreWorkspace,
  updateWorkspace,
  type NewWorkspaceInput,
  type VerificationWorkspace,
} from "./workspace";
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

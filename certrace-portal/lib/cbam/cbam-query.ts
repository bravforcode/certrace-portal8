/* ════════════════════════════════════════════════════════════
   CBAM DECLARATION STATE AS QUERIES — same shape as lib/workspaces-query.ts

   One cache for everything hanging off a declaration: activity data, gaps,
   the frozen snapshot, the MMD, the boundary, evidence, the exporter review
   state. Keys are ["cbam", declId, subkey], so a mutation invalidates the
   declaration's whole subtree and every dependent screen refetches itself.

   staleTime 0 (overriding the provider's 30s): these stores are localStorage,
   a read costs nothing, and flows that still write around the mutations must
   be picked up the moment a screen remounts — see lib/workspaces-query.ts.
   ════════════════════════════════════════════════════════════ */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ActivityDataset } from "./activity";
import { loadDataset, saveDataset } from "./activity-store";
import type { Boundary, ReportingPeriod } from "./boundary";
import { loadBoundary, saveBoundary } from "./boundary-store";
import { listGaps } from "./data-gaps";
import { listEvidence, addEvidence, removeEvidence, type EvidenceFile } from "./evidence";
import { activeSnapshot } from "./freeze";
import {
  finaliseVersion,
  latestVersion,
  listVersions,
  loadDraft,
  saveDraft,
  type MmdContent,
  type MmdDraft,
} from "./mmd";
import { loadExporterState } from "../exporter-review";

const KEY = ["cbam"] as const;

/* ── Activity data ─────────────────────────────────────────── */

/** Full dataset, production quantity stitched in. `period` comes from the
    declaration, so the query waits until both are known. */
export function useActivityDataset(
  declId: string | undefined,
  period: ReportingPeriod | undefined,
  enteredBy: string,
) {
  return useQuery({
    queryKey: [...KEY, declId, "activity", period, enteredBy],
    // `enabled` guards the assertions
    queryFn: () => loadDataset(declId!, period!, enteredBy),
    enabled: Boolean(declId && period),
    staleTime: 0,
  });
}

export function useSaveActivityDataset() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { dataset: ActivityDataset; confirmedAgainstShippedTonnes?: number }) =>
      Promise.resolve(saveDataset(input.dataset, input.confirmedAgainstShippedTonnes)),
    onSuccess: (saved) =>
      void client.invalidateQueries({ queryKey: [...KEY, saved.declarationId] }),
  });
}

/* ── Data gaps ─────────────────────────────────────────────── */

export function useDataGaps(declId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, declId, "gaps"],
    queryFn: () => listGaps(declId!),
    enabled: Boolean(declId),
    staleTime: 0,
  });
}

/* ── Freeze ────────────────────────────────────────────────── */

/** Latest frozen snapshot; `data` is null before the first freeze. */
export function useActiveSnapshot(declId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, declId, "snapshot"],
    queryFn: () => activeSnapshot(declId!),
    enabled: Boolean(declId),
    staleTime: 0,
  });
}

/* ── MMD ───────────────────────────────────────────────────── */

export function useMmdDraft(declId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, declId, "mmd-draft"],
    queryFn: () => loadDraft(declId!),
    enabled: Boolean(declId),
    staleTime: 0,
  });
}

export function useSaveMmdDraft() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (draft: MmdDraft) => Promise.resolve(saveDraft(draft)),
    onSuccess: (saved) =>
      void client.invalidateQueries({ queryKey: [...KEY, saved.declarationId] }),
  });
}

export function useMmdVersions(declId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, declId, "mmd-versions"],
    queryFn: () => listVersions(declId!),
    enabled: Boolean(declId),
    staleTime: 0,
  });
}

/** Latest finalised MMD; `data` is null before the first finalise. */
export function useLatestMmdVersion(declId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, declId, "mmd-latest"],
    queryFn: () => latestVersion(declId!),
    enabled: Boolean(declId),
    staleTime: 0,
  });
}

export function useFinaliseMmdVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { declarationId: string; content: MmdContent; author: string }) =>
      Promise.resolve(finaliseVersion(input.declarationId, input.content, input.author)),
    onSuccess: (version) =>
      void client.invalidateQueries({ queryKey: [...KEY, version.declarationId] }),
  });
}

/* ── Boundary ──────────────────────────────────────────────── */

export function useBoundary(declId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, declId, "boundary"],
    queryFn: () => loadBoundary(declId!),
    enabled: Boolean(declId),
    staleTime: 0,
  });
}

export function useSaveBoundary() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { boundary: Boundary; updatedBy: string }) =>
      Promise.resolve(saveBoundary(input.boundary, input.updatedBy)),
    onSuccess: (saved) =>
      void client.invalidateQueries({ queryKey: [...KEY, saved.declarationId] }),
  });
}

/* ── Evidence ──────────────────────────────────────────────── */

export function useEvidence(declId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, declId, "evidence"],
    queryFn: () => listEvidence(declId!),
    enabled: Boolean(declId),
    staleTime: 0,
  });
}

export function useAddEvidence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (file: EvidenceFile) => Promise.resolve(addEvidence(file)),
    onSuccess: (_files, file) =>
      void client.invalidateQueries({ queryKey: [...KEY, file.declarationId] }),
  });
}

export function useRemoveEvidence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { declarationId: string; id: string }) =>
      Promise.resolve(removeEvidence(input.declarationId, input.id)),
    onSuccess: (_files, input) =>
      void client.invalidateQueries({ queryKey: [...KEY, input.declarationId] }),
  });
}

/* ── Exporter review state ─────────────────────────────────── */

export function useExporterState(declId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, declId, "exporter"],
    queryFn: () => loadExporterState(declId!),
    enabled: Boolean(declId),
    staleTime: 0,
  });
}

/* ── Escape hatch ──────────────────────────────────────────── */

/** For legacy flows that still write around the mutations (freeze, gap saves,
    exporter-review transitions) — same signature as the old refresh callbacks.
    Without a declId it flushes every declaration's cbam cache. */
export function useInvalidateCbam(declId?: string): () => void {
  const client = useQueryClient();
  return () =>
    void client.invalidateQueries({ queryKey: declId ? [...KEY, declId] : KEY });
}

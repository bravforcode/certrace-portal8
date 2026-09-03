/* Installations as queries — see lib/workspaces-query.ts for why the
   localStorage-backed stores get staleTime 0. Note lib/workspaces-query.ts
   already keys useKnownInstallations under ["installations", "known"]; the
   invalidations here reach it on purpose, since a saved or removed record
   changes what "known" means. */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInstallation,
  installationForWorkspace,
  installationsForSupplier,
  ownInstallations,
  removeInstallation,
  saveInstallation,
  type Installation,
  type WorkspaceInstallationRef,
} from "./installations";

const KEY = ["installations"] as const;

export function useOwnInstallations() {
  return useQuery({ queryKey: [...KEY, "own"], queryFn: ownInstallations, staleTime: 0 });
}

/** One installation by reference; `data` is `null` when the store has never
    seen it. Pass `undefined` while the reference is still loading. */
export function useInstallation(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => getInstallation(id!),
    enabled: Boolean(id),
    staleTime: 0,
  });
}

/** The record a workspace points at — stored copy when it exists, otherwise
    fabricated from the workspace's own fields (never `null`). The whole ref
    is in the key because the fabricated record depends on every field of it. */
export function useInstallationForWorkspace(w: WorkspaceInstallationRef | undefined) {
  return useQuery({
    queryKey: [...KEY, "for-workspace", w ?? null],
    queryFn: () => installationForWorkspace(w!),
    enabled: Boolean(w?.installationId),
    staleTime: 0,
  });
}

export function useInstallationsForSupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "supplier", supplierId],
    queryFn: () => installationsForSupplier(supplierId!),
    enabled: Boolean(supplierId),
    staleTime: 0,
  });
}

/** Upsert by reference — same semantics as `saveInstallation`. */
export function useSaveInstallation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Installation) => Promise.resolve(saveInstallation(input)),
    onSuccess: () => void client.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveInstallation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(removeInstallation(id)),
    onSuccess: () => void client.invalidateQueries({ queryKey: KEY }),
  });
}

/** Same escape hatch as useInvalidateWorkspaces — for legacy flows that
    still write around the mutations. */
export function useInvalidateInstallations(): () => void {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: KEY });
}

"use client";

/* ════════════════════════════════════════════════════════════
   SMART LINK server calls as TanStack Query hooks

   The resolve is a query; the save and submit are mutations. This is where
   API-mode durability lives — no localStorage safety copy. TanStack owns it:

     • a failed autosave is retried (retry: 3),
     • one made offline is PAUSED and resumed when the connection returns
       (networkMode 'online', the default),

   so the only writer is the server. The one residual gap is a tab closed
   inside the 800ms autosave debounce before the mutation ever fires; the
   upgrade path for that is a flush on `pagehide`, not a second store.
   ════════════════════════════════════════════════════════════ */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resolveLink, saveLinkState, submitLink, type LinkResolution, type SubmitInput } from "./api";
import type { SupplierState } from "./supplier-store";

const LINK_KEY = ["smart-link"] as const;
const linkKey = (token: string | undefined) => [...LINK_KEY, token] as const;

/** Resolve a /s/<token> Smart Link. `isPending` → still resolving, `isError`
    → dead/unknown link (a 404/410 is not retried; the global retry only
    re-tries transport failures). */
export function useSmartLink(token: string | undefined) {
  return useQuery<LinkResolution>({
    queryKey: linkKey(token),
    queryFn: () => resolveLink(token ?? ""),
    enabled: Boolean(token),
    /* Resolve ONCE. The resolved state becomes the supplier's live edit buffer
       in the provider, so a background refetch that swaps it mid-edit is worse
       than staleness. Overrides the client's 30s default on purpose. */
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/* Keep the resolve cache in step with what the server just stored, so a
   navigate-away-and-back re-reads the saved answers, not the opening ones. */
function useSyncLinkState(token: string) {
  const client = useQueryClient();
  return (state: SupplierState) =>
    client.setQueryData<LinkResolution>(linkKey(token), (old) => (old ? { ...old, state } : old));
}

/** Autosave the whole state blob, last-write-wins. Retried on transport
    failure; paused (not lost) while offline. */
export function useSaveLinkState(token: string) {
  const sync = useSyncLinkState(token);
  return useMutation({
    mutationFn: (state: SupplierState) => saveLinkState(token, state),
    retry: 3,
    onSuccess: (state) => sync(state),
  });
}

/** Sign & submit. The server owns the version/signer/score it stamps, and
    returns the authoritative state the caller reconciles to. */
export function useSubmitLink(token: string) {
  const sync = useSyncLinkState(token);
  return useMutation({
    mutationFn: (input: SubmitInput) => submitLink(token, input),
    retry: 3,
    onSuccess: (state) => sync(state),
  });
}

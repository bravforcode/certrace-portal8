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
import {
  getSubmissionState,
  listSubmissions,
  requestRevision,
  resolveLink,
  saveLinkState,
  submitLink,
  type LinkResolution,
  type RevisionInput,
  type SubmissionSummary,
  type SubmitInput,
} from "./api";
import type { SupplierState } from "./supplier-store";

const LINK_KEY = ["smart-link"] as const;
const linkKey = (token: string | undefined) => [...LINK_KEY, token] as const;

const SUBMISSIONS_KEY = ["submissions"] as const;
export const submissionsKey = (declId: string | undefined) => [...SUBMISSIONS_KEY, declId] as const;
/* Nested under the declaration's key on purpose — one supplier's answers are
   part of that declaration's cache — which is why anything invalidating the
   feed alone has to say `exact`. */
export const submissionStateKey = (declId: string, token: string | undefined) => [...submissionsKey(declId), token, "state"] as const;

/** The exporter's "who has answered" feed for one declaration.

    A supplier submits from their own machine, so their status change never
    reaches the exporter's localStorage — this poll is how the dashboard learns
    of it. TanStack owns the cadence and the cache: one entry per declaration,
    shared by every component that reads it (dashboard, workflow), so the whole
    screen costs one request per interval instead of one per consumer. */
export function useSubmissions(declId: string | undefined) {
  return useQuery<SubmissionSummary[]>({
    queryKey: submissionsKey(declId),
    queryFn: () => listSubmissions(declId ?? ""),
    enabled: Boolean(declId),
    // Near-real time without a socket: refetch on a timer and on refocus. Only
    // while the tab is visible — a backgrounded dashboard nobody is watching
    // does not need to keep hitting the API.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

/** The full answers behind one submission, for the review pane.

    Lazy on purpose: `enabled` is false until the exporter actually opens a
    submission whose answers aren't in this browser, so the list stays a cheap
    status glance and only the one being read costs a full fetch. Cached per
    token — reopening the same supplier does not refetch. */
export function useSubmissionState(declId: string, token: string | undefined, enabled: boolean) {
  return useQuery<SupplierState>({
    queryKey: submissionStateKey(declId, token),
    queryFn: () => getSubmissionState(declId, token ?? ""),
    enabled: enabled && Boolean(token),
    staleTime: 30_000,
  });
}

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

/** The exporter sends a submission back for changes.

    The supplier's state is the SERVER's — they filled the link on their own
    machine — so the server is what has to flip `status` to
    `revision_requested`, store the unlocked fields and docs, and append the
    trail event. A localStorage write here would reopen the link in the
    exporter's browser and nowhere else, which is exactly the way this loop
    used to break: the supplier reopens their link, the server still says
    `submitted`, and nothing is editable.

    The exporter's own record of the decision stays local — see
    recordRevisionDecision in lib/exporter-review.ts. */
export function useRequestRevision(declId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ token, input }: { token: string; input: RevisionInput }) => requestRevision(declId, token, input),
    onSuccess: (state, { token }) => {
      // The review pane reads the answers through this key, and the server
      // just returned the authoritative state — seed it rather than refetch.
      client.setQueryData<SupplierState>(submissionStateKey(declId, token), state);
      // The status the submissions feed carries is now stale. `exact` because
      // that key is a prefix of the one just seeded.
      client.invalidateQueries({ queryKey: submissionsKey(declId), exact: true });
    },
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

/* ════════════════════════════════════════════════════════════
   DECLARATIONS AS QUERIES — the hooks the screens actually use

   TanStack Query in front of lib/declarations-store.ts (the raw API seam):
   the store knows HOW to fetch, these hooks know WHEN — cache, refetch,
   loading state, and the invalidation that keeps every list honest after a
   create or delete. Screens import from here; nothing outside this file
   touches the query keys.
   ════════════════════════════════════════════════════════════ */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Declaration } from "./data";
import {
  deleteDeclaration,
  getMyDeclaration,
  listMyDeclarations,
  saveDeclaration,
} from "./declarations-store";

const KEY = ["declarations"] as const;

/** The signed-in account's declarations, newest change first. */
export function useDeclarations() {
  return useQuery({ queryKey: KEY, queryFn: listMyDeclarations });
}

/** One declaration; `data` is `null` when it does not exist (or is not
    theirs — the server answers 404 for both on purpose). */
export function useDeclaration(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => getMyDeclaration(id),
  });
}

/** Create-or-overwrite (PUT upserts server-side). Settles the caches itself:
    the detail entry is written through, the list refetched. */
export function useSaveDeclaration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (declaration: Declaration) => saveDeclaration(declaration),
    onSuccess: (saved) => {
      client.setQueryData([...KEY, saved.id], saved);
      void client.invalidateQueries({ queryKey: KEY, exact: true });
    },
  });
}

export function useDeleteDeclaration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDeclaration(id),
    onSuccess: (_result, id) => {
      client.removeQueries({ queryKey: [...KEY, id] });
      void client.invalidateQueries({ queryKey: KEY, exact: true });
    },
  });
}

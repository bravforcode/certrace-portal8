/* Supplier directory as queries — see lib/workspaces-query.ts for why the
   localStorage-backed stores get staleTime 0. */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DirectorySupplier } from "./data";
import { addDirectorySupplier, listDirectory, listSupplierRows } from "./supplier-directory";

const KEY = ["suppliers"] as const;

export function useSupplierRows() {
  return useQuery({ queryKey: [...KEY, "rows"], queryFn: listSupplierRows, staleTime: 0 });
}

export function useSupplierDirectory() {
  return useQuery({ queryKey: [...KEY, "directory"], queryFn: listDirectory, staleTime: 0 });
}

export function useAddDirectorySupplier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (supplier: DirectorySupplier) => Promise.resolve(addDirectorySupplier(supplier)),
    onSuccess: () => void client.invalidateQueries({ queryKey: KEY }),
  });
}

/** Same escape hatch as useInvalidateWorkspaces — for legacy flows that
    still write around the mutations. */
export function useInvalidateSuppliers(): () => void {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: KEY });
}

/* Supplier directory as queries over the hydrated PostgreSQL account copy. */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  persistReportChange,
  invalidateReportViews,
} from "./persist-report-change";
import type { DirectorySupplier } from "./data";
import {
  openPrecursorLink,
  type PrecursorLinkView,
} from "./precursor-link-sync";
import {
  getSupplier,
  listSuppliers,
  saveSupplier,
  type PrecursorSupplier,
} from "./precursor-suppliers";
import {
  getSupplierCompany,
  listSupplierCompanies,
  saveSupplierCompany,
  type SupplierCompany,
} from "./supplier-companies";
import {
  addDirectorySupplier,
  listDirectory,
  listSupplierRows,
} from "./supplier-directory";

const KEY = ["suppliers"] as const;
const COMPANIES_KEY = ["supplier-companies"] as const;
const PRECURSORS_KEY = ["precursor-suppliers"] as const;

export function useSupplierRows() {
  return useQuery({
    queryKey: [...KEY, "rows"],
    queryFn: listSupplierRows,
    staleTime: 0,
  });
}

export function useSupplierDirectory() {
  return useQuery({
    queryKey: [...KEY, "directory"],
    queryFn: listDirectory,
    staleTime: 0,
  });
}

export function useAddDirectorySupplier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (supplier: DirectorySupplier) =>
      Promise.resolve(addDirectorySupplier(supplier)),
    onSuccess: () => void invalidateReportViews(client),
  });
}

/** Same escape hatch as useInvalidateWorkspaces — for legacy flows that
    still write around the mutations. */
export function useInvalidateSuppliers(): () => void {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: KEY });
}

/* ── Supplier companies (lib/supplier-companies.ts) ─────────── */

export function useSupplierCompanies() {
  return useQuery({
    queryKey: COMPANIES_KEY,
    queryFn: listSupplierCompanies,
    staleTime: 0,
  });
}

export function useSupplierCompany(id: string | undefined) {
  return useQuery({
    queryKey: [...COMPANIES_KEY, id],
    queryFn: () => getSupplierCompany(id ?? ""),
    enabled: Boolean(id),
    staleTime: 0,
  });
}

export function useSaveSupplierCompany() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierCompany) =>
      persistReportChange(() => saveSupplierCompany(input)),
    onSuccess: () => void invalidateReportViews(client),
  });
}

/** For seedSupplierCompaniesFrom / removeSupplierCompany, which still write
    around the mutations. */
export function useInvalidateSupplierCompanies(): () => void {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: COMPANIES_KEY });
}

/* ── Precursor suppliers (lib/precursor-suppliers.ts) ───────── */

export function usePrecursorSuppliers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...PRECURSORS_KEY, workspaceId],
    queryFn: () => listSuppliers(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export function usePrecursorSupplier(
  workspaceId: string | undefined,
  nodeId: string | undefined,
) {
  return useQuery({
    queryKey: [...PRECURSORS_KEY, workspaceId, nodeId],
    queryFn: () => getSupplier(workspaceId ?? "", nodeId ?? ""),
    enabled: Boolean(workspaceId && nodeId),
    staleTime: 0,
  });
}

export function useSavePrecursorSupplier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (s: PrecursorSupplier) =>
      persistReportChange(() => saveSupplier(s)),
    onSuccess: () => void invalidateReportViews(client),
  });
}

/** Resolves a server-issued /p/<token> Smart Link. Keyed under PRECURSORS_KEY
    so a save refreshes the resolved node too. */
export function usePrecursorLink(token: string | undefined) {
  return useQuery<PrecursorLinkView | null>({
    queryKey: [...PRECURSORS_KEY, "link", token],
    queryFn: () => openPrecursorLink(token ?? ""),
    enabled: Boolean(token),
    staleTime: 0,
  });
}

/* WHO IS ASKING, for a local link. For a precursor it is the installation the
   good is made at — the plant this supplier ships INTO. For the row at the top
   of the chain that installation is the RECIPIENT, so naming it would head the
   page "data request from" the very site reading it; the asker there is the
   exporter's own company. A server link carries the same answer, worked out
   on the exporter's side (lib/precursor-link-sync.ts). */
/** For the out-of-band writers this store still has — markLinkOpened,
    markLinkSubmitted, setScrap, removeSupplier, sendAllPrecursorLinks. */
export function useInvalidatePrecursorSuppliers(): () => void {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: PRECURSORS_KEY });
}

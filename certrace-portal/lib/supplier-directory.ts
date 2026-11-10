import { accountStorage } from "./account-storage";
/* ── The saved supplier directory ──────────────────────────────
   A supplier invited part-way through the new-declaration wizard is not a
   property of that declaration — it's a company the exporter now works with,
   and it has to be there on the Suppliers page afterwards without being
   re-typed.

   Directory entries are account records in PostgreSQL. This module provides
   the synchronous view used by the existing wizard and supplier screens. */

import {
  supplierSlug,
  type DirectorySupplier,
  type SupplierProfile,
  type SupplierRow,
} from "./data";

const KEY = "certrace:supplier-directory";

/** Match on company name — that's the identity an exporter recognises, and it
    keeps a directory entry and a declaration row for the same mill together
    even though they carry different ids. */
export const directoryKey = (company: string) => company.trim().toLowerCase();

export function loadAddedSuppliers(): DirectorySupplier[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = accountStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as DirectorySupplier[];
    return Array.isArray(arr)
      ? arr.filter((s) => s && typeof s.company === "string")
      : [];
  } catch {
    return [];
  }
}

/** The account's supplier directory, deduped by company name. */
export function listDirectory(): DirectorySupplier[] {
  const merged = new Map<string, DirectorySupplier>();
  for (const s of loadAddedSuppliers()) merged.set(directoryKey(s.company), s);
  return [...merged.values()];
}

export function addDirectorySupplier(
  supplier: DirectorySupplier,
): DirectorySupplier[] {
  if (typeof window === "undefined") return listDirectory();
  const added = loadAddedSuppliers().filter(
    (s) => directoryKey(s.company) !== directoryKey(supplier.company),
  );
  added.push(supplier);
  try {
    accountStorage.setItem(KEY, JSON.stringify(added));
  } catch {
    /* ignore quota — the in-memory list the caller holds is still correct */
  }
  return listDirectory();
}

export function findDirectorySupplier(
  company: string,
): DirectorySupplier | undefined {
  return listDirectory().find(
    (s) => directoryKey(s.company) === directoryKey(company),
  );
}

/* ── The Suppliers page view ───────────────────────────────────
   Only saved directory entries appear. Bundled declaration fixtures must
   never become real supplier companies on an account. */
export function listSupplierRows(): SupplierRow[] {
  const rows = new Map<string, SupplierRow>();
  for (const d of listDirectory()) {
    const key = directoryKey(d.company);
    if (rows.has(key)) continue;
    rows.set(key, {
      id: d.id,
      ref: `#${d.id.slice(-4).toUpperCase()}`,
      name: d.company,
      country: d.country,
      material: d.material || "—",
      progress: 0,
      status: "not_started",
      emissions: null,
      updated: "—",
      critical: false,
    });
  }
  return [...rows.values()];
}

/** Detail-page resolver. Falls back to a directory-only profile so a supplier
    invited a minute ago in the wizard opens instead of 404-ing — they just
    have nothing collected against them yet. */
export function getSupplierProfileClient(slug: string): SupplierProfile | null {
  const d = listDirectory().find((s) => supplierSlug(s.company) === slug);
  if (!d) return null;
  return {
    id: d.id,
    name: d.company,
    slug,
    country: d.country,
    ref: `#${d.id.slice(-4).toUpperCase()}`,
    contact: d.contact || "—",
    email: d.email || "—",
    status: "not_started",
    critical: false,
    compliancePct: 0,
    emissions: null,
    installation: null,
    requiredFields: { completed: 0, total: 0 },
    documentsStats: { uploaded: 0, total: 0 },
    missingInfo: [],
    verificationStatus: "not_verified",
    products: d.material ? [{ name: d.material, cn: "—" }] : [],
    declarations: [],
    reports: [],
    documents: [],
    pending: [],
    activity: [],
  };
}

/* ════════════════════════════════════════════════════════════
   SUPPLIER COMPANIES — the level above an installation

   An installation does not exist on its own. It is a plant, and a plant
   belongs to a company: G J Steel runs two of them, and the exporter chases
   G J Steel, not "TH-RAYONG-01".

   THE MISSING LEVEL IS WHY THIS EXISTS. The portal had installations and it
   had a supplier DIRECTORY (lib/supplier-directory.ts, built out of the
   declaration fixtures), and nothing joined them. So an exporter adding a
   second plant for a mill they already worked with created a second unrelated
   site, the Suppliers page and the workspace picker listed different things,
   and there was no screen that could answer "everything outstanding at
   G J Steel". Making the company a record, and hanging installations off it,
   is what turns the estate into supplier → installation → good.

   WHY NOT EXTEND lib/supplier-directory.ts. That store is keyed by company
   NAME and its rows are derived from declarations — a shape that predates
   workspaces and cannot carry a stable id, because renaming a supplier there
   orphans every row pointing at it. A workspace has to keep saying what it
   said after a rename, so a supplier needs an id that survives one. The
   directory stays where it is and keeps feeding the old declaration screens;
   this is what installations and workspaces point at.

   Frontend-only MVP: one localStorage key, the same seam as
   lib/installations.ts.
   ════════════════════════════════════════════════════════════ */

import { secureId } from "./secure-id";

export type SupplierCompany = {
  /** stable id, minted once. NOT derived from the name — see the header. */
  id: string;
  /** the company an exporter recognises and chases */
  name: string;
  /** ISO-3166 alpha-2. Also the default dialling code for the contact. */
  country: string;
  /** the named person who answers for this company's data */
  contactName: string;
  contactEmail: string;
  /** stored joined, "+66 38 123 456" — see lib/dial-codes.ts */
  contactPhone: string;
  createdAt: string;
};

const KEY = "certrace:supplier-companies";

/** Minted once per company and then pointed at from everywhere: a workspace,
    an installation, a precursor row. It travels the same paths a workspace or
    supplier-row id does, so it is minted the same way — see lib/secure-id.ts
    for why Math.random() and Date.now() are not an acceptable fallback. */
export const supplierUid = () => secureId("sup");

function read(): SupplierCompany[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as SupplierCompany[];
    return Array.isArray(parsed) ? parsed.map(hydrate) : [];
  } catch {
    return [];
  }
}

function write(all: SupplierCompany[]): SupplierCompany[] {
  if (typeof window === "undefined") return all;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
  return all;
}

export const emptySupplier = (): SupplierCompany => ({
  id: supplierUid(),
  name: "",
  country: "TH",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  createdAt: new Date().toISOString(),
});

/** Records written before a field existed load as `undefined` and would render
    an uncontrolled input. Everything that reads a stored supplier goes through
    here so a missing field is an empty string, never a crash. */
export const hydrate = (raw: Partial<SupplierCompany>): SupplierCompany => ({
  ...emptySupplier(),
  ...raw,
  id: raw.id ?? supplierUid(),
});

export const listSupplierCompanies = (): SupplierCompany[] => read().sort((a, b) => a.name.localeCompare(b.name));

export const getSupplierCompany = (id: string): SupplierCompany | null => read().find((s) => s.id === id) ?? null;

/** Match on name, for the one case an id cannot answer: reconciling a company
    that already exists in the legacy directory with one created here. */
export const findSupplierCompanyByName = (name: string): SupplierCompany | null => {
  const key = name.trim().toLowerCase();
  return read().find((s) => s.name.trim().toLowerCase() === key) ?? null;
};

/** Upsert by id. A supplier saved with a name that already belongs to another
    record is still saved — two mills can genuinely share a trading name across
    countries, and refusing the save leaves the exporter with nowhere to put the
    second one. The Suppliers page shows the country beside the name so the
    pair is distinguishable. */
export function saveSupplierCompany(input: SupplierCompany): SupplierCompany {
  const record: SupplierCompany = { ...input, name: input.name.trim(), id: input.id || supplierUid() };
  const rest = read().filter((s) => s.id !== record.id);
  write([...rest, record]);
  return record;
}

export function removeSupplierCompany(id: string): SupplierCompany[] {
  return write(read().filter((s) => s.id !== id));
}

/** Name and email are what every other screen keys on and writes to, so they
    are required; the rest can be filled in later without leaving a row that
    cannot be contacted. */
export const canSaveSupplier = (s: SupplierCompany): boolean =>
  Boolean(s.name.trim()) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.contactEmail.trim());

/* ── Bringing the old directory across ──────────────────────────
   lib/supplier-directory.ts holds every company the exporter worked with
   before suppliers became first-class: the demo fixtures, plus anybody invited
   from the old declaration wizard. Leaving them behind would empty the
   Suppliers page on an account that has been used, which reads as data loss.

   So the directory's rows are copied in the first time this store is read by
   the Suppliers page. Idempotent and one-directional: matched by name, and a
   company that already exists here is never overwritten — an edited record
   must not be reverted by a fixture. */
export function seedSupplierCompaniesFrom(rows: { company: string; country?: string; contact?: string; email?: string }[]): SupplierCompany[] {
  const existing = read();
  const known = new Set(existing.map((s) => s.name.trim().toLowerCase()));
  const additions: SupplierCompany[] = [];

  for (const row of rows) {
    const name = row.company?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (known.has(key)) continue;
    known.add(key);
    additions.push({
      ...emptySupplier(),
      name,
      country: (row.country ?? "TH").toUpperCase(),
      contactName: row.contact ?? "",
      contactEmail: row.email ?? "",
    });
  }

  if (additions.length === 0) return listSupplierCompanies();
  write([...existing, ...additions]);
  return listSupplierCompanies();
}

/** null when valid; otherwise the one sentence that says what to fix. */
export function supplierEmailError(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "An email address — this is where each month's link goes.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "That does not look like an email address.";
  return null;
}

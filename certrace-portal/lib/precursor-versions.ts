import { accountStorage } from "./account-storage";
/* ════════════════════════════════════════════════════════════
   SAVED VERSIONS OF ONE PRECURSOR ROW

   Enter verified data autosaves. Autosave without a HISTORY is the same
   trade every compliance tool eventually regrets: the exporter never loses
   an afternoon's typing, and in exchange nobody can answer the question a
   verifier actually asks — "when was this figure last changed, and what
   changed?" A row that quietly became 1.82 tCO₂e/t last Tuesday, with no
   record that it was 2.40 before, is a row whose provenance has been
   overwritten by a convenience feature.

   So every autosave that actually CHANGES something appends a version:
   its number, the timestamp, which fields moved, and a full snapshot.

   WHAT THIS IS NOT. It is not an audit log — nothing here is signed, and a
   frontend-only store is not evidence. And there is deliberately no
   "restore": rewinding a compliance figure is an act that needs a reason
   recorded against it, and a one-click undo beside a number a verifier may
   already have seen is worse than no undo at all. This shows what happened;
   changing it back is done the same way it was changed in the first place,
   in the form, where the autosave records that too.

   Frontend-only MVP, same seam as lib/precursor-suppliers.ts: one
   localStorage key, rows keyed by workspace + node.
   ════════════════════════════════════════════════════════════ */

import type { Installation } from "./installations";
import type { PrecursorSupplier } from "./precursor-suppliers";

/* THE ROOT OF A CHAIN KEEPS A HISTORY TOO. Enter verified data is one
   button, on every row of the chain, and the row at the top of it autosaves
   the same way a precursor does — so it owes the same answer to "when did
   this last change, and what changed?". The record it edits is an
   `Installation` rather than a `PrecursorSupplier`, which is the only
   difference; the machinery below is structural and does not care. */
export type VersionedRecord = PrecursorSupplier | Installation;

export type PrecursorVersion<T extends VersionedRecord = PrecursorSupplier> = {
  /** 1-based, per row. What the UI shows as "v4". */
  version: number;
  savedAt: string;
  /** human labels of the fields that moved since the previous version.
      Empty only on v1, which is the row as first recorded. */
  changed: string[];
  snapshot: T;
};

export type StoredPrecursorVersion = PrecursorVersion<VersionedRecord>;

export type InstallationVersion = PrecursorVersion<Installation>;

const KEY = "certrace:precursor-versions";

/** How many to keep per row. A long editing session can produce a version
    every few seconds; past a few dozen the list stops being readable and
    starts being a scroll. The oldest go first — the recent history is the
    one anybody asks about. */
const MAX_PER_NODE = 40;

type Store = Record<string, PrecursorVersion<VersionedRecord>[]>;

const storeKey = (workspaceId: string, nodeId: string) =>
  `${workspaceId}~${nodeId}`;

/* The installation root has no precursor row and therefore no node id of its
   own, so it borrows the same namespacing the tree already uses for it
   (lib/supplier-tree.ts builds its node id the same way). One store, two
   kinds of row, no key can collide with a precursor's. */
const installationKey = (installationId: string) =>
  `installation:${installationId}`;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(accountStorage.getItem(KEY) ?? "{}") as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    accountStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota — losing history must never lose the row itself */
  }
}

/* ── What a field is called when it changes ─────────────────────
   Named rather than key-cased, because "verifierAccreditationIssuingCountry"
   split on capitals reads as an error message. Anything not listed falls
   back to a de-camelised form, so a field added later still produces a
   sentence rather than nothing. */
const FIELD_LABEL: Record<string, string> = {
  name: "Company name",
  installationName: "Producing installation",
  country: "Country",
  precursorName: "Precursor",
  cnCode: "CN code",
  catalogProductId: "Catalogue product",
  productionRoute: "Production route",
  isScrap: "Scrap flag",
  seeTco2ePerT: "Specific embedded emissions",
  specificEmbeddedDirectTco2PerT: "Direct emissions",
  specificEmbeddedIndirectTco2PerT: "Indirect emissions",
  dataOrigin: "Data origin",
  monthlyQuantities: "Monthly quantities",
  qtyPerTonneOverride: "Per-tonne ratio",
  quantityUsedT: "Quantity used",
  origin: "Where it was made",
  sourceProcessId: "Source process",
  contactName: "Contact person",
  contactEmail: "Email",
  contactPhone: "Telephone",
  installationUniqueId: "Installation unique ID",
  unlocode: "UN/LOCODE",
  fullAddress: "Address",
  latitude: "Latitude",
  longitude: "Longitude",
  reportingPeriodStart: "Reporting period start",
  reportingPeriodEnd: "Reporting period end",
  verificationReportFileId: "Verification report",
  verifierName: "Verifier",
  verifierAccreditationNumber: "Accreditation number",
  verifierAccreditationIssuingCountry: "Accreditation country",
  verifierAccreditationExpiryDate: "Accreditation expiry",
  verificationReportIssueDate: "Report issue date",
  verificationReportExpiresAt: "Report expiry",
  verificationSectoralScope: "Sectoral scope",
  verificationChecks: "Verification checks",
  reducingAgent: "Reducing agent",
  linkedWorkspaceId: "Product report",

  /* Installation records (the chain root). Named to the EU sheet's own
     wording, the same way lib/installations.ts holds them — a history that
     says "Lat" for a field the template calls the coordinates of the main
     emission source is a history a verifier has to translate. */
  nameLocal: "Local name",
  street: "Street, number",
  economicActivity: "Economic activity",
  postcode: "Post code",
  poBox: "P.O. Box",
  city: "City",
  lat: "Latitude",
  lng: "Longitude",
  otherGoods: "Other goods made here",
};

const prettify = (key: string) => {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const labelFor = (key: string) => FIELD_LABEL[key] ?? prettify(key);

/* Fields whose movement is bookkeeping rather than a change to the figure —
   listing them would bury the one line somebody is looking for under
   "Smart link sent at" every time a link is copied. */
const IGNORED: ReadonlySet<string> = new Set([
  "id",
  "workspaceId",
  "parentId",
  "smartLinkToken",
  "smartLinkSentAt",
  "smartLinkOpenedAt",
  "smartLinkSubmittedAt",
  // Installation bookkeeping — ownership and creation time are not edits to
  // the site's facts, and `self`/`supplierId` are set by the flow that made
  // the record rather than typed on the form this history describes.
  "createdAt",
  "self",
  "supplierId",
]);

/** Which fields differ, as labels. Compared by serialised value so nested
    arrays (monthlyQuantities) and objects (verificationChecks) count as one
    change each rather than being walked. */
export function changedFields(
  before: VersionedRecord,
  after: VersionedRecord,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const out: string[] = [];
  for (const k of keys) {
    if (IGNORED.has(k)) continue;
    const a = (before as Record<string, unknown>)[k];
    const b = (after as Record<string, unknown>)[k];
    // "" and undefined are the same answer — an untouched optional field
    // that gains an empty string when a form mounts is not an edit.
    const norm = (v: unknown) =>
      v === undefined || v === null || v === "" ? "" : JSON.stringify(v);
    if (norm(a) !== norm(b)) out.push(labelFor(k));
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/** Newest first. */
export function listVersions(
  workspaceId: string,
  nodeId: string,
): PrecursorVersion[] {
  return [
    ...(read()[storeKey(workspaceId, nodeId)] ?? []),
  ].reverse() as PrecursorVersion[];
}

export const latestVersion = (
  workspaceId: string,
  nodeId: string,
): PrecursorVersion | null => listVersions(workspaceId, nodeId)[0] ?? null;

/** The chain root's own history — same store, same shape, keyed by the
    installation rather than by a precursor row. Newest first. */
export function listInstallationVersions(
  workspaceId: string,
  installationId: string,
): InstallationVersion[] {
  return [
    ...(read()[storeKey(workspaceId, installationKey(installationId))] ?? []),
  ].reverse() as InstallationVersion[];
}

/** Append a version if anything actually moved. Returns the new version, or
    null when the row is byte-identical to the last one recorded — which is
    the common case, because autosave fires on a timer and not on a change. */
export function recordVersion(row: PrecursorSupplier): PrecursorVersion | null {
  const key = storeKey(row.workspaceId, row.id);
  const store = read();
  const history = store[key] ?? [];
  const previous = history[history.length - 1];

  const changed = previous ? changedFields(previous.snapshot, row) : [];
  if (previous && changed.length === 0) return null;

  const version: PrecursorVersion = {
    version: (previous?.version ?? 0) + 1,
    savedAt: new Date().toISOString(),
    changed,
    snapshot: row,
  };

  store[key] = [...history, version].slice(-MAX_PER_NODE);
  write(store);
  return version;
}

/** `recordVersion` for the row at the top of the chain. Same rule: append
    only when something actually moved, so an autosave timer firing on an
    untouched form does not fill the list with identical entries. */
export function recordInstallationVersion(
  workspaceId: string,
  record: Installation,
): InstallationVersion | null {
  const key = storeKey(workspaceId, installationKey(record.id));
  const store = read();
  const history = store[key] ?? [];
  const previous = history[history.length - 1];

  const changed = previous ? changedFields(previous.snapshot, record) : [];
  if (previous && changed.length === 0) return null;

  const version: InstallationVersion = {
    version: (previous?.version ?? 0) + 1,
    savedAt: new Date().toISOString(),
    changed,
    snapshot: record,
  };

  store[key] = [...history, version].slice(-MAX_PER_NODE);
  write(store);
  return version;
}

/** "24 Aug 2026, 20:41" — one spelling of a timestamp, so the version list
    and the autosave badge never disagree about what time it is. */
export function formatVersionDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

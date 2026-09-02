/* ════════════════════════════════════════════════════════════
   THE CHAIN-ROOT SUPPLIER ROW — one button, one kind of screen

   Enter verified data used to change shape depending on which row of the
   chain it was pressed on: a precursor opened the supplier form, and the
   installation at the top opened a form asking a different set of questions
   in a different order. Same words on the button, same place on the row, two
   screens — and the one at the top was the row the exporter has to hand to a
   buyer.

   So the root gets the same answer set every other row has: a
   PrecursorSupplier row flagged `isChainRoot`, which is what
   `TreeVerifiedDataModal` edits and what `/p/<token>` renders when the site
   is sent its own link. Nothing about that dialog is special-cased for it.

   WHY IT IS SEEDED, NOT MIRRORED. The identity is copied from the
   Installation record ONCE, when the row is first created — after that the
   row is the row, exactly as a precursor's is. Re-reading the installation on
   every open would look like tidiness and would quietly overwrite whatever
   the site itself corrected on their link, which is the one thing this dialog
   exists to collect. The one exception is the contact block: an EMPTY email
   on the row is re-filled from the installation, because that is the address
   the link is sent to and an empty one means the ask has nowhere to go.

   WHAT THIS IS NOT is a second copy of the twelve months. Track report still
   opens the workspace, and the readings, the MMD and the evidence checklist
   still live on their own screens. This row is the package that goes OUT —
   the figure, its period, and the verification report standing behind it.
   ════════════════════════════════════════════════════════════ */

import { getInstallation } from "./installations";
import { getOrgIdentity } from "./org";
import { chainRootSupplier, emptySupplier, saveSupplier, type PrecursorSupplier } from "./precursor-suppliers";
import { getSupplierCompany } from "./supplier-companies";
import { getRoute, type VerificationWorkspace } from "./workspace";

/** The producing company as the chain reads it: the supplier the workspace
    was created against, or the exporter themselves on their own site. */
function producerName(workspace: VerificationWorkspace): string {
  if (workspace.selfSupplied) return getOrgIdentity().name;
  const company = workspace.supplierId ? getSupplierCompany(workspace.supplierId) : null;
  return company?.name ?? workspace.supplierName ?? "";
}

/** The Installation record's address as the supplier form asks for it — one
    line, in the order a verifier reads it. The record holds the parts
    separately (EU template fields iii–vii); the form has one box, and joining
    them here is what lets both sides ask the same question. */
function fullAddress(street: string, postcode: string, city: string): string {
  return [street, city, postcode].map((p) => p.trim()).filter(Boolean).join(", ");
}

/** A finite number from one of the Installation record's string coordinates —
    they are held as strings so a half-typed coordinate survives, and the
    supplier form wants numbers. */
function coord(raw: string): number | undefined {
  const n = Number(raw.trim());
  return raw.trim() && Number.isFinite(n) ? n : undefined;
}

/** The chain-root row for this workspace, created from the Installation
    record the first time it is asked for. Idempotent: the second call returns
    the stored row untouched, apart from the empty-contact top-up above. */
export function ensureChainRootSupplier(workspace: VerificationWorkspace): PrecursorSupplier {
  const installation = getInstallation(workspace.installationId);
  const existing = chainRootSupplier(workspace.id);

  if (existing) {
    // The email is the one field a blank cannot be lived with: it is where
    // "Send link" points. Filled from the site record rather than asked for
    // twice — see the header.
    const missingContact =
      !(existing.contactEmail ?? "").trim() && Boolean((installation?.contactEmail ?? "").trim());
    if (!missingContact) return existing;
    return saveSupplier({
      ...existing,
      contactName: (existing.contactName ?? "").trim() || (installation?.contactName ?? ""),
      contactEmail: installation?.contactEmail ?? "",
      contactPhone: (existing.contactPhone ?? "").trim() || (installation?.contactPhone ?? ""),
    });
  }

  const base = emptySupplier(workspace.id, null);
  const route = getRoute(workspace.productionRoute);

  return saveSupplier({
    ...base,
    isChainRoot: true,
    /* "Purchased" on the exporter's own site too, and deliberately. The
       origin field decides the SHAPE of the supplier form: only the purchased
       branch asks who produced it, where, under which reference and with
       which verification report — which is the whole identity a buyer's
       declarant needs, own site or not. The other branch asks for a source
       process inside a plant, which is a question about a precursor and not
       about the top of the chain. Nothing downstream reads it here: the
       chain-root row is filtered out of every roll-up (see `isChainRoot`), so
       this only picks which questions are asked. */
    origin: "purchased",
    name: producerName(workspace),
    installationName: workspace.installationName,
    country: installation?.country ?? "TH",
    installationUniqueId: workspace.installationId,
    unlocode: installation?.unlocode ?? "",
    fullAddress: installation ? fullAddress(installation.street, installation.postcode, installation.city) : "",
    latitude: installation ? coord(installation.lat) : undefined,
    longitude: installation ? coord(installation.lng) : undefined,
    // The good this chain is about — locked to the catalogue exactly as a
    // precursor picked from it is, because `catalogProductId` is what the
    // default-value library, the aggregated category and the sectoral-scope
    // check all read.
    catalogProductId: workspace.productId,
    precursorName: workspace.productName,
    cnCode: workspace.cnCode,
    // Stored on the row as the route's LABEL, not its id — that is what the
    // supplier form's picker writes and what /p/<token> shows.
    productionRoute: route?.label ?? "",
    // The reporting period is the workspace's year: this row is the figure
    // for the year the workspace covers, not for some other window.
    reportingPeriodStart: workspace.periodStart,
    reportingPeriodEnd: workspace.periodEnd,
    contactName: installation?.contactName ?? "",
    contactEmail: installation?.contactEmail ?? "",
    contactPhone: installation?.contactPhone ?? "",
  });
}

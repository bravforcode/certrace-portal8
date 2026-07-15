/* "Duplicate previous request" — many exporters repeat similar requests every
   quarter or year; re-seed the wizard from a past declaration's scope
   (purpose, products, suppliers) as a fresh draft instead of starting blank.
   Quantities and dates are left for the exporter to re-enter — they change
   every period even when the scope doesn't.

   Shared by the declarations index (card / row kebab menu) and the declaration
   detail header, so both entry points produce the identical draft. */

import { SUPPLIER_DIRECTORY, type Declaration, type DirectorySupplier } from "./data";
import { getRegulation } from "./config";
import { saveDraft, newDraftId, type Mapping, type WizardSnapshot } from "./drafts";
import { productForMaterial } from "./supplier";

function heading(d: Declaration) {
  return d.kind === "buyer" ? d.title ?? d.name : getRegulation(d.regulation)?.short ?? d.name;
}

export function duplicateToDraft(d: Declaration): string {
  const materials = Array.from(new Set(d.suppliers.map((s) => s.material)));
  const classified = materials.map((material) => ({ material, product: productForMaterial(material) }));
  const unresolved = classified.filter((item) => item.product === null).map((item) => item.material);
  if (unresolved.length > 0) {
    throw new Error(`Resolve regulatory product classification before duplicating: ${unresolved.join(", ")}.`);
  }
  const products = Array.from(new Set(classified.map((item) => item.product!.id)));

  const mapping: Mapping = {};
  d.suppliers.forEach((s) => {
    const product = productForMaterial(s.material);
    if (!product) return;
    const pid = product.id;
    const entries = mapping[pid] ?? [];
    if (!entries.some((e) => e.supplierId === s.id)) {
      mapping[pid] = [...entries, { supplierId: s.id, lots: [{ id: `${s.id}-l1`, qty: "", unit: "", from: "", to: "", notes: "" }] }];
    }
  });

  // Keep the declaration's own supplier ids (they're what `mapping` above keys
  // on) even when a directory match is found — otherwise the two disagree and
  // the wizard can't resolve a supplier's name back from the mapping.
  const directory: DirectorySupplier[] = d.suppliers.map((s) => {
    const match = SUPPLIER_DIRECTORY.find((x) => x.company === s.name);
    return match ? { ...match, id: s.id } : { id: s.id, company: s.name, contact: "", email: "", country: s.country };
  });

  const name = `${heading(d)} (copy)`;
  const snapshot: WizardSnapshot = {
    regulation: d.regulation,
    origin: d.origin,
    destination: d.market,
    purpose: d.kind ?? "cbam",
    name,
    description: "",
    periodId: "annual",
    year: String(new Date().getFullYear()),
    quarter: "Q1",
    half: "H1",
    month: "January",
    rangeStart: "",
    rangeEnd: "",
    products,
    reportFields: {},
    directory,
    mapping,
    deadline: "",
    reminders: { d7: true, d3: true, due: true },
    notes: "",
    step: 0,
  };

  const id = newDraftId();
  saveDraft({
    id,
    updatedAt: Date.now(),
    snapshot,
    display: { name, purpose: snapshot.purpose, productCount: products.length, supplierCount: directory.length, period: "", deadline: "" },
  });
  return id;
}

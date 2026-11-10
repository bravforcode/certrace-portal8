"use client";

/* ════════════════════════════════════════════════════════════
   ADD PRECURSOR — the supplier form, verbatim

   THE SAME FIVE FIELDS AS "ADD A SUPPLIER", because it is the same act.
   Adding a precursor is naming a company you buy from and the person you
   will chase every month; that form already exists, already carries the
   three explanations that make it answerable, and already knows that the
   email is the one field that stops the whole arrangement working when it is
   wrong. So this renders `SupplierFields`
   (components/workspace/supplier-form.tsx) rather than a second, slightly
   different spelling of it — and inherits `canSaveSupplier`, which is what
   makes EMAIL REQUIRED here without this file having its own opinion about
   what a valid address looks like.

   WHAT IS NOT ASKED HERE ANY MORE: the precursor's material, CN code and
   installation. They used to be on this dialog, which meant the exporter had
   to know what their supplier ships and under which code before they were
   allowed to record that the supplier exists — at exactly the moment they
   have neither. They are asked in Enter verified data instead, next to the
   figure they qualify, or answered by the supplier on their own Smart Link.
   Adding the row is now: who are they, and where does the link go.

   TWO RECORDS, ONE SAVE. The dialog writes a SupplierCompany (so the company
   appears on the Suppliers page and can be reused) AND the PrecursorSupplier
   row the chain is built from, with the contact details copied onto the row —
   see PrecursorSupplier's own note on why the copy is deliberate.

   The cycle check is unchanged: wouldCreateCycle() runs on the real-world
   entity id (lib/supplier-tree.ts's precursorEntityId) BEFORE anything is
   saved, and a blocked attempt names the conflicting node rather than just
   saying "cycle detected".
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Button, Modal } from "@/components/ui";
import { SupplierFields } from "@/components/workspace/supplier-form";
import {
  canSaveSupplier,
  emptySupplier as emptySupplierCompany,
  saveSupplierCompany,
  type SupplierCompany,
} from "@/lib/supplier-companies";
import { emptySupplier, saveSupplier } from "@/lib/precursor-suppliers";
import { precursorEntityId } from "@/lib/supplier-tree";
import { wouldCreateCycle } from "@/lib/cbam/tree-validation";
import type { TreeNode } from "@/types/supplier-tree";
import { useT } from "@/lib/i18n";

export function TreeAddPrecursorModal({
  parent,
  roots,
  onClose,
  onAdded,
}: {
  /** The node the new precursor is added under — the root installation adds
      a top-level precursor for that workspace, a precursor node nests one
      beneath it. Null closes the modal. */
  parent: TreeNode | null;
  roots: TreeNode[];
  onClose: () => void;
  onAdded: (newSupplierId: string) => void;
}) {
  const t = useT();
  const [draft, setDraft] = React.useState<SupplierCompany>(
    emptySupplierCompany(),
  );
  const [conflict, setConflict] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(emptySupplierCompany());
    setConflict(null);
  }, [parent?.id]);

  const change = (next: SupplierCompany) => {
    setConflict(null);
    setDraft(next);
  };

  const save = () => {
    if (!parent || !canSaveSupplier(draft)) return;

    /* Identity for the cycle check. No installation name is collected here
       any more, so the composite falls back to name + country — which is the
       same identity two rows for the same company would produce, and that is
       exactly what the check is looking for. */
    const candidateEntityId = precursorEntityId({
      installationUniqueId: undefined,
      name: draft.name,
      installationName: "",
      country: draft.country,
    });

    const check = wouldCreateCycle(roots, parent.id, candidateEntityId);
    if (check.cycle) {
      setConflict(
        check.conflictingNode
          ? `This would create a cycle — "${check.conflictingNode.name}" already appears earlier in this chain.`
          : "This would create a cycle in the chain.",
      );
      return;
    }

    const company = saveSupplierCompany(draft);

    // The root installation's TreeNode.id is synthetic, not a supplier row —
    // parentId is null there (a new top-level entry). A precursor node's
    // TreeNode.id IS the underlying PrecursorSupplier's id (see
    // mapPrecursorNode), so it nests as that row's child.
    const parentSupplierId = parent.kind === "precursor" ? parent.id : null;
    const base = emptySupplier(parent.workspaceId ?? "", parentSupplierId);
    const saved = saveSupplier({
      ...base,
      name: company.name,
      country: company.country,
      supplierCompanyId: company.id,
      contactName: company.contactName,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
    });
    onAdded(saved.id);
  };

  return (
    <Modal
      open={parent != null}
      onClose={onClose}
      eyebrow={t("Precursor")}
      title={
        parent ? `Add a precursor under ${parent.name}` : "Add a precursor"
      }
      lead={t(
        "Who supplies this, and where each month's request goes. What they actually ship — the material, its CN code and its emissions figure — is answered afterwards, either by them on their own link or by you in Enter verified data.",
      )}
      width="max-w-2xl"
      footer={
        <>
          <Button size="sm" variant="secondary" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button size="sm" disabled={!canSaveSupplier(draft)} onClick={save}>
            {t("Add precursor")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <SupplierFields value={draft} onChange={change} />
        {conflict && (
          <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12.5px] leading-relaxed text-[#991b1b]">
            {conflict}
          </p>
        )}
      </div>
    </Modal>
  );
}

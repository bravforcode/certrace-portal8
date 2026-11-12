/* ════════════════════════════════════════════════════════════
   CERA MISSING-DATA MONITOR — which CBAM fields the account has not answered yet

   Pure: the same inputs the Convert page uses (installation, sheets, cells) go in, and the
   requirement rules decide what is complete. Nothing here re-implements those rules; it
   only lists the required template fields of the requirements that are not complete.
   ════════════════════════════════════════════════════════════ */

import type { Standard } from "../convert-standards";
import { liveRequirements, readiness } from "../convert/requirements";
import { cbamCellKey, cbamFieldsFor } from "../cbam/template-fields";
import type { Installation } from "../installations";
import type { Sheet } from "../workspace-sheets";

export type MissingField = {
  /** "field": one CBAM template cell. "requirement": a requirement with no CBAM cell of its own (carbon price), listed so it is not silently open. */
  kind: "field" | "requirement";
  /** bare CBAM field id, e.g. "a-i9" (the id Cera's set_cbam_fields action uses); the requirement id for kind "requirement" */
  id: string;
  label: string;
  /** the form heading of a field; empty for a requirement */
  section: string;
  /** the requirement the entry belongs to, e.g. "goods" */
  requirement: string;
  /** where the user fills the requirement; null without an installation */
  href: string | null;
};

export type MissingData = {
  fields: MissingField[];
  /** requirements that are not complete */
  incompleteRequirements: number;
  /** share of requirements complete, 0–100 */
  readiness: number;
};

export type MissingContext = {
  installation: Installation | null;
  sheets: Sheet[];
  cells: Record<string, string>;
};

export function missingData(std: Standard, ctx: MissingContext): MissingData {
  const reqs = liveRequirements(std, ctx);
  const open = reqs.filter((r) => r.state !== "complete");
  const fields = open.flatMap((r): MissingField[] => {
    const cells = cbamFieldsFor(r.id);
    if (cells.length === 0)
      return [{ kind: "requirement", id: r.id, label: r.title, section: "", requirement: r.id, href: r.href }];
    return cells
      .filter((f) => !f.optional && !(ctx.cells[cbamCellKey(f)] ?? "").trim())
      .map((f) => ({ kind: "field", id: f.id, label: f.label, section: f.section, requirement: r.id, href: r.href }));
  });
  return { fields, incompleteRequirements: open.length, readiness: readiness(reqs) };
}

/** Cera's chat takes a prompt of at most 4000 characters; the list stays well under that. */
export const FILL_REQUEST_BUDGET = 3000;

/** The message "Ask Cera to fill" sends. Lists as many fields as the budget allows and says how many are left out. */
export function fillRequest(
  installation: { id: string; name: string },
  year: number,
  missing: MissingField[],
  budget = FILL_REQUEST_BUDGET,
): string {
  const head =
    `Fill the CBAM fields below for installation "${installation.name}" (installationId ${installation.id}), year ${year}. ` +
    `Use only data that is already in this account. Propose each value as a confirmable action; say which fields you could not fill.\nFields:\n`;
  const lines: string[] = [];
  let used = head.length;
  // A requirement with no cell of its own cannot be set through Cera, so it is not asked for.
  const cells = missing.filter((m) => m.kind === "field");
  for (const f of cells) {
    const line = `${f.id}: ${f.section} · ${f.label}`;
    if (used + line.length + 1 > budget) break;
    lines.push(line);
    used += line.length + 1;
  }
  const rest = cells.length - lines.length;
  return head + lines.join("\n") + (rest > 0 ? `\n…and ${rest} more; ask again after these are done.` : "");
}

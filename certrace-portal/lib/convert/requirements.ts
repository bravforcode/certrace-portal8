import { installationRole, type Installation } from "../installations";
import type {
  Requirement,
  RequirementState,
  Standard,
} from "../convert-standards";
import type { Sheet } from "../workspace-sheets";
import {
  installationSheetStatus,
  sheetStatus,
  type SheetStatus,
} from "../workbook/status";
import { cbamProgress } from "../cbam/template-fields";

type Fix = "fill-in" | "smart-link";

/** Where each requirement's data lives, and the catalogue's default fix for it. */
export const REQUIREMENT_SOURCES: Record<
  string,
  { sheets: string[]; installation?: true; fix: Fix }
> = {
  installation: { sheets: [], installation: true, fix: "fill-in" },
  goods: { sheets: ["products"], fix: "fill-in" },
  direct: { sheets: ["energy", "materials"], fix: "fill-in" },
  indirect: { sheets: ["energy"], fix: "fill-in" },
  precursors: { sheets: ["materials"], fix: "smart-link" },
  "carbon-price": { sheets: ["evidence"], fix: "fill-in" },
  monitoring: { sheets: ["steps", "evidence"], fix: "fill-in" },
  communication: { sheets: ["output", "products"], fix: "smart-link" },
  verification: { sheets: ["evidence"], fix: "fill-in" },
};

export type LiveRequirement = Requirement & {
  state: RequirementState;
  progress: number;
  href: string | null;
  fix: Fix;
};

function stateOf(statuses: SheetStatus[]): {
  state: RequirementState;
  progress: number;
} {
  const done = statuses.filter((s) => s === "complete").length;
  const progress = statuses.length
    ? Math.round((done / statuses.length) * 100)
    : 0;
  if (statuses.length && done === statuses.length)
    return { state: "complete", progress };
  if (statuses.every((s) => s === "untouched"))
    return { state: "missing", progress };
  return { state: "in-progress", progress };
}

/** With CBAM answers loaded, the template fields decide: the report is built from them. */
function withCbam(
  legacy: { state: RequirementState; progress: number },
  item: string,
  cells: Record<string, string>,
) {
  const { filled, total } = cbamProgress(cells, item);
  if (!total) return legacy;
  const progress = Math.round((filled / total) * 100);
  if (filled === total) return { state: "complete" as const, progress };
  if (filled === 0 && legacy.state === "missing")
    return { state: "missing" as const, progress };
  return { state: "in-progress" as const, progress };
}

export function liveRequirements(
  std: Standard,
  ctx: {
    installation: Installation | null;
    sheets: Sheet[];
    cells?: Record<string, string>;
  },
): LiveRequirement[] {
  const role = ctx.installation ? installationRole(ctx.installation) : "own";
  const byId = new Map(ctx.sheets.map((s) => [s.id, s]));
  return std.requirements.map((req) => {
    const src = REQUIREMENT_SOURCES[req.id] ?? {
      sheets: [],
      fix: "fill-in" as Fix,
    };
    const statuses: SheetStatus[] = [
      ...(src.installation ? [installationSheetStatus(ctx.installation)] : []),
      ...src.sheets.map((id) => {
        const s = byId.get(id);
        return s ? sheetStatus(s) : "untouched";
      }),
    ];
    // D9: an OEM plant's data is typed in by the account; a supplier's comes from its own form.
    const fix: Fix =
      role === "oem" ? "fill-in" : role === "supplier" ? "smart-link" : src.fix;
    // Fill in and Smart Link open the same form: the account types it here, a Smart Link
    // hands that form to someone outside. `fix` only picks which button leads.
    const iid = ctx.installation?.id
      ? encodeURIComponent(ctx.installation.id)
      : null;
    const href = iid
      ? `/convert/fill/${encodeURIComponent(req.id)}?installation=${iid}&from=${encodeURIComponent(std.id)}`
      : null;
    const legacy = stateOf(statuses);
    return {
      ...req,
      ...(ctx.cells ? withCbam(legacy, req.id, ctx.cells) : legacy),
      fix,
      href,
    };
  });
}

/** Share of requirements complete, 0–100. Export and Submit stay disabled below 100 (D21). */
export const readiness = (reqs: LiveRequirement[]) =>
  reqs.length
    ? Math.round(
        (reqs.filter((r) => r.state === "complete").length / reqs.length) * 100,
      )
    : 0;

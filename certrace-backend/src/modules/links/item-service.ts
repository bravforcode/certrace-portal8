import { db } from "../../lib/db";
import { fail } from "../../lib/errors";
import { object, string } from "../../lib/json";
import { token as newToken } from "../../lib/security";
import { trialEnded } from "../auth/trial";
import { patchCells } from "../workbooks/service";
import { getItemFields, getItemLabel, isKnownItem, type ItemField } from "./item-fields";

const ITEM_LINK_DAYS = 90;

type FieldsFor = (itemKey: string) => ItemField[];

export async function createItemLink(
  companyId: string,
  actorId: string,
  body: { installationId: string; year: number; itemKey: string },
) {
  if (!isKnownItem(body.itemKey)) fail(422, "UNKNOWN_ITEM", "That item has no form to share.");
  const row = await db.item_links.create({
    data: {
      token: newToken(),
      user_id: companyId,
      installation_id: body.installationId,
      year: body.year,
      item_key: body.itemKey,
      created_by: actorId,
      expires_at: new Date(Date.now() + ITEM_LINK_DAYS * 86_400_000),
    },
  });
  return { token: row.token, path: `/s/item/${row.token}`, expiresAt: +row.expires_at };
}

// Unknown, expired and suspended-owner tokens all read as not found.
async function liveItemLink(token: string) {
  const link = await db.item_links.findUnique({
    where: { token },
    include: { users: true },
  });
  if (!link || link.users.status !== "ACTIVE" || link.expires_at <= new Date())
    fail(404, "TOKEN_NOT_FOUND", "That record is not here.");
  return link;
}

export async function resolveItemLink(token: string, fieldsFor: FieldsFor = getItemFields) {
  const link = await liveItemLink(token);
  const wb = await db.workbooks.findUnique({
    where: {
      company_id_installation_id_year: {
        company_id: link.user_id,
        installation_id: link.installation_id,
        year: link.year,
      },
    },
  });
  const cells = object(wb?.cells);
  return {
    token,
    itemKey: link.item_key,
    label: getItemLabel(link.item_key),
    installationId: link.installation_id,
    year: link.year,
    expiresAt: +link.expires_at,
    fields: fieldsFor(link.item_key).map(({ cell, ...f }) => ({
      ...f,
      value: string(cells[cell], ""),
    })),
  };
}

/** Maps submitted field keys to workbook cells. Only keys from this item's catalogue are accepted. */
export function itemCellPatch(fields: ItemField[], values: Record<string, string | null>) {
  const cellOf = new Map(fields.map((f) => [f.key, f.cell]));
  const patch: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(values)) {
    const cell = cellOf.get(key);
    if (cell === undefined) fail(422, "UNKNOWN_ITEM_FIELD", `Unknown field ${key.slice(0, 80)}`);
    patch[cell] = value;
  }
  return patch;
}

export async function submitItemLink(
  token: string,
  values: Record<string, string | null>,
  fieldsFor: FieldsFor = getItemFields,
) {
  const link = await liveItemLink(token);
  // Public writes stop when the owner's trial has ended, as on existing smart links.
  if (trialEnded(link.users))
    fail(403, "TRIAL_ENDED", "Your free trial has ended. Choose a plan to keep editing.");
  const cells = itemCellPatch(fieldsFor(link.item_key), values);
  // Attributed to the member who created the link, since public writers have no account.
  await patchCells(link.user_id, link.installation_id, link.year, link.created_by, cells);
  return { saved: true as const };
}

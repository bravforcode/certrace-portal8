import { db } from "../../lib/db";
import { fail, missing } from "../../lib/errors";
import { object, string, type JsonObject } from "../../lib/json";
export async function ownedDeclaration(userId: string, id: string) {
  const row = await db.portal_declarations.findUnique({
    where: { user_id_id: { user_id: userId, id } },
  });
  if (!row) return missing("DECLARATION_NOT_FOUND");
  return row;
}
export async function saveDeclaration(
  userId: string,
  id: string,
  input: JsonObject,
) {
  const doc: JsonObject = { ...input, id, updatedAt: Date.now() };
  if (Buffer.byteLength(JSON.stringify(doc)) > 524288)
    fail(413, "INVALID_DECLARATION", "That declaration is too large.");
  const data = {
    doc,
    name: string(input.name ?? input.title),
    period: string(input.period),
    step: string(input.step),
    updated_at: new Date(),
  };
  const row = await db.portal_declarations.upsert({
    where: { user_id_id: { user_id: userId, id } },
    create: { user_id: userId, id, ...data },
    update: data,
  });
  return object(row.doc);
}

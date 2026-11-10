import { Elysia } from "elysia";
import { companySession, requireOwner } from "../team/workspace";
import { db } from "../../lib/db";
import { object, jsonObject } from "../../lib/json";
import { declarationModel, declarationParams } from "./model";
import { ownedDeclaration, saveDeclaration } from "./service";
import { cleanupFileObject } from "../files/storage";
export const declarations = new Elysia({ prefix: "/api/v1/declarations" })
  .use(companySession)
  .get("", async ({ company }) => ({
    declarations: (
      await db.portal_declarations.findMany({
        where: { user_id: company.id },
        orderBy: { updated_at: "desc" },
      })
    )
      .map((row) => object(row.doc))
      .filter((doc) => doc.kind !== "workspace"),
  }))
  .post(
    "",
    ({ company, body, set }) => {
      set.status = 201;
      return saveDeclaration(company.id, body.id, body);
    },
    { body: declarationModel },
  )
  .get(
    "/:declaration_id",
    async ({ company, params }) =>
      object((await ownedDeclaration(company.id, params.declaration_id)).doc),
    { params: declarationParams },
  )
  .put(
    "/:declaration_id",
    ({ company, params, body }) =>
      saveDeclaration(company.id, params.declaration_id, body),
    { params: declarationParams, body: jsonObject },
  )
  .delete(
    "/:declaration_id",
    async ({ account, company, params, set }) => {
      requireOwner(account.id, company.id);
      const removedFiles = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM portal_declarations WHERE user_id=${company.id}::uuid AND id=${params.declaration_id} FOR UPDATE`;
        const rows = await tx.uploaded_files.findMany({
          where: { user_id: company.id, declaration_id: params.declaration_id },
          select: { object_key: true },
        });
        await tx.portal_declarations.deleteMany({
          where: { user_id: company.id, id: params.declaration_id },
        });
        return rows;
      });
      await Promise.all(
        removedFiles.map((file) => cleanupFileObject(file.object_key)),
      );
      set.status = 204;
    },
    { params: declarationParams },
  );

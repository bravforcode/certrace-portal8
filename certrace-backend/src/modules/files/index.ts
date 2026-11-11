import { Elysia, t } from "elysia";
import { db } from "../../lib/db";
import { config } from "../../lib/config";
import { missing, fail } from "../../lib/errors";
import { companySession } from "../team/workspace";
import { ownedDeclaration } from "../declarations/service";
import { liveLink, liveWritableLink } from "../links/service";
import { allowed, safeName, readUpload, metadata, download } from "./service";
import { cleanupFileObject, saveFileContent } from "./storage";
const query = t.Object({
  filename: t.String({ minLength: 1, maxLength: 255 }),
  docId: t.Optional(t.String({ maxLength: 200 })),
});
const fileParams = t.Object({ file_id: t.String({ format: "uuid" }) });
const selectMeta = { data: true } as const;
export const publicFiles = new Elysia({ prefix: "/api/v1" })
  .get("/uploads/limits", () => ({
    maxBytes: config.maxUploadBytes,
    allowedContentTypes: Object.keys(allowed),
    allowedExtensions: Object.values(allowed),
  }))
  .post(
    "/links/:token/files",
    async ({ params, request, query, set }) => {
      const upload = await readUpload(request);
      const owner = await liveWritableLink(params.token);
      const row = await saveFileContent(
        owner.user_id,
        upload.data,
        upload.content_type,
        (content) =>
          db.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT token FROM smart_links WHERE token=${params.token} FOR UPDATE`;
            const link = await liveWritableLink(params.token, tx);
            const usage = await tx.uploaded_files.aggregate({
              where: { uploaded_via_token: link.token },
              _count: true,
              _sum: { size_bytes: true },
            });
            if (
              usage._count >= 50 ||
              Number(usage._sum.size_bytes ?? 0) + upload.data.length >
                200 * 1024 * 1024
            )
              fail(
                422,
                "LINK_FILE_QUOTA",
                "This link has reached its file quota.",
              );
            return tx.uploaded_files.create({
              data: {
                ...upload,
                ...content,
                user_id: link.user_id,
                declaration_id: link.declaration_id,
                uploaded_via_token: link.token,
                doc_id: query.docId,
                filename: safeName(query.filename),
                size_bytes: upload.data.length,
                storage_key: crypto.randomUUID(),
              },
            });
          }),
      );
      set.status = 201;
      return metadata(row);
    },
    { query, parse: "none" },
  )
  .get("/links/:token/files", async ({ params }) => {
    await liveLink(params.token);
    return {
      files: (
        await db.uploaded_files.findMany({
          where: { uploaded_via_token: params.token },
          omit: selectMeta,
        })
      ).map((r) => metadata({ ...r, data: null })),
    };
  })
  .get(
    "/links/:token/files/:file_id",
    async ({ params }) => {
      await liveLink(params.token);
      const row = await db.uploaded_files.findFirst({
        where: { id: params.file_id, uploaded_via_token: params.token },
      });
      return download(row ?? missing("FILE_NOT_FOUND"));
    },
    {
      params: t.Object({
        token: t.String(),
        file_id: t.String({ format: "uuid" }),
      }),
    },
  );
export const files = new Elysia({ prefix: "/api/v1" })
  .use(companySession)
  .post(
    "/declarations/:declaration_id/files",
    async ({ company, params, request, query, set }) => {
      await ownedDeclaration(company.id, params.declaration_id);
      const upload = await readUpload(request);
      const row = await saveFileContent(
        company.id,
        upload.data,
        upload.content_type,
        (content) =>
          db.uploaded_files.create({
            data: {
              ...upload,
              ...content,
              user_id: company.id,
              declaration_id: params.declaration_id,
              doc_id: query.docId,
              filename: safeName(query.filename),
              size_bytes: upload.data.length,
              storage_key: crypto.randomUUID(),
            },
          }),
      );
      set.status = 201;
      return metadata(row);
    },
    { query, parse: "none" },
  )
  .get("/declarations/:declaration_id/files", async ({ company, params }) => {
    await ownedDeclaration(company.id, params.declaration_id);
    return {
      files: (
        await db.uploaded_files.findMany({
          where: { user_id: company.id, declaration_id: params.declaration_id },
          omit: { data: true },
        })
      ).map((r) => metadata({ ...r, data: null })),
    };
  })
  .get(
    "/files/:file_id",
    async ({ company, params }) =>
      download(
        (await db.uploaded_files.findFirst({
          where: { user_id: company.id, id: params.file_id },
        })) ?? missing("FILE_NOT_FOUND"),
      ),
    { params: fileParams },
  )
  .delete(
    "/files/:file_id",
    async ({ company, params, set }) => {
      const row =
        (await db.uploaded_files.findFirst({
          where: { user_id: company.id, id: params.file_id },
          select: { object_key: true },
        })) ?? missing("FILE_NOT_FOUND");
      const result = await db.uploaded_files.deleteMany({
        where: { user_id: company.id, id: params.file_id },
      });
      if (!result.count) missing("FILE_NOT_FOUND");
      await cleanupFileObject(row.object_key);
      set.status = 204;
    },
    { params: fileParams },
  )
  .put(
    "/account/files/:id",
    async ({ company, params, request, query }) => {
      const upload = await readUpload(request),
        data = { ...upload, filename: safeName(query.filename) };
      if (
        params.id.startsWith("autofill-") &&
        params.id !== `autofill-${upload.sha256}`
      )
        fail(
          422,
          "AUTOFILL_FILE_HASH",
          "A reviewed source file cannot be replaced with different bytes.",
        );
      let previousObjectKey: string | null = null;
      const row = await saveFileContent(
        company.id,
        upload.data,
        upload.content_type,
        (content) =>
          db.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT id FROM users WHERE id=${company.id}::uuid FOR UPDATE`;
            const previous = await tx.account_files.findUnique({
              where: { user_id_id: { user_id: company.id, id: params.id } },
              select: { object_key: true },
            });
            previousObjectKey = previous?.object_key ?? null;
            return tx.account_files.upsert({
              where: { user_id_id: { user_id: company.id, id: params.id } },
              create: {
                user_id: company.id,
                id: params.id,
                ...data,
                ...content,
              },
              update: { ...data, ...content },
              omit: { data: true },
            });
          }),
      );
      await cleanupFileObject(previousObjectKey);
      return { id: row.id, sha256: row.sha256 };
    },
    {
      parse: "none",
      query,
      params: t.Object({ id: t.String({ minLength: 1, maxLength: 250 }) }),
    },
  )
  .get("/account/files/:id", async ({ company, params }) =>
    download(
      (await db.account_files.findUnique({
        where: { user_id_id: { user_id: company.id, id: params.id } },
      })) ?? missing("FILE_NOT_FOUND"),
    ),
  );

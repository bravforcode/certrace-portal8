import { Elysia, t } from "elysia";
import { requireAdmin } from "../admin";
import { authenticated } from "../auth/plugin";
import { companySession } from "../team/workspace";
import * as M from "./model";
import * as S from "./service";

export const workbooks = new Elysia({ prefix: "/api/v1/workbooks" })
  .use(companySession)
  .get(
    "/:installationId",
    ({ company, params }) => S.list(company.id, params.installationId),
    {
      params: M.listParams,
    },
  )
  .get(
    "/:installationId/:year",
    ({ company, params, query }) =>
      S.read(company.id, params.installationId, params.year, query.since),
    {
      params: M.params,
      query: t.Object({ since: t.Optional(t.Numeric({ minimum: 0 })) }),
    },
  )
  .patch(
    "/:installationId/:year/cells",
    ({ company, account, params, body }) =>
      S.patchCells(
        company.id,
        params.installationId,
        params.year,
        account.id,
        body.cells,
      ),
    { params: M.params, body: M.cellsBody },
  )
  .put(
    "/:installationId/:year/meta",
    ({ company, account, params, body }) =>
      S.putMeta(
        company.id,
        params.installationId,
        params.year,
        account.id,
        body.meta,
      ),
    { params: M.params, body: t.Object({ meta: M.meta }) },
  )
  .post(
    "/:installationId/:year/files",
    ({ company, account, params, body }) =>
      S.addFiles(
        company.id,
        params.installationId,
        params.year,
        account.id,
        body.files,
      ),
    { params: M.params, body: M.filesBody },
  )
  .post(
    "/:installationId/:year/reset-leftovers",
    ({ company, account, params }) =>
      S.resetLeftovers(
        company.id,
        params.installationId,
        params.year,
        account.id,
      ),
    { params: M.params },
  );

/** Certrace marks an uploaded file reviewed (or pending again); the customer sees it on the file's dots. */
export const workbooksAdmin = new Elysia({ prefix: "/api/admin/workbooks" })
  .use(authenticated)
  .put(
    "/:companyId/:installationId/:year/files/:fileId/review",
    ({ account, params, body }) => {
      requireAdmin(account);
      return S.reviewFile(
        params.companyId,
        params.installationId,
        params.year,
        account.id,
        params.fileId,
        body.reviewed,
      );
    },
    {
      params: t.Object({
        companyId: t.String({ format: "uuid" }),
        installationId: M.listParams.properties.installationId,
        year: M.params.properties.year,
        fileId: t.String({ minLength: 1, maxLength: 64 }),
      }),
      body: t.Object({ reviewed: t.Boolean() }),
    },
  );

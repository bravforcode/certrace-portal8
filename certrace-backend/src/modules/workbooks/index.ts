import { Elysia, t } from "elysia";
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

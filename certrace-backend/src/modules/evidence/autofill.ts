import { Elysia, t } from "elysia";
import { companySession } from "../team/workspace";
import {
  startRun,
  getRun,
  recentRuns,
  applyRun,
  requireAutofillPlan,
} from "./autofill-service";
import { readUpload, safeName } from "../files/service";
const id = t.Object({ id: t.String({ format: "uuid" }) });
export const reportAutofill = new Elysia({
  prefix: "/api/v1/evidence/autofill",
})
  .use(companySession)
  .get("/capabilities", ({ company }) => {
    let allowed = true;
    try {
      requireAutofillPlan(company);
    } catch {
      allowed = false;
    }
    return {
      available: Boolean(
        process.env.DEEPSEEK_API_KEY?.trim() &&
          process.env.NOVITA_API_KEY?.trim(),
      ),
      textAvailable: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
      allowed,
      maxPages: 20,
    };
  })
  .get(
    "/runs",
    ({ company, query }) => recentRuns(company.id, query.workspaceId),
    { query: t.Object({ workspaceId: t.String({ maxLength: 200 }) }) },
  )
  .post(
    "/runs",
    ({ company, body }) => {
      requireAutofillPlan(company);
      return startRun(company.id, body);
    },
    {
      body: t.Object({
        workspaceId: t.String({ minLength: 1, maxLength: 200 }),
        fileId: t.String({ minLength: 1, maxLength: 250 }),
        month: t.Optional(t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" })),
        retry: t.Optional(t.Boolean()),
      }),
    },
  )
  .post(
    "/runs/document",
    async ({ company, request, query }) => {
      requireAutofillPlan(company);
      const upload = await readUpload(request);
      return startRun(company.id, {
        workspaceId: query.workspaceId,
        month: query.month,
        retry: true,
        document: { ...upload, filename: safeName(query.filename) },
      });
    },
    {
      parse: "none",
      query: t.Object({
        workspaceId: t.String({ minLength: 1, maxLength: 200 }),
        filename: t.String({ minLength: 1, maxLength: 255 }),
        month: t.Optional(t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" })),
      }),
    },
  )
  .get("/runs/:id", ({ company, params }) => getRun(company.id, params.id), {
    params: id,
  })
  .post(
    "/runs/:id/apply",
    ({ company, account, params, body }) => {
      requireAutofillPlan(company);
      return applyRun(company.id, params.id, body.selections, account.id);
    },
    {
      params: id,
      body: t.Object({
        selections: t.Array(
          t.Object({
            id: t.String({ format: "uuid" }),
            value: t.Optional(
              t.Union([
                t.String({ maxLength: 6000 }),
                t.Number(),
                t.Boolean(),
                t.Array(t.String({ maxLength: 1000 }), { maxItems: 50 }),
              ]),
            ),
          }),
          { minItems: 1, maxItems: 120 },
        ),
      }),
    },
  );

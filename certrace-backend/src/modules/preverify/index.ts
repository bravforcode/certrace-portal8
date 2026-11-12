import { Elysia, t } from "elysia";
import { requireAdmin } from "../admin";
import { authenticated } from "../auth/plugin";
import { companySession } from "../team/workspace";
import { rateLimit } from "../../lib/security";
import * as S from "./service";

const statuses = t.Union([
  t.Literal("ai_flagged"),
  t.Literal("team_review"),
  t.Literal("approved"),
  t.Literal("changes_requested"),
]);
// Same shapes as the workbook params (workbooks/model.ts). Only CBAM has a catalogue to check against.
const key = t.Object({
  installationId: t.String({ pattern: "^[A-Za-z0-9_-]{1,64}$" }),
  year: t.Numeric({ minimum: 2000, maximum: 2100 }),
  standardId: t.Literal("cbam"),
});

export const preverifications = new Elysia({ prefix: "/api/v1/preverifications" })
  .use(companySession)
  .post(
    "/",
    async ({ company, account, body }) => {
      await rateLimit(`preverify:${company.id}`, 10, 3600);
      return S.submit(company.id, account.id, body);
    },
    { body: key },
  )
  .get("/", ({ company, query }) => S.latest(company.id, query), { query: key });

export const preverifyAdmin = new Elysia({ prefix: "/api/admin/preverifications" })
  .use(authenticated)
  .get(
    "/",
    ({ account, query }) => {
      requireAdmin(account);
      return S.adminList(query.status ?? "team_review");
    },
    { query: t.Object({ status: t.Optional(statuses) }) },
  )
  .get(
    "/:id",
    ({ account, params }) => {
      requireAdmin(account);
      return S.adminGet(params.id);
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  )
  .post(
    "/:id/decision",
    ({ account, params, body }) => {
      requireAdmin(account);
      return S.decide(params.id, account.id, body.decision, body.note);
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        decision: t.Union([t.Literal("approved"), t.Literal("changes_requested")]),
        note: t.String({ maxLength: 2000 }),
      }),
    },
  );

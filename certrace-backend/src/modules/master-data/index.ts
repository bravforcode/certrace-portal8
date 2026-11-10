import { Elysia, t } from "elysia";
import { companySession } from "../team/workspace";
import { listMasters, updateMaster } from "./service";
const text = t.Optional(t.Union([t.String({ maxLength: 1000000 }), t.Null()]));
const params = t.Object({ id: t.String({ format: "uuid" }) });
export const masterData = new Elysia({ prefix: "/api/v1/master-data" })
  .use(companySession)
  .get("", ({ company }) => listMasters(company.id))
  .patch(
    "/organizations/:id",
    ({ company, account, params, body }) =>
      updateMaster(
        company.id,
        "organization",
        params.id,
        body.revision,
        body.fields,
        account.id,
      ),
    {
      params,
      body: t.Object({
        revision: t.Integer({ minimum: 1 }),
        fields: t.Object({
          name: text,
          registration: text,
          address: text,
          country: text,
          contact_name: text,
          contact_email: text,
          contact_phone: text,
        }),
      }),
    },
  )
  .patch(
    "/products/:id",
    ({ company, account, params, body }) =>
      updateMaster(
        company.id,
        "product",
        params.id,
        body.revision,
        body.fields,
        account.id,
      ),
    {
      params,
      body: t.Object({
        revision: t.Integer({ minimum: 1 }),
        fields: t.Object({
          name: text,
          cn_code: text,
          description: text,
          unit: text,
          benchmark: text,
        }),
      }),
    },
  );

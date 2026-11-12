import { t } from "elysia";
import { jsonObject } from "../../lib/json";
export const LinkModel = {
  create: t.Object({
    supplierId: t.String({ minLength: 1, maxLength: 200 }),
    month: t.Optional(
      t.Nullable(t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" })),
    ),
    expiresInDays: t.Optional(
      t.Integer({ minimum: 1, maximum: 365, default: 90 }),
    ),
  }),
  itemCreate: t.Object({
    installationId: t.String({ pattern: "^[A-Za-z0-9_-]{1,64}$" }),
    year: t.Integer({ minimum: 2000, maximum: 2100 }),
    itemKey: t.String({ minLength: 1, maxLength: 200 }),
  }),
  itemSubmit: t.Object({
    values: t.Record(
      t.String({ maxLength: 200 }),
      t.Union([t.String({ maxLength: 10_000 }), t.Null()]),
      { minProperties: 1, maxProperties: 2000 },
    ),
  }),
  save: t.Object({ state: jsonObject }),
  submit: t.Object({
    state: jsonObject,
    attestation: jsonObject,
    check: t.Optional(t.Nullable(jsonObject)),
  }),
  revision: t.Object({
    note: t.Optional(t.String({ maxLength: 4000 })),
    areas: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 100 })),
    action: t.Optional(
      t.Union([t.Literal("revision"), t.Literal("approve_edit")]),
    ),
    unlocked: t.Optional(t.Array(t.String(), { maxItems: 1000 })),
    unlockedDocs: t.Optional(t.Array(t.String(), { maxItems: 1000 })),
  }),
};

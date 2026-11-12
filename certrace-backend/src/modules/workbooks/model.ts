import { t } from "elysia";

export const CELL_KEY = /^[a-z0-9-]{1,32}:\d{1,5}:[a-z0-9_-]{1,40}$/;
export const MAX_BYTES = 5_000_000;

const installationId = t.String({ pattern: "^[A-Za-z0-9_-]{1,64}$" });
export const listParams = t.Object({ installationId });
export const params = t.Object({
  installationId,
  year: t.Numeric({ minimum: 2000, maximum: 2100 }),
});
// Shape copied from certrace-portal/lib/workspace-store.ts (WorkspaceYear, WorkspaceFile).
// Elysia silently strips keys not listed here (e.g. the store's `edits`) instead of rejecting them.
export const meta = t.Object(
  {
    status: t.Optional(t.Union([t.Literal("syncing"), t.Literal("ready")])),
    files: t.Optional(
      t.Array(
        t.Object({
          id: t.String({ maxLength: 64 }),
          name: t.String({ maxLength: 255 }),
          size: t.Integer({ minimum: 0 }),
          type: t.String({ maxLength: 120 }),
          description: t.String({ maxLength: 1000 }),
          // When Certrace finished reviewing the file. Absent means the review is still pending.
          reviewedAt: t.Optional(t.String({ format: "date-time" })),
        }),
        { maxItems: 200 },
      ),
    ),
    confirmedAt: t.Optional(t.String({ format: "date-time" })),
    copiedFrom: t.Optional(t.Integer({ minimum: 2000, maximum: 2100 })),
    blank: t.Optional(t.Boolean()),
    revealed: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);
export const cellsBody = t.Object({
  cells: t.Record(
    t.String(),
    t.Union([t.String({ maxLength: 10_000 }), t.Null()]),
    {
      minProperties: 1,
      maxProperties: 2000,
    },
  ),
});

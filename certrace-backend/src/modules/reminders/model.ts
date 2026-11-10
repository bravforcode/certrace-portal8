import { t } from "elysia";
export const reminder = t.Object({
  recipient: t.String({ format: "email" }),
  supplierName: t.String({ minLength: 1, maxLength: 200 }),
  periodLabel: t.String({ minLength: 1, maxLength: 200 }),
  dueDate: t.String({ format: "date" }),
  linkUrl: t.String({ format: "uri", maxLength: 2000 }),
  locale: t.Optional(t.Nullable(t.String({ maxLength: 16 }))),
  accountLocked: t.Optional(t.Boolean()),
});
export type ReminderInput = typeof reminder.static;

import { Elysia, t } from "elysia";
import { timingSafeEqual } from "node:crypto";
import { db } from "../../lib/db";
import { config } from "../../lib/config";
import { fail } from "../../lib/errors";
import { companySession } from "../team/workspace";
import { reminder } from "./model";
import * as Reminders from "./service";
import { runTrialEmails } from "./trial-emails";
export const reminders = new Elysia({ prefix: "/api/v1/reminder-subjects" })
  .use(companySession)
  .get("", async ({ company }) => ({
    subjects: (
      await db.reminder_subjects.findMany({ where: { user_id: company.id } })
    ).map(Reminders.view),
  }))
  .put(
    "/:subject_key",
    ({ company, params, body }) =>
      Reminders.register(company.id, params.subject_key, body),
    {
      body: reminder,
      params: t.Object({
        subject_key: t.String({ minLength: 1, maxLength: 250 }),
      }),
    },
  )
  .post("/:subject_key/sent", ({ company, params }) =>
    Reminders.mark(company.id, params.subject_key, "sent"),
  )
  .post("/:subject_key/answered", ({ company, params }) =>
    Reminders.mark(company.id, params.subject_key, "answered"),
  )
  .delete("/:subject_key", ({ company, params }) =>
    Reminders.mark(company.id, params.subject_key, "cancelled"),
  );
function requireJobsToken(authorization?: string) {
  if (!config.jobsToken) fail(404, "NOT_FOUND", "Not found.");
  const actual = Buffer.from(authorization?.replace(/^Bearer\s+/i, "") ?? ""),
    expected = Buffer.from(config.jobsToken);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    fail(401, "UNAUTHORIZED", "Invalid jobs token.");
}

export const jobs = new Elysia({ prefix: "/api/internal/jobs" })
  .post(
    "/send-reminders",
    ({ headers, query }) => {
      requireJobsToken(headers.authorization);
      return Reminders.run(query.dry_run ?? false);
    },
    {
      query: t.Object({ dry_run: t.Optional(t.BooleanString()) }),
      detail: { hide: true },
    },
  )
  .post(
    "/trial-emails",
    ({ headers, query }) => {
      requireJobsToken(headers.authorization);
      return runTrialEmails(new Date(), query.dry_run ?? false);
    },
    {
      query: t.Object({ dry_run: t.Optional(t.BooleanString()) }),
      detail: { hide: true },
    },
  );

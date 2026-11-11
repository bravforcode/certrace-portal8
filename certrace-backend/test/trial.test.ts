import { afterAll, expect, test } from "bun:test";
import { trialEnded, trialEndsAt, trialWriteOpen } from "../src/modules/auth/trial";
import { runTrialEmails } from "../src/modules/reminders/trial-emails";
import { db } from "../src/lib/db";
import { account, cleanup } from "./helpers";

afterAll(cleanup);

const start = new Date("2026-11-01T00:00:00Z");

test("trial lasts exactly 30 days", () => {
  expect(trialEndsAt({ trial_started_at: start }).toISOString()).toBe("2026-12-01T00:00:00.000Z");
});

test("ended from the 30-day instant on the trial plan", () => {
  const u = { plan_id: "trial", trial_started_at: start };
  expect(trialEnded(u, new Date("2026-11-30T23:59:59Z"))).toBe(false);
  expect(trialEnded(u, new Date("2026-12-01T00:00:00Z"))).toBe(true);
  expect(trialEnded({ ...u, plan_id: "standard" }, new Date("2030-01-01"))).toBe(false);
});

// After the trial, settings and team housekeeping stay writable; customer data does not.
test("the post-trial allowlist opens only exact method and route pairs", () => {
  const b = "http://localhost/api/v1";
  expect(trialWriteOpen("PUT", `${b}/account/records/certrace%3Anotification-prefs`)).toBe(true);
  expect(trialWriteOpen("PUT", `${b}/account/records/certrace%3Alang`)).toBe(true);
  expect(trialWriteOpen("PUT", `${b}/account/records/certrace%3Aprofile`)).toBe(false);
  expect(trialWriteOpen("POST", `${b}/account/records/import`)).toBe(false);
  expect(trialWriteOpen("PATCH", `${b}/master-data/organizations/abc`)).toBe(true);
  expect(trialWriteOpen("PATCH", `${b}/master-data/products/abc`)).toBe(false);
  expect(trialWriteOpen("DELETE", `${b}/team/members/abc`)).toBe(true);
  expect(trialWriteOpen("DELETE", `${b}/team/members/abc/extra`)).toBe(false);
  expect(trialWriteOpen("POST", `${b}/team/invitations`)).toBe(true);
  expect(trialWriteOpen("GET", `${b}/team/invitations`)).toBe(false);
  expect(trialWriteOpen("PATCH", `${b}/workbooks/inst/2026/cells`)).toBe(false);
});

// Each reminder goes out once per trial end date, even when the daily job runs twice.
test("sends the 7-day reminder once, then the ended notice after the end", async () => {
  const a = await account(true);
  const now = new Date();
  await db.users.update({
    where: { id: a.user.id },
    data: { trial_started_at: new Date(now.getTime() - 23.5 * 86_400_000) },
  });
  const first = await runTrialEmails(now);
  expect(first.sent).toContainEqual({ userId: a.user.id, kind: "trial_ending_7" });
  const second = await runTrialEmails(now);
  expect(second.sent.find((s) => s.userId === a.user.id)).toBeUndefined();
  await db.users.update({
    where: { id: a.user.id },
    data: { trial_started_at: new Date(now.getTime() - 31 * 86_400_000) },
  });
  const ended = await runTrialEmails(now);
  expect(ended.sent).toContainEqual({ userId: a.user.id, kind: "trial_ended" });
});

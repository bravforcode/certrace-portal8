import { afterAll, afterEach, beforeEach, describe, expect, test } from "bun:test";
import { trialEnded, trialEndsAt, trialWriteOpen } from "../src/modules/auth/trial";
import { runTrialEmails } from "../src/modules/reminders/trial-emails";
import { db } from "../src/lib/db";
import { account, call, cleanup } from "./helpers";
import { app } from "../src/app";
import { hash, token as randomToken } from "../src/lib/security";

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

// Reminder tests share the DB with other suites, so assertions read email_deliveries
// for the users created here and never the global counts.
const DAY = 86_400_000;
const savedMode = process.env.CERTRACE_EMAIL_DELIVERY;
const setMode = (m: string | undefined) => {
  if (m === undefined) delete process.env.CERTRACE_EMAIL_DELIVERY;
  else process.env.CERTRACE_EMAIL_DELIVERY = m;
};

// Trial started `ago` days before `now`, approved and ready.
async function trialUser(now: Date, ago: number) {
  const a = await account(true);
  await db.users.update({
    where: { id: a.user.id },
    data: { trial_started_at: new Date(now.getTime() - ago * DAY) },
  });
  return a.user.id as string;
}

// Kinds recorded for a user, without the trial-end date suffix.
async function kindsOf(userId: string) {
  const rows = await db.email_deliveries.findMany({
    where: { user_id: userId },
    select: { kind: true },
  });
  return rows.map((r) => r.kind.split(":")[0]).sort();
}

describe("trial reminder emails", () => {
  beforeEach(() => setMode("console"));
  afterEach(() => setMode(savedMode));

  test("5 days left sends only the 7-day reminder", async () => {
    const now = new Date();
    const id = await trialUser(now, 25);
    const first = await runTrialEmails(now);
    expect(first.sent).toBeGreaterThanOrEqual(1);
    expect(await kindsOf(id)).toEqual(["trial_ending_7"]);
  });

  test("half a day left with no earlier reminder sends only the 1-day reminder", async () => {
    const now = new Date();
    const id = await trialUser(now, 29.5);
    await runTrialEmails(now);
    expect(await kindsOf(id)).toEqual(["trial_ending_1"]);
  });

  test("each reminder is sent once when the daily job runs twice", async () => {
    const now = new Date();
    const id = await trialUser(now, 25);
    await runTrialEmails(now);
    const again = await runTrialEmails(now);
    expect(again.skipped).toBeGreaterThanOrEqual(1);
    expect(await kindsOf(id)).toEqual(["trial_ending_7"]);
  });

  test("the ended notice goes out once after the 30-day end", async () => {
    const now = new Date();
    const id = await trialUser(now, 31);
    await runTrialEmails(now);
    await runTrialEmails(now);
    expect(await kindsOf(id)).toEqual(["trial_ended"]);
  });

  // The job only reaches 7 days past the end, so a trial that ended long ago is not mailed.
  test("a trial that ended 60 days ago gets nothing", async () => {
    const now = new Date();
    const id = await trialUser(now, 60);
    await runTrialEmails(now);
    expect(await kindsOf(id)).toEqual([]);
  });

  // An admin extension moves trial_started_at, which moves the end date, so reminders resend.
  test("after an extension the next run sends the reminder for the new end date", async () => {
    const now = new Date();
    const id = await trialUser(now, 29.5);
    await runTrialEmails(now);
    expect(await kindsOf(id)).toEqual(["trial_ending_1"]);
    await db.users.update({
      where: { id },
      data: { trial_started_at: new Date(now.getTime() - 24 * DAY) },
    });
    await runTrialEmails(now);
    expect(await kindsOf(id)).toEqual(["trial_ending_1", "trial_ending_7"]);
  });

  // A failed send must release its claim so the next run can deliver it.
  test("a failed send releases the claim and a later run delivers", async () => {
    const now = new Date();
    const id = await trialUser(now, 25);
    setMode("smtp");
    delete process.env.CERTRACE_SMTP_HOST;
    const failing = await runTrialEmails(now);
    expect(failing.failed).toBeGreaterThanOrEqual(1);
    expect(await kindsOf(id)).toEqual([]);
    setMode("console");
    await runTrialEmails(now);
    expect(await kindsOf(id)).toEqual(["trial_ending_7"]);
  });

  test("dry run reports would-send counts and writes no delivery rows", async () => {
    const now = new Date();
    const id = await trialUser(now, 25);
    const r = await runTrialEmails(now, true);
    expect(r.dryRun).toBe(true);
    expect(r.sent).toBeGreaterThanOrEqual(1);
    expect(await kindsOf(id)).toEqual([]);
  });

  // With delivery off nothing can be sent, so the job behaves like a dry run.
  test("delivery mode off behaves like a dry run", async () => {
    const now = new Date();
    const id = await trialUser(now, 25);
    setMode(undefined);
    const r = await runTrialEmails(now);
    expect(r.dryRun).toBe(true);
    expect(await kindsOf(id)).toEqual([]);
  });

  test("only ready, approved, active trial users on the trial plan are reminded", async () => {
    const now = new Date();
    const cases = [
      { plan_id: "standard" },
      { ready: false },
      { status: "SUSPENDED", suspended_at: new Date() },
      { approved_at: null },
    ];
    for (const data of cases) {
      const id = await trialUser(now, 25);
      await db.users.update({ where: { id }, data });
      await runTrialEmails(now);
      expect(await kindsOf(id)).toEqual([]);
    }
  });
});

// Public smart-link writes are customer data writes: once the owner's trial has
// ended they return TRIAL_ENDED, while the public read stays open (D4).
describe("public link writes after the trial", () => {
  const EXPIRED = () => new Date(Date.now() - 31 * DAY);

  async function publicLink() {
    const a = await account();
    const id = crypto.randomUUID();
    const decl = await call(
      `/api/v1/declarations/${id}`,
      "PUT",
      { id, name: "Annual", suppliers: [{ id: "one", name: "Mine" }], requests: [] },
      a.cookie,
    );
    expect(decl.status).toBe(200);
    const minted = await call(
      `/api/v1/declarations/${id}/links`,
      "POST",
      { supplierId: "one" },
      a.cookie,
    );
    expect(minted.status).toBe(201);
    const { token } = await minted.json();
    return { owner: a, token };
  }

  test("link save and submit return TRIAL_ENDED after the trial, the GET stays open", async () => {
    const { owner, token } = await publicLink();
    const state = { values: { a: "original" } };
    const before = await call(`/api/v1/links/${token}/state`, "PUT", { state });
    expect(before.status).toBe(200);
    await db.users.update({
      where: { id: owner.user.id },
      data: { trial_started_at: EXPIRED() },
    });
    const save = await call(`/api/v1/links/${token}/state`, "PUT", {
      state: { values: { a: "changed" } },
    });
    expect(save.status).toBe(403);
    expect((await save.json()).detail.code).toBe("TRIAL_ENDED");
    const submit = await call(`/api/v1/links/${token}/submit`, "POST", {
      state,
      attestation: { signatoryName: "Tester", signatoryRole: "Owner" },
    });
    expect(submit.status).toBe(403);
    expect((await submit.json()).detail.code).toBe("TRIAL_ENDED");
    const get = await call(`/api/v1/links/${token}`);
    expect(get.status).toBe(200);
  }, 60_000);

  test("public file upload and evidence extraction return TRIAL_ENDED after the trial", async () => {
    const { owner, token } = await publicLink();
    await db.users.update({
      where: { id: owner.user.id },
      data: { trial_started_at: EXPIRED() },
    });
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const upload = await app.handle(
      new Request(`http://localhost/api/v1/links/${token}/files?filename=a.pdf`, {
        method: "POST",
        headers: { "content-type": "application/pdf" },
        body: bytes,
      }),
    );
    expect(upload.status).toBe(403);
    expect((await upload.json()).detail.code).toBe("TRIAL_ENDED");
    const extract = await app.handle(
      new Request(`http://localhost/api/v1/links/${token}/evidence/extract`, {
        method: "POST",
        headers: { "content-type": "application/pdf" },
        body: bytes,
      }),
    );
    expect(extract.status).toBe(403);
    expect((await extract.json()).detail.code).toBe("TRIAL_ENDED");
  }, 60_000);
});

// Accepting an invite joins the owner's company, so it is refused once that
// owner's trial has ended, the same as inviting a teammate is.
test("accepting a team invite into a company whose trial ended returns TRIAL_ENDED", async () => {
  const owner = await account();
  const member = await account();
  await db.accounts.upsert({
    where: { id: owner.user.id },
    create: { id: owner.user.id },
    update: {},
  });
  const secret = randomToken();
  await db.team_invitations.create({
    data: {
      account_id: owner.user.id,
      email: member.email.toLowerCase(),
      token_hash: hash(secret),
      expires_at: new Date(Date.now() + 7 * DAY),
    },
  });
  await db.users.update({
    where: { id: owner.user.id },
    data: { trial_started_at: new Date(Date.now() - 31 * DAY) },
  });
  const r = await call("/api/v1/team/accept", "POST", { token: secret }, member.cookie);
  expect(r.status).toBe(403);
  expect((await r.json()).detail.code).toBe("TRIAL_ENDED");
  const seat = await db.account_members.findFirst({
    where: { account_id: owner.user.id, user_id: member.user.id },
  });
  expect(seat).toBeNull();
}, 60_000);

import { afterAll, describe, expect, test } from "bun:test";
import { account, admin, call, cleanup } from "./helpers";
import { db } from "../src/lib/db";

afterAll(cleanup);

describe("login", () => {
  // A universal password lets anyone who learns it sign in as any customer.
  // Run with CERTRACE_MASTER_PASSWORD set on the command line: config is read at import.
  test("CERTRACE_MASTER_PASSWORD no longer signs in to another account", async () => {
    const a = await account();
    const r = await call("/api/auth/login", "POST", {
      email: a.email,
      password: "universal-password-1",
    });
    expect(r.status).toBe(401);
  });
});

describe("approval", () => {
  // The trial must not run while the customer waits for us.
  test("first approval starts the 30-day trial and records approved_at", async () => {
    const a = await account(false);
    await db.users.update({
      where: { id: a.user.id },
      data: { trial_started_at: new Date("2020-01-01") },
    });
    const boss = await admin();
    const r = await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: true }, boss.cookie);
    expect(r.status).toBe(200);
    const u = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    expect(u.approved_at).not.toBeNull();
    expect(Date.now() - u.trial_started_at.getTime()).toBeLessThan(60_000);
  });

  test("re-approving after a revoke keeps the original trial start", async () => {
    const a = await account(false);
    const boss = await admin();
    await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: true }, boss.cookie);
    const first = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: false }, boss.cookie);
    await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: true }, boss.cookie);
    const again = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    expect(again.trial_started_at.toISOString()).toBe(first.trial_started_at.toISOString());
  });

  // Approval mail must arrive once: a re-approval after a revoke sends nothing new.
  test("approval email is recorded once across re-approvals", async () => {
    const a = await account(false);
    const boss = await admin();
    for (const ready of [true, false, true])
      await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready }, boss.cookie);
    const rows = await db.email_deliveries.findMany({
      where: { user_id: a.user.id, kind: "account_approved" },
    });
    expect(rows).toHaveLength(1);
  });

  test("register stores the locale for later emails", async () => {
    const a = await account(false, { locale: "th" });
    expect(a.user.locale).toBe("th");
  });
});

describe("onboarding", () => {
  // The customer must get exactly one "received" email however often the
  // onboarding step is retried.
  test("completing onboarding twice records one application email", async () => {
    const a = await account(false);
    await call("/api/auth/onboarded", "POST", undefined, a.cookie);
    await call("/api/auth/onboarded", "POST", undefined, a.cookie);
    const rows = await db.email_deliveries.findMany({
      where: { user_id: a.user.id, kind: "application_received" },
    });
    expect(rows).toHaveLength(1);
  });
});

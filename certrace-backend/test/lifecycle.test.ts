import { afterAll, afterEach, describe, expect, spyOn, test } from "bun:test";
import { account, admin, call, cleanup, editorOf } from "./helpers";
import { db } from "../src/lib/db";
import { notify } from "../src/lib/notify";

afterAll(cleanup);

// Tests that change the email mode restore the real value afterwards.
const savedMode = process.env.CERTRACE_EMAIL_DELIVERY;
afterEach(() => {
  if (savedMode === undefined) delete process.env.CERTRACE_EMAIL_DELIVERY;
  else process.env.CERTRACE_EMAIL_DELIVERY = savedMode;
});
// SMTP mode without a host makes sendEmail throw before any network call,
// which is how these tests simulate a failed send deterministically.
const failingMail = () => {
  process.env.CERTRACE_EMAIL_DELIVERY = "smtp";
  delete process.env.CERTRACE_SMTP_HOST;
};

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
    expect(again.approved_at?.toISOString()).toBe(first.approved_at?.toISOString());
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

  // A failed approval mail must not undo the approval, and approving again
  // must retry the mail (the failed delivery row was removed).
  test("a failed approval mail is retried by approving again", async () => {
    const a = await account(false);
    const boss = await admin();
    failingMail();
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    try {
      const first = await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: true }, boss.cookie);
      expect(first.status).toBe(200);
    } finally {
      errorSpy.mockRestore();
    }
    expect(await db.email_deliveries.count({ where: { user_id: a.user.id, kind: "account_approved" } })).toBe(0);
    process.env.CERTRACE_EMAIL_DELIVERY = "console";
    const logSpy = spyOn(console, "info").mockImplementation(() => {});
    try {
      await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: true }, boss.cookie);
      const toCustomer = logSpy.mock.calls.filter(
        ([m]) => (m as { to?: string }).to === a.email,
      );
      expect(toCustomer).toHaveLength(1);
    } finally {
      logSpy.mockRestore();
    }
    expect(await db.email_deliveries.count({ where: { user_id: a.user.id, kind: "account_approved" } })).toBe(1);
  });

  // Accounts approved before the lifecycle emails existed were backfilled with a
  // delivery row (migration 202611110004). Re-saving one must not mail it again.
  test("a legacy ready account with the backfilled row gets no approval mail on re-save", async () => {
    const a = await account(true);
    // Same statement as the backfill migration, scoped to this account.
    await db.$executeRaw`INSERT INTO public.email_deliveries (user_id, kind) SELECT id, 'account_approved' FROM public.users WHERE id = ${a.user.id}::uuid AND ready ON CONFLICT DO NOTHING`;
    const boss = await admin();
    process.env.CERTRACE_EMAIL_DELIVERY = "console";
    const logSpy = spyOn(console, "info").mockImplementation(() => {});
    try {
      const r = await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: true }, boss.cookie);
      expect(r.status).toBe(200);
      const toCustomer = logSpy.mock.calls.filter(
        ([m]) => (m as { to?: string }).to === a.email,
      );
      expect(toCustomer).toHaveLength(0);
    } finally {
      logSpy.mockRestore();
    }
    expect(await db.email_deliveries.count({ where: { user_id: a.user.id, kind: "account_approved" } })).toBe(1);
  });

  test("register stores the locale for later emails", async () => {
    const a = await account(false, { locale: "th" });
    expect(a.user.locale).toBe("th");
    const row = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    expect(row.locale).toBe("th");
  });

  test("a non-admin cannot approve (403)", async () => {
    const target = await account(false);
    const caller = await account(true);
    const r = await call(`/api/admin/users/${target.user.id}/ready`, "PUT", { ready: true }, caller.cookie);
    expect(r.status).toBe(403);
  });

  test("approving an unknown account is 404", async () => {
    const boss = await admin();
    const r = await call(
      `/api/admin/users/${crypto.randomUUID()}/ready`,
      "PUT",
      { ready: true },
      boss.cookie,
    );
    expect(r.status).toBe(404);
  });
});

describe("trial enforcement", () => {
  const EXPIRED = () => new Date(Date.now() - 31 * 86_400_000);
  const T = 60_000;

  // Customer data is refused after day 30, but reads and settings stay open (D4).
  test("after 30 days data writes return TRIAL_ENDED but reads and settings still work", async () => {
    const a = await account();
    await db.users.update({ where: { id: a.user.id }, data: { trial_started_at: EXPIRED() } });
    const data = await call(
      "/api/v1/account/records/certrace%3Aprofile",
      "PUT",
      { value: { name: "x" }, revision: 0 },
      a.cookie,
    );
    expect(data.status).toBe(403);
    expect((await data.json()).detail.code).toBe("TRIAL_ENDED");
    const cells = await call(
      "/api/v1/workbooks/inst-1/2026/cells",
      "PATCH",
      { cells: { "products:0:item": "Steel" } },
      a.cookie,
    );
    expect(cells.status).toBe(403);
    expect((await cells.json()).detail.code).toBe("TRIAL_ENDED");
    const get = await call("/api/v1/account/records", "GET", undefined, a.cookie);
    expect(get.status).toBe(200);
    const prefs = await call(
      "/api/v1/account/records/certrace%3Anotification-prefs",
      "PUT",
      { value: { product: true }, revision: 0 },
      a.cookie,
    );
    expect(prefs.status).toBe(200);
  }, T);

  test("an editor whose own trial ended can write when the owner is on a paid plan", async () => {
    const owner = await account();
    const member = await account();
    await db.users.update({ where: { id: owner.user.id }, data: { plan_id: "standard" } });
    await db.users.update({ where: { id: member.user.id }, data: { trial_started_at: EXPIRED() } });
    const h = await editorOf(owner, member);
    const r = await call(
      "/api/v1/workbooks/inst-1/2026/cells",
      "PATCH",
      { cells: { "products:0:item": "Steel" } },
      member.cookie,
      h,
    );
    expect(r.status).toBe(200);
  }, T);

  test("a paid owner whose trial_started_at is 31 days old can write", async () => {
    const a = await account();
    await db.users.update({
      where: { id: a.user.id },
      data: { plan_id: "standard", trial_started_at: EXPIRED() },
    });
    const r = await call(
      "/api/v1/workbooks/inst-1/2026/cells",
      "PATCH",
      { cells: { "products:0:item": "Steel" } },
      a.cookie,
    );
    expect(r.status).toBe(200);
  }, T);

  // Auth is outside companySession, so it can never be refused by the trial.
  test("auth routes stay open after the trial ends", async () => {
    const a = await account();
    await db.users.update({ where: { id: a.user.id }, data: { trial_started_at: EXPIRED() } });
    const r = await call("/api/auth/onboarded", "POST", undefined, a.cookie);
    expect((await r.clone().json().catch(() => ({}))).detail?.code).not.toBe("TRIAL_ENDED");
    expect(r.status).not.toBe(403);
  }, T);

  test("after the trial, team removal and organization edits stay open but product edits do not", async () => {
    const owner = await account();
    await db.users.update({ where: { id: owner.user.id }, data: { trial_started_at: EXPIRED() } });
    const member = await call(
      `/api/v1/team/members/${crypto.randomUUID()}`,
      "DELETE",
      undefined,
      owner.cookie,
    );
    expect((await member.clone().json().catch(() => ({}))).detail?.code).not.toBe("TRIAL_ENDED");
    const org = await call(
      `/api/v1/master-data/organizations/${crypto.randomUUID()}`,
      "PATCH",
      { revision: 1, fields: { name: "Org", registration: "R", address: "A", country: "TH", contact_name: "C", contact_email: "c@example.invalid", contact_phone: "0" } },
      owner.cookie,
    );
    expect((await org.clone().json().catch(() => ({}))).detail?.code).not.toBe("TRIAL_ENDED");
    const product = await call(
      `/api/v1/master-data/products/${crypto.randomUUID()}`,
      "PATCH",
      { revision: 1, fields: { name: "P", cn_code: "1", description: "d", unit: "kg", benchmark: "b" } },
      owner.cookie,
    );
    expect(product.status).toBe(403);
    expect((await product.json()).detail.code).toBe("TRIAL_ENDED");
  }, T);
});

describe("notify", () => {
  test("a once-only email is recorded and a second call sends nothing", async () => {
    const a = await account(false);
    process.env.CERTRACE_EMAIL_DELIVERY = "console";
    const user = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    const logSpy = spyOn(console, "info").mockImplementation(() => {});
    try {
      expect(await notify(user, "legal_updated", {}, true)).toBe(true);
      expect(await notify(user, "legal_updated", {}, true)).toBe(false);
      expect(logSpy).toHaveBeenCalledTimes(1);
    } finally {
      logSpy.mockRestore();
    }
  });

  test("a failed send leaves no delivery row, so a retry can send", async () => {
    const a = await account(false);
    const user = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    failingMail();
    let failed = false;
    try {
      await notify(user, "legal_updated", {}, true);
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
    expect(await db.email_deliveries.count({ where: { user_id: user.id, kind: "legal_updated" } })).toBe(0);
  });
});

describe("onboarding", () => {
  // The customer must get exactly one "received" email however often the
  // onboarding step is retried.
  test("completing onboarding twice records one application email", async () => {
    const a = await account(false);
    await Promise.all([
      call("/api/auth/onboarded", "POST", undefined, a.cookie),
      call("/api/auth/onboarded", "POST", undefined, a.cookie),
    ]);
    const rows = await db.email_deliveries.findMany({
      where: { user_id: a.user.id, kind: "application_received" },
    });
    expect(rows).toHaveLength(1);
  });

  // Admins are told about a new applicant once, not on every retry.
  test("completing onboarding twice sends the admin mail once", async () => {
    const boss = await admin();
    const a = await account(false);
    process.env.CERTRACE_EMAIL_DELIVERY = "console";
    const logSpy = spyOn(console, "info").mockImplementation(() => {});
    try {
      // Concurrent on purpose: both requests can see onboarded=false, and only
      // the once guard may let one of them mail the admins.
      await Promise.all([
        call("/api/auth/onboarded", "POST", undefined, a.cookie),
        call("/api/auth/onboarded", "POST", undefined, a.cookie),
      ]);
      const toAdmin = logSpy.mock.calls.filter(
        ([m]) => (m as { to?: string }).to === boss.email,
      );
      expect(toAdmin).toHaveLength(1);
    } finally {
      logSpy.mockRestore();
    }
  });
});

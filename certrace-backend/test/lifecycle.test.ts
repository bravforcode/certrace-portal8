import { afterAll, describe, expect, test } from "bun:test";
import { db } from "../src/lib/db";
import { account, call, cleanup, editorOf } from "./helpers";

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

describe("trial enforcement", () => {
  // Reading stays open so a customer can always export what they entered.
  // Writes stop at day 30 on the trial plan, for owners and for editors of that company.
  test("after 30 days writes return TRIAL_ENDED but reads work", async () => {
    const a = await account();
    await db.users.update({
      where: { id: a.user.id },
      data: { trial_started_at: new Date(Date.now() - 31 * 86_400_000) },
    });
    const put = await call(
      "/api/v1/account/records/certrace%3Anotification-prefs",
      "PUT",
      { value: { product: true }, revision: 0 },
      a.cookie,
    );
    expect(put.status).toBe(403);
    expect((await put.json()).detail.code).toBe("TRIAL_ENDED");
    const get = await call("/api/v1/account/records", "GET", undefined, a.cookie);
    expect(get.status).toBe(200);
  });

  test("an editor of an expired trial company cannot write workbook cells", async () => {
    const owner = await account();
    const member = await account();
    const h = await editorOf(owner, member);
    await db.users.update({
      where: { id: owner.user.id },
      data: { trial_started_at: new Date(Date.now() - 31 * 86_400_000) },
    });
    const r = await call(
      "/api/v1/workbooks/inst-1/2026/cells",
      "PATCH",
      { cells: { "products:0:item": "Steel" } },
      member.cookie,
      h,
    );
    expect(r.status).toBe(403);
    expect((await r.json()).detail.code).toBe("TRIAL_ENDED");
    const read = await call("/api/v1/workbooks/inst-1/2026", "GET", undefined, member.cookie, h);
    expect(read.status).toBe(200);
  });
});

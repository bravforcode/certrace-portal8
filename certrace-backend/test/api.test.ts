import { legalVersionIds } from "./fixtures/legal";
import { afterAll, describe, test, expect } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import { hash } from "../src/lib/security";
import { calculate } from "../src/modules/calculations/service";
import { accountForVerifiedGoogleIdentity } from "../src/modules/auth/service";
import type { Calculation } from "../src/modules/calculations/model";
import { dueStep } from "../src/modules/reminders/service";
const users: string[] = [];
async function call(
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
  headers: Record<string, string> = {},
) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie, origin: "http://localhost:3000" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}
const bearerMe = (accessToken: string) =>
  call("/api/auth/me", "GET", undefined, undefined, {
    authorization: `Bearer ${accessToken}`,
  });
async function account(ready = true) {
  const r = await call("/api/auth/register", "POST", {
    email: `test-${crypto.randomUUID()}@example.invalid`,
    password: "test-password-123",
    ...(await legalVersionIds()),
    termsAccepted: true,
    privacyAccepted: true,
    marketingOptIn: false,
  });
  expect(r.status).toBe(201);
  const body = await r.json();
  users.push(body.user.id);
  if (ready) {
    await db.users.update({
      where: { id: body.user.id },
      data: { ready: true },
    });
    body.user.ready = true;
  }
  return { cookie: r.headers.get("set-cookie")!.split(";")[0]!, ...body };
}
afterAll(async () => {
  await db.users.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});
describe("Elysia + PostgreSQL", () => {
  test("a stale tab cannot read, write, download or sign out the account a new cookie belongs to", async () => {
    const a = await account(),
      b = await account();
    const expected = { "X-Certrace-Account": a.user.id };
    const before = await (
      await call("/api/v1/account/records", "GET", undefined, b.cookie)
    ).json();
    for (const [path, method, body] of [
      ["/api/v1/account/records", "GET", undefined],
      [
        "/api/v1/account/records/certrace%3Anotification-prefs",
        "PUT",
        { value: { product: true }, revision: 0 },
      ],
      [
        "/api/v1/reporting/records/batch",
        "POST",
        {
          records: [
            {
              key: "certrace:profile",
              value: { firstName: "Wrong account" },
              revision: 0,
            },
          ],
        },
      ],
      [`/api/v1/account/files/${crypto.randomUUID()}`, "GET", undefined],
      ["/api/auth/logout", "POST", {}],
    ] as const) {
      const response = await call(path, method, body, b.cookie, expected);
      expect(response.status).toBe(409);
      expect((await response.json()).detail.code).toBe("ACCOUNT_CHANGED");
    }
    expect(
      await (
        await call("/api/v1/account/records", "GET", undefined, b.cookie)
      ).json(),
    ).toEqual(before);
    expect(
      (await call("/api/auth/me", "GET", undefined, b.cookie)).status,
    ).toBe(200);
    expect(
      (
        await call(
          "/api/v1/account/records",
          "GET",
          undefined,
          a.cookie,
          expected,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call("/api/v1/account/records", "GET", undefined, b.cookie, {
          "X-Certrace-Account": b.user.id,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await call("/api/v1/account/records", "GET", undefined, undefined, {
          ...expected,
          authorization: `Bearer ${b.accessToken}`,
        })
      ).status,
    ).toBe(409);
    // Public supplier capabilities remain independent of any exporter cookie.
    expect(
      (
        await call(
          "/api/v1/uploads/limits",
          "GET",
          undefined,
          b.cookie,
          expected,
        )
      ).status,
    ).toBe(200);
  });
  test("a matching Google email cannot claim an existing password account", async () => {
    const a = await account();
    const before = await db.users.findUniqueOrThrow({
      where: { id: a.user.id },
    });
    const identity = { sub: crypto.randomUUID(), email: a.user.email };

    await expect(
      accountForVerifiedGoogleIdentity(identity),
    ).rejects.toMatchObject({
      status: 409,
      code: "GOOGLE_LINK_REQUIRED",
    });
    const unchanged = await db.users.findUniqueOrThrow({
      where: { id: a.user.id },
    });
    expect(unchanged.google_sub).toBeNull();
    expect(unchanged.password_hash).toBe(before.password_hash);
    expect(
      (await call("/api/auth/me", "GET", undefined, a.cookie)).status,
    ).toBe(200);

    const linked = await accountForVerifiedGoogleIdentity(identity, unchanged);
    expect(linked.google_sub).toBe(identity.sub);
    expect(linked.email).toBe(a.user.email);
    expect(linked.password_hash).toBe(before.password_hash);
    expect((await accountForVerifiedGoogleIdentity(identity)).id).toBe(
      a.user.id,
    );
  });
  test("registration rejects missing consent", async () => {
    const result = await call("/api/auth/register", "POST", {
      email: `consent-${crypto.randomUUID()}@example.invalid`,
      password: "test-password-123",
      ...(await legalVersionIds()),
      termsAccepted: false,
      privacyAccepted: true,
      marketingOptIn: false,
    });
    expect(result.status).toBe(400);
  });
  test("new accounts can save registration details while workspace access waits for approval", async () => {
    const a = await account(false);
    expect(a.user.ready).toBe(false);
    expect(
      (await db.users.findUniqueOrThrow({ where: { id: a.user.id } })).ready,
    ).toBe(false);
    for (const path of [
      "/api/v1/account/records",
      "/api/v1/reporting/records",
    ]) {
      const workspace = await call(path, "GET", undefined, a.cookie);
      expect(workspace.status).toBe(403);
      expect((await workspace.json()).detail.code).toBe("ACCOUNT_NOT_READY");
    }
    const savedProfile = await call(
      "/api/auth/onboarding/records",
      "POST",
      {
        records: [
          { key: "certrace:profile", value: { firstName: "New" }, revision: 0 },
        ],
      },
      a.cookie,
    );
    expect(savedProfile.status).toBe(200);
    expect((await savedProfile.json()).records[0]).toMatchObject({
      key: "certrace:profile",
      value: { firstName: "New" },
    });
    const onboarding = await call(
      "/api/auth/onboarding/records",
      "GET",
      undefined,
      a.cookie,
    );
    expect((await onboarding.json()).records).toHaveLength(1);
    const otherRecord = await call(
      "/api/auth/onboarding/records",
      "POST",
      {
        records: [{ key: "certrace:workspaces", value: [], revision: 0 }],
      },
      a.cookie,
    );
    expect(otherRecord.status).toBe(403);
    expect(
      (await db.users.findUniqueOrThrow({ where: { id: a.user.id } }))
        .onboarded,
    ).toBe(false);
    const complete = await call(
      "/api/auth/onboarded",
      "POST",
      undefined,
      a.cookie,
    );
    expect(complete.status).toBe(200);
    expect((await complete.json()).user).toMatchObject({
      onboarded: true,
      ready: false,
    });
    expect(
      (await call("/api/v1/account/records", "GET", undefined, a.cookie))
        .status,
    ).toBe(403);
    await db.users.update({ where: { id: a.user.id }, data: { ready: true } });
    const me = await call("/api/auth/me", "GET", undefined, a.cookie);
    expect((await me.json()).user.ready).toBe(true);
    expect(
      (await call("/api/v1/account/records", "GET", undefined, a.cookie))
        .status,
    ).toBe(200);
    await db.users.update({ where: { id: a.user.id }, data: { ready: false } });
    expect(
      (await (await call("/api/auth/me", "GET", undefined, a.cookie)).json())
        .user.ready,
    ).toBe(false);
    const revoked = await call(
      "/api/v1/account/records",
      "GET",
      undefined,
      a.cookie,
    );
    expect(revoked.status).toBe(403);
    expect((await revoked.json()).detail.code).toBe("ACCOUNT_NOT_READY");
  });
  test("only an admin can list users and change readiness", async () => {
    const administrator = await account(false);
    const customer = await account(false);
    expect((await call("/api/admin/users")).status).toBe(401);
    const denied = await call(
      "/api/admin/users",
      "GET",
      undefined,
      customer.cookie,
    );
    expect(denied.status).toBe(403);
    expect((await denied.json()).detail.code).toBe("ADMIN_REQUIRED");
    expect(
      (
        await call(
          `/api/admin/users/${customer.user.id}/ready`,
          "PUT",
          { ready: true },
          customer.cookie,
        )
      ).status,
    ).toBe(403);

    await db.users.update({
      where: { id: administrator.user.id },
      data: { is_admin: true },
    });
    const listed = await call(
      `/api/admin/users?search=${encodeURIComponent(customer.user.email)}`,
      "GET",
      undefined,
      administrator.cookie,
    );
    expect(listed.status).toBe(200);
    const list = await listed.json();
    expect(list.users).toHaveLength(1);
    expect(list.users[0]).toMatchObject({ id: customer.user.id, ready: false });
    expect(list.users[0]).not.toHaveProperty("password_hash");

    const changed = await call(
      `/api/admin/users/${customer.user.id}/ready`,
      "PUT",
      { ready: true },
      administrator.cookie,
    );
    expect(changed.status).toBe(200);
    expect((await changed.json()).user.ready).toBe(true);
    expect(
      (await db.users.findUniqueOrThrow({ where: { id: customer.user.id } }))
        .ready,
    ).toBe(true);
    const audit = await db.account_audit_events.findFirst({
      where: { user_id: customer.user.id, event: "ADMIN_READY_CHANGED" },
    });
    expect(audit?.details).toMatchObject({
      adminUserId: administrator.user.id,
      from: false,
      to: true,
    });
    const reversed = await call(
      `/api/admin/users/${customer.user.id}/ready`,
      "PUT",
      { ready: false },
      administrator.cookie,
    );
    expect(reversed.status).toBe(200);
    expect((await reversed.json()).user.ready).toBe(false);
    await db.users.update({
      where: { id: administrator.user.id },
      data: { is_admin: false },
    });
    expect(
      (await call("/api/admin/users", "GET", undefined, administrator.cookie))
        .status,
    ).toBe(403);
  });
  test("cookie session, isolation, optimistic conflict, reload, CSRF, logout", async () => {
    const a = await account(),
      b = await account();
    expect(a.user.planId).toBe("trial");
    const consent = await db.account_audit_events.findFirst({
      where: { user_id: a.user.id, event: "REGISTRATION_CONSENT" },
    });
    expect(consent?.details).toMatchObject({
      termsAccepted: true,
      privacyAccepted: true,
      marketingOptIn: false,
    });
    expect(new Date(a.user.trialStartedAt).getTime()).not.toBeNaN();
    const persistedPlan = await db.users.findUnique({
      where: { id: a.user.id },
    });
    expect(persistedPlan?.plan_id).toBe(a.user.planId);
    expect(persistedPlan?.trial_started_at.toISOString()).toBe(
      a.user.trialStartedAt,
    );
    expect(a.cookie).toContain("certrace_session=");
    expect(
      (await call("/api/auth/me", "GET", undefined, a.cookie)).status,
    ).toBe(200);
    expect((await call("/api/v1/account/records")).status).toBe(401);
    let r = await call(
      "/api/v1/account/records/certrace:test-settings",
      "PUT",
      { value: [{ id: "ws", name: "Saved workspace" }], revision: 0 },
      a.cookie,
    );
    expect(r.status).toBe(200);
    r = await call("/api/v1/account/records", "GET", undefined, b.cookie);
    expect((await r.json()).records).toEqual([]);
    r = await call(
      "/api/v1/account/records/certrace:test-settings",
      "PUT",
      { value: [], revision: 0 },
      a.cookie,
    );
    expect(r.status).toBe(409);
    r = await call("/api/v1/account/records", "GET", undefined, a.cookie);
    expect((await r.json()).records[0].value[0].name).toBe("Saved workspace");
    r = await call(
      "/api/v1/account/records/certrace:test-settings",
      "PUT",
      { value: [], revision: 1 },
      a.cookie,
      { origin: "https://evil.example" },
    );
    expect(r.status).toBe(403);
    expect((await call("/api/auth/logout", "POST", {}, a.cookie)).status).toBe(
      200,
    );
    expect(
      (await call("/api/auth/me", "GET", undefined, a.cookie)).status,
    ).toBe(401);
  });
  test("self-supply reopens one owned response, including concurrent opens and expired-link renewal", async () => {
    const owner = await account(),
      outsider = await account(),
      id = crypto.randomUUID();
    expect(
      (
        await call(
          `/api/v1/declarations/${id}`,
          "PUT",
          {
            id,
            name: "Self supply",
            suppliers: [
              { id: "own", name: "Our plant", selfSupplied: true },
              { id: "external", name: "Other plant" },
            ],
            requests: [],
          },
          owner.cookie,
        )
      ).status,
    ).toBe(200);
    const path = `/api/v1/declarations/${id}/links`;
    expect(
      (await call(path, "POST", { supplierId: "own" }, outsider.cookie)).status,
    ).toBe(404);
    const opened = await Promise.all(
      [1, 2].map(() => call(path, "POST", { supplierId: "own" }, owner.cookie)),
    );
    expect(opened.map((r) => r.status)).toEqual([201, 201]);
    const first = await opened[0]!.json(),
      second = await opened[1]!.json();
    expect(first.token).toBe(second.token);
    expect(
      (
        await call(`/api/v1/links/${first.token}/state`, "PUT", {
          state: { values: { note: "Saved own reading" } },
        })
      ).status,
    ).toBe(200);
    await db.smart_links.update({
      where: { token: first.token },
      data: { expires_at: new Date(0) },
    });
    const reopened = await (
      await call(path, "POST", { supplierId: "own" }, owner.cookie)
    ).json();
    expect(reopened.token).toBe(first.token);
    const saved = await (await call(`/api/v1/links/${reopened.token}`)).json();
    expect(saved.state.values.note).toBe("Saved own reading");
    const otherMonth = await (
      await call(
        path,
        "POST",
        { supplierId: "own", month: "2026-02" },
        owner.cookie,
      )
    ).json();
    expect(otherMonth.token).not.toBe(first.token);
    const external = await (
      await call(path, "POST", { supplierId: "external" }, owner.cookie)
    ).json();
    const externalAgain = await (
      await call(path, "POST", { supplierId: "external" }, owner.cookie)
    ).json();
    expect(external.token).not.toBe(externalAgain.token);
  });
  test("supplier disclosure, submission locks, revisions, revocation", async () => {
    const a = await account(),
      b = await account(),
      id = crypto.randomUUID();
    const ownerProfile = {
      companyName: "Saved exporter",
      firstName: "Private owner",
      lastName: "Private surname",
    };
    expect(
      (
        await call(
          "/api/v1/account/records/certrace:profile",
          "PUT",
          { value: ownerProfile, revision: 0 },
          a.cookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          "/api/v1/account/records/certrace:profile",
          "PUT",
          { value: { companyName: "Other exporter" }, revision: 0 },
          b.cookie,
        )
      ).status,
    ).toBe(200);
    expect(
      await db.account_records.findUnique({
        where: { user_id_key: { user_id: a.user.id, key: "certrace:profile" } },
      }),
    ).toBeNull();
    expect(
      (
        await call(
          `/api/v1/declarations/${id}`,
          "PUT",
          {
            id,
            name: "Annual",
            suppliers: [
              { id: "one", name: "Mine", emissions: 99 },
              { id: "two", name: "Secret" },
            ],
            requests: [],
          },
          a.cookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (await call(`/api/v1/declarations/${id}`, "GET", undefined, b.cookie))
        .status,
    ).toBe(404);
    const minted = await call(
      `/api/v1/declarations/${id}/links`,
      "POST",
      { supplierId: "one" },
      a.cookie,
    );
    expect(minted.status).toBe(201);
    const { token } = await minted.json();
    const resolved = await (await call(`/api/v1/links/${token}`)).json();
    expect(resolved.supplier.name).toBe("Mine");
    expect(resolved.exporter).toEqual({ companyName: "Saved exporter" });
    expect(JSON.stringify(resolved)).not.toContain("Private owner");
    expect(JSON.stringify(resolved)).not.toContain("Private surname");
    expect(JSON.stringify(resolved)).not.toContain("Other exporter");
    expect(JSON.stringify(resolved)).not.toContain("Secret");
    expect(resolved.supplier.emissions).toBeUndefined();
    const renamedProfile = { ...ownerProfile, companyName: "Renamed exporter" };
    expect(
      (
        await call(
          "/api/v1/account/records/certrace:profile",
          "PUT",
          { value: renamedProfile, revision: 1 },
          a.cookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (await (await call(`/api/v1/links/${token}`)).json()).exporter
        .companyName,
    ).toBe("Renamed exporter");
    const preserved = (
      await (
        await call("/api/v1/account/records", "GET", undefined, a.cookie)
      ).json()
    ).records.find((r: { key: string }) => r.key === "certrace:profile");
    expect(preserved.value).toEqual(renamedProfile);
    expect(preserved.revision).toBe(2);
    const state = {
      values: {
        a: "original",
        b: "locked",
        "hrc::direct-emissions": "0.5",
        "hrc::indirect-emissions": "0.2",
        "hrc::total-emissions": "0.70",
        "billet::total-emissions": "2",
      },
      versions: [{ n: 99 }],
      events: [],
    };
    const submitted = await call(`/api/v1/links/${token}/submit`, "POST", {
      state,
      attestation: { signatoryName: "Tester", signatoryRole: "Owner" },
    });
    expect(submitted.status).toBe(200);
    expect((await submitted.json()).versions[0].n).toBe(1);
    expect(
      (await call(`/api/v1/links/${token}/state`, "PUT", { state })).status,
    ).toBe(409);
    expect(
      (
        await call(
          `/api/v1/declarations/${id}/links/${token}/revision`,
          "POST",
          { unlocked: ["a", "hrc::direct-emissions"], note: "Correct a" },
          a.cookie,
        )
      ).status,
    ).toBe(200);
    const saved = await (
      await call(`/api/v1/links/${token}/state`, "PUT", {
        state: {
          values: {
            a: "fixed",
            b: "tampered",
            "hrc::direct-emissions": "0.6",
            "hrc::indirect-emissions": "0.2",
            "hrc::total-emissions": "0.80",
            "billet::total-emissions": "99",
          },
        },
      })
    ).json();
    expect(saved.values).toEqual({
      a: "fixed",
      b: "locked",
      "hrc::direct-emissions": "0.6",
      "hrc::indirect-emissions": "0.2",
      "hrc::total-emissions": "0.80",
      "billet::total-emissions": "2",
    });
    const guarded = await (
      await call(`/api/v1/links/${token}/state`, "PUT", {
        state: {
          values: {
            ...saved.values,
            "hrc::indirect-emissions": "99",
            "hrc::total-emissions": "99.6",
          },
        },
      })
    ).json();
    expect(guarded.values).toEqual(saved.values);
    await call(
      `/api/v1/declarations/${id}/links/${token}/revoke`,
      "POST",
      undefined,
      a.cookie,
    );
    expect((await call(`/api/v1/links/${token}`)).status).toBe(410);
  });
  test("original file bytes persist with account isolation", async () => {
    const a = await account(),
      b = await account(),
      id = crypto.randomUUID(),
      bytes = "%PDF-1.7\noriginal";
    const r = await app.handle(
      new Request(
        `http://localhost/api/v1/account/files/${id}?filename=evidence.pdf`,
        {
          method: "PUT",
          headers: {
            cookie: a.cookie,
            origin: "http://localhost:3000",
            "content-type": "application/pdf",
          },
          body: bytes,
        },
      ),
    );
    expect(r.status).toBe(200);
    expect(
      await (
        await call(`/api/v1/account/files/${id}`, "GET", undefined, a.cookie)
      ).text(),
    ).toBe(bytes);
    expect(
      (await call(`/api/v1/account/files/${id}`, "GET", undefined, b.cookie))
        .status,
    ).toBe(404);
  });
  test("atomic refresh consumes the old token exactly once", async () => {
    const a = await account();
    const replies = await Promise.all([
      call("/api/auth/refresh", "POST", {}, a.cookie),
      call("/api/auth/refresh", "POST", {}, a.cookie),
    ]);
    expect(replies.map((r) => r.status).sort()).toEqual([200, 401]);
  });
  test("bearer access ends when its session rotates or logs out", async () => {
    const a = await account();
    expect((await bearerMe(a.accessToken)).status).toBe(200);
    const refreshed = await call("/api/auth/refresh", "POST", {}, a.cookie);
    expect(refreshed.status).toBe(200);
    const next = await refreshed.json();
    expect((await bearerMe(a.accessToken)).status).toBe(401);
    expect((await bearerMe(next.accessToken)).status).toBe(200);
    const nextCookie = refreshed.headers.get("set-cookie")!.split(";")[0]!;
    expect(
      (await call("/api/auth/logout", "POST", {}, nextCookie)).status,
    ).toBe(200);
    expect((await bearerMe(next.accessToken)).status).toBe(401);
  });
});
test("calculation matches the Python golden result exactly", async () => {
  const fixture = await Bun.file(
      "../docs/fixtures/golden-eaf-2026.json",
    ).json(),
    expected = await Bun.file("test/fixtures/golden-python-result.json").json();
  expect(
    await calculate(fixture.backend.request as Calculation, async () => null),
  ).toEqual(expected);
});
test("reminder catch-up chooses only the latest elapsed step", () => {
  expect(dueStep(new Date("2026-10-01"), new Date("2026-10-15"))?.offset).toBe(
    12,
  );
});

test("all successful legacy route fixtures match through Elysia validation", async () => {
  const fixtures = await Bun.file(
    "test/fixtures/python-calculations.json",
  ).json();
  for (const fixture of fixtures) {
    const response = await call("/api/v1/calculate", "POST", fixture.request);
    expect(response.status, fixture.name).toBe(200);
    expect(await response.json(), fixture.name).toEqual(fixture.response);
  }
});
test("legacy passwords still authenticate and password changes revoke old cookies", async () => {
  const { pbkdf2Sync } = await import("node:crypto");
  const a = await account(),
    salt = Buffer.from("00112233445566778899aabbccddeeff00", "hex");
  const legacy = `pbkdf2_sha256$600000$${salt.toString("hex")}$${pbkdf2Sync("legacy-password", salt, 600000, 32, "sha256").toString("hex")}`;
  await db.users.update({
    where: { id: a.user.id },
    data: { password_hash: legacy },
  });
  const login = await call("/api/auth/login", "POST", {
    email: a.user.email,
    password: "legacy-password",
  });
  expect(login.status).toBe(200);
  const changed = await call(
    "/api/auth/change-password",
    "POST",
    { current_password: "legacy-password", new_password: "new-local-password" },
    a.cookie,
  );
  expect(changed.status).toBe(200);
  const replacement = await changed.json();
  expect((await call("/api/auth/me", "GET", undefined, a.cookie)).status).toBe(
    401,
  );
  expect((await bearerMe(a.accessToken)).status).toBe(401);
  expect((await bearerMe(replacement.accessToken)).status).toBe(200);
  expect(
    (
      await call("/api/auth/login", "POST", {
        email: a.user.email,
        password: "new-local-password",
      })
    ).status,
  ).toBe(200);
});
test("password reset revokes previously issued bearer access", async () => {
  const a = await account();
  const code = "123456";
  await db.password_resets.create({
    data: {
      email: a.user.email,
      token: hash(code),
      expires_at: new Date(Date.now() + 900000),
    },
  });
  const reset = await call("/api/auth/reset-password", "POST", {
    email: a.user.email,
    reset_token: code,
    new_password: "reset-local-password",
  });
  expect(reset.status).toBe(200);
  expect((await bearerMe(a.accessToken)).status).toBe(401);
  expect(
    (
      await call("/api/auth/login", "POST", {
        email: a.user.email,
        password: "reset-local-password",
      })
    ).status,
  ).toBe(200);
});
test("legacy import preserves existing records and rejects credential keys", async () => {
  const a = await account();
  await call(
    "/api/v1/account/records/certrace:profile",
    "PUT",
    { value: { firstName: "Server" }, revision: 0 },
    a.cookie,
  );
  const imported = await call(
    "/api/v1/account/records/import",
    "POST",
    {
      records: [
        { key: "certrace:profile", value: { firstName: "Browser" } },
        { key: "certrace:test-settings", value: [{ id: "old" }] },
      ],
    },
    a.cookie,
  );
  expect((await imported.json()).imported).toBe(1);
  const records = (
    await (
      await call("/api/v1/account/records", "GET", undefined, a.cookie)
    ).json()
  ).records;
  expect(
    records.find((r: { key: string }) => r.key === "certrace:profile").value,
  ).toEqual({ firstName: "Server" });
  expect(
    (
      await call(
        "/api/v1/account/records/import",
        "POST",
        {
          records: [{ key: "certrace:auth", value: { accessToken: "secret" } }],
        },
        a.cookie,
      )
    ).status,
  ).toBe(422);
});

test("an emailed invitation grants only the recipient a company seat and removing it revokes a live session", async () => {
  const owner = await account(),
    member = await account(false),
    outsider = await account();
  const company = {
    "X-Certrace-Company": owner.user.id,
    "X-Certrace-Account": member.user.id,
  };
  const team = (path: string, method: string, body?: unknown) =>
    call("/api/v1/team/" + path, method, body, owner.cookie);
  let secret = "";
  const info = console.info;
  const mode = process.env.CERTRACE_EMAIL_DELIVERY;
  process.env.CERTRACE_EMAIL_DELIVERY = "console";
  console.info = (entry) => {
    if (entry?.to === member.user.email)
      secret = entry.text.match(/\/join#([A-Za-z0-9_-]+)/)?.[1] ?? "";
  };
  try {
    const body = { email: member.user.email };
    const invitation = await team("invitations", "POST", body);
    expect(invitation.status).toBe(200);
    const id = (await invitation.json()).id;
    expect(secret.length).toBe(43);
    const first = secret;
    const duplicate = await team("invitations", "POST", body);
    expect((await duplicate.json()).id).toBe(id);
    expect(secret).toBe(first);
    expect((await team("invitations/" + id + "/resend", "POST")).status).toBe(
      200,
    );
    expect(first).not.toBe(secret);
    const accept = (cookie: string, token = secret) =>
      call("/api/v1/team/accept", "POST", { token }, cookie);
    expect((await accept(outsider.cookie, first)).status).toBe(410);
    expect((await accept(outsider.cookie)).status).toBe(403);
    expect((await accept(member.cookie)).status).toBe(403);
    await db.users.update({
      where: { id: member.user.id },
      data: { ready: true },
    });
    expect((await accept(member.cookie)).status).toBe(200);
    expect((await accept(member.cookie)).status).toBe(410);
    const get = (path: string) =>
      call(path, "GET", undefined, member.cookie, company);
    expect((await (await get("/api/auth/me")).json()).user.id).toBe(
      member.user.id,
    );
    expect((await get("/api/admin/users")).status).toBe(403);
    const declaration = { id: "annual", name: "Annual report", period: "2026" };
    expect(
      (await call("/api/v1/declarations", "POST", declaration, owner.cookie))
        .status,
    ).toBe(201);
    expect((await (await get("/api/v1/declarations/annual")).json()).name).toBe(
      "Annual report",
    );
    expect(
      (
        await call(
          "/api/v1/declarations/annual",
          "PUT",
          { ...declaration, name: "Reviewed annual report" },
          member.cookie,
          company,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await (
          await call(
            "/api/v1/declarations/annual",
            "GET",
            undefined,
            owner.cookie,
          )
        ).json()
      ).name,
    ).toBe("Reviewed annual report");
    expect(
      (
        await call(
          "/api/v1/declarations/annual",
          "GET",
          undefined,
          member.cookie,
        )
      ).status,
    ).toBe(404);
    await call(
      "/api/v1/account/records/certrace%3Acera-history",
      "PUT",
      { value: ["private conversation"], revision: 0 },
      owner.cookie,
    );
    const shared = await (await get("/api/v1/account/records")).json();
    expect(
      shared.records.some(
        (r: { key: string }) => r.key === "certrace:cera-history",
      ),
    ).toBe(false);
    expect(shared.team.isOwner).toBe(false);
    expect(shared.team.members.length).toBe(2);
    expect(shared.team.invitations).toEqual([]);
    expect(
      (
        await call(
          "/api/v1/team/invitations",
          "POST",
          { email: outsider.user.email },
          member.cookie,
          company,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await call(
          "/api/v1/declarations/nonexistent",
          "DELETE",
          undefined,
          member.cookie,
          company,
        )
      ).status,
    ).toBe(403);
    const report = { key: "certrace:workspaces", value: [], revision: 0 };
    expect(
      (
        await call(
          "/api/v1/reporting/records",
          "PUT",
          report,
          member.cookie,
          company,
        )
      ).status,
    ).toBe(200);
    const saved = await db.records.findFirst({
      where: { key: report.key, user_id: owner.user.id },
    });
    expect(saved?.actor_id).toBe(member.user.id);
    expect(
      (
        await call(
          "/api/v1/reporting/records",
          "PUT",
          {
            ...report,
            key: "certrace:profile",
            value: { companyName: "Overwritten" },
          },
          member.cookie,
          company,
        )
      ).status,
    ).toBe(403);
    // A member can read the company's attachment, while a different user cannot claim that company.
    await db.account_files.create({
      data: {
        id: "proof",
        user_id: owner.user.id,
        filename: "proof.txt",
        content_type: "text/plain",
        data: Buffer.from("proof"),
        sha256: hash("proof"),
      },
    });
    expect(await (await get("/api/v1/account/files/proof")).text()).toBe(
      "proof",
    );
    expect(
      (
        await call(
          "/api/v1/account/files/proof",
          "GET",
          undefined,
          outsider.cookie,
          { "X-Certrace-Company": owner.user.id },
        )
      ).status,
    ).toBe(403);
    expect((await team("members/" + member.user.id, "DELETE")).status).toBe(
      200,
    );
    expect((await get("/api/v1/account/files/proof")).status).toBe(403);
    expect((await get("/api/v1/account/records")).status).toBe(403);
    expect(
      (await call("/api/v1/account/records", "GET", undefined, member.cookie))
        .status,
    ).toBe(200);
  } finally {
    console.info = info;
    if (mode === undefined) delete process.env.CERTRACE_EMAIL_DELIVERY;
    else process.env.CERTRACE_EMAIL_DELIVERY = mode;
  }
});

test("pending invites share one seat budget across concurrent requests, cancellation, expiry, and delivery failures", async () => {
  const owner = await account();
  await db.users.update({
    where: { id: owner.user.id },
    data: { plan_id: "starter" },
  });
  const send = (email: string) =>
    call("/api/v1/team/invitations", "POST", { email }, owner.cookie);
  const previous = process.env.CERTRACE_EMAIL_DELIVERY;
  process.env.CERTRACE_EMAIL_DELIVERY = "off";
  try {
    const responses = await Promise.all(
      ["a", "b", "c"].map((s) => send(s + "@example.invalid")),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([409, 503, 503]);
    const pending = await db.team_invitations.findMany({
      where: { account_id: owner.user.id },
    });
    expect(pending.length).toBe(2);
    expect(pending.every((i) => !i.delivered)).toBe(true);
    expect(
      (
        await call(
          "/api/v1/team/invitations/" + pending[0]!.id,
          "DELETE",
          undefined,
          owner.cookie,
        )
      ).status,
    ).toBe(200);
    await db.team_invitations.update({
      where: { id: pending[1]!.id },
      data: { expires_at: new Date(0) },
    });
    const view = await (
      await call("/api/v1/account/records", "GET", undefined, owner.cookie)
    ).json();
    expect(view.team.invitations).toEqual([]);
    expect((await send("d@example.invalid")).status).toBe(503);
  } finally {
    if (previous === undefined) delete process.env.CERTRACE_EMAIL_DELIVERY;
    else process.env.CERTRACE_EMAIL_DELIVERY = previous;
  }
});

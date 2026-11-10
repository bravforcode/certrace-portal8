import { afterAll, expect, test } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import {
  acceptanceContext,
  currentLegalDocuments,
} from "../src/modules/auth/legal";
import { accountForVerifiedGoogleIdentity } from "../src/modules/auth/service";
import { legalVersionIds } from "./fixtures/legal";
const users: string[] = [];
afterAll(async () => {
  await db.users.deleteMany({ where: { id: { in: users } } });
});
async function call(path: string, body?: unknown, cookie?: string) {
  return app.handle(
    new Request(`http://localhost/api/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "user-agent": "legal-test-browser",
        "x-forwarded-for": "203.0.113.99",
        ...(cookie ? { cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}
const registration = async () => ({
  email: `legal-${crypto.randomUUID()}@example.invalid`,
  password: "test-password-123",
  termsAccepted: true,
  privacyAccepted: true,
  marketingOptIn: false,
  ...(await legalVersionIds()),
});
test("IP evidence ignores spoofed forwarding headers unless a trusted proxy chain is configured", () => {
  const request = new Request("https://example.test", {
    headers: {
      "x-forwarded-for": "spoofed, 203.0.113.4, 10.0.0.1",
      "user-agent": "browser",
    },
  });
  expect(acceptanceContext(request, "127.0.0.1").ipAddress).toBe("127.0.0.1");
  expect(acceptanceContext(request, "127.0.0.1", 2).ipAddress).toBe(
    "203.0.113.4",
  );
  expect(acceptanceContext(request, "127.0.0.1", 3).ipAddress).toBeNull();
  expect(acceptanceContext(request, undefined).ipAddress).toBeNull();
});
test("registration ties evidence to the reviewed versions and retries do not overwrite it", async () => {
  const input = await registration();
  const before = new Date();
  const response = await call("auth/register", input);
  expect(response.status).toBe(201);
  const { user } = await response.json();
  users.push(user.id);
  expect(user.legalConsentRequired).toBe(false);
  const cookie = response.headers.get("set-cookie")!.split(";")[0]!;
  const records = await db.legal_acceptances.findMany({
    where: { user_id: user.id },
    orderBy: { id: "asc" },
  });
  expect(records).toHaveLength(2);
  expect(records.map((r) => r.document_version_id).sort()).toEqual(
    [input.termsVersionId, input.privacyVersionId].sort(),
  );
  for (const record of records) {
    expect(record.accepted_at.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(record.source).toBe("registration");
    expect(record.user_agent).toBe("legal-test-browser");
    expect(record.ip_address).toBeNull(); // app.handle has no socket; spoofed header is ignored.
  }
  expect((await call("auth/legal/accept", input, cookie)).status).toBe(200);
  expect(
    await db.legal_acceptances.findMany({
      where: { user_id: user.id },
      orderBy: { id: "asc" },
    }),
  ).toEqual(records);
  const stale = await registration();
  stale.termsVersionId = crypto.randomUUID();
  expect((await call("auth/register", stale)).status).toBe(409);
  expect(
    await db.users.findFirst({ where: { email: stale.email } }),
  ).toBeNull();
});
test("Google signup records the same versioned evidence and rejects stale consent", async () => {
  const input = await registration();
  const context = { ipAddress: "203.0.113.5", userAgent: "Google browser" };
  const user = await accountForVerifiedGoogleIdentity(
    { sub: crypto.randomUUID(), email: input.email },
    undefined,
    input,
    context,
  );
  users.push(user.id);
  const records = await db.legal_acceptances.findMany({
    where: { user_id: user.id },
  });
  expect(records).toHaveLength(2);
  expect(
    records.every(
      (r) =>
        r.ip_address === context.ipAddress &&
        r.source === "google_registration",
    ),
  ).toBe(true);
  const stale = await registration();
  stale.privacyVersionId = crypto.randomUUID();
  await expect(
    accountForVerifiedGoogleIdentity(
      { sub: crypto.randomUUID(), email: stale.email },
      undefined,
      stale,
      context,
    ),
  ).rejects.toMatchObject({ code: "LEGAL_VERSION_CHANGED" });
  expect(
    await db.users.findFirst({ where: { email: stale.email } }),
  ).toBeNull();
});
test("publishing one policy blocks existing sessions until acceptance and keeps the old history", async () => {
  const input = await registration();
  const registered = await call("auth/register", input);
  const { user } = await registered.json();
  users.push(user.id);
  await db.users.update({ where: { id: user.id }, data: { ready: true } });
  const cookie = registered.headers.get("set-cookie")!.split(";")[0]!;
  const original = await db.legal_document_versions.findUniqueOrThrow({
    where: { id: input.termsVersionId },
  });
  let newId: string | undefined;
  try {
    const next = await db.$transaction(async (tx) => {
      await tx.legal_document_versions.update({
        where: { id: original.id },
        data: { is_current: false },
      });
      return tx.legal_document_versions.create({
        data: {
          kind: "terms",
          version: `test-${crypto.randomUUID()}`,
          content: original.content!,
          is_current: true,
        },
      });
    });
    newId = next.id;
    expect((await call("v1/account/records", undefined, cookie)).status).toBe(
      403,
    );
    expect(
      (await (await call("auth/me", undefined, cookie)).json()).user
        .legalConsentRequired,
    ).toBe(true);
    expect((await call("auth/legal/accept", input, cookie)).status).toBe(409);
    expect(
      (
        await call(
          "auth/legal/accept",
          { ...input, termsVersionId: newId, privacyAccepted: false },
          cookie,
        )
      ).status,
    ).toBe(400);
    expect(
      await db.legal_acceptances.count({ where: { user_id: user.id } }),
    ).toBe(2);
    expect(
      (
        await call(
          "auth/legal/accept",
          { ...input, termsVersionId: newId },
          cookie,
        )
      ).status,
    ).toBe(200);
    expect((await call("v1/account/records", undefined, cookie)).status).toBe(
      200,
    );
    expect(
      await db.legal_acceptances.count({ where: { user_id: user.id } }),
    ).toBe(3);
    expect(
      await db.legal_acceptances.count({
        where: { user_id: user.id, document_version_id: original.id },
      }),
    ).toBe(1);
    await expect(
      Promise.resolve(
        db.legal_document_versions.update({
          where: { id: newId },
          data: { content: {} },
        }),
      ),
    ).rejects.toThrow();
  } finally {
    if (newId) {
      await db.users.delete({ where: { id: user.id } });
      await db.legal_document_versions.delete({ where: { id: newId } });
    }
    await db.legal_document_versions.update({
      where: { id: original.id },
      data: { is_current: true },
    });
  }
});
test("legacy users have no invented version acceptance and can accept without losing their session", async () => {
  const user = await db.users.create({
    data: {
      email: `legacy-${crypto.randomUUID()}@example.invalid`,
      password_hash: await Bun.password.hash("test-password-123"),
    },
  });
  users.push(user.id);
  const login = await call("auth/login", {
    email: user.email,
    password: "test-password-123",
  });
  const cookie = login.headers.get("set-cookie")!.split(";")[0]!;
  expect((await login.json()).user.legalConsentRequired).toBe(true);
  expect((await call("auth/onboarded", {}, cookie)).status).toBe(403);
  expect(
    (
      await call(
        "auth/legal/accept",
        {
          ...(await legalVersionIds()),
          termsAccepted: true,
          privacyAccepted: true,
        },
        cookie,
      )
    ).status,
  ).toBe(200);
  await db.users.update({ where: { id: user.id }, data: { ready: true } });
  expect((await call("auth/onboarded", {}, cookie)).status).toBe(200);
  const documents = await (await call("auth/legal/documents")).json();
  expect(documents).toEqual(await currentLegalDocuments());
  expect(
    documents.every(
      (d: { version: string; content: { en: unknown[]; th: unknown[] } }) =>
        d.version && d.content.en.length && d.content.th.length,
    ),
  ).toBe(true);
});

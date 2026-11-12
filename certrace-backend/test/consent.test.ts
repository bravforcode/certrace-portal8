import { afterAll, beforeEach, expect, test } from "bun:test";
import { account, call, cleanup } from "./helpers";
import { db } from "../src/lib/db";
import { hash } from "../src/lib/security";
afterAll(cleanup);

// Requests reach the handler without a socket in tests, so the client IP is "unknown".
const ipBucket = () => hash("cookie-consent-ip:unknown");
beforeEach(async () => {
  await db.rate_limits.deleteMany({ where: { key: ipBucket() } });
});

const post = (body: unknown, cookie?: string) =>
  call("/api/v1/consent/cookies", "POST", body, cookie, {
    origin: "http://localhost:3000",
  });
const valid = (visitorId: string, extra: Record<string, unknown> = {}) => ({
  visitorId,
  analytics: false,
  marketing: false,
  policyVersion: "2026-11-10",
  ...extra,
});

// Consent is evidence under PDPA/GDPR: every choice is appended, never overwritten.
test("anonymous and signed-in choices are both recorded", async () => {
  const visitorId = crypto.randomUUID();
  const anon = await post(valid(visitorId));
  expect(anon.status).toBe(201);
  const a = await account();
  const signed = await call(
    "/api/v1/consent/cookies",
    "POST",
    {
      visitorId,
      analytics: true,
      marketing: false,
      policyVersion: "2026-11-10",
    },
    a.cookie,
  );
  expect(signed.status).toBe(201);
  const rows = await db.cookie_consents.findMany({
    where: { visitor_id: visitorId },
    orderBy: { created_at: "asc" },
  });
  expect(rows.map((r) => [r.analytics, r.user_id])).toEqual([
    [false, null],
    [true, a.user.id],
  ]);
  await db.cookie_consents.deleteMany({ where: { visitor_id: visitorId } });
});

// A client can rotate visitor ids freely, so the limit must hold per network address, not per id.
test("rotating visitor ids from one address is rate limited", async () => {
  const visitors: string[] = [];
  const statuses: number[] = [];
  for (let i = 0; i < 65; i++) {
    const visitorId = crypto.randomUUID();
    visitors.push(visitorId);
    statuses.push((await post(valid(visitorId))).status);
  }
  expect(statuses).toContain(429);
  expect(statuses.filter((s) => s === 201).length).toBeLessThan(65);
  await db.cookie_consents.deleteMany({
    where: { visitor_id: { in: visitors } },
  });
});

test("a non-UUID visitor id is rejected", async () => {
  expect((await post(valid("not-a-uuid"))).status).toBe(422);
});

test("a string where a boolean belongs is rejected", async () => {
  const visitorId = crypto.randomUUID();
  expect((await post(valid(visitorId, { analytics: "true" }))).status).toBe(
    422,
  );
  expect(
    await db.cookie_consents.count({ where: { visitor_id: visitorId } }),
  ).toBe(0);
});

test("a policy version the server does not publish is rejected", async () => {
  const visitorId = crypto.randomUUID();
  expect(
    (await post(valid(visitorId, { policyVersion: "anything-goes" }))).status,
  ).toBe(422);
  expect(
    await db.cookie_consents.count({ where: { visitor_id: visitorId } }),
  ).toBe(0);
});

// Necessary cookies are always on; a client cannot switch that off in its record.
test("necessary:false from the client is ignored and stored as true", async () => {
  const visitorId = crypto.randomUUID();
  expect((await post(valid(visitorId, { necessary: false }))).status).toBe(201);
  const [row] = await db.cookie_consents.findMany({
    where: { visitor_id: visitorId },
  });
  expect(row?.necessary).toBe(true);
  await db.cookie_consents.deleteMany({ where: { visitor_id: visitorId } });
});

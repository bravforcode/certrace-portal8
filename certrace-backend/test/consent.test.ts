import { afterAll, expect, test } from "bun:test";
import { account, call, cleanup } from "./helpers";
import { db } from "../src/lib/db";
afterAll(cleanup);

// Consent is evidence under PDPA/GDPR: every choice is appended, never overwritten.
test("anonymous and signed-in choices are both recorded", async () => {
  const visitorId = crypto.randomUUID();
  const anon = await call("/api/v1/consent/cookies", "POST",
    { visitorId, analytics: false, marketing: false, policyVersion: "2026-11-10" },
    undefined, { origin: "http://localhost:3000" });
  expect(anon.status).toBe(201);
  const a = await account();
  const signed = await call("/api/v1/consent/cookies", "POST",
    { visitorId, analytics: true, marketing: false, policyVersion: "2026-11-10" }, a.cookie);
  expect(signed.status).toBe(201);
  const rows = await db.cookie_consents.findMany({ where: { visitor_id: visitorId }, orderBy: { created_at: "asc" } });
  expect(rows.map((r) => [r.analytics, r.user_id])).toEqual([[false, null], [true, a.user.id]]);
  await db.cookie_consents.deleteMany({ where: { visitor_id: visitorId } });
});

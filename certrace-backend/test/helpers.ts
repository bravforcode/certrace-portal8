import { expect } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import { legalVersionIds } from "./fixtures/legal";

export const created: string[] = [];

export async function call(
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

export async function account(ready = true, extra: Record<string, unknown> = {}) {
  const email = `test-${crypto.randomUUID()}@example.invalid`;
  const r = await call("/api/auth/register", "POST", {
    email,
    password: "test-password-123",
    ...(await legalVersionIds()),
    termsAccepted: true,
    privacyAccepted: true,
    marketingOptIn: false,
    ...extra,
  });
  expect(r.status).toBe(201);
  const body = await r.json();
  created.push(body.user.id);
  if (ready)
    await db.users.update({
      where: { id: body.user.id },
      data: { ready: true, approved_at: new Date() },
    });
  return {
    cookie: r.headers.get("set-cookie")!.split(";")[0]!,
    email,
    ...body,
  };
}

export async function admin() {
  const a = await account(true);
  await db.users.update({ where: { id: a.user.id }, data: { is_admin: true } });
  return a;
}

export async function cleanup() {
  await db.users.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
}

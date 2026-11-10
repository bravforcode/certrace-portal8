import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import { hash } from "../src/lib/security";
import { legalVersionIds } from "./fixtures/legal";

const users: string[] = [];
const pdf = "%PDF-1.7\nsynthetic monthly reading";
const originalKey = process.env.ANTHROPIC_API_KEY;
const originalBase = process.env.ANTHROPIC_BASE_URL;
let provider: ReturnType<typeof Bun.serve>;
let providerCalls = 0;
let providerFails = false;
const proposal = {
  fields: [
    {
      key: "electricity-consumed",
      value: "123000",
      unit: "kWh",
      confidence: 0.95,
    },
  ],
  summary: "Monthly electricity consumption",
};

function call(path: string, method = "GET", body?: unknown, cookie?: string) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(cookie ? { cookie, origin: "http://localhost:3000" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}
function extract(
  path: string,
  cookie?: string,
  contentType = "application/pdf",
  bytes = pdf,
) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: {
        "content-type": contentType,
        ...(cookie ? { cookie, origin: "http://localhost:3000" } : {}),
      },
      body: bytes,
    }),
  );
}
async function account() {
  const response = await call("/api/auth/register", "POST", {
    email: `extraction-${crypto.randomUUID()}@example.invalid`,
    password: "test-password-123",
    ...(await legalVersionIds()),
    termsAccepted: true,
    privacyAccepted: true,
    marketingOptIn: false,
  });
  expect(response.status).toBe(201);
  const { user } = await response.json();
  users.push(user.id);
  await db.users.update({ where: { id: user.id }, data: { ready: true } });
  const cookie = response.headers.get("set-cookie")!.split(";")[0]!;
  const id = crypto.randomUUID();
  expect(
    (
      await call(
        `/api/v1/declarations/${id}`,
        "PUT",
        {
          id,
          name: "Extraction test",
          suppliers: [{ id: "plant", name: "Test plant" }],
          requests: [],
        },
        cookie,
      )
    ).status,
  ).toBe(200);
  const link = await call(
    `/api/v1/declarations/${id}/links`,
    "POST",
    { supplierId: "plant" },
    cookie,
  );
  expect(link.status).toBe(201);
  return { user, cookie, token: (await link.json()).token as string };
}
beforeAll(() => {
  provider = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      providerCalls++;
      expect(request.headers.get("x-api-key")).toBe("synthetic-extraction-key");
      const body = await request.json();
      expect(body.messages[0].content[0].source.data).toBe(
        Buffer.from(pdf).toString("base64"),
      );
      expect(body.system).toContain("production, fuel-quantity");
      if (providerFails)
        return Response.json(
          {
            error: {
              type: "overloaded_error",
              message: "private provider error",
            },
          },
          { status: 529 },
        );
      return Response.json({
        id: "msg-test",
        type: "message",
        role: "assistant",
        model: body.model,
        content: [{ type: "text", text: JSON.stringify(proposal) }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 10 },
      });
    },
  });
  process.env.ANTHROPIC_API_KEY = "synthetic-extraction-key";
  process.env.ANTHROPIC_BASE_URL = provider.url.origin;
});
afterAll(async () => {
  provider.stop(true);
  await db.rate_limits.deleteMany({
    where: { key: { in: users.map((id) => hash(`extraction:${id}`)) } },
  });
  await db.users.deleteMany({ where: { id: { in: users } } });
  if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalKey;
  if (originalBase === undefined) delete process.env.ANTHROPIC_BASE_URL;
  else process.env.ANTHROPIC_BASE_URL = originalBase;
});

describe("monthly document extraction access and provider transport", () => {
  test("live supplier tokens read documents without a user session, while account extraction stays authenticated", async () => {
    const { cookie, token } = await account();
    const publicPath = `/api/v1/links/${token}/evidence`;
    expect((await call(`${publicPath}/extraction`)).status).toBe(200);
    expect(await (await call(`${publicPath}/extraction`)).json()).toEqual({
      available: true,
    });
    expect((await extract("/api/v1/evidence/extract")).status).toBe(401);
    for (const [path, auth] of [
      [`${publicPath}/extract`, undefined],
      ["/api/v1/evidence/extract", cookie],
    ] as const) {
      const response = await extract(path, auth);
      expect(response.status).toBe(200);
      expect(JSON.parse((await response.json()).text)).toEqual(proposal);
    }
  });

  test("unknown, expired and revoked links cannot use the reader or discover its availability", async () => {
    const { token } = await account();
    let before = providerCalls;
    for (const [testedToken, status] of [
      ["missing-token", 404],
      [token, 410],
    ] as const) {
      if (testedToken === token)
        await db.smart_links.update({
          where: { token },
          data: { expires_at: new Date(0) },
        });
      expect(
        (await call(`/api/v1/links/${testedToken}/evidence/extraction`)).status,
      ).toBe(status);
      expect(
        (await extract(`/api/v1/links/${testedToken}/evidence/extract`)).status,
      ).toBe(status);
    }
    await db.smart_links.update({
      where: { token },
      data: {
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: new Date(),
      },
    });
    expect(
      (await extract(`/api/v1/links/${token}/evidence/extract`)).status,
    ).toBe(410);
    expect(providerCalls).toBe(before);
  });

  test("disabled extraction and unsupported bytes never call a provider", async () => {
    const { token } = await account();
    const path = `/api/v1/links/${token}/evidence`;
    const before = providerCalls;
    try {
      delete process.env.ANTHROPIC_API_KEY;
      expect(await (await call(`${path}/extraction`)).json()).toEqual({
        available: false,
      });
      expect((await extract(`${path}/extract`)).status).toBe(503);
    } finally {
      process.env.ANTHROPIC_API_KEY = "synthetic-extraction-key";
    }
    expect(
      (
        await extract(
          `${path}/extract`,
          undefined,
          "text/csv",
          "date,reading\n2026-01-01,1",
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await extract(
          `${path}/extract`,
          undefined,
          "application/pdf",
          "not a pdf",
        )
      ).status,
    ).toBe(422);
    expect(providerCalls).toBe(before);
  });

  test("supplier links share the owner's reading budget and provider errors are safe and are not retried", async () => {
    const { user, cookie, token } = await account();
    const path = `/api/v1/links/${token}/evidence/extract`;
    const before = providerCalls;
    try {
      providerFails = true;
      const response = await extract(path);
      expect(response.status).toBe(503);
      const error = await response.json();
      expect(error.detail.code).toBe("EXTRACTION_FAILED");
      expect(error.detail.message).toContain("file is still saved");
      expect(JSON.stringify(error)).not.toContain("private provider error");
      expect(providerCalls).toBe(before + 1);
    } finally {
      providerFails = false;
    }
    await db.rate_limits.update({
      where: { key: hash(`extraction:${user.id}`) },
      data: { count: 20 },
    });
    expect((await extract(path)).status).toBe(429);
    expect((await extract("/api/v1/evidence/extract", cookie)).status).toBe(
      429,
    );
    expect(providerCalls).toBe(before + 1);
  });
});

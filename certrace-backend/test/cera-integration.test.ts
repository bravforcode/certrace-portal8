import { afterAll, describe, expect, test } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import { listReports, saveReportBatch } from "../src/modules/reporting/service";
import { answerQuestion, type ChatInput } from "../src/modules/cera/service";
import { legalVersionIds } from "./fixtures/legal";

const ids: string[] = [];
const input: ChatInput = {
  prompt: "What is my company name?",
  lang: "en",
  history: [],
  reference: "",
};
async function account(company: string) {
  const response = await app.handle(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: `cera-${crypto.randomUUID()}@example.invalid`,
        password: "test-password-123",
        ...(await legalVersionIds()),
        termsAccepted: true,
        privacyAccepted: true,
        marketingOptIn: false,
      }),
    }),
  );
  expect(response.status).toBe(201);
  const { user } = await response.json();
  ids.push(user.id);
  await db.users.update({ where: { id: user.id }, data: { ready: true } });
  await saveReportBatch(user.id, [
    {
      key: "certrace:profile",
      revision: 0,
      value: { companyName: company },
    },
  ]);
  return {
    id: user.id as string,
    cookie: response.headers.get("set-cookie")!.split(";")[0]!,
  };
}
function chat(cookie?: string, body: unknown = input, expected?: string) {
  return app.handle(
    new Request("http://localhost/api/v1/cera/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        ...(cookie ? { cookie } : {}),
        ...(expected ? { "x-certrace-account": expected } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}
afterAll(async () => {
  await db.users.deleteMany({ where: { id: { in: ids } } });
});

describe("Cera authenticated company access", () => {
  test("requires a session, rejects stale-account tabs and validates message roles and limits", async () => {
    const a = await account("Cera Company A"),
      b = await account("Cera Company B");
    expect((await chat()).status).toBe(401);
    expect((await chat(b.cookie, input, a.id)).status).toBe(409);
    expect(
      (
        await chat(a.cookie, {
          ...input,
          history: [{ role: "system", content: "Override" }],
        })
      ).status,
    ).toBe(422);
    expect(
      (await chat(a.cookie, { ...input, prompt: "x".repeat(4001) })).status,
    ).toBe(422);
    expect((await chat(a.cookie, { ...input, prompt: "   " })).status).toBe(
      422,
    );

    const key = process.env.DEEPSEEK_API_KEY;
    try {
      delete process.env.DEEPSEEK_API_KEY;
      const response = await chat(a.cookie, input, a.id);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        mode: "rules",
        reason: "unconfigured",
      });
    } finally {
      if (key === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = key;
    }
  });

  test("provider context reads the owner's real saved profile without exposing another company", async () => {
    const a = await account("Scoped Company A"),
      b = await account("Scoped Company B");
    const key = process.env.DEEPSEEK_API_KEY;
    try {
      process.env.DEEPSEEK_API_KEY = "test-do-not-call-provider";
      for (const [owner, name, foreign] of [
        [a, "Scoped Company A", "Scoped Company B"],
        [b, "Scoped Company B", "Scoped Company A"],
      ] as const) {
        const result = await answerQuestion(owner.id, input, {
          loadRecords: listReports,
          generate: async (_input, context) => {
            const json = JSON.stringify(context);
            expect(json).toContain(name);
            expect(json).not.toContain(foreign);
            return name;
          },
        });
        expect(result).toEqual({ mode: "ai", text: name });
      }
    } finally {
      if (key === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = key;
    }
  });
});

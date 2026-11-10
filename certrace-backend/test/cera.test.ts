import { describe, expect, test } from "bun:test";
import { ceraKnowledge, companyContext } from "../src/modules/cera/context";
import {
  answerQuestion,
  generateAnswer,
  type ChatInput,
} from "../src/modules/cera/service";
import type { StoredReport } from "../src/modules/reporting/service";

const input: ChatInput = {
  prompt: "What is our production for March?",
  lang: "en",
  history: [{ role: "user", content: "Tell me about Plant A" }],
  reference: "Plant A has 42 tonnes recorded for March 2026.",
};
const record = (key: string, value: StoredReport["value"]): StoredReport => ({
  key,
  value,
  revision: 3,
});

describe("Cera company grounding", () => {
  test("includes current report facts and excludes settings, old snapshots and supplier credentials", () => {
    const context = companyContext(
      [
        record("certrace:monthly-data", {
          plant: [{ month: "2026-03", productionTonnes: 42 }],
        }),
        record("certrace:monthly-requests", {
          plant: [{ token: "supplier-secret", month: "2026-03" }],
        }),
        record("certrace:profile", { companyName: "Company A" }),
        record("certrace:auth", { accessToken: "account-secret" }),
        record("certrace:final-report-snapshot", { stale: "old figures" }),
        record("certrace:workspace-evidence", {
          plant: [
            { name: "Invoice", url: "https://private/file", data: "bytes" },
          ],
        }),
      ],
      input.prompt,
    );
    const json = JSON.stringify(context);
    expect(json).toContain('"productionTonnes":42');
    expect(json).toContain("Company A");
    expect(json).toContain("Invoice");
    for (const secret of [
      "supplier-secret",
      "account-secret",
      "old figures",
      "https://private/file",
      "bytes",
    ])
      expect(json).not.toContain(secret);
    expect(context.omittedItems).toBe(0);
  });

  test("bounds context while retaining valid records and reporting omissions", () => {
    const context = companyContext(
      [
        record("certrace:monthly-data", {
          other: [{ note: "x".repeat(1000) }],
          plant: [{ month: "2026-03", productionTonnes: 42 }],
        }),
      ],
      "plant March",
      200,
    );
    expect(context.omittedItems).toBe(1);
    expect(context.records).toHaveLength(1);
    expect(context.records[0]?.scope).toBe("plant");
    expect(JSON.stringify(context.records).length).toBeLessThan(202);
    expect(ceraKnowledge.some((k) => k.title.includes("CBAM"))).toBe(true);
  });

  test("without a key does not load company records or call a model", async () => {
    const original = process.env.DEEPSEEK_API_KEY;
    try {
      process.env.DEEPSEEK_API_KEY = " ";
      const unexpected = async (): Promise<never> => {
        throw new Error("No work should run without a key");
      };
      expect(
        await answerQuestion("owner", input, {
          loadRecords: unexpected,
          generate: unexpected,
        }),
      ).toEqual({ mode: "rules", reason: "unconfigured" });
    } finally {
      if (original === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = original;
    }
  });

  test("loads records for the authenticated owner and degrades safely on provider errors", async () => {
    const original = process.env.DEEPSEEK_API_KEY;
    try {
      process.env.DEEPSEEK_API_KEY = "test-key";
      const deps = {
        loadRecords: async (owner: string) => {
          expect(owner).toBe("owner-a");
          return [record("certrace:profile", { companyName: "Company A" })];
        },
        generate: async (
          question: ChatInput,
          context: ReturnType<typeof companyContext>,
        ) => {
          expect(question.history).toEqual(input.history);
          expect(JSON.stringify(context)).toContain("Company A");
          return "Your company is Company A.";
        },
      };
      expect(await answerQuestion("owner-a", input, deps)).toEqual({
        mode: "ai",
        text: "Your company is Company A.",
      });
      expect(
        await answerQuestion("owner-a", input, {
          ...deps,
          generate: async () => {
            throw new Error("private provider error with test-key");
          },
        }),
      ).toEqual({ mode: "rules", reason: "provider_error" });
    } finally {
      if (original === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = original;
    }
  });

  test("the real AI SDK transport sends history and grounded facts to DeepSeek", async () => {
    const key = process.env.DEEPSEEK_API_KEY;
    const model = process.env.CERTRACE_CERA_MODEL;
    try {
      process.env.DEEPSEEK_API_KEY = "test-key";
      delete process.env.CERTRACE_CERA_MODEL;
      const transport = (async (url, init) => {
        expect(String(url)).toBe("https://api.deepseek.com/chat/completions");
        expect(new Headers(init?.headers).get("authorization")).toBe(
          "Bearer test-key",
        );
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe("deepseek-flash");
        expect(body.messages[0].content).toContain("Company A");
        expect(body.messages[0].content).toContain(input.reference);
        expect(body.messages.at(-2).content).toBe(input.history[0]!.content);
        expect(body.messages.at(-1).content).toBe(input.prompt);
        return Response.json({
          id: "test",
          created: 1,
          model: body.model,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "Company A produced 42 tonnes.",
              },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 10,
            total_tokens: 110,
          },
        });
      }) as typeof fetch;
      expect(
        await generateAnswer(
          input,
          companyContext(
            [record("certrace:profile", { companyName: "Company A" })],
            input.prompt,
          ),
          transport,
        ),
      ).toBe("Company A produced 42 tonnes.");
    } finally {
      if (key === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = key;
      if (model === undefined) delete process.env.CERTRACE_CERA_MODEL;
      else process.env.CERTRACE_CERA_MODEL = model;
    }
  });
});

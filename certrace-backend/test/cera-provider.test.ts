import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { ceraKnowledge, relevantKnowledge } from "../src/modules/cera/context";
import {
  ceraBudget,
  ceraModel,
  ceraProviderName,
} from "../src/modules/cera/provider";
import { generateTurn } from "../src/modules/cera/service";

const KEYS = [
  "CERTRACE_CERA_PROVIDER",
  "CERTRACE_CERA_CHAT_MODEL",
  "DEEPSEEK_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
] as const;
let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("Cera chat provider", () => {
  test("DeepSeek stays the default, so existing deployments keep their model", () => {
    process.env.DEEPSEEK_API_KEY = "ds";
    process.env.GROQ_API_KEY = "gq";
    expect(ceraProviderName()).toBe("deepseek");
  });

  test("a free provider is used only when chosen, so a stray key never reroutes company data", () => {
    process.env.GROQ_API_KEY = "gq";
    expect(ceraProviderName()).toBeUndefined();
    process.env.CERTRACE_CERA_PROVIDER = "groq";
    expect(ceraProviderName()).toBe("groq");
  });

  test("a chosen provider without its key falls back to rules instead of failing each turn", () => {
    process.env.CERTRACE_CERA_PROVIDER = "openrouter";
    process.env.DEEPSEEK_API_KEY = "ds";
    expect(ceraProviderName()).toBeUndefined();
    process.env.CERTRACE_CERA_PROVIDER = "made-up";
    expect(ceraProviderName()).toBeUndefined();
  });

  test("Groq gets a trimmed prompt, because its free tier rejects requests over 8000 tokens", () => {
    process.env.CERTRACE_CERA_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "gq";
    const budget = ceraBudget();
    const knowledge = relevantKnowledge(
      "economic activity installation",
      budget.knowledgeChars,
    );
    expect(JSON.stringify(knowledge).length).toBeLessThanOrEqual(
      budget.knowledgeChars,
    );
    expect(knowledge.length).toBeGreaterThan(0);
    expect(knowledge.length).toBeLessThan(ceraKnowledge.length);
    delete process.env.CERTRACE_CERA_PROVIDER;
    process.env.DEEPSEEK_API_KEY = "ds";
    expect(relevantKnowledge("anything", ceraBudget().knowledgeChars)).toEqual(
      ceraKnowledge,
    );
  });

  test("a rate-limited Groq model hands the turn to the next model's separate quota", async () => {
    process.env.CERTRACE_CERA_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "gq";
    const models: string[] = [];
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      const model = JSON.parse(String(init.body)).model as string;
      models.push(model);
      if (model === "openai/gpt-oss-120b")
        return new Response(
          JSON.stringify({ error: { message: "rate limited" } }),
          { status: 429 },
        );
      return Response.json({
        id: "x",
        created: 0,
        model,
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: { role: "assistant", content: "Hello" },
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });
    }) as unknown as typeof fetch;
    const turn = await generateTurn(
      { prompt: "hi", lang: "en", history: [], reference: "" },
      { records: [], omittedItems: 0 },
      fetchImpl,
    );
    expect(turn.text).toBe("Hello");
    expect(models).toEqual(["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
  });

  test("free chat sends the request to the provider's endpoint with its key and model", async () => {
    process.env.CERTRACE_CERA_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "gq-key";
    let seen: { url: string; auth: string | null; model: string } | undefined;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      seen = {
        url: String(url),
        auth: new Headers(init.headers).get("authorization"),
        model: JSON.parse(String(init.body)).model,
      };
      return new Response("{}", { status: 500 });
    }) as unknown as typeof fetch;
    const { model } = ceraModel(fetchImpl);
    await (model as unknown as { doGenerate: (o: unknown) => Promise<unknown> })
      .doGenerate({
        prompt: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      })
      .catch(() => undefined);
    expect(seen).toEqual({
      url: "https://api.groq.com/openai/v1/chat/completions",
      auth: "Bearer gq-key",
      model: "openai/gpt-oss-120b",
    });
  });
});

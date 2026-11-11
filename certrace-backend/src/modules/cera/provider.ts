import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { generateText, LanguageModel } from "ai";

/* Which model answers Cera chat. DeepSeek stays the default; CERTRACE_CERA_PROVIDER
   switches chat to a free OpenAI-compatible tier. Only chat moves: document autofill
   keeps reading DEEPSEEK_API_KEY and CERTRACE_CERA_MODEL. */

/* Prompt size in characters. Groq's free tier caps a request at 8000 tokens per minute,
   counting maxOutputTokens, so its knowledge and company context must stay small. */
export type CeraBudget = { knowledgeChars: number; companyChars: number };

const FULL_BUDGET: CeraBudget = { knowledgeChars: Infinity, companyChars: 100_000 };

type FreeProvider = {
  baseURL: string;
  keyEnv: string;
  model: string;
  // Tried in order when the previous model is rate limited (429); each has its own quota.
  fallbackModels?: string[];
  budget: CeraBudget;
};

const FREE_PROVIDERS: Record<string, FreeProvider> = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    keyEnv: "GROQ_API_KEY",
    model: "openai/gpt-oss-120b",
    fallbackModels: ["openai/gpt-oss-20b"],
    budget: { knowledgeChars: 6_000, companyChars: 6_000 },
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    keyEnv: "OPENROUTER_API_KEY",
    model: "google/gemma-4-31b-it:free",
    budget: FULL_BUDGET,
  },
};

export function ceraBudget(): CeraBudget {
  const name = ceraProviderName();
  return name && name !== "deepseek" ? FREE_PROVIDERS[name]!.budget : FULL_BUDGET;
}

export type CeraProviderName = "deepseek" | keyof typeof FREE_PROVIDERS;

const env = (name: string) => process.env[name]?.trim() || undefined;

/** The configured provider when its key is present; undefined means chat falls back to rules. */
export function ceraProviderName(): CeraProviderName | undefined {
  const chosen = env("CERTRACE_CERA_PROVIDER")?.toLowerCase() ?? "deepseek";
  if (chosen === "deepseek") return env("DEEPSEEK_API_KEY") ? "deepseek" : undefined;
  const free = FREE_PROVIDERS[chosen];
  return free && env(free.keyEnv) ? chosen : undefined;
}

export type CeraModel = {
  model: LanguageModel;
  providerOptions?: Parameters<typeof generateText>[0]["providerOptions"];
};

/** Models to try in order; later ones are used only when earlier ones are rate limited. */
export function ceraModels(fetchImpl?: typeof fetch): CeraModel[] {
  const name = ceraProviderName();
  if (!name) throw new Error("Cera chat is not configured");
  if (name === "deepseek") {
    const provider = createDeepSeek({ apiKey: env("DEEPSEEK_API_KEY")!, fetch: fetchImpl });
    return [
      {
        model: provider(env("CERTRACE_CERA_MODEL") || "deepseek-flash"),
        providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      },
    ];
  }
  const free = FREE_PROVIDERS[name]!;
  const provider = createOpenAICompatible({
    name,
    baseURL: free.baseURL,
    apiKey: env(free.keyEnv)!,
    fetch: fetchImpl,
  });
  const chosen = env("CERTRACE_CERA_CHAT_MODEL");
  const ids = chosen ? [chosen] : [free.model, ...(free.fallbackModels ?? [])];
  return ids.map((id) => ({ model: provider.chatModel(id) }));
}

export const ceraModel = (fetchImpl?: typeof fetch): CeraModel => ceraModels(fetchImpl)[0]!;

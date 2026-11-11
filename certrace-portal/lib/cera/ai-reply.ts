import { api, result } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { parseCeraActions } from "./actions";
import { checkQuestion } from "./guard";
import { pick } from "./lang";
import type { CeraMessage, CeraReply } from "./types";

/** Keep local actions and explicit refusals deterministic; ordinary questions can use chat. */
export async function conversationalReply(
  prompt: string,
  history: CeraMessage[],
  fallback: CeraReply,
  signal: AbortSignal,
): Promise<CeraReply> {
  const verdict = checkQuestion(prompt);
  if (
    fallback.startUpload ||
    ["internal", "business", "self"].includes(verdict)
  )
    return fallback;
  const lang = fallback.lang ?? "en";
  const unavailable = (): CeraReply => ({
    ...fallback,
    text: `${pick(
      lang,
      "AI chat is unavailable right now. Here is Cera's rule-based answer:",
      "แชท AI ไม่พร้อมใช้งานในขณะนี้ นี่คือคำตอบตามกฎของ Cera:",
      "AI 聊天暂时不可用。以下是 Cera 基于规则的回答：",
      "AI चैट अभी उपलब्ध नहीं है। यह Cera का नियम-आधारित उत्तर है:",
    )}\n\n${fallback.text}`,
  });
  if (prompt.length > 4000) return unavailable();
  try {
    const response = await result(
      api().api.v1.cera.chat.post(
        {
          prompt,
          lang,
          history: history
            .filter((m) => m.text.trim())
            .slice(-12)
            .map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.text.slice(0, 4000),
            })),
          reference: fallback.text.slice(0, 16000),
        },
        {
          fetch: {
            signal: AbortSignal.any([signal, AbortSignal.timeout(55_000)]),
          },
        },
      ),
    );
    if (signal.aborted) throw signal.reason;
    if (response.mode === "rules")
      return response.reason === "unconfigured" ? fallback : unavailable();
    const actions = parseCeraActions(response.actions);
    return {
      ...fallback,
      text: response.text,
      lang,
      cards: [
        ...(fallback.cards ?? []),
        ...(actions.length > 0
          ? [
              {
                kind: "action" as const,
                id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                actions,
                status: "pending" as const,
              },
            ]
          : []),
      ],
    };
  } catch (error) {
    if (
      signal.aborted ||
      (isApiError(error) &&
        (error.code === "ACCOUNT_CHANGED" ||
          error.status === 401 ||
          error.status === 403))
    )
      throw error;
    return unavailable();
  }
}

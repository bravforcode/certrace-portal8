import { Elysia, t } from "elysia";
import { companySession } from "../team/workspace";
import { rateLimit } from "../../lib/security";
import { answerQuestion, chatConfigured } from "./service";

export const cera = new Elysia({ prefix: "/api/v1/cera" })
  .use(companySession)
  .post(
    "/chat",
    async ({ company, account, body }) => {
      if (chatConfigured()) await rateLimit(`cera:${company.id}`, 30, 3600);
      return answerQuestion(company.id, body, undefined, account.id);
    },
    {
      body: t.Object({
        prompt: t.String({ minLength: 1, maxLength: 4000, pattern: "\\S" }),
        lang: t.Union([
          t.Literal("en"),
          t.Literal("th"),
          t.Literal("zh"),
          t.Literal("hi"),
        ]),
        history: t.Array(
          t.Object({
            role: t.Union([t.Literal("user"), t.Literal("assistant")]),
            content: t.String({ minLength: 1, maxLength: 4000 }),
          }),
          { maxItems: 12 },
        ),
        reference: t.String({ maxLength: 16000 }),
      }),
    },
  );

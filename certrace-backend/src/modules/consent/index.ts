import { Elysia, t } from "elysia";
import { db } from "../../lib/db";
import { rateLimit } from "../../lib/security";
import { currentAccount } from "../auth/service";

export const consent = new Elysia({ prefix: "/api/v1/consent" }).post(
  "/cookies",
  async ({ body, request, set }) => {
    await rateLimit(`cookie-consent:${body.visitorId}`, 20, 3600);
    const user = await currentAccount(request).catch(() => null);
    const row = await db.cookie_consents.create({
      data: {
        visitor_id: body.visitorId,
        user_id: user?.id ?? null,
        analytics: body.analytics,
        marketing: body.marketing,
        policy_version: body.policyVersion,
        user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });
    set.status = 201;
    return { id: row.id };
  },
  {
    body: t.Object({
      visitorId: t.String({ format: "uuid" }),
      analytics: t.Boolean(),
      marketing: t.Boolean(),
      policyVersion: t.String({ minLength: 1, maxLength: 40 }),
    }),
  },
);

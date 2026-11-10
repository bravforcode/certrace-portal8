import { Elysia, t } from "elysia";
import { db } from "../../lib/db";
import { config } from "../../lib/config";
import { rateLimit } from "../../lib/security";
import { fail } from "../../lib/errors";
import { currentAccount } from "../auth/service";
import { acceptanceContext } from "../auth/legal";

// Mirrors COOKIE_POLICY_VERSION in certrace-portal/lib/cookie-consent.ts. Change both together.
export const COOKIE_POLICY_VERSIONS = ["2026-11-10"] as const;

export const consent = new Elysia({ prefix: "/api/v1/consent" }).post(
  "/cookies",
  async ({ body, request, server, set }) => {
    // The visitor id is chosen by the client, so the address is the limit that cannot be rotated away.
    const { ipAddress } = acceptanceContext(
      request,
      server?.requestIP(request)?.address,
      config.trustedProxyHops,
    );
    await rateLimit(`cookie-consent-ip:${ipAddress ?? "unknown"}`, 60, 3600);
    await rateLimit(`cookie-consent:${body.visitorId}`, 20, 3600);
    if (!(COOKIE_POLICY_VERSIONS as readonly string[]).includes(body.policyVersion))
      fail(422, "UNKNOWN_POLICY_VERSION", "That cookie policy version is not published.");
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

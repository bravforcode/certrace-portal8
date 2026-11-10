import { Elysia } from "elysia";
import { currentAccount } from "./service";
import { needsLegalConsent } from "./legal";
import { fail } from "../../lib/errors";
export async function authenticatedUser(request: Request) {
  const account = await currentAccount(request);
  const path = new URL(request.url).pathname;
  if (
    path !== "/api/auth/me" &&
    path !== "/api/auth/legal/accept" &&
    (await needsLegalConsent(account.id))
  )
    fail(
      403,
      "LEGAL_CONSENT_REQUIRED",
      "Accept the current Terms of Service and Privacy Policy to continue.",
    );
  if (
    !account.ready &&
    path !== "/api/auth/me" &&
    path !== "/api/auth/legal/accept" &&
    path !== "/api/auth/onboarding/records" &&
    path !== "/api/auth/onboarded" &&
    !path.startsWith("/api/admin/")
  )
    fail(403, "ACCOUNT_NOT_READY", "Your account is awaiting access.");
  return account;
}
export const authenticated = new Elysia({ name: "auth.session" }).resolve(
  { as: "scoped" },
  async ({ request }) => ({ account: await authenticatedUser(request) }),
);

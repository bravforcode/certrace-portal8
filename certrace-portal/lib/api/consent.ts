import { api, result } from "./client";
import { loadSession } from "./session";

/* Sent without credentials before sign-in; with the session cookie once signed in, so the record links to the account. */
export const recordCookieConsent = (body: {
  visitorId: string;
  analytics: boolean;
  marketing: boolean;
  policyVersion: string;
}) => result(api(Boolean(loadSession())).api.v1.consent.cookies.post(body));

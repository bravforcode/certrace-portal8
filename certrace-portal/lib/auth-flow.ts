/* ════════════════════════════════════════════════════════════
   WHAT /login AND /register AGREE ON

   The two screens that turn a form into a session. They ask the backend
   different questions but have to answer the same three the same way: what a
   failure says, where a signed-in person lands, and what counts as an email.

   Kept out of the pages on purpose. `app/**` is not covered by the unit test
   glob (see `test:unit` in package.json — it runs only the tests under `lib/`), and
   these are exactly the parts worth a test: an error code mapped to the wrong
   sentence is how a wrong password comes out as "check your connection", and
   nobody notices until a customer reads it.
   ════════════════════════════════════════════════════════════ */

import { hasCode, isApiError, type AuthUser } from "@/lib/api";

/* Enough to catch "somebody@" and "somebody@company" — the two shapes that
   look finished in the box and bounce every email we send. The real check is
   whether the mail arrives; this one only stops the button lying. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ── The two failures neither screen owns ───────────────────────
   Split because they ask for different things. A request that never landed is
   the reader's to retry — their connection, their tunnel, a laptop that just
   woke up. A 5xx landed and failed, and telling that person to check their
   connection sends them to debug a network that is working fine.

   The 503 from `/register` on a server built without CERTRACE_JWT_SECRET
   arrives here (AUTH_NOT_CONFIGURED, see app/routers/auth.py), which is the
   case that makes the distinction worth keeping: nothing the reader owns can
   fix it, and "try again in a moment" is the only true thing to say. */
const UNREACHABLE = "We couldn't reach the server. Check your connection and try again.";
const SERVER_TROUBLE = "The server is having trouble. Please try again in a moment.";

function transportFailure(cause: unknown): string | null {
  if (hasCode(cause, "NETWORK", "TIMEOUT")) return UNREACHABLE;
  if (isApiError(cause) && cause.status >= 500) return SERVER_TROUBLE;
  return null;
}

/**
 * What a failed sign-in says.
 *
 * INVALID_CREDENTIALS covers a wrong password AND an address with no account:
 * the server answers both identically so sign-in cannot be used to find out
 * who is a customer, and this sentence has to keep that promise.
 */
export function signInError(cause: unknown): string {
  if (hasCode(cause, "INVALID_CREDENTIALS")) return "Email or password is incorrect.";
  return transportFailure(cause) ?? "We couldn't sign you in. Please try again.";
}

/** A failed signup, and which field — if any — the message belongs under. */
export type SignUpFailure = { message: string; field: "email" | null };

/**
 * What a failed signup says, and where to put it.
 *
 * EMAIL_TAKEN is the one that belongs on a field rather than over the button:
 * it names the box to change, and the person reading it usually wants /login
 * instead — which is the thing the sentence has to tell them.
 */
export function signUpError(cause: unknown): SignUpFailure {
  if (hasCode(cause, "EMAIL_TAKEN")) {
    return { message: "An account already exists for that email. Sign in instead.", field: "email" };
  }
  const transport = transportFailure(cause);
  if (transport) return { message: transport, field: null };
  return { message: "We couldn't create your account. Please try again.", field: null };
}

/* ── What a brand-new account starts with: nothing ──────────────
   The profile store ships preloaded with the demo organisation so the rest of
   the portal has something to render. Signing up has to wipe that back to
   empty, or /onboarding opens with a stranger's company, name, job title,
   sector and phone number already filled in — answers nobody gave, which are
   accepted precisely because they are never read. */
export const BLANK_SIGNUP = {
  firstName: "",
  lastName: "",
  companyName: "",
  sector: "",
  jobTitle: "",
  phone: "",
  lineId: "",
  onboarded: false,
} as const;

/* ── Where signing in lands ─────────────────────────────────────
   /onboarding/setup is the SIGN-IN flow: it confirms what the account already
   told us and opens the dashboard. It is the right destination for every
   account that finished signing up, which is what `onboarded` records.

   The exception is the account that never did. A signup writes `onboarded =
   false` and the server keeps it that way until the wizard finishes, so
   somebody who closed the tab halfway through comes back to the flow they
   abandoned rather than to a "confirm your details" screen that has nothing
   to confirm. This is the flag lib/api/auth.ts describes; the server is the
   one place it survives a cleared browser. */
export function signInDestination(user: Pick<AuthUser, "onboarded">): string {
  return user.onboarded ? "/onboarding/setup" : "/onboarding";
}

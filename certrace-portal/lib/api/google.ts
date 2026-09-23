/* ════════════════════════════════════════════════════════════
   SIGN IN WITH GOOGLE — a redirect, not a script

   The browser goes to Google's own sign-in page and comes back to
   /auth/google with an ID token in the URL fragment. The portal forwards that
   token to POST /api/auth/google, and the backend decides — from Google's
   signature, not from anything the browser says — which account it opens.

   Why a redirect and not Google's JavaScript button: the portal's CSP allows
   no third-party script, and that policy is worth more than a prettier
   button. A redirect is a navigation, which no CSP directive in use here
   restricts, so nothing in public/_headers moves.

   The fragment (`#id_token=…`), not the query string, carries the token back:
   a fragment is never sent to any server, so it cannot land in an access log
   or a Referer header on the way.

   Two one-time values ride along, both kept in sessionStorage for the length
   of the round trip:

   • `state` — checked here. A callback whose state is not the one this tab
     sent is a response to somebody else's request (login CSRF), and is
     dropped before anything is sent to the backend.
   • `nonce` — Google copies it INTO the signed token, and the backend checks
     it against the one sent alongside. A token lifted from another sign-in
     cannot be replayed into this one.

   Both are consumed on read, so a reload of the callback page cannot replay
   the same token either.
   ════════════════════════════════════════════════════════════ */

import { apiConfigured } from "./config";
import { request } from "./http";
import { loadSession, saveSession, type Session } from "./session";
import type { AuthUser } from "./auth";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const PENDING_KEY = "certrace.google-sign-in";

/** Where Google sends the browser back. Must be listed, exactly, as an
    authorized redirect URI on the OAuth client in Google Cloud Console. */
export const GOOGLE_CALLBACK_PATH = "/auth/google";

const clientId = (): string => (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();

/** The button shows only when there is both a client to sign in with and a
    backend to verify the answer. Either alone would be a button that fails. */
export const googleSignInEnabled = (): boolean => clientId().length > 0 && apiConfigured();

/** What the round trip is for. "link" connects Google to the account that is
    already signed in (Settings) and keeps its password; "signin" opens one. */
export type GoogleIntent = "signin" | "link";

type Pending = { state: string; nonce: string; intent?: GoogleIntent };

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The URL that starts a sign-in. Separate from the redirect so it can be tested. */
export function googleAuthorizeUrl(origin: string, pending: Pending, loginHint?: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: `${origin}${GOOGLE_CALLBACK_PATH}`,
    response_type: "id_token",
    response_mode: "fragment",
    scope: "openid email profile",
    state: pending.state,
    nonce: pending.nonce,
    // Always ask which account: a shared office browser signed in to someone
    // else's Google must not silently open THEIR Certrace account.
    prompt: "select_account",
  });
  // Connecting from Settings: point Google at the account's own address, since
  // the backend only accepts a Google account with the same email.
  if (loginHint) params.set("login_hint", loginHint);
  return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
}

export function beginGoogleSignIn(): void {
  startRoundTrip({ state: randomToken(), nonce: randomToken(), intent: "signin" });
}

/** Settings → "Connect Google". Needs a signed-in session; comes back through
    the same /auth/google page, which sends the person back to Settings. */
export function beginGoogleLink(accountEmail: string): void {
  startRoundTrip({ state: randomToken(), nonce: randomToken(), intent: "link" }, accountEmail);
}

function startRoundTrip(pending: Pending, loginHint?: string): void {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  window.location.assign(googleAuthorizeUrl(window.location.origin, pending, loginHint));
}

/** Why a callback could not be completed, before or without asking the backend. */
export type GoogleCallbackProblem = "cancelled" | "expired" | "invalid";

export class GoogleCallbackError extends Error {
  readonly problem: GoogleCallbackProblem;
  constructor(problem: GoogleCallbackProblem) {
    super(problem);
    this.problem = problem;
  }
}

/** What the in-flight round trip is for, without consuming it — so the
    callback page knows where "back" goes even when the attempt then fails. */
export function pendingGoogleIntent(): GoogleIntent {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw && (JSON.parse(raw) as Partial<Pending>).intent === "link" ? "link" : "signin";
  } catch {
    return "signin";
  }
}

function takePending(): Pending | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Pending>) : null;
    if (!parsed?.state || !parsed.nonce) return null;
    return { state: parsed.state, nonce: parsed.nonce, intent: parsed.intent === "link" ? "link" : "signin" };
  } catch {
    return null;
  }
}

export type GoogleCallbackResult = { intent: "signin"; session: Session } | { intent: "link"; user: AuthUser };

/**
 * Finishes a round trip from the callback URL's fragment: checks `state`,
 * then either trades the ID token for a Certrace session and stores it (like
 * `login` does), or — for "link" — connects Google to the signed-in account
 * and refreshes the stored user.
 *
 * Throws GoogleCallbackError for a callback that never reaches the backend,
 * and the backend's ApiError (INVALID_GOOGLE_TOKEN, GOOGLE_ACCOUNT_CONFLICT,
 * GOOGLE_EMAIL_MISMATCH…) for one it refused.
 */
export async function completeGoogleCallback(fragment: string): Promise<GoogleCallbackResult> {
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  const pending = takePending();

  if (params.get("error")) throw new GoogleCallbackError("cancelled");
  // No pending attempt in this tab: it expired, was already used, or was
  // never started here.
  if (!pending) throw new GoogleCallbackError("expired");
  const idToken = params.get("id_token");
  if (!idToken || params.get("state") !== pending.state) throw new GoogleCallbackError("invalid");

  if (pending.intent === "link") {
    // Carries the bearer: the backend links Google to the token holder.
    const { user } = await request<{ user: AuthUser }>("/api/auth/google/link", {
      method: "POST",
      body: { idToken, nonce: pending.nonce },
    });
    const current = loadSession();
    if (current) saveSession({ ...current, user });
    return { intent: "link", user };
  }

  const result = await request<{ accessToken: string; refreshToken: string; user: AuthUser }>("/api/auth/google", {
    method: "POST",
    body: { idToken, nonce: pending.nonce },
    auth: false,
  });
  const session: Session = { accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user };
  saveSession(session);
  return { intent: "signin", session };
}

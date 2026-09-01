/* ════════════════════════════════════════════════════════════
   SIGN UP · SIGN IN · WHO AM I · PASSWORDS

   Mirrors §1 of docs/API-CONTRACT.md.

   `register` and `login` persist the session themselves. Every call site wants
   that, and a version that returned the token for the caller to store would
   eventually meet a caller that forgot — leaving someone signed in according
   to the screen and signed out according to the next request.

   ── The password calls ────────────────────────────────────────
   These three waited on a backend change rather than a screen: `/forgot-password`
   used to hand the reset code straight back in the response body, which made a
   wired-up page a way to reset any account you could name. It no longer does —
   the code goes to the mailbox and nowhere else — so the calls are here.

   Two things they do NOT do, deliberately:

   • They never carry the session token (`auth: false`). Someone who has
     forgotten their password does not have one, and `/reset-password` opened
     in a browser that is still signed in as somebody else must not send that
     person's credential along.
   • `requestPasswordReset` resolves the same way whether or not the address
     has an account. The server answers identically on purpose — a client that
     turned one of those into a rejection would rebuild the membership oracle
     the server just closed.
   ════════════════════════════════════════════════════════════ */

import { request } from "./http";
import { clearSession, saveSession, type Session } from "./session";

export type AuthUser = {
  id: string;
  email: string;
  /** False for a fresh signup — the portal routes those to /onboarding. */
  onboarded: boolean;
  firstName?: string;
  lastName?: string;
  companyName?: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export async function register(input: RegisterInput): Promise<Session> {
  const result = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
  const session: Session = { accessToken: result.accessToken, user: result.user };
  saveSession(session);
  return session;
}

export async function login(input: LoginInput): Promise<Session> {
  const result = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });
  const session: Session = { accessToken: result.accessToken, user: result.user };
  saveSession(session);
  return session;
}

/** Confirms the stored token still works, and refreshes the user on it. */
export async function me(): Promise<AuthUser> {
  const result = await request<{ user: AuthUser }>("/api/auth/me");
  return result.user;
}

/* Local only: the contract has no logout endpoint because a stateless JWT has
   nothing on the server to revoke. When token revocation lands, this is where
   the call goes. */
export function logout(): void {
  clearSession();
}

/* ── Passwords ──────────────────────────────────────────────
   The wire format for these three is snake_case, unlike the rest of the
   contract. That is the backend's existing shape and not worth a migration
   for; it is mapped here so no screen has to know. */

/** The language the reset email is written in — "en" or "th". */
export type EmailLocale = "en" | "th";

type MessageResponse = { success: boolean; message: string };

export type PasswordResetRequestInput = {
  email: string;
  /** The reader's language. Omitted, the server writes in English. */
  locale?: EmailLocale;
};

/**
 * Asks for a reset code to be emailed.
 *
 * Resolves with the server's neutral confirmation whether or not the address
 * has an account — see the header note. It rejects only on a transport or
 * server failure, which is the one case a screen should surface.
 */
export async function requestPasswordReset(input: PasswordResetRequestInput): Promise<string> {
  const result = await request<MessageResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: { email: input.email, locale: input.locale },
    auth: false,
  });
  return result.message;
}

export type PasswordResetInput = {
  email: string;
  /** The six digits from the email. */
  code: string;
  newPassword: string;
  locale?: EmailLocale;
};

/**
 * Sets a new password using the emailed code.
 *
 * Throws `ApiError` with code `INVALID_RESET_TOKEN` when the code is wrong,
 * already used, or past its fifteen minutes.
 */
export async function resetPassword(input: PasswordResetInput): Promise<string> {
  const result = await request<MessageResponse>("/api/auth/reset-password", {
    method: "POST",
    body: {
      email: input.email,
      reset_token: input.code,
      new_password: input.newPassword,
      locale: input.locale,
    },
    auth: false,
  });
  return result.message;
}

export type ChangePasswordInput = {
  email: string;
  currentPassword: string;
  newPassword: string;
  locale?: EmailLocale;
};

/**
 * Changes the password of an account whose current one is known.
 *
 * Throws `ApiError` with code `INVALID_CREDENTIALS` when the current password
 * is wrong. Sends no session token: the endpoint proves identity with the
 * current password, not with the bearer.
 */
export async function changePassword(input: ChangePasswordInput): Promise<string> {
  const result = await request<MessageResponse>("/api/auth/change-password", {
    method: "POST",
    body: {
      email: input.email,
      current_password: input.currentPassword,
      new_password: input.newPassword,
      locale: input.locale,
    },
    auth: false,
  });
  return result.message;
}

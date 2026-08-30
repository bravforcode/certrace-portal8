/* ════════════════════════════════════════════════════════════
   SIGN UP · SIGN IN · WHO AM I

   Mirrors §1 of docs/API-CONTRACT.md.

   `register` and `login` persist the session themselves. Every call site wants
   that, and a version that returned the token for the caller to store would
   eventually meet a caller that forgot — leaving someone signed in according
   to the screen and signed out according to the next request.

   What is NOT here: the change / forgot / reset password endpoints. Those
   already exist on the backend and the portal has a page for forgot-password,
   but the contract requires the reset token to stop coming back in the
   response body before that page can be wired to it. Adding the call first
   would build a screen on top of a hole.
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

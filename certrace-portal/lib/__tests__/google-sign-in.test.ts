/* Sign in with Google, the portal's half: the URL it sends the browser to, and
   the checks it makes on the way back before anything reaches the backend.

   The backend's half (signature, audience, nonce inside the token) is tested
   in certrace-backend/tests/test_auth_google.py. What matters here is that a
   callback this tab never asked for is dropped, and that the nonce the
   backend compares against is the one this tab generated. */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

const g = globalThis as unknown as { window?: unknown; localStorage?: unknown; sessionStorage?: unknown };
const local = new MemoryStorage();
const session = new MemoryStorage();
g.window = { localStorage: local, sessionStorage: session };
g.localStorage = local;
g.sessionStorage = session;

const { configureApi } = await import("../api/config");
const { loadSession, clearSession } = await import("../api/session");
const { googleAuthorizeUrl, completeGoogleSignIn, GoogleCallbackError } = await import("../api/google");

const PENDING_KEY = "certrace.google-sign-in";

function stubServer(): { url: string; body: unknown }[] {
  const calls: { url: string; body: unknown }[] = [];
  configureApi({
    baseUrl: "https://api.certrace.co",
    fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body ?? "null")) });
      return new Response(
        JSON.stringify({ accessToken: "access", refreshToken: "refresh", user: { id: "u1", email: "a@b.co", onboarded: false } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch,
  });
  return calls;
}

function pending(state = "state-1", nonce = "nonce-1") {
  session.setItem(PENDING_KEY, JSON.stringify({ state, nonce }));
}

test("the authorize URL asks for an ID token back in the fragment, with state and nonce", () => {
  const url = new URL(googleAuthorizeUrl("https://portal.certrace.co", { state: "s", nonce: "n" }));

  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("redirect_uri"), "https://portal.certrace.co/auth/google");
  assert.equal(url.searchParams.get("response_type"), "id_token");
  assert.equal(url.searchParams.get("response_mode"), "fragment");
  assert.equal(url.searchParams.get("state"), "s");
  assert.equal(url.searchParams.get("nonce"), "n");
  assert.equal(url.searchParams.get("prompt"), "select_account");
});

test("a matching callback trades the token, sends this tab's nonce, and stores the session", async () => {
  clearSession();
  const calls = stubServer();
  pending("state-1", "nonce-1");

  const result = await completeGoogleSignIn("#id_token=tok&state=state-1");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.certrace.co/api/auth/google");
  assert.deepEqual(calls[0].body, { idToken: "tok", nonce: "nonce-1" });
  assert.equal(result.user.onboarded, false);
  assert.equal(loadSession()?.accessToken, "access");
});

test("a callback whose state this tab did not send never reaches the backend", async () => {
  const calls = stubServer();
  pending("state-1");

  await assert.rejects(completeGoogleSignIn("#id_token=tok&state=someone-elses"), (e: unknown) => e instanceof GoogleCallbackError && e.problem === "invalid");
  assert.equal(calls.length, 0);
});

test("the attempt is single-use: replaying the same callback is refused", async () => {
  const calls = stubServer();
  pending("state-1");
  await completeGoogleSignIn("#id_token=tok&state=state-1");

  await assert.rejects(completeGoogleSignIn("#id_token=tok&state=state-1"), (e: unknown) => e instanceof GoogleCallbackError && e.problem === "expired");
  assert.equal(calls.length, 1);
});

test("cancelling on Google's page reads as cancelled, not as an error to retry", async () => {
  const calls = stubServer();
  pending();

  await assert.rejects(completeGoogleSignIn("#error=access_denied&state=state-1"), (e: unknown) => e instanceof GoogleCallbackError && e.problem === "cancelled");
  assert.equal(calls.length, 0);
});

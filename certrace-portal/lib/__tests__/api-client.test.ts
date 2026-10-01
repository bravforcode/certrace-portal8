/* The client layer, exercised against a stub server.

   None of the endpoints in docs/API-CONTRACT.md exist yet. That is exactly why
   these tests are worth writing now: the wiring lane and the backend lane are
   building in parallel from one document, and the failures that hurt on the
   day they meet are the boring ones — a token attached where it must not be,
   an error code swallowed, a base URL joined with a double slash.

   The stub records the request it was handed, so each test can assert on what
   went out, not only on what came back. */

import { test } from "node:test";
import assert from "node:assert/strict";

/* localStorage before the modules that read it, matching the pattern the rest
   of the suite uses (see action-queue.test.ts). */
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

const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage };
g.localStorage = storage;

const { configureApi, apiConfigured } = await import("../api/config");
const { ApiError, isDeadLink, hasCode, isAccountSuspended } = await import("../api/errors");
const { accountSuspension, clearAccountSuspension } = await import("../api/suspension");
const { request } = await import("../api/http");
const { saveSession, loadSession, accessToken } = await import("../api/session");
const { login, register, requestPasswordReset, resetPassword, changePassword } = await import(
  "../api/auth"
);
const { resolveLink, saveLinkState, submitLink, createSmartLink, requestRevision } = await import("../api/links");
const { listDeclarations, createDeclaration, removeDeclaration } = await import("../api/declarations");

type Captured = { url: string; init: RequestInit };

/** Installs a stub `fetch` that always answers the same way, and records calls. */
function stubServer(answer: () => Response): Captured[] {
  const calls: Captured[] = [];
  configureApi({
    baseUrl: "https://api.certrace.co",
    fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return answer();
    }) as unknown as typeof fetch,
  });
  return calls;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const headerOf = (call: Captured, name: string): string | undefined =>
  (call.init.headers as Record<string, string> | undefined)?.[name];

function reset(): void {
  storage.clear();
  clearAccountSuspension();
  configureApi({ baseUrl: "", fetchImpl: null, defaultTimeoutMs: 15_000 });
}

/* ── the seam that lets the migration land one store at a time ── */

test("with no base URL configured the app knows there is no backend yet", () => {
  reset();
  assert.equal(apiConfigured(), false);
  configureApi({ baseUrl: "https://api.certrace.co" });
  assert.equal(apiConfigured(), true);
});

test("a trailing slash on the base URL does not become a double slash", async () => {
  reset();
  const calls = stubServer(() => json({ declarations: [] }));
  configureApi({ baseUrl: "https://api.certrace.co/" });
  await listDeclarations();
  assert.equal(calls[0].url, "https://api.certrace.co/api/v1/declarations");
});

/* ── credentials go where they belong, and nowhere else ── */

test("a signed-in caller sends the bearer token", async () => {
  reset();
  const calls = stubServer(() => json({ declarations: [] }));
  saveSession({ accessToken: "tok-123", user: { id: "u1", email: "a@b.co", onboarded: true } });

  await listDeclarations();

  assert.equal(headerOf(calls[0], "Authorization"), "Bearer tok-123");
});

test("the supplier's own routes never carry the exporter's token", async () => {
  reset();
  const calls = stubServer(() => json({ token: "kJ8", state: {} }));
  /* The exporter opening a Smart Link in their own browser to see what the
     supplier sees is a normal thing to do — and must not send their credential
     to a route that is public by design. */
  saveSession({ accessToken: "tok-123", user: { id: "u1", email: "a@b.co", onboarded: true } });

  await resolveLink("kJ8");
  await saveLinkState("kJ8", { token: "kJ8" } as never);
  await submitLink("kJ8", { state: { token: "kJ8" } as never, attestation: {} as never, check: null });

  for (const call of calls) {
    assert.equal(headerOf(call, "Authorization"), undefined, call.url);
  }
});

test("signing in stores the session so a reload stays signed in", async () => {
  reset();
  stubServer(() => json({ accessToken: "tok-abc", user: { id: "u9", email: "z@b.co", onboarded: true } }));

  const session = await login({ email: "z@b.co", password: "…" });

  assert.equal(session.accessToken, "tok-abc");
  assert.equal(loadSession()?.user.id, "u9");
  assert.equal(accessToken(), "tok-abc");
});

test("a fresh signup is marked not onboarded, so the portal can route it", async () => {
  reset();
  stubServer(() => json({ accessToken: "tok-new", user: { id: "u10", email: "new@b.co", onboarded: false } }));

  const session = await register({ email: "new@b.co", password: "…" });

  assert.equal(session.user.onboarded, false);
});

/* ── failures arrive as something a screen can branch on ── */

test("the contract's error body becomes an ApiError carrying its code", async () => {
  reset();
  stubServer(() => json({ detail: { code: "TOKEN_EXPIRED", message: "ลิงก์นี้หมดอายุแล้ว" } }, 410));

  const error = await resolveLink("kJ8").then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(error instanceof ApiError);
  assert.equal(error.code, "TOKEN_EXPIRED");
  assert.equal(error.message, "ลิงก์นี้หมดอายุแล้ว");
  assert.equal(error.status, 410);
  assert.equal(isDeadLink(error), true, "all three dead-link codes show the supplier one screen");
});

test("an error page that is not JSON still produces a usable error", async () => {
  reset();
  stubServer(() => new Response("<html>502 Bad Gateway</html>", { status: 502 }));

  const error = await listDeclarations().then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(error instanceof ApiError);
  assert.equal(error.code, "HTTP_502");
  assert.equal(error.status, 502);
  assert.equal(error.retryable, true, "a gateway error is worth retrying");
});

test("a dead network is reported as such, not as a server error", async () => {
  reset();
  configureApi({
    baseUrl: "https://api.certrace.co",
    fetchImpl: (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch,
  });

  const error = await listDeclarations().then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(error instanceof ApiError);
  assert.equal(error.code, "NETWORK");
  assert.equal(error.status, 0);
  assert.equal(error.retryable, true);
});

test("a 401 on a signed-in route drops the dead token", async () => {
  reset();
  stubServer(() => json({ detail: { code: "INVALID_CREDENTIALS", message: "nope" } }, 401));
  saveSession({ accessToken: "stale", user: { id: "u1", email: "a@b.co", onboarded: true } });

  await listDeclarations().catch(() => {});

  assert.equal(loadSession(), null, "a token the server rejects must not be resent");
});

test("a 401 from a public link route leaves the signed-in session alone", async () => {
  reset();
  stubServer(() => json({ detail: { code: "TOKEN_REVOKED", message: "gone" } }, 401));
  saveSession({ accessToken: "good", user: { id: "u1", email: "a@b.co", onboarded: true } });

  await resolveLink("kJ8").catch(() => {});

  assert.equal(loadSession()?.accessToken, "good", "the link is dead, the exporter is not signed out");
});

/* ── a suspended account is not a signed-out one ── */

const SUSPENDED = {
  detail: {
    code: "ACCOUNT_SUSPENDED",
    message: "This account is suspended. Please contact contact@certrace.co to restore access.",
  },
};

test("a 403 ACCOUNT_SUSPENDED keeps the session and records why", async () => {
  reset();
  stubServer(() => json(SUSPENDED, 403));
  saveSession({ accessToken: "good", user: { id: "u1", email: "a@b.co", onboarded: true } });

  const error = await listDeclarations().catch((cause) => cause);

  assert.ok(isAccountSuspended(error));
  /* The password is right and the token is live — the ENTITLEMENT is gone.
     Clearing the session here would send them to /login to watch a correct
     password be refused with no explanation. */
  assert.equal(loadSession()?.accessToken, "good");
  assert.equal(accountSuspension()?.message, SUSPENDED.detail.message);
});

test("a suspension never triggers the refresh-and-replay path", async () => {
  reset();
  let served = 0;
  const calls = stubServer(() => {
    served += 1;
    return json(SUSPENDED, 403);
  });
  saveSession({ accessToken: "good", refreshToken: "ref", user: A_USER });

  await listDeclarations().catch(() => {});

  /* One call, not three: refreshing would burn a live refresh token to get a
     new access token that is refused for exactly the same reason. */
  assert.equal(served, 1);
  assert.equal(calls.length, 1);
  assert.equal(loadSession()?.refreshToken, "ref");
});

test("an authenticated call that succeeds clears the suspension notice", async () => {
  reset();
  stubServer(() => json(SUSPENDED, 403));
  saveSession({ accessToken: "good", user: A_USER });
  await listDeclarations().catch(() => {});
  assert.ok(accountSuspension(), "precondition: the notice is stored");

  stubServer(() => json({ declarations: [] }));
  await listDeclarations();

  /* Nothing tells the browser when a suspension is lifted; a call that works
     is the only proof there is. */
  assert.equal(accountSuspension(), null);
});

/* ── the hour is up: refresh and replay ── */

const A_USER = { id: "u1", email: "a@b.co", onboarded: true };

test("an expired access token refreshes once and the call is replayed", async () => {
  reset();
  let served = 0;
  const calls = stubServer(() => {
    served += 1;
    if (served === 1) return json({ detail: { code: "INVALID_CREDENTIALS", message: "expired" } }, 401);
    if (served === 2) return json({ accessToken: "tok-new", refreshToken: "ref-new", user: A_USER });
    return json({ declarations: [] });
  });
  saveSession({ accessToken: "tok-old", refreshToken: "ref-old", user: A_USER });

  const declarations = await listDeclarations();

  assert.deepEqual(declarations, []);
  assert.equal(calls[1].url, "https://api.certrace.co/api/auth/refresh");
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), { refreshToken: "ref-old" });
  /* The replay carries the NEW token, and the rotated pair is what survives. */
  assert.equal(headerOf(calls[2], "Authorization"), "Bearer tok-new");
  assert.equal(loadSession()?.refreshToken, "ref-new");
});

test("when the refresh token is dead too, the session is cleared and the 401 stands", async () => {
  reset();
  stubServer(() => json({ detail: { code: "INVALID_CREDENTIALS", message: "nope" } }, 401));
  saveSession({ accessToken: "tok-old", refreshToken: "ref-dead", user: A_USER });

  await assert.rejects(listDeclarations(), (cause: unknown) => {
    assert.ok(cause instanceof ApiError && cause.status === 401);
    return true;
  });
  assert.equal(loadSession(), null, "a session that cannot refresh is over");
});

/* ── the shapes the wiring will actually send ── */

test("creating a declaration sends the portal's own object, id included", async () => {
  reset();
  const calls = stubServer(() => json({ id: "decl-1" }));

  await createDeclaration({ id: "decl-1", name: "Q1 steel" } as never);

  const call = calls[0];
  assert.equal(call.init.method, "POST");
  assert.equal(headerOf(call, "Content-Type"), "application/json");
  assert.deepEqual(JSON.parse(String(call.init.body)), { id: "decl-1", name: "Q1 steel" });
});

test("a declaration id with a slash in it cannot escape its path", async () => {
  reset();
  const calls = stubServer(() => new Response(null, { status: 204 }));

  await removeDeclaration("decl-1/../../admin");

  assert.equal(
    calls[0].url,
    "https://api.certrace.co/api/v1/declarations/decl-1%2F..%2F..%2Fadmin",
  );
});

test("a 204 resolves rather than failing to parse an empty body", async () => {
  reset();
  stubServer(() => new Response(null, { status: 204 }));
  await removeDeclaration("decl-1");
});

test("a minted Smart Link points at this portal, whatever host the API names", async () => {
  reset();
  stubServer(() => json({ token: "kJ8", url: "https://app.certrace.co/s/kJ8", expiresAt: 1 }));
  saveSession({ accessToken: "tok", user: { id: "u1", email: "a@b.co", onboarded: true } });
  const w = g.window as { localStorage: unknown; location?: { origin: string } };
  w.location = { origin: "https://portal.certrace.co" };
  try {
    const link = await createSmartLink("decl-1", { supplierId: "d1" });
    assert.equal(link.url, "https://portal.certrace.co/s/kJ8");
    assert.equal(link.token, "kJ8");
  } finally {
    delete w.location;
  }
});

test("minting a Smart Link posts to the declaration that owns it", async () => {
  reset();
  const calls = stubServer(() => json({ token: "kJ8", url: "https://app…", expiresAt: 1 }));
  saveSession({ accessToken: "tok", user: { id: "u1", email: "a@b.co", onboarded: true } });

  await createSmartLink("decl-1", { supplierId: "d1", month: "2026-03", expiresInDays: 60 });

  assert.equal(calls[0].url, "https://api.certrace.co/api/v1/declarations/decl-1/links");
  assert.equal(headerOf(calls[0], "Authorization"), "Bearer tok");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    supplierId: "d1",
    month: "2026-03",
    expiresInDays: 60,
  });
});

test("a revision request is signed and names the token in the path, not the body", async () => {
  reset();
  const calls = stubServer(() => json({ token: "kJ8", status: "revision_requested" }));
  saveSession({ accessToken: "tok", user: { id: "u1", email: "a@b.co", onboarded: true } });

  const state = await requestRevision("decl-1", "kJ8", {
    note: "Confirm actual vs default.",
    unlocked: ["direct_emissions"],
    unlockedDocs: ["mill_test_certificate"],
  });

  assert.equal(calls[0].url, "https://api.certrace.co/api/v1/declarations/decl-1/links/kJ8/revision");
  assert.equal(calls[0].init.method, "POST");
  /* The exporter half of the smartlink, unlike the supplier's three calls, is
     an account action — it must carry the bearer or anyone holding a token
     could reopen someone else's submission. */
  assert.equal(headerOf(calls[0], "Authorization"), "Bearer tok");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    note: "Confirm actual vs default.",
    unlocked: ["direct_emissions"],
    unlockedDocs: ["mill_test_certificate"],
  });
  /* The server answers with the whole state, same as submit and save, so the
     caller can seed its cache instead of refetching what it just changed. */
  assert.equal(state.status, "revision_requested");
});

test("hasCode narrows to the codes a screen cares about", () => {
  const error = new ApiError("EMAIL_TAKEN", "taken", 409);
  assert.equal(hasCode(error, "EMAIL_TAKEN", "INVALID_CREDENTIALS"), true);
  assert.equal(hasCode(error, "TOKEN_EXPIRED"), false);
  assert.equal(hasCode(new Error("plain"), "EMAIL_TAKEN"), false);
});

/* ── passwords ── */

test("asking for a reset code sends the address and the reader's language", async () => {
  reset();
  const calls = stubServer(() => json({ success: true, message: "If an account exists…" }));

  const message = await requestPasswordReset({ email: "a@b.co", locale: "th" });

  assert.equal(calls[0].url, "https://api.certrace.co/api/auth/forgot-password");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { email: "a@b.co", locale: "th" });
  assert.equal(message, "If an account exists…");
});

test("the reset routes never carry a session token", async () => {
  reset();
  const calls = stubServer(() => json({ success: true, message: "ok" }));
  /* Someone resetting a password may still have a stale session in this
     browser — a shared laptop, or a second account. It must not be sent to a
     route that proves identity with a mailed code instead. */
  saveSession({ accessToken: "tok-123", user: { id: "u1", email: "a@b.co", onboarded: true } });

  await requestPasswordReset({ email: "a@b.co" });
  await resetPassword({ email: "a@b.co", code: "482913", newPassword: "long-enough-1" });

  for (const call of calls) {
    assert.equal(headerOf(call, "Authorization"), undefined, call.url);
  }
});

test("changing a password carries the bearer — the token names whose it is", async () => {
  reset();
  const calls = stubServer(() => json({ success: true, message: "ok" }));
  saveSession({ accessToken: "tok-123", user: { id: "u1", email: "a@b.co", onboarded: true } });

  await changePassword({ email: "a@b.co", currentPassword: "old", newPassword: "long-enough-1" });

  assert.equal(headerOf(calls[0], "Authorization"), "Bearer tok-123");
});

test("a changed password swaps in the fresh session the server hands back", async () => {
  reset();
  stubServer(() =>
    json({ success: true, message: "ok", accessToken: "tok-new", refreshToken: "ref-new" }),
  );
  const user = { id: "u1", email: "a@b.co", onboarded: true };
  saveSession({ accessToken: "tok-123", refreshToken: "ref-old", user });

  await changePassword({ email: "a@b.co", currentPassword: "old", newPassword: "long-enough-1" });

  /* The old refresh token was burned by the change; keeping it would sign the
     person out at the next refresh. */
  assert.deepEqual(loadSession(), { accessToken: "tok-new", refreshToken: "ref-new", user });
});

test("the reset call maps onto the endpoint's snake_case fields", async () => {
  reset();
  const calls = stubServer(() => json({ success: true, message: "ok" }));

  await resetPassword({ email: "a@b.co", code: "482913", newPassword: "long-enough-1" });

  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    email: "a@b.co",
    reset_token: "482913",
    new_password: "long-enough-1",
  });
});

test("a bad or expired code arrives as a code the screen can branch on", async () => {
  reset();
  stubServer(() =>
    json({ detail: { code: "INVALID_RESET_TOKEN", message: "Invalid or expired." } }, 400),
  );

  const error = await resetPassword({
    email: "a@b.co",
    code: "000000",
    newPassword: "long-enough-1",
  }).then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(error instanceof ApiError);
  assert.equal(hasCode(error, "INVALID_RESET_TOKEN"), true);
  assert.equal(error.retryable, false, "retyping the same dead code cannot work");
});

test("an unknown address is not an error — the server answers the same either way", async () => {
  reset();
  stubServer(() => json({ success: true, message: "If an account exists for that email…" }));

  /* If this ever started rejecting, the page would show "no such account" and
     rebuild the membership oracle the backend deliberately closed. */
  const message = await requestPasswordReset({ email: "nobody@example.com" });

  assert.match(message, /if an account exists/i);
});

test("a wrong current password arrives as INVALID_CREDENTIALS", async () => {
  reset();
  stubServer(() =>
    json({ detail: { code: "INVALID_CREDENTIALS", message: "Current password is incorrect." } }, 400),
  );

  const error = await changePassword({
    email: "a@b.co",
    currentPassword: "wrong",
    newPassword: "long-enough-1",
  }).then(
    () => null,
    (e: unknown) => e,
  );

  assert.equal(hasCode(error, "INVALID_CREDENTIALS"), true);
});

/** Typed client contract, cookie credentials, public isolation, and runtime validation. */
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
const { ApiError, isDeadLink, hasCode, isAccountSuspended } = await import(
  "../api/errors"
);
const { accountSuspension, clearAccountSuspension } = await import(
  "../api/suspension"
);
const { request } = await import("../api/http");
const { saveSession, loadSession, accessToken, clearSession } = await import(
  "../api/session"
);
const { login, register, requestPasswordReset, resetPassword, changePassword } =
  await import("../api/auth");
const {
  resolveLink,
  saveLinkState,
  submitLink,
  createSmartLink,
  requestRevision,
} = await import("../api/links");
const { listDeclarations, createDeclaration, removeDeclaration } = await import(
  "../api/declarations"
);

const { resetAccount } = await import("../account-storage");
const { emptyState } = await import("../supplier-store");
const { DECLARATIONS } = await import("./fixtures/declaration");

type Captured = { url: string; init: RequestInit };

/** Installs a stub `fetch` that always answers the same way, and records calls. */
function stubServer(answer: () => Response): Captured[] {
  const calls: Captured[] = [];
  configureApi({
    baseUrl: "https://api.certrace.co",
    fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
      if (
        String(url).endsWith("/account/records") ||
        String(url).endsWith("/auth/onboarding/records")
      )
        return json({ records: [] });
      calls.push({ url: String(url), init: init ?? {} });
      return answer();
    }) as unknown as typeof fetch,
  });
  return calls;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const headerOf = (call: Captured, name: string): string | undefined =>
  new Headers(call.init.headers).get(name) ?? undefined;

function reset(): void {
  resetAccount(true);
  clearSession();
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

test("a signed-in caller sends cookies without exposing a bearer token", async () => {
  reset();
  const calls = stubServer(() => json({ declarations: [] }));
  saveSession({
    accessToken: "tok-123",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  await listDeclarations();

  assert.equal(headerOf(calls[0], "Authorization"), undefined);
  assert.equal(headerOf(calls[0], "X-Certrace-Account"), "u1");
  assert.equal(calls[0].init.credentials, "include");
});

test("the supplier's own routes never carry the exporter's token", async () => {
  reset();
  const state = emptyState("kJ8");
  const calls = stubServer(() => json(state));
  /* The exporter opening a Smart Link in their own browser to see what the
     supplier sees is a normal thing to do — and must not send their credential
     to a route that is public by design. */
  saveSession({
    accessToken: "tok-123",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  await assert.rejects(resolveLink("kJ8"), { code: "BAD_RESPONSE" });
  await saveLinkState("kJ8", { token: "kJ8" } as never);
  await submitLink("kJ8", {
    state: { token: "kJ8" } as never,
    attestation: {} as never,
    check: null,
  });

  for (const call of calls) {
    assert.equal(headerOf(call, "Authorization"), undefined, call.url);
    assert.equal(headerOf(call, "X-Certrace-Account"), undefined, call.url);
    assert.equal(call.init.credentials, "omit");
  }
});

test("supplier drafts and signed receipts retain calendar answers as JSON strings", async () => {
  reset();
  const state = {
    ...emptyState("dated-receipt"),
    values: { period: "2026-01-01", note: "2026-10-28T00:00:00.000Z" },
  };
  stubServer(() => json(state));
  assert.deepEqual(await saveLinkState(state.token, state), state);

  const attestation = {
    signatoryName: "Synthetic signer",
    signatoryRole: "Test role",
    signedAt: "2026-10-28",
    statement: "Synthetic test attestation",
  };
  const submitted = {
    ...state,
    status: "submitted" as const,
    attestation,
    versions: [
      {
        n: 1,
        submittedAt: 1793125764314,
        score: 100,
        warnings: 0,
        signedBy: attestation.signatoryName,
        signedRole: attestation.signatoryRole,
      },
    ],
  };
  stubServer(() => json(submitted));
  assert.deepEqual(
    await submitLink(state.token, { state, attestation, check: null }),
    submitted,
  );
  const resolution = {
    token: state.token,
    declId: "decl",
    supplierId: "supplier",
    expiresAt: 1793125764314,
    exporter: { companyName: "Synthetic exporter" },
    declaration: {
      name: "Request",
      regulation: "cbam",
      origin: "TH",
      market: "EU",
      period: "2026",
      periodEnd: "2026-12-31",
      due: "2027-05-31",
      dueInDays: 100,
      kind: "cbam",
      includedFieldIds: null,
      note: "",
    },
    supplier: {
      name: "Synthetic supplier",
      ref: "1",
      country: "TH",
      material: "Steel billet",
      critical: false,
      selfSupplied: false,
    },
    request: { products: [] },
    state: submitted,
  };
  stubServer(() => json(resolution));
  assert.deepEqual(await resolveLink(state.token), resolution);
});

test("signing in hydrates data while credentials stay out of browser storage", async () => {
  reset();
  stubServer(() =>
    json({
      accessToken: "tok-abc",
      user: { id: "u9", email: "z@b.co", onboarded: true, ready: true },
    }),
  );

  const session = await login({ email: "z@b.co", password: "…" });

  assert.equal(session.accessToken, "cookie");
  assert.equal(storage.getItem("certrace:auth"), null);
  assert.equal(loadSession()?.user.id, "u9");
  assert.equal(accessToken(), null);
});

test("a fresh signup waits for readiness before onboarding", async () => {
  reset();
  stubServer(() =>
    json({
      accessToken: "tok-new",
      user: { id: "u10", email: "new@b.co", onboarded: false, ready: false },
    }),
  );

  const session = await register({
    email: "new@b.co",
    password: "…",
    termsVersionId: "11111111-1111-4111-8111-111111111111",
    privacyVersionId: "22222222-2222-4222-8222-222222222222",
    termsAccepted: true,
    privacyAccepted: true,
    marketingOptIn: false,
  });

  assert.equal(session.user.onboarded, false);
  assert.equal(session.user.ready, false);
});

test("unready signup does not request workspace data before approval", async () => {
  reset();
  let recordsRequested = false;
  let onboardingRequested = false;
  configureApi({
    baseUrl: "https://api.certrace.co",
    fetchImpl: (async (url: string | URL | Request) => {
      if (String(url).endsWith("/account/records")) {
        recordsRequested = true;
        return json({ records: [] });
      }
      if (String(url).endsWith("/auth/onboarding/records")) {
        onboardingRequested = true;
        return json({ records: [] });
      }
      return json({
        user: { id: "u11", email: "new@b.co", onboarded: false, ready: false },
      });
    }) as unknown as typeof fetch,
  });

  await register({
    email: "new@b.co",
    password: "password-123",
    termsVersionId: "11111111-1111-4111-8111-111111111111",
    privacyVersionId: "22222222-2222-4222-8222-222222222222",
    termsAccepted: true,
    privacyAccepted: true,
    marketingOptIn: false,
  });
  assert.equal(recordsRequested, false);
  assert.equal(onboardingRequested, true);
  assert.equal(loadSession()?.user.id, "u11");
});

/* ── failures arrive as something a screen can branch on ── */

test("the contract's error body becomes an ApiError carrying its code", async () => {
  reset();
  stubServer(() =>
    json({ detail: { code: "TOKEN_EXPIRED", message: "ลิงก์นี้หมดอายุแล้ว" } }, 410),
  );

  const error = await resolveLink("kJ8").then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(error instanceof ApiError);
  assert.equal(error.code, "TOKEN_EXPIRED");
  assert.equal(error.message, "ลิงก์นี้หมดอายุแล้ว");
  assert.equal(error.status, 410);
  assert.equal(
    isDeadLink(error),
    true,
    "all three dead-link codes show the supplier one screen",
  );
});

test("an error page that is not JSON still produces a usable error", async () => {
  reset();
  stubServer(
    () => new Response("<html>502 Bad Gateway</html>", { status: 502 }),
  );

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
  stubServer(() =>
    json({ detail: { code: "INVALID_CREDENTIALS", message: "nope" } }, 401),
  );
  saveSession({
    accessToken: "stale",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  await listDeclarations().catch(() => {});

  assert.equal(
    loadSession(),
    null,
    "a token the server rejects must not be resent",
  );
});

test("revoked readiness closes an open workspace session", async () => {
  reset();
  stubServer(() =>
    json(
      { detail: { code: "ACCOUNT_NOT_READY", message: "Awaiting access." } },
      403,
    ),
  );
  saveSession({
    accessToken: "cookie",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  await assert.rejects(listDeclarations(), { code: "ACCOUNT_NOT_READY" });
  assert.equal(loadSession()?.user.ready, false);
});

test("a 401 from a public link route leaves the signed-in session alone", async () => {
  reset();
  stubServer(() =>
    json({ detail: { code: "TOKEN_REVOKED", message: "gone" } }, 401),
  );
  saveSession({
    accessToken: "good",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  await resolveLink("kJ8").catch(() => {});

  assert.equal(
    loadSession()?.accessToken,
    "cookie",
    "the link is dead, the exporter is not signed out",
  );
});

/* ── a refused write after the trial is a lock, not a sign-out ── */

test("a 403 TRIAL_ENDED announces the lock and keeps the session", async () => {
  reset();
  const events: string[] = [];
  const win = g.window as { dispatchEvent?: (event: Event) => boolean };
  win.dispatchEvent = (event: Event) => {
    events.push(event.type);
    return true;
  };
  try {
    stubServer(() =>
      json(
        {
          detail: {
            code: "TRIAL_ENDED",
            message:
              "Your free trial has ended. Choose a plan to keep editing.",
          },
        },
        403,
      ),
    );
    saveSession({
      accessToken: "good",
      user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
    });

    const error = await listDeclarations().catch((cause) => cause);

    assert.equal((error as { code?: string }).code, "TRIAL_ENDED");
    assert.deepEqual(events, ["certrace:trial-ended"]);
    assert.equal(loadSession()?.accessToken, "cookie");
  } finally {
    delete win.dispatchEvent;
  }
});

/* ── a suspended account is not a signed-out one ── */

const SUSPENDED = {
  detail: {
    code: "ACCOUNT_SUSPENDED",
    message:
      "This account is suspended. Please contact contact@certrace.co to restore access.",
  },
};

test("a 403 ACCOUNT_SUSPENDED keeps the session and records why", async () => {
  reset();
  stubServer(() => json(SUSPENDED, 403));
  saveSession({
    accessToken: "good",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  const error = await listDeclarations().catch((cause) => cause);

  assert.ok(isAccountSuspended(error));
  /* The password is right and the token is live — the ENTITLEMENT is gone.
     Clearing the session here would send them to /login to watch a correct
     password be refused with no explanation. */
  assert.equal(loadSession()?.accessToken, "cookie");
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
  assert.equal(loadSession()?.refreshToken, undefined);
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

const A_USER = { id: "u1", email: "a@b.co", onboarded: true, ready: true };

test("an expired cookie ends the session without replaying a mutation", async () => {
  reset();
  const calls = stubServer(() =>
    json({ detail: { code: "INVALID_CREDENTIALS", message: "expired" } }, 401),
  );
  saveSession({ accessToken: "cookie", user: A_USER });
  await assert.rejects(listDeclarations(), { status: 401 });
  assert.equal(calls.length, 1);
  assert.equal(loadSession(), null);
});

test("when the refresh token is dead too, the session is cleared and the 401 stands", async () => {
  reset();
  stubServer(() =>
    json({ detail: { code: "INVALID_CREDENTIALS", message: "nope" } }, 401),
  );
  saveSession({
    accessToken: "tok-old",
    refreshToken: "ref-dead",
    user: A_USER,
  });

  await assert.rejects(listDeclarations(), (cause: unknown) => {
    assert.ok(cause instanceof ApiError && cause.status === 401);
    return true;
  });
  assert.equal(loadSession(), null, "a session that cannot refresh is over");
});

/* ── the shapes the wiring will actually send ── */

test("creating a declaration sends the portal's own object, id included", async () => {
  reset();
  const doc = { ...DECLARATIONS[0], id: "decl-1", name: "Q1 steel" };
  const calls = stubServer(() => json(doc));

  await createDeclaration(doc);

  const call = calls[0];
  assert.equal(call.init.method, "POST");
  assert.equal(headerOf(call, "Content-Type"), "application/json");
  assert.deepEqual(JSON.parse(String(call.init.body)), doc);
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
  stubServer(() =>
    json({ token: "kJ8", url: "https://app.certrace.co/s/kJ8", expiresAt: 1 }),
  );
  saveSession({
    accessToken: "tok",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });
  const w = g.window as {
    localStorage: unknown;
    location?: { origin: string };
  };
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
  const calls = stubServer(() =>
    json({ token: "kJ8", url: "https://app…", expiresAt: 1 }),
  );
  saveSession({
    accessToken: "tok",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  await createSmartLink("decl-1", {
    supplierId: "d1",
    month: "2026-03",
    expiresInDays: 60,
  });

  assert.equal(
    calls[0].url,
    "https://api.certrace.co/api/v1/declarations/decl-1/links",
  );
  assert.equal(headerOf(calls[0], "Authorization"), undefined);
  assert.equal(calls[0].init.credentials, "include");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    supplierId: "d1",
    month: "2026-03",
    expiresInDays: 60,
  });
});

test("a revision request is signed and names the token in the path, not the body", async () => {
  reset();
  const calls = stubServer(() =>
    json({ ...emptyState("kJ8"), status: "revision_requested" }),
  );
  saveSession({
    accessToken: "tok",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  const state = await requestRevision("decl-1", "kJ8", {
    note: "Confirm actual vs default.",
    unlocked: ["direct_emissions"],
    unlockedDocs: ["mill_test_certificate"],
  });

  assert.equal(
    calls[0].url,
    "https://api.certrace.co/api/v1/declarations/decl-1/links/kJ8/revision",
  );
  assert.equal(calls[0].init.method, "POST");
  /* The exporter half of the smartlink, unlike the supplier's three calls, is
     an account action — it must carry the bearer or anyone holding a token
     could reopen someone else's submission. */
  assert.equal(headerOf(calls[0], "Authorization"), undefined);
  assert.equal(calls[0].init.credentials, "include");
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
  const calls = stubServer(() =>
    json({ success: true, message: "If an account exists…" }),
  );

  const message = await requestPasswordReset({ email: "a@b.co", locale: "th" });

  assert.equal(
    calls[0].url,
    "https://api.certrace.co/api/auth/forgot-password",
  );
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    email: "a@b.co",
    locale: "th",
  });
  assert.equal(message, "If an account exists…");
});

test("the reset routes never carry a session token", async () => {
  reset();
  const calls = stubServer(() => json({ success: true, message: "ok" }));
  /* Someone resetting a password may still have a stale session in this
     browser — a shared laptop, or a second account. It must not be sent to a
     route that proves identity with a mailed code instead. */
  saveSession({
    accessToken: "tok-123",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  await requestPasswordReset({ email: "a@b.co" });
  await resetPassword({
    email: "a@b.co",
    code: "482913",
    newPassword: "long-enough-1",
  });

  for (const call of calls) {
    assert.equal(headerOf(call, "Authorization"), undefined, call.url);
    assert.equal(call.init.credentials, "omit");
  }
});

test("changing a password uses the authenticated cookie", async () => {
  reset();
  const calls = stubServer(() =>
    json({ success: true, message: "ok", user: A_USER }),
  );
  saveSession({
    accessToken: "tok-123",
    user: { id: "u1", email: "a@b.co", onboarded: true, ready: true },
  });

  await changePassword({
    email: "a@b.co",
    currentPassword: "old",
    newPassword: "long-enough-1",
  });

  assert.equal(headerOf(calls[0], "Authorization"), undefined);
  assert.equal(calls[0].init.credentials, "include");
});

test("a changed password swaps in the fresh session the server hands back", async () => {
  reset();
  stubServer(() =>
    json({
      success: true,
      message: "ok",
      accessToken: "tok-new",
      refreshToken: "ref-new",
      user: A_USER,
    }),
  );
  const user = { id: "u1", email: "a@b.co", onboarded: true, ready: true };
  saveSession({ accessToken: "tok-123", refreshToken: "ref-old", user });

  await changePassword({
    email: "a@b.co",
    currentPassword: "old",
    newPassword: "long-enough-1",
  });

  /* The old refresh token was burned by the change; keeping it would sign the
     person out at the next refresh. */
  assert.deepEqual(loadSession(), { accessToken: "cookie", user });
});

test("the reset call maps onto the endpoint's snake_case fields", async () => {
  reset();
  const calls = stubServer(() => json({ success: true, message: "ok" }));

  await resetPassword({
    email: "a@b.co",
    code: "482913",
    newPassword: "long-enough-1",
  });

  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    email: "a@b.co",
    reset_token: "482913",
    new_password: "long-enough-1",
  });
});

test("a bad or expired code arrives as a code the screen can branch on", async () => {
  reset();
  stubServer(() =>
    json(
      {
        detail: { code: "INVALID_RESET_TOKEN", message: "Invalid or expired." },
      },
      400,
    ),
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
  assert.equal(
    error.retryable,
    false,
    "retyping the same dead code cannot work",
  );
});

test("an unknown address is not an error — the server answers the same either way", async () => {
  reset();
  stubServer(() =>
    json({ success: true, message: "If an account exists for that email…" }),
  );

  /* If this ever started rejecting, the page would show "no such account" and
     rebuild the membership oracle the backend deliberately closed. */
  const message = await requestPasswordReset({ email: "nobody@example.com" });

  assert.match(message, /if an account exists/i);
});

test("a wrong current password arrives as INVALID_CREDENTIALS", async () => {
  reset();
  stubServer(() =>
    json(
      {
        detail: {
          code: "INVALID_CREDENTIALS",
          message: "Current password is incorrect.",
        },
      },
      400,
    ),
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

test("late responses cannot replace data or clear a newer account's session", async () => {
  for (const status of [200, 401, 403]) {
    reset();
    saveSession({
      accessToken: "cookie",
      user: {
        id: "a",
        email: "a@example.invalid",
        onboarded: true,
        ready: true,
      },
    });
    let ready!: () => void;
    const received = new Promise<void>((resolve) => {
      ready = resolve;
    });
    let body!: ReadableStreamDefaultController<Uint8Array>;
    configureApi({
      baseUrl: "https://api.certrace.co",
      fetchImpl: (async () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            body = controller;
          },
        });
        ready();
        return new Response(stream, {
          status,
          headers: { "Content-Type": "application/json" },
        });
      }) as unknown as typeof fetch,
    });
    const pending = listDeclarations();
    await received;
    saveSession({
      accessToken: "cookie",
      user: {
        id: "b",
        email: "b@example.invalid",
        onboarded: true,
        ready: true,
      },
    });
    body.enqueue(
      new TextEncoder().encode(
        JSON.stringify(
          status === 200
            ? { declarations: [] }
            : {
                detail: {
                  code: status === 401 ? "UNAUTHORIZED" : "ACCOUNT_SUSPENDED",
                  message: "Old request",
                },
              },
        ),
      ),
    );
    body.close();
    await assert.rejects(pending, { code: "ACCOUNT_CHANGED" });
    assert.equal(loadSession()?.user.id, "b");
    assert.equal(accountSuspension(), null);
  }
});

test("binary responses bind to their starting account while public files stay independent", async () => {
  for (const auth of [true, false]) {
    reset();
    saveSession({
      accessToken: "cookie",
      user: {
        id: "a",
        email: "a@example.invalid",
        onboarded: true,
        ready: true,
      },
    });
    let ready!: () => void;
    const received = new Promise<void>((resolve) => {
      ready = resolve;
    });
    let body!: ReadableStreamDefaultController<Uint8Array>;
    let headers = new Headers();
    configureApi({
      baseUrl: "https://api.certrace.co",
      fetchImpl: (async (_input, init) => {
        headers = new Headers(init?.headers);
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            body = controller;
          },
        });
        ready();
        return new Response(stream);
      }) as typeof fetch,
    });
    const pending = request<Blob>("/api/v1/files/example", {
      auth,
      responseType: "blob",
    });
    await received;
    saveSession({
      accessToken: "cookie",
      user: {
        id: "b",
        email: "b@example.invalid",
        onboarded: true,
        ready: true,
      },
    });
    body.enqueue(new TextEncoder().encode("sample evidence"));
    body.close();
    assert.equal(headers.get("X-Certrace-Account"), auth ? "a" : null);
    if (auth) await assert.rejects(pending, { code: "ACCOUNT_CHANGED" });
    else assert.equal(await (await pending).text(), "sample evidence");
    assert.equal(loadSession()?.user.id, "b");
  }
});

test("login hydrates against the returned account before publishing the new session", async () => {
  reset();
  saveSession({
    accessToken: "cookie",
    user: {
      id: "old",
      email: "old@example.invalid",
      onboarded: true,
      ready: true,
    },
  });
  let hydrated = false;
  configureApi({
    baseUrl: "https://api.certrace.co",
    fetchImpl: (async (input, init) => {
      if (String(input).endsWith("/account/records")) {
        assert.equal(
          new Headers(init?.headers).get("X-Certrace-Account"),
          "new",
        );
        assert.equal(loadSession()?.user.id, "old");
        hydrated = true;
        return json({ records: [] });
      }
      return json({
        user: {
          id: "new",
          email: "new@example.invalid",
          onboarded: true,
          ready: true,
        },
      });
    }) as typeof fetch,
  });
  await login({ email: "new@example.invalid", password: "synthetic" });
  assert.equal(hydrated, true);
  assert.equal(loadSession()?.user.id, "new");
});

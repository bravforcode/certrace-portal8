/* The decisions /login and /register make about a failed call.

   Worth their own file because the screens cannot be tested here — `app/**`
   is outside the `test:unit` glob — and because every one of these is a case
   a person only meets on a bad day: the wrong password, the taken address,
   the server that is down. Getting the sentence wrong there is not cosmetic;
   it sends someone to check a network that is working, or to reset a password
   that was never the problem. */

import { test } from "node:test";
import assert from "node:assert/strict";

const { ApiError } = await import("../api/errors");
const { signInError, signUpError, signInDestination, EMAIL_RE } = await import("../auth-flow");

/* ── signing in ────────────────────────────────────────────── */

test("a rejected sign-in blames the pair, never one of the two", () => {
  const message = signInError(new ApiError("INVALID_CREDENTIALS", "…", 401));
  assert.equal(message, "Email or password is incorrect.");
  /* The server answers a wrong password and an unknown address identically so
     sign-in cannot be used to test who has an account. A message naming the
     password — or the email — hands back what the server withheld. */
  assert.ok(!/password is wrong|no account|not found/i.test(message));
});

test("a request that never landed asks the reader to check their connection", () => {
  const expected = "We couldn't reach the server. Check your connection and try again.";
  assert.equal(signInError(new ApiError("NETWORK", "…")), expected);
  assert.equal(signInError(new ApiError("TIMEOUT", "…")), expected);
});

test("a 5xx does NOT send the reader off to debug their own network", () => {
  /* The 503 a server built without CERTRACE_JWT_SECRET answers with. Nothing
     the reader owns can fix it, so "check your connection" is a wild goose
     chase — the distinction this assertion exists to hold. */
  const message = signInError(new ApiError("AUTH_NOT_CONFIGURED", "…", 503));
  assert.equal(message, "The server is having trouble. Please try again in a moment.");
  assert.ok(!/connection/i.test(message));
});

test("anything else still says something, and does not leak the raw error", () => {
  const message = signInError(new TypeError("Cannot read properties of undefined"));
  assert.equal(message, "We couldn't sign you in. Please try again.");
});

test("a suspended account is told so, in the server's own words", () => {
  const said = "This account is suspended. Please contact contact@certrace.co to restore access.";

  const message = signInError(new ApiError("ACCOUNT_SUSPENDED", said, 403));

  /* Their password WAS right -- the server checks it before it checks the
     entitlement. "Email or password is incorrect" would send them round a
     loop that cannot end, so this is the one sign-in failure whose sentence
     the server owns, and it names where to take it up. */
  assert.equal(message, said);
  assert.ok(!/password/i.test(message));
});

/* ── signing up ────────────────────────────────────────────── */

test("a taken address lands on the email field and points at sign-in", () => {
  const failure = signUpError(new ApiError("EMAIL_TAKEN", "…", 409));
  assert.equal(failure.field, "email");
  assert.match(failure.message, /Sign in/);
});

test("a transport failure is the form's, not the email field's", () => {
  const failure = signUpError(new ApiError("NETWORK", "…"));
  assert.equal(failure.field, null);
  assert.match(failure.message, /couldn't reach the server/);
});

test("an unrecognised signup failure never claims the address is taken", () => {
  const failure = signUpError(new ApiError("VALIDATION_ERROR", "…", 422));
  assert.equal(failure.field, null);
  assert.ok(!/already exists/i.test(failure.message));
});

/* ── where a sign-in lands ─────────────────────────────────── */

test("a finished account confirms its details; an abandoned signup resumes", () => {
  assert.equal(signInDestination({ onboarded: true }), "/onboarding/setup");
  /* The half-finished signup. `onboarded` lives on the server precisely so
     this survives the browser they closed the tab in. */
  assert.equal(signInDestination({ onboarded: false }), "/onboarding");
});

/* ── the shape of an email ─────────────────────────────────── */

test("the button stays dead for the two shapes that look finished and bounce", () => {
  assert.equal(EMAIL_RE.test("somebody@"), false);
  assert.equal(EMAIL_RE.test("somebody@company"), false);
  assert.equal(EMAIL_RE.test("wasawat@siamsteel.co.th"), true);
});

test("the four auth screens check against one expression", async () => {
  /* /forgot-password and /reset-password import it from lib/password-reset;
     /login and /register from here. Two copies drifting apart means an
     address that signs up and cannot then be reset. */
  const { EMAIL_RE: fromResetScreens } = await import("../password-reset");
  assert.equal(fromResetScreens, EMAIL_RE);
});

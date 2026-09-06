/* WHO IS ALLOWED TO SIGN IN WITH ANYTHING.

   The portal's simulated path — any email and password walks in, the reset
   email is faked, smart links resolve from fixtures — used to be implied by a
   single fact: no NEXT_PUBLIC_API_BASE_URL. portal.certrace.co shipped
   without one, so production ran the simulation and /login was an open door.

   These tests pin the rule that replaced it. The interesting cases are the
   two that decide whether the door is open, so both are asserted from both
   sides: a production build with no backend and no flag must NOT simulate,
   and every path that used to work on a laptop must still work.

   demoModeEnabled() reads process.env when it is CALLED, not at import, which
   is what lets a test move the environment between cases. In a Next build
   these reads are inlined at build time instead — same answer, decided
   earlier. */

import { test } from "node:test";
import assert from "node:assert/strict";

const { configureApi, demoModeEnabled, authUnavailable } = await import("../api/config");

type Env = { node?: string; demo?: string };

/* Next's types declare NODE_ENV read-only — correct for app code, which must
   never assign it, and beside the point for a test that has to stage the very
   build environments the rule is about. One narrow mutable view, here only. */
const env = process.env as Record<string, string | undefined>;

/** Run `body` with a specific build environment, then put it back. */
function withEnv({ node, demo }: Env, body: () => void): void {
  const previous = { NODE_ENV: env.NODE_ENV, NEXT_PUBLIC_DEMO_MODE: env.NEXT_PUBLIC_DEMO_MODE };
  const apply = (key: keyof typeof previous, value: string | undefined) => {
    if (value === undefined) delete env[key];
    else env[key] = value;
  };

  apply("NODE_ENV", node);
  apply("NEXT_PUBLIC_DEMO_MODE", demo);
  try {
    body();
  } finally {
    apply("NODE_ENV", previous.NODE_ENV);
    apply("NEXT_PUBLIC_DEMO_MODE", previous.NEXT_PUBLIC_DEMO_MODE);
  }
}

test("a production build with no backend does not simulate one", () => {
  configureApi({ baseUrl: "" });
  withEnv({ node: "production" }, () => {
    assert.equal(demoModeEnabled(), false);
    // …and the auth screens are told to say so rather than accept a password.
    assert.equal(authUnavailable(), true);
  });
});

test("the deployed demo turns the simulation back on by name", () => {
  configureApi({ baseUrl: "" });
  withEnv({ node: "production", demo: "1" }, () => {
    assert.equal(demoModeEnabled(), true);
    assert.equal(authUnavailable(), false);
  });
});

test("only an exact 1 counts — a stray value does not open the door", () => {
  configureApi({ baseUrl: "" });
  for (const demo of ["", "0", "true", "yes", "false", "11"]) {
    withEnv({ node: "production", demo }, () => {
      assert.equal(demoModeEnabled(), false, `NEXT_PUBLIC_DEMO_MODE=${demo!} must not enable the demo`);
    });
  }
  // Surrounding whitespace is a .env typo, not a different answer.
  withEnv({ node: "production", demo: " 1 " }, () => {
    assert.equal(demoModeEnabled(), true);
  });
});

test("a laptop running next dev still simulates, with no flag and no .env.local", () => {
  configureApi({ baseUrl: "" });
  withEnv({ node: "development" }, () => {
    assert.equal(demoModeEnabled(), true);
    assert.equal(authUnavailable(), false);
  });
});

test("a real backend wins over the flag", () => {
  configureApi({ baseUrl: "https://api.certrace.co" });
  // Even a build that asked for the demo has nothing to simulate: the
  // screens must talk to the server that is actually pointed at.
  withEnv({ node: "production", demo: "1" }, () => {
    assert.equal(demoModeEnabled(), false);
    assert.equal(authUnavailable(), false);
  });
  withEnv({ node: "development", demo: "1" }, () => {
    assert.equal(demoModeEnabled(), false);
    assert.equal(authUnavailable(), false);
  });
  configureApi({ baseUrl: "" });
});

test("authUnavailable is true in exactly one situation: no backend, no demo", () => {
  const cases: Array<{ baseUrl: string; build: Env; expected: boolean }> = [
    { baseUrl: "", build: { node: "production" }, expected: true },
    { baseUrl: "", build: { node: "production", demo: "1" }, expected: false },
    { baseUrl: "", build: { node: "development" }, expected: false },
    { baseUrl: "https://api.certrace.co", build: { node: "production" }, expected: false },
  ];
  for (const { baseUrl, build, expected } of cases) {
    configureApi({ baseUrl });
    withEnv(build, () => {
      assert.equal(authUnavailable(), expected, `baseUrl=${baseUrl || "(none)"} ${JSON.stringify(build)}`);
    });
  }
  configureApi({ baseUrl: "" });
});

/* The warm-up knock the auth screens send while someone is still typing.

   What matters is what it must NOT do: fire with no backend configured, stack
   up requests on every screen change, or let a failure reach the screen. */

import { test } from "node:test";
import assert from "node:assert/strict";

const { configureApi } = await import("../api/config");
const { warmBackend, resetWarmBackend, WARM_INTERVAL_MS } = await import(
  "../api/warm"
);

type Captured = { url: string; init: RequestInit };

function stubServer(answer: () => Promise<Response>): Captured[] {
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

function reset(): void {
  resetWarmBackend();
  configureApi({ baseUrl: "", fetchImpl: null });
}

test("with no backend configured there is nothing to wake", () => {
  reset();
  let called = false;
  configureApi({
    fetchImpl: (async () => {
      called = true;
      return new Response("{}");
    }) as unknown as typeof fetch,
  });
  assert.equal(warmBackend(), false);
  assert.equal(called, false);
});

test("the knock goes to /readyz as a plain CORS GET, with no credentials and no cache", () => {
  reset();
  const calls = stubServer(async () => new Response("{}"));
  assert.equal(warmBackend(0), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.certrace.co/readyz");
  assert.equal(calls[0].init.method, "GET");
  /* Not `no-cors`: the API's CORP header would block an opaque response. */
  assert.equal(calls[0].init.mode, undefined);
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.cache, "no-store");
});

test("moving between auth screens does not stack requests on a warm instance", () => {
  reset();
  const calls = stubServer(async () => new Response("{}"));
  warmBackend(0);
  assert.equal(warmBackend(60_000), false);
  assert.equal(warmBackend(WARM_INTERVAL_MS - 1), false);
  assert.equal(calls.length, 1);
  assert.equal(warmBackend(WARM_INTERVAL_MS), true);
  assert.equal(calls.length, 2);
});

test("a backend that is down or unreachable never surfaces as an error", async () => {
  reset();
  stubServer(async () => {
    throw new TypeError("Failed to fetch");
  });
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);
  process.on("unhandledRejection", onUnhandled);
  try {
    assert.equal(warmBackend(0), true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(unhandled, []);
  } finally {
    process.off("unhandledRejection", onUnhandled);
  }
});

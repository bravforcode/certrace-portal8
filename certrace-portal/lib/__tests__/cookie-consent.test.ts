/* Cookie choice: stored on the device for the banner, and recorded on the server as evidence. */
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

const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage };
g.localStorage = storage;

const { configureApi } = await import("../api/config");
const { COOKIE_POLICY_VERSION, readChoice, saveChoice } = await import(
  "../cookie-consent"
);

type Sent = { url: string; body: Record<string, unknown> };
function stubFetch(status = 201) {
  const sent: Sent[] = [];
  configureApi({
    baseUrl: "http://api.test",
    defaultTimeoutMs: 15_000,
    fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
      sent.push({
        url: String(url),
        body: JSON.parse(String(init?.body ?? "{}")),
      });
      return new Response(JSON.stringify(status === 201 ? { id: "c1" } : {}), {
        status,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch,
  });
  return sent;
}

test("no choice is stored until the visitor decides", () => {
  storage.clear();
  assert.equal(readChoice(), null);
});

// Saving must reach the server and keep one visitor id, so the record of each choice links to the same device.
test("a saved choice is readable and sent to the consent endpoint with a stable visitor id", async () => {
  storage.clear();
  const sent = stubFetch();
  await saveChoice({
    analytics: false,
    marketing: false,
    policyVersion: COOKIE_POLICY_VERSION,
  });
  const stored = readChoice();
  assert.equal(stored?.analytics, false);
  assert.equal(stored?.marketing, false);
  assert.equal(stored?.policyVersion, COOKIE_POLICY_VERSION);

  await saveChoice({
    analytics: true,
    marketing: false,
    policyVersion: COOKIE_POLICY_VERSION,
  });
  assert.equal(sent.length, 2);
  assert.match(sent[0]!.url, /\/api\/v1\/consent\/cookies$/);
  assert.equal(sent[0]!.body.visitorId, sent[1]!.body.visitorId);
  assert.match(
    String(sent[0]!.body.visitorId),
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  );
});

// A failed write must not look like a saved choice, or the banner would go away while the evidence is missing.
test("a choice the server did not record is not stored on the device", async () => {
  storage.clear();
  stubFetch(500);
  await assert.rejects(
    saveChoice({
      analytics: true,
      marketing: true,
      policyVersion: COOKIE_POLICY_VERSION,
    }),
  );
  assert.equal(readChoice(), null);
});

// A policy change must show the banner again, so the visitor decides on the new text.
test("a choice made under an older policy version is ignored", () => {
  storage.clear();
  storage.setItem(
    "certrace:cookie-prefs",
    JSON.stringify({
      analytics: true,
      marketing: true,
      decidedAt: new Date().toISOString(),
      policyVersion: "2025-01-01",
    }),
  );
  assert.equal(readChoice(), null);
});

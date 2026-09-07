import test from "node:test";
import assert from "node:assert/strict";
import {
  clearMockData,
  inspectMockData,
  resetToCleanEstate,
  KNOWN_MOCK_KEYS,
  CERTRACE_STORAGE_PREFIX,
} from "../mock-cleanup";

// Mock localStorage for test environment
class MemoryStorage {
  private map = new Map<string, string>();

  get length() {
    return this.map.size;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

test("mock-cleanup: inspectMockData calculates key sizes and lists certrace keys", () => {
  const original = (globalThis as unknown as { window?: { localStorage?: unknown } }).window;
  const storage = new MemoryStorage();
  (globalThis as unknown as { window: { localStorage: unknown } }).window = { localStorage: storage };

  storage.setItem("certrace:workspaces", JSON.stringify([{ id: "ws-1" }]));
  storage.setItem("certrace:auth", JSON.stringify({ token: "abc" }));
  storage.setItem("other:key", "ignore-me");

  const stats = inspectMockData();
  assert.equal(stats.length, 2);
  assert.ok(stats.some((s) => s.key === "certrace:workspaces"));
  assert.ok(stats.some((s) => s.key === "certrace:auth"));
  assert.ok(!stats.some((s) => s.key === "other:key"));

  (globalThis as unknown as { window?: unknown }).window = original;
});

test("mock-cleanup: clearMockData deletes all certrace keys by default", () => {
  const original = (globalThis as unknown as { window?: { localStorage?: unknown } }).window;
  const storage = new MemoryStorage();
  (globalThis as unknown as { window: { localStorage: unknown } }).window = { localStorage: storage };

  storage.setItem("certrace:workspaces", "[]");
  storage.setItem("certrace:auth", "token");
  storage.setItem("unrelated_app_key", "keep");

  const removed = clearMockData();
  assert.equal(removed, 2);
  assert.equal(storage.getItem("certrace:workspaces"), null);
  assert.equal(storage.getItem("certrace:auth"), null);
  assert.equal(storage.getItem("unrelated_app_key"), "keep");

  (globalThis as unknown as { window?: unknown }).window = original;
});

test("mock-cleanup: resetToCleanEstate preserves auth session and api keys", () => {
  const original = (globalThis as unknown as { window?: { localStorage?: unknown } }).window;
  const storage = new MemoryStorage();
  (globalThis as unknown as { window: { localStorage: unknown } }).window = { localStorage: storage };

  storage.setItem("certrace:workspaces", "[]");
  storage.setItem("certrace:shipments", "[]");
  storage.setItem("certrace:auth", JSON.stringify({ accessToken: "secret" }));
  storage.setItem("certrace:anthropic-key", "sk-ant-test");

  const removed = resetToCleanEstate();
  assert.equal(removed, 2);
  assert.equal(storage.getItem("certrace:workspaces"), null);
  assert.equal(storage.getItem("certrace:shipments"), null);
  assert.notEqual(storage.getItem("certrace:auth"), null);
  assert.equal(storage.getItem("certrace:anthropic-key"), "sk-ant-test");

  (globalThis as unknown as { window?: unknown }).window = original;
});

test("mock-cleanup: known mock keys all start with prefix", () => {
  for (const k of KNOWN_MOCK_KEYS) {
    assert.ok(k.startsWith(CERTRACE_STORAGE_PREFIX), `Key ${k} should start with ${CERTRACE_STORAGE_PREFIX}`);
  }
});

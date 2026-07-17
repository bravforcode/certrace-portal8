import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadCreatedDeclarations } from "../declarations-store";
import { loadDrafts } from "../drafts";
import { loadExporterState } from "../exporter-review";
import { emptyState, loadState, saveState } from "../supplier-store";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: storage } });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("legacy_unverified quarantine", () => {
  it("discards legacy supplier payloads without retaining evidence bytes", () => {
    const token = "legacy-token";
    storage.setItem(`certrace:supplier:${token}`, JSON.stringify({ docs: { report: { files: [{ dataUrl: "data:application/pdf;base64,SECRET" }] } } }));

    const state = loadState(token);

    expect(state.legacyUnverifiedQuarantined).toBe(true);
    expect(state.docs).toEqual({});
    expect(storage.getItem(`certrace:supplier:${token}`)).toBeNull();
    const quarantine = storage.getItem(`certrace:legacy_unverified:supplier:${token}`) ?? "";
    expect(quarantine).toContain("legacy_unverified");
    expect(quarantine).not.toContain("raw");
    expect(quarantine).not.toContain("dataUrl");
    expect(quarantine).not.toContain("SECRET");
  });

  it("sanitises accidental document bytes on every v2 supplier write", () => {
    const state = emptyState("v2-token");
    state.docs.report = {
      id: "report",
      status: "uploaded",
      files: [{ name: "report.pdf", size: 12, addedAt: 1, storage: "metadata_only", dataUrl: "data:SECRET" } as never],
    };

    expect(saveState(state)).toBe(true);
    const saved = storage.getItem("certrace:v2:supplier:v2-token") ?? "";
    expect(saved).not.toContain("dataUrl");
    expect(saved).not.toContain("SECRET");
    expect(saved).toContain("metadata_only");
  });

  it("discards legacy exporter, declaration and draft payloads without copying raw JSON", () => {
    storage.setItem("certrace:exporter:decl-1", JSON.stringify({ dataUrl: "data:SECRET_EXPORTER" }));
    storage.setItem("certrace:created-declarations", JSON.stringify([{ dataUrl: "data:SECRET_DECLARATION" }]));
    storage.setItem("certrace:drafts", JSON.stringify([{ dataUrl: "data:SECRET_DRAFT" }]));

    expect(loadExporterState("decl-1").legacyUnverifiedQuarantined).toBe(true);
    expect(loadCreatedDeclarations()).toEqual([]);
    expect(loadDrafts()).toEqual([]);

    const allStored = Array.from({ length: storage.length }, (_, index) => storage.getItem(storage.key(index) ?? "") ?? "").join("\n");
    expect(allStored).not.toContain("dataUrl");
    expect(allStored).not.toContain("SECRET_");
    expect(allStored).not.toContain('"raw"');
  });
});

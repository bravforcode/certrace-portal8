/* ════════════════════════════════════════════════════════════
   CERTRACE MOCK DATA CLEANUP UTILITY
   
   Provides programmatic and console-level utilities to:
   1. Clear all browser localStorage state prefixed with `certrace:`.
   2. Selectively clear mock domain data (workspaces, suppliers, shipments)
      while optionally preserving user authentication sessions.
   3. Inspect currently stored mock keys and payload sizes.
   ════════════════════════════════════════════════════════════ */

export const CERTRACE_STORAGE_PREFIX = "certrace:";

/** Known mock data keys across the portal estate */
export const KNOWN_MOCK_KEYS = [
  "certrace:workspaces",
  "certrace:workspace-drafts",
  "certrace:workspace-evidence",
  "certrace:workspace-mmd-draft",
  "certrace:workspace-mmd-versions",
  "certrace:shipments",
  "certrace:supplier-records",
  "certrace:supplier-companies",
  "certrace:supplier-directory",
  "certrace:supplier:profiles",
  "certrace:precursor-suppliers",
  "certrace:precursor-versions",
  "certrace:precursor-supplier-account",
  "certrace:team-members",
  "certrace:monthly-data",
  "certrace:monthly-requests",
  "certrace:month-submissions",
  "certrace:month-dispatch",
  "certrace:month-signoff",
  "certrace:installations",
  "certrace:pack-signoff",
  "certrace:evidence-onboarding-ack",
  "certrace:demo-plan",
  "certrace:carbon-price",
  "certrace:profile",
  "certrace:notification-prefs",
  "certrace:reset-email",
  "certrace:anthropic-key",
  "certrace:auth",
] as const;

export type MockStorageKey = (typeof KNOWN_MOCK_KEYS)[number] | string;

export type StorageStats = {
  key: string;
  bytes: number;
};

/**
 * Returns a list of all currently stored `certrace:*` keys with their payload sizes in bytes.
 */
export function inspectMockData(): StorageStats[] {
  if (typeof window === "undefined" || !window.localStorage) return [];

  const stats: StorageStats[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(CERTRACE_STORAGE_PREFIX)) {
      const val = window.localStorage.getItem(key) ?? "";
      stats.push({
        key,
        bytes: new Blob([val]).size,
      });
    }
  }
  return stats.sort((a, b) => b.bytes - a.bytes);
}

export type ClearOptions = {
  /** Keep `certrace:auth` session so user remains signed in */
  preserveAuth?: boolean;
  /** Keep custom API keys like `certrace:anthropic-key` */
  preserveApiKeys?: boolean;
};

/**
 * Clears mock keys from browser localStorage.
 *
 * @param options.preserveAuth When true, retains `certrace:auth` session.
 * @param options.preserveApiKeys When true, retains user-provided API keys.
 * @returns Number of keys removed.
 */
export function clearMockData(options: ClearOptions = {}): number {
  if (typeof window === "undefined" || !window.localStorage) return 0;

  const { preserveAuth = false, preserveApiKeys = false } = options;
  const keysToRemove: string[] = [];

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(CERTRACE_STORAGE_PREFIX)) continue;

    if (preserveAuth && key === "certrace:auth") continue;
    if (preserveApiKeys && key === "certrace:anthropic-key") continue;

    keysToRemove.push(key);
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }

  return keysToRemove.length;
}

/**
 * Resets all business data (workspaces, suppliers, shipments, evidence)
 * but keeps the current signed-in user profile and session.
 */
export function resetToCleanEstate(): number {
  return clearMockData({ preserveAuth: true, preserveApiKeys: true });
}

/**
 * Global DevTools hook: Registers helper functions on `window` in client environments
 * so testers or developers can type `window.__certraceClearMock()` in the Console.
 */
if (typeof window !== "undefined") {
  const g = window as unknown as Record<string, unknown>;
  g.__certraceInspectMock = inspectMockData;
  g.__certraceClearMock = clearMockData;
  g.__certraceResetEstate = resetToCleanEstate;
}

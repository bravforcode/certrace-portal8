import type { directory } from "@certrace/backend/src/modules/team/service";
import type { ReportWrite } from "@certrace/backend/src/modules/reporting/model";
import { isReportStorageKey } from "./report-storage-keys";
import { api, result } from "./api/client";
import { apiConfigured } from "./api/config";
import type { Json } from "@certrace/backend/src/lib/json";
import { ApiError } from "./api/errors";
import { loadSession } from "./api/session";

/** Synchronous domain getters read this hydrated working copy. PostgreSQL is durable storage.
 * Writes are ordered, acknowledged, and version checked; failures remain visible and retryable.
 */
const values = new Map<string, string>();
const revisions = new Map<string, number>();
const pending = new Map<string, string | null>();
const publicValues = new Map<string, Map<string, string>>();
let accountId: string | null = null;
let generation = 0;
let running: Promise<void> | null = null;
let failure: Error | null = null;
let hydration: Promise<void> | null = null;
let refreshing: Promise<boolean> | null = null;
type CompanyDirectory = Awaited<ReturnType<typeof directory>>;
let team: CompanyDirectory | null = null;
export const companyDirectory = () => team;
let ready = false;
let profileOnly = false;
const listeners = new Set<() => void>();
export const subscribeAccount = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const announce = () => {
  for (const fn of listeners) fn();
};
/** Merge acknowledged server data without changing the base revision of unsaved edits. */
function mergeRecords(
  rows: { key: string; value: unknown; revision: number }[],
) {
  let changed = false;
  for (const row of rows) {
    if (pending.has(row.key)) continue;
    if (row.revision <= (revisions.get(row.key) ?? -1)) continue;
    if (row.value === null) values.delete(row.key);
    else values.set(row.key, JSON.stringify(row.value));
    revisions.set(row.key, row.revision);
    changed = true;
  }
  if (changed) announce();
  return changed;
}
/** Merge server-side reviewed edits without discarding typing in other forms. */
export async function refreshReportRecords(): Promise<void> {
  const epoch = generation;
  const payload = await result(api().api.v1.reporting.records.get());
  if (epoch === generation) mergeRecords(payload.records);
}
/** Other sessions and public supplier links update both report and account stores. */
export function refreshAccountRecords(): Promise<boolean> {
  if (
    !ready ||
    !accountId ||
    !apiConfigured() ||
    publicScope() ||
    !loadSession()?.user.ready ||
    loadSession()?.user.id !== accountId
  )
    return Promise.resolve(false);
  if (refreshing) return refreshing;
  const epoch = generation;
  refreshing = (async () => {
    const payload = await result(api().api.v1.account.records.get());
    if (epoch !== generation || loadSession()?.user.id !== accountId)
      return false;
    const next = payload.team ?? null;
    const teamChanged = JSON.stringify(next) !== JSON.stringify(team);
    if (teamChanged) {
      team = next;
      announce();
    }
    return mergeRecords(payload.records) || teamChanged;
  })().finally(() => {
    if (epoch === generation) refreshing = null;
  });
  return refreshing;
}
export const accountSyncState = () => ({
  pending: pending.size,
  error: failure?.message ?? null,
  ready,
});
export function publicScope(): string | null {
  if (typeof window === "undefined") return null;
  return window.location?.pathname?.match(/^\/(?:s|w|p)\/([^/]+)/)?.[0] ?? null;
}
function scopedValues() {
  const scope = publicScope();
  if (!scope) return values;
  let store = publicValues.get(scope);
  if (!store) {
    store = new Map();
    publicValues.set(scope, store);
  }
  return store;
}
export function resetAccount(discard = false) {
  if (pending.size && !discard) {
    failure = new Error(
      "Your session ended with unsaved changes. Download a copy before signing into another account.",
    );
    announce();
    return;
  }
  generation++;
  accountId = null;
  team = null;
  ready = false;
  profileOnly = false;
  hydration = null;
  refreshing = null;
  running = null;
  failure = null;
  values.clear();
  revisions.clear();
  pending.clear();
  announce();
}
export async function hydrateAccount(
  id: string,
  onboardingOnly = false,
): Promise<void> {
  if (accountId === id && ready && (onboardingOnly || !profileOnly)) return;
  if (accountId === id && hydration) return hydration;
  if (pending.size && accountId !== id)
    throw new Error(
      "Download your unsaved changes and reload before switching accounts.",
    );
  if (pending.size) await flushAccount();
  resetAccount();
  accountId = id;
  const epoch = generation;
  hydration = (async () => {
    const payload = onboardingOnly
      ? await result(api(true, id).api.auth.onboarding.records.get())
      : await result(api(true, id).api.v1.account.records.get());
    if (epoch !== generation) return;
    team = "team" in payload ? (payload.team as CompanyDirectory) : null;
    for (const row of payload.records) {
      if (row.value !== null) values.set(row.key, JSON.stringify(row.value));
      revisions.set(row.key, row.revision);
    }
    ready = true;
    profileOnly = onboardingOnly;
    announce();
  })();
  try {
    await hydration;
  } finally {
    if (epoch === generation) hydration = null;
  }
}
async function drain(epoch: number) {
  while (pending.size && epoch === generation) {
    if (loadSession()?.user.id !== accountId)
      throw new Error(
        "Sign back into the account that owns these unsaved changes before retrying.",
      );
    const [key, value] = pending.entries().next().value!;
    if (isReportStorageKey(key)) {
      const batch = [...pending].filter(([k]) => isReportStorageKey(k));
      const records = batch.map(
        ([k, v]) =>
          ({
            key: k,
            value: v === null ? null : JSON.parse(v),
            revision: revisions.get(k) ?? 0,
          }) as ReportWrite,
      );
      const response = await result(
        loadSession()?.user.ready
          ? api().api.v1.reporting.records.batch.post({ records })
          : api().api.auth.onboarding.records.post({ records }),
      );
      if (epoch !== generation) return;
      for (const saved of response.records) {
        revisions.set(saved.key, saved.revision);
        const sent = batch.find(([k]) => k === saved.key);
        // A shared master edit may also update another report store. Never overwrite newer queued typing.
        if (
          !pending.has(saved.key) ||
          (sent && pending.get(saved.key) === sent[1])
        ) {
          if (saved.value === null) values.delete(saved.key);
          else values.set(saved.key, JSON.stringify(saved.value));
          pending.delete(saved.key);
        }
      }
      failure = null;
      announce();
      continue;
    }
    const parsed: Json = value === null ? null : JSON.parse(value);
    const saved = await result(
      api()
        .api.v1.account.records({ key: encodeURIComponent(key) })
        .put({ value: parsed, revision: revisions.get(key) ?? 0 }),
    );
    if (epoch !== generation) return;
    revisions.set(key, saved.revision);
    if (pending.get(key) === value) pending.delete(key);
    failure = null;
    announce();
  }
}
export function flushAccount(): Promise<void> {
  if (!apiConfigured() || publicScope()) return Promise.resolve();
  if (running) return running;
  if (!pending.size)
    return failure ? Promise.reject(failure) : Promise.resolve();
  const epoch = generation;
  running = drain(epoch)
    .catch((error) => {
      if (epoch === generation) {
        failure =
          error instanceof Error
            ? error
            : new Error("Your changes could not be saved.");
        announce();
      }
      throw error;
    })
    .finally(() => {
      if (epoch === generation) running = null;
    });
  return running;
}
export const retryAccountSave = () => {
  failure = null;
  return flushAccount();
};
function enqueue(key: string, value: string | null) {
  if (!accountId || !ready) throw new Error("Account data is still loading.");
  if (team && !team.isOwner && key === "certrace:profile")
    throw new Error("Only the owner can edit this company profile.");
  pending.set(key, value);
  announce();
  if (!failure)
    queueMicrotask(() => {
      void flushAccount().catch(() => {});
    });
}
export const accountStorage = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    // Existing unit fixtures use Web Storage as an isolated fake database.
    // Next replaces NODE_ENV in browser bundles, so this branch is absent there.
    if (process.env.NODE_ENV === "test" && !apiConfigured())
      return window.localStorage.getItem(key);
    return scopedValues().get(key) ?? null;
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "test" && !apiConfigured()) {
      window.localStorage.setItem(key, value);
      return;
    }
    if (!apiConfigured())
      throw new Error("Account storage requires the backend.");
    JSON.parse(value); // Reject non-JSON before changing the working copy.
    if (!publicScope()) enqueue(key, value);
    scopedValues().set(key, value);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "test" && !apiConfigured()) {
      window.localStorage.removeItem(key);
      return;
    }
    if (!apiConfigured())
      throw new Error("Account storage requires the backend.");
    if (!publicScope()) enqueue(key, null);
    scopedValues().delete(key);
  },
};
const browserOnly = new Set([
  "certrace:auth",
  "certrace:lang",
  "certrace:demo-plan",
  "certrace:anthropic-key",
  "certrace:account-suspended",
  "certrace:cookie-prefs",
  "certrace:chain-view",
  "certrace:dashboard:detail",
  "certrace:sample-numbers",
  // The old demo marker never represented a company account or report input.
  "certrace:precursor-supplier-account",
  // Per-browser preferences and the mock screens' local stores (2026-11): not
  // account data, so never offered for import.
  "certrace:sidebar-collapsed",
  "certrace:active-installation",
  "certrace:trace-profile",
  "certrace:workspace-years",
]);
export function legacyRecords() {
  if (typeof window === "undefined") return [];
  const records: { key: string; value: Json }[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (
      !key?.startsWith("certrace:") ||
      key.startsWith("certrace:company:") ||
      browserOnly.has(key)
    )
      continue;
    const value = window.localStorage.getItem(key);
    if (value) {
      try {
        records.push({ key, value: JSON.parse(value) });
      } catch {
        /* malformed legacy data stays available for manual recovery */
      }
    }
  }
  return records;
}
/** Explicitly chosen in the import UI: old browser records have no reliable account owner. */
export async function importLegacyRecords() {
  if (!accountId) throw new Error("Sign in before importing.");
  await flushAccount();
  const { importLegacyFiles } = await import("./document-files");
  await importLegacyFiles();
  const records = legacyRecords();
  await result(api().api.v1.account.records.import.post({ records }));
  const id = accountId;
  ready = false;
  await hydrateAccount(id);
  // Remove only records confirmed in the account. JSONB may reorder object keys.
  const canonical = (value: Json): string =>
    JSON.stringify(value, (_key, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((key) => [key, v[key]]),
          )
        : v,
    );
  for (const r of records)
    if (
      values.has(r.key) &&
      canonical(JSON.parse(values.get(r.key)!)) === canonical(r.value)
    )
      window.localStorage.removeItem(r.key);
  window.localStorage.removeItem("certrace:auth");
}
export function exportPendingRecords() {
  return JSON.stringify(
    {
      accountId,
      records: [...pending].map(([key, value]) => ({
        key,
        value: value === null ? null : JSON.parse(value),
      })),
    },
    null,
    2,
  );
}
export function isConflict() {
  return failure instanceof ApiError && failure.status === 409;
}

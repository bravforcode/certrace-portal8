/* ════════════════════════════════════════════════════════════
   AI-FILLED VALUES

   Remembers which figures smart intake wrote from a document, so the screens
   can show them in green with a "Cera filled" tag. A value is highlighted only
   while the box still holds exactly what AI wrote: the moment a person types
   over it, it is theirs and the highlight goes. Nothing about the figure
   itself changes — this is a marker beside it, kept in its own store.

   Scopes: `ws:<workspaceId>` with keys `<YYYY-MM>:production`,
   `<YYYY-MM>:fuel:<rowId>`, `<YYYY-MM>:elec:<sourceId>`; and `sup:<token>`
   with the questionnaire's own value keys.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";

export type AiFillEntry = { value: string; source: string; at: string };

const KEY = "certrace:ai-filled";
type Store = Record<string, Record<string, AiFillEntry>>;

let version = 0;
const listeners = new Set<() => void>();

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Store) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** "8,420.50" and 8420.5 are the same figure; text compares trimmed. */
export const normalise = (v: unknown): string => {
  const s = String(v ?? "").trim().replace(/,/g, "");
  const n = Number(s);
  return s !== "" && Number.isFinite(n) ? String(n) : s;
};

export function markAiFilled(scope: string, key: string, value: unknown, source: string): void {
  if (typeof window === "undefined") return;
  try {
    const store = read();
    store[scope] = { ...(store[scope] ?? {}), [key]: { value: normalise(value), source, at: new Date().toISOString() } };
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota — the highlight is a convenience, never the record */
  }
  version += 1;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** The AI entry for this box, but only while the box still holds AI's value. */
export function useAiFill(scope: string | undefined, key: string, current: unknown): AiFillEntry | null {
  const v = React.useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
  return React.useMemo(() => {
    if (!scope) return null;
    const entry = read()[scope]?.[key];
    return entry && entry.value === normalise(current) ? entry : null;
    // `v` re-reads the store after a mark
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, key, current, v]);
}

/* ── The last confirm, for the screen it lands on ─────────────────
   Confirming in the review popup takes the reader straight to where the
   values went. That screen says what just happened — how many values, which
   months — from this note. In memory only: it is about the press a moment
   ago, not a record, and a reload rightly forgets it. */
export type FillRun = { months: string[]; values: number; at: string };

const runs = new Map<string, FillRun>();

export function recordFillRun(scope: string, run: Omit<FillRun, "at">): void {
  runs.set(scope, { ...run, at: new Date().toISOString() });
  version += 1;
  listeners.forEach((l) => l());
}

export function dismissFillRun(scope: string): void {
  if (!runs.delete(scope)) return;
  version += 1;
  listeners.forEach((l) => l());
}

export function useFillRun(scope: string): FillRun | null {
  return React.useSyncExternalStore(
    subscribe,
    () => runs.get(scope) ?? null,
    () => null,
  );
}

/** Green box for an input Cera filled. Leading `!` so it wins over inputClass. */
export const AI_INPUT_CLASS = "!border-[#43A97F]/60 !bg-[#ecfdf5] !text-[#065f46]";

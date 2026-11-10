import { accountStorage } from "./account-storage";
/* ════════════════════════════════════════════════════════════
   INTERNAL SIGN-OFF, PER MONTH

   The exporter saying "these are our figures" for ONE month — the moment
   responsibility moves from whoever typed the readings to whoever answers
   for them.

   WHY PER MONTH AND NOT PER YEAR. A single annual sign-off is taken long
   after the readings it covers, by which point nobody can still remember
   whether March's gas meter was the one that was replaced. A month is signed
   while the person signing can still check it.

   Same stamp as everywhere else in the app — a name, a role and a date —
   because "signed off" with no person attached is not a sign-off. Reuses the
   `Signoff` shape from lib/workspace.ts rather than inventing a second one.
   ════════════════════════════════════════════════════════════ */

import type { Signoff } from "./workspace";

const KEY = "certrace:month-signoff";

/** workspace id → 'YYYY-MM' → the stamp */
type Store = Record<string, Record<string, Signoff>>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = accountStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Store) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    accountStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* Quota — the caller re-reads and will show the month unsigned, which is
       the safe direction to fail in. */
  }
}

export const monthSignoff = (
  workspaceId: string,
  month: string,
): Signoff | null => read()[workspaceId]?.[month] ?? null;

export function signOffMonth(
  workspaceId: string,
  month: string,
  name: string,
  role: string,
): Signoff | null {
  if (!name.trim()) return null;
  const stamp: Signoff = {
    name: name.trim(),
    role: role.trim(),
    at: new Date().toISOString(),
  };
  const store = read();
  store[workspaceId] = { ...(store[workspaceId] ?? {}), [month]: stamp };
  write(store);
  return stamp;
}

export function clearMonthSignoff(workspaceId: string, month: string): void {
  const store = read();
  if (!store[workspaceId]) return;
  delete store[workspaceId][month];
  write(store);
}

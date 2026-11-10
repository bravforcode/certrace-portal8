"use client";
import { accountStorage } from "../account-storage";

/* What has been read — kept per browser, shared by the bell and the page, and by the rules digest
   (opening a rule change anywhere marks it seen everywhere). */

import * as React from "react";

const READ_KEY = "certrace:notifications:read";
export const READ_EVENT = "certrace:notifications-read-changed";
/** Old ids are forgotten past this many — a situation that ended is not coming back with the same id. */
const KEEP = 400;

function load(): string[] {
  try {
    const raw = JSON.parse(accountStorage.getItem(READ_KEY) ?? "[]");
    return Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function useReadIds(): {
  readIds: string[];
  markRead: (ids: string[]) => void;
} {
  const [readIds, setReadIds] = React.useState<string[]>([]);
  React.useEffect(() => {
    const sync = () => setReadIds(load());
    sync();
    window.addEventListener(READ_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(READ_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const markRead = React.useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const next = Array.from(new Set([...load(), ...ids])).slice(-KEEP);
    setReadIds(next);
    // Guarded: setItem throws in private mode, and an uncaught throw here would white-screen every page the shell wraps.
    try {
      accountStorage.setItem(READ_KEY, JSON.stringify(next));
    } catch {
      /* best-effort: the unread dot just will not survive a reload */
    }
    try {
      window.dispatchEvent(new Event(READ_EVENT));
    } catch {
      /* no window to tell */
    }
  }, []);

  return { readIds, markRead };
}

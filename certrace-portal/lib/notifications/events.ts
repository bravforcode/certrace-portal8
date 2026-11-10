import { accountStorage } from "../account-storage";
/* ════════════════════════════════════════════════════════════
   THINGS THAT HAPPENED TO THE ACCOUNT, NOT TO THE DATA

   Almost everything the bell says is read off the stores — a month is late because the month is
   late, and the day it is filed the notice is gone. A sign-in or a password change is different:
   once it has happened nothing in any store says so. So these few, and only these, are written
   down when they happen, here, and read back by the feed.

   Kept per browser and capped, because it is a note for the person who did it, not an audit
   trail (the audit trail is the server's job).
   ════════════════════════════════════════════════════════════ */

export type AppEventKind =
  | "sign_in"
  | "password_changed"
  | "sessions_signed_out";

export type AppEvent = {
  id: string;
  kind: AppEventKind;
  at: string /** what to say about where, e.g. "Chrome · macOS" */;
  detail?: string;
};

const KEY = "certrace:notification-events";
export const EVENTS_EVENT = "certrace:notification-events-changed";
const KEEP = 30;

export function readEvents(): AppEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(accountStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw)
      ? raw.filter(
          (e): e is AppEvent =>
            e &&
            typeof e.id === "string" &&
            typeof e.kind === "string" &&
            typeof e.at === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function recordEvent(
  kind: AppEventKind,
  detail?: string,
  now: Date = new Date(),
): void {
  if (typeof window === "undefined") return;
  const next: AppEvent = {
    id: `${kind}:${now.getTime()}`,
    kind,
    at: now.toISOString(),
    ...(detail ? { detail } : {}),
  };
  try {
    accountStorage.setItem(
      KEY,
      JSON.stringify([next, ...readEvents()].slice(0, KEEP)),
    );
  } catch {
    /* storage blocked — the note is lost, which costs nothing but the note */
  }
  try {
    window.dispatchEvent(new Event(EVENTS_EVENT));
  } catch {
    /* no window to tell */
  }
}

/** "Chrome · macOS" from a user-agent string — enough to recognise the machine, which is all a sign-in notice is for. */
export function deviceFrom(ua: string): string {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "";
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return [browser, os].filter(Boolean).join(" · ");
}

/** Called once when somebody signs in on this browser. */
export function recordSignIn(): void {
  if (typeof navigator === "undefined") return;
  recordEvent("sign_in", deviceFrom(navigator.userAgent));
}

/* Shared between Settings > Notifications, the onboarding flow and the bell, so all of them
   agree on the preference keys and storage key without duplicating them.

   A KEY IS A GROUP OF SITUATIONS, not a single message: lib/notifications/feed.ts files every
   notice under one of them, and a group switched off here is a group the bell never draws. */

export type PrefKey = "security" | "declarations" | "suppliers" | "ai_review" | "documents" | "regulation" | "billing" | "product";
export const PREF_KEY = "certrace:notification-prefs";
/** Fired in this tab when the choices change, so the bell follows a switch made in Settings without a reload. */
export const PREFS_EVENT = "certrace:notification-prefs-changed";

/** What a person who has never opened the tab gets. Product announcements are the one group that starts off. */
export const PREF_DEFAULTS: Record<PrefKey, boolean> = {
  security: true,
  declarations: true,
  suppliers: true,
  ai_review: true,
  documents: true,
  regulation: true,
  billing: true,
  product: false,
};

/** Onboarding doesn't ask about notification preferences — it just turns
 *  everything on, so a freshly onboarded account gets the full feed. */
export const ALL_ON: Record<PrefKey, boolean> = {
  security: true,
  declarations: true,
  suppliers: true,
  ai_review: true,
  documents: true,
  regulation: true,
  billing: true,
  product: true,
};

/** The saved choices over the defaults — a key added since the choices were saved takes its default. Never throws. */
export function readNotificationPrefs(): Record<PrefKey, boolean> {
  if (typeof window === "undefined") return PREF_DEFAULTS;
  try {
    const saved = JSON.parse(window.localStorage.getItem(PREF_KEY) ?? "null");
    if (saved && typeof saved === "object") return { ...PREF_DEFAULTS, ...saved, security: true };
  } catch {
    /* malformed local state — fall through to the defaults */
  }
  return PREF_DEFAULTS;
}

/* The one guarded writer both consumers (Settings and onboarding) go through,
   so nobody re-inlines a raw setItem. localStorage.setItem throws in Safari
   private mode and when site-data is blocked; persistence here is best-effort,
   so a failure is swallowed — the caller's in-memory state still updates, and
   onboarding still advances instead of wedging on the throw. */
export function saveNotificationPrefs(prefs: Record<PrefKey, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode / storage blocked — keep going */
  }
  try {
    window.dispatchEvent(new Event(PREFS_EVENT));
  } catch {
    /* no window to tell */
  }
}

/* Shared between Settings > Notifications and the onboarding flow, so both
   agree on the preference keys and storage key without duplicating them. */

export type PrefKey = "security" | "declarations" | "suppliers" | "ai_review" | "documents" | "product";
export const PREF_KEY = "certrace:notification-prefs";

/** Onboarding doesn't ask about notification preferences — it just turns
 *  everything on, so a freshly onboarded account gets the full feed. */
export const ALL_ON: Record<PrefKey, boolean> = {
  security: true,
  declarations: true,
  suppliers: true,
  ai_review: true,
  documents: true,
  product: true,
};

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
}

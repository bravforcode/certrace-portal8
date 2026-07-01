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

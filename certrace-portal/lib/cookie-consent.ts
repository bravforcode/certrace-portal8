import { recordCookieConsent } from "./api/consent";

export const COOKIE_POLICY_VERSION = "2026-11-10";
const KEY = "certrace:cookie-prefs";
const VISITOR = "certrace:visitor-id";
export type CookieChoice = {
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  policyVersion: string;
};

/* Kept in memory when storage is blocked: the id then lasts only this page view. */
let memoryVisitorId: string | null = null;
function visitorId(): string {
  try {
    const stored = localStorage.getItem(VISITOR);
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR, id);
    return id;
  } catch {
    memoryVisitorId ??= crypto.randomUUID();
    return memoryVisitorId;
  }
}

export function readChoice(): CookieChoice | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? "null") as CookieChoice | null;
    return c?.policyVersion === COOKIE_POLICY_VERSION ? c : null;
  } catch {
    return null;
  }
}

/* The server record comes first: if it fails the choice is not stored, so the banner stays and the visitor can retry. */
export async function saveChoice(c: Omit<CookieChoice, "decidedAt">) {
  await recordCookieConsent({
    visitorId: visitorId(),
    analytics: c.analytics,
    marketing: c.marketing,
    policyVersion: c.policyVersion,
  });
  const choice: CookieChoice = { ...c, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(choice));
  } catch {
    /* storage blocked: the banner may show again on the next visit */
  }
  window.dispatchEvent?.(new CustomEvent("certrace:cookie-prefs"));
}

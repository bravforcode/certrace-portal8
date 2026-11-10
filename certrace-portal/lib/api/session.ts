/** Credentials live in an HTTP-only cookie. Only the current user lives in memory. */
import type { AuthUser } from "./auth";
import { ApiError } from "./errors";
export type Session = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};
type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();
let current: Session | null = null;
let epoch = 0;
export const sessionEpoch = () => epoch;
export function assertSessionUnchanged(expected: number): void {
  if (epoch !== expected)
    throw new ApiError(
      "ACCOUNT_CHANGED",
      "The signed-in account changed while this request was running. Reload before continuing.",
      409,
    );
}
export function onSessionChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  return current;
}
export function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  if (current?.user.id !== session.user.id) epoch++;
  current = { accessToken: "cookie", user: session.user };
  for (const listener of listeners) listener(current);
}
export function clearSession() {
  if (current) epoch++;
  current = null;
  for (const listener of listeners) listener(null);
}
export const accessToken = () => {
  const value = loadSession()?.accessToken;
  return value && value !== "cookie" ? value : null;
};
export const isSignedIn = () => Boolean(loadSession()?.user);

export function markLegalConsentRequired() {
  const session = loadSession();
  if (session && !session.user.legalConsentRequired)
    saveSession({
      ...session,
      user: { ...session.user, legalConsentRequired: true },
    });
}

export function markAccountNotReady() {
  const session = loadSession();
  if (session?.user.ready)
    saveSession({ ...session, user: { ...session.user, ready: false } });
}

const TRIAL_EVENT = "certrace:trial-ended";

/** The server refused a write because the trial is over (D4). */
export function markTrialEnded() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(TRIAL_EVENT));
}

export function onTrialEnded(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(TRIAL_EVENT, listener);
  return () => window.removeEventListener(TRIAL_EVENT, listener);
}

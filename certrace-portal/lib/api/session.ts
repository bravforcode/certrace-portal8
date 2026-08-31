/* ════════════════════════════════════════════════════════════
   THE SIGNED-IN SESSION

   One access token and the user it belongs to, persisted so a reload does not
   sign the person out. Same localStorage pattern as the other client-side
   stores in this app, and the same SSR guard: every read and write is wrapped,
   because this module is imported by code that also runs on the server, where
   `window` does not exist.

   Deliberately NOT a React context. The HTTP layer needs the token from
   outside the component tree, and a token that lives in two places drifts.
   Components read the user through `loadSession()` and re-render on the
   auth calls that write it.

   The token is a bearer credential in localStorage, which is readable by any
   script on the origin. That is the accepted MVP position — see
   docs/SECURITY.md — and the reason a real deployment moves it to an
   httpOnly cookie once the backend can set one.
   ════════════════════════════════════════════════════════════ */

import type { AuthUser } from "./auth";

const KEY = "certrace:auth";

export type Session = {
  accessToken: string;
  user: AuthUser;
};

/** Callbacks fired when a session appears or disappears, so the chrome can react. */
type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

export function onSessionChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function announce(session: Session | null): void {
  for (const listener of listeners) listener(session);
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    /* A stored blob missing either half is not a session — treat it as signed
       out rather than letting an undefined token reach an Authorization header. */
    if (!parsed?.accessToken || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* Quota or a private-mode throw: the session still works for this tab,
       it just will not survive a reload. Never break the sign-in flow for it. */
  }
  announce(session);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  announce(null);
}

export const accessToken = (): string | null => loadSession()?.accessToken ?? null;

export const isSignedIn = (): boolean => accessToken() !== null;

/* ════════════════════════════════════════════════════════════
   THE ACCOUNT THE SERVER HAS STOPPED SERVING

   A suspended account (Terms §6.4, §20.4 — unpaid invoices past notice,
   sanctions, an abuse report) answers 403 ACCOUNT_SUSPENDED on every
   authenticated route. That is NOT a signed-out session, and treating it as
   one is the failure this module exists to prevent: clearing the session
   would bounce the person to /login, where their perfectly correct password
   is refused again, with nothing on screen saying why.

   So the session stays exactly as it is and the refusal is recorded here
   instead. `RequireSession` reads it and shows the explanation in place of
   the app.

   ── Why it persists ────────────────────────────────────────────
   In localStorage, beside the session, for the same reason the session is
   there: a reload must not drop the reader back onto a dashboard whose every
   request is about to fail. It is a cache of something only the server
   decides, so anything that proves access is back clears it — a successful
   authenticated call, or a successful sign-in.

   Not a React context, for the same reason as lib/api/session.ts: the HTTP
   layer writes it from outside the component tree.
   ════════════════════════════════════════════════════════════ */

const KEY = "certrace:account-suspended";

export type SuspensionNotice = {
  /** The server's sentence, which names where to take it up. */
  message: string;
  /** When we were last told, epoch milliseconds. */
  at: number;
};

type Listener = (notice: SuspensionNotice | null) => void;
const listeners = new Set<Listener>();

export function onAccountSuspensionChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function announce(notice: SuspensionNotice | null): void {
  for (const listener of listeners) listener(notice);
}

export function accountSuspension(): SuspensionNotice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SuspensionNotice;
    return parsed?.message ? parsed : null;
  } catch {
    return null;
  }
}

export function markAccountSuspended(message: string): void {
  if (typeof window === "undefined") return;
  const notice: SuspensionNotice = { message, at: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(notice));
  } catch {
    /* Quota, or a private-mode throw. The notice still reaches the screen for
       this tab through the listeners below; it just will not survive a
       reload — which is the same trade lib/api/session.ts makes. */
  }
  announce(notice);
}

/** Called on any proof that access is back. Cheap when nothing is stored. */
export function clearAccountSuspension(): void {
  if (typeof window === "undefined") return;
  if (accountSuspension() === null) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  announce(null);
}

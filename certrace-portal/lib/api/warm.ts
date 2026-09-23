/* ════════════════════════════════════════════════════════════
   WAKE THE BACKEND BEFORE ANYONE NEEDS IT

   api.certrace.co runs on a Render instance that sleeps after about fifteen
   idle minutes, and the first request after that waits 30–60 s for it to boot.
   Without this, the person who pays for that wait is whoever presses "Sign in"
   first, and they read the delay as a broken product.

   So the auth screens knock on /readyz as they mount. The instance starts
   booting while the person is still typing an email and password, and by the
   time the real request goes out most of the wait is over. /readyz rather than
   /healthz because it also pings the database, so the pool is warm too.

   Fire and forget, on purpose:
   • Nothing awaits it and nothing reads the answer. A failed or slow warm-up
     changes nothing a screen does; the real request reports its own errors.
   • No timeout of our own. Aborting at 15 s would cut off the exact cold
     start this is here to absorb, and the browser drops it on navigation.
   • At most once per WARM_INTERVAL_MS per page load. Moving between /login
     and /register does not stack requests on an instance that is already up.
   • Skipped when no backend is configured (a laptop, the demo). There is
     nothing to wake.
   ════════════════════════════════════════════════════════════ */

import { apiBaseUrl, apiConfigured, apiFetch } from "./config";

/** Render sleeps after ~15 idle minutes; ten keeps us inside that window. */
export const WARM_INTERVAL_MS = 10 * 60_000;

let lastWarmAt: number | null = null;

/** Nudge the backend awake. Returns whether a request actually went out. */
export function warmBackend(now: number = Date.now()): boolean {
  if (!apiConfigured()) return false;
  if (lastWarmAt !== null && now - lastWarmAt < WARM_INTERVAL_MS) return false;
  lastWarmAt = now;

  try {
    void apiFetch()(`${apiBaseUrl()}/readyz`, {
      method: "GET",
      /* A plain CORS request, not `no-cors`: the API sends
         Cross-Origin-Resource-Policy: same-origin, which blocks an opaque
         response outright, while a CORS request from the portal origin is
         allowed. An origin the API doesn't list (a local preview pointed at
         production) logs a CORS error, but the request has still reached
         Render and woken it. */
      cache: "no-store",
      credentials: "omit",
    }).catch(() => {
      /* Asleep, offline, or refused: the real request will say so. */
    });
  } catch {
    /* No fetch at all (an old test runtime) — same answer: say nothing. */
  }
  return true;
}

/** Tests only: forget the last warm-up so each case starts cold. */
export function resetWarmBackend(): void {
  lastWarmAt = null;
}

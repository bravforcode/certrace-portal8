"use client";

/* ════════════════════════════════════════════════════════════
   THE GATE IN FRONT OF THE PORTAL

   Until this existed there was no gate at all. /login was the only thing that
   ever looked at a session, and it looked at one it had just decided to skip:
   with no backend configured it pushed straight to /onboarding/setup. But
   nothing consulted a session on the way IN to the app, so the sign-in screen
   was never the way in — typing /dashboard, /declarations or /suppliers into
   the address bar reached them all directly, signed in or not. Closing the
   simulated sign-in without closing that door would have moved the lock off
   the only entrance nobody was using.

   So every route under app/(portal) mounts behind this, and "signed in" means
   exactly what lib/api/session.ts says it means.

   ── Why the demo does not go through it ─────────────────────────
   `demoModeEnabled()` is inlined at build time, so on `next dev` and on a
   build that asked for the demo by name this component compiles down to its
   children and behaves precisely as the portal did before — no session, no
   redirect, no blank frame. The gate only exists in builds that have a real
   backend to answer to, or no business letting anyone in.

   ── Why the check is in an effect ───────────────────────────────
   The session is in localStorage, which the server cannot see. Reading it
   during render would make the first client render disagree with the
   prerendered HTML — React's hydration mismatch — so the check runs after
   mount and the frame before it paints nothing rather than the app.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import { demoModeEnabled, isSignedIn, onSessionChange } from "@/lib/api";

/* Read once, at module scope: this is a build-time constant, and re-reading it
   per render would only invite someone to make it a runtime value later. */
const DEMO = demoModeEnabled();

export function RequireSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = React.useState(false);

  React.useEffect(() => {
    if (DEMO) return;

    const check = () => {
      if (isSignedIn()) {
        setAllowed(true);
        return;
      }
      setAllowed(false);
      /* `replace`, not `push`: a bounced visitor pressing Back should return
         to wherever they came from, not to the page that just refused them. */
      router.replace("/login");
    };

    check();

    /* A 401 mid-session clears the session centrally (lib/api/http.ts) and
       announces it. Without this the person keeps sitting on a dashboard whose
       every request is failing, which reads as the product being broken rather
       than as being signed out. */
    return onSessionChange(check);
  }, [router]);

  if (DEMO) return <>{children}</>;
  if (!allowed) return <GuardBlank />;
  return <>{children}</>;
}

/* Deliberately almost nothing. This is on screen for one frame on the way to
   the dashboard, and for as long as the redirect takes on the way to /login —
   a spinner in either case would be a loading state for something that is not
   loading. It keeps the page background so the frame does not flash white. */
function GuardBlank() {
  return <div className="min-h-screen bg-[#f5f4f0]" aria-hidden />;
}

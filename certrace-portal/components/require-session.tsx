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

   ── The other way in is closed too ──────────────────────────────
   A session can be perfectly valid and still be refused: a suspended account
   (Terms §20.4) answers 403 on every authenticated route. That is not a
   signed-out state, so it must not go through the redirect above — the person
   would land on /login and watch a correct password be refused. It is a state
   of its own, with a screen of its own, mounted here because this is where
   the app's front door already is.

   ── Why the check is in an effect ───────────────────────────────
   The session is in localStorage, which the server cannot see. Reading it
   during render would make the first client render disagree with the
   prerendered HTML — React's hydration mismatch — so the check runs after
   mount and the frame before it paints nothing rather than the app.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  accountSuspension,
  demoModeEnabled,
  isSignedIn,
  onAccountSuspensionChange,
  onSessionChange,
  type SuspensionNotice,
} from "@/lib/api";
import { AccountSuspended } from "@/components/account-suspended";

/* Read once, at module scope: this is a build-time constant, and re-reading it
   per render would only invite someone to make it a runtime value later. */
const DEMO = demoModeEnabled();

export function RequireSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = React.useState(false);
  /* Read in an effect, not during render, for the same hydration reason as
     the session itself: localStorage does not exist on the server. */
  const [suspended, setSuspended] = React.useState<SuspensionNotice | null>(null);

  React.useEffect(() => {
    if (DEMO) return;
    setSuspended(accountSuspension());
    return onAccountSuspensionChange(setSuspended);
  }, []);

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
  /* After the session check, not before: somebody who is not signed in at all
     belongs on /login, whatever a stale notice in this browser says. */
  if (suspended) return <AccountSuspended notice={suspended} />;
  return <>{children}</>;
}

/* Deliberately almost nothing. This is on screen for one frame on the way to
   the dashboard, and for as long as the redirect takes on the way to /login —
   a spinner in either case would be a loading state for something that is not
   loading. It keeps the page background so the frame does not flash white. */
function GuardBlank() {
  return <div className="min-h-screen bg-[#f5f4f0]" aria-hidden />;
}

"use client";

/* ════════════════════════════════════════════════════════════
   WHAT A SUSPENDED ACCOUNT SEES

   The server stopped serving this account (Terms §6.4, §20.4) and every
   authenticated call is now answering 403 ACCOUNT_SUSPENDED. Without this
   screen the reader gets the product's worst possible failure: a dashboard
   where nothing loads, or — if the refusal were mistaken for a dead session —
   a sign-in form that refuses a password they know is right.

   THREE THINGS IT HAS TO DO, AND NOTHING ELSE:

     · Say what happened, in the server's own words. The message carries where
       to take it up, and it is the only sentence here the backend owns.
     · Let them check again without hunting for a reload. A suspension is
       lifted by a person, not a timer, and the moment it is, `/me` succeeds
       and the app comes back by itself.
     · Let them sign out. Somebody else's account may be the one they need,
       and a screen with no way off it is a trap.

   WHAT IT DOES NOT DO: it does not show the reason recorded against the
   account. That reason names an invoice, and the person reading this screen —
   an operations manager, a consultant, whoever had the tab open — may not be
   the person who owes it. The server withholds it for the same reason; this
   is the other half of that decision.

   The exporter's data is untouched behind this: suspension withdraws access,
   it does not delete work. Saying so is the difference between "we are locked
   out" and "we have lost the quarter".
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui";
import { clearSession, me, type SuspensionNotice } from "@/lib/api";

export function AccountSuspended({ notice }: { notice: SuspensionNotice }) {
  const router = useRouter();
  const [checking, setChecking] = React.useState(false);
  const [stillSuspended, setStillSuspended] = React.useState(false);

  /* `me()` goes through the same HTTP layer as everything else, so a success
     clears the stored notice and the listener in RequireSession swaps this
     screen back out for the app. Nothing here has to know that — it just
     asks, and either the app returns or this line appears. */
  const checkAgain = async () => {
    if (checking) return;
    setChecking(true);
    setStillSuspended(false);
    try {
      await me();
    } catch {
      setStillSuspended(true);
    } finally {
      setChecking(false);
    }
  };

  const signOut = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white">
          <Lock className="h-5 w-5 text-black/40" aria-hidden />
        </div>
        <h1 className="text-[22px] leading-tight tracking-[-0.01em] text-black">
          This account is suspended
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-black/60">
          {notice.message}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-black/45">
          Your declarations, supplier submissions and uploaded evidence are
          untouched. Access comes back with the account.
        </p>

        {stillSuspended && (
          <p className="mt-5 text-[13px] text-black/45" role="status">
            Still suspended. Nothing has changed yet.
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={checkAgain} disabled={checking}>
            {checking ? "Checking…" : "Check again"}
          </Button>
          <Button variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

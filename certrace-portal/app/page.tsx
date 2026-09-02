"use client";

/* The session lives in localStorage, so only the browser knows whether
   somebody is signed in — the old server-side redirect() could never see it
   and sent everyone to /login. Signed in → /dashboard, after /me confirms
   the stored token still works: a stale entry must not bounce someone into a
   dashboard whose every real call would answer 401. A 401 here clears the
   session centrally (lib/api/http.ts), so the fallback check below reads the
   post-cleanup truth. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiConfigured, isSignedIn, me } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    const go = (path: string) => {
      if (!cancelled) router.replace(path);
    };

    if (!isSignedIn()) {
      go("/login");
      return;
    }
    if (!apiConfigured()) {
      // Demo laptop: a stored demo session is as signed-in as it gets.
      go("/dashboard");
      return;
    }
    me()
      // /me is the fresh truth on `onboarded` — the stored session only
      // knows what it looked like at sign-in.
      .then((user) => go(user.onboarded ? "/dashboard" : "/onboarding/setup"))
      // Network down ≠ signed out: only a 401 (which clears the session)
      // sends someone back to the sign-in form.
      .catch(() => go(isSignedIn() ? "/dashboard" : "/login"));

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

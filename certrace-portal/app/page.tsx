"use client";

/* The client session is restored from the HttpOnly cookie. Once restored,
   /me confirms workspace readiness before routing home. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiConfigured, isSignedIn, me } from "@/lib/api";
import { signInDestination } from "@/lib/auth-flow";

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
      /* Signed-in-looking, but this build has no backend and no sanctioned
         demo — the stored session was minted by something that is no longer
         trusted here. /login is honest about what is on offer. */
      go("/login");
      return;
    }
    me()
      // /me is the fresh truth on readiness — the stored session only
      // knows what it looked like at sign-in.
      .then((user) => go(signInDestination(user)))
      // Network down ≠ signed out: only a 401 (which clears the session)
      // sends someone back to the sign-in form.
      .catch(() => go(isSignedIn() ? "/dashboard" : "/login"));

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

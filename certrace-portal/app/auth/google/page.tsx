"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-panel";
import { EnglishOnly, useT } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";
import { completeGoogleSignIn, GoogleCallbackError, hasCode } from "@/lib/api";
import { BLANK_SIGNUP, signInDestination } from "@/lib/auth-flow";

/* ── Back from Google ───────────────────────────────────────────
   Where Google's sign-in page returns the browser (GOOGLE_CALLBACK_PATH). No
   form, nothing to click on the way through: finish the sign-in, then go
   where the email form would have gone — signInDestination for an account
   that exists, /onboarding with a wiped profile for one that is new, exactly
   as /register does. Only a failure stays on screen, with a way back. */
export default function GoogleCallbackPage() {
  return (
    <EnglishOnly>
      <GoogleCallback />
    </EnglishOnly>
  );
}

function failureMessage(cause: unknown): string {
  if (cause instanceof GoogleCallbackError) {
    if (cause.problem === "cancelled") return "Google sign-in was cancelled.";
    if (cause.problem === "expired") return "This sign-in link has already been used or has expired.";
    return "Google sign-in could not be verified. Please try again.";
  }
  if (hasCode(cause, "GOOGLE_ACCOUNT_CONFLICT")) return "This email is already linked to a different Google account.";
  if (hasCode(cause, "GOOGLE_NOT_CONFIGURED")) return "Sign in with Google isn't available yet.";
  return "Google sign-in could not be verified. Please try again.";
}

function GoogleCallback() {
  const t = useT();
  const router = useRouter();
  const { update } = useProfile();
  const [error, setError] = React.useState("");
  const started = React.useRef(false);

  React.useEffect(() => {
    // Strict Mode runs effects twice in development; the attempt is single-use,
    // so the second run would only ever report "already used".
    if (started.current) return;
    started.current = true;
    const fragment = window.location.hash;
    // The token is a credential: off the address bar and out of history now.
    window.history.replaceState(null, "", window.location.pathname);

    completeGoogleSignIn(fragment)
      .then(({ user }) => {
        if (!user.onboarded) update({ ...BLANK_SIGNUP, firstName: user.firstName ?? "", lastName: user.lastName ?? "" });
        router.replace(signInDestination(user));
      })
      .catch((cause: unknown) => setError(failureMessage(cause)));
  }, [router, update]);

  return (
    <AuthLayout>
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Exporter portal")}</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        {error ? t("Couldn't sign you in.") : t("Signing you in…")}
      </h2>
      {error ? (
        <>
          <p className="mt-5 text-[13px] leading-relaxed text-[#dc2626]">{t(error)}</p>
          <Link href="/login" className="mt-6 inline-block text-[13px] text-black/70 underline-offset-2 hover:text-black hover:underline">
            {t("Back to sign in")}
          </Link>
        </>
      ) : (
        <span className="mt-6 block h-5 w-5 animate-spin rounded-full border-2 border-black/15 border-t-black/50" aria-hidden />
      )}
    </AuthLayout>
  );
}

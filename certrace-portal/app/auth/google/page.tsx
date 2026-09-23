"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-panel";
import { EnglishOnly, useT } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";
import {
  completeGoogleCallback,
  GoogleCallbackError,
  hasCode,
  isAccountSuspended,
  isApiError,
  pendingGoogleIntent,
  type GoogleIntent,
} from "@/lib/api";
import { BLANK_SIGNUP, signInDestination } from "@/lib/auth-flow";

/* ── Back from Google ───────────────────────────────────────────
   Where Google's sign-in page returns the browser (GOOGLE_CALLBACK_PATH), for
   both round trips that go there:

   • Sign-in (/login, /register). No form, nothing to click on the way
     through: finish the sign-in, then go where the email form would have
     gone — signInDestination for an account that exists, /onboarding with a
     wiped profile for one that is new, exactly as /register does.
   • Connect Google (Settings → Privacy & security). Link it to the account
     already signed in, then straight back to that tab, which says so.

   Only a failure stays on screen, with a way back to where it started. */
export default function GoogleCallbackPage() {
  return (
    <EnglishOnly>
      <GoogleCallback />
    </EnglishOnly>
  );
}

const SETTINGS_SECURITY = "/settings?tab=privacy";

function failureMessage(cause: unknown): string {
  if (cause instanceof GoogleCallbackError) {
    if (cause.problem === "cancelled") return "Google sign-in was cancelled.";
    if (cause.problem === "expired") return "This sign-in link has already been used or has expired.";
    return "Google sign-in could not be verified. Please try again.";
  }
  /* Same answer /login gives a suspended account (lib/auth-flow.ts): the
     server's message names who to contact, and the reason stays out of it. */
  if (isAccountSuspended(cause) && isApiError(cause)) return cause.message;
  if (hasCode(cause, "GOOGLE_EMAIL_MISMATCH")) return "Choose the Google account with the same email as your Certrace account.";
  if (hasCode(cause, "GOOGLE_ACCOUNT_CONFLICT")) return "This email is already linked to a different Google account.";
  if (hasCode(cause, "GOOGLE_NOT_CONFIGURED")) return "Sign in with Google isn't available yet.";
  if (hasCode(cause, "INVALID_CREDENTIALS")) return "Your session has expired. Please sign in again.";
  return "Google sign-in could not be verified. Please try again.";
}

function GoogleCallback() {
  const t = useT();
  const router = useRouter();
  const { update } = useProfile();
  const [error, setError] = React.useState("");
  const [intent, setIntent] = React.useState<GoogleIntent>("signin");
  const started = React.useRef(false);

  React.useEffect(() => {
    // Strict Mode runs effects twice in development; the attempt is single-use,
    // so the second run would only ever report "already used".
    if (started.current) return;
    started.current = true;
    setIntent(pendingGoogleIntent());
    const fragment = window.location.hash;
    // The token is a credential: off the address bar and out of history now.
    window.history.replaceState(null, "", window.location.pathname);

    completeGoogleCallback(fragment)
      .then((result) => {
        if (result.intent === "link") {
          router.replace(`${SETTINGS_SECURITY}&google=connected`);
          return;
        }
        const { user } = result.session;
        if (!user.onboarded) update({ ...BLANK_SIGNUP, firstName: user.firstName ?? "", lastName: user.lastName ?? "" });
        router.replace(signInDestination(user));
      })
      .catch((cause: unknown) => setError(failureMessage(cause)));
  }, [router, update]);

  const linking = intent === "link";
  return (
    <AuthLayout>
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Exporter portal")}</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        {error ? (linking ? t("Couldn't connect Google.") : t("Couldn't sign you in.")) : linking ? t("Connecting Google…") : t("Signing you in…")}
      </h2>
      {error ? (
        <>
          <p className="mt-5 text-[13px] leading-relaxed text-[#dc2626]">{t(error)}</p>
          <Link
            href={linking ? SETTINGS_SECURITY : "/login"}
            className="mt-6 inline-block text-[13px] text-black/70 underline-offset-2 hover:text-black hover:underline"
          >
            {linking ? t("Back to settings") : t("Back to sign in")}
          </Link>
        </>
      ) : (
        <span className="mt-6 block h-5 w-5 animate-spin rounded-full border-2 border-black/15 border-t-black/50" aria-hidden />
      )}
    </AuthLayout>
  );
}

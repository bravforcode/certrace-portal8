"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Field, inputClass, cn } from "@/components/ui";
import { AuthLayout, GoogleButton, Divider, GOOGLE_AUTH_ENABLED } from "@/components/auth-panel";
import { EnglishOnly, useT } from "@/lib/i18n";
import { apiConfigured, hasCode, isApiError, login } from "@/lib/api";

/* Sign-in is English-only, like the rest of the auth screens — see
   EnglishOnly in lib/i18n.tsx. The EN/ไทย switcher starts on /onboarding,
   where the person filling the form is known, and inside the product it lives
   in the account menu. */
export default function LoginPage() {
  return (
    <EnglishOnly>
      <LoginScreen />
    </EnglishOnly>
  );
}

function LoginScreen() {
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  /* ── Both buttons land in the same place ───────────────────────
     Signing in — with the email form or with Google — opens the SIGN-IN
     onboarding at /onboarding/setup, never the dashboard directly. The two
     paths must not diverge: which flow a "Continue with Google" click starts
     is decided by the page it was clicked on, and on this page that is the
     sign-in flow, exactly as the identical button on /register starts the
     create-account one.

     The email form authenticates for real when a backend is configured;
     login() stores the session itself (see lib/api/auth.ts). On a laptop with
     no NEXT_PUBLIC_API_BASE_URL the demo walkthrough stays as it was. */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    if (!apiConfigured()) {
      window.setTimeout(() => router.push("/onboarding/setup"), 600);
      return;
    }

    try {
      const session = await login({ email: email.trim(), password });
      // Someone who already finished setup goes straight to work; the
      // sign-in walkthrough is for accounts that never completed it. The
      // flag comes from the server (markOnboarded), not localStorage, so it
      // survives a new browser.
      router.push(session.user.onboarded ? "/dashboard" : "/onboarding/setup");
    } catch (cause) {
      setError(
        hasCode(cause, "INVALID_CREDENTIALS")
          ? t("Email or password is incorrect.")
          : hasCode(cause, "RATE_LIMITED")
            ? t("Too many attempts. Please try again later.")
            : isApiError(cause) && cause.retryable
              ? t("We couldn't reach the server. Check your connection and try again.")
              : t("Something went wrong signing you in. Please try again."),
      );
      setLoading(false);
    }
  };

  const withGoogle = () => {
    setGoogleLoading(true);
    window.setTimeout(() => router.push("/onboarding/setup"), 900);
  };

  return (
    /* The sign-in panel says what Certrace IS, in the words the public site
       uses. /register and /forgot-password keep the default line — see
       DEFAULT_DESCRIPTION in components/auth-panel.tsx. */
    <AuthLayout description="Certrace is an AI workflow platform connecting buyers, exporters, and suppliers to automate CBAM carbon data collection — report-ready before buyers even ask.">
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Exporter portal")}</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        {t("Sign in to continue.")}
      </h2>

      {GOOGLE_AUTH_ENABLED && (
        <div className="mt-7 space-y-4">
          <GoogleButton onClick={withGoogle} loading={googleLoading} />
          <Divider label={t("or sign in with email")} />
        </div>
      )}

      {/* With the Google block hidden the form is the first thing under the
          heading, so it takes over the spacing that block was providing. */}
      <form onSubmit={submit} className={cn("space-y-4", GOOGLE_AUTH_ENABLED ? "mt-5" : "mt-7")}>
        <Field label={t("Work email")}>
          <input
            className={inputClass}
            type="email"
            placeholder={t("you@company.com")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </Field>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Password")}</span>
            <Link href="/forgot-password" className="text-[11px] text-black/40 hover:text-black">
              {t("Forgot password?")}
            </Link>
          </div>
          <input
            className={inputClass}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-xs text-[#dc2626]">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("Signing in…") : t("Sign in")}
          {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-black/45">
        {t("New to Certrace?")}{" "}
        <Link href="/register" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
          {t("Create an account")}
        </Link>
      </p>

    </AuthLayout>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Field, inputClass, cn } from "@/components/ui";
import {
  AuthLayout,
  GoogleButton,
  Divider,
  GOOGLE_AUTH_ENABLED,
  AuthUnavailable,
} from "@/components/auth-panel";
import { EnglishOnly, useT } from "@/lib/i18n";
import { authUnavailable, beginGoogleSignIn, login } from "@/lib/api";
import { EMAIL_RE, signInDestination, signInError } from "@/lib/auth-flow";

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
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  /* No length rule on the password here. `required` and an eight-character
     minimum belong on /register, where the password is being CHOSEN; on this
     screen the only authority on whether it is right is the server, and a
     button that refuses to submit a short one just fails an existing account
     locally with no way to find out why. */
  const canSubmit = EMAIL_RE.test(email.trim()) && password.length > 0;

  /* Build-time truth, identical on the server and in the browser, so this
     switch cannot cause a hydration mismatch the way a localStorage read
     would. */
  const unavailable = authUnavailable();

  /* Returning users go to the workspace when ready. */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");

    /* Belt and braces for the case the form is somehow reachable without a
       backend: never walk the simulated path from a build that did not ask
       for it. The render below already replaces the form, so getting here
       means something upstream changed and this is the safe end of it. */
    if (authUnavailable()) {
      setError(t("Sign-in isn't available on this deployment yet."));
      setLoading(false);
      return;
    }

    try {
      /* Login establishes the HttpOnly cookie and hydrates account data. */
      const session = await login({ email: email.trim(), password });
      router.push(signInDestination(session.user));
      /* Loading stays ON through the push. Clearing it here would flash an
         enabled form for the frame between the state update and the route
         change — long enough to click "Sign in" a second time. */
    } catch (cause) {
      setError(t(signInError(cause)));
      setLoading(false);
    }
  };

  /* Off to Google and back to /auth/google, which lands the account exactly
     where the form above would: signInDestination. The button only exists
     when a backend is there to verify Google's answer (GOOGLE_AUTH_ENABLED). */
  const withGoogle = () => {
    setGoogleLoading(true);
    beginGoogleSignIn();
  };

  return (
    /* The sign-in panel says what Certrace IS, in the words the public site
       uses. /register and /forgot-password keep the default line — see
       DEFAULT_DESCRIPTION in components/auth-panel.tsx. */
    <AuthLayout description="Certrace is an AI workflow platform connecting buyers, exporters, and suppliers to automate CBAM carbon data collection — report-ready before buyers even ask.">
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">
        {t("Exporter portal")}
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        {t("Sign in to continue.")}
      </h2>

      {/* Nothing behind this build: the credential form is replaced, not
          disabled, and the "create an account" line below goes with it —
          there are no accounts to create either. See AuthUnavailable. */}
      {unavailable && <AuthUnavailable />}

      {!unavailable && GOOGLE_AUTH_ENABLED && (
        <div className="mt-7 space-y-4">
          <GoogleButton onClick={withGoogle} loading={googleLoading} />
          <Divider label={t("or sign in with email")} />
        </div>
      )}

      {/* With the Google block hidden the form is the first thing under the
          heading, so it takes over the spacing that block was providing. */}
      {!unavailable && (
        <form
          onSubmit={submit}
          className={cn("space-y-4", GOOGLE_AUTH_ENABLED ? "mt-5" : "mt-7")}
        >
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
              <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">
                {t("Password")}
              </span>
              <Link
                href="/forgot-password"
                className="text-[11px] text-black/40 hover:text-black"
              >
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
          {/* Over the button, not under a field: "email or password is
            incorrect" is deliberately unable to say which one, and hanging it
            on the email box would answer a question the server refused to. */}
          {error && <p className="text-xs text-[#dc2626]">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !canSubmit}
          >
            {loading ? t("Signing in…") : t("Sign in")}
            {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
          </Button>
        </form>
      )}

      {!unavailable && (
        <p className="mt-6 text-center text-[13px] text-black/45">
          {t("New to Certrace?")}{" "}
          <Link
            href="/register"
            className="text-black/70 underline-offset-2 hover:text-black hover:underline"
          >
            {t("Create an account")}
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}

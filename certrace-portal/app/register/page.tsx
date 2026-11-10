"use client";
import { pendingInvitation } from "@/lib/company-session";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button, Field, inputClass, cn } from "@/components/ui";
import {
  AuthLayout,
  GoogleButton,
  Divider,
  PasswordStrength,
  GOOGLE_AUTH_ENABLED,
  AuthUnavailable,
} from "@/components/auth-panel";
import { EnglishOnly, useT } from "@/lib/i18n";
import { useLegalDocuments, legalVersionIds } from "@/lib/api/legal";
import { authUnavailable, beginGoogleSignIn, register } from "@/lib/api";
import { EMAIL_RE, signUpError, type SignUpFailure } from "@/lib/auth-flow";

const NO_ERROR: SignUpFailure = { message: "", field: null };

/* ── Creating the account, and nothing else ─────────────────────
   This form asks only what an account cannot exist without: who you are, an
   email to send the trial to, and a password. The COMPANY is deliberately not
   asked here — it is the first thing /onboarding asks for, together with the
   sector and the rest of the organisation record, and asking it twice gives
   two spellings of one company name with nothing to say which is right.

   Both paths (email form, "Sign up with Google") lead to the registration
   questionnaire before workspace access. The flow is decided by the page the button was clicked on, not
   by the button — the identical Google button on /login signs an existing
   account in instead. */
export default function RegisterPage() {
  // Auth screens are English-only — see EnglishOnly in lib/i18n.tsx. The
  // language switcher appears one step later, on /onboarding.
  return (
    <EnglishOnly>
      <RegisterScreen />
    </EnglishOnly>
  );
}

function RegisterScreen() {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const {
    documents,
    error: legalError,
    reload: reloadLegal,
  } = useLegalDocuments();
  const [error, setError] = React.useState<SignUpFailure>(NO_ERROR);
  const mismatch = confirm.length > 0 && confirm !== password;

  /* The button is dead until the form is actually complete — every field
     here is required, so `required` alone (which only speaks up AFTER a
     click) makes a live-looking button that does nothing. The same rule
     runs the whole of /onboarding: nothing advances on an empty answer. */
  const canSubmit =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    EMAIL_RE.test(email.trim()) &&
    password.length >= 8 &&
    confirm === password &&
    agreed &&
    documents !== null;

  /* Build-time truth, identical on the server and in the browser, so this
     switch cannot cause a hydration mismatch. See authUnavailable() in lib/api. */
  const unavailable = authUnavailable();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !documents || loading || googleLoading) return;
    setLoading(true);
    setError(NO_ERROR);

    try {
      /* The company is NOT sent: this form never asks for it (see the note
         above), and /onboarding is where it gets its one spelling. */
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        termsAccepted: agreed,
        privacyAccepted: agreed,
        marketingOptIn: false,
        ...legalVersionIds(documents),
      });
      router.replace(pendingInvitation() ? "/join" : "/onboarding");
      // Loading stays on through the push; see the note on /login.
    } catch (cause) {
      if (
        cause &&
        typeof cause === "object" &&
        "code" in cause &&
        cause.code === "LEGAL_VERSION_CHANGED"
      ) {
        setAgreed(false);
        await reloadLegal();
      }
      setError(signUpError(cause));
      setLoading(false);
    }
  };

  /* Google hands back an identity, not a company record — so it clears the
     SAME fields the email form does. It used to clear only the company, which
     left the demo fixture's name, job title and sector sitting in /onboarding
     as if the new account had already answered: somebody else's "Wasawat
     Kiakittiwong / Head of Export Ops / Steel & iron" pre-ticked on a form
     whose whole job is to ask. */
  const withGoogle = () => {
    /* Off Certrace and back: /auth/google finishes the sign-in, and blanks the
       profile with the name Google gave when the account turns out to be new
       — the same wipe the email form does above. */
    if (loading || googleLoading) return;
    if (!agreed || !documents) {
      setError({
        message:
          "Please agree to the Terms of Service and Privacy Policy before continuing.",
        field: null,
      });
      return;
    }
    setGoogleLoading(true);
    beginGoogleSignIn({
      termsAccepted: agreed,
      privacyAccepted: agreed,
      marketingOptIn: false,
      ...legalVersionIds(documents),
    });
  };

  return (
    <AuthLayout>
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">
        {t("Exporter portal")}
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        {t("Create your account.")}
      </h2>
      <p className="mt-2 text-sm text-black/45">
        {t("One account per company. Add teammates as seats once you're in.")}
      </p>

      {/* No backend and no sanctioned demo: there is no account to create,
          so the form goes rather than pretending otherwise. */}
      {unavailable && (
        <AuthUnavailable
          lead={t(
            "Accounts aren't open on this deployment yet — there's nothing to create here.",
          )}
        />
      )}

      {!unavailable && GOOGLE_AUTH_ENABLED && (
        <div className="mt-4 space-y-2 lg:mt-7 lg:space-y-4">
          <GoogleButton
            onClick={withGoogle}
            loading={googleLoading}
            label={t("Sign up with Google")}
          />
          <Divider label={t("or sign up with email")} />
        </div>
      )}

      {/* Takes over the hidden block's spacing, at both breakpoints. */}
      {!unavailable && (
        <form
          onSubmit={submit}
          className={cn(
            "space-y-2 lg:space-y-4",
            GOOGLE_AUTH_ENABLED ? "mt-3 lg:mt-5" : "mt-4 lg:mt-7",
          )}
        >
          {/* Two fields, not one. A single "Full name" has to be guessed apart
            again the moment anything addresses the person by first name —
            supplier invitations, the account menu, the signature on a report
            — and the guess is wrong for every name that is not First Last. */}
          <div className="grid gap-2 sm:grid-cols-2 lg:gap-4">
            {/* Placeholders, not values. An empty box with only a label above it
              reads as optional; a box carrying somebody's actual name reads as
              already answered and gets tabbed past. The prompt says whose name
              belongs here and disappears the moment anything is typed. */}
            <Field label={t("First name")}>
              <input
                className={inputClass}
                type="text"
                placeholder={t("Enter your first name")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </Field>
            <Field label={t("Last name")}>
              <input
                className={inputClass}
                type="text"
                placeholder={t("Enter your last name")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
            </Field>
          </div>
          <Field label={t("Work email")}>
            <input
              className={inputClass}
              type="email"
              placeholder={t("you@company.com")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                /* The complaint was about the address that was there. Editing it
                 makes the message stale, and a red line under a box someone is
                 mid-way through fixing reads as a second, new problem. */
                if (error.field === "email") setError(NO_ERROR);
              }}
              autoComplete="email"
              required
            />
            {error.field === "email" && (
              <span className="mt-1.5 block text-xs text-[#dc2626]">
                {t(error.message)}
              </span>
            )}
          </Field>
          <Field label={t("Password")}>
            <input
              className={inputClass}
              type="password"
              placeholder={t("At least 8 characters")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <PasswordStrength value={password} />
          </Field>
          <Field label={t("Confirm password")}>
            <input
              className={inputClass}
              type="password"
              placeholder={t("Re-enter password")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {mismatch && (
              <span className="mt-1.5 block text-xs text-[#dc2626]">
                {t("Passwords don't match.")}
              </span>
            )}
          </Field>

          <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-black/50">
            <button
              type="button"
              role="checkbox"
              aria-checked={agreed}
              onClick={() => setAgreed((v) => !v)}
              className={cn(
                "mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-[5px] border transition-colors",
                agreed
                  ? "border-transparent bg-[#111] text-white"
                  : "border-black/20",
              )}
            >
              {agreed && <Check size={11} strokeWidth={3} />}
            </button>
            {/* Public pages render the same versioned documents recorded by the backend. */}
            <span>
              {t("I agree to Certrace's")}{" "}
              <a
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/70 underline-offset-2 hover:text-black hover:underline"
              >
                {t("Terms of Service")}
              </a>{" "}
              {t("and")}{" "}
              <a
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/70 underline-offset-2 hover:text-black hover:underline"
              >
                {t("Privacy Policy")}
              </a>
              .
            </span>
          </label>

          {legalError && (
            <p role="alert" className="text-xs text-[#dc2626]">
              {legalError}{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setAgreed(false);
                  void reloadLegal();
                }}
              >
                Retry
              </button>
            </p>
          )}

          {/* Anything not about one field goes here, where the eye already is
            when the button did nothing. */}
          {error.field === null && error.message && (
            <p className="text-xs text-[#dc2626]">{t(error.message)}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !canSubmit}
          >
            {loading ? t("Creating account…") : t("Create account")}
            {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
          </Button>
        </form>
      )}

      <p className="mt-3 text-center text-[13px] text-black/45 lg:mt-6">
        {t("Already have an account?")}{" "}
        <Link
          href="/login"
          className="text-black/70 underline-offset-2 hover:text-black hover:underline"
        >
          {t("Sign in")}
        </Link>
      </p>
    </AuthLayout>
  );
}

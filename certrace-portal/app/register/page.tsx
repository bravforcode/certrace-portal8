"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button, Field, inputClass, cn } from "@/components/ui";
import { AuthLayout, GoogleButton, Divider, PasswordStrength, GOOGLE_AUTH_ENABLED, AuthUnavailable } from "@/components/auth-panel";
import { useProfile } from "@/lib/profile";
import { EnglishOnly, useT } from "@/lib/i18n";
import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL } from "@/lib/links";
import { authUnavailable, demoModeEnabled, register } from "@/lib/api";
import { EMAIL_RE, signUpError, type SignUpFailure } from "@/lib/auth-flow";

const NO_ERROR: SignUpFailure = { message: "", field: null };

/* ── What a brand-new account starts with: nothing ──────────────
   The profile store ships preloaded with the demo organisation so the rest of
   the portal has something to render. Signing up has to wipe that back to
   empty, or /onboarding opens with a stranger's company, name, job title,
   sector and phone number already filled in — answers nobody gave, which are
   accepted precisely because they are never read. */
const BLANK_SIGNUP = {
  firstName: "",
  lastName: "",
  companyName: "",
  sector: "",
  jobTitle: "",
  phone: "",
  lineId: "",
  onboarded: false,
} as const;

/* ── Creating the account, and nothing else ─────────────────────
   This form asks only what an account cannot exist without: who you are, an
   email to send the trial to, and a password. The COMPANY is deliberately not
   asked here — it is the first thing /onboarding asks for, together with the
   sector and the rest of the organisation record, and asking it twice gives
   two spellings of one company name with nothing to say which is right.

   Both paths (email form, "Sign up with Google") end in the SAME place:
   /onboarding. The flow is decided by the page the button was clicked on, not
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
  const { update } = useProfile();
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
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
    agreed;

  /* Build-time truth, identical on the server and in the browser, so this
     switch cannot cause a hydration mismatch. See authUnavailable() in lib/api. */
  const unavailable = authUnavailable();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(NO_ERROR);

    // The typed name is the ONLY thing carried forward — everything else
    // resets, so /onboarding asks for the company rather than offering the
    // demo fixture's, which is how a wrong name gets accepted unread.
    const profile = { ...BLANK_SIGNUP, firstName: firstName.trim(), lastName: lastName.trim() };

    /* `next dev`, or a build that asked for the demo by name. Same simulated
       path /login takes. A production build with no backend never renders this
       form — see demoModeEnabled() and authUnavailable() in lib/api. */
    if (demoModeEnabled()) {
      window.setTimeout(() => {
        update(profile);
        router.push("/onboarding");
      }, 700);
      return;
    }

    try {
      /* The company is NOT sent: this form never asks for it (see the note
         above), and /onboarding is where it gets its one spelling. */
      await register({
        email: email.trim(),
        password,
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      /* Only now. `update` wipes the demo organisation out of the profile
         store, and doing that before the server has agreed to create the
         account leaves a rejected signup — a taken address, a dead network —
         sitting on a blanked portal it never got an account for. */
      update(profile);
      router.push("/onboarding");
      // Loading stays on through the push; see the note on /login.
    } catch (cause) {
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
    /* Same gate as the form: hidden today (GOOGLE_AUTH_ENABLED), but a build
       with no backend must not gain a second way in the day it comes back. */
    if (!demoModeEnabled()) return;
    setGoogleLoading(true);
    window.setTimeout(() => {
      update(BLANK_SIGNUP);
      router.push("/onboarding");
    }, 900);
  };

  return (
    <AuthLayout>
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Exporter portal")}</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        {t("Create your account.")}
      </h2>
      <p className="mt-2 text-sm text-black/45">{t("One account per company. Add teammates as seats once you're in.")}</p>

      {/* No backend and no sanctioned demo: there is no account to create,
          so the form goes rather than pretending otherwise. */}
      {unavailable && (
        <AuthUnavailable lead={t("Accounts aren't open on this deployment yet — there's nothing to create here.")} />
      )}

      {!unavailable && GOOGLE_AUTH_ENABLED && (
        <div className="mt-4 space-y-2 lg:mt-7 lg:space-y-4">
          <GoogleButton onClick={withGoogle} loading={googleLoading} label={t("Sign up with Google")} />
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
            <span className="mt-1.5 block text-xs text-[#dc2626]">{t(error.message)}</span>
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
          {mismatch && <span className="mt-1.5 block text-xs text-[#dc2626]">{t("Passwords don't match.")}</span>}
        </Field>

        <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-black/50">
          <button
            type="button"
            role="checkbox"
            aria-checked={agreed}
            onClick={() => setAgreed((v) => !v)}
            className={cn(
              "mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-[5px] border transition-colors",
              agreed ? "border-transparent bg-[#111] text-white" : "border-black/20",
            )}
          >
            {agreed && <Check size={11} strokeWidth={3} />}
          </button>
          {/* The published documents on certrace.co, not the in-app /legal
              pages: this is the copy the person is consenting to, and it has
              to be the one anyone can read without an account. */}
          <span>
            {t("I agree to Certrace's")}{" "}
            <a href={LEGAL_TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
              {t("Terms of Service")}
            </a>{" "}
            {t("and")}{" "}
            <a href={LEGAL_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
              {t("Privacy Policy")}
            </a>
            .
          </span>
        </label>

        {/* Anything not about one field goes here, where the eye already is
            when the button did nothing. */}
        {error.field === null && error.message && (
          <p className="text-xs text-[#dc2626]">{t(error.message)}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
          {loading ? t("Creating account…") : t("Create account")}
          {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
        </Button>
      </form>
      )}

      <p className="mt-3 text-center text-[13px] text-black/45 lg:mt-6">
        {t("Already have an account?")}{" "}
        <Link href="/login" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
          {t("Sign in")}
        </Link>
      </p>
    </AuthLayout>
  );
}

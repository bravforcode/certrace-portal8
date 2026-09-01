"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button, ButtonLink, Field, inputClass, Eyebrow } from "@/components/ui";
import { AuthLayout, PasswordStrength } from "@/components/auth-panel";
import { EnglishOnly, storedLang, useT } from "@/lib/i18n";
import { apiConfigured, hasCode, isApiError, resetPassword } from "@/lib/api";
import { CODE_RE, EMAIL_RE, forgetResetEmail, recallResetEmail } from "@/lib/password-reset";

// English-only, like the rest of the auth screens — see lib/i18n.tsx.
export default function ResetPasswordPage() {
  return (
    <EnglishOnly>
      <ResetPasswordScreen />
    </EnglishOnly>
  );
}

/* ── The second half of /forgot-password ────────────────────────
   Three things arrive here: the address, the six digits that were mailed to
   it, and the new password. The code is the only one of the three that proves
   anything, which is why the email field is editable rather than locked —
   somebody who opened this page in a fresh tab, or from the email on their
   phone while the code sits in a laptop, has no session and no query string to
   restore it from, and a read-only field they cannot fill is a dead end.

   ── Why there is no auto-submit on the sixth digit ──────────────
   Tempting, and wrong here: the code is not the last field. Firing the request
   the moment six digits land would submit a half-typed password, burn the
   one-time code on it, and send the person back to /forgot-password for a new
   one. The button waits for the whole form. */
function ResetPasswordScreen() {
  const t = useT();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  /* Read after mount, never during render: sessionStorage does not exist on
     the server, and seeding state from it directly would make the first
     client render disagree with the server's. */
  React.useEffect(() => {
    setEmail(recallResetEmail());
  }, []);

  const address = email.trim();
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit =
    EMAIL_RE.test(address) && CODE_RE.test(code) && password.length >= 8 && confirm === password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");

    /* No backend on this build — same simulated path /forgot-password takes,
       so the demo walks end to end. See apiConfigured() in lib/api. */
    if (!apiConfigured()) {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      setLoading(false);
      finish();
      return;
    }

    try {
      await resetPassword({
        email: address,
        code,
        newPassword: password,
        locale: storedLang(),
      });
      finish();
    } catch (cause) {
      /* One code covers wrong, already-used and expired. The backend cannot
         tell the difference apart without saying whether the code was ever
         real, and the answer is the same either way: ask for a new one. */
      if (hasCode(cause, "INVALID_RESET_TOKEN")) {
        setError(t("That code is wrong or has expired. Codes last 15 minutes and work once."));
      } else if (isApiError(cause) && cause.retryable) {
        setError(t("We couldn't reach the server. Check your connection and try again."));
      } else {
        setError(t("That didn't work. Please request a new code and try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  function finish() {
    /* The address has done its job, and the next person to open this tab has
       no business seeing it sitting in a field. */
    forgetResetEmail();
    setDone(true);
  }

  if (done) return <DoneScreen />;

  return (
    <AuthLayout>
      <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
        <ArrowLeft size={13} strokeWidth={1.5} /> {t("Back")}
      </Link>

      <p className="mt-5 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Exporter portal")}</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        {t("Enter your code.")}
      </h2>
      <p className="mt-2 text-sm text-black/45">
        {t("Type the six-digit code from the email, then choose a new password.")}
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <Field label={t("Work email")}>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("you@company.com")}
            autoComplete="username"
            required
          />
        </Field>

        <Field label={t("Verification code")}>
          {/* Non-digits are dropped as they are typed rather than rejected on
              submit: the code is copied out of an email, and a stray space at
              either end is the most likely thing to come with it.
              `one-time-code` is what lets iOS and Android offer it from the
              notification without opening the mail app. */}
          <input
            className={`${inputClass} text-center font-[family-name:var(--font-mono)] text-lg tracking-[0.4em]`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            required
          />
        </Field>

        <Field label={t("New password")}>
          <input
            className={inputClass}
            type="password"
            placeholder={t("At least 8 characters")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
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
            autoComplete="new-password"
            required
          />
          {mismatch && <span className="mt-1.5 block text-xs text-[#dc2626]">{t("Passwords don't match.")}</span>}
        </Field>

        {error && <p className="text-xs text-[#dc2626]">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
          {loading ? t("Setting password…") : t("Set new password")}
          {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-black/45">
        {t("Code expired or never arrived?")}{" "}
        <Link href="/forgot-password" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
          {t("Send a new one")}
        </Link>
      </p>
    </AuthLayout>
  );
}

/* Not a modal: nothing is left to do on the form behind it, and a dialog over
   a form still holding the new password invites a second submit with a code
   that has already been spent. */
function DoneScreen() {
  const t = useT();
  return (
    <AuthLayout>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ecfdf5] text-[#047857]">
        <ShieldCheck size={26} strokeWidth={1.5} />
      </span>
      <Eyebrow className="mt-5 block">{t("All set")}</Eyebrow>
      <h2 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        {t("Password updated.")}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-black/45">
        {t("You can sign in with your new password now. We've emailed a confirmation — if that change wasn't you, reply to it straight away.")}
      </p>
      <ButtonLink href="/login" className="mt-7 w-full">
        {t("Sign in")}
        <ArrowRight size={15} strokeWidth={1.5} />
      </ButtonLink>
    </AuthLayout>
  );
}

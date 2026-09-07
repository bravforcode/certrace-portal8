"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, MailCheck, X } from "lucide-react";
import { Button, Field, inputClass, Card, Eyebrow } from "@/components/ui";
import { AuthLayout, AuthUnavailable } from "@/components/auth-panel";
import { EnglishOnly, storedLang, useT } from "@/lib/i18n";
import { authUnavailable, demoModeEnabled, isApiError, requestPasswordReset } from "@/lib/api";
import { EMAIL_RE, rememberResetEmail } from "@/lib/password-reset";

// English-only, like /login and /register — see EnglishOnly in lib/i18n.tsx.
export default function ForgotPasswordPage() {
  return (
    <EnglishOnly>
      <ForgotPasswordScreen />
    </EnglishOnly>
  );
}
/* ── What the person is being sent ──────────────────────────────
   A six-digit code, not a link. The backend generates one in
   app/core/security.py and mails it; there is no URL to click. The copy on
   this screen says "code" everywhere for that reason — a screen that promises
   a link and delivers six digits reads as a broken email, and the support
   ticket is "the link didn't arrive".

   ── Why the failure cases mostly do not appear ──────────────────
   An unknown address is NOT an error here. The server answers a made-up email
   exactly as it answers a real one, so that this page cannot be used to find
   out who has an account — and this screen has to keep that promise, which
   means the same modal either way. The only thing worth showing is a request
   that never reached the server at all. */
function ForgotPasswordScreen() {
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resendIn, setResendIn] = React.useState(0);

  const address = email.trim();
  const canSubmit = EMAIL_RE.test(address);

  /* Build-time truth, so it cannot cause a hydration mismatch. There are no
     accounts on a build with no backend, so there is no password to reset. */
  const unavailable = authUnavailable();

  const send = React.useCallback(async (): Promise<boolean> => {
    setError("");

    /* `next dev`, or a build that asked for the demo by name. Show the same
       screen it has always shown rather than an error about a URL nobody has
       set. A production build with no backend never renders this form — see
       demoModeEnabled() in lib/api. */
    if (demoModeEnabled()) {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      return true;
    }

    try {
      /* The page is pinned to English; the EMAIL is not. Whoever reads it
         picked a language before they signed out, and that is the one they
         will be reading in — see storedLang(). */
      await requestPasswordReset({ email: address, locale: storedLang() });
      return true;
    } catch (cause) {
      setError(
        isApiError(cause) && cause.retryable
          ? t("We couldn't reach the server. Check your connection and try again.")
          : t("Something went wrong sending that code. Please try again."),
      );
      return false;
    }
  }, [address, t]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    const ok = await send();
    setLoading(false);
    if (!ok) return;
    /* Handed to /reset-password so the address does not have to be typed a
       second time — kept in this tab only, never in the URL. */
    rememberResetEmail(address);
    setSent(true);
    setResendIn(30);
  };

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const resend = async () => {
    setResendIn(30);
    await send();
  };

  return (
    <AuthLayout>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
        <ArrowLeft size={13} strokeWidth={1.5} /> {t("Back to sign in")}
      </Link>

      <p className="mt-5 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Exporter portal")}</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        {t("Reset your password.")}
      </h2>
      <p className="mt-2 text-sm text-black/45">{t("Enter the email on your account and we'll send a code to reset it.")}</p>

      {/* Nothing can send that email, and a form that silently succeeds
          leaves someone waiting on a code that was never generated. */}
      {unavailable && (
        <AuthUnavailable lead={t("Accounts aren't open on this deployment yet — there's no password to reset.")} />
      )}

      {!unavailable && (
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
        {error && <p className="text-xs text-[#dc2626]">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
          {loading ? t("Sending…") : t("Send reset code")}
          {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
        </Button>
      </form>
      )}

      {!unavailable && (
        <p className="mt-6 text-center text-[13px] text-black/45">
          {t("Already have a code?")}{" "}
          <Link href="/reset-password" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
            {t("Enter it here")}
          </Link>
        </p>
      )}

      {sent && (
        <SentModal
          email={address}
          resendIn={resendIn}
          /* The modal covers the form, so a resend that fails has to report
             it here — otherwise the only feedback is a countdown restarting
             over an email that never went. */
          error={error}
          onResend={resend}
          onClose={() => setSent(false)}
          onContinue={() => router.push("/reset-password")}
        />
      )}
    </AuthLayout>
  );
}

function SentModal({
  email,
  resendIn,
  error,
  onResend,
  onClose,
  onContinue,
}: {
  email: string;
  resendIn: number;
  error: string;
  onResend: () => void;
  onClose: () => void;
  onContinue: () => void;
}) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className="ct-enter relative z-10 w-full max-w-sm p-6 text-center">
        <button onClick={onClose} aria-label={t("Close")} className="absolute right-4 top-4 text-black/35 hover:text-black">
          <X size={18} strokeWidth={1.5} />
        </button>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#ecfdf5] text-[#047857]">
          <MailCheck size={26} strokeWidth={1.5} />
        </span>
        <Eyebrow className="mt-4 block">{t("Check your email")}</Eyebrow>
        <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{t("Code sent.")}</h2>
        {/* "If there's an account" rather than "we sent" — the server does not
            mail an address it has never seen, and a modal that states the mail
            went out would tell an attacker which addresses are customers. */}
        <p className="mt-3 text-sm leading-relaxed text-black/50">
          {t("If there's an account for")} <span className="text-black/75">{email}</span>, {t("a six-digit code is on its way. It expires in 15 minutes — if it doesn't show up, check spam.")}
        </p>
        <Button className="mt-5 w-full" onClick={onContinue}>
          {t("Enter the code")}
          <ArrowRight size={15} strokeWidth={1.5} />
        </Button>
        <Button variant="secondary" className="mt-2 w-full" disabled={resendIn > 0} onClick={onResend}>
          {resendIn > 0 ? t("Resend in {seconds}s", { seconds: resendIn }) : t("Resend code")}
        </Button>
        {error && <p className="mt-3 text-xs text-[#dc2626]">{error}</p>}
        <Link href="/login" className="mt-4 block text-[12px] text-black/40 hover:text-black">
          {t("Back to sign in")}
        </Link>
      </Card>
    </div>
  );
}

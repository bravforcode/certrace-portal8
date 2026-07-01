"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, MailCheck, X } from "lucide-react";
import { Button, Field, inputClass, Card, Eyebrow } from "@/components/ui";
import { AuthLayout } from "@/components/auth-panel";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("wasawat@siamsteel.co.th");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSent(true);
      setResendIn(30);
    }, 700);
  };

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const resend = () => {
    setResendIn(30);
  };

  return (
    <AuthLayout>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
        <ArrowLeft size={13} strokeWidth={1.5} /> Back to sign in
      </Link>

      <p className="mt-5 text-[11px] uppercase tracking-[0.1em] text-black/40">Exporter portal</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        Reset your password.
      </h2>
      <p className="mt-2 text-sm text-black/45">Enter the email on your account and we&apos;ll send a link to reset it.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <Field label="Work email">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
          {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
        </Button>
      </form>

      {sent && <SentModal email={email} resendIn={resendIn} onResend={resend} onClose={() => setSent(false)} />}
    </AuthLayout>
  );
}

function SentModal({ email, resendIn, onResend, onClose }: { email: string; resendIn: number; onResend: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className="ct-enter relative z-10 w-full max-w-sm p-6 text-center">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-black/35 hover:text-black">
          <X size={18} strokeWidth={1.5} />
        </button>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#ecfdf5] text-[#047857]">
          <MailCheck size={26} strokeWidth={1.5} />
        </span>
        <Eyebrow className="mt-4 block">Check your email</Eyebrow>
        <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">Reset link sent.</h2>
        <p className="mt-3 text-sm leading-relaxed text-black/50">
          We&apos;ve sent a password reset link to <span className="text-black/75">{email}</span>. It expires in 15 minutes — if it doesn&apos;t show up, check spam.
        </p>
        <Button variant="secondary" className="mt-5 w-full" disabled={resendIn > 0} onClick={onResend}>
          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend link"}
        </Button>
        <Link href="/login" className="mt-4 block text-[12px] text-black/40 hover:text-black">
          Back to sign in
        </Link>
      </Card>
    </div>
  );
}

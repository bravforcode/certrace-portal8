"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button, Field, inputClass, cn } from "@/components/ui";
import { AuthLayout, GoogleButton, Divider, PasswordStrength } from "@/components/auth-panel";
import { useProfile, splitName } from "@/lib/profile";

export default function RegisterPage() {
  const router = useRouter();
  const { update } = useProfile();
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch || !agreed) return;
    setLoading(true);
    window.setTimeout(() => {
      update({ ...splitName(fullName), companyName, onboarded: false });
      router.push("/onboarding");
    }, 700);
  };

  const withGoogle = () => {
    setGoogleLoading(true);
    window.setTimeout(() => {
      update({ onboarded: false });
      router.push("/onboarding");
    }, 900);
  };

  return (
    <AuthLayout>
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">Exporter portal</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        Create your account.
      </h2>
      <p className="mt-2 text-sm text-black/45">One account per company. Add teammates as seats once you're in.</p>

      <div className="mt-4 space-y-2 lg:mt-7 lg:space-y-4">
        <GoogleButton onClick={withGoogle} loading={googleLoading} label="Sign up with Google" />
        <Divider label="or sign up with email" />
      </div>

      <form onSubmit={submit} className="mt-3 space-y-2 lg:mt-5 lg:space-y-4">
        <Field label="Full name">
          <input className={inputClass} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Wasawat Kiakittiwong" required />
        </Field>
        <Field label="Company name">
          <input className={inputClass} type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Siam Steel Export Co." required />
        </Field>
        <Field label="Work email">
          <input className={inputClass} type="email" placeholder="you@company.com" required />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <PasswordStrength value={password} />
        </Field>
        <Field label="Confirm password">
          <input
            className={inputClass}
            type="password"
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {mismatch && <span className="mt-1.5 block text-xs text-[#dc2626]">Passwords don&apos;t match.</span>}
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
          <span>
            I agree to Certrace&apos;s{" "}
            <Link href="/legal/terms" target="_blank" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" target="_blank" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <Button type="submit" className="w-full" disabled={loading || !agreed || mismatch}>
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
        </Button>
      </form>

      <p className="mt-3 text-center text-[13px] text-black/45 lg:mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

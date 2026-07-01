"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { AuthLayout, GoogleButton, Divider } from "@/components/auth-panel";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    window.setTimeout(() => router.push("/dashboard"), 600);
  };

  const withGoogle = () => {
    setGoogleLoading(true);
    window.setTimeout(() => router.push("/dashboard"), 900);
  };

  return (
    <AuthLayout>
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">Exporter portal</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        Sign in to continue.
      </h2>

      <div className="mt-7 space-y-4">
        <GoogleButton onClick={withGoogle} loading={googleLoading} />
        <Divider label="or sign in with email" />
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Work email">
          <input className={inputClass} type="email" placeholder="you@company.com" defaultValue="wasawat@siamsteel.co.th" required />
        </Field>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">Password</span>
            <Link href="/forgot-password" className="text-[11px] text-black/40 hover:text-black">
              Forgot password?
            </Link>
          </div>
          <input className={inputClass} type="password" placeholder="••••••••" defaultValue="demo-password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
          {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-black/45">
        New to Certrace?{" "}
        <Link href="/register" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
          Create an account
        </Link>
      </p>

    </AuthLayout>
  );
}

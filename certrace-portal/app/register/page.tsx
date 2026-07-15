"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { AuthLayout } from "@/components/auth-panel";
import { useProfile, splitName } from "@/lib/profile";

export default function RegisterPage() {
  const router = useRouter();
  const { update } = useProfile();
  const [fullName, setFullName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !companyName.trim()) return;
    update({ ...splitName(fullName), companyName, onboarded: false });
    router.push("/onboarding");
  };

  return (
    <AuthLayout>
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">Exporter portal</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        Create a local demo profile.
      </h2>
      <p className="mt-2 text-sm text-black/45">Saved only in this browser. No account, password, email verification, or access control is created.</p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Full name">
          <input className={inputClass} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Wasawat Kiakittiwong" required />
        </Field>
        <Field label="Company name">
          <input className={inputClass} type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Siam Steel Export Co." required />
        </Field>
        <Button type="submit" className="w-full" disabled={!fullName.trim() || !companyName.trim()}>
          Create local demo profile <ArrowRight size={15} strokeWidth={1.5} />
        </Button>
      </form>

      <p className="mt-3 text-center text-[13px] text-black/45 lg:mt-6">
        Return to the demo entry?{" "}
        <Link href="/login" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
          Go back
        </Link>
      </p>
    </AuthLayout>
  );
}

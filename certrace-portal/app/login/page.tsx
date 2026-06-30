"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Field, inputClass, Chip, StatusDot } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push("/dashboard"), 500);
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-black/[0.06] p-12 lg:flex">
        <div className="dotted-grid absolute inset-0 opacity-60" aria-hidden />
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <g stroke="rgba(17,17,17,0.10)" strokeWidth="1">
            <line x1="80" y1="120" x2="220" y2="180" />
            <line x1="220" y1="180" x2="180" y2="340" />
            <line x1="220" y1="180" x2="380" y2="150" />
            <line x1="380" y1="150" x2="480" y2="280" />
          </g>
          <g fill="rgba(17,17,17,0.28)">
            <circle cx="80" cy="120" r="3" />
            <circle cx="180" cy="340" r="3" />
            <circle cx="480" cy="280" r="3" />
          </g>
          <g fill="#10b981" opacity="0.5">
            <circle cx="220" cy="180" r="3.4" />
            <circle cx="380" cy="150" r="3.4" />
          </g>
        </svg>

        <div className="relative font-pixel text-[13px] uppercase tracking-[0.32em] text-black/70">Certrace</div>

        <div className="relative">
          <h1 className="max-w-md font-[family-name:var(--font-plex)] text-4xl font-light leading-[1.05] tracking-tight text-[#111]">
            Supply-chain carbon compliance. Without the chaos.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-black/45">
            Collect verified supplier data, calculate embedded emissions, and submit audit-ready declarations to your
            buyers and the authorities — from one place.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Chip tone="ok">CBAM live</Chip>
            <Chip>EUDR · CSRD soon</Chip>
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-[11px] uppercase tracking-[0.1em] text-black/35">
          <span className="inline-flex items-center gap-2">
            <StatusDot tone="ok" pulse glow /> 94% avg completion
          </span>
          <span>6× faster filing</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="font-pixel text-[12px] uppercase tracking-[0.25em] text-black/70 lg:hidden">Certrace</div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">Exporter portal</p>
          <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
            Sign in to continue.
          </h2>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Work email">
              <input className={inputClass} type="email" placeholder="you@company.com" defaultValue="wasawat@siamsteel.co.th" required />
            </Field>
            <Field label="Password">
              <input className={inputClass} type="password" placeholder="••••••••" defaultValue="demo-password" required />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={15} strokeWidth={1.5} />}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-black/35">
            <span>Invited as a supplier?</span>
            <Link href="/s/demo-token" className="text-black/55 hover:text-black">
              Open guided form →
            </Link>
          </div>

          <p className="mt-10 text-[11px] leading-relaxed text-black/30">
            Demo build · frontend MVP. Credentials are pre-filled — just press sign in.
          </p>
        </div>
      </div>
    </div>
  );
}

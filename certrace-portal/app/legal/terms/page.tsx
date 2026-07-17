import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { Eyebrow } from "@/components/ui";

const SECTIONS = [
  {
    title: "1. What Certrace is",
    body: "This build is a browser-only CBAM readiness demonstration. It prepares draft calculations and a manual data handoff; it does not create a legal filing, audit-ready record, Registry submission, verifier opinion, or production service account.",
  },
  {
    title: "2. Your account",
    body: "Displayed users, account IDs, passwords, roles, seats, sessions, and organisations are fixtures. No authentication authority, tenant isolation, account recovery, or server-side access control is configured. Do not treat the demo as an account system.",
  },
  {
    title: "3. Supplier data",
    body: "Supplier links and records work only in the same browser storage. No invitation, email, cross-device transfer, buyer delivery, verifier sharing, or authority submission occurs. Use synthetic data only; do not enter personal, confidential, evidentiary, or production emissions data.",
  },
  {
    title: "4. Plans and billing",
    body: "Pricing, plans, invoices, seats, and billing controls are presentation fixtures. This build does not take payment, create a subscription, or change an entitlement.",
  },
  {
    title: "5. Acceptable use",
    body: "Do not enter real credentials, personal data, trade secrets, evidence files, or regulated production data. Do not represent a draft preview or local status as verified, filed, accepted, delivered, immutable, or legally sufficient.",
  },
  {
    title: "6. Liability",
    body: "Calculation fixtures remain subject to review by Certrace's ESG Compliance Specialist. Real actual-value data requires an accredited verifier. The demo is provided as is, without production availability, retention, security, correctness, or legal-compliance guarantees.",
  },
  {
    title: "7. Changes",
    body: "These demonstration notices may change with the implementation. A production launch requires separately approved commercial terms, privacy notices, data-processing terms, and security controls.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="border-b border-black/[0.06] px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <CertraceLogo className="h-5 w-auto" />
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
            <ArrowLeft size={13} strokeWidth={1.5} /> Back
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-14">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-3 font-[family-name:var(--font-plex)] text-4xl font-light tracking-tight text-[#111]">Terms &amp; Conditions</h1>
        <p className="mt-3 text-sm text-black/40">Last updated 15 July 2026 · Readiness demonstration notice.</p>
        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-base text-black/85">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-black/50">{s.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-12 text-xs text-black/30">
          Questions? See our <Link href="/legal/privacy" className="underline-offset-2 hover:text-black hover:underline">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}

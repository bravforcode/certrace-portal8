import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { Eyebrow } from "@/components/ui";

const SECTIONS = [
  {
    title: "1. What we collect",
    body: "This demo stores the form values and safe file metadata you enter in your browser's localStorage. The displayed account, organisation, suppliers, sessions, and reports are fixtures. Do not enter real personal, confidential, or regulated data.",
  },
  {
    title: "2. Why we collect it",
    body: "Local values exist only to demonstrate the guided workflow and deterministic calculations. No backend, identity service, analytics service, notification provider, or device-detection service receives them from this build.",
  },
  {
    title: "3. Who it's shared with",
    body: "The application does not automatically share data with another user, browser, device, buyer, verifier, authority, or email recipient. Anyone who can use the same browser profile may be able to inspect or alter localStorage, so it is not an access-control boundary.",
  },
  {
    title: "4. Evidence and file references",
    body: "The demo records filenames and sizes only and does not persist document bytes. Those references are not evidence. Production evidence processing requires private encrypted storage, malware scanning, authorization, integrity records, and retention controls.",
  },
  {
    title: "5. Cookies",
    body: "The current controls save local demonstration preferences. They do not create an authenticated session or prove that a production analytics/consent system is active.",
  },
  {
    title: "6. Data retention",
    body: "Browser data remains until the browser, user, or application removes it and can be lost or changed without notice. The demo does not enforce a legal retention or deletion schedule and cannot provide an immutable audit history.",
  },
  {
    title: "7. Your rights",
    body: "A production service must publish an approved privacy notice and process for applicable data-subject rights before receiving personal data. This demonstration page does not claim that such a service is operating.",
  },
];

export default function PrivacyPolicyPage() {
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
        <h1 className="mt-3 font-[family-name:var(--font-plex)] text-4xl font-light tracking-tight text-[#111]">Privacy Policy</h1>
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
          See also our <Link href="/legal/terms" className="underline-offset-2 hover:text-black hover:underline">Terms &amp; Conditions</Link>.
        </p>
      </main>
    </div>
  );
}

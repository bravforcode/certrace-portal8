import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { Eyebrow } from "@/components/ui";

const SECTIONS = [
  {
    title: "1. What we collect",
    body: "Account data (name, work email, company, role), the installation, production, emissions and supplier data you and your invited suppliers enter into your verification workspaces, and basic product-usage data (pages visited, session timestamps, device type) used to keep the product secure and improve it.",
  },
  {
    title: "2. Why we collect it",
    body: "To operate the verification workflow, to calculate embedded emissions, to secure your account (e.g. detecting sign-ins from a new device), and — once the hosted service is enabled — to send the notifications you've opted into: deadline reminders, sign-off requests, and account security alerts.",
  },
  {
    title: "3. Who it's shared with",
    body: "Data you collect is visible to your organisation's seats and, only when you explicitly export or share it, to the buyer, verifier, or authority you route it to. Anyone holding a supplier link you have sent can see and answer the month that link is scoped to — treat those links as you would a shared document. We do not sell personal data or supplier data to third parties.",
  },
  {
    title: "4. Your email and account identity",
    body: "Your account is identified by a permanent account ID, not by your email address. You can change the email on your account at any time — your workspaces, suppliers, seats, and history stay attached to the same account. This matters if an employee who set up the account later leaves the company: ownership can move to a new email without losing anything.",
  },
  {
    title: "5. Cookies",
    body: "We use essential cookies to keep you signed in and to remember your interface preferences (language, jurisdiction). Optional analytics cookies help us understand which parts of the product are actually used. You can manage these from Settings → Privacy & Security → Manage Cookies at any time.",
  },
  {
    title: "6. Where your data is stored right now",
    body: "In this pre-release build, everything you enter is stored in your own web browser on the device you are using. It is not transmitted to or held on a Certrace server, we cannot see it, it is not backed up, and it does not synchronise between devices or between colleagues. Clearing your browser data deletes it permanently and we cannot restore it. Certrace does not currently send email or messages on your behalf. This section will be replaced when the hosted service is enabled, and you will be told before that happens.",
  },
  {
    title: "7. Data retention",
    body: "Workspace and supplier data is retained for as long as your account is active, plus the retention period required for statutory and regulatory examination under the regulation it supports (typically 4 years for CBAM). You can request deletion of your account data by contacting support. In the current pre-release build, deleting your browser data deletes it immediately and irreversibly — see section 6.",
  },
  {
    title: "8. Your rights",
    body: "Depending on your jurisdiction, you may have the right to access, correct, export, or delete your personal data. Reach out via Settings → Privacy & Security, and we'll action the request within 30 days.",
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
        <p className="mt-3 text-sm text-black/40">Last updated 1 June 2026 · Certrace, operated for demonstration purposes.</p>
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

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { Eyebrow } from "@/components/ui";

const SECTIONS = [
  {
    title: "1. What Certrace is",
    body: "Certrace is a workflow platform that helps exporters collect production and emissions data, calculate embedded emissions, and prepare verification-ready evidence for regulations such as the EU Carbon Border Adjustment Mechanism (CBAM). Work is organised into verification workspaces — one per installation, good and reporting year. Certrace is a preparation and workflow tool: it does not submit anything to any authority on your behalf, and it is not the CBAM declarant. Under CBAM the EU importer's declarant files; you are the operator supplying the data they file with.",
  },
  {
    title: "2. Your account",
    body: "One organisation account is created per company. Your account identity (account ID) is permanent and is not tied to any single email address — you may change the email associated with your account at any time from Settings without losing access to your workspaces, suppliers, or history. You're responsible for keeping your password confidential and for activity that happens under your seats.",
  },
  {
    title: "3. Supplier data",
    body: "Suppliers you invite submit data through a free guided form, reached by a link you send them — no account and no seat at their end. That data is shared with your organisation for the purpose of preparing your emissions reporting. Certrace does not sell supplier data and does not share it with any third party outside your declared workflow (your buyers, your verifier, and the relevant regulatory authority, and only when you choose to share it).",
  },
  {
    title: "4. Pre-release status and your data",
    body: "This build stores your data in your own web browser on the device you are using. It is not yet held on a Certrace server, it is not backed up by us, it is not synchronised between devices or colleagues, and clearing your browser data will delete it permanently. Certrace does not currently send email or messages on your behalf: schedules you set drive due dates and warnings inside the product, and you send supplier links yourself. Export anything you need to keep. These limits end when the hosted service is enabled, and this clause will be replaced when it is.",
  },
  {
    title: "5. Plans and billing",
    body: "Paid plans are billed per seat, in advance, monthly or annually as selected at checkout. Supplier access is always free. You can upgrade, downgrade, or cancel from Plan & billing; downgrades take effect at the end of the current billing period.",
  },
  {
    title: "6. Acceptable use",
    body: "You agree not to use Certrace to submit knowingly false emissions data, to attempt to access another organisation's account or data, or to reverse-engineer the calculation engine for purposes other than verifying your own results.",
  },
  {
    title: "7. Liability",
    body: "Certrace provides tooling to help you assemble accurate emissions reporting, but the accuracy of the underlying data supplied by you and your suppliers remains your responsibility, as does the decision to share or file it. Nothing in Certrace is regulatory, legal or financial advice. Certrace is provided \"as is\" during this pre-release phase without uptime guarantees or any warranty of fitness for a particular purpose.",
  },
  {
    title: "8. Changes",
    body: "We may update these terms as the product evolves. Material changes will be notified in-app and by email before they take effect.",
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
          Questions? See our <Link href="/legal/privacy" className="underline-offset-2 hover:text-black hover:underline">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}

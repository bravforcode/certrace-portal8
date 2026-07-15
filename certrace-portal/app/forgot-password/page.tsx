import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { AuthLayout } from "@/components/auth-panel";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
        <ArrowLeft size={13} strokeWidth={1.5} /> Back to sign in
      </Link>

      <p className="mt-5 text-[11px] uppercase tracking-[0.1em] text-black/40">Exporter portal</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        Reset your password.
      </h2>
      <p className="mt-2 text-sm text-black/45">Password reset is unavailable because no authentication authority or transactional email provider is configured.</p>

      <div className="mt-7 space-y-4">
        <Field label="Work email">
          <input className={inputClass} type="email" value="demo account fixture" disabled readOnly />
        </Field>
        <Button className="w-full" disabled>
          Backend not configured
        </Button>
      </div>
    </AuthLayout>
  );
}

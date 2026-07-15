"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { AuthLayout } from "@/components/auth-panel";

export default function LoginPage() {
  const router = useRouter();

  return (
    <AuthLayout>
      <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">Exporter portal</p>
      <h2 className="mt-3 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
        Open the readiness demo.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-black/45">
        No authentication, account, tenant boundary, or server session is configured. Continue only with synthetic data in this browser.
      </p>

      <Button className="mt-7 w-full" onClick={() => router.push("/dashboard")}>
        Enter browser-local demo <ArrowRight size={15} strokeWidth={1.5} />
      </Button>

      <p className="mt-6 text-center text-[13px] text-black/45">
        Need a different local fixture?{" "}
        <Link href="/register" className="text-black/70 underline-offset-2 hover:text-black hover:underline">
          Create a demo profile
        </Link>
      </p>

    </AuthLayout>
  );
}

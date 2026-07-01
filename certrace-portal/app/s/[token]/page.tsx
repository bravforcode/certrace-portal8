"use client";

export const runtime = "edge";

/* The smartlink destination. The exporter's declaration emails every mapped
   supplier a link to /s/<token>; the token resolves to that supplier's slice of
   the request and opens the Certrace Supplier Portal. An unrecognised token
   shows a friendly fallback with a few live demo links. */

import * as React from "react";
import { useParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { Card, Button } from "@/components/ui";
import { resolveRequest, makeToken } from "@/lib/supplier";
import { SupplierPortal } from "@/components/supplier/portal";

const DEMO = [
  { id: "s1", label: "Siam Yamato Steel — submitted earlier" },
  { id: "s2", label: "Thai Metal Pro — in progress" },
  { id: "s6", label: "Chonburi Foundry — not started (critical)" },
];

export default function SupplierLinkPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token);
  const req = React.useMemo(() => resolveRequest(token), [token]);

  if (!req) {
    return (
      <div className="min-h-screen bg-[#f5f4f0]">
        <header className="border-b border-black/[0.06]">
          <div className="mx-auto flex h-16 max-w-lg items-center px-6">
            <CertraceLogo className="h-[18px] w-auto" />
          </div>
        </header>
        <main className="mx-auto max-w-lg px-6 py-16">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-black/40 shadow-sm">
            <ShieldCheck size={22} strokeWidth={1.5} />
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">This link looks invalid or expired.</h1>
          <p className="mt-2 text-sm text-black/50">
            Supplier links are personal and time-limited. Ask the exporter who contacted you to resend their data request, or try one of the demo links below.
          </p>
          <Card className="mt-6 divide-y divide-black/[0.05] p-0">
            {DEMO.map((d) => (
              <a key={d.id} href={`/s/${makeToken("cbam-2026-q2-steel", d.id)}`} className="flex items-center justify-between px-4 py-3 text-sm text-black/70 hover:bg-[#fafaf8]">
                {d.label}
                <span className="font-mono text-[11px] text-black/35">open →</span>
              </a>
            ))}
          </Card>
          <p className="mt-4 text-[11px] text-black/30">Demo links open a sample CBAM Q2 2026 request from Siam Steel Export Co.</p>
          <div className="mt-6">
            <Button variant="secondary" size="sm" onClick={() => (window.location.href = "/dashboard")}>
              Go to exporter portal
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return <SupplierPortal req={req} />;
}

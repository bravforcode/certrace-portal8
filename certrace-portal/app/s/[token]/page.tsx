"use client";

/* Same-browser demo-link destination. Tokens are deterministic identifiers,
   not authentication, and no request is emailed or resolved by a backend. */

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
          <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">This demo link is unavailable here.</h1>
          <p className="mt-2 text-sm text-black/50">
            Demo links resolve only against data available in this browser. They are not authenticated Smart Links and do not work across devices. Try one of the local fixtures below.
          </p>
          <Card className="mt-6 divide-y divide-black/[0.05] p-0">
            {DEMO.map((d) => (
              <a key={d.id} href={`/s/${makeToken("cbam-2026-annual-steel", d.id)}`} className="flex items-center justify-between px-4 py-3 text-sm text-black/70 hover:bg-[#fafaf8]">
                {d.label}
                <span className="font-mono text-[11px] text-black/35">open →</span>
              </a>
            ))}
          </Card>
          <p className="mt-4 text-[11px] text-black/30">Same-browser sample only · no email delivery, expiry enforcement or backend access control.</p>
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

"use client";

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
import { useT } from "@/lib/i18n";

/* The company names are proper nouns and stay as they are in both languages;
   only the state after the dash is a phrase, so the two halves are separate —
   `name` passes through, `state` goes through t(). */
const DEMO = [
  { id: "s1", name: "Siam Yamato Steel", state: "submitted earlier" },
  { id: "s2", name: "Thai Metal Pro", state: "in progress" },
  { id: "s6", name: "Chonburi Foundry", state: "not started (critical)" },
];

export default function SupplierLinkPage() {
  const t = useT();
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
          <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{t("This link looks invalid or expired.")}</h1>
          <p className="mt-2 text-sm text-black/50">
            {t("Supplier links are personal and time-limited. Ask the exporter who contacted you to resend their data request, or try one of the demo links below.")}
          </p>
          <Card className="mt-6 divide-y divide-black/[0.05] p-0">
            {DEMO.map((d) => (
              <a key={d.id} href={`/s/${makeToken("cbam-2026-q2-steel", d.id)}`} className="flex items-center justify-between px-4 py-3 text-sm text-black/70 hover:bg-[#fafaf8]">
                {d.name} — {t(d.state)}
                <span className="font-mono text-[11px] text-black/35">{t("open →")}</span>
              </a>
            ))}
          </Card>
          <p className="mt-4 text-[11px] text-black/30">{t("Demo links open a sample CBAM Q2 2026 request from Siam Steel Export Co.")}</p>
          <div className="mt-6">
            <Button variant="secondary" size="sm" onClick={() => (window.location.href = "/dashboard")}>
              {t("Go to exporter portal")}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return <SupplierPortal req={req} />;
}

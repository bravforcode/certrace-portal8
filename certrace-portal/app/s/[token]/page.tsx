"use client";

export const runtime = "edge";

/* The smartlink destination. The exporter's declaration emails every mapped
   supplier a link to /s/<token>; the token resolves to that supplier's slice of
   the request and opens the Certrace Supplier Portal.

   Two ways a token resolves, chosen by whether a backend is wired up:

   • Backend live (apiConfigured) — the token is 32 server-issued random bytes.
     GET /api/v1/links/{token} maps it back to (declId, supplier, month) and
     hands over that supplier's SAVED STATE. The questionnaire is then built
     locally from the ids; the answers come from the server, so a reopen — on
     any device — reads what was typed, and the exporter sees it too.
   • No backend (the demo) — the token is a local base64("declId|supplierId")
     and resolves entirely from bundled fixtures, state in localStorage.

   An unrecognised or expired token shows a friendly fallback. */

import * as React from "react";
import { useParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { Card, Button } from "@/components/ui";
import { resolveRequest, buildFromPayload, makeToken } from "@/lib/supplier";
import { SupplierPortal } from "@/components/supplier/portal";
import { apiConfigured } from "@/lib/api";
import { useSmartLink } from "@/lib/links-query";
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
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token);
  // The choice is a stable module read, so the two branches never swap across
  // renders — each keeps its own hooks and there is no conditional-hook hazard.
  return apiConfigured() ? <ApiSupplierLink token={token} /> : <LocalSupplierLink token={token} />;
}

/* ── Backend live: resolve the token against the API ──────────────
   The resolve is a TanStack query (lib/links-query.ts). The server maps the
   opaque token to its ids; the questionnaire is built locally from the
   declaration they point at, and only the answer state is the server's. */
function ApiSupplierLink({ token }: { token: string }) {
  const { data, isPending, isError } = useSmartLink(token);

  // A dead link (404/410), a network give-up, or a payload too thin to build a
  // form from, all land on the same "ask for a new link" page.
  const req = React.useMemo(() => (data ? buildFromPayload(token, data) : null), [data, token]);

  if (isPending) return <LoadingLink />;
  if (isError || !data || !req) return <InvalidLink />;
  return <SupplierPortal req={req} initialState={data.state} />;
}

/* ── No backend: the fixtures-only demo path, unchanged ───────────── */
function LocalSupplierLink({ token }: { token: string }) {
  const req = React.useMemo(() => resolveRequest(token), [token]);
  if (!req) return <InvalidLink showDemo />;
  return <SupplierPortal req={req} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto flex h-16 max-w-lg items-center px-6">
          <CertraceLogo className="h-[18px] w-auto" />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-6 py-16">{children}</main>
    </div>
  );
}

function LoadingLink() {
  const t = useT();
  return (
    <Shell>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-black/40 shadow-sm">
        <ShieldCheck size={22} strokeWidth={1.5} />
      </span>
      <p className="mt-5 text-sm text-black/50">{t("Opening your request…")}</p>
    </Shell>
  );
}

function InvalidLink({ showDemo }: { showDemo?: boolean }) {
  const t = useT();
  return (
    <Shell>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-black/40 shadow-sm">
        <ShieldCheck size={22} strokeWidth={1.5} />
      </span>
      <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{t("This link looks invalid or expired.")}</h1>
      <p className="mt-2 text-sm text-black/50">
        {t("Supplier links are personal and time-limited. Ask the exporter who contacted you to resend their data request, or try one of the demo links below.")}
      </p>
      {showDemo && (
        <>
          <Card className="mt-6 divide-y divide-black/[0.05] p-0">
            {DEMO.map((d) => (
              <a key={d.id} href={`/s/${makeToken("cbam-2026-q2-steel", d.id)}`} className="flex items-center justify-between px-4 py-3 text-sm text-black/70 hover:bg-[#fafaf8]">
                {d.name} — {t(d.state)}
                <span className="font-mono text-[11px] text-black/35">{t("open →")}</span>
              </a>
            ))}
          </Card>
          <p className="mt-4 text-[11px] text-black/30">{t("Demo links open a sample CBAM Q2 2026 request from Siam Steel Export Co.")}</p>
        </>
      )}
      <div className="mt-6">
        <Button variant="secondary" size="sm" onClick={() => (window.location.href = "/dashboard")}>
          {t("Go to exporter portal")}
        </Button>
      </div>
    </Shell>
  );
}

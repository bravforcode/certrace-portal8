"use client";

export const runtime = "edge";

/* The smartlink destination. The exporter's declaration emails every mapped
   supplier a link to /s/<token>; the token resolves to that supplier's slice of
   the request and opens the Certrace Supplier Portal.

   Only server-issued tokens resolve. The API supplies the request and saved
   answers; invalid links and connection failures never open a demo form.

   An unrecognised or expired token shows a friendly fallback. */

import * as React from "react";
import { useParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";
import { buildFromPayload } from "@/lib/supplier";
import { SupplierPortal } from "@/components/supplier/portal";
import { useSmartLink } from "@/lib/links-query";
import { ErrorState } from "@/components/query-state";
import { isDeadLink } from "@/lib/api/errors";
import { useT } from "@/lib/i18n";

export default function SupplierLinkPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token);
  return <ApiSupplierLink token={token} />;
}

/* ── Backend live: resolve the token against the API ──────────────
   The resolve is a TanStack query (lib/links-query.ts). The server maps the
   opaque token to its ids; the questionnaire is built locally from the
   declaration they point at, and only the answer state is the server's. */
function ApiSupplierLink({ token }: { token: string }) {
  const { data, isPending, isError, error, refetch } = useSmartLink(token);
  const req = React.useMemo(
    () => (data ? buildFromPayload(token, data) : null),
    [data, token],
  );

  if (isPending) return <LoadingLink />;
  if (isError && isDeadLink(error)) return <InvalidLink />;
  if (isError)
    return (
      <Shell>
        <ErrorState onRetry={() => void refetch()} />
      </Shell>
    );
  if (data && req)
    return <SupplierPortal req={req} initialState={data.state} />;
  return <InvalidLink />;
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
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-black/[0.07] bg-white text-black/40">
        <ShieldCheck size={22} strokeWidth={1.5} />
      </span>
      <p className="mt-5 text-sm text-black/50">{t("Opening your request…")}</p>
    </Shell>
  );
}

function InvalidLink() {
  const t = useT();
  return (
    <Shell>
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-black/[0.07] bg-white text-black/40">
        <ShieldCheck size={22} strokeWidth={1.5} />
      </span>
      <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
        {t("This link looks invalid or expired.")}
      </h1>
      <p className="mt-2 text-sm text-black/50">
        {t(
          "Supplier links are personal and time-limited. Ask the exporter who contacted you to resend their data request.",
        )}
      </p>
      <div className="mt-6">
        <ButtonLink href="/dashboard" variant="secondary" size="sm">
          {t("Go to exporter portal")}
        </ButtonLink>
      </div>
    </Shell>
  );
}

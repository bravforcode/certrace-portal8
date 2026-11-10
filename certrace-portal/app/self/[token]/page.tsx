"use client";

export const runtime = "edge";

/* SELF-SUPPLY — the exporter filling in their OWN installation's data.

   When the exporter owns the mill there is nobody to send a Smart Link to, so
   this route exists instead of one: same resolved request, same guided form,
   same AI check, same verification trail — just reached from inside the declaration
   workspace rather than from an email, and labelled as their own data.

   The token still resolves the request (it's the declaration × supplier pair,
   see lib/supplier.ts) but it is never sent anywhere. A token for a row that
   isn't self-supplied lands here by mistake and is bounced to /s/<token>, so
   the two paths can't be confused. */

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { Card, Button } from "@/components/ui";
import { SupplierPortal } from "@/components/supplier/portal";
import { useT } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { useSessionUser } from "@/lib/profile";
import { resolveSelfSupply } from "@/lib/self-supply";
import { ErrorState, LoadingState } from "@/components/query-state";

export default function SelfSupplyPage() {
  const t = useT();
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token);
  const user = useSessionUser();
  const request = useQuery({
    queryKey: ["self-supply", user?.id, token],
    queryFn: () => resolveSelfSupply(token),
    enabled: Boolean(user),
    staleTime: Infinity,
  });
  const req = request.data?.req;
  if (user && request.isPending) return <LoadingState />;
  if (request.isError)
    return <ErrorState onRetry={() => void request.refetch()} />;

  if (!req || !req.selfSupplied) {
    return (
      <div className="min-h-screen bg-[#f5f4f0]">
        <header className="border-b border-black/[0.06]">
          <div className="mx-auto flex h-16 max-w-lg items-center px-6">
            <CertraceLogo className="h-[18px] w-auto" />
          </div>
        </header>
        <main className="mx-auto max-w-lg px-6 py-16">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-black/[0.07] bg-white text-black/40">
            <Building2 size={22} strokeWidth={1.5} />
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
            {req
              ? "This product isn't self-supplied."
              : "This link looks invalid or expired."}
          </h1>
          <p className="mt-2 text-sm text-black/50">
            {req
              ? `${req.supplierName} is an external supplier on this declaration — their data comes in through their own Smart Link.`
              : "Open the declaration and use “Fill in our data” on the self-supplied row."}
          </p>
          <Card className="mt-6 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={req ? `/declarations/${req.declId}` : "/declarations"}
              >
                <Button size="sm">
                  <ArrowLeft size={13} strokeWidth={1.5} />{" "}
                  {t("Back to declarations")}
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!request.data?.initialState) return <LoadingState />;
  return (
    <SupplierPortal
      key={req.token}
      req={req}
      initialState={request.data?.initialState}
    />
  );
}

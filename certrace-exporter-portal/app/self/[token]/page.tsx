"use client";

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
import { resolveRequest } from "@/lib/supplier";
import { SupplierPortal } from "@/components/supplier/portal";
import { useT } from "@/lib/i18n";

export default function SelfSupplyPage() {
  const t = useT();
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token);
  const req = React.useMemo(() => resolveRequest(token), [token]);

  if (!req || !req.selfSupplied) {
    return (
      <div className="min-h-screen bg-[#f5f4f0]">
        <header className="border-b border-black/[0.06]">
          <div className="mx-auto flex h-16 max-w-lg items-center px-6">
            <CertraceLogo className="h-[18px] w-auto" />
          </div>
        </header>
        <main className="mx-auto max-w-lg px-6 py-16">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-black/40 shadow-sm">
            <Building2 size={22} strokeWidth={1.5} />
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
            {req ? "This product isn't self-supplied." : "This link looks invalid or expired."}
          </h1>
          <p className="mt-2 text-sm text-black/50">
            {req
              ? `${req.supplierName} is an external supplier on this declaration — their data comes in through their own Smart Link.`
              : "Open the declaration and use “Fill in our data” on the self-supplied row."}
          </p>
          <Card className="mt-6 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {req && (
                <Link href={`/s/${token}`}>
                  <Button variant="secondary" size="sm">{t("Open the supplier link instead")}</Button>
                </Link>
              )}
              <Link href={req ? `/declarations/${req.declId}` : "/declarations"}>
                <Button size="sm">
                  <ArrowLeft size={13} strokeWidth={1.5} /> {t("Back to declarations")}
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return <SupplierPortal req={req} />;
}

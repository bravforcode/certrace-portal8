"use client";

/* ── One shape for "your plan stops here" ───────────────────
   Four screens can hit a cap — seats on /team, sites in Settings, CN codes
   and open years in the new-workspace flow. Before this they would each have
   invented their own banner, which is how a product ends up telling the
   reader the same fact in three voices and two colours.

   It is a WARM card with a warn-toned mark, not an error: nothing has gone
   wrong, the account has simply used what it bought. The next move is always
   the same and always outward — the price is quoted, so raising a cap is a
   conversation with sales rather than a checkout. */

import { TriangleAlert, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, ButtonLink, Button } from "./ui";
import { CAP_REMEDY, CONTACT_SALES_URL, capBlockedText, type CapState } from "@/lib/plan";
import { useAccount } from "./account-lock";
import { useT } from "@/lib/i18n";

export function PlanCapNotice({ cap, className }: { cap: CapState; className?: string }) {
  const t = useT();
  /* Through the context, not currentPlan(): a screen that does not consume it
     never re-renders when the plan resolves on the client, and this banner
     names the plan in its first sentence. */
  const { plan } = useAccount();
  if (cap.cap == null || !cap.atCap) return null;

  return (
    <Card warm className={className}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-[#b45309]">
            <TriangleAlert size={17} strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm text-[#111]">{t(capBlockedText(cap), { plan: plan.name, cap: cap.cap })}</p>
            <p className="mt-1 text-sm text-black/45">{t(CAP_REMEDY)}</p>
          </div>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          <Link href="/billing">
            <Button variant="ghost" size="sm">
              {t("Compare plans")}
            </Button>
          </Link>
          <ButtonLink href={CONTACT_SALES_URL} external variant="secondary" size="sm">
            {t("Contact Sales")} <ArrowRight size={14} strokeWidth={1.5} />
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

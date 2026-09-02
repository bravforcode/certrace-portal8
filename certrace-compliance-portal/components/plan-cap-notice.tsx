"use client";

/* ── One shape for "your plan stops here" ───────────────────
   Four screens can hit a cap — seats on /team, sites in Settings, CN codes
   and open years in the new-workspace flow. Before this they would each have
   invented their own banner, which is how a product ends up telling the
   reader the same fact in three voices and two colours.

   It is a WARM card with a warn-toned mark, not an error: nothing has gone
   wrong, the account has simply used what it bought.

   THE NEXT MOVE IS NOT SALES IN THIS BUILD. In the owner build this card ends
   in "Compare plans" and "Contact Sales", because the person reading it can
   do both. This seat can do neither — the plan is not theirs, and a
   compliance officer who opens a commercial conversation on their employer's
   behalf has been walked into it by a button. So the card keeps the fact —
   the account is at a limit, which is why an estate may look smaller than it
   should — and changes the remedy to the only one that is true here: the
   account owner, by name, with a way to reach them. Nothing quotes a price. */

import { TriangleAlert, Mail } from "lucide-react";
import { Card, ButtonLink } from "./ui";
import { CAP_REMEDY, capBlockedText, type CapState } from "@/lib/plan";
import { ACCOUNT_OWNER, OWNER_NAME } from "@/lib/seat";
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
            <p className="mt-1 text-sm text-black/45">{t(CAP_REMEDY, { owner: OWNER_NAME })}</p>
          </div>
        </div>
        {ACCOUNT_OWNER?.email && (
          <div className="flex flex-none flex-wrap items-center gap-2">
            <ButtonLink href={`mailto:${ACCOUNT_OWNER.email}`} external variant="secondary" size="sm">
              <Mail size={14} strokeWidth={1.5} /> {t("Ask {name}", { name: ACCOUNT_OWNER.name })}
            </ButtonLink>
          </div>
        )}
      </div>
    </Card>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { subscribeAccount } from "@/lib/account-storage";
import { summarize, type Opportunity } from "@/lib/factory/opportunities";
import { readOpportunities } from "@/lib/factory/opportunity-store";

/** Dashboard card: the open opportunity count, the impact and the three largest open cards.
    It shows what the Opportunities page last saved; opening that page refreshes it. */
export function OpportunitySummary() {
  const t = useT();
  const [list, setList] = React.useState<Opportunity[]>([]);
  React.useEffect(() => {
    const load = () => setList(readOpportunities());
    load();
    return subscribeAccount(load);
  }, []);

  const totals = summarize(list);
  const top = list
    .filter((o) => o.status === "open" || o.status === "in-progress")
    .slice(0, 3);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-light text-black/80">{t("Opportunities summary")}</h2>
        <Link href="/opportunities" className="text-sm text-black/60 underline-offset-2 hover:underline">
          {t("See all")}
        </Link>
      </div>
      <p className="text-sm text-black/60">
        {t("Open")} {totals.open} · {t("In progress")} {totals.inProgress} · {t("Done")} {totals.done}
      </p>
      {top.length > 0 && (
        <div>
          <p className="text-xs text-black/50">{t("Top open items")}</p>
          <ul className="mt-1 space-y-1 text-sm text-black/75">
            {top.map((o) => (
              <li key={o.id} className="truncate">{t(o.title)}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

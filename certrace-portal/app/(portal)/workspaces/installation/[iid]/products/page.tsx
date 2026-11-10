"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   INSTALLATION · PRODUCTS — the product reports made here

   The same cards as the Verification page, narrowed to this site and grouped by
   reporting year, newest first — EVERY year at once, with no year to pick. A
   product report is one CN code for one year; this is where you see them next
   to each other.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import {
  ProductReportCard,
  toCards,
} from "@/components/workspace/product-report-card";
import { useInstallationPage } from "@/components/workspace/installation-provider";
import { useInvalidateWorkspaces } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function InstallationProductsPage() {
  const t = useT();
  const router = useRouter();
  const { id, workspaces } = useInstallationPage();
  const refresh = useInvalidateWorkspaces();
  const cards = React.useMemo(() => toCards(workspaces), [workspaces]);
  const years = [...new Set(cards.map((c) => c.workspace.year))].sort(
    (a, b) => b - a,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-[13px] leading-relaxed text-black/50">
          {t(
            "The product reports made at this installation, by reporting year. Open one to enter its monthly data and choose its direct precursors.",
          )}
        </p>
        <Button
          size="sm"
          onClick={() =>
            router.push(
              `/workspaces/new?installation=${encodeURIComponent(id)}`,
            )
          }
        >
          <Plus size={14} strokeWidth={1.5} /> {t("New product report")}
        </Button>
      </div>

      {years.length === 0 ? (
        <EmptyState
          title={t("No product report here yet")}
          body={t(
            "A product report is one CN code at this installation for one reporting year.",
          )}
          action={
            <Button
              size="sm"
              onClick={() =>
                router.push(
                  `/workspaces/new?installation=${encodeURIComponent(id)}`,
                )
              }
            >
              <Plus size={14} strokeWidth={1.5} /> {t("New product report")}
            </Button>
          }
        />
      ) : (
        years.map((year) => {
          const ofYear = cards.filter((c) => c.workspace.year === year);
          return (
            <section key={year} className="space-y-2.5">
              <div className="flex items-baseline gap-2.5 border-l-2 border-black/15 pl-3">
                <h3 className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/55">
                  {t("Reporting year")} {year}
                </h3>
                <span className="font-mono text-[11px] text-black/30">
                  {ofYear.length}{" "}
                  {ofYear.length === 1
                    ? t("product report")
                    : t("product reports")}
                </span>
              </div>
              <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ofYear.map((c) => (
                  <ProductReportCard
                    key={c.workspace.id}
                    data={c}
                    onChanged={refresh}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

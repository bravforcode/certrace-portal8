"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET C — "BUYER-READY" STATUS

   "If a buyer asked for proof today, could we send it" — made literal.
   Ready when MMD, Monthly data, Precursors and Documents are all COMPLETE
   (or not_applicable), reusing lib/cbam/buyer-ready.ts so this widget and
   Widget J's per-workspace badge can never disagree.
   ════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { CheckCircle2, Download } from "lucide-react";
import { Card, Progress } from "@/components/ui";
import type { BuyerReadyRow } from "@/lib/cbam/dashboard-aggregates";
import { buyerReasonText } from "@/lib/cbam/buyer-ready";
import { useLanguage, useT } from "@/lib/i18n";

export function BuyerReadyStatus({ rows }: { rows: BuyerReadyRow[] }) {
  const t = useT();
  const { lang } = useLanguage();
  const readyCount = rows.filter((r) => r.ready).length;
  const total = rows.length;
  const percent = total > 0 ? (readyCount / total) * 100 : 0;
  const notReady = rows.filter((r) => !r.ready);

  return (
    <Card className="p-6">
      <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">
        {t("Buyer-ready status")}
      </h2>

      <div className="mt-3">
        <div className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
          {t("{ready} of {total} products are buyer-ready", {
            ready: readyCount,
            total,
          })}
        </div>
        <div className="mt-3">
          <Progress
            value={percent}
            tone={readyCount === total ? "ok" : "warn"}
          />
        </div>
      </div>

      {notReady.length === 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] px-4 py-4">
          <CheckCircle2
            size={18}
            strokeWidth={1.5}
            className="flex-none text-[#047857]"
          />
          <p className="min-w-0 flex-1 text-[13px] text-[#047857]">
            {t("Every product is ready to hand to a buyer today.")}
          </p>
          {rows[0] && (
            <Link
              href={`/workspaces/${rows[0].workspace.id}/readiness`}
              className="flex-none rounded-lg border border-[rgba(5,150,105,0.3)] px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-[#047857] hover:bg-white"
            >
              <Download size={12} strokeWidth={1.5} className="mr-1 inline" />{" "}
              {t("Generate buyer summary package")}
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-black/[0.05]">
          {notReady.map((r) => (
            <li key={r.workspace.id}>
              {/* Stacks on narrow screens and the reason WRAPS rather than
                  being flex-none: a blocking reason is a full sentence, and
                  pinning it at its natural width was forcing the whole page
                  into a horizontal scroll at mobile size. */}
              <Link
                href={`/workspaces/${r.workspace.id}/readiness`}
                className="flex flex-col gap-0.5 py-2.5 transition-colors hover:bg-[#fafaf8] sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <span className="min-w-0 truncate text-[13px] text-black/75 sm:flex-1">
                  {t(r.workspace.productName)}
                </span>
                <span className="min-w-0 text-[12px] leading-snug text-black/40 sm:max-w-[60%] sm:text-right">
                  {r.reason
                    ? buyerReasonText(r.reason, t, lang !== "en")
                    : t("Not yet ready")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

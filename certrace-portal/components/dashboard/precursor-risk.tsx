"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET G — PRECURSOR CHAIN RISK SCORE

   One score per workspace with a muted status band (deliberately NOT a
   traffic light — see the dashboard's palette rule), plus the single node
   that contributed the most points, linked straight to that record.
   ════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, cn } from "@/components/ui";
import type { PrecursorRiskResult } from "@/lib/cbam/precursor-risk";
import type { VerificationWorkspace } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

export type PrecursorRiskRow = { workspace: VerificationWorkspace; risk: PrecursorRiskResult };

/** Muted bands, not saturated traffic-light colours. */
function band(score: number): { label: string; text: string; bg: string; border: string } {
  if (score >= 60) return { label: "High", text: "text-[#dc2626]", bg: "bg-[#fef2f2]", border: "border-[rgba(220,38,38,0.18)]" };
  if (score >= 30) return { label: "Moderate", text: "text-[#b45309]", bg: "bg-[#fffbeb]", border: "border-[rgba(180,83,9,0.18)]" };
  if (score > 0) return { label: "Low", text: "text-[#1d4ed8]", bg: "bg-[#eff6ff]", border: "border-[rgba(29,78,216,0.16)]" };
  return { label: "None", text: "text-[#047857]", bg: "bg-[#ecfdf5]", border: "border-[rgba(5,150,105,0.18)]" };
}

export function PrecursorRiskWidget({ rows }: { rows: PrecursorRiskRow[] }) {
  const t = useT();
  const withChains = rows.filter((r) => r.risk.topFactor != null || r.risk.score > 0);

  return (
    <Card className="p-6">
      <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">{t("Precursor chain risk")}</h2>

      {rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-black/40">{t("No workspaces yet.")}</p>
      ) : withChains.length === 0 ? (
        <p className="mt-3 text-[13px] text-[#047857]">{t("No risk flags across any precursor chain.")}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {withChains.map(({ workspace, risk }) => {
            const b = band(risk.score);
            return (
              <li key={workspace.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-black/75">{workspace.productName}</span>
                  <span className={cn("flex-none rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.08em]", b.border, b.bg, b.text)}>
                    {b.label} · {risk.score}
                  </span>
                </div>

                {/* the score as a bar, so several workspaces compare at a glance */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                  <div className={cn("h-full rounded-full", risk.score >= 60 ? "bg-[#dc2626]" : risk.score >= 30 ? "bg-[#b45309]" : "bg-[#1d4ed8]")} style={{ width: `${risk.score}%` }} />
                </div>

                {/* `flex` with `min-w-0`, never `inline-flex`: an inline-flex
                    box sizes to its content, so a `truncate` child inside one
                    never truncates — it just pushes the card past the
                    viewport. This is what forced a horizontal page scroll at
                    mobile width. */}
                {risk.topFactor && (
                  <Link href={`/workspaces/${workspace.id}/tree`} className="mt-2 flex items-center gap-1.5 text-[11.5px] text-black/45 hover:text-black">
                    <span className="min-w-0 flex-1 truncate">
                      Top factor: {risk.topFactor.node.name || risk.topFactor.node.precursorName || "unnamed precursor"} — {risk.topFactor.reason}
                    </span>
                    <ArrowRight size={11} strokeWidth={1.5} className="flex-none" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

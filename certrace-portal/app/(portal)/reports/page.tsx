"use client";

import { Download, Building2, Landmark, BadgeCheck } from "lucide-react";
import { Card, PageHeader, Stat, StatusLabel, Eyebrow, Tone } from "@/components/ui";
import { toast } from "@/components/toast";
import { downloadPackage } from "@/lib/download";
import { REPORTS, DECLARATIONS, ORG } from "@/lib/data";
import { getRegulation, getJurisdiction } from "@/lib/config";

const stateMeta: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "draft", tone: "muted" },
  in_review: { label: "in review", tone: "info" },
  submitted: { label: "submitted", tone: "info" },
  accepted: { label: "accepted", tone: "ok" },
};

export default function ReportsPage() {
  const jur = getJurisdiction(ORG.origin)!;

  const handleDownload = (r: (typeof REPORTS)[number]) => {
    const reg = getRegulation(r.regulation)!;
    const decl = DECLARATIONS.find((d) => d.period.startsWith(r.period));
    downloadPackage({
      ref: r.id,
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: r.period,
      sector: "Steel & iron",
      origin: jur.name,
      market: "European Union",
      org: ORG.name,
      installationId: ORG.installationId,
      totalEmbedded: decl?.totalEmbedded ?? 4700,
      supplierCount: decl?.suppliers.length ?? 8,
      carbonPricePaid: 0,
      factorSet: jur.factorSet,
      suppliers: decl?.suppliers.map((s) => ({ name: s.name, material: s.material, emissions: s.emissions })),
    });
    toast({ message: "Package downloaded.", detail: "Open it and Print → Save as PDF to file." });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="Submission history."
        lead="Every audit-ready package you've generated and where it went. Timestamped, sealed, and re-downloadable for any audit."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <Stat value={REPORTS.length} label="Packages filed" />
        </Card>
        <Card className="p-5">
          <Stat value={REPORTS.filter((r) => r.state === "accepted").length} label="Accepted" />
        </Card>
        <Card className="p-5">
          <Stat value="0" label="Rejected" />
        </Card>
      </div>

      <div className="space-y-3">
        <Eyebrow>Filed packages</Eyebrow>
        {REPORTS.map((r) => {
          const reg = getRegulation(r.regulation);
          const sm = stateMeta[r.state];
          return (
            <Card key={r.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-black/10 font-[family-name:var(--font-plex)] text-sm font-light text-black/60">
                  {reg?.short.slice(0, 3)}
                </span>
                <div>
                  <div className="text-sm text-[#111]">{r.declaration}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-black/40">
                    generated {r.generated} · {r.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-black/45">
                  <span className="inline-flex items-center gap-1.5" title="Buyer">
                    <Building2 size={14} strokeWidth={1.5} className={r.recipients.buyer ? "text-[#047857]" : "text-black/20"} />
                  </span>
                  <span className="inline-flex items-center gap-1.5" title="Authority">
                    <Landmark size={14} strokeWidth={1.5} className={r.recipients.authority ? "text-[#047857]" : "text-black/20"} />
                  </span>
                  <span className="inline-flex items-center gap-1.5" title="Verifier">
                    <BadgeCheck size={14} strokeWidth={1.5} className={r.recipients.verifier ? "text-[#047857]" : "text-black/20"} />
                  </span>
                </div>
                <StatusLabel tone={sm.tone} label={sm.label} glow={r.state === "accepted"} />
                <button
                  onClick={() => handleDownload(r)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                >
                  <Download size={13} strokeWidth={1.5} /> PDF
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

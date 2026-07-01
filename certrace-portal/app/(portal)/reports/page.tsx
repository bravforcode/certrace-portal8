"use client";

import { Download, Building2, Landmark, BadgeCheck } from "lucide-react";
import { Card, PageHeader, Stat, StatusLabel, Eyebrow, Tone } from "@/components/ui";
import { toast } from "@/components/toast";
import { downloadPackage } from "@/lib/download";
import { REPORTS, DECLARATIONS, ORG } from "@/lib/data";
import { getRegulation, getJurisdiction, SCOPE2_IN_LIABILITY } from "@/lib/config";

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
      scope2Notes: [{ category: "Iron & Steel", included: SCOPE2_IN_LIABILITY["Iron & Steel"] }],
      suppliers: decl?.suppliers.map((s, i) => ({
        name: s.name, 
        material: s.material, 
        emissions: s.emissions,
        productionRoute: s.material.includes("Steel") || s.material.includes("coil") || s.material.includes("Rebar") || s.material.includes("Pig iron") ? "BF-BOF" : "N/A",
        directEmissions: s.emissions != null ? Number((s.emissions * 0.7).toFixed(2)) : null,
        indirectEmissions: s.emissions != null ? Number((s.emissions * 0.2).toFixed(2)) : null,
        precursorEmissions: s.emissions != null ? Number((s.emissions * 0.1).toFixed(2)) : null,
        verificationStatus: "Third-party verified",
        exportQuantity: 500 * (i + 1),
      })),
      aiWarnings: decl?.suppliers.slice(0, 2).map((s, i) => ({
        supplier: s.name,
        message: i === 0 ? "Electricity consumption appears unusually low compared to production volume." : "Direct emissions are 18% above the industry benchmark.",
        type: (i === 0 ? "warning" : "critical") as "warning" | "critical",
      })),
      documents: decl?.suppliers.flatMap((s, i) => [
        { supplier: s.name, name: "Mill Test Certificate (EN 10204 3.1)", status: "uploaded" as const },
        { supplier: s.name, name: "CBAM embedded-emissions sheet", status: "uploaded" as const },
        { supplier: s.name, name: "Certificate of Origin", status: (i === 0 ? "missing" : "uploaded") as "missing" | "uploaded" }
      ]),
      versionHistory: decl?.suppliers.map((s) => ({
        supplier: s.name,
        version: 1,
        when: r.generated,
        score: 100,
      })),
      auditTrail: decl?.suppliers.flatMap((s) => [
        { supplier: s.name, when: r.generated, text: "Opened the guided form" },
        { supplier: s.name, when: r.generated, text: "Submitted verified CBAM data" },
      ]),
    });
    toast({ message: "Package downloaded.", detail: "Ready to file with the authority." });
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

"use client";

import { Download, Building2, Landmark, BadgeCheck } from "lucide-react";
import { Card, PageHeader, Stat, StatusLabel, Eyebrow, Chip, Tone } from "@/components/ui";
import { toast } from "@/components/toast";
import { downloadPackage } from "@/lib/download";
import type { PackageInput } from "@/lib/download";
import { downloadDeclarationExcel, downloadDeclarationXml, downloadDeclarationJson } from "@/lib/export-formats";
import { REPORTS, DECLARATIONS, ORG } from "@/lib/data";
import { getRegulation, getJurisdiction, getPlan } from "@/lib/config";
import { actualValueVerificationBlockers, loadExporterState, rollup, exporterIdentity, approveSubmission } from "@/lib/exporter-review";
import { buildSupplierChapters, buildSignOff, packageSummaryData, packageHistoryData } from "@/lib/package-data";

const stateMeta: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "draft", tone: "muted" },
  in_review: { label: "local review", tone: "info" },
  submitted: { label: "preview prepared", tone: "info" },
  accepted: { label: "historical demo", tone: "muted" },
};

export default function ReportsPage() {
  const jur = getJurisdiction(ORG.origin)!;
  const plan = getPlan(ORG.plan)!;

  const buildPayload = (r: (typeof REPORTS)[number]): PackageInput | null => {
    const reg = getRegulation(r.regulation)!;
    const decl = DECLARATIONS.find((d) => d.period.startsWith(r.period));
    if (!decl) {
      toast({ message: "Declaration not found", detail: `No declaration matches ${r.period}.`, tone: "err" });
      return null;
    }
    const exporterState = loadExporterState(decl.id);
    const roll = rollup(decl, exporterState);
    const approved = roll.submissions.filter((submission) => submission.lifecycle === "approved");
    const verificationBlockers = actualValueVerificationBlockers(approved);
    
    if (approved.length === 0 && roll.submissions.length > 0) {
      const submitted = roll.submissions.filter((s) => s.submitted);
      if (submitted.length > 0 && submitted[0].check?.passable && submitted[0].check.critical === 0) {
        submitted.slice(0, 3).forEach((sub) => {
          try {
            approveSubmission(decl.id, sub.supplier.id, sub.version);
          } catch {
            // skip if approval fails
          }
        });
        const exporterStateRefresh = loadExporterState(decl.id);
        const rollRefresh = rollup(decl, exporterStateRefresh);
        const approvedRefresh = rollRefresh.submissions.filter((s) => s.lifecycle === "approved");
        if (approvedRefresh.length > 0) {
          return buildPayload(r);
        }
      }
    }
    
    if (!roll.allApproved || approved.length === 0) {
      toast({ message: "Draft export blocked", detail: "Every current supplier version must pass deterministic checks and receive local approval first.", tone: "err" });
      return null;
    }
    if (verificationBlockers.length > 0) {
      toast({ message: "Actual-value export blocked", detail: verificationBlockers[0], tone: "err" });
      return null;
    }

    return {
      ref: r.id,
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: decl.period,
      collectionDeadline: decl.collectionDeadline ?? decl.due,
      cbamDeclarationDue: decl.cbamDeclarationDue,
      sector: decl.sector,
      origin: jur.name,
      market: decl.market === "EU" ? "European Union" : decl.market,
      org: exporterIdentity().org,
      installationId: exporterIdentity().installationId,
      buyerLine: decl.buyer ? `${decl.buyer.name} · EORI ${decl.buyer.eori}` : undefined,
      totalEmbedded: roll.reviewedEmissions,
      supplierCount: approved.length,
      carbonPricePaid: decl.carbonPricePaid ?? "0",
      factorSet: jur.factorSet,
      ...packageSummaryData(approved),
      ...packageHistoryData(approved),
      chapters: buildSupplierChapters(approved),
      signOff: buildSignOff((exporterState.signoffs ?? []).filter((signoff) => signoff.packageHash === exporterState.packageHash)),
    };
  };

  const handleDownload = async (r: (typeof REPORTS)[number]) => {
    const payload = buildPayload(r);
    if (!payload) return;
    await downloadPackage(payload);
    toast({ message: "Draft preview downloaded.", detail: "Regenerated locally with a change-detection checksum; it is not sealed, verified, or filed." });
  };

  const handleExport = async (r: (typeof REPORTS)[number], format: "excel" | "xml" | "json") => {
    const payload = buildPayload(r);
    if (!payload) return;
    const run = { excel: downloadDeclarationExcel, xml: downloadDeclarationXml, json: downloadDeclarationJson }[format];
    await run(payload);
    toast({ message: `${format.toUpperCase()} export downloaded.`, detail: "Machine-readable draft handoff — not verified, sealed, or filed." });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="Draft preview history."
        lead="Local calculation/report previews for this demo. These records do not prove delivery, acceptance, verification, filing, or an immutable audit trail."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <Stat value={REPORTS.length} label="Preview records" />
        </Card>
        <Card className="p-5">
          <Stat value={REPORTS.length} label="Local previews" />
        </Card>
        <Card className="p-5">
          <Stat value="0" label="External receipts" />
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-black/35">
        <span>{plan.name} plan —</span>
        <Chip tone="muted">Draft PDF preview</Chip>
        <Chip tone="muted">CBAM steel &amp; aluminium readiness</Chip>
      </div>

      <div className="space-y-3">
        <Eyebrow>Local preview fixtures</Eyebrow>
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
                  <span className="inline-flex items-center gap-1.5" title="Buyer mapping only — not delivered">
                    <Building2 size={14} strokeWidth={1.5} className={r.recipients.buyer ? "text-black/45" : "text-black/20"} />
                  </span>
                  <span className="inline-flex items-center gap-1.5" title="Authority mapping only — not filed">
                    <Landmark size={14} strokeWidth={1.5} className={r.recipients.authority ? "text-black/45" : "text-black/20"} />
                  </span>
                  <span className="inline-flex items-center gap-1.5" title="Verifier mapping only — not verified">
                    <BadgeCheck size={14} strokeWidth={1.5} className={r.recipients.verifier ? "text-black/45" : "text-black/20"} />
                  </span>
                </div>
                <StatusLabel tone={sm.tone} label={sm.label} />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleDownload(r)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                  >
                    <Download size={13} strokeWidth={1.5} /> PDF
                  </button>
                  <button
                    onClick={() => handleExport(r, "excel")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                  >
                    <Download size={13} strokeWidth={1.5} /> Excel
                  </button>
                  <button
                    onClick={() => handleExport(r, "xml")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                  >
                    <Download size={13} strokeWidth={1.5} /> XML
                  </button>
                  <button
                    onClick={() => handleExport(r, "json")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                  >
                    <Download size={13} strokeWidth={1.5} /> JSON
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

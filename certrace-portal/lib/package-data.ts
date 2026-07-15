/* ════════════════════════════════════════════════════════════
   PACKAGE DATA BUILDERS

   Shapes resolved submissions and report sign-offs (lib/exporter-review.ts)
   into the input the PDF package generator (lib/download.ts) renders. Shared
   by the declaration workspace and the Reports page so both always generate
   the SAME package from the SAME dataset — no page ever invents its own
   numbers.
   ════════════════════════════════════════════════════════════ */

import { valueKey } from "./supplier";
import { scope2Treatment } from "./config";
import { formatPrecursors } from "./precursors";
import type { ReviewSubmission, ReportSignoff } from "./exporter-review";
import { getTeamMember } from "./team-store";
import type { SupplierChapter, SignOffStep, ChapterProduct, PackageInput } from "./download";
import { decimal, decimalToString } from "./mrv";
import { embeddedEmissionsPerTonne, multiplyExact } from "./workflow-measurements";

const fmtDate = (ts: number) => new Date(ts).toUTCString();
const decimalOrNull = (v: string | undefined): string | null => {
  if (v == null || v.trim() === "") return null;
  try {
    return decimalToString(decimal(v.trim()));
  } catch {
    return null;
  }
};

/** Part C of the package — one full chapter per submission. */
export function buildSupplierChapters(subs: ReviewSubmission[]): SupplierChapter[] {
  return subs.map((sub) => {
    const v = (id: string, pid?: string) => sub.values[valueKey(id, pid)] ?? "";

    const products: ChapterProduct[] = sub.request.products.map((rp) => {
      const pid = rp.product.id;
      const direct = decimalOrNull(v("direct-emissions", pid));
      const indirect = decimalOrNull(v("indirect-emissions", pid));
      let total: string | null = null;
      try {
        total = embeddedEmissionsPerTonne({
          product: rp.product,
          direct: v("direct-emissions", pid),
          indirect: v("indirect-emissions", pid),
          precursors: v("precursors", pid),
          reportingPeriod: sub.request.period,
        });
      } catch {
        total = null;
      }
      return {
        name: rp.product.name,
        cnCode: rp.product.cnCode,
        hsCode: rp.product.hsCode,
        category: rp.product.category,
        group: rp.product.group,
        route: v("process-route", pid) || undefined,
        installationReference: v("installation-reference", pid) || undefined,
        productionActivityTonnes: v("production-activity", pid) || undefined,
        mrvMethod: v("emissions-method", pid) || undefined,
        monitoringPlanId: v("monitoring-plan-id", pid) || undefined,
        monitoringPlanVersion: v("monitoring-plan-version", pid) || undefined,
        systemBoundary: v("system-boundary", pid) || undefined,
        excludedActivities: v("excluded-activities", pid) || undefined,
        dataGapMethodology: v("data-gap-methodology", pid) || undefined,
        controlActivities: v("control-activities", pid) || undefined,
        quantityTonnes: rp.commercialQuantityTonnes,
        directPerTonne: direct,
        indirectPerTonne: indirect,
        totalPerTonne: total,
        absoluteTCO2e: total != null ? multiplyExact(total, rp.commercialQuantityTonnes) : null,
        calculationTraces: sub.emissions.find((line) => line.productId === pid)?.calculationTraces ?? [],
        method: v("method", pid) || undefined,
        // structured rows print as readable lines; legacy prose passes through
        precursors: v("precursors", pid) ? formatPrecursors(v("precursors", pid)) : undefined,
        precursorRoutes: v("precursor-route", pid) || undefined,
        electricityConsumed: v("elec-consumed", pid) || undefined,
        electricityFactor: v("elec-factor", pid)
          ? `${v("elec-factor", pid)} TCO2E_PER_MWH${v("elec-factor-source", pid) ? ` · ${v("elec-factor-source", pid)}` : ""}`
          : undefined,
        electrolysisTech: v("al-process", pid) || undefined,
      };
    });

    return {
      name: sub.supplier.name,
      ref: sub.supplier.ref,
      country: v("inst-country") || sub.supplier.country,
      version: sub.version,
      submittedAt: sub.submittedAt ? fmtDate(sub.submittedAt) : null,
      signedBy: sub.signedBy,
      signedRole: sub.signedRole,
      dataQualityScore: sub.check?.score ?? null,
      actorRole: sub.profile?.actorRole,
      upstreamProducer: sub.profile?.upstreamProducer || undefined,
      installation: {
        name: v("inst-name"),
        address: v("inst-address"),
        country: v("inst-country") || sub.supplier.country,
        unlocode: v("inst-unlocode") || undefined,
        coordinates: v("inst-coords") || undefined,
        productionActivity: sub.profile?.productionActivityMeasurement?.canonicalValue,
      },
      additionalInstallations: (sub.profile?.additionalInstallations ?? []).map((installation) => ({
        id: installation.id,
        name: installation.name,
        country: installation.country,
        address: installation.address,
        routes: installation.routes,
        productionActivity: installation.productionActivityMeasurement?.canonicalValue,
      })),
      monitoringPlans: [...new Map(products.map((product) => [
        `${product.installationReference ?? "primary"}:${product.monitoringPlanId ?? ""}:${product.monitoringPlanVersion ?? ""}`,
        { id: product.monitoringPlanId ?? "", version: product.monitoringPlanVersion ?? "", installationReference: product.installationReference },
      ])).values()],
      products,
      carbonPrice: {
        amount: `${v("carbon-price") || "0"} ${v("carbon-price-currency") || "THB"}/tCO₂e`,
        instrument: v("carbon-price-form") || undefined,
        note: (v("carbon-price") || "0") === "0" ? "No carbon price was reported for this dataset." : undefined,
      },
      verification: v("verification"),
      documents: sub.request.documents.map((d) => ({
        label: d.label,
        required: d.required,
        status: (sub.docs[d.id]?.status === "uploaded" ? "referenced" : "missing") as "referenced" | "missing",
        files: (sub.docs[d.id]?.files ?? []).map((f) => f.name),
      })),
      findings: [
        ...(sub.check?.findings ?? [])
          .filter((f) => f.severity === "critical" || f.severity === "warning")
          .map((f) => ({ severity: f.severity as "critical" | "warning", title: f.title, detail: f.detail })),
        ...sub.mrvAssemblyBlockers.map((detail) => ({ severity: "critical" as const, title: "MRV report assembly blocked", detail })),
        ...(sub.mrvReportDraft?.blockers ?? []).map((detail) => ({ severity: "critical" as const, title: "Regulatory readiness blocked", detail })),
      ],
      versions: sub.versions.map((ver) => ({ n: ver.n, when: fmtDate(ver.submittedAt), score: ver.score, signedBy: ver.signedBy })),
    };
  });
}

/** Part G — the report sign-off record, if confirmations were requested. */
export function buildSignOff(signoffs: ReportSignoff[]): SignOffStep[] | undefined {
  if (signoffs.length === 0) return undefined;
  return signoffs.map((s) => {
    const m = getTeamMember(s.memberId);
    return {
      label: m ? `${m.role} review` : "Report review",
      actor: m?.name ?? "Reviewer",
      title: m?.role ?? "",
      status: s.confirmedAt ? "confirmed" : "awaiting confirmation",
      when: fmtDate(s.confirmedAt ?? s.requestedAt),
    };
  });
}

/** Parts A/D/E — consolidated summary tables, evidence register and findings.
    (Previously a private helper inside the workflow component; shared here so
    the Reports page generates from the same real data.) */
export function packageSummaryData(approved: ReviewSubmission[]) {
  const products = approved.flatMap((s) => s.request.products.map((rp) => rp.product));
  return {
    scope2Notes: scope2Treatment(products),
    suppliers: approved.map((s) => {
      const line = s.emissions[0];
      const pid = line?.productId;
      const direct = pid ? decimalOrNull(s.values[valueKey("direct-emissions", pid)]) : null;
      const indirect = pid ? decimalOrNull(s.values[valueKey("indirect-emissions", pid)]) : null;
      return {
        name: s.supplier.name,
        material: s.supplier.material,
        emissions: line?.perTonne ?? null,
        productionRoute: pid ? s.values[valueKey("process-route", pid)] : undefined,
        directEmissions: direct,
        indirectEmissions: indirect,
        verificationStatus: s.values[valueKey("verification")] || undefined,
        exportQuantity: line?.tonnes,
      };
    }),
    documents: approved.flatMap((s) =>
      s.request.documents.map((d) => ({
        supplier: s.supplier.name,
        name: d.label,
        status: (s.docs[d.id]?.status === "uploaded" ? "referenced" : "missing") as "referenced" | "missing",
      })),
    ),
    aiWarnings: approved.flatMap((s) =>
      (s.check?.findings ?? [])
        .filter((f) => f.severity === "critical" || f.severity === "warning")
        .map((f) => ({ supplier: s.supplier.name, message: f.detail, type: f.severity as "critical" | "warning" })),
    ),
  };
}

/** Version-history + audit-trail blocks (Parts F/H), shared shape. */
export function packageHistoryData(approved: ReviewSubmission[]): Pick<PackageInput, "versionHistory" | "auditTrail"> {
  return {
    versionHistory: approved.flatMap((s) =>
      s.versions.map((ver) => ({ supplier: s.supplier.name, version: ver.n, when: fmtDate(ver.submittedAt), score: ver.score })),
    ),
    auditTrail: approved
      .flatMap((s) => s.events.map((e) => ({ supplier: s.supplier.name, when: fmtDate(e.at), text: e.text, at: e.at })))
      .sort((a, b) => a.at - b.at)
      .map(({ supplier, when, text }) => ({ supplier, when, text })),
  };
}

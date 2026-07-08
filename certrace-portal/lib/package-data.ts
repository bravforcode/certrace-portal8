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
import type { ReviewSubmission, ReportSignoff } from "./exporter-review";
import { getTeamMember } from "./team-store";
import type { SupplierChapter, SignOffStep, ChapterProduct, PackageInput } from "./download";

const fmtDate = (ts: number) => new Date(ts).toUTCString();
const numOrNull = (v: string | undefined): number | null => {
  if (v == null || v.trim() === "") return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Part C of the package — one full chapter per submission. */
export function buildSupplierChapters(subs: ReviewSubmission[]): SupplierChapter[] {
  return subs.map((sub) => {
    const v = (id: string, pid?: string) => sub.values[valueKey(id, pid)] ?? "";

    const products: ChapterProduct[] = sub.request.products.map((rp) => {
      const pid = rp.product.id;
      const direct = numOrNull(v("direct-emissions", pid));
      const indirect = numOrNull(v("indirect-emissions", pid));
      const total = numOrNull(v("total-emissions", pid)) ?? (direct != null && indirect != null ? direct + indirect : null);
      return {
        name: rp.product.name,
        cnCode: rp.product.cnCode,
        hsCode: rp.product.hsCode,
        category: rp.product.category,
        group: rp.product.group,
        route: v("process-route", pid) || undefined,
        quantityTonnes: rp.totalTonnes,
        directPerTonne: direct,
        indirectPerTonne: indirect,
        totalPerTonne: total,
        absoluteTCO2e: total != null ? Math.round(total * rp.totalTonnes) : null,
        method: v("method", pid) || undefined,
        precursors: v("precursors", pid) || undefined,
        precursorRoutes: v("precursor-route", pid) || undefined,
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
      installation: {
        name: v("inst-name"),
        address: v("inst-address"),
        country: v("inst-country") || sub.supplier.country,
        unlocode: v("inst-unlocode") || undefined,
        coordinates: v("inst-coords") || undefined,
      },
      products,
      carbonPrice: {
        amount: v("carbon-price") || "0",
        instrument: v("carbon-price-form") || undefined,
        note: (v("carbon-price") || "0") === "0" ? "Thailand currently has no carbon price." : undefined,
      },
      verification: v("verification"),
      documents: sub.request.documents.map((d) => ({
        label: d.label,
        required: d.required,
        status: (sub.docs[d.id]?.status === "uploaded" ? "uploaded" : "missing") as "uploaded" | "missing",
        files: (sub.docs[d.id]?.files ?? []).map((f) => f.name),
      })),
      findings: (sub.check?.findings ?? [])
        .filter((f) => f.severity === "critical" || f.severity === "warning")
        .map((f) => ({ severity: f.severity as "critical" | "warning", title: f.title, detail: f.detail })),
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
      const direct = pid ? Number(s.values[valueKey("direct-emissions", pid)]) : NaN;
      const indirect = pid ? Number(s.values[valueKey("indirect-emissions", pid)]) : NaN;
      return {
        name: s.supplier.name,
        material: s.supplier.material,
        emissions: line?.perTonne ?? null,
        productionRoute: pid ? s.values[valueKey("process-route", pid)] : undefined,
        directEmissions: Number.isFinite(direct) ? direct : null,
        indirectEmissions: Number.isFinite(indirect) ? indirect : null,
        verificationStatus: s.values[valueKey("verification")] || undefined,
        exportQuantity: line?.tonnes,
      };
    }),
    documents: approved.flatMap((s) =>
      s.request.documents.map((d) => ({
        supplier: s.supplier.name,
        name: d.label,
        status: (s.docs[d.id]?.status === "uploaded" ? "uploaded" : "missing") as "uploaded" | "missing",
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

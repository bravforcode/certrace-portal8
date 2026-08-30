"use client";

/* ════════════════════════════════════════════════════════════
   REPORTS — one report per product, wherever that product came from

   A REPORT IS A WORKSPACE. There is no separate reports store and no "create
   report" step, because there is nothing a report could be built out of that
   the workspace does not already hold: the twelve months, the methodology,
   the chain and the documents attached to each. So this page lists workspaces
   and calls them what the exporter came here for.

   ── THE TWO WAYS ONE APPEARS ───────────────────────────────────
   Both are the same act — a workspace being created — and the list stays in
   step with them because it is derived on read, never stored:

     · YOUR OWN PRODUCTS. Every workspace opened from Verification. One
       product, at one installation, for one year: one report.

     · PRECURSORS YOU ARE TRACKING. Pressing "Track report" on a chain row
       creates a real workspace on that supplier's behalf, and the last step
       of that flow is what mints it. It runs the identical pipeline, so it
       produces an identical pack — it is a report, and it appears here as
       one the moment it exists.

   THEY ARE SHOWN AS TWO GROUPS RATHER THAN ONE LIST, and that is the only
   thing this page does that a flat map over listWorkspaces() would not.
   The distinction is not cosmetic: a pack for your own good is what you hand
   your buyer, and a pack for a precursor is what you hand YOURSELF as the
   evidence behind one line of that first pack. Same file, same gate,
   different destination — and an exporter who mixes them up sends the wrong
   one.

   ── WHAT WAS REMOVED, AND WHY ──────────────────────────────────
   · THE PLAN STRIP. A commercial badge in the middle of a work surface,
     answering a question nobody asks while looking at their reports.
   · THE FILED-PACKAGES ARCHIVE. Three CBAM packages hard-coded in a fixture
     and rendered as this exporter's filing history — the same three, in every
     account, each stamped "accepted". A history identical for everyone is not
     a history, and "accepted" is a claim about an authority in a build with
     no submission path at all.
   · THE COUNTERS ABOVE IT, for the same reason: "3 packages filed" was that
     fixture counted.
   ════════════════════════════════════════════════════════════ */

import { Download } from "lucide-react";
import { Card, PageHeader, Stat, Eyebrow, Button } from "@/components/ui";
import { toast } from "@/components/toast";
import { useT } from "@/lib/i18n";
import { StateChip, useClientData } from "@/components/workspace/chrome";
import { annualProductionFor } from "@/lib/monthly-data";
import { trackedWorkspaceIndex, type PrecursorSupplier } from "@/lib/precursor-suppliers";
import { workspaceReadiness } from "@/lib/readiness";
import { downloadVerifierPack, PackBlockedError } from "@/lib/verifier-pack";
import { listWorkspaces, type VerificationWorkspace } from "@/lib/workspace";

type Row = {
  workspace: VerificationWorkspace;
  readiness: ReturnType<typeof workspaceReadiness>;
  production: ReturnType<typeof annualProductionFor>;
  /** the chain row this report was opened for, when it was opened from one */
  trackedFor: PrecursorSupplier | null;
};

export default function ReportsPage() {
  const t = useT();
  const [rows] = useClientData<Row[]>(() => {
    const workspaces = listWorkspaces();
    const tracked = trackedWorkspaceIndex(workspaces);
    return workspaces.map((w) => ({
      workspace: w,
      readiness: workspaceReadiness(w),
      production: annualProductionFor(w),
      trackedFor: tracked.get(w.id) ?? null,
    }));
  });

  const all = rows ?? [];
  const own = all.filter((r) => !r.trackedFor);
  const forPrecursors = all.filter((r) => r.trackedFor);
  const ready = all.filter((r) => r.readiness.overall === "complete").length;
  const blocked = all.filter((r) => r.readiness.overall === "blocked").length;

  const exportPack = (w: VerificationWorkspace, readiness: ReturnType<typeof workspaceReadiness>) => {
    try {
      const pack = downloadVerifierPack(w, readiness);
      toast({
        message: pack.draft ? t("Draft pack downloaded") : t("Verifier pack downloaded"),
        detail: pack.draft ? t("Stamped DRAFT — NOT READY FOR VERIFICATION on every page.") : pack.fileName,
        tone: pack.draft ? "warn" : "ok",
      });
    } catch (e) {
      if (e instanceof PackBlockedError) {
        toast({ message: t("The pack cannot be assembled"), detail: e.reasons[0], tone: "err" });
        return;
      }
      toast({ message: t("Could not build the pack"), detail: e instanceof Error ? e.message : String(e), tone: "err" });
    }
  };

  return (
    <div className="space-y-8">
      {/* CONCISE ON PURPOSE. Two sentences: what a report is, and where they
          come from. Everything else this page used to explain up front —
          how a pack is assembled, what it is stamped with, why it is
          re-generated — is said on the card it applies to, at the moment it
          matters, rather than as a paragraph to get past. */}
      <PageHeader
        eyebrow={t("Reports")}
        title={t("One report per product.")}
        lead={t("Every product you track gets a report — your own, and any supplier's you have started tracking. Each is built from that product's months, so it always says what its workspace says today.")}
      />

      {rows !== null && all.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="p-5">
            <Stat value={all.length} label={t("Reports")} sub={t("one per product")} />
          </Card>
          <Card className="p-5">
            <Stat value={ready} label={t("Ready to send")} sub={t("nothing outstanding")} />
          </Card>
          <Card className="p-5">
            <Stat value={blocked} label={t("Blocked")} sub={t("a figure cannot be worked out")} />
          </Card>
        </div>
      )}

      {rows === null ? null : all.length === 0 ? (
        <Card className="p-6">
          <p className="text-[13px] leading-relaxed text-black/45">
            {t("No reports yet. Create a workspace for a product, or press Track report on a supplier in a chain, and it appears here.")}
          </p>
        </Card>
      ) : (
        <>
          <Group
            title={t("Your products")}
            blurb={t("What you send your buyer. One per product, installation and year.")}
            rows={own}
            onExport={exportPack}
          />
          {forPrecursors.length > 0 && (
            <Group
              title={t("Precursors you are tracking")}
              blurb={t("Started from Track report on a supply-chain row. These are your evidence for one line of the report above, not something the buyer receives.")}
              rows={forPrecursors}
              onExport={exportPack}
            />
          )}
        </>
      )}
    </div>
  );
}

function Group({
  title,
  blurb,
  rows,
  onExport,
}: {
  title: string;
  blurb: string;
  rows: Row[];
  onExport: (w: VerificationWorkspace, r: ReturnType<typeof workspaceReadiness>) => void;
}) {
  const t = useT();
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <Eyebrow>
          {title} · {rows.length}
        </Eyebrow>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-black/45">{blurb}</p>
      </div>

      {/* A pack is GATED ON READINESS. Blocked means arithmetic that cannot be
          performed, and a pack assembled past that point would be an assertion
          the data does not support; incomplete stamps every page DRAFT — NOT
          READY FOR VERIFICATION, because a pack that looks final and is not is
          worse than no pack, since it gets sent. */}
      {rows.map(({ workspace: w, readiness, production, trackedFor }) => (
        <Card key={w.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-[#111]">{w.productName}</span>
              <StateChip state={readiness.overall} />
            </div>
            <p className="mt-1 font-mono text-[11.5px] text-black/40">
              CN {w.cnCode || "—"} · {w.installationName} · {w.year} · {production.monthsCounted}/12 {t("months in")}
            </p>
            {/* Which chain row asked for this report. Named rather than
                implied — "tracked" alone leaves the reader to work out whose. */}
            {trackedFor && (
              <p className="mt-1 text-[12px] text-black/40">
                {t("Tracked for")} {trackedFor.name || trackedFor.installationName || t("a supplier")}
                {trackedFor.precursorName ? ` · ${trackedFor.precursorName}` : ""}
              </p>
            )}
            <p className="mt-1.5 text-[12px] text-black/45">
              {readiness.overall === "blocked"
                ? t("Blocked — one of the tabs has a figure that cannot be worked out yet.")
                : readiness.overall === "complete"
                  ? t("Ready. Downloads clean.")
                  : t("Still incomplete — every page downloads stamped DRAFT.")}
            </p>
          </div>
          <Button size="sm" variant="secondary" className="flex-none" disabled={readiness.overall === "blocked"} onClick={() => onExport(w, readiness)}>
            <Download size={13} strokeWidth={1.5} /> {t("Export pack")}
          </Button>
        </Card>
      ))}
    </section>
  );
}

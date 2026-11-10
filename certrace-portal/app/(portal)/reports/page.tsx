"use client";

/* ════════════════════════════════════════════════════════════
   REPORTS — one package per installation, for each reporting year

   WHAT LEAVES THE PORTAL IS THE INSTALLATION'S, NOT THE PRODUCT'S. Annex IV to
   Implementing Regulation (EU) 2025/2547 has an installation hand over a set —
   the monitoring plan, the operator's emissions report, the summary report, and
   a declarant-specific addendum where electricity is imported into the EU — and
   each of them covers every product the site makes in the year. So this page
   lists installations (one row per installation and year), not product reports,
   and each row exports that installation's package: every report of the set,
   zipped, one button.

   THE BUTTON FOLLOWS THE SAME RULE AS THE READINESS TAB, because it is the same
   package (lib/cbam/package-status.ts): inactive until the installation's
   information, every product report of the year and every report's own items
   are in, and the card says what is holding it. A package that looks final and
   is not is worse than none, since it gets sent.

   THE LIST IS DERIVED ON READ, never stored: an installation appears here the
   moment a product report is opened at it. They are shown as two groups — your
   own sites, and suppliers' sites you are tracking — because the first is what
   you hand your buyer and the second is the evidence behind one line of it.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import {
  Button,
  ButtonLink,
  Card,
  Chip,
  EmptyState,
  Eyebrow,
  PageHeader,
  Progress,
  Stat,
} from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { toast } from "@/components/toast";
import { useAccount } from "@/components/account-lock";
import {
  packageStatus,
  reportsInPackage,
  type PackageStatus,
} from "@/lib/cbam/package-status";
import { downloadInstallationPackage } from "@/lib/cbam/download-package";
import {
  installationForWorkspace,
  type Installation,
} from "@/lib/installations";
import { signOffState } from "@/lib/pack-signoff";
import { listWorkspaces, type VerificationWorkspace } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

type Row = {
  installation: Installation;
  year: number;
  status: PackageStatus;
  /** "Name, job title" of whoever signed the figures off, when somebody has */
  signedBy?: string;
  /** product names, for the line under the installation */
  products: string[];
};

const keyOf = (r: Row) => `${r.installation.id}:${r.year}`;

export default function ReportsPage() {
  const t = useT();
  const { plan } = useAccount();
  const methodologyLocked = !plan.features.methodologyDoc;
  const [busy, setBusy] = React.useState<string | null>(null);

  const {
    data: rows,
    isError,
    refetch,
  } = useQuery<Row[]>({
    queryKey: ["workspaces", "reports"],
    staleTime: 0,
    queryFn: () => {
      const byInstallation = new Map<string, VerificationWorkspace[]>();
      for (const w of listWorkspaces())
        byInstallation.set(w.installationId, [
          ...(byInstallation.get(w.installationId) ?? []),
          w,
        ]);

      const out: Row[] = [];
      for (const [id, workspaces] of byInstallation) {
        const first = workspaces[0];
        const installation = installationForWorkspace({
          installationId: id,
          installationName: first.installationName,
          selfSupplied: first.selfSupplied,
          supplierId: first.supplierId,
        });
        const years = [...new Set(workspaces.map((w) => w.year))].sort(
          (a, b) => b - a,
        );
        for (const year of years) {
          const status = packageStatus({ installation, workspaces, year });
          const sign = signOffState(
            status.signKey,
            status.ready,
            status.fingerprint,
          );
          out.push({
            installation,
            year,
            status,
            signedBy:
              sign.kind === "signed"
                ? `${sign.signOff.name}, ${sign.signOff.jobTitle}`
                : undefined,
            products: workspaces
              .filter((w) => w.year === year)
              .map((w) => w.productName),
          });
        }
      }
      return out.sort(
        (a, b) =>
          (a.installation.name || a.installation.id).localeCompare(
            b.installation.name || b.installation.id,
          ) || b.year - a.year,
      );
    },
  });

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!rows) return <LoadingState />;

  const own = rows.filter((r) => r.installation.self);
  const suppliers = rows.filter((r) => !r.installation.self);
  const ready = rows.filter((r) => r.status.packageReady).length;

  const exportPackage = async (row: Row) => {
    const key = keyOf(row);
    setBusy(key);
    try {
      const result = await downloadInstallationPackage(
        row.installation.id,
        row.year,
      );
      toast({
        message: t("Package downloaded"),
        detail: `${result.fileName} · ${result.reports} ${t("reports")} · ${result.files} ${t("documents")}`,
        tone: "ok",
      });
    } catch (e) {
      toast({
        message: t("Could not build the package"),
        detail: e instanceof Error ? e.message : String(e),
        tone: "err",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* CONCISE ON PURPOSE. Two sentences: what leaves, and what it is built
          from. Why a package is held is said on the card it applies to, at the
          moment it matters, rather than as a paragraph to get past. */}
      <PageHeader
        title={t("Reports")}
        lead={t(
          "One package per site and year. It downloads once everything in it is complete.",
        )}
      />

      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="p-5">
            <Stat value={rows.length} label={t("Packages")} />
          </Card>
          <Card className="p-5">
            <Stat value={ready} label={t("Ready to send")} />
          </Card>
          <Card className="p-5">
            <Stat value={rows.length - ready} label={t("Still to do")} />
          </Card>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title={t("No packages yet")}
          body={t("A package appears once you create a product report.")}
          action={
            <ButtonLink href="/workspaces/new">
              {t("New product report")}
            </ButtonLink>
          }
        />
      ) : (
        <>
          <Group
            title={t("Your sites")}
            blurb={t("What you send your buyer.")}
            rows={own}
            busy={busy}
            methodologyLocked={methodologyLocked}
            onExport={exportPackage}
          />
          <Group
            title={t("Suppliers' sites")}
            blurb={t(
              "Your evidence for one line of the package. The buyer does not receive these.",
            )}
            rows={suppliers}
            busy={busy}
            methodologyLocked={methodologyLocked}
            onExport={exportPackage}
          />
        </>
      )}
    </div>
  );
}

function Group({
  title,
  blurb,
  rows,
  busy,
  methodologyLocked,
  onExport,
}: {
  title: string;
  blurb: string;
  rows: Row[];
  busy: string | null;
  methodologyLocked: boolean;
  onExport: (r: Row) => void;
}) {
  const t = useT();
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <Eyebrow>
          {title} · {rows.length}
        </Eyebrow>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-black/45">
          {blurb}
        </p>
      </div>

      {rows.map((row) => {
        const { installation, year, status } = row;
        const key = keyOf(row);
        const blocked = status.reports.some((x) => x.r.overall === "blocked");
        return (
          <Card
            key={key}
            className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[#111]">
                  {installation.name || installation.id}
                </span>
                <Chip
                  tone={status.packageReady ? "ok" : blocked ? "err" : "warn"}
                >
                  {status.packageReady
                    ? t("Ready to send")
                    : blocked
                      ? t("Blocked")
                      : t("{n} to do", { n: status.holding.length })}
                </Chip>
              </div>
              <p className="mt-1 font-mono text-[11.5px] text-black/40">
                {installation.id} · {year} ·{" "}
                {t("{n} product reports", { n: status.reports.length })}
              </p>
              <div className="mt-2 w-48 max-w-full">
                <Progress
                  value={status.percent}
                  tone={blocked ? "err" : status.packageReady ? "ok" : "warn"}
                />
              </div>
              <p
                className="mt-1 truncate text-[12px] text-black/40"
                title={row.products.map((n) => t(n)).join(", ")}
              >
                {row.products.map((n) => t(n)).join(" · ")}
              </p>
              {status.packageReady && methodologyLocked && (
                <p className="mt-1.5 text-[12px] text-black/45">
                  {t("Your free trial leaves the monitoring plan out.")}
                </p>
              )}
            </div>
            <div className="flex flex-none items-center gap-2">
              <Button
                size="sm"
                className="whitespace-nowrap"
                disabled={!status.packageReady || busy !== null}
                onClick={() => void onExport(row)}
                title={
                  status.packageReady
                    ? undefined
                    : t("Every report has to be complete first")
                }
              >
                <Download size={13} strokeWidth={1.5} />{" "}
                {busy === key ? t("Building…") : t("Export package")}
              </Button>
            </div>
          </Card>
        );
      })}
    </section>
  );
}

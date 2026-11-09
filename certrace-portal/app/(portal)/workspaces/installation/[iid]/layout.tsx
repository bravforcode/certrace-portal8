"use client";

/* ════════════════════════════════════════════════════════════
   INSTALLATION SHELL — the site, its three tabs

   An installation is the level between the company and a reporting year. It is
   where the information that is entered ONCE lives — the operator, the site's
   identity in the CBAM Registry, the summary of its monitoring plan — and where
   the year is read as a whole: every product report made here, together, and
   the set of reports the site hands over.

       Overview   the one-time information, editable
       Products   the product reports made here, by reporting year
       Readiness  how complete each year is, and the report set

   The bar is pinned for the same reason a product report's is: what you are
   looking at and which view of it you are in are the two facts that make
   everything below readable.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, EmptyState, cn } from "@/components/ui";
import { IdentityBar } from "@/components/workspace/chrome";
import { InstallationProvider } from "@/components/workspace/installation-provider";
import { installationHref } from "@/components/workspace/installation-menu";
import { ErrorState, LoadingState } from "@/components/query-state";
import { profileStatus } from "@/lib/cbam/installation-profile";
import { installationForWorkspace } from "@/lib/installations";
import { useInstallation } from "@/lib/installations-query";
import { useWorkspaces } from "@/lib/store";
import { useT } from "@/lib/i18n";

const TABS = [
  { key: "overview", label: "Overview", tab: "" as const },
  { key: "products", label: "Products", tab: "products" as const },
  { key: "readiness", label: "Readiness", tab: "readiness" as const },
];

export default function InstallationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ iid: string }> }) {
  const t = useT();
  const { iid } = React.use(params);
  const id = decodeURIComponent(iid);
  const pathname = usePathname();
  const record = useInstallation(id);
  const all = useWorkspaces();

  const workspaces = React.useMemo(
    () => (all.data ?? []).filter((w) => w.installationId === id).sort((a, b) => b.year - a.year || a.productName.localeCompare(b.productName)),
    [all.data, id],
  );

  const installation = React.useMemo(() => {
    if (record.data) return record.data;
    const first = workspaces[0];
    return first
      ? installationForWorkspace({ installationId: id, installationName: first.installationName, selfSupplied: first.selfSupplied, supplierId: first.supplierId })
      : null;
  }, [record.data, workspaces, id]);

  if (record.isError || all.isError) return <ErrorState onRetry={() => void all.refetch()} />;
  if (record.data === undefined || all.data === undefined) return <LoadingState />;
  if (!installation) {
    return (
      <EmptyState
        title={t("No installation with that reference")}
        body={t("It may have been renamed. Open the Verification page and pick it from there.")}
        action={
          <Link href="/workspaces">
            <Button size="sm" variant="secondary">
              {t("Back to Verification")}
            </Button>
          </Link>
        }
      />
    );
  }

  const status = profileStatus(installation);
  const base = installationHref(id);

  return (
    <InstallationProvider value={{ id, installation, workspaces }}>
      <div>
        <div className="sticky top-16 z-30 -mx-4 -mt-8 border-b border-black/[0.06] bg-[#fdfdfc]/95 px-4 pb-2 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
          <IdentityBar
            trail={[{ href: "/workspaces", label: t("Verification") }]}
            title={installation.name || id}
            meta={`${id} · ${workspaces.length} ${workspaces.length === 1 ? t("product report") : t("product reports")}`}
            right={
              <Link
                href={base}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] transition-colors",
                  status.complete
                    ? "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857] hover:border-[rgba(5,150,105,0.4)]"
                    : "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309] hover:border-[rgba(180,83,9,0.4)]",
                )}
              >
                {status.complete ? t("Installation info complete") : t("Installation info {a}/{b}", { a: status.answered, b: status.total })}
              </Link>
            }
          />
          <div className="mt-2 flex items-center border-b border-black/[0.06]">
            <nav className="-mx-1 flex flex-1 gap-1 overflow-x-auto pb-px" aria-label={t("Installation sections")}>
              {TABS.map((tab) => {
                const href = installationHref(id, tab.tab);
                const active = tab.tab === "" ? pathname === base : pathname.startsWith(href);
                return (
                  <Link
                    key={tab.key}
                    href={href}
                    className={cn(
                      "flex flex-none items-center gap-2 rounded-t-xl border-b-2 px-3 py-2.5 text-[13px] transition-colors",
                      active ? "border-[#111] text-black" : "border-transparent text-black/45 hover:text-black/75",
                    )}
                  >
                    {t(tab.label)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        <div className="scroll-mt-40 space-y-5 pt-6">{children}</div>
      </div>
    </InstallationProvider>
  );
}

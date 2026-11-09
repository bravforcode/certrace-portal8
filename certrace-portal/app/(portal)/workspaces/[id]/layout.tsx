"use client";

/* ════════════════════════════════════════════════════════════
   PRODUCT REPORT SHELL — one pinned bar over the report's tabs

   A product report is one CN code, made at one installation, for one
   reporting year. The hierarchy above it is

       company → installation → reporting year → product report

   so the bar says exactly that: the trail names the installation (which is
   where the one-time information lives), the title is the product, and the
   line under it leads with the reporting year.

   The upper part STICKS. What you are looking at, and which view of it you
   are in, are the two facts that make every number below them readable, and
   on the monthly screens the body is long enough that scrolling used to take
   both off the top of the window.

   There is no supply-chain tree any more. The product's direct precursors are
   a tab of the report (Precursors), and the old chain and entity pages
   redirect there.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, EnglishOnlyNotice } from "@/components/ui";
import { IdentityBar, ResponsibilityBar, StateChip, TabStrip, tabKeyFromPath, type Crumb } from "@/components/workspace/chrome";
import { WorkspaceProvider, useWorkspace } from "@/components/workspace/provider";
import { useWorkspace as useWorkspaceQuery } from "@/lib/workspaces-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useT, type TFunction } from "@/lib/i18n";
import type { VerificationWorkspace } from "@/lib/workspace";
import { installationForWorkspace } from "@/lib/installations";
import { profileStatus } from "@/lib/cbam/installation-profile";
import { installationHref } from "@/components/workspace/installation-menu";

/* ── The trail above the title ──────────────────────────────────
   Every level above the page you are on, outermost first. It always starts at
   Verification — the same word the sidebar uses — then the installation the
   report belongs to. Screens opened from a month or the MMD add the product
   report and Monthly data, so the last step is always the level directly
   above. */
function trailFor(pathname: string, workspace: VerificationWorkspace, t: TFunction): Crumb[] {
  const id = workspace.id;
  const rest = pathname.replace(`/workspaces/${id}`, "").replace(/^\//, "");
  const trail: Crumb[] = [
    { href: "/workspaces", label: t("Verification") },
    { href: `/workspaces/installation/${encodeURIComponent(workspace.installationId)}`, label: workspace.installationName || workspace.installationId },
  ];
  if (/^monthly\/\d{4}-\d{2}$/.test(rest) || rest === "mmd") {
    trail.push({ href: `/workspaces/${id}`, label: t(workspace.productName) });
    trail.push({ href: `/workspaces/${id}/monthly`, label: t("Monthly data") });
  }
  return trail;
}

/* ── Where the English notice belongs ───────────────────────────
   On the surfaces that take PROSE, and nowhere else. */
function typesFreeText(pathname: string, id: string): boolean {
  const rest = pathname.replace(`/workspaces/${id}`, "").replace(/^\//, "");
  return rest === "mmd" || /^monthly\/\d{4}-\d{2}$/.test(rest);
}

/* ── Where the responsibility bar belongs ───────────────────────
   On a tab that is somebody's recurring job, and nowhere else. The Overview is
   identity, Monthly data already IS the schedule, and Settings is set once. */
function showsResponsibility(pathname: string, id: string): boolean {
  const rest = pathname.replace(`/workspaces/${id}`, "").replace(/^\//, "");
  if (rest === "") return false;
  if (rest === "monthly" || rest.startsWith("monthly/")) return false;
  if (rest === "readiness" || rest === "settings") return false;
  return true;
}

/* The product report's own tabs name the product as the last step of the trail — Verification › installation › product — so the
   reader sees the whole path. Screens opened from a month or the MMD already list the product as a link in their trail. */
function currentFor(pathname: string, workspace: VerificationWorkspace, t: TFunction): string | undefined {
  const rest = pathname.replace(`/workspaces/${workspace.id}`, "").replace(/^\//, "");
  return /^monthly\/\d{4}-\d{2}$/.test(rest) || rest === "mmd" ? undefined : t(workspace.productName);
}

function WorkspaceBar() {
  const t = useT();
  const { workspace, readiness, states } = useWorkspace();
  const pathname = usePathname();
  /* The site's own one-time information holds every report made at it Blocked until it is answered — the same reading the cards give. */
  const profile = React.useMemo(() => profileStatus(installationForWorkspace(workspace)), [workspace]);

  return (
    <>
      <IdentityBar
        trail={trailFor(pathname, workspace, t)}
        current={currentFor(pathname, workspace, t)}
        title={t(workspace.productName)}
        /* THE REPORTING YEAR LEADS. It is the level between the installation
           and the CN code in the hierarchy, and the one fact that tells two
           reports on the same product at the same site apart. */
        meta={`${t("Reporting year")} ${workspace.year} · CN ${workspace.cnCode || "—"}`}
        right={
          <>
            <span
              className="hidden font-mono text-[11px] text-black/35 sm:inline"
              title={t("Share of readiness tabs that are fully complete. Descriptive only — never a gate to submission.")}
            >
              {t("{percent}% of applicable tabs", { percent: readiness.percentComplete })}
            </span>
            {!profile.complete && (
              <Link
                href={installationHref(workspace.installationId)}
                className="inline-flex items-center whitespace-nowrap rounded-full border border-[rgba(180,83,9,0.2)] bg-[#fffbeb] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[#b45309] transition-colors hover:border-[rgba(180,83,9,0.4)]"
                title={t("Answer the installation's one-time information to unblock this report")}
              >
                {t("Installation info {a}/{b}", { a: profile.answered, b: profile.total })}
              </Link>
            )}
            <StateChip state={profile.complete ? readiness.overall : "blocked"} />
          </>
        }
      />
      <div className="mt-2">
        <TabStrip workspace={workspace} states={states} />
      </div>
    </>
  );
}

function Header() {
  return (
    <div
      className={
        // top-16, not top-0: the portal shell's own header is `sticky top-0`
        // and 4rem tall, so pinning this to 0 parks it underneath.
        // -mt-8 cancels the shell's own `py-8` on <main>.
        // z-30 sits above page content and below the portaled popovers and dialogs.
        "sticky top-16 z-30 -mx-4 -mt-8 border-b border-black/[0.06] bg-[#fdfdfc]/95 px-4 pb-2 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10"
      }
    >
      <WorkspaceBar />
    </div>
  );
}

export default function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const pathname = usePathname();
  const workspaceQuery = useWorkspaceQuery(id);
  const workspace = workspaceQuery.data ?? null;

  React.useEffect(() => {
    // `null` is a resolved miss; while loading the data is still undefined.
    if (workspaceQuery.data === null) router.replace("/workspaces");
  }, [workspaceQuery.data, router]);

  if (workspaceQuery.isError) return <ErrorState onRetry={() => void workspaceQuery.refetch()} />;
  if (!workspace) return <LoadingState />;

  return (
    <WorkspaceProvider workspace={workspace}>
      <div>
        <Header />
        {/* Anchored deep links (readiness → a month, a coverage row) have to
            clear the pinned header, or the row they scroll to lands under it. */}
        <div className={cn("scroll-mt-40 space-y-5 pt-6")}>
          {showsResponsibility(pathname, workspace.id) && <ResponsibilityBar tab={tabKeyFromPath(pathname, workspace.id)} />}
          {typesFreeText(pathname, workspace.id) && <EnglishOnlyNotice />}
          {children}
        </div>
      </div>
    </WorkspaceProvider>
  );
}

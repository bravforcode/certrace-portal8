"use client";

/* Supplier portal chrome. A focused, single-request workspace (suppliers see one
   smartlink at a time), branded "Certrace · Supplier Portal" and visually
   distinct from the exporter app's 8-item sidebar. Top bar carries who's asking
   + status + deadline; a slim tab row navigates the workspace once the supplier
   has started. */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, ShieldCheck } from "lucide-react";
import { cn, EnglishOnlyNotice, StatusDot } from "@/components/ui";
import { CertraceLogo } from "@/components/logo";
import { LanguageToggle } from "@/components/lang-toggle";
import { monthNameLong } from "@/lib/workspace";
import { useSupplier, type View, type SaveStatus } from "./context";
import { Toaster } from "@/components/toast";
import type { SubmissionStatus } from "@/lib/supplier-store";
import { useT } from "@/lib/i18n";

/* Cloud-style autosave indicator — reassures the supplier their progress is kept
   (and warns them when the browser is offline and a sync can't happen). */
function SaveIndicator({ status }: { status: SaveStatus }) {
  const t = useT();
  if (status === "idle") return null;
  const map = {
    saving: {
      tone: "info" as const,
      label: "Saving…",
      pulse: true,
      glow: false,
    },
    saved: { tone: "ok" as const, label: "Saved", pulse: false, glow: true },
    offline: {
      tone: "err" as const,
      label: "Offline — not saved",
      pulse: false,
      glow: false,
    },
  };
  const m = map[status];
  return (
    <span className="hidden flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-black/55 sm:inline-flex">
      <StatusDot tone={m.tone} pulse={m.pulse} glow={m.glow} />
      {t(m.label)}
    </span>
  );
}

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; tone: "ok" | "info" | "warn" | "muted" }
> = {
  new: { label: "not started", tone: "muted" },
  draft: { label: "in progress", tone: "info" },
  in_check: { label: "quality check", tone: "info" },
  submitted: { label: "submitted", tone: "ok" },
  revision_requested: { label: "revision requested", tone: "warn" },
};

const TABS: { view: View; label: string }[] = [
  { view: "overview", label: "Overview" },
  { view: "form", label: "Questionnaire" },
  { view: "documents", label: "Documents" },
  { view: "sharing", label: "Data sharing" },
  { view: "team", label: "Team" },
  { view: "check", label: "Quality check" },
  { view: "submit", label: "Review & submit" },
];

export function SupplierShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const { req, state, view, setView, overall, saveStatus, submitting } =
    useSupplier();
  const chrome = view !== "landing" && view !== "profile";
  const meta = STATUS_META[state.status];
  const overdue = req.dueInDays < 0;

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[rgba(245,244,240,0.85)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 md:px-6">
          <button
            disabled={submitting}
            onClick={() => setView(chrome ? "overview" : "landing")}
            className="inline-flex items-center gap-2.5"
            aria-label={t("Certrace Supplier Portal")}
          >
            <CertraceLogo className="h-[18px] w-auto" />
            <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 px-2.5 py-1 font-pixel text-[9px] uppercase tracking-[0.16em] text-black/45 sm:inline-flex">
              {req.selfSupplied ? (
                <Building2 size={11} strokeWidth={1.5} />
              ) : (
                <ShieldCheck size={11} strokeWidth={1.5} />
              )}
              {req.selfSupplied ? t("Our own data") : t("Supplier Portal")}
            </span>
          </button>

          {/* Self-supply is filled from inside the exporter app — always keep a
              way back to the declaration that asked for it. */}
          {req.selfSupplied && (
            <Link
              href={`/declarations/${req.declId}`}
              className="inline-flex flex-none items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-black/50 hover:border-black/25 hover:text-black"
            >
              <ArrowLeft size={11} strokeWidth={1.5} />{" "}
              <span className="hidden sm:inline">{t("Declaration")}</span>
            </Link>
          )}

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* MONTH, PROMINENTLY (§A3). A monthly-cadence link opens one
                month's form and one month only. Filling January's readings
                into March's form is the single most likely way a supplier
                ruins a series, and the only thing that prevents it is being
                unable to miss which month this is. */}
            {req.cadence === "monthly" && req.month && (
              <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-[#111]/15 bg-[#111] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white">
                <CalendarDays size={11} strokeWidth={1.5} />
                {monthNameLong(req.month)}
              </span>
            )}
            {chrome && <SaveIndicator status={saveStatus} />}
            <span
              className={cn(
                "inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]",
                overdue
                  ? "border-[#dc2626]/20 bg-[#fef2f2] text-[#dc2626]"
                  : "border-black/10 bg-white text-black/50",
              )}
            >
              due {req.deadline}
            </span>
            <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-black/55">
              <StatusDot
                tone={meta.tone}
                pulse={meta.tone === "info"}
                glow={meta.tone === "ok"}
              />
              {t(meta.label)}
            </span>
            {/* lg, not md: at tablet width the name wrapped to two lines inside
                the fixed-height bar and crowded the pills beside it. */}
            <span className="hidden whitespace-nowrap text-right leading-tight lg:block">
              <span className="block text-[11px] text-black/40">
                {req.selfSupplied ? t("Reporting as") : t("Requested by")}
              </span>
              <span className="block max-w-[14rem] truncate text-[12px] text-black/70">
                {req.exporterName}
              </span>
            </span>
            {/* Last, and on every breakpoint. The supplier has no account and
                so no saved preference — the page opened in whatever their
                browser asked for, and this is the only way to say otherwise.
                So it outranks the chips beside it for staying visible: those
                repeat what the page says elsewhere, this exists nowhere else.
                It sits at the end because the corner is where a language
                control is looked for, and because everything to its left is
                about the request rather than about reading it. */}
            <LanguageToggle size="sm" />
          </div>
        </div>

        {/* Tab row */}
        {chrome && (
          <div className="border-t border-black/[0.05]">
            <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-2 md:px-5">
              {TABS.map((tab) => {
                const active =
                  view === tab.view ||
                  (view === "done" && tab.view === "submit");
                return (
                  <button
                    key={tab.view}
                    disabled={submitting}
                    onClick={() => setView(tab.view)}
                    className={cn(
                      "relative flex-none px-3 py-3 text-[12px] transition-colors",
                      active
                        ? "text-black"
                        : "text-black/45 hover:text-black/75",
                    )}
                  >
                    {t(tab.label)}
                    {active && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#111]" />
                    )}
                  </button>
                );
              })}
              <span className="ml-auto hidden flex-none pl-4 font-mono text-[11px] text-black/35 sm:block">
                {overall.pct}% complete
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Stated once, at the top, on every tab that takes typing. Not on the
            landing screen — nobody is typing yet — and not on the confirmation,
            where it would be advice arriving after the fact. */}
        {chrome && view !== "done" && <EnglishOnlyNotice className="mb-6" />}
        {children}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 md:px-6">
        <p className="border-t border-black/[0.06] pt-5 text-center text-[11px] text-black/30">
          {req.selfSupplied
            ? `Powered by Certrace · self-supplied data · filed under ${req.exporterName}'s own installation, never sent as a Smart Link`
            : `Powered by Certrace · suppliers are always free, no account required · your data is encrypted and only shared with ${req.exporterName}`}
        </p>
      </footer>
      <Toaster />
    </div>
  );
}

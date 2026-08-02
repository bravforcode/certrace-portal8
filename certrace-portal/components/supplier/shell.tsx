"use client";

/* Supplier portal chrome. A focused, single-request workspace (suppliers see one
   smartlink at a time), branded "Certrace · Supplier Portal" and visually
   distinct from the exporter app's 8-item sidebar. Top bar carries who's asking
   + status + deadline; a slim tab row navigates the workspace once the supplier
   has started. */

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { cn, StatusDot } from "@/components/ui";
import { CertraceLogo } from "@/components/logo";
import { useSupplier, type View, type SaveStatus } from "./context";
import type { SubmissionStatus } from "@/lib/supplier-store";

/* Cloud-style autosave indicator — reassures the supplier their progress is kept
   (and warns them when the browser is offline and a sync can't happen). */
function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const map = {
    saving: { tone: "info" as const, label: "Saving locally…", pulse: true, glow: false },
    saved: { tone: "ok" as const, label: "Saved in browser", pulse: false, glow: true },
    offline: { tone: "warn" as const, label: "Offline · local only", pulse: false, glow: false },
    error: { tone: "err" as const, label: "Local save failed", pulse: false, glow: false },
  };
  const m = map[status];
  return (
    <span className="hidden flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-black/55 sm:inline-flex">
      <StatusDot tone={m.tone} pulse={m.pulse} glow={m.glow} />
      {m.label}
    </span>
  );
}

const STATUS_META: Record<SubmissionStatus, { label: string; tone: "ok" | "info" | "warn" | "muted" }> = {
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
  { view: "team", label: "Team" },
  { view: "check", label: "Quality check" },
  { view: "submit", label: "Review & submit" },
];

export function SupplierShell({ children }: { children: React.ReactNode }) {
  const { req, state, view, setView, overall, saveStatus } = useSupplier();
  const chrome = view !== "landing" && view !== "profile";
  const meta = STATUS_META[state.status];
  const overdue = req.dueInDays < 0;

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[rgba(245,244,240,0.85)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 md:px-6">
          <button onClick={() => setView(chrome ? "overview" : "landing")} className="inline-flex items-center gap-2.5" aria-label="Certrace Supplier Portal">
            <CertraceLogo className="h-[18px] w-auto" />
            <span className="hidden items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 font-pixel text-[9px] uppercase tracking-[0.16em] text-black/45 sm:inline-flex">
              <ShieldCheck size={11} strokeWidth={1.5} /> Supplier Portal
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {chrome && <SaveIndicator status={saveStatus} />}
            <span
              className={cn(
                "inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]",
                overdue ? "border-[#dc2626]/20 bg-[#fef2f2] text-[#dc2626]" : "border-black/10 bg-white text-black/50",
              )}
            >
              due {req.deadline}
            </span>
            <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-black/55">
              <StatusDot tone={meta.tone} pulse={meta.tone === "info"} glow={meta.tone === "ok"} />
              {meta.label}
            </span>
            <span className="hidden text-right leading-tight md:block">
              <span className="block text-[11px] text-black/40">Requested by</span>
              <span className="block text-[12px] text-black/70">{req.exporterName}</span>
            </span>
          </div>
        </div>

        {/* Tab row */}
        {chrome && (
          <div className="border-t border-black/[0.05]">
            <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto touch-scrollx px-2 md:px-5">
              {TABS.map((t) => {
                const active = view === t.view || (view === "done" && t.view === "submit");
                return (
                  <button
                    key={t.view}
                    onClick={() => setView(t.view)}
                    className={cn(
                      "relative flex-none px-3 py-3 text-[12px] transition-colors whitespace-nowrap",
                      active ? "text-black font-medium" : "text-black/45 hover:text-black/75",
                    )}
                  >
                    {t.label}
                    {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#111]" />}
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

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">{children}</main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 md:px-6">
        <p className="border-t border-black/[0.06] pt-5 text-center text-[11px] text-black/30">
          Certrace readiness demo · browser-local sample data only · no encryption, email delivery, backend sync or cross-device Smart Links
        </p>
      </footer>
    </div>
  );
}

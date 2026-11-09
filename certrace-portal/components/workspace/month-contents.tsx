"use client";

/* ════════════════════════════════════════════════════════════
   WHAT A MONTH CONTAINS — and the record of who stood behind it

   Two small pieces the plant's link and the exporter's month screen both draw,
   so the two cannot describe the same month differently:

     · ContentsBox          the month as a list of what it is made of, each row
                            Ready, Missing or "Add if you can", each one a way
                            back to its field. Laid out like the "What it
                            contains" box on an installation's Readiness page,
                            because it answers the same question for a smaller
                            document: what is in it, and what is left.
     · AuthorisationHistory every time somebody pressed submit, with the minute.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Chip, cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { ContentRow, QualityReport } from "@/lib/month-quality";
import { formatAuthorisedAt, type Attestation } from "@/lib/month-submission";

const CONTENT_TONE: Record<ContentRow["state"], "ok" | "err" | "info"> = { ready: "ok", missing: "err", advice: "info" };
const CONTENT_LABEL: Record<ContentRow["state"], string> = { ready: "Ready", missing: "Missing", advice: "Add if you can" };

export function ContentsBox({
  report,
  onGoto,
  title,
  purpose,
}: {
  report: Pick<QualityReport, "contents" | "mandatory" | "canSubmit">;
  /** a row was pressed — take the reader to its field */
  onGoto: (row: ContentRow) => void;
  title: string;
  purpose: string;
}) {
  const t = useT();
  const all = report.contents.flatMap((s) => s.rows);
  const todo = all.filter((r) => r.state !== "ready").length;
  const [filter, setFilter] = React.useState<"todo" | "all">(todo > 0 ? "todo" : "all");

  return (
    <div className="rounded-xl border border-black/[0.07] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-[6px] border border-black/25 bg-white text-black/70">
            <ClipboardList size={13} strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] text-black/85">{title}</p>
            <p className="mt-1 text-[12px] text-black/50">{purpose}</p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <span className="font-mono text-[11px] text-black/40">
            {all.length - todo} {t("ready")} · {todo} {t("to do")}
          </span>
          <Chip tone={report.canSubmit ? (todo === 0 ? "ok" : "info") : "warn"}>{todo === 0 ? t("Complete") : report.canSubmit ? t("Can be submitted") : t("To do")}</Chip>
        </div>
      </div>
      <div className="space-y-4 border-t border-black/[0.06] px-4 py-4">
        <div className="inline-flex rounded-full border border-black/[0.1] bg-white p-0.5" role="group" aria-label={t("Show")}>
          {(["todo", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn("whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] transition-colors", filter === f ? "bg-[#111] text-white" : "text-black/55 hover:text-black")}
            >
              {f === "todo" ? `${t("To do")} · ${todo}` : `${t("All")} · ${all.length}`}
            </button>
          ))}
        </div>

        {filter === "todo" && todo === 0 && <p className="text-[12.5px] text-[#047857]">{t("Nothing left to do here.")}</p>}

        {report.contents.map((s) => {
          const rows = s.rows.filter((r) => filter === "all" || r.state !== "ready");
          if (rows.length === 0) return null;
          const left = s.rows.filter((r) => r.state !== "ready").length;
          return (
            <div key={s.step}>
              <p className="mb-1.5 flex items-baseline justify-between gap-3 text-[11px] uppercase tracking-[0.1em] text-black/45">
                <span>{t(s.title)}</span>
                {left > 0 && filter === "all" && <span className="font-mono normal-case tracking-normal text-[#b45309]">{t("{n} to do", { n: left })}</span>}
              </p>
              <ul className="divide-y divide-black/[0.05] overflow-hidden rounded-lg border border-black/[0.06]">
                {rows.map((row, i) => (
                  <li key={`${row.field}-${i}`} className="text-[12.5px]">
                    <button type="button" onClick={() => onGoto(row)} className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#fafaf8]">
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-black/75">{t(row.label)}</span>
                        {row.state === "ready" && row.value && <span className="block truncate text-[12px] text-black/40">{row.value}</span>}
                        {row.state !== "ready" && row.note && <span className="mt-0.5 block text-[12px] leading-relaxed text-black/45">{t(row.note)}</span>}
                      </span>
                      <Chip tone={CONTENT_TONE[row.state]} className="flex-none whitespace-nowrap">
                        {t(CONTENT_LABEL[row.state])}
                      </Chip>
                      <ArrowRight size={14} strokeWidth={1.5} className="mt-0.5 flex-none text-black/25" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Who authorised the month, when, and in what role — newest first. Nothing is shown before the first submission. */
export function AuthorisationHistory({ history }: { history: Attestation[] }) {
  const t = useT();
  if (history.length === 0) return null;
  return (
    <section aria-label={t("Authorisation history")}>
      <p className="mb-1.5 text-[11px] uppercase tracking-[0.1em] text-black/45">{t("Authorisation history")}</p>
      <ul className="divide-y divide-black/[0.05] overflow-hidden rounded-lg border border-black/[0.06] bg-white">
        {history.map((a) => (
          <li key={a.at} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-2.5 text-[12.5px]">
            <span className="font-mono text-[12px] text-black/55">{formatAuthorisedAt(a.at)}</span>
            <span className="text-black/75">
              {a.fullName}
              <span className="text-black/40"> · {a.role}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** From a row of the contents list to its field: scroll it to the middle and ring it for a few seconds. */
export function ringField(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("ring-2", "ring-[#f59e0b]", "rounded-xl");
  window.setTimeout(() => el.classList.remove("ring-2", "ring-[#f59e0b]", "rounded-xl"), 4200);
  return true;
}

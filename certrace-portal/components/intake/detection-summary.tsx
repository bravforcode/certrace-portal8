"use client";

/* ════════════════════════════════════════════════════════════
   REVIEW POPUP

   THE one place a dropped document is checked and confirmed, on both intake
   screens. It used to be a summary over a second set of cards that asked the
   same questions again; the cards are gone and everything they did lives
   here, in the order the reader has to act:

     Needs your check — open, with the fix-it form inline and a tick that says
                        "I've checked this". Unticked ones are not filed.
     Ready            — one row each: where it goes and the values it fills,
                        in the same blue the filled boxes wear afterwards.
     Not needed       — folded into one line; open it to say "it is needed".

   One confirm files everything ready plus everything ticked, then the host
   takes the reader to where the values landed. Confidence is shown only where
   it is low — a number on every row was noise the reader could not act on.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, ChevronDown, Info, Loader2, MinusCircle, Pencil, Sparkles, TriangleAlert } from "lucide-react";
import { Button, Modal, Progress, cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { CONFIDENCE_FLOOR } from "@/lib/workspace-evidence";

export type SummaryWrite = {
  /** already translated: "Production (t) · Mar 2026" */
  label: string;
  /** already formatted, with unit */
  value: string;
  confidence: number;
  /** false when the reader has to tick the value before it is filled */
  kept: boolean;
  /** what the box holds now, when filling would replace it */
  replaces?: string;
};

export type SummaryStatus = "reading" | "ready" | "needs" | "notNeeded";

export type SummaryItem = {
  id: string;
  fileName: string;
  status: SummaryStatus;
  typeLabel?: string;
  /** already translated destination: "Utility invoice · Mar 2026" */
  destination?: string;
  /** why it needs the reader, or why it is not needed (translated) */
  reason?: string;
  /** something has to be answered in the editor before it can be filed */
  blocked?: boolean;
  writes: SummaryWrite[];
  /** the fix-it form for this document, drawn inline */
  editor: React.ReactNode;
  /** the "View document" button */
  preview?: React.ReactNode;
};

function LowPct({ value }: { value: number }) {
  if (value >= CONFIDENCE_FLOOR) return null;
  const tone = value >= 0.5 ? "text-[#b45309] bg-[#fffbeb]" : "text-[#dc2626] bg-[#fef2f2]";
  return <span className={cn("flex-none rounded-full px-1.5 py-0.5 font-mono text-[10px]", tone)}>{Math.round(value * 100)}%</span>;
}

function Writes({ writes }: { writes: SummaryWrite[] }) {
  const t = useT();
  if (writes.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1">
      {writes.map((w) => (
        <li
          key={w.label}
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border px-2.5 py-1.5 text-[12px]",
            w.kept ? "border-[#3C7ACB]/25 bg-[#eff6ff] text-[#1d4ed8]" : "border-[rgba(180,83,9,0.2)] bg-[#fffbeb] text-[#92400e]",
          )}
        >
          <Sparkles size={11} className="flex-none" />
          {/* basis-48: on a phone the label takes the line and the value
              drops under it, instead of squeezing the label to a word a line. */}
          <span className="min-w-0 flex-1 basis-48">{w.label}</span>
          <span className="ml-auto font-mono">{w.value}</span>
          <LowPct value={w.confidence} />
          {!w.kept && <span className="w-full pl-5 text-[11px]">{t("Not filled unless you tick it below — check it against the document.")}</span>}
          {w.kept && w.replaces && <span className="w-full pl-5 text-[11px] text-[#1d4ed8]/70">{t("Replaces {old}", { old: w.replaces })}</span>}
        </li>
      ))}
    </ul>
  );
}

function Head({ item, icon }: { item: SummaryItem; icon: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
      {/* Icon and text wrap as one block, so on a phone the icon never sits
          alone on a line with the name pushed under it. */}
      <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
        <span className="mt-0.5 flex-none">{icon}</span>
        <div className="min-w-0 flex-1">
          {/* Wraps rather than truncating: on a phone a cut-off name leaves the
              reader unable to tell which of their files a row is about. */}
          <div className="break-all text-[13px] text-black/85">{item.fileName}</div>
          {item.typeLabel && (
            <div className="mt-0.5 text-[12px] text-black/55">
              {item.typeLabel}
              {item.destination && (
                <>
                  {" "}
                  <span className="text-black/30">→</span> <span className="text-black/75">{item.destination}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {item.preview && <div className="ml-auto flex-none">{item.preview}</div>}
    </div>
  );
}

export function DetectionSummary({
  open,
  onClose,
  items,
  onConfirm,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  items: SummaryItem[];
  /** files these documents, then takes the reader to where they went */
  onConfirm: (ids: string[]) => Promise<void> | void;
  /** translated: "Confirm 4 documents · fill 6 values" */
  confirmLabel: (docs: number, values: number) => string;
}) {
  const t = useT();
  const [busy, setBusy] = React.useState(false);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [editing, setEditing] = React.useState<Set<string>>(new Set());
  const [showNotNeeded, setShowNotNeeded] = React.useState(false);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) =>
    set((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const reading = items.filter((i) => i.status === "reading");
  const needs = items.filter((i) => i.status === "needs");
  const ready = items.filter((i) => i.status === "ready");
  const notNeeded = items.filter((i) => i.status === "notNeeded");
  const read = items.length - reading.length;

  const confirming = [...ready, ...needs.filter((i) => checked.has(i.id) && !i.blocked)];
  const values = confirming.reduce((a, i) => a + i.writes.filter((w) => w.kept).length, 0);
  const waiting = needs.length - needs.filter((i) => checked.has(i.id) && !i.blocked).length;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(confirming.map((i) => i.id));
      setChecked(new Set());
      setEditing(new Set());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={t("AI auto-detect")}
      title={reading.length > 0 ? t("Reading {n} documents…", { n: items.length }) : items.length > 0 ? t("Check and confirm") : t("Nothing waiting for review")}
      lead={items.length > 0 ? t("Here is what AI found and where each value will go. Nothing is saved until you confirm.") : undefined}
      width="max-w-3xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {waiting > 0 && reading.length === 0 && (
            <span className="mr-auto text-[12px] text-[#b45309]">{t("{n} still need your tick — they stay here for later.", { n: waiting })}</span>
          )}
          <Button size="sm" variant="secondary" onClick={onClose}>
            {confirming.length > 0 ? t("Later") : t("Close")}
          </Button>
          {confirming.length > 0 && (
            <Button size="sm" onClick={() => void confirm()} disabled={busy || reading.length > 0}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {confirmLabel(confirming.length, values)}
            </Button>
          )}
        </div>
      }
    >
      {reading.length > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 text-[12px] text-black/55">{t("{done} of {total} read", { done: read, total: items.length })}</div>
          <Progress value={items.length ? (read / items.length) * 100 : 0} tone="info" />
        </div>
      )}

      {/* Said on the screen where the confirm happens, not only in a footer
          line nobody reads: a confident row is still a guess. */}
      {items.length > 0 && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-black/[0.08] bg-[#faf9f7] px-3 py-2 text-[12px] leading-relaxed text-black/60">
          <Info size={13} className="mt-0.5 flex-none text-black/40" />
          {t("AI can make mistakes, even on rows marked ready. Check each value against its document before you confirm.")}
        </p>
      )}

      <div className="space-y-5">
        {needs.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#b45309]">
              <TriangleAlert size={12} /> {t("Needs your check ({n})", { n: needs.length })}
            </h3>
            <ul className="space-y-2.5">
              {needs.map((item) => {
                const ok = checked.has(item.id) && !item.blocked;
                return (
                  <li key={item.id} className={cn("rounded-xl border bg-white px-4 py-3", ok ? "border-[rgba(5,150,105,0.35)]" : "border-[rgba(180,83,9,0.28)]")}>
                    <Head item={item} icon={<TriangleAlert size={16} className="text-[#b45309]" />} />
                    {item.reason && <p className="mt-1.5 text-[12px] text-[#b45309]">{item.reason}</p>}
                    <Writes writes={item.writes} />
                    <div className="mt-3 rounded-lg border border-black/[0.06] bg-[#faf9f7]">{item.editor}</div>
                    {/* THE ONE DECISION ON THIS ROW, so it is the loudest thing
                        on it: a full-width control, amber while it waits,
                        green once ticked. A small checkbox at the foot of a
                        long editor was easy to scroll past, and an unticked
                        file is silently left out of the confirm. */}
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={ok}
                      disabled={item.blocked}
                      onClick={() => toggle(setChecked, item.id)}
                      className={cn(
                        "mt-3 flex w-full flex-wrap items-center gap-x-2.5 gap-y-0.5 rounded-lg border px-3 py-2 text-left transition-colors",
                        item.blocked
                          ? "cursor-not-allowed border-dashed border-black/15 bg-black/[0.02]"
                          : ok
                            ? "border-[#059669]/60 bg-[#ecfdf5]"
                            : "border-[#f59e0b] bg-[#fffbeb] hover:bg-[#fef3c7]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-[18px] w-[18px] flex-none place-items-center rounded-full border-2",
                          item.blocked ? "border-black/15 bg-white" : ok ? "border-[#059669] bg-[#059669] text-white" : "border-[#f59e0b] bg-white",
                        )}
                      >
                        {ok && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className={cn("text-[13px] font-medium", item.blocked ? "text-black/40" : ok ? "text-[#047857]" : "text-[#92400e]")}>
                        {item.blocked ? t("Answer the question above first") : ok ? t("Checked — this file will be filed") : t("I've checked this — file it")}
                      </span>
                      {!item.blocked && (
                        <span className={cn("ml-auto text-[11.5px]", ok ? "text-[#047857]/80" : "text-[#b45309]")}>
                          {ok ? t("Tap again to leave it out.") : t("Unticked files are not filed.")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {ready.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#047857]">
              <Sparkles size={12} /> {t("Ready ({n})", { n: ready.length })}
            </h3>
            <ul className="space-y-2">
              {ready.map((item) => (
                <li key={item.id} className="rounded-xl border border-black/[0.07] bg-white px-4 py-3">
                  <Head item={item} icon={<Sparkles size={16} className="text-[#3C7ACB]" />} />
                  <Writes writes={item.writes} />
                  {editing.has(item.id) ? (
                    <div className="mt-3 rounded-lg border border-black/[0.06] bg-[#faf9f7]">{item.editor}</div>
                  ) : (
                    <button type="button" onClick={() => toggle(setEditing, item.id)} className="mt-2 inline-flex items-center gap-1 text-[12px] text-black/45 hover:text-black">
                      <Pencil size={11} /> {t("Change")}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {notNeeded.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setShowNotNeeded((s) => !s)}
              className="flex w-full items-center gap-2 rounded-xl border border-black/[0.07] bg-[#faf9f7] px-4 py-2.5 text-left text-[12.5px] text-black/55 hover:text-black/80"
            >
              <MinusCircle size={14} className="flex-none text-black/30" />
              <span className="min-w-0 flex-1">{t("{n} not needed — won't be filed", { n: notNeeded.length })}</span>
              <ChevronDown size={14} className={cn("flex-none transition-transform", showNotNeeded && "rotate-180")} />
            </button>
            {showNotNeeded && (
              <ul className="mt-2 space-y-2">
                {notNeeded.map((item) => (
                  <li key={item.id} className="rounded-xl border border-black/[0.07] bg-white px-4 py-3">
                    <Head item={item} icon={<MinusCircle size={16} className="text-black/30" />} />
                    {item.reason && <p className="mt-1 text-[12px] text-black/50">{item.reason}</p>}
                    {editing.has(item.id) ? (
                      <div className="mt-3 rounded-lg border border-black/[0.06] bg-[#faf9f7]">{item.editor}</div>
                    ) : (
                      <button type="button" onClick={() => toggle(setEditing, item.id)} className="mt-2 inline-flex items-center gap-1 text-[12px] text-black/45 hover:text-black">
                        <Pencil size={11} /> {t("It is needed")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {reading.length > 0 && (
          <ul className="space-y-2">
            {reading.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-4 py-3">
                <Loader2 size={16} className="flex-none animate-spin text-[#3C7ACB]" />
                <span className="min-w-0 flex-1 break-all text-[13px] text-black/75">{item.fileName}</span>
                <span className="text-[11.5px] text-[#3C7ACB]">{t("AI is reading the document…")}</span>
              </li>
            ))}
          </ul>
        )}

        {items.length === 0 && <p className="text-[13px] text-black/45">{t("Everything you dropped has been filed or set aside.")}</p>}
      </div>
    </Modal>
  );
}

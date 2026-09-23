"use client";

/* PROTOTYPE: the "AI filled" marker, a NumberInput that wears it, and the
   banner a screen shows when the review popup has just sent the reader here.
   See lib/ai-fill.ts for when a value counts as AI-filled. */

import * as React from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { NumberInput } from "@/components/ui";
import { AI_INPUT_CLASS, dismissFillRun, useAiFill, useFillRun } from "@/lib/ai-fill";
import { useLanguage, useT } from "@/lib/i18n";

export function AiFillBadge({ source }: { source: string }) {
  const t = useT();
  return (
    <span
      title={t("Filled by AI from {file}. AI can make mistakes — check it against the document and edit it if it is wrong.", { file: source })}
      className="inline-flex items-center gap-1 rounded-full border border-[#3C7ACB]/30 bg-[#eff6ff] px-1.5 py-0.5 text-[9px] normal-case tracking-[0.04em] text-[#1d4ed8]"
    >
      <Sparkles size={9} strokeWidth={1.8} /> {t("AI filled")}
    </span>
  );
}

export function AiNumberInput({
  aiScope,
  aiKey,
  className,
  ...props
}: React.ComponentProps<typeof NumberInput> & { aiScope: string; aiKey: string }) {
  const ai = useAiFill(aiScope, aiKey, props.value);
  return (
    <div className={className}>
      <NumberInput {...props} inputClassName={ai ? AI_INPUT_CLASS : undefined} />
      {ai && (
        <div className="mt-1">
          <AiFillBadge source={ai.source} />
        </div>
      )}
    </div>
  );
}

/** "AI just filled N values — they are in blue below", on the screen the
    popup's confirm lands on. `month` hides it on a month the run did not
    touch; the other months it did touch are offered as links. */
export function AiFillRunBanner({
  scope,
  month,
  hrefFor,
  onPickMonth,
  scroll = true,
}: {
  scope: string;
  month?: string;
  hrefFor?: (month: string) => string;
  onPickMonth?: (month: string) => void;
  /** off where the host scrolls to a field itself */
  scroll?: boolean;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const run = useFillRun(scope);
  const ref = React.useRef<HTMLDivElement>(null);
  const visible = !!run && (!month || run.months.includes(month));

  // Land on the banner, not the top of a long form it sits halfway down.
  React.useEffect(() => {
    if (visible && scroll) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [visible, scroll, run?.at]);

  if (!run || !visible) return null;
  const label = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { month: "short", year: "numeric" });
  const others = run.months.filter((m) => m !== month);

  return (
    <div ref={ref} className="flex items-start gap-3 rounded-2xl border border-[#3C7ACB]/30 bg-[#eff6ff] px-4 py-3">
      <Sparkles size={16} className="mt-0.5 flex-none text-[#1d4ed8]" />
      <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#1e3a8a]">
        <p className="text-[#1d4ed8]">{t("AI filled {n} values from your documents — they are in blue.", { n: run.values })}</p>
        <p className="mt-0.5 text-[12px] text-[#1e3a8a]/70">{t("AI can make mistakes — check each value against its document. Typing over a value makes it yours.")}</p>
        {others.length > 0 && (hrefFor || onPickMonth) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
            <span className="text-[#1e3a8a]/70">{t("Also filled:")}</span>
            {others.map((m) =>
              hrefFor ? (
                <Link key={m} href={hrefFor(m)} className="rounded-full border border-[#3C7ACB]/30 bg-white px-2.5 py-0.5 text-[#1d4ed8] hover:border-[#3C7ACB]">
                  {label(m)}
                </Link>
              ) : (
                <button key={m} type="button" onClick={() => onPickMonth?.(m)} className="rounded-full border border-[#3C7ACB]/30 bg-white px-2.5 py-0.5 text-[#1d4ed8] hover:border-[#3C7ACB]">
                  {label(m)}
                </button>
              ),
            )}
          </div>
        )}
      </div>
      <button type="button" onClick={() => dismissFillRun(scope)} aria-label={t("Close")} className="flex-none rounded-lg p-1 text-[#1d4ed8]/50 hover:bg-white hover:text-[#1d4ed8]">
        <X size={14} />
      </button>
    </div>
  );
}

"use client";

/* The "Cera filled" marker, a NumberInput that wears it, and the banner a screen
   shows when Cera (or the review popup) has just sent the reader here. See
   lib/ai-fill.ts for when a value counts as filled by Cera.

   THE MARKER IS GREEN WITH THE CERA MARK IN GREY. The mark wears three greys
   (a darker front panel, a lighter back one, the deepest where they meet) set
   through the mark's own colour variables, so it reads as a stamp on a green
   box and not as a second brand colour. It used to be a blue "AI filled" tag
   with a star. */

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { CeraMark } from "@/components/cera/cera-mark";
import { NumberInput } from "@/components/ui";
import {
  AI_INPUT_CLASS,
  dismissFillRun,
  useAiFill,
  useFillRun,
} from "@/lib/ai-fill";
import { dateLocaleFor, useLanguage, useT } from "@/lib/i18n";

/** The Cera mark in greys — what stands where the star used to. */
const GREY_MARK = {
  "--cera-mark-back": "#a5a19b",
  "--cera-mark-front": "#6b6a66",
  "--cera-mark-overlap": "#3a3835",
} as React.CSSProperties;
export const CeraFilledMark = ({ height = 12 }: { height?: number }) => (
  <CeraMark className="w-auto flex-none" style={{ ...GREY_MARK, height }} />
);

export function AiFillBadge({ source }: { source: string }) {
  const t = useT();
  return (
    <span
      title={t(
        "Filled by Cera from {file}. Cera can make mistakes — check it against the document and edit it if it is wrong.",
        { file: source },
      )}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#43A97F]/40 bg-[#ecfdf5] px-2 py-0.5 text-[9.5px] normal-case tracking-[0.04em] text-[#047857]"
    >
      <CeraFilledMark height={10} /> {t("Cera filled")}
    </span>
  );
}

export function AiNumberInput({
  aiScope,
  aiKey,
  className,
  ...props
}: React.ComponentProps<typeof NumberInput> & {
  aiScope: string;
  aiKey: string;
}) {
  const ai = useAiFill(aiScope, aiKey, props.value);
  return (
    <div className={className}>
      <NumberInput
        {...props}
        inputClassName={ai ? AI_INPUT_CLASS : undefined}
      />
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
    if (visible && scroll)
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [visible, scroll, run?.at]);

  if (!run || !visible) return null;
  const label = (m: string) =>
    new Date(`${m}-01T00:00:00`).toLocaleDateString(
      lang === "en" ? "en-GB" : dateLocaleFor(lang),
      { month: "short", year: "numeric" },
    );
  const others = run.months.filter((m) => m !== month);

  return (
    <div
      ref={ref}
      className="flex items-start gap-3 rounded-2xl border border-[#43A97F]/35 bg-[#ecfdf5] px-4 py-3"
    >
      <span className="mt-0.5 flex-none">
        <CeraFilledMark height={16} />
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#065f46]">
        <p className="text-[#047857]">
          {t(
            "Cera filled {n} values from your documents — they are in green.",
            { n: run.values },
          )}
        </p>
        <p className="mt-0.5 text-[12px] text-[#065f46]/70">
          {t(
            "Cera can make mistakes — check each value against its document. Typing over a value makes it yours.",
          )}
        </p>
        {others.length > 0 && (hrefFor || onPickMonth) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
            <span className="text-[#065f46]/70">{t("Also filled:")}</span>
            {others.map((m) =>
              hrefFor ? (
                <Link
                  key={m}
                  href={hrefFor(m)}
                  className="rounded-full border border-[#43A97F]/35 bg-white px-2.5 py-0.5 text-[#047857] hover:border-[#43A97F]"
                >
                  {label(m)}
                </Link>
              ) : (
                <button
                  key={m}
                  type="button"
                  onClick={() => onPickMonth?.(m)}
                  className="rounded-full border border-[#43A97F]/35 bg-white px-2.5 py-0.5 text-[#047857] hover:border-[#43A97F]"
                >
                  {label(m)}
                </button>
              ),
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismissFillRun(scope)}
        aria-label={t("Close")}
        className="flex-none rounded-lg p-1 text-[#047857]/50 hover:bg-white hover:text-[#047857]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

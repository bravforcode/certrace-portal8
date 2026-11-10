"use client";

/* ════════════════════════════════════════════════════════════
   TREE OR TABLE — the reader's choice, remembered

   Two jobs, two shapes. The tree shows what is under what and gives one row
   room to be worked on; the table shows forty rows at once and answers
   "which of these still needs me". Neither is a better default for everyone,
   so this is a preference rather than a mode — and a preference the reader
   sets once and never again, which is why it is stored.

   `tree` is the default because a supply chain IS a hierarchy: someone
   arriving for the first time should see the shape of the thing before they
   see a list of it.

   Read after mount, never during render: the value lives in localStorage,
   which does not exist on the server, and branching on it during the first
   render is a hydration mismatch. The toggle is drawn from the first paint
   with the default selected and corrects itself a tick later, which is
   invisible; rendering the wrong VIEW for a tick would not be.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ListTree, Table2 } from "lucide-react";
import { cn } from "@/components/ui";
import { useT } from "@/lib/i18n";

export type ChainView = "tree" | "table";

const KEY = "certrace:chain-view";

export function useChainView(): [ChainView, (v: ChainView) => void] {
  const [view, setView] = React.useState<ChainView>("tree");

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored === "tree" || stored === "table") setView(stored);
    } catch {
      // A browser with storage disabled just gets the default every visit.
    }
  }, []);

  const choose = React.useCallback((v: ChainView) => {
    setView(v);
    try {
      window.localStorage.setItem(KEY, v);
    } catch {
      // ignored — see above
    }
  }, []);

  return [view, choose];
}

const OPTIONS: {
  value: ChainView;
  label: string;
  icon: React.ElementType;
  title: string;
}[] = [
  {
    value: "tree",
    label: "Tree",
    icon: ListTree,
    title:
      "See the chain as a hierarchy — what is made from what, one card per entity.",
  },
  {
    value: "table",
    label: "Table",
    icon: Table2,
    title:
      "See every tier at once as rows — for scanning which entities still need work.",
  },
];

export function ChainViewToggle({
  view,
  onChange,
  className,
}: {
  view: ChainView;
  onChange: (v: ChainView) => void;
  className?: string;
}) {
  const t = useT();
  return (
    /* A radiogroup, not two buttons: these are one setting with two values,
       and arrow-key movement between them is what a keyboard user expects
       from a segmented control. */
    <div
      role="radiogroup"
      aria-label={t("Chain view")}
      className={cn(
        "inline-flex flex-none items-center gap-0.5 rounded-xl border border-black/[0.08] bg-white p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon, title }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={title}
            onClick={() => onChange(value)}
            /* A view switch, not a write — it keeps working on a read-only
               account. See components/account-lock.tsx. */
            data-lock="allow"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[11px] uppercase tracking-[0.08em] transition-colors",
              active
                ? "bg-[#111] text-white"
                : "text-black/45 hover:bg-black/[0.03] hover:text-black",
            )}
          >
            <Icon size={13} strokeWidth={1.5} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

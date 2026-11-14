"use client";

/* THE CN CODE CELL. A CN cell in the workspace sheets opens the CBAM catalogue picker (the same one the new
   product report uses: search, sector/group/heading/type filters and available EU rates)
   in a popover under the cell, instead of a short list of codes already typed.

   - Typing on the cell starts the search with that key; a click, F2 or a double-click opens it empty.
   - Arrow keys walk the results, Enter picks; with nothing matching, Enter keeps what was typed (a code the
     catalogue does not list is still the user's to enter). Escape or a click outside closes it unchanged.
   - Codes the year already uses sit on top as one-click picks.
   - The popover is drawn in a portal (the grid's scroller would clip it), placed below the cell or above it,
     whichever has more room, and kept inside the viewport. */

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";
import {
  PRODUCT_CATALOG,
  catalogByCn,
  type CatalogProduct,
} from "@/lib/config";
import {
  ProductPicker,
  SECTOR_CATEGORY,
} from "@/components/workspace/product-picker";

const digits = (s: string) => s.replace(/\D/g, "");

const WIDTH = 720;
const MARGIN = 8;

export function CnCellPicker({
  value,
  seed,
  quick,
  country,
  year,
  title,
  onPick,
  onKeep,
  onCancel,
}: {
  /** the cell's current value */
  value: string;
  /** the key that opened the cell, when typing did */
  seed?: string;
  /** codes this year already uses, offered as one-click picks */
  quick: string[];
  /** the installation's country: each row shows the EU default rate for it */
  country?: string;
  year?: number;
  /** names the cell ("Row 4 · CN code") */
  title: string;
  onPick: (product: CatalogProduct) => void;
  /** keeps a value as typed ("" clears the cell) */
  onKeep: (value: string) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const { profile } = useProfile();
  const anchor = React.useRef<HTMLSpanElement>(null);
  const panel = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<React.CSSProperties | null>(null);
  const current = catalogByCn(value);
  const quickPicks = quick
    .filter((q) => digits(q) !== digits(value))
    .slice(0, 8);

  // Below the cell or above it, whichever has more room; the list scrolls inside what is left.
  React.useLayoutEffect(() => {
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(WIDTH, vw - MARGIN * 2);
      const left = Math.max(MARGIN, Math.min(r.left, vw - MARGIN - width));
      const below = vh - r.bottom - MARGIN * 2;
      const above = r.top - MARGIN * 2;
      const style: React.CSSProperties = {
        position: "fixed",
        left,
        width,
        maxHeight: Math.max(below, above),
      };
      if (below >= 460 || below >= above) style.top = r.bottom + 4;
      else style.bottom = vh - r.top + 4;
      setPos(style);
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, []);

  /* Escape closes, Tab stays inside. Listened on the document (it runs before the full-page overlay's window
     listener, which leaves Escape alone once it is handled); only keys inside this panel are this panel's, so
     the filter dropdowns, drawn in their own portals, keep their own keys. */
  const cancel = React.useRef(onCancel);
  cancel.current = onCancel;
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const box = panel.current;
      if (!box || !box.contains(e.target as Node)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        cancel.current();
      } else if (e.key === "Tab") {
        const items = [
          ...box.querySelectorAll<HTMLElement>(
            'button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
          ),
        ].filter((el) => el.offsetParent !== null);
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <span ref={anchor} aria-hidden className="absolute inset-0" />
      {createPortal(
        <>
          {/* A click anywhere else closes the picker and leaves the cell as it was. */}
          <div
            aria-hidden
            className="fixed inset-0 z-[380]"
            onMouseDown={(e) => {
              e.preventDefault();
              onCancel();
            }}
          />
          <div
            ref={panel}
            role="dialog"
            aria-label={title}
            style={pos ?? { position: "fixed", visibility: "hidden" }}
            className="z-[390] flex flex-col overflow-hidden rounded-2xl border border-black/[0.1] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.16)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.12em] text-black/40">
                  {title}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-black/75">
                  {current ? (
                    <>
                      <span className="font-mono tabular-nums">
                        {current.cnCode}
                      </span>{" "}
                      · {t(current.name)}
                    </>
                  ) : value ? (
                    <>
                      <span className="font-mono tabular-nums">{value}</span>{" "}
                      <span className="text-black/40">
                        · {t("not in the CBAM catalogue")}
                      </span>
                    </>
                  ) : (
                    <span className="text-black/45">
                      {t("Pick the good's CN code")}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                aria-label={t("Close")}
                className="grid h-7 w-7 flex-none place-items-center rounded-md text-black/45 transition-colors hover:bg-black/[0.05] hover:text-black"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-3">
              {quickPicks.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[10px] uppercase tracking-[0.1em] text-black/40">
                    {t("Used this year")}
                  </span>
                  {quickPicks.map((q) => {
                    const p = catalogByCn(q);
                    return (
                      <button
                        key={q}
                        type="button"
                        title={p ? t(p.name) : undefined}
                        onClick={() => (p ? onPick(p) : onKeep(q))}
                        className="rounded-md border border-black/[0.1] bg-[#faf9f7] px-2 py-1 font-mono text-[11px] tabular-nums text-black/65 transition-colors hover:border-black/25 hover:text-black"
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              )}
              <ProductPicker
                value={current?.id ?? ""}
                onChange={(id) => {
                  const p = PRODUCT_CATALOG.find((x) => x.id === id);
                  if (p) onPick(p);
                }}
                initialQuery={seed ?? ""}
                autoFocus
                onEnterQuery={(q) => (q ? onKeep(q) : onCancel())}
                onEscape={onCancel}
                country={country || undefined}
                showRates={!!country}
                year={year}
                defaultCategory={
                  current?.category ?? SECTOR_CATEGORY[profile.sector]
                }
                listClassName="max-h-[min(320px,38vh)]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] bg-[#faf9f7] px-4 py-2 text-[11px] text-black/45">
              <span>
                {t(
                  "↑ ↓ to move · Enter to pick · Enter with no match keeps what you typed · Esc to close",
                )}
              </span>
              {value && (
                <button
                  type="button"
                  onClick={() => onKeep("")}
                  className={cn(
                    "rounded-md px-2 py-1 text-black/55 transition-colors hover:bg-black/[0.05] hover:text-black",
                  )}
                >
                  {t("Clear cell")}
                </button>
              )}
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

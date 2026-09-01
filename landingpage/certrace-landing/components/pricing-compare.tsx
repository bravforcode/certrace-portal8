"use client";

import Link from "next/link";
/* ════════════════════════════════════════════════════════════
   THE COMPARISON TABLE — 42 rows, three plans, no prices

   Rendered from lib/pricing-model.ts, so it cannot drift from the cards above
   it on the same page. A row is one of three things:

     boolean   a tick or a dash
     cap key   resolved against the tier's own cap (capCn → cnCodes)
     text key  looked up in pricingPage.cells, for the three rows where the
               tiers differ in kind rather than in degree

   THE SCROLL BEHAVIOUR is the thing most likely to break here. Below 901px
   the table scrolls sideways inside its own box, with the feature column
   pinned so a reader can always see which row they are on; from 901px it lays
   out normally and nothing is horizontally sticky. Both states are needed: 42
   rows of sideways-scrolling table on a phone with no row labels is
   unreadable, and a sticky column on a desktop table that already fits is a
   rendering artefact.

   THE HEADER ROW STICKS AT `top-16`, NOT `top-0`. The site header is a fixed
   64px bar, so a header row pinned to the viewport top slides underneath it
   and the reader loses the column names exactly when they start needing them.
   It unsticks on its own above the table, because that is what `sticky` does —
   it only engages once the row would have left the top of the screen.

   It only sticks from 901px up, and that is a CSS limit rather than a
   decision: below that the wrapper carries `overflow-x: auto`, which forces
   the Y axis to a scrolling value, and a sticky header resolves against the
   nearest scrollport instead of the page. Sideways scrolling and a
   viewport-sticky header cannot share one box. Phones get the sideways scroll
   and the pinned feature column; desktop, where the table already fits, gets
   the sticky header. See the note in app/globals.css.

   THE LAST ROW is the actions — the same pair each plan card carries, so a
   reader who has just finished comparing does not have to scroll back up to
   act on what they decided.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";
import {
  CAP_CELL_KEYS,
  COMPARE_GROUPS,
  TIERS,
  type Cell,
} from "@/lib/pricing-model";
import { SIGNUP_URL } from "@/lib/site";
import { PopupForm } from "./popup-form";
import { capLabel } from "./pricing-plans";

function Tick({ label }: { label: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-700"
      role="img"
      aria-label={label}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function PricingCompare() {
  const { c } = useLang();
  const p = usePages();
  const pp = p.pricingPage;
  const [quoteOpen, setQuoteOpen] = React.useState(false);

  const renderCell = (cell: Cell, tierIndex: number) => {
    if (cell === true) return <Tick label={pp.included} />;
    if (cell === false)
      return (
        <span className="font-pixel text-[15px] text-black/25" aria-label={pp.notIncluded}>
          —
        </span>
      );

    const capKey = CAP_CELL_KEYS[cell];
    if (capKey) {
      return (
        <span className="font-pixel text-[12px] uppercase tracking-[0.03em] text-[#111] tabular-nums">
          {capLabel(TIERS[tierIndex].caps[capKey], pp.caps)}
        </span>
      );
    }

    return <span className="text-[13px] leading-snug text-black/55">{pp.cells[cell]}</span>;
  };

  return (
    <div className="compare-scroller overflow-x-auto rounded-2xl border border-black/[0.07] bg-white">
      <table className="w-full min-w-[760px] border-collapse bg-white">
        <caption className="sr-only">{pp.compareHeading}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="compare-head-first sticky top-16 z-[4] w-[36%] min-w-[240px] border-b border-black/[0.14] bg-white px-5 pb-4 pt-5 text-left"
            >
              <span className="font-pixel text-[11px] uppercase tracking-[0.14em] text-black/40">
                {pp.featureColumn}
              </span>
            </th>
            {TIERS.map((tier) => (
              <th
                key={tier.id}
                scope="col"
                className={`sticky top-16 z-[3] border-b border-black/[0.14] px-5 pb-4 pt-5 text-left ${
                  tier.featured ? "bg-[#f0eee8]" : "bg-white"
                }`}
              >
                {/* The name only. The "priced on request" line that used to sit
                    under it said nothing the buttons at the foot of the table
                    do not say better, and every pixel of a sticky header is
                    paid for by the rows it covers. */}
                <span
                  className="block text-[19px] font-light leading-tight tracking-tight"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  {pp.tiers[tier.id].name}
                </span>
                <span className="mt-1 block font-pixel text-[10px] uppercase tracking-[0.08em] text-black/40">
                  {pp.tiers[tier.id].tag}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {COMPARE_GROUPS.map((group) => (
            <React.Fragment key={group.id}>
              <tr>
                <th
                  colSpan={4}
                  scope="colgroup"
                  className="compare-group border-y border-black/[0.08] bg-[#faf9f7] px-5 py-2.5 text-left font-pixel text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/55"
                >
                  {pp.groups[group.id]}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.id} className="group/row">
                  <th
                    scope="row"
                    className="compare-row-head border-b border-black/[0.06] bg-white px-5 py-3 text-left text-[14px] font-normal leading-snug text-[#111] group-hover/row:bg-[#faf9f7]"
                  >
                    {pp.rows[row.id]}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td
                      key={i}
                      className={`border-b border-black/[0.06] px-5 py-3 align-middle ${
                        TIERS[i].featured
                          ? "bg-[#f0eee8] group-hover/row:bg-[#eae7e0]"
                          : "group-hover/row:bg-[#faf9f7]"
                      }`}
                    >
                      {renderCell(cell, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>

        {/* The actions, repeated at the foot. Same pair as the plan cards, in
            the same order, so a reader who compared 42 rows on the way down
            can act without scrolling 42 rows back up. */}
        <tfoot>
          <tr>
            <th
              scope="row"
              className="compare-row-head border-t border-black/[0.14] bg-white px-5 py-6 text-left align-top"
            >
              <span className="font-pixel text-[11px] uppercase tracking-[0.14em] text-black/40">
                {pp.actionsRow}
              </span>
            </th>
            {TIERS.map((tier) => {
              const enterprise = tier.id === "enterprise";
              const primaryClass = `block w-full rounded-[10px] py-2.5 text-center text-[13px] tracking-widest transition-all duration-200 ${
                tier.featured
                  ? "bg-[#111] text-white hover:bg-[#333]"
                  : "border border-black/10 bg-white text-black/60 hover:border-black/25 hover:bg-black/[0.04] hover:text-black"
              }`;
              return (
                <td
                  key={tier.id}
                  className={`border-t border-black/[0.14] px-5 py-6 align-top ${
                    tier.featured ? "bg-[#f0eee8]" : ""
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    {enterprise ? (
                      <button
                        type="button"
                        onClick={() => setQuoteOpen(true)}
                        className={primaryClass}
                      >
                        {c.common.requestPricing}
                      </button>
                    ) : (
                      <a href={SIGNUP_URL} className={primaryClass}>
                        {pp.startTrial}
                      </a>
                    )}
                    {enterprise ? (
                      <Link
                        href="/#demo"
                        className="block w-full py-1 text-center font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35 transition-colors hover:text-black"
                      >
                        {c.common.bookDemo}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setQuoteOpen(true)}
                        className="block w-full py-1 text-center font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35 transition-colors hover:text-black"
                      >
                        {c.common.requestPricing}
                      </button>
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>

      <PopupForm kind="pricing" open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </div>
  );
}

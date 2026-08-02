"use client";

import { useLang } from "@/lib/i18n";
import { CertraceLogo } from "./logo";

export function ComparisonTable() {
  const { c } = useLang();

  return (
    <>
      {/* Phones get the same six comparisons as a stack of cards. A four-column
          table can't be read at 390px: it needs a 660px floor, and the column
          that carries the argument — ours — is the last one, i.e. the one
          furthest off the right edge behind a sideways swipe nobody makes. One
          card per row keeps the reading order (subject, the two alternatives,
          then us on the highlight plate) and every value stays on screen.
          Identical copy, straight off the same keys as the table. */}
      <div className="md:hidden flex flex-col gap-3">
        {c.comparison.rows.map((row) => (
          <div
            key={row.label}
            className="rounded-2xl border border-black/[0.08] bg-white p-5"
          >
            <div className="text-sm text-black/80">{row.label}</div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { col: c.comparison.colDiy, value: row.diy },
                { col: c.comparison.colConsultant, value: row.consultant },
              ].map((cell) => (
                <div key={cell.col}>
                  {/* DS table header: pixel face, 10px, .12em tracking, 35% ink. */}
                  <div className="font-pixel text-[10px] tracking-[0.12em] uppercase text-black/35">
                    {cell.col}
                  </div>
                  <div className="mt-1.5 text-[13px] text-black/40 leading-relaxed">
                    {cell.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Same highlight fill the table's Certrace column carries, so the
                emphasis reads the same on both layouts. */}
            <div className="mt-4 rounded-xl bg-[#F0EEE8] px-4 py-3.5">
              <CertraceLogo className="h-[11px] w-auto" />
              <span className="sr-only">Certrace</span>
              <div className="mt-2 text-[13px] text-black/80 leading-relaxed">
                {row.certrace}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* `.scroll-x` (globals.css) = overflow-x:auto + paint containment. The
          containment is what keeps this table's width floor from stretching the
          mobile layout viewport and zooming the whole page out — it did exactly
          that before the phone layout above existed, and it would again on any
          window between md and 660px + padding. */}
      <div className="hidden md:block scroll-x rounded-2xl border border-black/[0.08] bg-white">
        {/* 660, not 680: at the md breakpoint the section's own px-12 leaves
            672px, and a table one hair wider than its frame puts a scrollbar
            under a tablet. Desktop never reaches the floor — the table is
            w-full and always wider. */}
        <table className="w-full min-w-[660px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/[0.08]">
              {/* DS table header: pixel face, 10px, .12em tracking, 35% ink. */}
              <th className="text-left font-normal px-6 py-5 w-[26%]" />
              <th className="text-left font-normal font-pixel text-black/35 text-[10px] tracking-[0.12em] uppercase px-6 py-5">
                {c.comparison.colDiy}
              </th>
              <th className="text-left font-normal font-pixel text-black/35 text-[10px] tracking-[0.12em] uppercase px-6 py-5">
                {c.comparison.colConsultant}
              </th>
              <th className="text-left px-6 py-5 bg-[#F0EEE8]">
                <CertraceLogo className="h-[13px] w-auto" />
                <span className="sr-only">Certrace</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {c.comparison.rows.map((row, i) => (
              <tr
                key={row.label}
                className={
                  i < c.comparison.rows.length - 1
                    ? "border-b border-black/[0.06]"
                    : ""
                }
              >
                <td className="px-6 py-5 text-black/70">{row.label}</td>
                <td className="px-6 py-5 text-black/40">{row.diy}</td>
                <td className="px-6 py-5 text-black/40">{row.consultant}</td>
                {/* Emphasis comes from ink weight + the highlight fill, not a
                    heavier font — the DS keeps one text weight per surface. */}
                <td className="px-6 py-5 text-black/80 bg-[#F0EEE8]/60">
                  {row.certrace}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

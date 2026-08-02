"use client";

import { useLang } from "@/lib/i18n";
import { CertraceLogo } from "./logo";

export function ComparisonTable() {
  const { c } = useLang();

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white">
      <table className="w-full min-w-[680px] border-collapse text-sm">
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
  );
}

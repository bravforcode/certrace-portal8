/* ════════════════════════════════════════════════════════════
   REPORTING YEARS — one range for every year bar (Workspace, Convert)

   From 2020 to five years past the current one. The current year is the
   default, and it moves on by itself: on 1 January 2027 the default becomes
   2027 and the range grows to 2032. 2020 never leaves the start.
   ════════════════════════════════════════════════════════════ */

export const FIRST_YEAR = 2020;
export const YEARS_AHEAD = 5;

export const currentYear = () => new Date().getFullYear();

/** 2020 … current + 5, oldest first. */
export function yearRange(now = currentYear()): number[] {
  const out: number[] = [];
  for (let y = FIRST_YEAR; y <= now + YEARS_AHEAD; y++) out.push(y);
  return out;
}

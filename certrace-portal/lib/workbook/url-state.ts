/* Reads the workspace's ?year= and ?sheet= links. Anything that does not name a real
   year or sheet falls back, so a stale or hand-typed link still opens the workspace. */

/** The sheet id in the link when it is one of the sheets; otherwise the default. */
export function parseSheetParam(raw: string | null, sheetIds: readonly string[], fallback: string): string {
  return raw !== null && sheetIds.includes(raw) ? raw : fallback;
}

/** The year in the link when it is a four-digit year the year bar offers; otherwise null. */
export function parseYearParam(raw: string | null, years: readonly number[]): number | null {
  if (raw === null || !/^\d{4}$/.test(raw)) return null;
  const year = Number(raw);
  return years.includes(year) ? year : null;
}

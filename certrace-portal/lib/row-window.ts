/** Which rows of a long sheet to render: the ones in the viewport plus `overscan` either side.
    `top` is the first data row's offset from the viewport top (negative once scrolled past).
    Sheets up to `threshold` rows render whole. `keep` (the row being edited) is always inside. */
export function rowWindow(o: {
  total: number;
  top: number;
  viewport: number;
  rowHeight: number;
  overscan: number;
  threshold: number;
  keep?: number;
}): { start: number; end: number } {
  if (o.total <= o.threshold) return { start: 0, end: o.total };
  const first = Math.floor(-o.top / o.rowHeight);
  const last = Math.ceil((o.viewport - o.top) / o.rowHeight);
  let start = Math.min(o.total, Math.max(0, first - o.overscan));
  // At least `overscan` rows, so a grid still below the fold has its top rows ready.
  let end = Math.min(o.total, Math.max(start + o.overscan, last + o.overscan));
  if (o.keep !== undefined && o.keep >= 0 && o.keep < o.total) {
    start = Math.min(start, o.keep);
    end = Math.max(end, o.keep + 1);
  }
  return { start, end };
}

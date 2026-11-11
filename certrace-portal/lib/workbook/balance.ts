import type { Sheet } from "../workspace-sheets";

/* One number parser for every quantity in the workbook. Commas are thousands
   separators only ("1,500" is 1500; "1,5" is not a number), and a leading minus
   parses but is rejected by callers (a quantity cannot be negative). */
const QTY = /^-?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/;
export function parseQuantity(raw: string | undefined): number | null {
  const s = (raw ?? "").trim();
  return QTY.test(s) ? Number(s.replace(/,/g, "")) : null;
}

/* Mass units and their tonne factors. Fuel units alias onto this table too. */
export const MASS_TO_TONNES: Record<string, number> = {
  t: 1, ton: 1, tons: 1, tonne: 1, tonnes: 1, mt: 1, kg: 0.001, g: 0.000001,
};

/** Tonnes for a quantity in a mass unit. Null for a non-mass unit, a bad number, or a negative quantity. */
export function toTonnes(qty: string, unit: string): number | null {
  const factor = MASS_TO_TONNES[(unit ?? "").trim().toLowerCase()];
  const n = parseQuantity(qty);
  return factor === undefined || n === null || n < 0 ? null : n * factor;
}

export type StepBalance = { step: string; inT: number; outT: number; diffPct: number | null; ok: boolean; ignored: number };

/** Ratios are rounded to this many decimal places (1e-9) so float noise never flips a tolerance check. */
export const RATIO_SCALE = 1e9;

const rowsOf = (sheets: Sheet[], id: string) => sheets.find((x) => x.id === id)?.rows.map((r) => r.cells) ?? [];

/** The grouping key for a step: case-insensitive, whitespace trimmed and collapsed. */
export const stepKey = (s: string | undefined) => (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();

export function massBalance(sheets: Sheet[], tolerance = 0.05): StepBalance[] {
  const order = new Map<string, string>();
  for (const id of ["steps", "materials", "output"])
    for (const c of rowsOf(sheets, id)) {
      const k = stepKey(c.step);
      if (k && !order.has(k)) order.set(k, (c.step ?? "").trim().replace(/\s+/g, " "));
    }
  return [...order].map(([k, step]) => {
    let inT = 0, outT = 0, ignored = 0;
    for (const [id, add] of [["materials", (t: number) => (inT += t)], ["output", (t: number) => (outT += t)]] as const)
      for (const c of rowsOf(sheets, id)) {
        if (stepKey(c.step) !== k || !c.qty?.trim()) continue;
        const t = toTonnes(c.qty, c.unit ?? "");
        if (t === null) ignored++;
        else add(t);
      }
    const diffPct = inT > 0 ? Math.round(((inT - outT) / inT) * RATIO_SCALE) / RATIO_SCALE : null;
    return { step, inT, outT, diffPct, ok: diffPct === null ? outT === 0 : Math.abs(diffPct) <= tolerance, ignored };
  });
}

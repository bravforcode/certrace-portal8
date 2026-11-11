import type { Sheet } from "../workspace-sheets";

const MASS: Record<string, number> = { t: 1, ton: 1, tons: 1, tonne: 1, tonnes: 1, mt: 1, kg: 0.001, g: 0.000001 };
export function toTonnes(qty: string, unit: string): number | null {
  const factor = MASS[(unit ?? "").trim().toLowerCase()];
  const n = Number((qty ?? "").replace(/,/g, "").trim());
  return factor === undefined || !qty?.trim() || !Number.isFinite(n) ? null : n * factor;
}

export type StepBalance = { step: string; inT: number; outT: number; diffPct: number | null; ok: boolean; ignored: number };

const rowsOf = (sheets: Sheet[], id: string) => sheets.find((x) => x.id === id)?.rows.map((r) => r.cells) ?? [];
const key = (s: string | undefined) => (s ?? "").trim().toLowerCase();

export function massBalance(sheets: Sheet[], tolerance = 0.05): StepBalance[] {
  const order = new Map<string, string>();
  for (const id of ["steps", "materials", "output"])
    for (const c of rowsOf(sheets, id)) if (c.step?.trim() && !order.has(key(c.step))) order.set(key(c.step), c.step.trim());
  return [...order].map(([k, step]) => {
    let inT = 0, outT = 0, ignored = 0;
    for (const [id, add] of [["materials", (t: number) => (inT += t)], ["output", (t: number) => (outT += t)]] as const)
      for (const c of rowsOf(sheets, id)) {
        if (key(c.step) !== k || !c.qty?.trim()) continue;
        const t = toTonnes(c.qty, c.unit ?? "");
        if (t === null) ignored++;
        else add(t);
      }
    const diffPct = inT > 0 ? Math.round(((inT - outT) / inT) * 1e9) / 1e9 : null;
    return { step, inT, outT, diffPct, ok: diffPct === null ? outT === 0 : Math.abs(diffPct) <= tolerance, ignored };
  });
}

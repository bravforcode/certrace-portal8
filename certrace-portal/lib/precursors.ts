/* ════════════════════════════════════════════════════════════
   STRUCTURED PRECURSORS — the load-bearing half of complex-good SEE.

   CBAM (Reg. (EU) 2023/956 Annex IV + Impl. Reg. 2023/1773) defines the
   embedded emissions of a complex good as the emissions of its OWN production
   process PLUS the embedded emissions of each relevant precursor actually
   consumed. A free-text description cannot be calculated, validated or
   emitted to a declarant — so precursors are structured rows:

     { name, cn, qtyPerTonne (t precursor / t good), see (tCO₂e/t precursor), route }

   and the good's TOTAL embedded emissions are DERIVED:

     total = own direct + own indirect + Σ (qtyPerTonne × see)

   Storage stays inside the existing per-token value map — the rows are
   serialised as JSON under the same `${productId}::precursors` key — so old
   submissions (plain prose) keep loading: `parsePrecursors` returns null for
   legacy text and every consumer falls back gracefully.
   ════════════════════════════════════════════════════════════ */

export type PrecursorRow = {
  name: string;
  cn: string; // CN code of the precursor, e.g. "7207 11 90"
  qty: string; // tonnes of precursor consumed per tonne of the good
  see: string; // specific embedded emissions of the precursor, tCO₂e/t
  route: string; // production route of the precursor, where known
};

export const emptyPrecursorRow = (): PrecursorRow => ({ name: "", cn: "", qty: "", see: "", route: "" });

/** Parse a stored precursors value. JSON array → rows; legacy prose → null. */
export function parsePrecursors(raw: string | undefined | null): PrecursorRow[] | null {
  if (!raw || !raw.trim().startsWith("[")) return null;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    return arr.map((r) => ({
      name: String(r?.name ?? ""),
      cn: String(r?.cn ?? ""),
      qty: String(r?.qty ?? ""),
      see: String(r?.see ?? ""),
      route: String(r?.route ?? ""),
    }));
  } catch {
    return null;
  }
}

export const serializePrecursors = (rows: PrecursorRow[]): string => JSON.stringify(rows);

/** A row counts toward the calculation once it has a name and numeric qty + SEE. */
export const rowComplete = (r: PrecursorRow): boolean =>
  r.name.trim().length > 0 && Number(r.qty) > 0 && Number(r.see) > 0;

/** Σ qty × SEE across complete rows — the precursor share of the good's SEE (tCO₂e/t). */
export function precursorContribution(raw: string | undefined | null): number {
  const rows = parsePrecursors(raw);
  if (!rows) return 0; // legacy prose — cannot be calculated (flagged by the AI check)
  return rows.filter(rowComplete).reduce((a, r) => a + Number(r.qty) * Number(r.see), 0);
}

/** Human-readable single-line rendering for review screens / PDF / XML fallback. */
export function formatPrecursors(raw: string | undefined | null): string {
  const rows = parsePrecursors(raw);
  if (!rows) return raw ?? "";
  return rows
    .filter((r) => r.name.trim())
    .map((r) => `${r.name}${r.cn.trim() ? ` (CN ${r.cn})` : ""} — ${r.qty || "?"} t/t × ${r.see || "?"} tCO₂e/t${r.route.trim() ? ` · ${r.route}` : ""}`)
    .join("\n");
}

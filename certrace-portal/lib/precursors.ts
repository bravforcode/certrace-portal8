/* ════════════════════════════════════════════════════════════
   STRUCTURED PRECURSORS — the load-bearing half of complex-good SEE.

   CBAM (Reg. (EU) 2023/956 Annex IV + Impl. Reg. 2025/2547) defines the
   embedded emissions of a complex good as the emissions of its OWN production
   process PLUS the embedded emissions of each relevant precursor actually
   consumed. A free-text description cannot be calculated, validated or
   emitted to a declarant — so precursors are structured, and the good's TOTAL
   embedded emissions are DERIVED:

     total = own direct + own indirect + precursor contribution

   Since P4 the structure is a TREE (lib/cbam/precursor-tree.ts), because real
   chains are multi-tier: ore → pig iron → billet → rebar. This file is now the
   COMPATIBILITY + STORAGE layer around it. Storage still sits inside the
   existing per-token value map under the same `${productId}::precursors` key,
   which is what lets three generations of data coexist: legacy prose (parses
   to null, exactly as before), legacy flat rows (migrate to one tier), and
   trees. Nothing here re-implements the sum — it delegates.
   ════════════════════════════════════════════════════════════ */

import {
  parsePrecursorTree,
  precursorSEE,
  formatTree,
} from "./cbam/precursor-tree";

export type PrecursorRow = {
  name: string;
  cn: string; // CN code of the precursor, e.g. "7207 11 90"
  qty: string; // tonnes of precursor consumed per tonne of the good
  see: string; // specific embedded emissions of the precursor, tCO₂e/t
  route: string; // production route of the precursor, where known
};

/** Parse a stored precursors value. JSON array → rows; legacy prose → null. */
export function parsePrecursors(
  raw: string | undefined | null,
): PrecursorRow[] | null {
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

/* ── Calculation & display now go through the tree ──────────────
   Since P4 the same storage key can hold a multi-tier PrecursorNode[] (ore →
   pig iron → billet → rebar). The two functions below therefore delegate to
   lib/cbam/precursor-tree.ts, which reads flat rows, trees and legacy prose
   through one parser. Keeping them here means every existing caller —
   compliance engine, AI check, XML, PDF — picks up multi-tier support without
   changing a line, and there is still exactly ONE implementation of the sum.

   `parsePrecursors` above is untouched: it is the flat-row contract the
   editors and the legacy-prose check depend on, and it still returns null for
   free text exactly as it always did. */

/** Σ qty × SEE across the precursor chain — the precursor share of the good's
    SEE (tCO₂e/t). Scrap resolves to 0; nested tiers resolve depth-first. */
export function precursorContribution(raw: string | undefined | null): number {
  const roots = parsePrecursorTree(raw);
  if (!roots) return 0; // legacy prose — cannot be calculated (flagged by the AI check)
  try {
    return precursorSEE(roots).perTonne;
  } catch {
    /* A cycle or an over-deep chain is a real error, but this function is
       called from render paths that must not throw. It returns 0 and the
       validator (V8) is what actually reports it. */
    return 0;
  }
}

/** Human-readable rendering for review screens / PDF / XML fallback. Indents
    each tier so a chain reads as a chain. */
export function formatPrecursors(raw: string | undefined | null): string {
  const roots = parsePrecursorTree(raw);
  if (!roots) return raw ?? "";
  return formatTree(roots);
}

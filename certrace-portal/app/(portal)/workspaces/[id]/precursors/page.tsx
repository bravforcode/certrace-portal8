"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   PRECURSORS — the direct precursors of this product

   One tab on the product report, replacing the supply-chain tree. The tree
   asked for every tier of every chain; CBAM does not. The operator of a
   complex good reports the specific embedded emissions of each DIRECT
   precursor (Annex IV items 22–23 of Implementing Regulation (EU) 2025/2547),
   and the operator of that precursor reports its own inputs in its own
   verified report. See components/workspace/direct-precursors.tsx.
   ════════════════════════════════════════════════════════════ */

import { DirectPrecursors } from "@/components/workspace/direct-precursors";

export default function PrecursorsPage() {
  return <DirectPrecursors />;
}

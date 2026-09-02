/* ════════════════════════════════════════════════════════════
   PRECURSORS — retired

   This page's own editor (SupplierEditor, moved to
   components/precursor/supplier-editor.tsx) and its chain view now live at
   /workspaces/[id]/tree, which reads and writes the exact same
   PrecursorSupplier rows (lib/precursor-suppliers.ts) — nothing here was a
   separate store to migrate. This route stays only as a redirect, in case
   an old bookmark, email, or external link still points at it. */

import { redirect } from "next/navigation";

export default async function PrecursorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/workspaces/${id}/tree`);
}

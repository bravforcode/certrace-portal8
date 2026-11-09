export const runtime = "edge";

/* The per-node entity pages of the old supply-chain tree are retired — see
   ../page.tsx. */

import { redirect } from "next/navigation";

export default async function EntityRedirect({ params }: { params: Promise<{ id: string; nodeId: string }> }) {
  const { id } = await params;
  redirect(`/workspaces/${id}/precursors`);
}

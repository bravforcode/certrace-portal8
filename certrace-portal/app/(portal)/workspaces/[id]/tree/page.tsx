export const runtime = "edge";

/* The supply-chain tree is retired. A product's direct precursors are now the
   Precursors tab of its report; this route stays only so an old bookmark, email
   or link lands somewhere that exists. */

import { redirect } from "next/navigation";

export default async function SupplyChainRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/workspaces/${id}/precursors`);
}

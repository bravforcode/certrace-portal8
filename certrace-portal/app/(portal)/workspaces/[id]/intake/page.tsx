export const runtime = "edge";

/* The Smart upload tab is retired. Reading a file and filling a month is Cera's job now — the Cera button in the top bar, with
   Smart upload switched on — and a month's documents are attached on that month's Documents step. This route stays only so an
   old bookmark or link lands somewhere that exists. */

import { redirect } from "next/navigation";

export default async function IntakeRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/workspaces/${id}/monthly`);
}

"use client";

export const runtime = "edge";

/* The spec (§A2) names `/workspaces/[id]/months/[month]` as the month editor's
   address. The editor itself lives under the Monthly Data tab's own route so
   the tab strip, its deep links and the browser's back button all agree about
   where you are — but a path written into a specification is an address people
   will type, paste and bookmark, so it resolves rather than 404s. */

import * as React from "react";
import { useRouter } from "next/navigation";

export default function MonthRedirect({ params }: { params: Promise<{ id: string; month: string }> }) {
  const { id, month } = React.use(params);
  const router = useRouter();

  React.useEffect(() => {
    router.replace(`/workspaces/${id}/monthly/${month}`);
  }, [id, month, router]);

  return null;
}

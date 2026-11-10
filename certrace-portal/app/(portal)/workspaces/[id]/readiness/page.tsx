"use client";

export const runtime = "edge";

/* Readiness moved from the product report to its INSTALLATION: the monitoring
   plan and the report set are filed per installation and reporting year, so the
   year is read as a whole there. This route stays so every readiness deep link,
   verifier link and bookmark still lands somewhere — on the installation's
   Readiness tab, for this report's year, with this report opened. A link that
   asked for the carbon price goes to the product's Carbon price tab. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/query-state";
import { installationHref } from "@/components/workspace/installation-menu";
import { useWorkspace } from "@/components/workspace/provider";

export default function ReadinessRedirect() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  React.useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    // The carbon price has its own tab on the product report now; an old link that asked for it goes there.
    const target = hash.startsWith("#carbon-price")
      ? `/workspaces/${workspace.id}/carbon-price`
      : `${installationHref(workspace.installationId, "readiness")}?year=${workspace.year}&open=${encodeURIComponent(workspace.id)}`;
    router.replace(target);
  }, [router, workspace]);
  return <LoadingState />;
}

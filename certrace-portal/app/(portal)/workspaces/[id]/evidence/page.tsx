"use client";

/* The Evidence tab is retired.

   Its per-month machinery already lived inside the month editor; its annual
   scope now lives on the MMD (installation identity, calibration records) and
   in the precursor chain (each tier's emissions figure), and the carbon-price
   receipt lives beside the carbon-price claim on Readiness. Coverage across
   all of them is still reported — on Readiness, which is where an annual
   question belongs.

   The route survives as a redirect so existing deep links and the readiness
   rules' older `#annual` anchors land somewhere real. */

import * as React from "react";
import { useRouter, useParams } from "next/navigation";

export default function EvidenceRedirect() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  React.useEffect(() => {
    router.replace(`/workspaces/${params.id}/readiness`);
  }, [router, params.id]);
  return null;
}

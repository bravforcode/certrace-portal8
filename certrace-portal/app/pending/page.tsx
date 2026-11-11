"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RequireSession } from "@/components/require-session";
import OnboardingDonePage from "@/app/onboarding/done/page";
import { me } from "@/lib/api/auth";
import { signInDestination } from "@/lib/auth-flow";

/* Polls /me every 30 s while the tab is visible; the interval pauses in the
   background, and TanStack Query stops it on unmount. */
function ApprovalWatch() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: me,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  React.useEffect(() => {
    if (data?.ready) router.replace(signInDestination(data));
  }, [data, router]);
  return null;
}

export default function PendingPage() {
  return (
    <RequireSession requireReady={false}>
      <ApprovalWatch />
      <OnboardingDonePage />
    </RequireSession>
  );
}

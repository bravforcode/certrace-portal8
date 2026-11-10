import { RequireSession } from "@/components/require-session";
import OnboardingDonePage from "@/app/onboarding/done/page";

export default function PendingPage() {
  return (
    <RequireSession requireReady={false}>
      <OnboardingDonePage />
    </RequireSession>
  );
}

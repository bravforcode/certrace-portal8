import { RequireSession } from "@/components/require-session";

/* Registration questions require a signed-in account. Workspace approval
   is checked by the portal layout after these questions are saved. */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSession requireReady={false}>{children}</RequireSession>;
}

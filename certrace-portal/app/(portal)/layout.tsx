import { AccountProvider } from "@/components/account-lock";
import { PortalShell } from "@/components/portal-shell";

/* AccountProvider sits ABOVE the shell, not inside it: the sidebar's plan
   strip reads the trial countdown from it, and the read-only lock has to be
   mounted before any page under it renders. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountProvider>
      <PortalShell>{children}</PortalShell>
    </AccountProvider>
  );
}

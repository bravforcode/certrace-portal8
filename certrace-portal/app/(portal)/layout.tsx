import { AccountProvider } from "@/components/account-lock";
import { PortalShell } from "@/components/portal-shell";
import { RequireSession } from "@/components/require-session";

/* RequireSession is the OUTERMOST wrapper, so nothing below it mounts for
   somebody who is not signed in — not the shell, not the account context, not
   the page. This is the whole app's front door: every route in this group
   inherits it, and a new section added beside them is gated by existing.

   AccountProvider sits ABOVE the shell, not inside it: the sidebar's plan
   strip reads the trial countdown from it, and the read-only lock has to be
   mounted before any page under it renders. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireSession>
      <AccountProvider>
        <PortalShell>{children}</PortalShell>
      </AccountProvider>
    </RequireSession>
  );
}

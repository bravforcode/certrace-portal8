import { AccountProvider } from "@/components/account-lock";
import { SeatGuard } from "@/components/seat-lock";
import { SeatFixtureBoot } from "@/components/seat-fixture-boot";
import { PortalShell } from "@/components/portal-shell";

/* AccountProvider sits ABOVE the shell, not inside it: the sidebar's plan
   strip reads the trial countdown from it, and the read-only lock has to be
   mounted before any page under it renders.

   SeatGuard is the same shape for the seat (components/seat-lock.tsx) and is
   mounted alongside rather than inside, because the two are independent: a
   trial can end on any seat, and a seat is bounded on any plan. It stays
   mounted even though this build grants `enterFigures` and its field half
   therefore stands down — the route guard in it is still live, and the
   component asks `can()` rather than assuming. See its header.

   SeatFixtureBoot runs before either. This seat cannot create a workspace, so
   an account with nothing in it would stay empty forever — see
   lib/seat-fixture.ts for why that is the architecture showing through
   rather than a flaw in the seat. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountProvider>
      <SeatFixtureBoot />
      <SeatGuard />
      <PortalShell>{children}</PortalShell>
    </AccountProvider>
  );
}

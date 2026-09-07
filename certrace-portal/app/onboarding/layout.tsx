import { RequireSession } from "@/components/require-session";

/* Onboarding is INSIDE the account, not on the way to one. Both doors that
   open it — `register` and `login` in lib/api/auth.ts — save the session
   before they push here, so a real signup and a real sign-in both walk
   straight through this gate.

   It is here because /onboarding was the address the simulated sign-in pushed
   to, which makes it the first URL anyone would try by hand once /login stops
   letting them through. Without the gate, a production build with no backend
   would still have handed over a company-details form and a working-looking
   flow to a stranger who typed the path.

   No layout of its own beyond this: the onboarding screens draw their own
   full-page chrome. The demo path is unaffected — RequireSession compiles
   down to its children on a demo build. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <RequireSession>{children}</RequireSession>;
}

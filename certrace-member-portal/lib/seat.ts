/* ════════════════════════════════════════════════════════════
   THE SEAT THIS BUILD IS FOR — Certrace Member

   certrace-portal7 is the OWNER's view of the account. It is the same app as
   this one and it always assumed the person holding the tab could do
   everything: `SeatRole` existed in lib/data.ts, but nothing in the product
   ever read it. The Team page drew three role cards and then let whoever was
   looking at them add seats, open billing and sign a pack off. A role that is
   described but never enforced is not a permission model; it is a caption.

   THIS BUILD IS THE MEMBER SEAT, AND ONLY THE MEMBER SEAT. `SEAT_ROLE` below
   is the single constant that makes it so. Everything else in this file is
   derived from it, and every screen that used to assume owner asks `can()`
   instead of testing for a name or hiding a button locally.

   ── WHY A TABLE AND NOT A PILE OF DELETIONS ────────────────
   The obvious way to build a member portal is to delete the owner screens and
   move on. That produces something that works today and cannot be reasoned
   about tomorrow: nobody can answer "what exactly can a member do" without
   diffing two repositories. GRANTS is that answer, written once, in the same
   words the product already uses on /team:

     Owner  — everything a member can do, plus billing, seats and deleting
              workspaces. There is always exactly one.
     Member — build and manage workspaces, fill months in, chase suppliers.
     Legal  — everything a member can do, plus reviewing and signing packages
              off before they leave.

   So Member is the FLOOR and the other two are Member plus one thing each.
   The table says exactly that, which is why `legal` is spelled as the member
   set plus `signOffPack` rather than retyped.

   ── WHAT IS DELIBERATELY *NOT* TAKEN AWAY ──────────────────
   A member is the person who does the work. Narrowing them past their own job
   produces a portal nobody can file from, so these stay:

     · creating and archiving workspaces — archiving is reversible and is
       plainly "manage workspaces"; DELETING is the owner's, and is the only
       destructive verb /team names.
     · signing off a MONTH — the member typed those readings, and month
       sign-off is defined in lib/month-signoff.ts as the moment
       responsibility moves from whoever typed them to whoever answers for
       them. A member answers for their own month.
     · downloading DRAFT packs — draft copies circulate internally all the
       time and gating them would stop people working (see lib/pack-signoff.ts).
     · reading the team roster — they have to know who to hand a month to.

   What goes is the COMMERCIAL half (billing, seats, the organisation's own
   identity) and the RELEASE half (signing the final pack that leaves the
   company). Those are the two things /team says are not a member's.
   ════════════════════════════════════════════════════════════ */

import { SEATS, type Seat, type SeatRole } from "./data";

/** The one constant that makes this the member build. Nothing reads a URL,
    a cookie or a header to decide it: there is no owner surface compiled into
    this app to reach, so there is nothing for an override to unlock. */
export const SEAT_ROLE: SeatRole = "member";

export type Capability =
  /* the work */
  | "buildWorkspaces"
  | "archiveWorkspace"
  | "chaseSuppliers"
  | "signOffMonth"
  | "downloadDraftPack"
  | "editOwnProfile"
  | "viewTeam"
  /* the release */
  | "signOffPack"
  /* the account */
  | "manageSeats"
  | "editOrganisation"
  | "billing"
  | "deleteWorkspace";

const MEMBER: Capability[] = [
  "buildWorkspaces",
  "archiveWorkspace",
  "chaseSuppliers",
  "signOffMonth",
  "downloadDraftPack",
  "editOwnProfile",
  "viewTeam",
];

const GRANTS: Record<SeatRole, ReadonlySet<Capability>> = {
  member: new Set(MEMBER),
  /* Member plus the one thing /team says is theirs. */
  legal: new Set([...MEMBER, "signOffPack"]),
  owner: new Set([...MEMBER, "signOffPack", "manageSeats", "editOrganisation", "billing", "deleteWorkspace"]),
  /* Certrace has no verifier portal in this build — see lib/team-store.ts. */
  verifier: new Set<Capability>(),
};

/** What this seat may do. The only permission question the app ever asks. */
export const can = (capability: Capability): boolean => GRANTS[SEAT_ROLE].has(capability);

/* ── The people this seat has to be able to name ────────────
   A member who is blocked is told WHO can unblock them, by name, because
   "contact your administrator" is the sentence that sends somebody to a
   help desk that does not exist. These resolve from the same SEATS fixture
   /team renders, so the name in a blocked notice and the name on the roster
   can never drift apart. */

const seatWithRole = (role: SeatRole): Seat | undefined => SEATS.find((s) => s.role === role);

/** Whoever holds this seat — the signed-in person for this whole build. */
export const SIGNED_IN_SEAT: Seat = seatWithRole("member") ?? SEATS[0];

/** The one person who can lift a cap, free a seat or change the plan. */
export const ACCOUNT_OWNER: Seat | undefined = seatWithRole("owner");

/** Who signs a finished pack before it leaves. Falls back to the owner,
    who can always do it, when the account has nobody in a legal seat. */
export const PACK_SIGNATORY: Seat | undefined = seatWithRole("legal") ?? ACCOUNT_OWNER;

/** Named once so a blocked control and the page it lands on agree. Rendered
    through t() with `{owner}`, exactly like the rest of the copy. */
export const OWNER_REMEDY = "Only {owner} can change this — ask them if you need it.";

export const OWNER_NAME = ACCOUNT_OWNER?.name ?? "your account owner";
export const OWNER_EMAIL = ACCOUNT_OWNER?.email ?? "";

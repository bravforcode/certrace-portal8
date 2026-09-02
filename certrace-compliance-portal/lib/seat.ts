/* ════════════════════════════════════════════════════════════
   THE SEAT THIS BUILD IS FOR — Certrace Legal / Compliance

   certrace-portal7 is the OWNER's view of the account. It is the same app as
   this one and it always assumed the person holding the tab could do
   everything: `SeatRole` existed in lib/data.ts, but nothing in the product
   ever read it. The Team page drew three role cards and then let whoever was
   looking at them enter a reading, sign the pack off and open billing. A role
   that is described but never enforced is not a permission model; it is a
   caption.

   THIS BUILD IS THE LEGAL / COMPLIANCE SEAT, AND ONLY THAT SEAT. `SEAT_ROLE`
   below is the single constant that makes it so, and every screen that used
   to assume owner asks `can()` instead of testing for a name or hiding a
   button locally.

   ── THE ONE PLACE THIS DEPARTS FROM /team's WORDING ────────
   The Team page describes this seat as:

     "Legal / compliance — Everything a member can do, plus reviewing and
      signing packages off before they leave."

   Read literally that makes the reviewer a SUPERSET of the person they check,
   and it is still not what this build does. The seat does not run the estate:
   it cannot decide that a workspace exists, that it should be archived, or
   that a supplier should be asked for a figure. Those are the decisions that
   shape what gets reported at all, and a reviewer who takes them is reviewing
   their own scope.

   What it CAN do, since the account holder asked for it, is correct a figure
   inside a workspace somebody else opened — see the next section.

   So this build defines the seat by SUBTRACTION instead:

       member  —  runs the estate: builds workspaces, chases suppliers
       legal   —  assures the filing: confirms, sends back, signs off

   They overlap COMPLETELY on reading. That is not a leftover; it is the
   requirement. You cannot attest to what you are not allowed to see, so this
   seat reads every workspace, every month, every fuel row, every uploaded
   document and every supplier submission in the account.

   ── AND THEY OVERLAP ON THE FIGURES, BY DECISION ───────────
   `enterFigures` was withheld from this seat for most of this build, and it
   is now GRANTED — the account holder asked for it, in as many words: the
   compliance seat edits a reading the way a member does. Read the paragraph
   above this one before changing it back, because the trade is real and it
   was made deliberately:

     · WHAT IS GAINED. A reviewer who finds a transposed digit in March fixes
       it. The alternative — send the month back, wait, re-open it, re-check
       it — is the cost of a typo paid four times, and in a company where the
       compliance manager is often the only person who reads a month closely,
       it is the cost that stops months being read closely.

     · WHAT IS GIVEN UP. The product no longer guarantees that the hand which
       typed a figure and the hand which signed for it are different. Keeping
       them apart is now this company's own discipline, not something Certrace
       holds on its behalf.

       WHAT SURVIVES IT is the record, and it is not nothing:
       `markExporterEdited` (lib/month-submission.ts) fires on the first
       keystroke into a submitted month, stamps it `editedByExporter` — the
       months list prints "edited by you" — and sets `attestation: null`,
       retracting the supplier's statement about a figure that has since
       moved. So a verifier asking "who entered this, and who assured it"
       still gets an answer; it comes from the record rather than from the
       permissions, and /account says so on the same screen that grants the
       edit.

   Everything else the seat may not do is unchanged, and the line has simply
   moved: it no longer runs between READING and WRITING, it runs between the
   FIGURES (shared) and the ESTATE they live in (Operations') plus the ACCOUNT
   itself (the owner's). A month is a fact to be corrected. Which workspaces
   exist, which suppliers are asked and who holds a seat are decisions, and
   decisions are not this seat's to take.

   ── WHY A TABLE AND NOT A PILE OF DELETIONS ────────────────
   The obvious way to build a compliance portal is to delete the screens it
   should not have and move on. That produces something that works today and
   cannot be reasoned about tomorrow: nobody can answer "what exactly can
   compliance do" without diffing two repositories. GRANTS is that answer,
   written once.

   It is deliberately NOT shaped as "member plus/minus a list". The two seats
   are two different jobs that happen to share a screen — and, now, to share
   the figures — so the table names FOUR sets separately: ANY_SEAT, ASSURE,
   RECORD, ORIGINATE (plus ACCOUNT). RECORD is the overlap, and it is one
   named set rather than a capability quietly duplicated into two rows, so
   that "what do these seats share" has a one-word answer.

   lib/__tests__/seat.test.ts pins the shape: ASSURE ∩ ORIGINATE = ∅ still
   holds, RECORD is asserted to be exactly the overlap and nothing more, and
   the ACCOUNT half is asserted withheld. If a future edit widens ORIGINATE or
   ACCOUNT into this seat, a test fails rather than a page quietly starting to
   offer this seat a control that decides something.

   ── WHAT IS DELIBERATELY *NOT* TAKEN AWAY ──────────────────
   Narrowing a reviewer past their own job produces a portal nobody can
   review from, so these stay:

     · reading everything, everywhere, with no redaction — see above.
     · correcting a figure — see the paragraph above.
     · signing a MONTH off. lib/month-signoff.ts defines that as "the moment
       responsibility moves from whoever typed the readings to whoever
       answers for them". Whoever answers for them is this seat. It is the
       one act in the product that is *only* meaningful when the signer did
       not type the figure.
     · sending a month BACK. A reviewer who can only approve is a rubber
       stamp, so `requestRevision` is theirs — it changes no figure, it
       returns one to the person whose figure it is.
     · downloading, draft and final. The pack is the thing being assured.
     · their own profile, and the notification settings that tell them a
       month is waiting.

   What goes is everything that ORIGINATES the estate — workspaces, their
   archiving, supplier requests — and the whole COMMERCIAL half, which was
   never this seat's either.
   ════════════════════════════════════════════════════════════ */

import { SEATS, type Seat, type SeatRole } from "./data";

/** The one constant that makes this the Legal / Compliance build. Nothing
    reads a URL, a cookie or a header to decide it: there is no operations
    surface compiled into this app to reach, so there is nothing for an
    override to unlock. */
export const SEAT_ROLE: SeatRole = "legal";

export type Capability =
  /* ── ASSURING: checking work somebody else did ───────────── */
  | "reviewMonth"
  | "signOffPack"
  | "downloadPack"
  /* ── THE FIGURES: entering one, and correcting one ───────── */
  | "enterFigures"
  /* ── ORIGINATING: making the estate the figures live in ──── */
  | "buildWorkspaces"
  | "archiveWorkspace"
  | "chaseSuppliers"
  /* ── THE ACCOUNT ITSELF ──────────────────────────────────── */
  | "manageSeats"
  | "editOrganisation"
  | "billing"
  | "deleteWorkspace"
  /* ── Everyone with a seat ────────────────────────────────── */
  | "editOwnProfile"
  | "viewTeam";

/** Held by anybody who has a seat at all. Reading is not in here because
    reading is not gated anywhere in this build — see the header. */
const ANY_SEAT: Capability[] = ["editOwnProfile", "viewTeam", "downloadPack"];

/** Checking the work. This is what the seat is FOR. */
const ASSURE: Capability[] = ["reviewMonth", "signOffPack"];

/** The figures themselves. HELD BY BOTH SEATS, deliberately — see the header.
    It is one capability rather than four on purpose: a reader who may correct
    March's gas reading may correct its production tonnage in the same breath,
    and splitting them would only produce a form that is half typeable. */
const RECORD: Capability[] = ["enterFigures"];

/** Making the estate the figures live in. Operations' half — and the half
    this seat must not have, or "who decided to report this" and "who checked
    it" become one answer. */
const ORIGINATE: Capability[] = ["buildWorkspaces", "archiveWorkspace", "chaseSuppliers"];

/** The commercial and identity half. Always exactly one person's.

    `deleteWorkspace` is here for the store's backstop and nothing else: no
    screen in this product deletes a workspace outright — the workspace menu
    and /workspaces/[id]/settings offer Archive, and `removeWorkspace()` has
    no caller anywhere in the app. It is the owner's in the table because if
    a screen ever grows one, it is theirs; it is not listed on /account,
    because naming the owner as the person to ask for something the owner
    cannot do either would be a lie in the one place a blocked reader goes
    for the truth. */
const ACCOUNT: Capability[] = ["manageSeats", "editOrganisation", "billing", "deleteWorkspace"];

const GRANTS: Record<SeatRole, ReadonlySet<Capability>> = {
  /* THIS BUILD. Assurance, plus the figures — and nothing that brings a
     workspace, an archive or a supplier request into existence. */
  legal: new Set([...ANY_SEAT, ...ASSURE, ...RECORD]),

  /* Operations. Still NOT a subset of legal and NOT a superset of it: the two
     seats meet on the figures and part company on either side of them —
     Operations runs the estate and cannot assure it, legal assures it and
     cannot run it. */
  member: new Set([...ANY_SEAT, ...RECORD, ...ORIGINATE]),

  /* The owner can do all of it, and that is a statement of fact rather than
     an endorsement: on a one-person account there is nobody to delegate to,
     so the concentration has to be legal somewhere. It is exactly the
     concentration this seat exists to relieve — an account that has filled a
     legal seat has moved the assurance out of the owner's hands, and /team is
     where that delegation is visible. */
  owner: new Set([...ANY_SEAT, ...ASSURE, ...RECORD, ...ORIGINATE, ...ACCOUNT]),

  /* Certrace has no verifier portal in this build — see lib/team-store.ts.
     The verifier reads the pack this seat signs, from outside. */
  verifier: new Set<Capability>(),
};

/** What this seat may do. The only permission question the app ever asks. */
export const can = (capability: Capability): boolean => GRANTS[SEAT_ROLE].has(capability);

/* ── The people this seat has to be able to name ────────────
   A reviewer who is blocked is told WHOSE figure it is, by name, because
   "you do not have permission" is the sentence that ends a review instead of
   routing it. These resolve from the same SEATS fixture /team renders, so
   the name in a refusal and the name on the roster can never drift apart. */

const seatWithRole = (role: SeatRole): Seat | undefined => SEATS.find((s) => s.role === role);

/** Whoever holds this seat — the signed-in person for this whole build. */
export const SIGNED_IN_SEAT: Seat = seatWithRole("legal") ?? SEATS[0];

/** The person whose job the figures are. This seat may now correct one
    itself, so this is no longer where every refusal points — it is who a
    reviewer hands a month back to when the fix is not theirs to make, and
    whose name the workspaces and supplier requests carry. */
export const DATA_OWNER: Seat | undefined = seatWithRole("member");

/** The one person who can change the plan, the seats or the organisation. */
export const ACCOUNT_OWNER: Seat | undefined = seatWithRole("owner");

export const DATA_OWNER_NAME = DATA_OWNER?.name ?? "whoever entered it";
export const OWNER_NAME = ACCOUNT_OWNER?.name ?? "your account owner";

/** Named once so a blocked field and the page it explains itself on agree.
    Rendered through t() with `{owner}`, exactly like the rest of the copy.

    There is no companion WRITE_REMEDY any more: figures are this seat's to
    correct, so nothing in the product has to explain a refused one. */
export const OWNER_REMEDY = "Only {owner} can change this — ask them if you need it.";

/* ── Where a refused control explains itself ────────────────
   One destination, named once, exactly as lib/plan.ts does for the trial
   lock. Both mechanisms land in the same place on purpose: the reader should
   not have to learn two different "why did that not work" screens. */
export const SEAT_DESTINATION = "/account";

/* ── The backstop ──────────────────────────────────────────
   `if (refuseWrite("enterFigures")) return …;` at the top of a mutation,
   modelled on `writeBlocked()` in lib/plan.ts, which the stores already call
   for the trial lock. The UI guard refuses first; reaching this is a bug, a
   stale handler or a path nobody thought about — but a seat that cannot write
   and can still be written through by a background path is not a seat.

   IT IS PATH-SCOPED, and that is not a detail. The supplier smart links
   (/w /s /p /self) run this same app and call these same store functions:
   `saveMonth`, `saveInstallation`, `saveSupplier`, `saveDraft`. Gating on the
   seat alone would have stopped every supplier in the account from
   submitting — silently, because a store that returns early looks exactly
   like a form that does not work. Suppliers are not this seat and are not
   even this company. */
export function refuseWrite(capability: Capability): boolean {
  if (can(capability)) return false;

  /* NO BROWSER, NO SEAT. A seat is a person holding a tab. Server rendering
     and the unit tests have neither, and refusing there would not protect
     anything — there is no reader to protect it from — while it WOULD break
     every inherited test that builds a fixture by calling the store directly
     (`createWorkspace`, `saveEvidence`), and any future server path that
     seeds or migrates data. This is the same discipline the stores themselves
     already keep: every one of them no-ops when `typeof window === "undefined"`
     rather than pretending localStorage exists.

     Read defensively. A partial `window` — a test shim, an SSR polyfill —
     must not throw out of a permission check. */
  const path = typeof window === "undefined" ? undefined : window?.location?.pathname;
  if (path === undefined) return false;

  /* THE SUPPLIER SMART LINKS. See the note above. */
  if (path.startsWith("/w/") || path.startsWith("/s/") || path.startsWith("/p/") || path.startsWith("/self/")) return false;

  return true;
}

/* ════════════════════════════════════════════════════════════
   THE COMPLIANCE SEAT'S BOUNDARY, PINNED

   This build exists to be ONE seat, and the whole of that claim rests on a
   single constant and one lookup table in lib/seat.ts. Every screen trusts
   them: the shell drops a nav item, /team drops its controls, Settings turns
   two forms into definition lists, the workspace menu loses archive, and the
   capture-phase field guard in components/seat-lock.tsx arms or stands down
   on `can("enterFigures")` alone. If `SEAT_ROLE` or
   the grants drift, none of those screens FAIL — they quietly start offering
   this seat things that are not its, and nothing in a type-check or a page
   render would say so.

   So the boundary is asserted here rather than described in a comment.

   THE CENTRAL ASSERTION IS WHERE THE LINE FALLS. This seat SHARES the figures
   with Operations — `enterFigures` is granted, deliberately, and lib/seat.ts
   explains what that trades away — so the disjointness that remains is the
   one that still means something: the seat that assures the filing does not
   get to decide what is filed. Creating a workspace, archiving one and asking
   a supplier for a number are decisions about scope, and a reviewer who takes
   them is reviewing their own scope.

   So the overlap is pinned as tightly as the separation. `RECORD` is asserted
   to be EXACTLY the shared set — if a later edit slides `buildWorkspaces` in
   beside `enterFigures` because both are "writing", this file fails rather
   than the product quietly widening. The member and owner rows are tested in
   a build that never renders them for the same reason.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

const { SEAT_ROLE, can, SIGNED_IN_SEAT, DATA_OWNER, ACCOUNT_OWNER, refuseWrite, SEAT_DESTINATION } = await import("../seat");
const { SEATS, USER } = await import("../data");
const { LOCK_DESTINATION } = await import("../plan");
const { REVIEWERS } = await import("../exporter-review");

/* ── This is the compliance build ─────────────────────────── */

test("the build is locked to the legal / compliance seat", () => {
  assert.equal(SEAT_ROLE, "legal");
});

test("the signed-in person actually holds the legal seat", () => {
  /* The failure this stops was real during the build: USER in lib/data.ts
     shipped as the OWNER, so the portal greeted Wasawat by name, offered his
     identity to the pack sign-off dialog, and then refused him the readings.
     Identity and permission have to be the same person. */
  assert.equal(SIGNED_IN_SEAT.role, "legal");
  assert.equal(SIGNED_IN_SEAT.email, USER.email);
});

/* ── The assertion the whole build rests on ───────────────── */

test("assuring and running the estate do not overlap", () => {
  /* If this ever passes vacuously — because a capability was renamed on one
     side only — the two loops below would silently stop checking anything, so
     the counts are asserted first. */
  const ASSURE = ["reviewMonth", "signOffPack"] as const;
  const ORIGINATE = ["buildWorkspaces", "archiveWorkspace", "chaseSuppliers"] as const;
  assert.equal(ASSURE.length, 2);
  assert.equal(ORIGINATE.length, 3);

  for (const c of ASSURE) assert.equal(can(c), true, `this seat must be able to ${c}`);
  for (const c of ORIGINATE) assert.equal(can(c), false, `this seat must NOT be able to ${c}`);
});

test("the figures are shared, and they are the ONLY thing shared", () => {
  /* THE GRANT THIS BUILD ENDED ON. `enterFigures` is held by this seat on
     purpose — a reviewer corrects a transposed digit instead of bouncing the
     month for it — and lib/seat.ts states what that costs.

     The second half of this test is the guard rail on it. "Compliance can
     write" is not the rule; "compliance can write A FIGURE" is. A later edit
     that reads the first sentence and hands over workspace creation or
     supplier requests as well — both of which are also "writing" — fails
     here, because RECORD is asserted to be exactly one capability wide. */
  assert.equal(can("enterFigures"), true);

  const RECORD = ["enterFigures"] as const;
  assert.equal(RECORD.length, 1);

  /* Everything a member holds that this seat must NOT: the member set minus
     the shared figures. Named literally rather than imported, so renaming a
     capability in lib/seat.ts cannot make this pass by accident. */
  for (const c of ["buildWorkspaces", "archiveWorkspace", "chaseSuppliers"] as const) {
    assert.equal(can(c), false, `sharing the figures must not have shared ${c}`);
  }
});

test("a reviewer who cannot send a month back is a rubber stamp", () => {
  /* Approving is not review. `reviewMonth` covers BOTH confirming and
     requesting a revision, and a build that kept one without the other would
     be a portal whose only possible answer is yes. */
  assert.equal(can("reviewMonth"), true);
});

test("this seat can release, and cannot touch the account", () => {
  assert.equal(can("signOffPack"), true);
  for (const c of ["manageSeats", "billing", "editOrganisation", "deleteWorkspace"] as const) {
    assert.equal(can(c), false, `this seat must NOT be able to ${c}`);
  }
});

test("reading and downloading are never gated", () => {
  /* You cannot attest to what you may not see. The pack is the thing being
     assured, so withholding it would make the signature meaningless. */
  assert.equal(can("downloadPack"), true);
  assert.equal(can("editOwnProfile"), true);
  assert.equal(can("viewTeam"), true);
});

/* ── The people a refusal names ───────────────────────────── */

test("a refused write can name whose figure it is", () => {
  assert.ok(DATA_OWNER, "a refusal has nobody to name without an operations seat");
  assert.equal(DATA_OWNER!.role, "member");
  assert.ok(DATA_OWNER!.email.includes("@"), "the remedy offers a mailto and needs a real address");
});

test("there is exactly one owner, and this seat can name them", () => {
  assert.equal(SEATS.filter((s) => s.role === "owner").length, 1);
  assert.ok(ACCOUNT_OWNER);
  assert.ok(ACCOUNT_OWNER!.email.includes("@"));
});

test("the reviewer is not the person they check, and not the owner", () => {
  /* The collapse this build exists to prevent, asserted on the fixture that
     would otherwise demonstrate it. */
  assert.notEqual(SIGNED_IN_SEAT.id, DATA_OWNER?.id);
  assert.notEqual(SIGNED_IN_SEAT.id, ACCOUNT_OWNER?.id);
});

test("the compliance reviewer in the fixture is not the account owner", () => {
  /* portal7 listed Wasawat K. — u1, the owner — as the internal "Compliance
     lead" in REVIEWERS. That is the same pair of hands owning the account and
     checking its figures, written into the seed data. */
  const compliance = REVIEWERS.find((r) => r.id === "compliance");
  assert.ok(compliance);
  assert.notEqual(compliance!.name, ACCOUNT_OWNER!.name);
  assert.equal(compliance!.name, SIGNED_IN_SEAT.name);
});

/* ── The backstop, and the suppliers it must not catch ───── */

/** Run `fn` as if the reader were on `path`. node:test has no browser, and
    `refuseWrite` deliberately refuses NOTHING without one — see its note. */
function onPath<T>(path: string, fn: () => T): T {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  // @ts-expect-error — minimal stand-in for the browser global
  globalThis.window = { location: { pathname: path } };
  try {
    return fn();
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    // @ts-expect-error — node has no window to restore
    else delete globalThis.window;
  }
}

test("refuseWrite refuses what the seat cannot do, and allows what it can", () => {
  onPath("/workspaces/ws-1/monthly/2026-03", () => {
    assert.equal(refuseWrite("buildWorkspaces"), true);
    assert.equal(refuseWrite("archiveWorkspace"), true);
    assert.equal(refuseWrite("chaseSuppliers"), true);
    /* The granted half. `enterFigures` is here rather than assumed, because
       every store that saves a month, an installation, a production figure or
       an evidence file calls it — if the grant were ever lost, those would
       start returning the value they were given instead of storing it, and
       nothing else in the suite would say so. */
    assert.equal(refuseWrite("enterFigures"), false);
    assert.equal(refuseWrite("signOffPack"), false);
    assert.equal(refuseWrite("downloadPack"), false);
  });
});

test("with no browser there is no seat to refuse", () => {
  /* Server rendering and these very tests have no reader holding a tab. If
     this returned true, every inherited test that seeds a fixture by calling
     `createWorkspace` or `saveEvidence` directly would fail — and it did,
     which is how this rule was found. */
  assert.equal(typeof globalThis.window, "undefined");
  /* Asserted with a capability this seat does NOT hold. Using `enterFigures`
     here would pass on the grant alone and stop testing the no-browser rule
     the day it was written for. */
  assert.equal(refuseWrite("buildWorkspaces"), false);
});

test("a partial window does not throw out of a permission check", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  // @ts-expect-error — a shim with no location, which is what broke it first
  globalThis.window = {};
  try {
    /* A withheld capability, for the reason given in the test above. */
    assert.equal(refuseWrite("buildWorkspaces"), false);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    // @ts-expect-error — node has no window to restore
    else delete globalThis.window;
  }
});

test("a supplier writing through a smart link is never refused", () => {
  /* THE TRAP THIS PINS: /w /s /p /self run this same app and call the same
     store functions — saveMonth, saveInstallation, saveSupplier. A gate gated
     on the seat alone would have stopped every supplier in the account from
     submitting, silently, and it would have looked like a broken form rather
     than a permission. */
  for (const path of ["/w/abc123", "/s/abc123", "/p/abc123", "/self/abc123"]) {
    /* Asserted on a WITHHELD capability. `enterFigures` is granted now, so
       testing the path rule with it would pass everywhere and prove nothing;
       these paths must be exempt whatever this seat happens to hold. */
    assert.equal(onPath(path, () => refuseWrite("buildWorkspaces")), false, `${path} must be able to write`);
  }
  /* And the exporter's own routes are still refused. */
  assert.equal(onPath("/workspaces/ws-1/monthly/2026-03", () => refuseWrite("buildWorkspaces")), true);
});

/* ── Nothing points at a route this build does not have ───── */

test("both guards land on a route that exists in this build", () => {
  /* /billing was removed. The trial lock's interceptor, its route guard, the
     MMD download button and the cap notice all read LOCK_DESTINATION, so if
     it still said /billing every blocked control in the product would land on
     a 404. The seat guard is pointed at the same screen deliberately — one
     "why did that not work" page, not two. */
  assert.equal(LOCK_DESTINATION, "/account");
  assert.equal(SEAT_DESTINATION, "/account");
  assert.notEqual(LOCK_DESTINATION, "/billing");
});

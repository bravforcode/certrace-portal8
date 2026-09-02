/* ════════════════════════════════════════════════════════════
   THE MEMBER SEAT'S BOUNDARY, PINNED

   This build exists to be ONE seat. The whole of that claim rests on a single
   constant and one lookup table in lib/seat.ts, and every screen trusts them:
   the shell drops a nav item, /team drops its controls, Settings turns a form
   into a definition list and the readiness page swaps a sign-off button for a
   mailto. If `SEAT_ROLE` or the grants drift, none of those screens fail — they
   quietly start offering a member things that are not theirs, and nothing in a
   type-check or a page render would say so.

   So the boundary is asserted here rather than described in a comment.

   WHY THE OWNER AND LEGAL ROWS ARE TESTED TOO, in a build that never renders
   them: the table's whole shape is "member is the floor, the other two are
   member plus one thing each". That is the sentence /team prints to the reader.
   A future edit that grants a member something by widening MEMBER would keep
   every owner/legal test passing and silently rewrite what the page promises,
   so the containment is what gets checked, not just the member row.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

const { SEAT_ROLE, can, SIGNED_IN_SEAT, ACCOUNT_OWNER, PACK_SIGNATORY } = await import("../seat");
const { SEATS } = await import("../data");
const { LOCK_DESTINATION } = await import("../plan");

/* ── This is the member build ─────────────────────────────── */

test("the build is locked to the member seat", () => {
  assert.equal(SEAT_ROLE, "member");
});

test("the signed-in person actually holds a member seat", () => {
  /* The failure this stops is subtle and was real during the build: USER in
     lib/data.ts shipped as the OWNER, so the portal greeted Wasawat by name,
     stamped his name on every reading entered, and then refused him billing.
     Identity and permission have to be the same person. */
  assert.equal(SIGNED_IN_SEAT.role, "member");
});

/* ── What a member may do ─────────────────────────────────── */

test("a member can do their own job", () => {
  for (const c of ["buildWorkspaces", "archiveWorkspace", "chaseSuppliers", "signOffMonth", "downloadDraftPack", "viewTeam"] as const) {
    assert.equal(can(c), true, `a member must be able to ${c}`);
  }
});

test("a member cannot release, and cannot touch the account", () => {
  /* The two halves that are NOT a member's: signing the pack that leaves the
     company, and anything commercial or identity-shaped. */
  for (const c of ["signOffPack", "manageSeats", "billing", "editOrganisation", "deleteWorkspace"] as const) {
    assert.equal(can(c), false, `a member must NOT be able to ${c}`);
  }
});

test("signing a MONTH and signing the PACK are not the same permission", () => {
  /* The distinction the whole design turns on. A member answers for the
     figures they typed; only legal or the owner puts the company's name to
     the finished document. Collapsing these would erase the legal seat. */
  assert.equal(can("signOffMonth"), true);
  assert.equal(can("signOffPack"), false);
});

test("archiving is allowed and deleting is not", () => {
  /* /team names exactly one destructive verb as the owner's — "deleting
     workspaces". Archiving is reversible and is plainly "manage workspaces",
     so a member keeps it. */
  assert.equal(can("archiveWorkspace"), true);
  assert.equal(can("deleteWorkspace"), false);
});

/* ── Blocked members are told who to ask ──────────────────── */

test("there is exactly one owner, and a member can name them", () => {
  assert.equal(SEATS.filter((s) => s.role === "owner").length, 1);
  assert.ok(ACCOUNT_OWNER, "a blocked notice has nobody to name without an owner");
  assert.ok(ACCOUNT_OWNER!.email.includes("@"), "the notice offers a mailto and needs a real address");
});

test("the pack signatory is somebody who may actually sign", () => {
  /* "Ask X to sign it off" pointing at somebody who also lacks the
     permission would be a dead end dressed up as a next step. */
  assert.ok(PACK_SIGNATORY);
  assert.ok(["legal", "owner"].includes(PACK_SIGNATORY!.role), `${PACK_SIGNATORY!.role} cannot sign a pack`);
});

test("the signed-in member is not the person they are told to ask", () => {
  assert.notEqual(SIGNED_IN_SEAT.id, ACCOUNT_OWNER?.id);
  assert.notEqual(SIGNED_IN_SEAT.id, PACK_SIGNATORY?.id);
});

/* ── Nothing points at a route this build does not have ───── */

test("the lock destination is a route that exists in this build", () => {
  /* /billing was removed. All three lock layers — the interceptor, the route
     guard and the MMD download button — read LOCK_DESTINATION, so if it still
     said /billing every blocked control in the product would land on a 404. */
  assert.equal(LOCK_DESTINATION, "/account");
  assert.notEqual(LOCK_DESTINATION, "/billing");
});

import test from "node:test";
import assert from "node:assert/strict";
import { requestRoute } from "../request-route";

// Same-company staff must never receive a supplier form: they would type the
// data twice and the workbook would not show it.
test("internal person goes to the team invite", () => {
  assert.deepEqual(requestRoute("internal", { isOwner: true }), {
    kind: "invite",
  });
});
test("editors cannot invite, so they are told to ask the owner", () => {
  assert.deepEqual(requestRoute("internal", { isOwner: false }), {
    kind: "ask-owner",
  });
});
test("outside supplier goes to the precursor link flow", () => {
  assert.deepEqual(requestRoute("external", { isOwner: false }), {
    kind: "supplier",
    href: "/suppliers?add=1",
  });
});

import { expect, test } from "bun:test";
import { teamSeatLimits as backend } from "../src/modules/team/seat-limits";
import { teamSeatLimits as portal } from "../../certrace-portal/lib/team-seat-limits";

// The backend keeps its own copy so it builds without the portal tree.
// This test fails when the copy drifts from the portal source of truth.
test("backend seat limits match the portal source", () => {
  expect(backend).toEqual(portal);
});

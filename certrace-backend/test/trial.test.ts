import { expect, test } from "bun:test";
import { trialEnded, trialEndsAt } from "../src/modules/auth/trial";

const start = new Date("2026-11-01T00:00:00Z");

test("trial lasts exactly 30 days", () => {
  expect(trialEndsAt({ trial_started_at: start }).toISOString()).toBe("2026-12-01T00:00:00.000Z");
});

test("ended only on plan trial after the end instant", () => {
  const u = { plan_id: "trial", trial_started_at: start };
  expect(trialEnded(u, new Date("2026-11-30T23:59:59Z"))).toBe(false);
  expect(trialEnded(u, new Date("2026-12-01T00:00:00Z"))).toBe(true);
  expect(trialEnded({ ...u, plan_id: "standard" }, new Date("2030-01-01"))).toBe(false);
});

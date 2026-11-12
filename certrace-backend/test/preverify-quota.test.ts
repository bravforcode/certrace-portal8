import { describe, expect, test } from "bun:test";
import { PREVERIFY_QUOTA, quotaUsed } from "../src/modules/preverify/checks";

const error = { severity: "error" as const, message: "missing CN code" };
const warn = { severity: "warn" as const, message: "check the unit" };

describe("pre-verification quota", () => {
  test("a plan includes three pre-verifications", () => {
    // The Convert page shows "n of 3 left" and the server refuses the fourth; both read this number.
    expect(PREVERIFY_QUOTA).toBe(3);
  });

  test("a submission the AI sent back does not use the quota", () => {
    // The customer fixes the flagged fields and resubmits; only a workbook that reached the team costs a use.
    expect(quotaUsed([{ status: "ai_flagged", ai_findings: [error] }])).toBe(0);
  });

  test("submissions that reached the team use the quota, whatever happened next", () => {
    expect(
      quotaUsed([
        { status: "team_review", ai_findings: [] },
        { status: "approved", ai_findings: [warn] },
        { status: "changes_requested", ai_findings: [] },
      ]),
    ).toBe(3);
  });

  test("a superseded submission counts only if its findings sent it to the team", () => {
    // Superseded hides the original status; the stored findings decide it the same way submit() did.
    expect(
      quotaUsed([
        { status: "superseded", ai_findings: [warn] },
        { status: "superseded", ai_findings: [error] },
      ]),
    ).toBe(1);
  });
});

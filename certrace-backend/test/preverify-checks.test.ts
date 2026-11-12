import { describe, expect, test } from "bun:test";
import { decideStatus, runChecks, type CatalogueField, type Finding } from "../src/modules/preverify/checks";

const has = (findings: Finding[], field: string, severity: Finding["severity"]) =>
  findings.some((f) => f.field === field && f.severity === severity);

describe("pre-verification deterministic checks", () => {
  test("a negative emission is an error because emissions cannot be below zero", () => {
    // Total CO2 emissions (c-h26) is a tCO2e catalogue number; a minus sign is a keying error the team must not approve.
    expect(has(runChecks({ "cbam:0:c-h26": "-5" }), "c-h26", "error")).toBe(true);
  });

  test("a share above 100 is an error because a percentage cannot exceed the whole", () => {
    // No catalogue field is a share yet, so the rule is tested against a synthetic field carrying the same label rule.
    const fields: CatalogueField[] = [
      { key: "x-share", label: "Share of output", section: "Goods", cell: "cbam:0:x-share", kind: "number" },
    ];
    expect(has(runChecks({ "cbam:0:x-share": "120" }, fields), "x-share", "error")).toBe(true);
  });

  test("valid data produces no findings so the customer is not blocked for correct answers", () => {
    // A clean reporting period and a positive emission must pass, or every honest submission would be flagged.
    const cells = {
      "cbam:0:a-i9": "2026-01-01",
      "cbam:0:a-l9": "2026-12-31",
      "cbam:0:c-h26": "120.5",
    };
    expect(runChecks(cells)).toEqual([]);
  });

  test("a reporting period starting after its end is an error because the period cannot be reversed", () => {
    // The end date is the field to fix, so the error is attached to it for the customer to find.
    const findings = runChecks({ "cbam:0:a-i9": "2026-12-31", "cbam:0:a-l9": "2026-01-01" });
    expect(has(findings, "a-l9", "error")).toBe(true);
  });

  test("a process with answers but no name is a warning because a half-filled block is likely a mistake", () => {
    // Production process 1 · Name is empty while another answer in that process is filled, so the reviewer should look.
    const findings = runChecks({ "cbam:0:a-e83": "Cement" });
    expect(findings.some((f) => f.field === "a-l83" && f.severity === "warn")).toBe(true);
  });
});

describe("pre-verification status rule", () => {
  test("any error sends the submission to the AI flag state so bad data never reaches the team unflagged", () => {
    // An error from either source must block the team review, so the status is ai_flagged.
    expect(decideStatus([{ severity: "error", message: "x" }])).toBe("ai_flagged");
  });

  test("warnings alone still go to the team because a warning is a prompt to look, not a block", () => {
    // Warnings must not stop a submission that the team can still judge.
    expect(decideStatus([{ severity: "warn", message: "x" }])).toBe("team_review");
  });

  test("clean data goes straight to the team because the AI check found nothing to block it", () => {
    // No findings means the submission is ready for the manual check.
    expect(decideStatus([])).toBe("team_review");
  });
});

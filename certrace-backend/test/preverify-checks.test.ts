import { describe, expect, test } from "bun:test";
import { catalogueCells, decideStatus, runChecks, type Finding } from "../src/modules/preverify/checks";
import { AI_UNAVAILABLE_MESSAGE, parseReviewText, unavailableReview } from "../src/modules/preverify/review";

const has = (findings: Finding[], field: string, severity: Finding["severity"]) =>
  findings.some((f) => f.field === field && f.severity === severity);

describe("pre-verification deterministic checks", () => {
  test("a negative emission is an error because emissions cannot be below zero", () => {
    // Total CO2 emissions (c-h26) is a tCO2e catalogue number; a minus sign is a keying error the team must not approve.
    expect(has(runChecks({ "cbam:0:c-h26": "-5" }), "c-h26", "error")).toBe(true);
  });

  test("valid data produces no findings so correct submissions are not blocked", () => {
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

  test("an impossible date such as 2026-02-30 is an error because Date would silently roll it over", () => {
    // A round-trip check catches dates that JavaScript would otherwise accept as a different day.
    expect(has(runChecks({ "cbam:0:a-i9": "2026-02-30" }), "a-i9", "error")).toBe(true);
  });

  test("a process with answers but no name is a warning because a half-filled block is likely a mistake", () => {
    // Production process 1 · Name is empty while another answer in that process is filled, so the reviewer should look.
    const findings = runChecks({ "cbam:0:a-e83": "Cement" });
    expect(findings.some((f) => f.field === "a-l83" && f.severity === "warn")).toBe(true);
  });
});

describe("pre-verification catalogue cell filter", () => {
  test("keys that are not catalogue cells are dropped so stale data cannot pass the empty check", () => {
    // A workbook can keep cells for fields the catalogue no longer has; those must not count as an answer.
    expect(catalogueCells({ "cbam:0:zz-stale": "1", "other:0:a-i9": "x", "cbam:0:a-i9": "2026-01-01" })).toEqual({
      "cbam:0:a-i9": "2026-01-01",
    });
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

describe("pre-verification AI review seam", () => {
  test("a JSON reply wrapped in prose is still read, and unknown field keys are dropped", () => {
    // Text-mode models wrap JSON in prose or fences. An invented field key must not reach the customer as a link.
    const reply = 'Here you go:\n```json\n{"summary":"Looks fine.","findings":[{"severity":"warn","field":"made-up","message":"Check the total."}]}\n```';
    expect(parseReviewText(reply)).toEqual({
      summary: "Looks fine.",
      findings: [{ severity: "warn", message: "Check the total." }],
    });
  });

  test("a reply with no JSON object is treated as unparseable so it cannot pass as an empty review", () => {
    // Prose with no object must not come back as a successful review with zero findings.
    expect(parseReviewText("I cannot help with that.")).toBeNull();
  });

  test("an unavailable AI review says so as a warning, so a silent empty review cannot pass for a clean one", () => {
    // The team must be able to tell an AI that found nothing from an AI that never ran.
    const review = unavailableReview();
    expect(review.model).toBeNull();
    expect(review.findings).toEqual([{ severity: "warn", message: AI_UNAVAILABLE_MESSAGE }]);
    expect(review.summary).toBe(AI_UNAVAILABLE_MESSAGE);
  });
});

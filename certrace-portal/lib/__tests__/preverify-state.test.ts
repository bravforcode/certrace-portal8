/* The customer's pre-verification state decides what Convert shows and whether Submit is allowed. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { preverifyState, type PreverificationView } from "../api/preverifications";

const sub = (status: PreverificationView["status"], workbookRevision = 3): PreverificationView => ({
  id: "p1",
  installationId: "i1",
  year: 2026,
  standardId: "cbam",
  status,
  workbookRevision,
  aiFindings: [],
  aiSummary: null,
  aiModel: null,
  teamNote: null,
  submittedAt: "2026-11-12T00:00:00.000Z",
  reviewedAt: null,
});

test("no submission yet: incomplete until every requirement is complete", () => {
  // Submit must stay closed while requirements are open, so the server never sees a half-filled workbook.
  assert.equal(preverifyState(null, 0, false), "incomplete");
  assert.equal(preverifyState(null, 0, true), "ready");
});

test("a superseded submission does not block a new one", () => {
  // Superseded means a newer submission replaced it, so the customer may submit again.
  assert.equal(preverifyState(sub("superseded"), 3, true), "ready");
  assert.equal(preverifyState(sub("superseded"), 3, false), "incomplete");
});

test("flagged on the same revision shows the findings to fix", () => {
  // The data has not moved since the AI check, so its findings still describe what the customer must fix.
  assert.equal(preverifyState(sub("ai_flagged", 3), 3, true), "flagged");
});

test("flagged with a changed revision is ready to resubmit, but only when complete", () => {
  // A changed workbook may have fixed the flags, so the customer resubmits rather than reading old findings.
  assert.equal(preverifyState(sub("ai_flagged", 3), 4, true), "ready");
  assert.equal(preverifyState(sub("ai_flagged", 3), 4, false), "incomplete");
});

test("team review on the same revision is waiting for the team", () => {
  // Nothing has changed, so the Certrace team still has the submission to decide.
  assert.equal(preverifyState(sub("team_review", 3), 3, true), "in_review");
});

test("approved, in review or changes requested on a changed revision is stale", () => {
  // The team decided on data the customer has since changed, so the decision no longer applies.
  assert.equal(preverifyState(sub("team_review", 3), 4, true), "stale");
  assert.equal(preverifyState(sub("approved", 3), 4, true), "stale");
  assert.equal(preverifyState(sub("changes_requested", 3), 4, true), "stale");
});

test("approved and changes requested on the same revision show the team's outcome", () => {
  // The result stands while the data is unchanged, so the customer sees the team's verdict.
  assert.equal(preverifyState(sub("approved", 3), 3, true), "approved");
  assert.equal(preverifyState(sub("changes_requested", 3), 3, true), "changes_requested");
});

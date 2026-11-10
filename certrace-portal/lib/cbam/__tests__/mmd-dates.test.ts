import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarYear, emptyBoundary } from "../boundary";
import { emptyDataset } from "../activity";
import { diffVersions, emptyDraft, generateMmd } from "../mmd";

const period = calendarYear(2026);
const content = generateMmd({
  declarationId: "decl",
  installation: {
    installationName: "Plant",
    operator: "Operator",
    country: "Thailand",
    address: "Test site",
    unlocode: "",
    coordinates: "",
  },
  boundary: emptyBoundary("decl"),
  period,
  dataset: emptyDataset("decl", period, "Owner"),
  gaps: [],
  draft: emptyDraft("decl"),
});

test("backend timestamp serialization cannot make a finalised methodology appear edited", () => {
  const stored = structuredClone(content);
  stored.period.start = "2026-01-01T00:00:00.000Z";
  stored.period.end = "2026-12-31T00:00:00.000Z";
  assert.deepEqual(diffVersions(stored, content), []);
});

test("a real change to the methodology reporting day still appears in the version history", () => {
  const changed = structuredClone(content);
  changed.period.end = "2026-12-30T00:00:00.000Z";
  assert.deepEqual(diffVersions(content, changed), [
    {
      section: "period",
      field: "end",
      before: "2026-12-31",
      after: "2026-12-30",
    },
  ]);
});

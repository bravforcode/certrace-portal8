import test from "node:test";
import assert from "node:assert/strict";
import {
  applySheetEdit,
  emptyInstallation,
  installationErrors,
  REQUIRED_INSTALLATION_KEYS,
  startSheetEdit,
  type Installation,
} from "../installations";
import { installationGaps, installationSheetStatus } from "../workbook/status";

const site = (over: Partial<Installation> = {}): Installation => ({
  ...emptyInstallation(),
  id: "TH-RAYONG-01",
  name: "Rayong Rolling Mill 2",
  street: "1 Moo 2",
  postcode: "21150",
  city: "Rayong",
  country: "TH",
  unlocode: "THRYG",
  lat: "12.7",
  lng: "101.2",
  ...over,
});

// A rejected value must never reach the store: not on its own save, and not on a
// later valid edit to another field of the same site.
test("a rejected latitude is never saved, even after later valid edits", () => {
  let s = startSheetEdit(site());
  s = applySheetEdit(s, "lat", "95");
  assert.equal(s.known.lat, "12.7", "the bad latitude is not persisted");
  assert.equal(s.draft.lat, "95", "the typist still sees what they typed");
  assert.ok(s.messages.lat, "and is told why");
  s = applySheetEdit(s, "street", "2 Moo 3");
  assert.equal(s.known.street, "2 Moo 3");
  assert.equal(s.known.lat, "12.7", "a later valid edit does not carry the rejected latitude");
  s = applySheetEdit(s, "lat", "13");
  assert.equal(s.known.lat, "13");
  assert.equal(s.messages.lat, undefined, "a valid value clears its message");
  assert.equal(s.rejected.lat, undefined);
});

test("every rejected field reverts, not only the one being edited", () => {
  let s = startSheetEdit(site());
  s = applySheetEdit(s, "lat", "95");
  s = applySheetEdit(s, "lng", "abc");
  assert.equal(s.known.lat, "12.7");
  assert.equal(s.known.lng, "101.2");
  s = applySheetEdit(s, "city", "Chonburi");
  assert.equal(s.known.city, "Chonburi");
  assert.equal(s.known.lat, "12.7", "lat stays reverted after an unrelated valid edit");
  assert.equal(s.known.lng, "101.2", "lng stays reverted after an unrelated valid edit");
});

// An empty value is missing data, not bad data: it is saved and the tab says so.
test("an empty value is never rejected; it persists and reads as missing", () => {
  let s = startSheetEdit(site());
  s = applySheetEdit(s, "street", "");
  assert.equal(s.known.street, "");
  assert.equal(s.messages.street, undefined);
  assert.equal(installationSheetStatus(s.known), "missing");
});

test("a half-entered coordinate pair is saved as missing, not rejected", () => {
  let s = startSheetEdit(site());
  s = applySheetEdit(s, "lat", "");
  assert.equal(s.known.lat, "");
  assert.equal(s.messages.lat, undefined);
  // Typing the second box while the first is empty is a half pair, not a rejection.
  s = applySheetEdit(s, "lng", "101.2");
  assert.equal(s.known.lng, "101.2");
  assert.equal(s.messages.lng, undefined);
});

// A saved record that replaces the draft is the new baseline; the stale rejected
// value and its message go with it.
test("a replaced draft starts clean: no rejected values, no messages", () => {
  const rejectedDraft = applySheetEdit(startSheetEdit(site()), "lat", "95");
  assert.ok(rejectedDraft.messages.lat);
  const fresh = startSheetEdit(site({ lat: "13", street: "5 Moo 1" }));
  assert.equal(fresh.known.lat, "13");
  assert.equal(fresh.draft.lat, "13");
  assert.deepEqual(fresh.rejected, {});
  assert.deepEqual(fresh.messages, {});
});

// The tab count must never show 0 while the tab is missing.
test("a bad coordinate pair alone counts as one gap, so the badge is never 0", () => {
  const bad = site({ lat: "95" });
  assert.equal(installationSheetStatus(bad), "missing");
  assert.equal(installationGaps(bad), 1);
});

test("a half-entered pair counts once, not once per box", () => {
  assert.equal(installationGaps(site({ lng: "" })), 1);
  assert.equal(installationGaps(site({ lat: "", lng: "" })), 1);
});

test("the gap count matches the required fields Settings enforces", () => {
  const blank = site({ postcode: "", unlocode: "" });
  assert.equal(installationGaps(blank), 2, "postcode and UNLOCODE are required, as in Settings");
});

// One source of truth: the keys the sheet marks required are exactly the keys
// the validator reports when empty.
test("the required keys are exactly the fields Settings requires", () => {
  const e = installationErrors({ ...emptyInstallation(), id: "TH-RAYONG-01", country: "" });
  const errored = Object.keys(e).filter((k) => k !== "id" && k !== "coordinates").sort();
  assert.deepEqual(errored, [...REQUIRED_INSTALLATION_KEYS].sort());
});

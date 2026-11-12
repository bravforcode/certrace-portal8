import test from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../../api/errors";
import { classifySaveError, parseStoredFactory } from "../stored";
import { emptyProfile, type FactoryProfile } from "../profile";

const saved: FactoryProfile = {
  ...emptyProfile(),
  processes: [
    {
      id: "p1",
      name: "Annealing",
      step: "other",
      route: "",
      inBoundary: true,
      note: "",
    },
  ],
};

test("a missing stored value is an empty profile, not an unreadable one", () => {
  assert.deepEqual(parseStoredFactory(null), {
    profile: emptyProfile(),
    unreadable: false,
  });
});
test("a valid stored value is read back", () => {
  const r = parseStoredFactory(JSON.stringify(saved));
  assert.equal(r.unreadable, false);
  assert.deepEqual(r.profile.processes, saved.processes);
});
test("a stored value that fails validation is flagged, never silently emptied", () => {
  const r = parseStoredFactory(
    JSON.stringify({ version: 1, processes: "nope" }),
  );
  assert.equal(r.unreadable, true);
  assert.deepEqual(r.profile, emptyProfile());
});
test("stored text that is not JSON is flagged as unreadable", () => {
  assert.equal(parseStoredFactory("{not json").unreadable, true);
});
test("a revision conflict and a trial that ended each get their own save error", () => {
  assert.equal(
    classifySaveError(new ApiError("REVISION_CONFLICT", "changed", 409)),
    "conflict",
  );
  assert.equal(
    classifySaveError(new ApiError("TRIAL_ENDED", "ended", 403)),
    "trial",
  );
  assert.equal(classifySaveError(new ApiError("NETWORK", "offline")), "other");
  assert.equal(classifySaveError(new Error("boom")), "other");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { UPLOAD_LIMITS, uploadProblem } from "../limits";

const ok = {
  name: "a.pdf",
  type: "application/pdf",
  description: "Jan invoices",
};

test("files within every limit pass", () => {
  assert.equal(uploadProblem([ok]), null);
  assert.equal(
    uploadProblem(Array.from({ length: UPLOAD_LIMITS.files }, () => ok)),
    null,
  );
});

test("more than 200 files is refused with the maximum", () => {
  const p = uploadProblem(
    Array.from({ length: UPLOAD_LIMITS.files + 1 }, () => ok),
  );
  assert.deepEqual(p, { field: "files", max: 200 });
});

test("a name longer than 255 characters names the file", () => {
  const name = "n".repeat(UPLOAD_LIMITS.name + 1);
  assert.deepEqual(uploadProblem([{ ...ok, name }]), {
    field: "name",
    max: 255,
    file: name,
  });
});

test("a type longer than 120 characters is refused", () => {
  const p = uploadProblem([
    { ...ok, type: "t".repeat(UPLOAD_LIMITS.type + 1) },
  ]);
  assert.equal(p?.field, "type");
});

test("a description longer than 1000 characters is refused, counted untrimmed as the server counts it", () => {
  assert.equal(uploadProblem([{ ...ok, description: "d".repeat(1000) }]), null);
  const p = uploadProblem([{ ...ok, description: "d".repeat(1001) }]);
  assert.deepEqual(p, { field: "description", max: 1000, file: "a.pdf" });
  // Surrounding spaces count: 990 letters plus 11 spaces is over the limit.
  assert.equal(
    uploadProblem([{ ...ok, description: " ".repeat(11) + "d".repeat(990) }])
      ?.field,
    "description",
  );
});

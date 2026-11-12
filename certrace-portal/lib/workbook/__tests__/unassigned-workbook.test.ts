import test from "node:test";
import assert from "node:assert/strict";
import { normaliseReference } from "../../installations";
import { UNASSIGNED_WORKBOOK_ID } from "../unassigned";

/* A workspace with no installation keeps its uploads under this key on the
   server, so it has to pass the backend's workbook id pattern. It must also
   never collide with a real installation: every installation reference goes
   through normaliseReference (upper-case A-Z0-9- only), so a key that that
   function would change can never be typed in as one. */
test("the no-installation workbook key passes the backend id pattern", () => {
  assert.match(UNASSIGNED_WORKBOOK_ID, /^[A-Za-z0-9_-]{1,64}$/);
});

test("no installation reference can produce the no-installation workbook key", () => {
  assert.notEqual(
    normaliseReference(UNASSIGNED_WORKBOOK_ID),
    UNASSIGNED_WORKBOOK_ID,
  );
});

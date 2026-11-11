import { expect, test } from "bun:test";
import { sharedRecord } from "../src/modules/team/records";

// Team editors must see the same factory profile and opportunity list as the owner.
test("factory and opportunity records are shared with the company", () => {
  expect(sharedRecord("certrace:factory:abc")).toBe(true);
  expect(sharedRecord("certrace:opportunities")).toBe(true);
});

test("look-alike keys and personal keys are not shared", () => {
  expect(sharedRecord("certrace:factory")).toBe(false);
  expect(sharedRecord("certrace:opportunities-draft")).toBe(false);
  expect(sharedRecord("member:abc:chat")).toBe(false);
});

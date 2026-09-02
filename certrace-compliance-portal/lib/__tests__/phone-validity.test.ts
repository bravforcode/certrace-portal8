/* A telephone number nobody can dial.

   The dial-code picker only ever guaranteed the "+66". The subscriber half
   was free text, so "12", "n/a" and "call the office" all stored happily —
   and the failure surfaced weeks later, when the person provisioning a trial
   or a verifier reading an installation record tried to ring the contact and
   found there was no number there. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidSubscriberNumber, isValidPhone, joinPhone } from "../dial-codes";

test("a real number passes however it is punctuated", () => {
  for (const spelling of ["38123456", "38 123 456", "38-123-456", "(038) 123456", "038.123.456"]) {
    assert.equal(isValidSubscriberNumber(spelling), true, spelling);
  }
});

test("what is not a number is rejected, whatever it looks like", () => {
  assert.equal(isValidSubscriberNumber(""), false, "blank");
  assert.equal(isValidSubscriberNumber("   "), false, "whitespace");
  assert.equal(isValidSubscriberNumber("12"), false, "too short to dial");
  assert.equal(isValidSubscriberNumber("n/a"), false);
  assert.equal(isValidSubscriberNumber("call the office"), false);
  assert.equal(isValidSubscriberNumber("+66 38 123 456"), false, "the dial code belongs in the picker, not here");
});

test("E.164 is the ceiling — 14 digits after a country code, not more", () => {
  assert.equal(isValidSubscriberNumber("12345678901234"), true, "14 digits");
  assert.equal(isValidSubscriberNumber("123456789012345"), false, "15 digits is longer than any real number");
  assert.equal(isValidSubscriberNumber("123456"), true, "6 is the floor");
  assert.equal(isValidSubscriberNumber("12345"), false);
});

test("the stored form is checked without counting the country code's own digits", () => {
  // "+995" is three digits of dial code; they must not be spent against the
  // subscriber's allowance, or a long-code country loses two digits of number.
  assert.equal(isValidPhone(joinPhone("+995", "12345678901234"), "TH"), true);
  assert.equal(isValidPhone(joinPhone("+66", "38 123 456"), "TH"), true);
  assert.equal(isValidPhone("", "TH"), false, "nothing typed is not a number");
  assert.equal(isValidPhone("+66", "TH"), false, "a dial code alone is not a number");
});

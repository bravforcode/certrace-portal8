/* Client checks for the company and factory basics mirror the server
   patterns in certrace-backend profile-contract.ts. The server stays
   authoritative; these only stop a bad value before the request is sent. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { companyBasicsErrors, factoryBasicsErrors } from "../profile-basics";

test("blank optional company fields raise no errors", () => {
  assert.deepEqual(companyBasicsErrors({}), {});
});

test("a tax ID must be exactly 13 digits", () => {
  assert.equal(companyBasicsErrors({ taxId: "0105561234567" }).taxId, undefined);
  assert.equal(
    companyBasicsErrors({ taxId: "12345" }).taxId,
    "Tax ID is 13 digits",
  );
  assert.equal(
    companyBasicsErrors({ taxId: "01055612345AB" }).taxId,
    "Tax ID is 13 digits",
  );
});

test("website must be an https URL", () => {
  assert.equal(
    companyBasicsErrors({ website: "https://acme.example" }).website,
    undefined,
  );
  assert.ok(companyBasicsErrors({ website: "acme.example" }).website);
  assert.ok(companyBasicsErrors({ website: "http://acme.example" }).website);
  assert.ok(companyBasicsErrors({ website: "ftp://acme.example" }).website);
  assert.ok(companyBasicsErrors({ website: "https://" }).website);
  assert.ok(companyBasicsErrors({ website: "https://a b.example" }).website);
});

test("country is a two-letter uppercase ISO code", () => {
  assert.equal(companyBasicsErrors({ country: "TH" }).country, undefined);
  assert.ok(companyBasicsErrors({ country: "tha" }).country);
});

test("factory counts are whole numbers from 0 to 999", () => {
  assert.deepEqual(factoryBasicsErrors({ boilerCount: "0", furnaceCount: "999" }), {});
  assert.ok(factoryBasicsErrors({ boilerCount: "1000" }).boilerCount);
  assert.ok(factoryBasicsErrors({ furnaceCount: "2.5" }).furnaceCount);
});

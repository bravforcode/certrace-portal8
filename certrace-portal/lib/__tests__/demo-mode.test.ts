import { test } from "node:test";
import assert from "node:assert/strict";
import { configureApi, authUnavailable } from "../api/config";

test("the reference sample views never enable authentication without a backend", () => {
  configureApi({ baseUrl: "" });
  assert.equal(authUnavailable(), true);
  configureApi({ baseUrl: "/backend" });
  assert.equal(authUnavailable(), false);
  configureApi({ baseUrl: "" });
});

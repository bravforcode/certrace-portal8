import { expect, test } from "bun:test";
import { validateStore } from "../src/modules/reporting/storage";

const ok = { firstName: "Somchai", companyName: "ACME", taxId: "0105561234567", phone: "+66 38 123 456" };
test("valid profile passes", () => {
  expect(() => validateStore("certrace:profile", ok)).not.toThrow();
});
// Unbounded text fields let one request store megabytes in a profile shown in admin lists.
test("rejects over-long names and malformed tax ids", () => {
  expect(() => validateStore("certrace:profile", { ...ok, firstName: "x".repeat(121) })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, taxId: "12345" })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, productionModel: "other" })).toThrow();
});
test("accepts the company and factory basics", () => {
  expect(() =>
    validateStore("certrace:profile", {
      ...ok,
      website: "https://acme.example",
      country: "TH",
      employeeBand: "50-199",
      productionModel: "both",
      exportMarkets: ["EU", "JP"],
      energySources: ["electricity", "natural-gas"],
      boilerCount: "2",
      furnaceCount: "10",
      annualProductionBand: "1k-10k",
    }),
  ).not.toThrow();
});
test("rejects malformed company basics and unknown list items", () => {
  expect(() => validateStore("certrace:profile", { ...ok, website: "ftp://acme" })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, country: "tha" })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, exportMarkets: ["Europe"] })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, energySources: ["solar"] })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, boilerCount: "1000" })).toThrow();
});

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
  expect(() => validateStore("certrace:profile", { ...ok, website: "http://acme.example" })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, country: "tha" })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, exportMarkets: ["Europe"] })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, energySources: ["solar"] })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, boilerCount: "1000" })).toThrow();
});
// Onboarding sends blank strings for optional choices the user skipped; those must save.
test("accepts blank optional choices and empty lists", () => {
  expect(() =>
    validateStore("certrace:profile", {
      ...ok,
      employeeBand: "",
      productionModel: "",
      annualProductionBand: "",
      energySources: [],
    }),
  ).not.toThrow();
});
test("still rejects a wrong value for a choice field", () => {
  expect(() => validateStore("certrace:profile", { ...ok, employeeBand: "5000" })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, productionModel: "mixed" })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, annualProductionBand: "huge" })).toThrow();
});
test("website must be https with a host and no spaces", () => {
  expect(() => validateStore("certrace:profile", { ...ok, website: "https://acme.example" })).not.toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, website: "https://" })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, website: "https://a b.example" })).toThrow();
});
test("export markets are capped at 20 and must be unique", () => {
  expect(() => validateStore("certrace:profile", { ...ok, exportMarkets: ["EU", "JP", "KR", "CN", "IN", "US", "GB", "FR", "DE", "IT", "ES", "NL", "SE", "AU", "NZ", "CA", "MX", "BR", "AR", "ZA"] })).not.toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, exportMarkets: ["EU", "JP", "KR", "CN", "IN", "US", "GB", "FR", "DE", "IT", "ES", "NL", "SE", "AU", "NZ", "CA", "MX", "BR", "AR", "ZA", "EG"] })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, exportMarkets: ["EU", "EU"] })).toThrow();
});
// A blank top-level choice means "skipped"; a blank list item is a bad value and must not save.
test("rejects blank list items for enum and pattern fields", () => {
  expect(() => validateStore("certrace:profile", { ...ok, energySources: [""] })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, exportMarkets: [""] })).toThrow();
});
test("still accepts a blank top-level choice", () => {
  expect(() => validateStore("certrace:profile", { ...ok, employeeBand: "" })).not.toThrow();
});

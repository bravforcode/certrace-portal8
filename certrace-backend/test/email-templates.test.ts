import { describe, expect, test } from "bun:test";
import { renderEmail, EMAIL_KINDS } from "../src/lib/email-templates";

// Every customer-facing email must exist in Thai and English and must carry
// the link the customer needs next; a missing locale silently sends English
// to a Thai factory that cannot act on it.
describe("renderEmail", () => {
  for (const kind of EMAIL_KINDS)
    for (const locale of ["th", "en"] as const)
      test(`${kind} ${locale} has subject and body`, () => {
        const m = renderEmail(kind, locale, {
          name: "Somchai",
          company: "ACME",
          days: "7",
          email: "a@b.co",
          reason: "duplicate",
        });
        expect(m.subject.length).toBeGreaterThan(5);
        expect(m.text.length).toBeGreaterThan(20);
        expect(m.text).not.toContain("{");
      });
  test("approval links to the portal sign-in", () => {
    expect(
      renderEmail("account_approved", "en", { name: "A" }).action?.url,
    ).toMatch(/\/login$/);
  });
  test("Thai templates are written in Thai script", () => {
    for (const kind of EMAIL_KINDS) {
      const m = renderEmail(kind, "th", {
        name: "Somchai",
        days: "7",
        reason: "x",
      });
      expect(m.text).toMatch(/[฀-๿]/);
      expect(m.subject).toMatch(/[฀-๿]/);
    }
  });
  test("the recipient name is substituted into the body", () => {
    expect(
      renderEmail("application_received", "en", {
        name: "Somchai",
        company: "ACME",
      }).text,
    ).toContain("Somchai");
    expect(
      renderEmail("application_received", "th", {
        name: "Somchai",
        company: "ACME",
      }).text,
    ).toContain("Somchai");
  });
  // A value with a line break must not inject headers into the subject line.
  test("subject never contains CR or LF", () => {
    const m = renderEmail("trial_ending_7", "en", {
      name: "A",
      days: "7\r\nBcc: x@example.com",
    });
    expect(m.subject).not.toMatch(/[\r\n]/);
  });
});

import { expect, test } from "bun:test";
import { inferAutofillMonth } from "../src/modules/evidence/autofill-month";

const period = ["2026-01-01", "2026-12-31"] as const;
const infer = (text: string, filename = "report.pdf") =>
  inferAutofillMonth([{ page: 1, text }], filename, ...period);

test("an explicit English or Thai reporting month opens the matching monthly fields", () => {
  expect(infer("Monthly production report · March 2026")).toBe("2026-03");
  expect(infer("รายงานการผลิต มีนาคม พ.ศ. 2569")).toBe("2026-03");
  expect(infer("Production output for 2026-03")).toBe("2026-03");
});

test("a filename can supply the month when extracted text has none", () => {
  expect(
    infer("Finished product 4,820.5 t", "01-production-march-2026.pdf"),
  ).toBe("2026-03");
});

test("ambiguous, out-of-period, and day-specific dates do not pick a month", () => {
  expect(infer("March 2026 and April 2026", "march-2026.pdf")).toBeNull();
  expect(infer("March 2025", "march-2026.pdf")).toBeNull();
  expect(infer("Invoice date 2026-03-01")).toBeNull();
});

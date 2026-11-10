import { test } from "node:test";
import assert from "node:assert/strict";
import legalDocuments from "../legal-documents.json" with { type: "json" };
import { PRIVACY_EN } from "../legal-privacy-en";

test("every paragraph of the published Thai privacy policy has English text", () => {
  assert.equal(PRIVACY_EN.length, legalDocuments.privacy.sections.length);
  for (const [index, section] of legalDocuments.privacy.sections.entries()) {
    assert.equal(
      PRIVACY_EN[index].length,
      section.length,
      `section ${index + 1}`,
    );
    for (const [itemIndex, text] of PRIVACY_EN[index].entries()) {
      assert.ok(text.trim(), `section ${index + 1}, item ${itemIndex + 1}`);
    }
  }
});

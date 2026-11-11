import test from "node:test";
import assert from "node:assert/strict";
import { emptyInstallation, type Installation } from "../../installations";
import { cbamOptionLabel, cbamProgress, CBAM_FIELDS } from "../template-fields";
import { installationCbamCells, withInstallationDefaults } from "../installation-defaults";

const site = {
  ...emptyInstallation(true),
  id: "TH-CHECK-01",
  name: "Check Steel Co.",
  street: "1 Rama IV",
  economicActivity: "Steel",
  postcode: "10110",
  city: "Bangkok",
  country: "TH",
  unlocode: "THBKK",
  lat: "13.7",
  lng: "100.5",
  contactName: "Ann",
  contactEmail: "ann@example.com",
  contactPhone: "+66 2 000 0000",
  operatorName: "Check Steel PLC",
} as Installation;

// The site wizard already asked for these; the CBAM tab must not show them as missing.
test("the installation record fills the A_InstData installation fields", () => {
  const cells = installationCbamCells(site, 2026);
  assert.equal(cells["cbam:0:a-i20"], "Check Steel Co.");
  assert.equal(cells["cbam:0:a-i25"], "Bangkok");
  assert.equal(cells["cbam:0:a-i37"], "Check Steel PLC");
  assert.equal(cells["cbam:0:a-i9"], "2026-01-01");
  assert.equal(cells["cbam:0:a-l9"], "2026-12-31");
  // Only the operator address (I38–I41) is left for the user: 15 of 19 required.
  assert.deepEqual(cbamProgress(withInstallationDefaults({}, site, 2026), "installation"), { filled: 15, total: 19 });
});

// An answer typed on Fill in or sent through a Smart Link wins over the site record.
test("defaults never overwrite an answer and skip empty record fields", () => {
  const merged = withInstallationDefaults({ "cbam:0:a-i20": "Typed name" }, site, 2026);
  assert.equal(merged["cbam:0:a-i20"], "Typed name");
  assert.equal(merged["cbam:0:a-i24"], undefined);
  assert.deepEqual(withInstallationDefaults({ x: "1" }, null, 2026), { x: "1" });
});

// The template stores 1/0 and "Calcined clays " with a space; readers see Yes/No and a clean name.
test("option labels tidy what is shown, never what is stored", () => {
  const k50 = CBAM_FIELDS.find((f) => f.id === "d-k50")!;
  assert.deepEqual(k50.options, ["1", "0"]);
  assert.equal(cbamOptionLabel(k50, "1"), "Yes");
  assert.equal(cbamOptionLabel(k50, "0"), "No");
  const goods = CBAM_FIELDS.find((f) => f.id === "a-e62")!;
  assert.ok(goods.options!.includes("Calcined clays "));
  assert.equal(cbamOptionLabel(goods, "Calcined clays "), "Calcined clays");
});

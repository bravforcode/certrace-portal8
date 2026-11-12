/* ════════════════════════════════════════════════════════════
   CERA MISSING-DATA MONITOR — the list Cera watches, checked against the real catalogue

   Every test uses the real eu-cbam standard and the real CBAM field catalogue. Nothing is mocked,
   so a change to a requirement or a field shows up here instead of hiding behind a fake.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { getStandard } from "../convert-standards";
import { CBAM_FIELDS, cbamCellKey, cbamFieldsFor, cbamProgress } from "../cbam/template-fields";
import { FILL_REQUEST_BUDGET, fillRequest, missingData } from "../cera/monitor";

const std = getStandard("eu-cbam");
assert.ok(std, "eu-cbam standard exists");
const empty = { installation: null, sheets: [], cells: {} };
const required = CBAM_FIELDS.filter((f) => !f.optional);

test("an empty account lists exactly the required CBAM fields, and every requirement is open", () => {
  // Why: the monitor nags about required fields only; the count must match the progress the Convert page shows.
  const data = missingData(std!, empty);
  const cellsListed = data.fields.filter((f) => f.kind === "field");
  assert.equal(cellsListed.length, cbamProgress({}).total);
  assert.equal(data.incompleteRequirements, std!.requirements.length);
  assert.equal(data.readiness, 0);
});

test("a requirement with no CBAM cell of its own is listed as a requirement, not dropped", () => {
  // Why: carbon price has no template cell, so it can only be complete through its evidence; if it were not listed, an open requirement would be invisible to the user.
  const data = missingData(std!, empty);
  const cellless = std!.requirements.filter((r) => cbamFieldsFor(r.id).length === 0).map((r) => r.id);
  assert.ok(cellless.includes("carbon-price"), "carbon-price has no CBAM cell (the premise of this test)");
  const listed = data.fields.filter((f) => f.kind === "requirement").map((f) => f.id);
  assert.deepEqual(listed.sort(), [...cellless].sort());
});

test("an optional field is never listed as missing", () => {
  // Why: optional template fields (P.O. Box, Fax, the blocks after the first) must not make the badge climb.
  const data = missingData(std!, empty);
  const optional = new Set(CBAM_FIELDS.filter((f) => f.optional).map((f) => f.id));
  assert.equal(data.fields.some((f) => optional.has(f.id)), false);
});

test("answering one required field removes exactly that field from the list", () => {
  // Why: the list has to update after each save, so one answer must take one item off and no others.
  const target = required[0];
  const before = missingData(std!, empty);
  const after = missingData(std!, { ...empty, cells: { [cbamCellKey(target)]: "answer" } });
  assert.equal(after.fields.length, before.fields.length - 1);
  assert.equal(after.fields.some((f) => f.id === target.id), false);
});

test("a blank-looking answer still counts as missing", () => {
  // Why: a cell holding only spaces is not an answer; the Convert page's progress treats it the same way.
  const target = required[0];
  const data = missingData(std!, { ...empty, cells: { [cbamCellKey(target)]: "   " } });
  assert.equal(data.fields.some((f) => f.id === target.id), true);
});

test("a fully answered account lists only the cell-less requirements and reads below 100%", () => {
  // Why: readiness and the list must agree: every cell answered leaves only the requirements that CBAM cells cannot settle (carbon price).
  const cells = Object.fromEntries(required.map((f) => [cbamCellKey(f), "1"]));
  const data = missingData(std!, { ...empty, cells });
  assert.ok(data.fields.every((f) => f.kind === "requirement"));
  assert.equal(data.incompleteRequirements, data.fields.length);
  assert.equal(data.readiness, Math.round(((std!.requirements.length - data.fields.length) / std!.requirements.length) * 100));
});

test("each missing field names a requirement of the standard; only a CBAM field carries a section", () => {
  // Why: the panel shows "Section · Label" for fields and links by requirement; a field pointing at a non-requirement would link nowhere.
  const ids = new Set(std!.requirements.map((r) => r.id));
  const data = missingData(std!, empty);
  for (const f of data.fields) {
    assert.equal(ids.has(f.requirement), true, `${f.id} → ${f.requirement}`);
    assert.ok(f.label, `${f.id} has a label`);
    if (f.kind === "field") assert.ok(f.section, `${f.id} has a section`);
    else assert.equal(f.section, "", `${f.id} is a requirement, so no section`);
  }
});

test("the fill request asks Cera only for CBAM cells, never for a requirement it cannot set", () => {
  // Why: a requirement entry has no cell id; sending one would make Cera guess a field that does not exist.
  const data = missingData(std!, empty);
  const text = fillRequest({ id: "inst-1", name: "Plant A" }, 2026, data.fields);
  assert.doesNotMatch(text, /carbon-price/);
});

test("the fill request names the installation, the year and the real field ids", () => {
  // Why: the chat backend has no installation context of its own, so the message is the only place Cera learns which record to write to.
  const data = missingData(std!, empty);
  const text = fillRequest({ id: "inst-1", name: "Plant A" }, 2026, data.fields.slice(0, 3));
  assert.match(text, /installationId inst-1/);
  assert.match(text, /year 2026/);
  assert.ok(text.includes(`${data.fields[0].id}:`));
  assert.doesNotMatch(text, /more; ask again/, "three fields fit without a remainder note");
});

test("a long fill request stays inside Cera's 4000-character prompt limit and says what it left out", () => {
  // Why: the chat rejects prompts over 4000 characters with an "unavailable" reply, so the list must be cut and the cut stated.
  const data = missingData(std!, empty);
  assert.ok(data.fields.length > 60, "the empty account has more fields than fit");
  const text = fillRequest({ id: "inst-1", name: "Plant A" }, 2026, data.fields);
  assert.ok(text.length <= FILL_REQUEST_BUDGET + 80, `length ${text.length}`);
  assert.ok(text.length < 4000);
  assert.match(text, /…and \d+ more; ask again after these are done\./);
});

test("the fill request is written in Thai when the interface is Thai, and keeps the installation id", () => {
  // Why: Cera answers in the language it is sent, so a Thai user must get a Thai request, and the id must survive translation.
  const data = missingData(std!, empty);
  const text = fillRequest({ id: "inst-1", name: "Plant A" }, 2026, data.fields.slice(0, 3), "th");
  assert.match(text, /[฀-๿]/);
  assert.match(text, /installationId inst-1/);
  assert.doesNotMatch(text, /Fill the CBAM fields/);
});

test("requirements with no cell are named in the fill request, matching what the badge counts", () => {
  // Why: the badge counts carbon price as a missing item, so the message Cera gets must say it is still open too.
  const data = missingData(std!, empty);
  const text = fillRequest({ id: "inst-1", name: "Plant A" }, 2026, data.fields);
  assert.match(text, /Also still open in Convert, with no cell to set here: Carbon price paid\./);
});

test("the fields the request lists plus the ones it leaves out equal the field entries the badge counts", () => {
  // Why: the message and the badge must describe the same set, or Cera works on a different list than the user sees.
  const data = missingData(std!, empty);
  const text = fillRequest({ id: "inst-1", name: "Plant A" }, 2026, data.fields);
  const listed = [...text.matchAll(/^[a-e]-[a-z]+\d+: /gm)].length;
  const left = Number(text.match(/…and (\d+) more/)?.[1] ?? 0);
  assert.equal(listed + left, data.fields.filter((f) => f.kind === "field").length);
});

test("every field id in the fill request is a real CBAM field id from the catalogue", () => {
  // Why: Cera's set_cbam_fields accepts only catalogue ids (lib/cera/actions.ts); an invented id would be dropped at the server or land on the wrong cell.
  const data = missingData(std!, empty);
  const text = fillRequest({ id: "inst-1", name: "Plant A" }, 2026, data.fields);
  const catalogue = new Set(CBAM_FIELDS.map((f) => f.id));
  const ids = [...text.matchAll(/^([a-e]-[a-z]+\d+): /gm)].map((m) => m[1]);
  assert.ok(ids.length > 0, "the request lists at least one field");
  for (const id of ids) assert.equal(catalogue.has(id), true, id);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  CBAM_FIELDS,
  cbamCellKey,
  cbamFieldsFor,
  cbamProgress,
  declaredBlocks,
  visibleBlocks,
} from "../template-fields";

const ITEMS = [
  "installation",
  "goods",
  "direct",
  "indirect",
  "precursors",
  "monitoring",
  "communication",
  "verification",
] as const;

// Two fields sharing an id would overwrite each other's saved answer.
test("field ids are unique across the template", () => {
  const ids = CBAM_FIELDS.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

// The backend rejects any cell key outside this shape, so one bad id would fail every save of that field.
test("every cell key matches the backend CELL_KEY pattern", () => {
  for (const f of CBAM_FIELDS)
    assert.match(
      cbamCellKey(f),
      /^[a-z0-9-]{1,32}:\d{1,5}:[a-z0-9_-]{1,40}$/,
      f.id,
    );
});

// An item with no field renders an empty form. Carbon price has no input in the template, so it stays empty on purpose.
test("every item except carbon-price has at least one field", () => {
  for (const item of ITEMS) assert.ok(cbamFieldsFor(item).length > 0, item);
  assert.equal(cbamFieldsFor("carbon-price").length, 0);
});

// A dropdown without its option list would show a select the user cannot answer.
test("every select field has options", () => {
  for (const f of CBAM_FIELDS.filter((f) => f.kind === "select"))
    assert.ok(f.options?.length, f.id);
});

// The "x of y required filled" count must ignore optional blanks, or an item could never reach complete.
test("cbamProgress counts only non-optional filled fields", () => {
  const fields = cbamFieldsFor("installation");
  const required = fields.filter((f) => !f.optional);
  const optional = fields.find((f) => f.optional);
  assert.ok(
    required.length > 0 && optional,
    "installation needs one required and one optional field",
  );
  const total = required.length;

  assert.deepEqual(cbamProgress({}, "installation"), { filled: 0, total });
  assert.deepEqual(
    cbamProgress(
      { [cbamCellKey(required[0])]: "x", [cbamCellKey(optional)]: "y" },
      "installation",
    ),
    { filled: 1, total },
  );
  // A whitespace-only answer is not an answer.
  assert.deepEqual(
    cbamProgress({ [cbamCellKey(required[0])]: "   " }, "installation"),
    { filled: 0, total },
  );
});

const byId = (id: string) => CBAM_FIELDS.find((f) => f.id === id);

// The EU template (v2.1.1) repeats sheet D every 65 rows for 10 production processes and
// sheet E every 44 rows for 20 purchased precursors. A wrong stride writes answers into the wrong process.
test("sheet D covers production processes 1-10 at the template's 65-row stride", () => {
  for (let n = 1; n <= 10; n++) {
    const amounts = byId(`d-l${16 + 65 * (n - 1)}`);
    assert.equal(amounts?.section, `Production process ${n}`, `process ${n}`);
    assert.equal(amounts?.label, "Amounts, route no. 1");
    assert.equal(
      byId(`d-l${65 + 65 * (n - 1)}`)?.label,
      "Electricity consumption",
      `process ${n}`,
    );
  }
  assert.equal(byId("d-l661"), undefined, "the template has no process 11");
});

test("sheet E covers purchased precursors 1-20 at the template's 44-row stride", () => {
  for (let n = 1; n <= 20; n++) {
    const purchased = byId(`e-l${17 + 44 * (n - 1)}`);
    assert.equal(
      purchased?.section,
      `Purchased precursor ${n}`,
      `precursor ${n}`,
    );
    assert.equal(
      byId(`e-k${54 + 44 * (n - 1)}`)?.label,
      "Justification for use of default values",
    );
  }
  assert.equal(
    byId(`e-l${17 + 44 * 20}`),
    undefined,
    "the template has no precursor 21",
  );
});

// Most installations run one process and buy few precursors, so the extra blocks must not
// lower anyone's "x of y required" count.
test("only the first process and precursor count towards progress", () => {
  for (const item of ["indirect", "communication", "precursors"]) {
    const required = cbamFieldsFor(item).filter((f) => !f.optional);
    assert.ok(required.length > 0, item);
    for (const f of required)
      assert.equal(f.block, 1, `${f.id} is required but in block ${f.block}`);
  }
});

// A form showing 10 empty processes buries the one the user needs. Block n appears once block n-1 has an answer.
test("visibleBlocks opens the next block only after the one before has an answer", () => {
  const fields = cbamFieldsFor("communication");
  const sections = (answers: Record<string, string>) => [
    ...new Set(
      visibleBlocks(fields, (f) => (answers[f.id] ?? "").trim() !== "").map(
        (f) => f.section,
      ),
    ),
  ];
  assert.deepEqual(sections({}), ["Production process 1"]);
  assert.deepEqual(sections({ "d-l16": "100" }), [
    "Production process 1",
    "Production process 2",
  ]);
  assert.deepEqual(sections({ "d-l16": "100", "d-l81": "5" }), [
    "Production process 1",
    "Production process 2",
    "Production process 3",
  ]);
  // An answer already saved in a later block keeps that block on screen even if an earlier one was cleared.
  assert.deepEqual(sections({ "d-l146": "7" }), [
    "Production process 1",
    "Production process 3",
    "Production process 4",
  ]);
  // Fields outside sheets D and E are never hidden.
  const installation = cbamFieldsFor("installation");
  assert.equal(
    visibleBlocks(installation, () => false).length,
    installation.length,
  );
});

// A_InstData part (b) lists the processes P1-P10 on rows 83-92 and the purchased precursors
// PP1-PP20 on rows 102-121; sheets D and E are filled per listed process and precursor.
test("A_InstData lists processes P1-P10 and purchased precursors PP1-PP20 on the template rows", () => {
  for (let n = 1; n <= 10; n++) {
    const category = byId(`a-e${82 + n}`);
    assert.equal(category?.label, "Aggregated goods category", `P${n}`);
    assert.deepEqual(
      [category?.group, category?.block, category?.declares],
      ["process", n, true],
    );
    assert.equal(byId(`a-l${82 + n}`)?.label, "Name");
  }
  assert.equal(byId("a-e93"), undefined, "the template has no P11");
  for (let n = 1; n <= 20; n++) {
    const precursor = byId(`a-e${101 + n}`);
    assert.equal(precursor?.label, "Production process", `PP${n}`);
    assert.deepEqual([precursor?.group, precursor?.block], ["precursor", n]);
  }
  assert.equal(byId("a-e122"), undefined, "the template has no PP21");
  // Answers saved before the lists were modelled stay on the same cells.
  assert.equal(byId("a-e102")?.section, "Purchased precursor 1");
});

// Listing three processes in A_InstData is the user saying "I have three": sheet D then shows
// those three, not one at a time, and not a fourth empty one.
test("processes declared in A_InstData open exactly their blocks in sheet D", () => {
  const cells = {
    [cbamCellKey(byId("a-e83")!)]: "Crude steel",
    [cbamCellKey(byId("a-e84")!)]: "Pig iron",
    [cbamCellKey(byId("a-l85")!)]: "Sinter plant",
  };
  const declared = declaredBlocks(cells);
  assert.deepEqual(declared, ["process:1", "process:2", "process:3"]);
  const sections = [
    ...new Set(
      visibleBlocks(cbamFieldsFor("communication"), () => false, declared).map(
        (f) => f.section,
      ),
    ),
  ];
  assert.deepEqual(sections, [
    "Production process 1",
    "Production process 2",
    "Production process 3",
  ]);
  // Precursors are declared separately, so sheet E still starts at one.
  const precursorSections = new Set(
    visibleBlocks(cbamFieldsFor("precursors"), () => false, declared).map(
      (f) => f.section,
    ),
  );
  assert.deepEqual([...precursorSections], ["Purchased precursor 1"]);
  // The list itself always offers the next empty row.
  const goodsSections = new Set(
    visibleBlocks(
      cbamFieldsFor("goods"),
      (f) => (cells[cbamCellKey(f)] ?? "") !== "",
      declared,
    ).map((f) => f.section),
  );
  assert.ok(
    goodsSections.has("Production process 4") &&
      !goodsSections.has("Production process 5"),
  );
});

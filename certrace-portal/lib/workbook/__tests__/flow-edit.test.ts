import test from "node:test";
import assert from "node:assert/strict";
import { flowActionToCells, missingSteps, stepNames } from "../flow-edit";

const base: Record<string, string> = {
  "steps:0:step": "Drawing",
  "steps:1:step": "Annealing",
  "materials:0:step": "Drawing",
  "materials:0:item": "Wire rod",
  "energy:0:step": "Packing",
  "energy:0:item": "Electricity",
};

test("stepNames keeps Steps sheet order", () => {
  assert.deepEqual(stepNames(base), ["Drawing", "Annealing"]);
});
// MEASUR adds the components the diagram lacks when the assessment opens; here the
// diagram offers to add steps that rows already name.
test("missingSteps lists names used by rows but absent from Steps", () => {
  assert.deepEqual(missingSteps(base), ["Packing"]);
});
test("add-step appends the next free Steps row", () => {
  assert.deepEqual(flowActionToCells({ kind: "add-step", name: "Coating" }, base), {
    "steps:2:step": "Coating",
  });
});
test("add-step rejects a duplicate name, ignoring case and spaces", () => {
  assert.throws(() => flowActionToCells({ kind: "add-step", name: " drawing " }, base), /already exists/);
});
test("add-input writes a review row on the chosen sheet", () => {
  assert.deepEqual(
    flowActionToCells({ kind: "add-input", sheet: "materials", step: "Annealing", item: "Zinc", qty: "2", unit: "t" }, base),
    {
      "materials:1:step": "Annealing",
      "materials:1:item": "Zinc",
      "materials:1:qty": "2",
      "materials:1:unit": "t",
      "materials:1:status": "review",
    },
  );
});
test("add-input needs an existing step", () => {
  assert.throws(
    () => flowActionToCells({ kind: "add-output", step: "Nowhere", item: "Scrap" }, base),
    /Add the step "Nowhere" first/,
  );
});
// The first explicit link would otherwise wipe the implied chain (Task 15 rule).
test("first connect seeds the default chain, then adds the new edge", () => {
  const cells = { ...base, "steps:2:step": "Coating" };
  assert.deepEqual(flowActionToCells({ kind: "connect", from: "Drawing", to: "Coating", item: "Wire" }, cells), {
    "flow:0:from": "Drawing",
    "flow:0:to": "Annealing",
    "flow:1:from": "Annealing",
    "flow:1:to": "Coating",
    "flow:2:from": "Drawing",
    "flow:2:to": "Coating",
    "flow:2:item": "Wire",
  });
});
test("connect is idempotent for an existing edge", () => {
  const cells = { ...base, "flow:0:from": "Drawing", "flow:0:to": "Annealing" };
  assert.deepEqual(flowActionToCells({ kind: "connect", from: "drawing", to: "ANNEALING" }, cells), {});
});
test("disconnect clears the whole matching Flow row", () => {
  const cells = { ...base, "flow:0:from": "Drawing", "flow:0:to": "Annealing", "flow:0:item": "Wire" };
  assert.deepEqual(flowActionToCells({ kind: "disconnect", from: "Drawing", to: "Annealing" }, cells), {
    "flow:0:from": null,
    "flow:0:to": null,
    "flow:0:item": null,
  });
});
test("rename-step rewrites every reference", () => {
  const cells = { ...base, "flow:0:from": "Drawing", "flow:0:to": "Annealing" };
  assert.deepEqual(flowActionToCells({ kind: "rename-step", from: "Drawing", to: "Wire drawing" }, cells), {
    "steps:0:step": "Wire drawing",
    "materials:0:step": "Wire drawing",
    "flow:0:from": "Wire drawing",
  });
});
test("rename-step refuses to merge two steps", () => {
  assert.throws(() => flowActionToCells({ kind: "rename-step", from: "Drawing", to: "annealing" }, base), /already exists/);
});

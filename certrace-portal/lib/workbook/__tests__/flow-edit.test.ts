import test from "node:test";
import assert from "node:assert/strict";
import {
  FlowEditError,
  explicitEdges,
  flowActionToCells,
  missingSteps,
  stepNames,
} from "../flow-edit";

const base: Record<string, string> = {
  "steps:0:step": "Drawing",
  "steps:1:step": "Annealing",
  "materials:0:step": "Drawing",
  "materials:0:item": "Wire rod",
  "energy:0:step": "Packing",
  "energy:0:item": "Electricity",
};

/** The FlowEditError code thrown by an action, or null when it did not throw one. */
function codeOf(fn: () => unknown): string | null {
  try {
    fn();
    return null;
  } catch (e) {
    assert.ok(
      e instanceof FlowEditError,
      `expected FlowEditError, got ${String(e)}`,
    );
    return e.code;
  }
}

test("stepNames keeps Steps sheet order", () => {
  assert.deepEqual(stepNames(base), ["Drawing", "Annealing"]);
});

// MEASUR adds the components the diagram lacks when the assessment opens; here the
// diagram offers to add steps that rows already name.
test("missingSteps lists names used by rows but absent from Steps", () => {
  assert.deepEqual(missingSteps(base), ["Packing"]);
});

test("missingSteps reads names from flow and output rows too", () => {
  const cells = {
    ...base,
    "flow:0:from": "Drawing",
    "flow:0:to": "Coiling",
    "output:0:step": "Shipping",
  };
  assert.deepEqual(missingSteps(cells), ["Packing", "Shipping", "Coiling"]);
});

test("add-step appends the next free Steps row", () => {
  assert.deepEqual(
    flowActionToCells({ kind: "add-step", name: "Coating" }, base),
    {
      "steps:2:step": "Coating",
    },
  );
});

test("add-step rejects a duplicate name, ignoring case and spaces", () => {
  assert.equal(
    codeOf(() =>
      flowActionToCells({ kind: "add-step", name: " drawing " }, base),
    ),
    "duplicate-step",
  );
});

test("add-step rejects a blank name with a coded error", () => {
  assert.equal(
    codeOf(() => flowActionToCells({ kind: "add-step", name: "   " }, base)),
    "blank",
  );
});

test("add-input writes a review row on the chosen sheet", () => {
  assert.deepEqual(
    flowActionToCells(
      {
        kind: "add-input",
        sheet: "materials",
        step: "Annealing",
        item: "Zinc",
        qty: "2",
        unit: "t",
      },
      base,
    ),
    {
      "materials:1:step": "Annealing",
      "materials:1:item": "Zinc",
      "materials:1:qty": "2",
      "materials:1:unit": "t",
      "materials:1:status": "review",
    },
  );
});

test("add-output needs an existing step", () => {
  const err = (() => {
    try {
      flowActionToCells(
        { kind: "add-output", step: "Nowhere", item: "Scrap" },
        base,
      );
    } catch (e) {
      return e as FlowEditError;
    }
    return null;
  })();
  assert.ok(err instanceof FlowEditError);
  assert.equal(err.code, "missing-step");
  assert.equal(err.message, 'Add the step "Nowhere" first.');
  assert.deepEqual(err.params, { name: "Nowhere" });
});

test("add-input rejects a blank item", () => {
  assert.equal(
    codeOf(() =>
      flowActionToCells(
        { kind: "add-input", sheet: "materials", step: "Drawing", item: " " },
        base,
      ),
    ),
    "blank",
  );
});

// The first explicit link would otherwise wipe the implied chain (Task 15 rule).
test("first connect seeds the default chain, then adds the new edge", () => {
  const cells = { ...base, "steps:2:step": "Coating" };
  assert.deepEqual(
    flowActionToCells(
      { kind: "connect", from: "Drawing", to: "Coating", item: "Wire" },
      cells,
    ),
    {
      "flow:0:from": "Drawing",
      "flow:0:to": "Annealing",
      "flow:1:from": "Annealing",
      "flow:1:to": "Coating",
      "flow:2:from": "Drawing",
      "flow:2:to": "Coating",
      "flow:2:item": "Wire",
    },
  );
});

test("first connect that is already on the implied chain sets its item instead of adding a row", () => {
  assert.deepEqual(
    flowActionToCells(
      { kind: "connect", from: "Drawing", to: "Annealing", item: "Wire" },
      base,
    ),
    {
      "flow:0:from": "Drawing",
      "flow:0:to": "Annealing",
      "flow:0:item": "Wire",
    },
  );
});

test("connect seeds the chain when Flow has only a partial row", () => {
  const cells = {
    ...base,
    "steps:2:step": "Packing",
    "flow:0:from": "Drawing",
  }; // no 'to': not an edge
  const patch = flowActionToCells(
    { kind: "connect", from: "Annealing", to: "Packing", item: "Pallet" },
    cells,
  );
  assert.deepEqual(patch, {
    "flow:1:from": "Drawing",
    "flow:1:to": "Annealing",
    "flow:2:from": "Annealing",
    "flow:2:to": "Packing",
    "flow:2:item": "Pallet",
  });
});

test("connect with existing complete edges adds one row and does not reseed", () => {
  const cells = {
    ...base,
    "flow:0:from": "Drawing",
    "flow:0:to": "Annealing",
    "steps:2:step": "Packing",
  };
  assert.deepEqual(
    flowActionToCells(
      { kind: "connect", from: "Annealing", to: "Packing" },
      cells,
    ),
    {
      "flow:1:from": "Annealing",
      "flow:1:to": "Packing",
    },
  );
});

test("connect is idempotent for an existing edge", () => {
  const cells = { ...base, "flow:0:from": "Drawing", "flow:0:to": "Annealing" };
  assert.deepEqual(
    flowActionToCells(
      { kind: "connect", from: "drawing", to: "ANNEALING" },
      cells,
    ),
    {},
  );
});

test("connect refuses a step linked to itself", () => {
  assert.equal(
    codeOf(() =>
      flowActionToCells(
        { kind: "connect", from: "Drawing", to: " drawing " },
        base,
      ),
    ),
    "same-step",
  );
});

test("explicitEdges lists only rows that name both ends", () => {
  const cells = {
    ...base,
    "flow:0:from": "Drawing",
    "flow:0:to": "Annealing",
    "flow:1:from": "Packing",
  };
  assert.deepEqual(explicitEdges(cells), [
    { row: 0, from: "Drawing", to: "Annealing", item: undefined },
  ]);
});

test("disconnect clears the whole matching Flow row", () => {
  const cells = {
    ...base,
    "flow:0:from": "Drawing",
    "flow:0:to": "Annealing",
    "flow:0:item": "Wire",
  };
  assert.deepEqual(
    flowActionToCells(
      { kind: "disconnect", from: "Drawing", to: "Annealing" },
      cells,
    ),
    {
      "flow:0:from": null,
      "flow:0:to": null,
      "flow:0:item": null,
    },
  );
});

test("disconnect of flow row 1 leaves flow row 10 alone", () => {
  const cells = {
    ...base,
    "flow:1:from": "Drawing",
    "flow:1:to": "Annealing",
    "steps:2:step": "Packing",
    "flow:10:from": "Annealing",
    "flow:10:to": "Packing",
    "flow:10:item": "Wire",
  };
  const patch = flowActionToCells(
    { kind: "disconnect", from: "Drawing", to: "Annealing" },
    cells,
  );
  assert.deepEqual(Object.keys(patch).sort(), ["flow:1:from", "flow:1:to"]);
});

test("rename-step rewrites every reference", () => {
  const cells = { ...base, "flow:0:from": "Drawing", "flow:0:to": "Annealing" };
  assert.deepEqual(
    flowActionToCells(
      { kind: "rename-step", from: "Drawing", to: "Wire drawing" },
      cells,
    ),
    {
      "steps:0:step": "Wire drawing",
      "materials:0:step": "Wire drawing",
      "flow:0:from": "Wire drawing",
    },
  );
});

test("rename-step allows a case-only change of the same step", () => {
  assert.deepEqual(
    flowActionToCells(
      { kind: "rename-step", from: "Drawing", to: "DRAWING" },
      base,
    ),
    {
      "steps:0:step": "DRAWING",
      "materials:0:step": "DRAWING",
    },
  );
});

test("rename-step refuses to merge two steps", () => {
  assert.equal(
    codeOf(() =>
      flowActionToCells(
        { kind: "rename-step", from: "Drawing", to: "annealing" },
        base,
      ),
    ),
    "duplicate-step",
  );
});

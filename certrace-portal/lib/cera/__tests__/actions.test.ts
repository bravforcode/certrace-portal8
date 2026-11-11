import { test } from "node:test";
import assert from "node:assert/strict";
import type { Installation } from "../../installations";
import {
  applyCeraAction,
  describeAction,
  parseCeraActions,
  type CeraAction,
  type CeraActionDeps,
} from "../actions";

/** A deps object whose every call is recorded, so a test can prove what ran and what did not. */
function spyDeps(overrides: Partial<CeraActionDeps> = {}) {
  const calls: string[] = [];
  const saved: Installation[] = [];
  const patched: { iid: string; year: number; cells: Record<string, string | null> }[] = [];
  const deps: CeraActionDeps = {
    patchCells: async (iid, year, cells) => {
      calls.push("patchCells");
      patched.push({ iid, year, cells });
    },
    saveInstallation: (record) => {
      calls.push("saveInstallation");
      saved.push(record);
    },
    getInstallation: () => {
      calls.push("getInstallation");
      return null;
    },
    openUpload: () => {
      calls.push("openUpload");
    },
    navigate: () => {
      calls.push("navigate");
    },
    ...overrides,
  };
  return { deps, calls, saved, patched };
}

test("parse drops unknown tools so a made-up tool name never reaches the card", () => {
  // The server is the only filter the model passes through; a tool the portal does not know must not become a card.
  const out = parseCeraActions([
    { tool: "delete_everything", installationId: "TH-A", year: 2026 },
    { tool: "request_upload", purpose: "Electricity invoices" },
  ]);
  assert.deepEqual(out, [{ tool: "request_upload", purpose: "Electricity invoices" }]);
});

test("parse keeps only bare CBAM field ids from the allowlist", () => {
  // The backend accepts bare catalogue ids only; a "cbam:0:" key or an invented cell would be written to the workbook if it got through.
  const out = parseCeraActions([
    {
      tool: "set_cbam_fields",
      installationId: "TH-A",
      year: 2026,
      values: {
        "a-i9": "2026-01-01",
        "cbam:0:a-i9": "2026-01-01",
        "a-zz999": "x",
        "../etc/passwd": "x",
        "a-l9": null,
      },
    },
  ]);
  assert.deepEqual(out, [
    {
      tool: "set_cbam_fields",
      installationId: "TH-A",
      year: 2026,
      values: { "a-i9": "2026-01-01", "a-l9": null },
    },
  ]);
});

test("parse keeps only Installation fields in update_installation", () => {
  // An id or owner field slipped into `changes` would re-key or re-own a record the user never meant to touch.
  const out = parseCeraActions([
    {
      tool: "update_installation",
      installationId: "TH-A",
      changes: { contactEmail: "new@example.test", id: "HACK", self: "true" },
    },
  ]);
  assert.deepEqual(out, [
    {
      tool: "update_installation",
      installationId: "TH-A",
      changes: { contactEmail: "new@example.test" },
    },
  ]);
});

test("parse accepts only allowlisted page paths and drops everything else", () => {
  // open_page navigates the user; an off-site URL or a page outside the list would send them somewhere they did not ask to go.
  const out = parseCeraActions([
    { tool: "open_page", path: "/admin" },
    { tool: "open_page", path: "https://evil.example.test/" },
    { tool: "open_page", path: "/settings/../admin" },
    { tool: "open_page", path: "/dashboard?tab=<script>" },
    { tool: "open_page", path: "/dashboard?tab=cbam" },
  ]);
  assert.deepEqual(out, [{ tool: "open_page", path: "/dashboard?tab=cbam" }]);
});

test("parse caps the number of actions shown on one card", () => {
  // Five is the most a user can review on one card before confirming; more would be a batch they cannot read.
  const many = Array.from({ length: 8 }, (_, i) => ({
    tool: "request_upload",
    purpose: `doc ${i}`,
  }));
  assert.equal(parseCeraActions(many).length, 5);
});

test("applying set_cbam_fields writes exactly the given cells for that installation and year", async () => {
  // The user confirmed these exact cells; a write that adds, drops or re-keys one would save something they never approved.
  const { deps, patched } = spyDeps();
  const action: CeraAction = {
    tool: "set_cbam_fields",
    installationId: "TH-RAYONG-01",
    year: 2026,
    values: { "a-i9": "2026-01-01", "a-l9": null },
  };
  await applyCeraAction(action, deps);
  assert.deepEqual(patched, [
    {
      iid: "TH-RAYONG-01",
      year: 2026,
      cells: { "cbam:0:a-i9": "2026-01-01", "cbam:0:a-l9": null },
    },
  ]);
});

test("applying update_installation merges the changes onto the stored record", async () => {
  // Saving only the changed fields would blank every other field of the plant; the merge keeps the rest.
  const current = {
    id: "TH-RAYONG-01",
    name: "Rayong billet plant",
    street: "1 Industrial Road",
    self: true,
    supplierId: "",
    lat: "12.6800",
    contactEmail: "old@example.test",
  } as unknown as Installation;
  const { deps, saved } = spyDeps({
    getInstallation: () => current,
  });
  await applyCeraAction(
    {
      tool: "update_installation",
      installationId: "TH-RAYONG-01",
      changes: { contactEmail: "new@example.test" },
    },
    deps,
  );
  assert.equal(saved.length, 1);
  assert.equal(saved[0]!.contactEmail, "new@example.test");
  assert.equal(saved[0]!.name, "Rayong billet plant");
  assert.equal(saved[0]!.street, "1 Industrial Road");
  assert.equal(saved[0]!.self, true);
  assert.equal(saved[0]!.lat, "12.6800");
});

test("applying update_installation to a missing record throws and saves nothing", async () => {
  // A save with no stored record would create a half-empty plant; the user must see the failure, not a silent new record.
  const { deps, saved } = spyDeps({ getInstallation: () => null });
  let error: unknown;
  try {
    await applyCeraAction(
      {
        tool: "update_installation",
        installationId: "TH-MISSING-99",
        changes: { name: "Ghost" },
      },
      deps,
    );
  } catch (cause) {
    error = cause;
  }
  assert.ok(error instanceof Error);
  assert.match(error.message, /TH-MISSING-99 not found/);
  assert.equal(saved.length, 0);
});

test("building a card and describing its actions calls no dependency", () => {
  // Showing a proposal must never write: this is what makes Discard safe, since discard only changes the card status.
  const { deps, calls } = spyDeps();
  const raw: unknown = [
    {
      tool: "set_cbam_fields",
      installationId: "TH-A",
      year: 2026,
      values: { "a-i9": "2026-01-01" },
    },
    { tool: "update_installation", installationId: "TH-A", changes: { name: "X" } },
    { tool: "open_page", path: "/dashboard" },
  ];
  const actions = parseCeraActions(raw);
  for (const action of actions) describeAction(action);
  assert.equal(actions.length, 3);
  assert.deepEqual(calls, []);
  assert.equal(typeof deps.patchCells, "function");
});

test("describeAction shows old values only when the caller supplied them", () => {
  // Without old values the user cannot judge the change; with them, a field the user did not touch must not appear as changed.
  const action: CeraAction = {
    tool: "set_cbam_fields",
    installationId: "TH-A",
    year: 2026,
    values: { "a-i9": "2026-02-01", "a-l9": null },
  };
  const bare = describeAction(action);
  assert.equal(bare.rows[0]!.from, undefined);
  assert.equal(bare.rows[1]!.to, "(clear)");
  const withOld = describeAction(action, {
    cells: { "cbam:0:a-i9": "2026-01-01" },
  });
  assert.equal(withOld.rows[0]!.from, "2026-01-01");
  assert.equal(withOld.rows[0]!.to, "2026-02-01");
  assert.equal(withOld.rows[1]!.from, "(empty)");
});

test("the confirm card names the section, so a precursor field never reads like a process field", () => {
  // A live turn proposed a-l102 for "process P1"; a card reading only "Name" hid the mistake from the user.
  const card = describeAction({
    tool: "set_cbam_fields",
    installationId: "TH-A",
    year: 2026,
    values: { "a-l83": "Hot rolling", "a-l102": "Pig iron" },
  });
  assert.equal(card.rows[0]!.label, "Production process 1 · Name");
  assert.equal(card.rows[1]!.label, "Purchased precursor 1 · Name");
});

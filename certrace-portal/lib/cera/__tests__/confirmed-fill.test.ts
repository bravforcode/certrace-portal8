import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { confirmedFill } from "../confirmed-fill";
import { analyzeText, nextStep } from "../smart-upload";
import { createWorkspace, listWorkspaces } from "../../workspace";
import { emptyInstallation, saveInstallation } from "../../installations";
import { getMonth, saveMonth } from "../../monthly-data";
import { configureApi } from "../../api/config";
import { saveSession } from "../../api/session";
import { hydrateAccount, resetAccount } from "../../account-storage";
import { getConversation, saveConversation } from "../history";
import type { PrecursorSupplier } from "../../precursor-suppliers";

const local = new Map<string, string>();
const browser = {
  location: { origin: "http://localhost:3000", pathname: "/workspaces" },
  localStorage: {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => {
      local.set(key, value);
    },
    removeItem: (key: string) => {
      local.delete(key);
    },
  },
};
Object.assign(globalThis, { window: browser });
const sample = readFileSync(
  new URL(
    "./fixtures/cera-sample-1-monthly-report-march-2026.txt",
    import.meta.url,
  ),
  "utf8",
);

async function setup() {
  resetAccount(true);
  configureApi({ baseUrl: "" });
  browser.location.pathname = "/workspaces";
  local.clear();
  saveInstallation({
    ...emptyInstallation(true),
    id: "TH-RAYONG-01",
    name: "Rayong Works",
    country: "TH",
  });
  const ws = createWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works",
    productId: "ironore",
    productionRoute: "sintering",
    year: 2026,
    selfSupplied: true,
  });
  const step = nextStep(
    analyzeText("report.txt", sample),
    {},
    listWorkspaces(),
  );
  assert.equal(step.kind, "plan");
  if (step.kind !== "plan") throw new Error("Fixture must yield a plan");
  const records = new Map(
    [...local].map(([key, value]) => [
      key,
      { key, value: JSON.parse(value), revision: 1 },
    ]),
  );
  let failure = false;
  let hold: Promise<void> | undefined;
  configureApi({
    baseUrl: "http://localhost:8000",
    fetchImpl: (async (input, init) => {
      const path = new URL(String(input)).pathname;
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        });
      if (!init?.method || init.method === "GET")
        return json({ records: [...records.values()] });
      await hold;
      if (failure)
        return json(
          { detail: { code: "UNAVAILABLE", message: "Offline" } },
          503,
        );
      const body = JSON.parse(String(init.body));
      if (path.endsWith("/batch")) {
        const saved = body.records.map(
          (r: { key: string; value: unknown; revision: number }) => ({
            ...r,
            revision: r.revision + 1,
          }),
        );
        for (const row of saved) records.set(row.key, row);
        return json({ records: saved });
      }
      const key = decodeURIComponent(path.split("/").at(-1)!);
      const row = { key, value: body.value, revision: body.revision + 1 };
      records.set(key, row);
      return json(row);
    }) as typeof fetch,
  });
  saveSession({
    accessToken: "cookie",
    user: {
      id: "cera-a",
      email: "a@example.invalid",
      onboarded: true,
      ready: true,
    },
  });
  await hydrateAccount("cera-a");
  return {
    ws,
    plan: step.plan,
    records,
    fail: (value: boolean) => {
      failure = value;
    },
    hold: () => {
      let release!: () => void;
      hold = new Promise<void>((r) => {
        release = r;
      });
      return release;
    },
  };
}

test("confirmation waits for acknowledgement; retry preserves edits without duplicate process rows or notes", async () => {
  const fixture = await setup();
  fixture.fail(true);
  const release = fixture.hold();
  const confirm = confirmedFill(fixture.plan);
  const first = confirm();
  assert.equal(confirm(), first, "double clicking shares the pending write");
  let finished = false;
  void first.then(
    () => {
      finished = true;
    },
    () => {},
  );
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(finished, false);
  const staged = getMonth(fixture.ws.id, "2026-03")!;
  assert.equal(staged.processEmissionEntries?.length, 1);
  release();
  await assert.rejects(first, /Offline/);
  saveMonth({ ...staged, notes: `${staged.notes}\nReviewed by the operator` });
  fixture.fail(false);
  assert.equal((await confirm()).out.ok, true);
  const savedNotes = getMonth(fixture.ws.id, "2026-03")!.notes;
  assert.equal(savedNotes?.match(/Furnace 2/g)?.length, 1);
  assert.match(savedNotes!, /Reviewed by the operator/);
  resetAccount(true);
  await hydrateAccount("cera-a");
  assert.equal(
    getMonth(fixture.ws.id, "2026-03")?.processEmissionEntries?.length,
    1,
  );
  assert.equal(
    getMonth(fixture.ws.id, "2026-03")?.notes,
    savedNotes,
    "the acknowledged draft survives rehydration",
  );
});

test("stale account, unbound public link and cross-month plans cannot fill a form", async () => {
  const { plan, ws } = await setup();
  const confirm = confirmedFill(plan);
  saveSession({
    accessToken: "cookie",
    user: {
      id: "cera-b",
      email: "b@example.invalid",
      onboarded: true,
      ready: true,
    },
  });
  await assert.rejects(confirm(), /account changed/);
  assert.equal(getMonth(ws.id, plan.month), null);
  browser.location.pathname = "/w/token";
  await assert.rejects(confirmedFill(plan)(), /Reopen the supplier form/);
  await assert.rejects(
    confirmedFill(plan, {
      audience: "supplier",
      workspaceId: ws.id,
      month: "2026-04",
    })(),
    /different form/,
  );
  await assert.rejects(
    confirmedFill(plan, {
      audience: "supplier",
      workspaceId: ws.id,
      month: plan.month,
    })(),
    /Reopen the supplier link/,
  );
});

test("an account switch during a save cannot produce a success reply", async () => {
  const fixture = await setup();
  const release = fixture.hold();
  const promise = confirmedFill(fixture.plan)();
  saveSession({
    accessToken: "cookie",
    user: {
      id: "cera-b",
      email: "b@example.invalid",
      onboarded: true,
      ready: true,
    },
  });
  release();
  await assert.rejects(promise, /account changed/);
});

test("precursor retries persist the current draft without applying extracted fields again", async () => {
  const { plan, ws } = await setup();
  browser.location.pathname = "/p/token";
  let row = {
    id: "p1",
    workspaceId: ws.id,
    installationName: "Before",
  } as PrecursorSupplier;
  let applied = 0;
  let failure = true;
  let saved = "";
  const confirm = confirmedFill(
    { ...plan, precursor: { nodeId: "p1" } },
    {
      audience: "precursor",
      workspaceId: ws.id,
      nodeId: "p1",
      row: () => row,
      apply: () => {
        applied++;
        row = { ...row, installationName: "Extracted" };
        return { ok: true, row, sections: [], missing: [] };
      },
      save: async () => {
        if (failure) throw new Error("Offline");
        saved = row.installationName;
      },
    },
  );
  await assert.rejects(confirm(), /Offline/);
  row = { ...row, installationName: "Operator correction" };
  failure = false;
  assert.equal((await confirm()).out.ok, true);
  assert.equal(applied, 1);
  assert.equal(saved, "Operator correction");
  browser.location.pathname = "/p/another-token";
  await assert.rejects(confirm(), /link changed/);
});

test("history cannot replay a fill whose save was interrupted", async () => {
  const { plan } = await setup();
  for (const saveState of ["pending", "failed"] as const) {
    saveConversation(saveState, [
      { id: "u", role: "user", text: "Fill this report" },
      {
        id: "c",
        role: "cera",
        text: "Check these readings",
        cards: [
          { kind: "extraction", id: "fill", plan, state: "open", saveState },
        ],
      },
    ]);
    const card = getConversation(saveState)?.messages[1].cards?.[0];
    assert.ok(card?.kind === "extraction");
    assert.equal(card.state, "review");
    assert.equal(card.saveState, undefined);
  }
});

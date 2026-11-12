import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  OPPORTUNITIES_KEY,
  readOpportunities,
  saveOpportunities,
  saveOpportunity,
  updateOpportunity,
} from "../opportunity-store";
import { OPPORTUNITY_LIMIT, type Opportunity } from "../opportunities";

const good = (over: Partial<Opportunity> = {}): Opportunity => ({
  id: "g1",
  key: "sheet:i1:2026:transport",
  installationId: "i1",
  year: 2026,
  source: "data-gap",
  title: "Fill in the Transport sheet",
  detail: "Workspace",
  impactEur: null,
  impactT: null,
  assignee: "",
  status: "open",
  due: "",
  href: "/workspace",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

let store: Map<string, string>;
let realWindow: unknown;
let failWrites = false;

beforeEach(() => {
  store = new Map();
  realWindow = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (failWrites) throw new Error("quota");
        store.set(k, v);
      },
      removeItem: (k: string) => void store.delete(k),
    },
  };
  failWrites = false;
});
afterEach(() => {
  (globalThis as { window?: unknown }).window = realWindow;
});

test("stored data with malformed cards keeps only the well-formed ones", () => {
  store.set(
    OPPORTUNITIES_KEY,
    JSON.stringify([good(), { id: "bad", status: "archived" }, null]),
  );
  assert.deepEqual(
    readOpportunities().map((o) => o.id),
    ["g1"],
  );
});

test("unreadable stored data reads as an empty list", () => {
  store.set(OPPORTUNITIES_KEY, "{not json");
  assert.deepEqual(readOpportunities(), []);
});

test("updating an unknown card returns false and writes nothing", async () => {
  store.set(OPPORTUNITIES_KEY, JSON.stringify([good()]));
  assert.equal(await updateOpportunity("missing", { status: "done" }), false);
  assert.deepEqual(JSON.parse(store.get(OPPORTUNITIES_KEY)!), [good()]);
});

test("updating a known card changes only the given fields", async () => {
  store.set(OPPORTUNITIES_KEY, JSON.stringify([good()]));
  assert.equal(
    await updateOpportunity("g1", { assignee: "u1", status: "in-progress" }),
    true,
  );
  const [o] = readOpportunities();
  assert.equal(o!.id, "g1");
  assert.equal(o!.assignee, "u1");
  assert.equal(o!.status, "in-progress");
  assert.equal(o!.title, "Fill in the Transport sheet");
});

test("saving a card with an existing key updates it and keeps its id, assignee and status", async () => {
  store.set(
    OPPORTUNITIES_KEY,
    JSON.stringify([good({ assignee: "u1", status: "in-progress" })]),
  );
  await saveOpportunity({
    key: "sheet:i1:2026:transport",
    installationId: "i1",
    year: 2026,
    source: "data-gap",
    title: "Renamed",
    detail: "Workspace",
    impactEur: null,
    impactT: null,
    href: "/workspace",
  });
  const list = readOpportunities();
  assert.equal(list.length, 1);
  assert.equal(list[0]!.id, "g1");
  assert.equal(list[0]!.assignee, "u1");
  assert.equal(list[0]!.status, "in-progress");
  assert.equal(list[0]!.title, "Renamed");
});

test("a failed write surfaces a user-facing message", async () => {
  failWrites = true;
  await assert.rejects(saveOpportunities([good()]), {
    message: "Your changes could not be saved.",
  });
});

test("a new card at the limit with nothing closed to drop is refused with a message", async () => {
  const full = Array.from({ length: OPPORTUNITY_LIMIT }, (_, i) =>
    good({ id: `a${i}`, key: `a${i}` }),
  );
  store.set(OPPORTUNITIES_KEY, JSON.stringify(full));
  await assert.rejects(
    saveOpportunity({ ...good({ key: "what-if:new", source: "what-if" }) }),
    {
      message: "The opportunity list is full. Close or remove cards first.",
    },
  );
  assert.equal(readOpportunities().length, OPPORTUNITY_LIMIT);
});

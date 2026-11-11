import { test } from "node:test";
import assert from "node:assert/strict";
import { saveSession } from "../api/session";
import { configureApi } from "../api/config";
import { patchStoredProfile } from "../profile-storage";
import {
  accountStorage,
  hydrateAccount,
  flushAccount,
  resetAccount,
  accountSyncState,
  retryAccountSave,
  exportPendingRecords,
  refreshAccountRecords,
  isImportableLegacyKey,
} from "../account-storage";

const browser = {
  location: { origin: "http://localhost:3000", pathname: "/workspaces" },
  localStorage: {
    getItem: () => null,
    setItem: () => {
      throw new Error("Account data must not enter localStorage");
    },
    removeItem: () => {},
  },
};
Object.assign(globalThis, { window: browser });
type Record = { key: string; value: unknown; revision: number };
function server(initial: Record[] = []) {
  resetAccount(true);
  browser.location.pathname = "/workspaces";
  const records = new Map(initial.map((row) => [row.key, row]));
  let fail = false;
  let holdRead: Promise<void> | null = null;
  let reads = 0;
  configureApi({
    baseUrl: "http://localhost:8000",
    fetchImpl: (async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        });
      if (
        url.pathname === "/api/v1/reporting/records/batch" &&
        init?.method === "POST"
      ) {
        if (fail)
          return json(
            { detail: { code: "UNAVAILABLE", message: "Offline" } },
            503,
          );
        const batch = JSON.parse(String(init.body)).records as {
          key: string;
          value: unknown;
          revision: number;
        }[];
        if (
          batch.some((r) => (records.get(r.key)?.revision ?? 0) !== r.revision)
        )
          return json(
            {
              detail: {
                code: "REVISION_CONFLICT",
                message: "Changed elsewhere",
              },
            },
            409,
          );
        const saved = batch.map((r) => ({ ...r, revision: r.revision + 1 }));
        saved.forEach((r) => records.set(r.key, r));
        return json({ records: saved });
      }
      if (init?.method !== "PUT") {
        reads++;
        const snapshot = [...records.values()];
        const wait = holdRead;
        holdRead = null;
        if (wait) await wait;
        return json({ records: snapshot });
      }
      if (fail)
        return json(
          { detail: { code: "UNAVAILABLE", message: "Offline" } },
          503,
        );
      const body = JSON.parse(String(init.body));
      const key =
        body.key ?? decodeURIComponent(url.pathname.split("/").at(-1)!);
      if ((records.get(key)?.revision ?? 0) !== body.revision)
        return json(
          { detail: { code: "CONFLICT", message: "Changed in another tab" } },
          409,
        );
      const row = { key, value: body.value, revision: body.revision + 1 };
      records.set(key, row);
      return json(row);
    }) as typeof fetch,
  });
  saveSession({
    accessToken: "cookie",
    user: { id: "a", email: "a@example.invalid", onboarded: true, ready: true },
  });
  return {
    records,
    reads: () => reads,
    holdNextRead: () => {
      let release!: () => void;
      holdRead = new Promise<void>((resolve) => {
        release = resolve;
      });
      return () => release();
    },
    fail: (value: boolean) => {
      fail = value;
    },
  };
}
test("setup patches preserve questionnaire answers and queue before awaiting the save", async () => {
  const original = {
    firstName: "Jane",
    lastName: "Doe",
    jobTitle: "Compliance Manager",
    companyName: "Existing company",
    sector: "steel",
    installationId: "site-1",
    jurisdiction: "TH",
    currency: "USD",
    unit: "tCO₂e",
    onboarded: false,
    goalAchieve: ["Other: keep this", "Other: keep this"],
    currentManagement: [],
    biggestChallenge: ["Collecting emissions data"],
    cbamProductCount: "1–5",
    phone: "+66 38 123 456",
    lineId: "@existing",
    preservedExtra: { answers: [null, ""] },
  };
  const remote = server([
    { key: "certrace:profile", value: original, revision: 3 },
    {
      key: "certrace:notification-prefs",
      value: { enabled: false },
      revision: 1,
    },
  ]);
  await hydrateAccount("a");
  // The form's captured profile may predate other edits in this same session.
  patchStoredProfile({ firstName: "Janet" }, original);
  patchStoredProfile({ companyName: "Updated company" }, original);
  remote.fail(true);
  await assert.rejects(flushAccount());
  assert.deepEqual(remote.records.get("certrace:profile")?.value, original);
  remote.fail(false);
  await retryAccountSave();
  resetAccount();
  await hydrateAccount("a");
  assert.deepEqual(JSON.parse(accountStorage.getItem("certrace:profile")!), {
    ...original,
    firstName: "Janet",
    companyName: "Updated company",
  });
  assert.deepEqual(remote.records.get("certrace:notification-prefs")?.value, {
    enabled: false,
  });
});

test("hydration, ordered edits, and reload persist through the account API", async () => {
  const remote = server();
  await hydrateAccount("a");
  accountStorage.setItem("certrace:workspaces", '[{"id":"a"}]');
  await flushAccount();
  accountStorage.setItem("certrace:workspaces", '[{"id":"b"}]');
  await flushAccount();
  assert.equal(remote.records.get("certrace:workspaces")?.revision, 2);
  resetAccount();
  await hydrateAccount("a");
  assert.deepEqual(JSON.parse(accountStorage.getItem("certrace:workspaces")!), [
    { id: "b" },
  ]);
});
test("a failed write is retained, exportable, and retryable", async () => {
  const remote = server();
  await hydrateAccount("a");
  remote.fail(true);
  accountStorage.setItem("certrace:profile", '{"company":"Plant"}');
  await assert.rejects(flushAccount());
  assert.equal(accountSyncState().pending, 1);
  assert.equal(
    JSON.parse(exportPendingRecords()).records[0].value.company,
    "Plant",
  );
  remote.fail(false);
  await retryAccountSave();
  assert.equal(accountSyncState().pending, 0);
});
test("a second tab cannot silently overwrite a newer revision", async () => {
  const remote = server([{ key: "certrace:profile", value: {}, revision: 1 }]);
  await hydrateAccount("a");
  remote.records.set("certrace:profile", {
    key: "certrace:profile",
    value: { name: "Other tab" },
    revision: 2,
  });
  accountStorage.setItem("certrace:profile", '{"name":"This tab"}');
  await assert.rejects(flushAccount(), { status: 409 });
  assert.deepEqual(remote.records.get("certrace:profile")?.value, {
    name: "Other tab",
  });
  assert.equal(accountSyncState().pending, 1);
});
test("session expiration preserves unsaved edits and prevents cross-account upload", async () => {
  const remote = server();
  await hydrateAccount("a");
  remote.fail(true);
  accountStorage.setItem("certrace:profile", '{"private":true}');
  await assert.rejects(flushAccount());
  resetAccount();
  assert.equal(accountSyncState().pending, 1);
  saveSession({
    accessToken: "cookie",
    user: { id: "b", email: "b@example.invalid", onboarded: true, ready: true },
  });
  await assert.rejects(hydrateAccount("b"), /unsaved changes/);
  remote.fail(false);
  await assert.rejects(retryAccountSave(), /account that owns/);
  assert.equal(remote.records.size, 0);
});
test("public link working copies are separate from account and other link data", async () => {
  const remote = server([
    { key: "certrace:profile", value: { private: true }, revision: 1 },
  ]);
  await hydrateAccount("a");
  browser.location.pathname = "/w/first";
  assert.equal(accountStorage.getItem("certrace:profile"), null);
  accountStorage.setItem("certrace:profile", '{"public":true}');
  browser.location.pathname = "/w/second";
  assert.equal(accountStorage.getItem("certrace:profile"), null);
  browser.location.pathname = "/workspaces";
  assert.equal(accountStorage.getItem("certrace:profile"), '{"private":true}');
  assert.equal(remote.records.get("certrace:profile")?.revision, 1);
});

test("refresh receives supplier edits, account preferences and deletions from another session", async () => {
  const remote = server([
    { key: "certrace:workspaces", value: [{ id: "old" }], revision: 1 },
    { key: "certrace:notification-prefs", value: { email: true }, revision: 1 },
  ]);
  await hydrateAccount("a");
  remote.records.set("certrace:workspaces", {
    key: "certrace:workspaces",
    value: null,
    revision: 2,
  });
  remote.records.set("certrace:notification-prefs", {
    key: "certrace:notification-prefs",
    value: { email: false },
    revision: 2,
  });
  remote.records.set("certrace:monthly-data", {
    key: "certrace:monthly-data",
    value: { ws: { submitted: true } },
    revision: 1,
  });
  assert.equal(await refreshAccountRecords(), true);
  assert.equal(accountStorage.getItem("certrace:workspaces"), null);
  assert.deepEqual(
    JSON.parse(accountStorage.getItem("certrace:notification-prefs")!),
    { email: false },
  );
  assert.deepEqual(
    JSON.parse(accountStorage.getItem("certrace:monthly-data")!),
    { ws: { submitted: true } },
  );
  assert.equal(
    await refreshAccountRecords(),
    false,
    "unchanged reads must not trigger a render loop",
  );
});

test("refresh preserves a failed edit and its original revision so retry still detects conflict", async () => {
  const key = "certrace:profile";
  const remote = server([{ key, value: { name: "Original" }, revision: 1 }]);
  await hydrateAccount("a");
  remote.fail(true);
  accountStorage.setItem(key, '{"name":"Unsaved"}');
  await assert.rejects(flushAccount());
  remote.records.set(key, {
    key,
    value: { name: "Other session" },
    revision: 2,
  });
  assert.equal(await refreshAccountRecords(), false);
  assert.equal(accountStorage.getItem(key), '{"name":"Unsaved"}');
  remote.fail(false);
  await assert.rejects(retryAccountSave(), { status: 409 });
  assert.equal(accountSyncState().pending, 1);
  assert.deepEqual(remote.records.get(key)?.value, { name: "Other session" });
});

test("an older refresh response cannot roll back an acknowledged save", async () => {
  const key = "certrace:profile";
  const remote = server([{ key, value: { name: "Original" }, revision: 1 }]);
  await hydrateAccount("a");
  const release = remote.holdNextRead();
  const first = refreshAccountRecords();
  const second = refreshAccountRecords();
  assert.equal(
    first,
    second,
    "focus and visibility events share one in-flight read",
  );
  accountStorage.setItem(key, '{"name":"Saved while refreshing"}');
  await flushAccount();
  release();
  await first;
  assert.equal(remote.reads(), 2);
  assert.equal(
    accountStorage.getItem(key),
    '{"name":"Saved while refreshing"}',
  );
});

test("a late refresh cannot repopulate a signed-out account and public pages never refresh private stores", async () => {
  const remote = server([
    { key: "certrace:profile", value: { private: true }, revision: 1 },
  ]);
  await hydrateAccount("a");
  const release = remote.holdNextRead();
  const refresh = refreshAccountRecords();
  resetAccount();
  release();
  assert.equal(await refresh, false);
  assert.equal(accountStorage.getItem("certrace:profile"), null);
  await hydrateAccount("a");
  browser.location.pathname = "/p/public";
  const reads = remote.reads();
  assert.equal(await refreshAccountRecords(), false);
  assert.equal(remote.reads(), reads);
});

test("the server-backed workspace years are never offered as legacy account records", () => {
  assert.equal(isImportableLegacyKey("certrace:workspace-years"), false);
  assert.equal(isImportableLegacyKey("certrace:company:x"), false);
  assert.equal(isImportableLegacyKey("other:key"), false);
  assert.equal(isImportableLegacyKey("certrace:some-real-record"), true);
});

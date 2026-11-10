/* The monthly link carried by the server (lib/workspace-link-sync.ts).

   Two browsers are simulated by swapping the storage under the module: the
   exporter's, where the workspace lives, and the supplier's, which starts
   empty. The API is a stub that behaves like the smart-link routes. What is
   under test is that a month typed in the supplier's browser ends up in the
   exporter's, and that nothing else the exporter holds is lost on the way. */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

const g = globalThis as unknown as {
  window?: {
    localStorage: MemoryStorage;
    location: { origin: string; pathname: string };
  };
  localStorage?: MemoryStorage;
};
const exporterBrowser = new MemoryStorage();
const supplierBrowser = new MemoryStorage();
const inBrowser = (storage: MemoryStorage, token = "") => {
  g.window = {
    localStorage: storage,
    location: {
      origin: "https://portal.certrace.co",
      pathname: storage === supplierBrowser ? `/w/${token}` : "/workspaces",
    },
  };
  g.localStorage = storage;
};
inBrowser(exporterBrowser);

const { saveSession } = await import("../api/session");
const { configureApi } = await import("../api/config");
const sync = await import("../workspace-link-sync");

const { accountStorage, hydrateAccount, resetAccount, flushAccount } =
  await import("../account-storage");

const WS = "ws1";
const read = (storage: MemoryStorage, key: string) =>
  JSON.parse(accountStorage.getItem(key) ?? "null");

function seedExporter(): void {
  configureApi({ baseUrl: "" });
  resetAccount(true);
  exporterBrowser.clear();
  exporterBrowser.setItem(
    "certrace:workspaces",
    JSON.stringify([
      { id: WS, name: "Wire rod", year: 2026, installationId: "inst1" },
      { id: "other", name: "Other", year: 2026 },
    ]),
  );
  exporterBrowser.setItem(
    "certrace:installations",
    JSON.stringify([{ id: "inst1", name: "Rayong plant", city: "" }]),
  );
  exporterBrowser.setItem(
    "certrace:monthly-data",
    JSON.stringify({
      [WS]: [
        { id: "m1", workspaceId: WS, month: "2026-01", tonnes: 700 },
        { id: "m2", workspaceId: WS, month: "2026-02", tonnes: 720 },
      ],
      other: [{ id: "x", month: "2026-02", tonnes: 1 }],
    }),
  );
  exporterBrowser.setItem(
    "certrace:workspace-evidence",
    JSON.stringify({
      [WS]: [
        {
          id: "ev-exporter",
          month: "2026-01",
          fileName: "jan.pdf",
          fileDataUrl: "data:application/pdf;base64,AAAA",
          capturedAt: "2026-02-01",
        },
      ],
    }),
  );
}

/* A stub of the smart-link routes, holding one document and its links. */
function stubServer() {
  const docs = new Map<string, unknown>();
  const states = new Map<string, Record<string, unknown>>();
  let minted = 0;
  const revisions = new Map(
    [...exporterBrowser.map.keys()].map((key) => [key, 1]),
  );
  const controls = {
    beforeWrite: async (_kind: string) => {},
    failSubmit: false,
    writes: [] as string[],
  };
  const save = (
    key: string,
    value: unknown,
    revision = (revisions.get(key) ?? 0) + 1,
  ) => {
    exporterBrowser.setItem(key, JSON.stringify(value));
    revisions.set(key, revision);
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  configureApi({
    baseUrl: "https://api.certrace.co",
    fetchImpl: (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input).replace("https://api.certrace.co", "");
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      if (url === "/api/v1/reporting/records/batch" && method === "POST") {
        const records = body.records.map(
          (r: { key: string; value: unknown; revision: number }) => {
            save(r.key, r.value, r.revision + 1);
            return { ...r, revision: r.revision + 1 };
          },
        );
        return json({ records });
      }
      if (url === "/api/v1/account/records")
        return json({
          records: [...exporterBrowser.map].map(([key, value]) => ({
            key,
            value: JSON.parse(value),
            revision: revisions.get(key) ?? 1,
          })),
        });
      if (
        (url.startsWith("/api/v1/account/records/") ||
          url === "/api/v1/reporting/records") &&
        method === "PUT"
      ) {
        const key = body.key ?? decodeURIComponent(url.split("/").at(-1)!);
        save(key, body.value, body.revision + 1);
        return json({ key, value: body.value, revision: body.revision + 1 });
      }
      let m: RegExpMatchArray | null;
      if (
        (m = url.match(/^\/api\/v1\/declarations\/([^/]+)$/)) &&
        method === "PUT"
      ) {
        docs.set(decodeURIComponent(m[1]), body);
        return json(body);
      }
      if (
        (m = url.match(/^\/api\/v1\/declarations\/([^/]+)\/links$/)) &&
        method === "POST"
      ) {
        minted += 1;
        return json({ token: `srv-token-${minted}-${body.month}` }, 201);
      }
      if (
        (m = url.match(
          /^\/api\/v1\/declarations\/[^/]+\/submissions\/([^/]+)$/,
        ))
      ) {
        return json({
          token: m[1],
          state: states.get(decodeURIComponent(m[1])) ?? {
            status: "new",
            updatedAt: 0,
          },
        });
      }
      if ((m = url.match(/^\/api\/v1\/links\/([^/]+)$/))) {
        const token = decodeURIComponent(m[1]);
        const doc = docs.get(`ws-${WS}`) as { supplierView: unknown };
        return json({
          token,
          kind: "workspace",
          declId: `ws-${WS}`,
          supplierId: WS,
          month: token.split("-").slice(-2).join("-"),
          exporter: { companyName: "Siam" },
          workspace: doc.supplierView,
          state: states.get(token) ?? { status: "new" },
        });
      }
      if ((m = url.match(/^\/api\/v1\/links\/([^/]+)\/(state|submit)$/))) {
        const token = decodeURIComponent(m[1]);
        controls.writes.push(m[2]);
        await controls.beforeWrite(m[2]);
        if (m[2] === "submit" && controls.failSubmit)
          return json(
            {
              detail: {
                code: "SAVE_FAILED",
                message: "Submission unavailable",
              },
            },
            503,
          );
        const next = {
          ...body.state,
          updatedAt: Date.now(),
          ...(m[2] === "submit" ? { status: "submitted" } : {}),
        };
        if (m[2] === "submit") {
          const month = token.split("-").slice(-2).join("-");
          const key = "certrace:monthly-data";
          const own = JSON.parse(exporterBrowser.getItem(key)!);
          const rows = next.slice.stores[key]
            .filter((r: { month: string }) => r.month === month)
            .map((r: object) => ({ ...r, status: "submitted" }));
          next.slice.stores[key] = rows;
          own[WS] = [
            ...own[WS].filter((r: { month: string }) => r.month !== month),
            ...rows,
          ];
          save(key, own);
          const installations = JSON.parse(
            exporterBrowser.getItem("certrace:installations")!,
          );
          save(
            "certrace:installations",
            installations.map((r: { id: string }) =>
              r.id === next.slice.installation.id ? next.slice.installation : r,
            ),
          );
        }
        states.set(token, next);
        return json(next);
      }
      return json({ detail: { code: "NOT_STUBBED", message: url } }, 404);
    }) as unknown as typeof fetch,
  });
  saveSession({
    accessToken: "cookie",
    user: {
      id: "exporter",
      email: "exporter@example.invalid",
      onboarded: true,
      ready: true,
    },
  });
  return { docs, states, controls, save };
}

test("a server token is anything that is not base64 of ws|…", () => {
  assert.equal(sync.isServerToken(btoa("ws|abc|2026-03")), false);
  assert.equal(
    sync.isServerToken("Qk9x_Zp4-aQ7bW2cX9dE1fG3hJ5kL8mN0pR2sT4uV6w"),
    true,
  );
});

test("the slice carries this workspace only, and no file bytes", () => {
  inBrowser(exporterBrowser);
  seedExporter();
  const slice = sync.collectSlice(WS);

  assert.equal(slice.workspace?.id, WS);
  assert.equal(slice.installation?.id, "inst1");
  assert.equal((slice.stores["certrace:monthly-data"] as unknown[]).length, 2);
  const evidence = slice.stores["certrace:workspace-evidence"] as Record<
    string,
    unknown
  >[];
  assert.equal(evidence[0].fileName, "jan.pdf");
  assert.equal("fileDataUrl" in evidence[0], false);
});

test("a month typed in the supplier's browser reaches the exporter's", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetLinkSession();
  const server = stubServer();
  await hydrateAccount("exporter");

  // Exporter hands over March.
  const url = await sync.ensureWorkspaceLink(WS, "2026-03");
  assert.ok(url?.startsWith("https://portal.certrace.co/w/srv-token-"));
  const token = url!.split("/w/")[1];
  assert.equal(server.docs.has(`ws-${WS}`), true);
  // The same month is not minted twice.
  assert.equal(await sync.ensureWorkspaceLink(WS, "2026-03"), url);

  // The supplier opens it in a browser that has never seen the workspace.
  await flushAccount();
  inBrowser(supplierBrowser, token);
  supplierBrowser.clear();
  const opened = await sync.openWorkspaceLink(token);
  assert.equal(opened?.workspace.id, WS);
  assert.deepEqual(opened?.months, ["2026-03"]);
  assert.equal(
    read(supplierBrowser, "certrace:installations")[0].name,
    "Rayong plant",
  );

  // They fill in March and correct the installation's city.
  const monthly = read(supplierBrowser, "certrace:monthly-data");
  monthly[WS].push({
    id: "m3",
    workspaceId: WS,
    month: "2026-03",
    tonnes: 812,
  });
  accountStorage.setItem("certrace:monthly-data", JSON.stringify(monthly));
  const installations = read(supplierBrowser, "certrace:installations");
  installations[0].city = "Rayong";
  accountStorage.setItem(
    "certrace:installations",
    JSON.stringify(installations),
  );

  assert.equal(await sync.saveLinkIfChanged(), true);
  assert.equal(
    await sync.saveLinkIfChanged(),
    false,
    "nothing moved, nothing sent",
  );
  await sync.submitWorkspaceLink(
    { signatoryName: "Somchai", signatoryRole: "Plant manager" },
    { score: 96, warnings: 0 },
  );
  assert.equal(server.states.get(token)?.status, "submitted");

  // Back at the exporter: March arrives, January and February are untouched,
  // another workspace is untouched, and the January scan keeps its bytes.
  inBrowser(exporterBrowser);
  const changed = await sync.pullWorkspaceAnswers(WS);
  assert.deepEqual(changed, ["2026-03"]);
  const mine = read(exporterBrowser, "certrace:monthly-data");
  assert.deepEqual(
    mine[WS]
      .map((e: { month: string; tonnes: number }) => [e.month, e.tonnes])
      .sort(),
    [
      ["2026-01", 700],
      ["2026-02", 720],
      ["2026-03", 812],
    ],
  );
  assert.equal(mine.other.length, 1);
  assert.equal(
    read(exporterBrowser, "certrace:installations")[0].city,
    "Rayong",
  );
  assert.ok(
    read(exporterBrowser, "certrace:workspace-evidence")[WS][0].fileDataUrl,
  );

  // A newer owner correction must not be overwritten by the old supplier snapshot.
  const corrected = read(exporterBrowser, "certrace:monthly-data");
  corrected[WS].find((r: { month: string }) => r.month === "2026-03").tonnes =
    900;
  accountStorage.setItem("certrace:monthly-data", JSON.stringify(corrected));
  await flushAccount();
  assert.deepEqual(await sync.pullWorkspaceAnswers(WS), []);
  assert.equal(
    read(exporterBrowser, "certrace:monthly-data")[WS].find(
      (r: { month: string }) => r.month === "2026-03",
    ).tonnes,
    900,
  );

  // A second pull with nothing new changes nothing.
  assert.deepEqual(await sync.pullWorkspaceAnswers(WS), []);
});

test("reopening the link in the same tab does not overwrite unsaved typing", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetLinkSession();
  stubServer();
  await hydrateAccount("exporter");
  const url = await sync.ensureWorkspaceLink(WS, "2026-04");
  const token = url!.split("/w/")[1];

  await flushAccount();
  inBrowser(supplierBrowser, token);
  supplierBrowser.clear();
  await sync.openWorkspaceLink(token);
  const monthly = read(supplierBrowser, "certrace:monthly-data");
  monthly[WS].push({ id: "m4", workspaceId: WS, month: "2026-04", tonnes: 5 });
  accountStorage.setItem("certrace:monthly-data", JSON.stringify(monthly));

  // The query behind the page refetches on focus.
  await sync.openWorkspaceLink(token);

  const after = read(supplierBrowser, "certrace:monthly-data")[WS].map(
    (e: { month: string }) => e.month,
  );
  assert.ok(after.includes("2026-04"));
});

test("submission waits for autosave, stays editable on failure, and locks only on acknowledgement", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetLinkSession();
  const server = stubServer();
  await hydrateAccount("exporter");
  const url = await sync.ensureWorkspaceLink(WS, "2026-04");
  const token = url!.split("/w/")[1];
  await flushAccount();
  inBrowser(supplierBrowser, token);
  await sync.openWorkspaceLink(token);
  accountStorage.setItem(
    "certrace:workspace-evidence",
    JSON.stringify({ [WS]: [] }),
  );
  const monthly = read(supplierBrowser, "certrace:monthly-data");
  monthly[WS] = [
    { id: "m4", workspaceId: WS, month: "2026-04", tonnes: 5, status: "draft" },
  ];
  accountStorage.setItem("certrace:monthly-data", JSON.stringify(monthly));
  let release!: () => void;
  let began!: () => void;
  const started = new Promise<void>((resolve) => {
    began = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.controls.beforeWrite = async (kind) => {
    if (kind === "state") {
      began();
      await gate;
    }
  };
  server.controls.failSubmit = true;
  const draft = sync.saveLinkIfChanged();
  await started;
  const submit = sync.submitWorkspaceLink(
    { signatoryName: "Supplier", signatoryRole: "Manager" },
    { score: 100, warnings: 0 },
  );
  await Promise.resolve();
  assert.deepEqual(
    server.controls.writes,
    ["state"],
    "submission cannot overtake its pending draft",
  );
  assert.equal(
    read(supplierBrowser, "certrace:monthly-data")[WS][0].status,
    "draft",
  );
  release();
  await draft;
  await assert.rejects(submit);
  assert.equal(sync.activeLinkSession()?.state.status, "draft");
  assert.equal(
    read(supplierBrowser, "certrace:monthly-data")[WS][0].status,
    "draft",
  );
  server.controls.failSubmit = false;
  await sync.submitWorkspaceLink(
    { signatoryName: "Supplier", signatoryRole: "Manager" },
    { score: 100, warnings: 0 },
  );
  assert.equal(
    read(supplierBrowser, "certrace:monthly-data")[WS][0].status,
    "submitted",
  );
  assert.equal(
    await sync.saveLinkIfChanged(),
    false,
    "the acknowledged slice must not trigger a stale draft write",
  );

  const saved = server.states.get(token)!;
  const reopened = structuredClone(saved);
  reopened.status = "revision_requested";
  const slice = reopened.slice as {
    stores: Record<string, { status: string; tonnes: number }[]>;
  };
  slice.stores["certrace:monthly-data"][0] = {
    ...slice.stores["certrace:monthly-data"][0],
    status: "draft",
    tonnes: 8,
  };
  server.states.set(token, reopened);
  await sync.openWorkspaceLink(token);
  assert.equal(
    read(supplierBrowser, "certrace:monthly-data")[WS][0].tonnes,
    8,
    "reopening a closed link picks up the owner's corrected version",
  );
  assert.equal(
    read(supplierBrowser, "certrace:monthly-data")[WS][0].status,
    "draft",
  );
});

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

const g = globalThis as unknown as { window?: { localStorage: MemoryStorage; location: { origin: string } }; localStorage?: MemoryStorage };
const exporterBrowser = new MemoryStorage();
const supplierBrowser = new MemoryStorage();
const inBrowser = (storage: MemoryStorage) => {
  g.window = { localStorage: storage, location: { origin: "https://portal.certrace.co" } };
  g.localStorage = storage;
};
inBrowser(exporterBrowser);

const { configureApi } = await import("../api/config");
const sync = await import("../workspace-link-sync");

const WS = "ws1";
const read = (storage: MemoryStorage, key: string) => JSON.parse(storage.getItem(key) ?? "null");

function seedExporter(): void {
  exporterBrowser.clear();
  exporterBrowser.setItem("certrace:workspaces", JSON.stringify([{ id: WS, name: "Wire rod", year: 2026, installationId: "inst1" }, { id: "other", name: "Other", year: 2026 }]));
  exporterBrowser.setItem("certrace:installations", JSON.stringify([{ id: "inst1", name: "Rayong plant", city: "" }]));
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
    JSON.stringify({ [WS]: [{ id: "ev-exporter", month: "2026-01", fileName: "jan.pdf", fileDataUrl: "data:application/pdf;base64,AAAA", capturedAt: "2026-02-01" }] }),
  );
}

/* A stub of the smart-link routes, holding one document and its links. */
function stubServer() {
  const docs = new Map<string, unknown>();
  const states = new Map<string, Record<string, unknown>>();
  let minted = 0;
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  configureApi({
    baseUrl: "https://api.certrace.co",
    fetchImpl: (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input).replace("https://api.certrace.co", "");
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      let m: RegExpMatchArray | null;
      if ((m = url.match(/^\/api\/v1\/declarations\/([^/]+)$/)) && method === "PUT") {
        docs.set(decodeURIComponent(m[1]), body);
        return json(body);
      }
      if ((m = url.match(/^\/api\/v1\/declarations\/([^/]+)\/links$/)) && method === "POST") {
        minted += 1;
        return json({ token: `srv-token-${minted}-${body.month}` }, 201);
      }
      if ((m = url.match(/^\/api\/v1\/declarations\/[^/]+\/submissions\/([^/]+)$/))) {
        return json({ token: m[1], state: states.get(decodeURIComponent(m[1])) ?? { status: "new", updatedAt: 0 } });
      }
      if ((m = url.match(/^\/api\/v1\/links\/([^/]+)$/))) {
        const token = decodeURIComponent(m[1]);
        const doc = docs.get(`ws-${WS}`) as { supplierView: unknown };
        return json({ token, kind: "workspace", declId: `ws-${WS}`, supplierId: WS, month: token.split("-").slice(-2).join("-"), exporter: { companyName: "Siam" }, workspace: doc.supplierView, state: states.get(token) ?? { status: "new" } });
      }
      if ((m = url.match(/^\/api\/v1\/links\/([^/]+)\/(state|submit)$/))) {
        const token = decodeURIComponent(m[1]);
        const next = { ...body.state, updatedAt: Date.now(), ...(m[2] === "submit" ? { status: "submitted" } : {}) };
        states.set(token, next);
        return json(next);
      }
      return json({ detail: { code: "NOT_STUBBED", message: url } }, 404);
    }) as unknown as typeof fetch,
  });
  return { docs, states };
}

test("a server token is anything that is not base64 of ws|…", () => {
  assert.equal(sync.isServerToken(btoa("ws|abc|2026-03")), false);
  assert.equal(sync.isServerToken("Qk9x_Zp4-aQ7bW2cX9dE1fG3hJ5kL8mN0pR2sT4uV6w"), true);
});

test("the slice carries this workspace only, and no file bytes", () => {
  inBrowser(exporterBrowser);
  seedExporter();
  const slice = sync.collectSlice(WS);

  assert.equal(slice.workspace?.id, WS);
  assert.equal(slice.installation?.id, "inst1");
  assert.equal((slice.stores["certrace:monthly-data"] as unknown[]).length, 2);
  const evidence = slice.stores["certrace:workspace-evidence"] as Record<string, unknown>[];
  assert.equal(evidence[0].fileName, "jan.pdf");
  assert.equal("fileDataUrl" in evidence[0], false);
});

test("a month typed in the supplier's browser reaches the exporter's", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetLinkSession();
  const server = stubServer();

  // Exporter hands over March.
  const url = await sync.ensureWorkspaceLink(WS, "2026-03");
  assert.ok(url?.startsWith("https://portal.certrace.co/w/srv-token-"));
  const token = url!.split("/w/")[1];
  assert.equal(server.docs.has(`ws-${WS}`), true);
  // The same month is not minted twice.
  assert.equal(await sync.ensureWorkspaceLink(WS, "2026-03"), url);

  // The supplier opens it in a browser that has never seen the workspace.
  inBrowser(supplierBrowser);
  supplierBrowser.clear();
  const opened = await sync.openWorkspaceLink(token);
  assert.equal(opened?.workspace.id, WS);
  assert.deepEqual(opened?.months, ["2026-03"]);
  assert.equal(read(supplierBrowser, "certrace:installations")[0].name, "Rayong plant");

  // They fill in March and correct the installation's city.
  const monthly = read(supplierBrowser, "certrace:monthly-data");
  monthly[WS].push({ id: "m3", workspaceId: WS, month: "2026-03", tonnes: 812 });
  supplierBrowser.setItem("certrace:monthly-data", JSON.stringify(monthly));
  const installations = read(supplierBrowser, "certrace:installations");
  installations[0].city = "Rayong";
  supplierBrowser.setItem("certrace:installations", JSON.stringify(installations));

  assert.equal(await sync.saveLinkIfChanged(), true);
  assert.equal(await sync.saveLinkIfChanged(), false, "nothing moved, nothing sent");
  await sync.submitWorkspaceLink({ signatoryName: "Somchai", signatoryRole: "Plant manager" }, { score: 96, warnings: 0 });
  assert.equal(server.states.get(token)?.status, "submitted");

  // Back at the exporter: March arrives, January and February are untouched,
  // another workspace is untouched, and the January scan keeps its bytes.
  inBrowser(exporterBrowser);
  const changed = await sync.pullWorkspaceAnswers(WS);
  assert.deepEqual(changed, ["2026-03"]);
  const mine = read(exporterBrowser, "certrace:monthly-data");
  assert.deepEqual(
    mine[WS].map((e: { month: string; tonnes: number }) => [e.month, e.tonnes]).sort(),
    [
      ["2026-01", 700],
      ["2026-02", 720],
      ["2026-03", 812],
    ],
  );
  assert.equal(mine.other.length, 1);
  assert.equal(read(exporterBrowser, "certrace:installations")[0].city, "Rayong");
  assert.ok(read(exporterBrowser, "certrace:workspace-evidence")[WS][0].fileDataUrl);

  // A second pull with nothing new changes nothing.
  assert.deepEqual(await sync.pullWorkspaceAnswers(WS), []);
});

test("reopening the link in the same tab does not overwrite unsaved typing", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetLinkSession();
  stubServer();
  const url = await sync.ensureWorkspaceLink(WS, "2026-04");
  const token = url!.split("/w/")[1];

  inBrowser(supplierBrowser);
  supplierBrowser.clear();
  await sync.openWorkspaceLink(token);
  const monthly = read(supplierBrowser, "certrace:monthly-data");
  monthly[WS].push({ id: "m4", workspaceId: WS, month: "2026-04", tonnes: 5 });
  supplierBrowser.setItem("certrace:monthly-data", JSON.stringify(monthly));

  // The query behind the page refetches on focus.
  await sync.openWorkspaceLink(token);

  const after = read(supplierBrowser, "certrace:monthly-data")[WS].map((e: { month: string }) => e.month);
  assert.ok(after.includes("2026-04"));
});

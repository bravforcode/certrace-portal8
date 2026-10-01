/* The precursor link carried by the server (lib/precursor-link-sync.ts).

   Two browsers are simulated by swapping the storage under the module: the
   exporter's, where the chain lives, and the precursor producer's, which
   starts empty — the case the local /p/ link could never serve. The API is a
   stub that behaves like the smart-link routes. What is under test: an answer
   typed in the producer's browser reaches the exporter's row; the producer is
   sent only their own row; and what comes back can change only the fields
   the form edits. */

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
const sync = await import("../precursor-link-sync");
const { getSupplier } = await import("../precursor-suppliers");

const WS = "ws1";
const read = (storage: MemoryStorage, key: string) => JSON.parse(storage.getItem(key) ?? "null");

const baseRow = {
  workspaceId: WS,
  parentId: null,
  country: "TH",
  cnCode: "7207 11 90",
  productionRoute: "Scrap-based EAF",
  isScrap: false,
  dataOrigin: "supplier_unverified",
  monthlyQuantities: [],
  seeTco2ePerT: null,
  origin: "purchased",
};

function seedExporter(): void {
  exporterBrowser.clear();
  exporterBrowser.setItem(
    "certrace:workspaces",
    JSON.stringify([{ id: WS, installationName: "Rayong Works", installationId: "inst1", productName: "Wire rod", year: 2026, periodStart: "2026-01-01", periodEnd: "2026-12-31", declarationIds: [] }]),
  );
  exporterBrowser.setItem(
    "certrace:precursor-suppliers",
    JSON.stringify({
      [WS]: [
        { ...baseRow, id: "p1", name: "Chonburi Foundry", installationName: "Works No. 2", precursorName: "Steel billet", contactEmail: "plant@chonburi.example" },
        // Another tier's row, with a figure of its own: never sent to p1.
        { ...baseRow, id: "p2", parentId: "p1", name: "Upstream Mill", installationName: "Mill", precursorName: "Pig iron", specificEmbeddedDirectTco2PerT: 2.1 },
      ],
    }),
  );
  exporterBrowser.setItem(
    "certrace:workspace-evidence",
    JSON.stringify({
      [WS]: [
        { id: "ev-p1", workspaceId: WS, fieldKeys: ["precursor:p1"], fileName: "old-report.pdf", fileDataUrl: "data:application/pdf;base64,AAAA", capturedAt: "2026-01-01" },
        { id: "ev-other", workspaceId: WS, fieldKeys: ["monthly:2026-01"], fileName: "invoice.pdf", capturedAt: "2026-01-02" },
      ],
    }),
  );
}

/* A stub of the smart-link routes. Submit appends a server version. */
function stubServer() {
  const docs = new Map<string, { supplierView: unknown }>();
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
        return json({ token: `Srv${minted}Qk9x_Zp4-aQ7bW2cX9dE1fG3hJ5kL8mN0pR2s` }, 201);
      }
      if ((m = url.match(/^\/api\/v1\/declarations\/[^/]+\/submissions\/([^/]+)$/))) {
        return json({ token: m[1], state: states.get(decodeURIComponent(m[1])) ?? { status: "new", updatedAt: 0 } });
      }
      if ((m = url.match(/^\/api\/v1\/links\/([^/]+)$/))) {
        const token = decodeURIComponent(m[1]);
        const doc = docs.get(`pr-${WS}-p1`);
        return json({ token, kind: "workspace", supplierId: "p1", workspace: doc?.supplierView ?? null, state: states.get(token) ?? null });
      }
      if ((m = url.match(/^\/api\/v1\/links\/([^/]+)\/(state|submit)$/))) {
        const token = decodeURIComponent(m[1]);
        const prior = states.get(token) ?? {};
        const versions = Array.isArray(prior.versions) ? (prior.versions as unknown[]) : [];
        const next =
          m[2] === "submit"
            ? { ...body.state, status: "submitted", versions: [...versions, { n: versions.length + 1, submittedAt: Date.now() }], updatedAt: Date.now() }
            : { ...body.state, versions, updatedAt: Date.now() };
        states.set(token, next);
        return json(next);
      }
      return json({ detail: { code: "NOT_STUBBED", message: url } }, 404);
    }) as unknown as typeof fetch,
  });
  return { docs, states };
}

test("a server token is anything that is not base64 of pr|…", () => {
  assert.equal(sync.isServerPrecursorToken(btoa("pr|ws1|p1")), false);
  assert.equal(sync.isServerPrecursorToken("Qk9x_Zp4-aQ7bW2cX9dE1fG3hJ5kL8mN0pR2sT4uV6w"), true);
  assert.equal(sync.isServerPrecursorToken(undefined), false);
});

test("the producer is sent their own row, its evidence, and nothing else", () => {
  inBrowser(exporterBrowser);
  seedExporter();
  const slice = sync.collectPrecursorSlice(WS, "p1");

  assert.equal(slice?.asker, "Rayong Works");
  assert.equal(slice?.node.id, "p1");
  assert.equal(slice?.node.precursorName, "Steel billet");
  // Context the submit gate needs, read-only.
  assert.equal(slice?.node.origin, "purchased");
  // The exporter's own fields stay home.
  assert.equal("contactEmail" in (slice?.node ?? {}), false);
  assert.equal("parentId" in (slice?.node ?? {}), false);
  assert.equal("dataOrigin" in (slice?.node ?? {}), false);
  // Only this row's evidence, and without its bytes.
  assert.deepEqual(slice?.evidence.map((e) => e.id), ["ev-p1"]);
  assert.equal("fileDataUrl" in (slice?.evidence[0] ?? {}), false);
  // No other tier, no workspace record.
  assert.equal(JSON.stringify(slice).includes("Upstream Mill"), false);
  assert.equal(JSON.stringify(slice).includes("Wire rod"), false);
});

test("an answer typed in the producer's browser reaches the exporter's row", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetPrecursorSession();
  const server = stubServer();

  // Exporter hands the link over; it is minted once and kept on the row.
  const url = await sync.ensurePrecursorLink(WS, "p1");
  assert.ok(url?.startsWith("https://portal.certrace.co/p/Srv1"));
  assert.equal(await sync.ensurePrecursorLink(WS, "p1"), url);
  const token = url!.split("/p/")[1];
  assert.equal(getSupplier(WS, "p1")?.smartLinkToken, token);
  assert.ok(server.docs.has(`pr-${WS}-p1`));

  // The producer opens it in a browser that has never seen the chain.
  inBrowser(supplierBrowser);
  supplierBrowser.clear();
  const opened = await sync.openPrecursorLink(token);
  assert.equal(opened?.server, true);
  assert.equal(opened?.asker, "Rayong Works");
  assert.equal(opened?.node.precursorName, "Steel billet");
  assert.equal(read(supplierBrowser, "certrace:precursor-suppliers")[WS].length, 1, "only their own row");

  // They fill in their figures and verification.
  const draft = {
    ...opened!.node,
    specificEmbeddedDirectTco2PerT: 1.42,
    verifierName: "SGS Thailand",
    installationUniqueId: "TH-CHON-0042",
  };
  assert.equal(await sync.savePrecursorDraft(draft), true);
  assert.equal(await sync.savePrecursorDraft(draft), false, "nothing moved, nothing sent");

  // A draft is not merged on the exporter's side — only an open is noted.
  inBrowser(exporterBrowser);
  assert.deepEqual(await sync.pullPrecursorAnswers(WS), ["p1"]);
  assert.equal(getSupplier(WS, "p1")?.specificEmbeddedDirectTco2PerT, undefined);
  assert.ok(getSupplier(WS, "p1")?.smartLinkOpenedAt);

  // They submit.
  inBrowser(supplierBrowser);
  await sync.submitPrecursorLink(draft);
  assert.equal(server.states.get(token)?.status, "submitted");

  // Back at the exporter: the answer lands on the row, stamped as submitted.
  inBrowser(exporterBrowser);
  assert.deepEqual(await sync.pullPrecursorAnswers(WS), ["p1"]);
  const row = getSupplier(WS, "p1");
  assert.equal(row?.specificEmbeddedDirectTco2PerT, 1.42);
  assert.equal(row?.verifierName, "SGS Thailand");
  // Submitted as the producer's own figure — and then put through the
  // store's verification gate (saveSupplier), which downgrades it to the
  // default when the report's facts do not check out. These do not.
  assert.equal(row?.dataOrigin, "default_value");
  assert.ok(row?.smartLinkSubmittedAt);
  // The other tier and the exporter's own fields are untouched.
  assert.equal(getSupplier(WS, "p2")?.specificEmbeddedDirectTco2PerT, 2.1);
  assert.equal(row?.contactEmail, "plant@chonburi.example");

  // A second pull with nothing new changes nothing.
  assert.deepEqual(await sync.pullPrecursorAnswers(WS), []);
});

test("an answer cannot rewrite where the row sits or what it is", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetPrecursorSession();
  const server = stubServer();
  const url = await sync.ensurePrecursorLink(WS, "p1");
  const token = url!.split("/p/")[1];

  // A blob sent straight to the link, not through the form.
  server.states.set(token, {
    status: "submitted",
    versions: [{ n: 1, submittedAt: Date.now() }],
    updatedAt: Date.now(),
    slice: {
      node: {
        id: "p1",
        precursorName: "Steel billet (corrected)",
        parentId: "p2",
        isScrap: true,
        dataOrigin: "default_value",
        smartLinkToken: "someone-elses",
        contactEmail: "attacker@example.com",
        workspaceId: "other-ws",
      },
      evidence: [{ id: "ev-new", fieldKeys: ["monthly:2026-01"], fileName: "report.pdf" }],
    },
  });

  await sync.pullPrecursorAnswers(WS);
  const row = getSupplier(WS, "p1");
  assert.equal(row?.precursorName, "Steel billet (corrected)", "a form field does change");
  assert.equal(row?.parentId, null);
  assert.equal(row?.isScrap, false);
  assert.equal(row?.smartLinkToken, token);
  assert.equal(row?.contactEmail, "plant@chonburi.example");
  // Incoming evidence is filed under this row's key, whatever it claimed.
  const filed = read(exporterBrowser, "certrace:workspace-evidence")[WS].find((e: { id: string }) => e.id === "ev-new");
  assert.deepEqual(filed.fieldKeys, ["precursor:p1"]);
});

test("without a backend the link stays local, as before", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  configureApi({ baseUrl: "", fetchImpl: null });
  assert.equal(await sync.ensurePrecursorLink(WS, "p1"), null);
  assert.deepEqual(await sync.pullPrecursorAnswers(WS), []);
});

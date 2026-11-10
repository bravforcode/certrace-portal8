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
      pathname: storage === supplierBrowser ? `/p/${token}` : "/workspaces",
    },
  };
  g.localStorage = storage;
};
inBrowser(exporterBrowser);

const { saveSession } = await import("../api/session");
const { configureApi } = await import("../api/config");
const sync = await import("../precursor-link-sync");
const { getSupplier } = await import("../precursor-suppliers");

const { accountStorage, hydrateAccount, resetAccount, flushAccount } =
  await import("../account-storage");

const WS = "ws1";
const read = (storage: MemoryStorage, key: string) =>
  JSON.parse(accountStorage.getItem(key) ?? "null");

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
  configureApi({ baseUrl: "" });
  resetAccount(true);
  exporterBrowser.clear();
  exporterBrowser.setItem(
    "certrace:workspaces",
    JSON.stringify([
      {
        id: WS,
        installationName: "Rayong Works",
        installationId: "inst1",
        productName: "Wire rod",
        year: 2026,
        periodStart: "2026-01-01",
        periodEnd: "2026-12-31",
        declarationIds: [],
      },
    ]),
  );
  exporterBrowser.setItem(
    "certrace:precursor-suppliers",
    JSON.stringify({
      [WS]: [
        {
          ...baseRow,
          id: "p1",
          name: "Chonburi Foundry",
          installationName: "Works No. 2",
          precursorName: "Steel billet",
          qtyPerTonneOverride: 1.2,
          contactEmail: "plant@chonburi.example",
        },
        // Another tier's row, with a figure of its own: never sent to p1.
        {
          ...baseRow,
          id: "p2",
          parentId: "p1",
          name: "Upstream Mill",
          installationName: "Mill",
          precursorName: "Pig iron",
          specificEmbeddedDirectTco2PerT: 2.1,
        },
      ],
    }),
  );
  exporterBrowser.setItem(
    "certrace:workspace-evidence",
    JSON.stringify({
      [WS]: [
        {
          id: "ev-p1",
          workspaceId: WS,
          fieldKeys: ["precursor:p1"],
          fileName: "old-report.pdf",
          fileDataUrl: "data:application/pdf;base64,AAAA",
          capturedAt: "2026-01-01",
        },
        {
          id: "ev-summary",
          workspaceId: WS,
          fieldKeys: ["precursor:p1:summary"],
          fileName: "summary.pdf",
          serverFileId: "stored-summary",
          capturedAt: "2026-01-01",
        },
        {
          id: "ev-p10",
          workspaceId: WS,
          fieldKeys: ["precursor:p10:summary"],
          fileName: "other-producer.pdf",
          capturedAt: "2026-01-01",
        },
        {
          id: "ev-other",
          workspaceId: WS,
          fieldKeys: ["monthly:2026-01"],
          fileName: "invoice.pdf",
          capturedAt: "2026-01-02",
        },
      ],
    }),
  );
}

/* A stub of the smart-link routes. Submit appends a server version. */
function stubServer() {
  const revisions = new Map<string, number>();
  const docs = new Map<string, { supplierView: unknown }>();
  const states = new Map<string, Record<string, unknown>>();
  let minted = 0;
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
            exporterBrowser.setItem(r.key, JSON.stringify(r.value));
            revisions.set(r.key, r.revision + 1);
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
        exporterBrowser.setItem(key, JSON.stringify(body.value));
        revisions.set(key, body.revision + 1);
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
        return json(
          { token: `Srv${minted}Qk9x_Zp4-aQ7bW2cX9dE1fG3hJ5kL8mN0pR2s` },
          201,
        );
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
        const doc = docs.get(`pr-${WS}-p1`);
        return json({
          token,
          kind: "workspace",
          supplierId: "p1",
          workspace: doc?.supplierView ?? null,
          state: states.get(token) ?? null,
        });
      }
      if ((m = url.match(/^\/api\/v1\/links\/([^/]+)\/(state|submit)$/))) {
        const token = decodeURIComponent(m[1]);
        const prior = states.get(token) ?? {};
        const versions = Array.isArray(prior.versions)
          ? (prior.versions as unknown[])
          : [];
        const next =
          m[2] === "submit"
            ? {
                ...body.state,
                status: "submitted",
                versions: [
                  ...versions,
                  { n: versions.length + 1, submittedAt: Date.now() },
                ],
                updatedAt: Date.now(),
              }
            : { ...body.state, versions, updatedAt: Date.now() };
        states.set(token, next);
        if (m[2] === "submit") {
          // Model the backend's accepted record; owner pulls read this record,
          // never the supplier's editable state. Integration tests cover promotion.
          const key = "certrace:precursor-suppliers";
          const rows = JSON.parse(exporterBrowser.getItem(key)!);
          const unavailable = body.state.slice.reportUnavailable === true;
          rows[WS] = rows[WS].map((row: Record<string, unknown>) =>
            row.id !== "p1"
              ? row
              : {
                  ...row,
                  ...body.state.slice.node,
                  supplierResponseReceived: true,
                  supplierReportUnavailable: unavailable,
                  dataOrigin: unavailable
                    ? "supplier_unverified"
                    : "supplier_verified",
                  smartLinkSubmittedAt: new Date().toISOString(),
                  ...(unavailable
                    ? {
                        specificEmbeddedDirectTco2PerT: null,
                        specificEmbeddedIndirectTco2PerT: null,
                        seeTco2ePerT: null,
                      }
                    : {}),
                },
          );
          exporterBrowser.setItem(key, JSON.stringify(rows));
          revisions.set(key, (revisions.get(key) ?? 1) + 1);
        }
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
  return { docs, states };
}

test("a server token is anything that is not base64 of pr|…", () => {
  assert.equal(sync.isServerPrecursorToken(btoa("pr|ws1|p1")), false);
  assert.equal(
    sync.isServerPrecursorToken("Qk9x_Zp4-aQ7bW2cX9dE1fG3hJ5kL8mN0pR2sT4uV6w"),
    true,
  );
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
  assert.equal("qtyPerTonneOverride" in (slice?.node ?? {}), false);
  // Only this row's evidence, and without its bytes.
  assert.deepEqual(
    slice?.evidence.map((e) => e.id),
    ["ev-p1", "ev-summary"],
  );
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
  await hydrateAccount("exporter");

  // Exporter hands the link over; it is minted once and kept on the row.
  const url = await sync.ensurePrecursorLink(WS, "p1");
  assert.ok(url?.startsWith("https://portal.certrace.co/p/Srv1"));
  assert.equal(await sync.ensurePrecursorLink(WS, "p1"), url);
  const token = url!.split("/p/")[1];
  assert.equal(getSupplier(WS, "p1")?.smartLinkToken, token);
  assert.ok(server.docs.has(`pr-${WS}-p1`));

  // The producer opens it in a browser that has never seen the chain.
  await flushAccount();
  inBrowser(supplierBrowser, token);
  supplierBrowser.clear();
  const opened = await sync.openPrecursorLink(token);
  assert.equal(opened?.server, true);
  assert.equal(opened?.asker, "Rayong Works");
  assert.equal(opened?.node.precursorName, "Steel billet");
  assert.equal(
    read(supplierBrowser, "certrace:precursor-suppliers")[WS].length,
    1,
    "only their own row",
  );

  // They fill in their figures and verification.
  const draft = {
    ...opened!.node,
    specificEmbeddedDirectTco2PerT: 1.42,
    verifierName: "SGS Thailand",
    installationUniqueId: "TH-CHON-0042",
  };
  assert.equal(await sync.savePrecursorDraft(draft), true);
  assert.equal(
    (server.states.get(token)?.slice as { reportUnavailable?: boolean })
      .reportUnavailable,
    false,
    "an unverified draft is not a declaration that no report exists",
  );
  assert.equal(
    await sync.savePrecursorDraft(draft),
    false,
    "nothing moved, nothing sent",
  );

  // A draft is not merged on the exporter's side — only an open is noted.
  inBrowser(exporterBrowser);
  assert.deepEqual(await sync.pullPrecursorAnswers(WS), ["p1"]);
  assert.equal(
    getSupplier(WS, "p1")?.specificEmbeddedDirectTco2PerT,
    undefined,
  );
  assert.ok(getSupplier(WS, "p1")?.smartLinkOpenedAt);

  // They submit.
  await flushAccount();
  inBrowser(supplierBrowser, token);
  await sync.submitPrecursorLink(draft);
  assert.equal(server.states.get(token)?.status, "submitted");

  // Back at the exporter: the answer lands on the row, stamped as submitted.
  inBrowser(exporterBrowser);
  assert.deepEqual(await sync.pullPrecursorAnswers(WS), ["p1"]);
  const row = getSupplier(WS, "p1");
  assert.equal(row?.specificEmbeddedDirectTco2PerT, 1.42);
  assert.equal(row?.verifierName, "SGS Thailand");
  // A submitted actual-value claim stays pending until its verification
  // report passes the checks; it is never relabelled as an EU default.
  // Receipt alone does not make an incomplete verification package admissible.
  assert.equal(row?.dataOrigin, "default_value");
  assert.equal(row?.verificationChecks?.fileIntact, false);
  assert.ok(row?.smartLinkSubmittedAt);
  // The other tier and the exporter's own fields are untouched.
  assert.equal(getSupplier(WS, "p2")?.specificEmbeddedDirectTco2PerT, 2.1);
  assert.equal(row?.contactEmail, "plant@chonburi.example");
  assert.equal(row?.qtyPerTonneOverride, 1.2);

  // A second pull with nothing new changes nothing.
  assert.deepEqual(await sync.pullPrecursorAnswers(WS), []);
});

test("a producer can say no verified report is available without supplying emissions", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetPrecursorSession();
  stubServer();
  await hydrateAccount("exporter");
  const url = await sync.ensurePrecursorLink(WS, "p1");
  const token = url!.split("/p/")[1];
  await flushAccount();

  inBrowser(supplierBrowser, token);
  supplierBrowser.clear();
  const opened = await sync.openPrecursorLink(token);
  await sync.submitPrecursorLink({
    ...opened!.node,
    dataOrigin: "supplier_unverified",
    supplierReportUnavailable: true,
    specificEmbeddedDirectTco2PerT: null,
    specificEmbeddedIndirectTco2PerT: null,
  });

  inBrowser(exporterBrowser);
  assert.deepEqual(await sync.pullPrecursorAnswers(WS), ["p1"]);
  const row = getSupplier(WS, "p1");
  assert.equal(row?.supplierResponseReceived, true);
  assert.equal(row?.dataOrigin, "supplier_unverified");
  assert.equal(row?.seeTco2ePerT, null);
  assert.equal(row?.qtyPerTonneOverride, 1.2);
});

test("pulling a supplier state cannot replay its draft over the canonical owner row", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetPrecursorSession();
  const server = stubServer();
  await hydrateAccount("exporter");
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
      evidence: [
        {
          id: "ev-new",
          fieldKeys: ["monthly:2026-01"],
          fileName: "report.pdf",
        },
      ],
    },
  });

  await sync.pullPrecursorAnswers(WS);
  const row = getSupplier(WS, "p1");
  assert.equal(
    row?.precursorName,
    "Steel billet",
    "only the backend's accepted record may change the owner row",
  );
  assert.equal(row?.parentId, null);
  assert.equal(row?.isScrap, false);
  assert.equal(row?.smartLinkToken, token);
  assert.equal(row?.contactEmail, "plant@chonburi.example");
  // Unaccepted evidence in a supplier draft must not appear in the owner's pack.
  const filed = read(exporterBrowser, "certrace:workspace-evidence")[WS].find(
    (e: { id: string }) => e.id === "ev-new",
  );
  assert.equal(filed, undefined);
});

test("without a backend the link stays local, as before", async () => {
  inBrowser(exporterBrowser);
  seedExporter();
  configureApi({ baseUrl: "", fetchImpl: null });
  assert.equal(await sync.ensurePrecursorLink(WS, "p1"), null);
  assert.deepEqual(await sync.pullPrecursorAnswers(WS), []);
});

async function producer() {
  inBrowser(exporterBrowser);
  seedExporter();
  sync.resetPrecursorSession();
  const server = stubServer();
  await hydrateAccount("exporter");
  const url = await sync.ensurePrecursorLink(WS, "p1");
  const token = url!.split("/p/")[1];
  inBrowser(supplierBrowser, token);
  const opened = await sync.openPrecursorLink(token);
  return { server, token, draft: opened!.node };
}

test("the existing summary document uploads, retries and reopens in its own slot without borrowing another producer's files", async () => {
  const { server, token, draft } = await producer();
  const key = "certrace:workspace-evidence";
  type Evidence = { id: string; fieldKeys: string[]; serverFileId?: string };
  const evidence = read(supplierBrowser, key)[WS] as Evidence[];
  assert.deepEqual(evidence.find((e) => e.id === "ev-summary")!.fieldKeys, [
    "precursor:p1:summary",
  ]);
  accountStorage.setItem(
    key,
    JSON.stringify({
      [WS]: [
        {
          ...evidence.find((e) => e.id === "ev-p1"),
          serverFileId: "stored-report",
        },
        {
          ...evidence.find((e) => e.id === "ev-summary"),
          serverFileId: undefined,
          fileDataUrl: "data:application/pdf;base64,JVBERi0xLjQ=",
        },
        {
          id: "unrelated",
          fieldKeys: ["precursor:p10:summary"],
          fileName: "other.pdf",
          fileDataUrl: "data:application/pdf;base64,JVBERi0xLjQ=",
        },
      ],
    }),
  );
  const { apiFetch } = await import("../api/config");
  const underlying = apiFetch();
  let fail = true;
  const uploads: string[] = [];
  configureApi({
    fetchImpl: (async (input, init) => {
      const url = new URL(String(input), "https://portal.certrace.co");
      if (url.pathname.endsWith("/files") && init?.method === "POST") {
        uploads.push(url.searchParams.get("docId")!);
        if (fail)
          return new Response(
            JSON.stringify({
              detail: { code: "OFFLINE", message: "Try again" },
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        return new Response(
          JSON.stringify({
            id: "uploaded-summary",
            declarationId: "pr-ws1-p1",
            docId: "ev-summary",
            filename: "summary.pdf",
            contentType: "application/pdf",
            sizeBytes: 8,
            sha256: "test",
            uploadedAt: Date.now(),
            uploadedBySupplier: true,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      return underlying(input, init);
    }) as typeof fetch,
  });
  await assert.rejects(
    sync.savePrecursorDraft(draft),
    /Could not upload summary.pdf: Try again/,
  );
  assert.equal(server.states.has(token), false);
  fail = false;
  await sync.savePrecursorDraft(draft);
  assert.deepEqual(uploads, ["ev-summary", "ev-summary"]);
  accountStorage.removeItem(key);
  sync.resetPrecursorSession();
  await sync.openPrecursorLink(token);
  const restored = read(supplierBrowser, key)[WS] as Evidence[];
  assert.deepEqual(restored.find((e) => e.id === "ev-summary")!.fieldKeys, [
    "precursor:p1:summary",
  ]);
  assert.equal(
    restored.find((e) => e.id === "ev-summary")!.serverFileId,
    "uploaded-summary",
  );
  assert.equal(
    restored.some((e) => e.id === "unrelated"),
    false,
  );
  accountStorage.setItem(key, JSON.stringify({ [WS]: [] }));
  await sync.savePrecursorDraft(draft);
  sync.resetPrecursorSession();
  await sync.openPrecursorLink(token);
  assert.deepEqual(
    read(supplierBrowser, key)[WS],
    [],
    "removed files must not return from the original invitation snapshot",
  );
});

test("autosaves finish before submission, so a slow draft cannot replace the submitted answer", async () => {
  const { server, token, draft } = await producer();
  const { apiFetch } = await import("../api/config");
  const underlying = apiFetch();
  let release!: () => void;
  let entered!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const calls: string[] = [];
  configureApi({
    fetchImpl: (async (input, init) => {
      const path = String(input);
      if (/\/(state|submit)$/.test(path)) {
        const body = JSON.parse(String(init?.body));
        calls.push(
          `${path.split("/").at(-1)}:${body.state.slice.node.specificEmbeddedDirectTco2PerT}`,
        );
        if (calls.length === 1) {
          entered();
          await gate;
        }
      }
      return underlying(input, init);
    }) as typeof fetch,
  });
  const first = sync.savePrecursorDraft({
    ...draft,
    specificEmbeddedDirectTco2PerT: 1,
  });
  await started;
  const second = sync.savePrecursorDraft({
    ...draft,
    specificEmbeddedDirectTco2PerT: 2,
  });
  const submit = sync.submitPrecursorLink({
    ...draft,
    specificEmbeddedDirectTco2PerT: 3,
  });
  await Promise.resolve();
  assert.deepEqual(calls, ["state:1"]);
  release();
  await Promise.all([first, second, submit]);
  assert.deepEqual(calls, ["state:1", "state:2", "submit:3"]);
  assert.equal(server.states.get(token)?.status, "submitted");
  assert.equal(
    (
      server.states.get(token)?.slice as {
        node: { specificEmbeddedDirectTco2PerT: number };
      }
    ).node.specificEmbeddedDirectTco2PerT,
    3,
  );
});

test("autosave can retry after failure, and an absent or mismatched session cannot report submission success", async () => {
  const { draft } = await producer();
  const { apiFetch } = await import("../api/config");
  const underlying = apiFetch();
  let fail = true;
  configureApi({
    fetchImpl: (async (input, init) => {
      if (String(input).endsWith("/state") && fail) {
        fail = false;
        return new Response(
          JSON.stringify({ detail: { code: "OFFLINE", message: "Try again" } }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }
      return underlying(input, init);
    }) as typeof fetch,
  });
  await assert.rejects(sync.savePrecursorDraft(draft), /Try again/);
  assert.equal(await sync.savePrecursorDraft(draft), true);
  await assert.rejects(
    sync.submitPrecursorLink({ ...draft, workspaceId: "unrelated" }),
    /Reopen the precursor link/,
  );
  sync.resetPrecursorSession();
  await assert.rejects(
    sync.submitPrecursorLink(draft),
    /Reopen the precursor link/,
  );
});

test("a late response cannot hydrate another public link after navigation", async () => {
  const { token } = await producer();
  sync.resetPrecursorSession();
  const { apiFetch } = await import("../api/config");
  const underlying = apiFetch();
  let release!: () => void;
  let entered!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  configureApi({
    fetchImpl: (async (input, init) => {
      if (String(input).endsWith(`/links/${token}`)) {
        entered();
        await gate;
      }
      return underlying(input, init);
    }) as typeof fetch,
  });
  const pending = sync.openPrecursorLink(token);
  await started;
  inBrowser(supplierBrowser, "another-link");
  release();
  assert.equal(await pending, null);
  assert.equal(getSupplier(WS, "p1"), null);
  assert.equal(sync.activePrecursorSession(), null);
});

test("expired/revoked links show the invalid-link state while network failures remain retryable", async () => {
  sync.resetPrecursorSession();
  inBrowser(supplierBrowser, "missing-link");
  for (const code of [
    "TOKEN_NOT_FOUND",
    "TOKEN_REVOKED",
    "TOKEN_EXPIRED",
    "SERVER_ERROR",
  ]) {
    configureApi({
      fetchImpl: (async () =>
        new Response(JSON.stringify({ detail: { code, message: code } }), {
          status:
            code === "SERVER_ERROR"
              ? 503
              : code === "TOKEN_NOT_FOUND"
                ? 404
                : 410,
          headers: { "Content-Type": "application/json" },
        })) as unknown as typeof fetch,
    });
    if (code === "SERVER_ERROR")
      await assert.rejects(
        sync.openPrecursorLink("missing-link"),
        /SERVER_ERROR/,
      );
    else assert.equal(await sync.openPrecursorLink("missing-link"), null);
  }
});

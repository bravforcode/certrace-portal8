import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { configureApi } from "../api/config";
import { storeDocumentFile, loadEvidenceFile } from "../document-files";
import {
  applyAcceptedField,
  isReviewed,
  runExtraction,
  supportsEvidenceExtraction,
  type EvidenceItem,
} from "../workspace-evidence";
import { emptyMonth, emptyFuel, saveMonth } from "../monthly-data";

const g = globalThis as unknown as { window?: unknown };
const originalWindow = g.window;
const originalFetch = globalThis.fetch;
const file = new Blob(["%PDF-1.7\ntest evidence"], { type: "application/pdf" });
const item = (key = "utility-invoice"): EvidenceItem => ({
  id: "test-evidence",
  workspaceId: "test-workspace",
  month: "2026-01",
  fieldKeys: [key],
  sourceType: "utility_invoice",
  fileName: "test.pdf",
  localFileId: "test-evidence",
  mimeType: "application/pdf",
  capturedAt: "2026-01-01",
});
const reading = (key: string, value: string, unit: string) => ({
  key,
  value,
  unit,
  confidence: 0.95,
  accepted: false,
});
function browser(pathname = "/w/public-token") {
  g.window = { location: { pathname } };
}
afterEach(() => {
  g.window = originalWindow;
  globalThis.fetch = originalFetch;
  configureApi({ baseUrl: "", fetchImpl: null });
});

test("only documents with supported readings are extracted, including legacy files without MIME metadata", () => {
  for (const key of [
    "production",
    "electricity-consumed",
    "utility-invoice",
    "smart-meter-data",
    "fuel:f1",
    "fuel-invoice:f1",
  ])
    assert.equal(supportsEvidenceExtraction(item(key)), true, key);
  for (const key of [
    "installation-diagram",
    "single-line-diagram",
    "calibration-records",
    "installation-identity",
    "internal-qa-record",
    "contract-or-ppa",
    "lab-analysis",
    "electricity-factor",
    "carbon-price",
    "unknown",
  ])
    assert.equal(supportsEvidenceExtraction(item(key)), false, key);
  assert.equal(
    supportsEvidenceExtraction({ ...item(), mimeType: "image/svg+xml" }),
    false,
  );
  assert.equal(
    supportsEvidenceExtraction({
      ...item(),
      fieldKeys: ["installation-diagram", "production"],
    }),
    false,
  );
  assert.equal(
    supportsEvidenceExtraction({ ...item(), mimeType: undefined }),
    true,
  );
});

test("diagrams remain reviewed evidence without any extraction request, even after an older failed or pending extraction", async () => {
  configureApi({
    baseUrl: "https://api.test",
    fetchImpl: (async () => {
      throw new Error("Evidence-only files must never reach the reader");
    }) as unknown as typeof fetch,
  });
  const diagram = {
    ...item("installation-diagram"),
    extraction: { status: "pending" as const, fields: [] },
  };
  assert.equal(await runExtraction(diagram), undefined);
  assert.equal(isReviewed(diagram), true);
  assert.equal(
    isReviewed({ ...diagram, extraction: { status: "failed", fields: [] } }),
    true,
  );
});

test("public suppliers extract the original Blob through their token, without fetching data URLs or requiring an account", async () => {
  browser();
  await storeDocumentFile(item().localFileId!, file);
  globalThis.fetch = (async () => {
    throw new Error("CSP forbids data: fetch");
  }) as unknown as typeof fetch;
  const calls: string[] = [];
  configureApi({
    baseUrl: "https://api.test",
    fetchImpl: (async (url, init) => {
      calls.push(String(url));
      assert.equal(init?.credentials, "omit");
      assert.equal(new Headers(init?.headers).has("X-Certrace-Account"), false);
      if (String(url).endsWith("/extraction"))
        return Response.json({ available: true });
      assert.equal(await (init!.body as Blob).text(), await file.text());
      return Response.json({
        text: JSON.stringify({
          fields: [reading("electricity-consumed", "123000", "kWh")],
        }),
      });
    }) as typeof fetch,
  });
  const entry = emptyMonth("test-workspace", "2026-01");
  const result = await runExtraction(item());
  assert.equal(result?.status, "done");
  assert.equal(result.fields[0].accepted, false);
  assert.equal(
    entry.electricityMwh,
    0,
    "a proposal must never fill a field before acceptance",
  );
  assert.deepEqual(calls, [
    "https://api.test/api/v1/links/public-token/evidence/extraction",
    "https://api.test/api/v1/links/public-token/evidence/extract",
  ]);
});

test("switching public links during a reading never sends files under the previous token", async () => {
  browser();
  let calls = 0;
  configureApi({
    baseUrl: "https://api.test",
    fetchImpl: (async () => {
      calls++;
      browser("/w/different-token");
      return Response.json({ available: true });
    }) as unknown as typeof fetch,
  });
  const result = await runExtraction(item());
  assert.equal(result?.status, "failed");
  assert.match(result.error!, /open form changed/);
  assert.equal(calls, 1);
});

test("stored files can be read after reload, and signed-in extraction keeps its account endpoint", async () => {
  for (const pathname of [
    "/w/reloaded-token",
    "/workspaces/ws/monthly/2026-01",
  ]) {
    browser(pathname);
    const publicLink = pathname.startsWith("/w/");
    const paths: string[] = [];
    configureApi({
      baseUrl: "https://api.test",
      fetchImpl: (async (url, init) => {
        paths.push(String(url));
        assert.equal(init?.credentials, publicLink ? "omit" : "include");
        if (String(url).endsWith("/extraction"))
          return Response.json({ available: true });
        if (String(url).endsWith("/files/stored-file"))
          return new Response(file);
        return Response.json({
          text: '{"fields":[],"summary":"No supported readings"}',
        });
      }) as typeof fetch,
    });
    const result = await runExtraction({
      ...item(),
      serverFileId: "stored-file",
    });
    assert.equal(
      result?.status,
      "done",
      "an empty valid reading is evidence, not an extraction failure",
    );
    assert.ok(
      paths
        .at(-1)
        ?.endsWith(
          publicLink
            ? "/links/reloaded-token/evidence/extract"
            : "/api/v1/evidence/extract",
        ),
    );
  }
});

test("legacy inline files are decoded locally under the existing CSP", async () => {
  globalThis.fetch = (async () => {
    throw new Error("Must not fetch data URLs");
  }) as unknown as typeof fetch;
  const original = await loadEvidenceFile({
    fileDataUrl: "data:application/pdf;base64,JVBERi1sZWdhY3k=",
  });
  assert.equal(await original?.text(), "%PDF-legacy");
  await assert.rejects(
    loadEvidenceFile({ fileDataUrl: "https://untrusted.test/private" }),
  );
});

test("unconfigured reading skips extraction, while provider failures retain a useful manual-entry error", async () => {
  browser();
  const paths: string[] = [];
  configureApi({
    baseUrl: "https://api.test",
    fetchImpl: (async (url) => {
      paths.push(String(url));
      return Response.json({ available: false });
    }) as typeof fetch,
  });
  assert.equal(await runExtraction(item()), undefined);
  assert.equal(
    paths.length,
    1,
    "no file download or model request without a configured reader",
  );
  await storeDocumentFile(item().localFileId!, file);
  configureApi({
    fetchImpl: (async (url) =>
      String(url).endsWith("/extraction")
        ? Response.json({ available: true })
        : Response.json(
            {
              detail: {
                code: "EXTRACTION_FAILED",
                message: "Document reading is temporarily unavailable.",
              },
            },
            { status: 503 },
          )) as typeof fetch,
  });
  const failed = await runExtraction(item());
  assert.equal(failed?.status, "failed");
  assert.match(failed.error!, /file is still attached/);
  assert.equal(
    await (await loadEvidenceFile(item()))?.text(),
    await file.text(),
  );
});

test("accepted electricity updates its source so saving cannot overwrite the reviewed reading", () => {
  browser();
  const entry = {
    ...emptyMonth("test-workspace", "2026-01"),
    electricitySources: [
      {
        id: "grid",
        sourceType: "grid_default" as const,
        mwh: 0,
        factorTco2PerMwh: 0.47,
      },
    ],
  };
  const outcome = applyAcceptedField(
    entry,
    reading("electricity-consumed", "123000", "kWh"),
    item(),
  );
  assert.equal(outcome.entry.electricityMwh, 123);
  assert.equal(saveMonth(outcome.entry).electricityMwh, 123);
  assert.equal(entry.electricitySources[0].mwh, 0);
  assert.equal(
    applyAcceptedField(
      entry,
      reading("electricity-consumed", "12", "GJ"),
      item(),
    ).applied,
    null,
  );
  assert.equal(
    applyAcceptedField(
      {
        ...entry,
        electricitySources: [
          ...entry.electricitySources,
          { ...entry.electricitySources[0], id: "other" },
        ],
      },
      reading("electricity-consumed", "12", "MWh"),
      item(),
    ).applied,
    null,
  );
});

test("production and fuel proposals write only to matching rows with clear units", () => {
  const fuel = { ...emptyFuel(), id: "f1", unit: "t" as const };
  const other = { ...fuel, id: "f2", quantity: 9 };
  const entry = {
    ...emptyMonth("test-workspace", "2026-01"),
    fuels: [fuel, other],
  };
  assert.equal(
    applyAcceptedField(
      entry,
      reading("production", "2500", "kg"),
      item("production"),
    ).entry.productionTonnes,
    2.5,
  );
  const updated = applyAcceptedField(
    entry,
    reading("fuel-quantity", "12", "t"),
    item("fuel:f1"),
  );
  assert.deepEqual(
    updated.entry.fuels.map((f) => f.quantity),
    [12, 9],
  );
  assert.equal(
    applyAcceptedField(
      entry,
      reading("fuel-quantity", "12", "t"),
      item("fuel-invoice:f1"),
    ).applied,
    null,
    "a delivery note must not silently become consumption",
  );
  for (const value of ["", "-1", "Infinity", "unknown"])
    assert.equal(
      applyAcceptedField(
        entry,
        reading("production", value, "t"),
        item("production"),
      ).applied,
      null,
    );
});

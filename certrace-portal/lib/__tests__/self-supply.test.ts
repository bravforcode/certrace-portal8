import { test } from "node:test";
import assert from "node:assert/strict";
import { configureApi } from "../api/config";
import { saveSession, clearSession } from "../api/session";
import { DECLARATIONS } from "./fixtures/declaration";
import { makeToken } from "../supplier";
import { emptyState } from "../supplier-store";
import { resolveSelfSupply } from "../self-supply";

Object.assign(globalThis, {
  window: {
    location: { origin: "http://localhost:3000", pathname: "/self/test" },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  },
});
const user = {
  id: "actor",
  email: "actor@example.invalid",
  onboarded: true,
  ready: true,
};
const declaration = {
  ...structuredClone(DECLARATIONS[0]),
  id: "owned-declaration",
  name: "Saved declaration",
};
declaration.suppliers = [
  { ...declaration.suppliers[0], id: "own", selfSupplied: true },
];
const serverToken = "server-owned-response-token-123456";
function setup(kind: "own" | "external" | "missing" = "own") {
  clearSession();
  saveSession({ accessToken: "cookie", user });
  const paths: string[] = [];
  configureApi({
    baseUrl: "http://localhost:8000",
    fetchImpl: (async (input, init) => {
      const path = new URL(String(input)).pathname;
      paths.push(path);
      if (path === "/api/v1/declarations/owned-declaration") {
        if (kind === "missing")
          return Response.json(
            { detail: { code: "DECLARATION_NOT_FOUND" } },
            { status: 404 },
          );
        return Response.json({
          ...declaration,
          suppliers: [
            { ...declaration.suppliers[0], selfSupplied: kind === "own" },
          ],
        });
      }
      if (path.endsWith("/links")) {
        assert.deepEqual(JSON.parse(String(init?.body)), {
          supplierId: "own",
          month: "2026-01",
        });
        return Response.json(
          {
            token: serverToken,
            url: `http://localhost/s/${serverToken}`,
            expiresAt: Date.now() + 86400000,
          },
          { status: 201 },
        );
      }
      assert.equal(path, `/api/v1/links/${serverToken}`);
      return Response.json({
        token: serverToken,
        declId: declaration.id,
        supplierId: "own",
        month: "2026-01",
        expiresAt: Date.now() + 86400000,
        exporter: { companyName: "Saved company" },
        declaration: {
          name: declaration.name,
          regulation: declaration.regulation,
          origin: declaration.origin,
          market: declaration.market,
          period: declaration.period,
          periodEnd: declaration.periodEnd ?? "",
          due: declaration.due,
          dueInDays: declaration.dueInDays,
          kind: declaration.kind ?? "cbam",
          includedFieldIds: null,
          note: "",
        },
        supplier: {
          name: "Own plant",
          ref: "Own",
          country: "TH",
          material: "Steel billet",
          critical: false,
          selfSupplied: true,
        },
        request: { products: [] },
        state: {
          ...emptyState(serverToken),
          values: { note: "Persisted reading" },
        },
      });
    }) as typeof fetch,
  });
  return paths;
}

test("the existing self-supply form uses its owned declaration and saved server response", async () => {
  const paths = setup();
  const result = await resolveSelfSupply(
    makeToken(declaration.id, "own", "2026-01"),
  );
  assert.equal(result?.req.selfSupplied, true);
  assert.equal(result?.req.token, serverToken);
  assert.equal(result?.initialState?.values.note, "Persisted reading");
  assert.equal(paths.length, 3);
});
test("missing declarations and external rows never create a self-supply response", async () => {
  const paths = setup("missing");
  assert.equal(await resolveSelfSupply(makeToken(declaration.id, "own")), null);
  assert.equal(paths.length, 1);
  const external = setup("external");
  const result = await resolveSelfSupply(makeToken(declaration.id, "own"));
  assert.equal(result?.req.selfSupplied, false);
  assert.equal(result?.initialState, undefined);
  assert.equal(external.length, 1);
});

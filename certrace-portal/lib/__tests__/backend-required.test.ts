import { test } from "node:test";
import assert from "node:assert/strict";
import { configureApi, authUnavailable } from "../api/config";
import {
  accountStorage,
  resetAccount,
  legacyRecords,
} from "../account-storage";

test("an empty API URL never enables local account storage", () => {
  const env = process.env as Record<string, string | undefined>;
  const previousNode = env.NODE_ENV;
  env.NODE_ENV = "production";
  const previous = process.env.NEXT_PUBLIC_DEMO_MODE;
  process.env.NEXT_PUBLIC_DEMO_MODE = "1";
  Object.assign(globalThis, {
    window: {
      location: { pathname: "/dashboard" },
      localStorage: {
        getItem: () => {
          throw new Error("Must not read localStorage");
        },
        setItem: () => {
          throw new Error("Must not write localStorage");
        },
      },
    },
  });
  try {
    resetAccount(true);
    configureApi({ baseUrl: "" });
    assert.equal(authUnavailable(), true);
    assert.equal(accountStorage.getItem("certrace:profile"), null);
    assert.throws(
      () => accountStorage.setItem("certrace:profile", "{}"),
      /requires the backend/,
    );
  } finally {
    if (previousNode === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previousNode;
    if (previous === undefined) delete process.env.NEXT_PUBLIC_DEMO_MODE;
    else process.env.NEXT_PUBLIC_DEMO_MODE = previous;
    configureApi({ baseUrl: "/backend" });
  }
});

test("legacy recovery never imports a demo device flag as a supplier account", () => {
  const records = new Map([
    [
      "certrace:profile",
      JSON.stringify({ companyName: "Recoverable company" }),
    ],
    [
      "certrace:precursor-supplier-account",
      JSON.stringify([{ installationId: "demo", createdAt: "2026-01-01" }]),
    ],
  ]);
  Object.assign(globalThis, {
    window: {
      localStorage: {
        get length() {
          return records.size;
        },
        key: (index: number) => [...records.keys()][index] ?? null,
        getItem: (key: string) => records.get(key) ?? null,
      },
    },
  });
  assert.deepEqual(legacyRecords(), [
    { key: "certrace:profile", value: { companyName: "Recoverable company" } },
  ]);
  assert.ok(
    records.has("certrace:profile"),
    "recovery inspection must not delete old user data",
  );
});

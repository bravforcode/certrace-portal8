import { afterAll, describe, expect, test } from "bun:test";
import { account, call, cleanup, editorOf } from "./helpers";
import { db } from "../src/lib/db";
import { sharedRecord } from "../src/modules/team/records";
import { validateRecord } from "../src/modules/records/service";
afterAll(cleanup);

// Team editors must see the same factory profile and opportunity list as the owner.
test("factory and opportunity records are shared with the company", () => {
  expect(sharedRecord("certrace:factory:abc")).toBe(true);
  expect(sharedRecord("certrace:opportunities")).toBe(true);
});

test("look-alike keys and personal keys are not shared", () => {
  expect(sharedRecord("certrace:factory")).toBe(false);
  expect(sharedRecord("certrace:opportunities-draft")).toBe(false);
  expect(sharedRecord("member:abc:chat")).toBe(false);
});

const profile = (over: Record<string, unknown> = {}) => ({
  version: 1,
  processes: [],
  sources: [],
  meters: [],
  production: [],
  updatedAt: "",
  ...over,
});
// The status a validator throws (the shared fail() helper), or 0 when it passes.
const statusOf = (fn: () => void) => {
  try {
    fn();
    return 0;
  } catch (e) {
    return (e as { status?: number }).status ?? -1;
  }
};

describe("factory record shape", () => {
  test("accepts an object with the four row lists", () => {
    expect(
      statusOf(() => validateRecord("certrace:factory:i1", profile())),
    ).toBe(0);
  });
  test("rejects a body that is not an object with the four lists, with 422", () => {
    for (const bad of [
      [],
      "x",
      null,
      { processes: [] },
      profile({ sources: "nope" }),
    ])
      expect(
        statusOf(() => validateRecord("certrace:factory:i1", bad as never)),
      ).toBe(422);
  });
  test("rejects row counts over the limits, with 422", () => {
    const tooMany = Array.from({ length: 51 }, (_, i) => ({ id: `p${i}` }));
    expect(
      statusOf(() =>
        validateRecord("certrace:factory:i1", profile({ processes: tooMany })),
      ),
    ).toBe(422);
  });
  test("other record keys are not checked for the factory shape", () => {
    expect(
      statusOf(() => validateRecord("certrace:profile", { anything: 1 })),
    ).toBe(0);
  });
});

describe("factory record over HTTP", () => {
  const path = (key: string) =>
    `/api/v1/account/records/${encodeURIComponent(key)}`;

  // A team editor's write to the factory key is stored under the company, so the owner sees it.
  test("a team editor's PUT lands in the company scope", async () => {
    const owner = await account();
    const member = await account();
    const h = await editorOf(owner, member);
    const key = `certrace:factory:inst-${crypto.randomUUID()}`;
    const row = profile({
      processes: [
        {
          id: "p1",
          name: "Annealing",
          step: "other",
          route: "",
          inBoundary: true,
          note: "",
        },
      ],
    });
    const r = await call(
      path(key),
      "PUT",
      { value: row, revision: 0 },
      member.cookie,
      h,
    );
    expect(r.status).toBe(200);
    const stored = await db.account_records.findFirst({ where: { key } });
    expect(stored?.user_id).toBe(owner.user.id);
    const seen = await (
      await call("/api/v1/account/records", "GET", undefined, owner.cookie)
    ).json();
    expect(
      seen.records.find((x: { key: string }) => x.key === key)?.value,
    ).toEqual(row);
  });

  // A signed-in account with no membership of the owner's company must not write into it.
  test("a non-editor cannot write into another company's factory profile", async () => {
    const owner = await account();
    const outsider = await account();
    const key = `certrace:factory:inst-${crypto.randomUUID()}`;
    const r = await call(
      path(key),
      "PUT",
      { value: profile(), revision: 0 },
      outsider.cookie,
      { "X-Certrace-Company": owner.user.id },
    );
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(await db.account_records.findFirst({ where: { key } })).toBeNull();
  });

  test("a malformed factory body is refused with 422 over HTTP", async () => {
    const owner = await account();
    const key = `certrace:factory:inst-${crypto.randomUUID()}`;
    const r = await call(
      path(key),
      "PUT",
      { value: { processes: "nope" }, revision: 0 },
      owner.cookie,
    );
    expect(r.status).toBe(422);
  });
});

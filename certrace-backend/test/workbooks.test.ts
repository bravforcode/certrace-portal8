import { afterAll, describe, expect, test } from "bun:test";
import { account, call, cleanup, editorOf } from "./helpers";
afterAll(cleanup);

const base = "/api/v1/workbooks/inst-1/2026";
const patch = (cookie: string, cells: Record<string, string | null>, h = {}) =>
  call(base + "/cells", "PATCH", { cells }, cookie, h);

describe("workbooks", () => {
  // Two people in one factory edit different cells at the same time; neither edit may be lost.
  test("owner and editor edits merge cell by cell", async () => {
    const owner = await account();
    const member = await account();
    const h = await editorOf(owner, member);
    const [r1, r2] = await Promise.all([
      patch(owner.cookie, { "products:0:item": "Steel wire" }),
      patch(member.cookie, { "products:0:qty": "1200" }, h),
    ]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const wb = await (await call(base, "GET", undefined, owner.cookie)).json();
    expect(wb.cells).toEqual({
      "products:0:item": "Steel wire",
      "products:0:qty": "1200",
    });
    expect(wb.revision).toBe(2);
    expect(wb.editors["products:0:qty"].by).toBe(member.user.id);
    expect(wb.editors["products:0:item"].by).toBe(owner.user.id);
  });

  // Same cell: the later write wins, and the cell shows who wrote it last (D6).
  test("same-cell edits are last-writer-wins with editor attribution", async () => {
    const owner = await account();
    const member = await account();
    const h = await editorOf(owner, member);
    await patch(owner.cookie, { "products:1:item": "Copper" });
    await patch(member.cookie, { "products:1:item": "Brass" }, h);
    const wb = await (await call(base, "GET", undefined, owner.cookie)).json();
    expect(wb.cells["products:1:item"]).toBe("Brass");
    expect(wb.editors["products:1:item"].by).toBe(member.user.id);
    expect(wb.revision).toBe(2);
  });

  test("concurrent patches both land", async () => {
    const a = await account();
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        patch(a.cookie, { [`steps:${i}:step`]: `S${i}` }),
      ),
    );
    const wb = await (await call(base, "GET", undefined, a.cookie)).json();
    expect(Object.keys(wb.cells)).toHaveLength(10);
    expect(wb.revision).toBe(10);
  });

  test("null deletes a cell", async () => {
    const a = await account();
    await patch(a.cookie, { "energy:1:item": "LPG" });
    const r = await (await patch(a.cookie, { "energy:1:item": null })).json();
    expect(r.cells).toEqual({});
  });

  // Polling every 10 s must cost almost nothing when nobody typed.
  test("since=current revision returns changed:false", async () => {
    const a = await account();
    await patch(a.cookie, { "steps:0:step": "Drawing" });
    const r = await (
      await call(base + "?since=1", "GET", undefined, a.cookie)
    ).json();
    // updatedAt rides along so a reviewer's mark on a file (which does not move the revision) still reaches the client.
    expect(r).toEqual({
      changed: false,
      revision: 1,
      updatedAt: expect.any(String),
    });
    expect(r.cells).toBeUndefined();
  });

  // A stale client (since=0) must receive the full row when the revision has moved on.
  test("since behind the current revision returns changed:true with cells", async () => {
    const a = await account();
    await patch(a.cookie, { "steps:0:step": "Drawing" });
    const r = await (
      await call(base + "?since=0", "GET", undefined, a.cookie)
    ).json();
    expect(r.changed).toBe(true);
    expect(r.revision).toBe(1);
    expect(r.cells).toEqual({ "steps:0:step": "Drawing" });
  });

  test("another company cannot read the workbook", async () => {
    const a = await account();
    const b = await account();
    await patch(a.cookie, { "steps:0:step": "Secret" });
    const r = await call(base, "GET", undefined, b.cookie, {
      "X-Certrace-Company": a.user.id,
    });
    expect(r.status).toBe(403);
    const own = await (await call(base, "GET", undefined, b.cookie)).json();
    expect(own.cells).toEqual({});
  });

  // An account outside the company must not be able to write into it, and the row must stay as it was.
  test("cross-company PATCH returns 403 and leaves the row unchanged", async () => {
    const a = await account();
    const b = await account();
    await patch(a.cookie, { "steps:0:step": "Owned" });
    const r = await patch(
      b.cookie,
      { "steps:0:step": "Hijack" },
      { "X-Certrace-Company": a.user.id },
    );
    expect(r.status).toBe(403);
    const wb = await (await call(base, "GET", undefined, a.cookie)).json();
    expect(wb.cells).toEqual({ "steps:0:step": "Owned" });
    expect(wb.revision).toBe(1);
  });

  test("rejects malformed cell keys", async () => {
    const a = await account();
    const r = await patch(a.cookie, { "../etc:0:x": "1" });
    expect(r.status).toBe(422);
    expect((await r.json()).detail.code).toBe("INVALID_CELL_KEY");
  });

  test("rejects a patch with more than 2000 cells", async () => {
    const a = await account();
    const cells = Object.fromEntries(
      Array.from({ length: 2001 }, (_, i) => [`steps:${i}:step`, "x"]),
    );
    const r = await patch(a.cookie, cells);
    expect(r.status).toBe(422);
  });

  // The 5 MB cap protects the row; a rejected write must not bump the revision.
  test("oversized write returns 413 and the revision does not bump", async () => {
    const a = await account();
    await patch(a.cookie, { "steps:0:step": "Small" });
    const big = Object.fromEntries(
      Array.from({ length: 600 }, (_, i) => [
        `steps:${i + 1}:step`,
        "x".repeat(9_000),
      ]),
    );
    const r = await patch(a.cookie, big);
    expect(r.status).toBe(413);
    expect((await r.json()).detail.code).toBe("WORKBOOK_TOO_LARGE");
    const wb = await (await call(base, "GET", undefined, a.cookie)).json();
    expect(wb.revision).toBe(1);
    expect(wb.cells).toEqual({ "steps:0:step": "Small" });
  });

  test("year list carries meta without cells", async () => {
    const a = await account();
    await call(base + "/meta", "PUT", { meta: { status: "ready" } }, a.cookie);
    const r = await (
      await call("/api/v1/workbooks/inst-1", "GET", undefined, a.cookie)
    ).json();
    expect(r.years).toHaveLength(1);
    expect(r.years[0]).toMatchObject({ year: 2026, meta: { status: "ready" } });
    expect(r.years[0].cells).toBeUndefined();
  });

  // Leftover cells (no meta status) are cleared server-side, under the row lock, so a
  // copy running at the same time cannot have its freshly written cells wiped by the client.
  describe("reset-leftovers", () => {
    const reset = (cookie: string, h = {}) =>
      call(base + "/reset-leftovers", "POST", undefined, cookie, h);

    test("clears cells of a year with no meta status and bumps the revision", async () => {
      const a = await account();
      await patch(a.cookie, { "steps:0:step": "Left over" });
      const r = await reset(a.cookie);
      expect(r.status).toBe(200);
      const body = await r.json();
      expect(body.cells).toEqual({});
      expect(body.revision).toBe(2);
    });

    // A year being set up or copied has a status; its cells are its work and must survive.
    test("keeps the cells of a year that has a status", async () => {
      const a = await account();
      await call(
        base + "/meta",
        "PUT",
        { meta: { status: "syncing" } },
        a.cookie,
      );
      await patch(a.cookie, { "steps:0:step": "Kept" });
      const r = await reset(a.cookie);
      expect(r.status).toBe(200);
      expect((await r.json()).cells).toEqual({ "steps:0:step": "Kept" });
    });

    test("another company cannot reset the workbook", async () => {
      const a = await account();
      const b = await account();
      await patch(a.cookie, { "steps:0:step": "Owned" });
      const r = await reset(b.cookie, { "X-Certrace-Company": a.user.id });
      expect(r.status).toBe(403);
      const wb = await (await call(base, "GET", undefined, a.cookie)).json();
      expect(wb.cells).toEqual({ "steps:0:step": "Owned" });
    });
  });
});

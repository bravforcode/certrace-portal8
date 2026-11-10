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
    expect((await patch(owner.cookie, { "products:0:item": "Steel wire" })).status).toBe(200);
    expect((await patch(member.cookie, { "products:0:qty": "1200" }, h)).status).toBe(200);
    const wb = await (await call(base, "GET", undefined, owner.cookie)).json();
    expect(wb.cells).toEqual({ "products:0:item": "Steel wire", "products:0:qty": "1200" });
    expect(wb.revision).toBe(2);
    expect(wb.editors["products:0:qty"].by).toBe(member.user.id);
  });

  test("concurrent patches both land", async () => {
    const a = await account();
    await Promise.all(
      Array.from({ length: 10 }, (_, i) => patch(a.cookie, { [`steps:${i}:step`]: `S${i}` })),
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
    const r = await (await call(base + "?since=1", "GET", undefined, a.cookie)).json();
    expect(r).toEqual({ changed: false, revision: 1 });
  });

  test("another company cannot read the workbook", async () => {
    const a = await account();
    const b = await account();
    await patch(a.cookie, { "steps:0:step": "Secret" });
    const r = await call(base, "GET", undefined, b.cookie, { "X-Certrace-Company": a.user.id });
    expect(r.status).toBe(403);
    const own = await (await call(base, "GET", undefined, b.cookie)).json();
    expect(own.cells).toEqual({});
  });

  test("rejects malformed cell keys", async () => {
    const a = await account();
    const r = await patch(a.cookie, { "../etc:0:x": "1" });
    expect(r.status).toBe(422);
    expect((await r.json()).detail.code).toBe("INVALID_CELL_KEY");
  });

  test("year list carries meta without cells", async () => {
    const a = await account();
    await call(base + "/meta", "PUT", { meta: { status: "ready" } }, a.cookie);
    const r = await (await call("/api/v1/workbooks/inst-1", "GET", undefined, a.cookie)).json();
    expect(r.years).toHaveLength(1);
    expect(r.years[0]).toMatchObject({ year: 2026, meta: { status: "ready" } });
    expect(r.years[0].cells).toBeUndefined();
  });
});

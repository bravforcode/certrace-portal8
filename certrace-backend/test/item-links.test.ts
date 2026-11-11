import { afterAll, describe, expect, test } from "bun:test";
import { db } from "../src/lib/db";
import { declaredBlocks, type ItemField } from "../src/modules/links/item-fields";
import { itemCellPatch, submitItemLink } from "../src/modules/links/item-service";
import { account, call, cleanup, editorOf } from "./helpers";
afterAll(cleanup);

// Test-only catalogue: isolation between two items is exercised with explicit field lists,
// bound to two real item keys so the links can be created.
const FIELDS_A: ItemField[] = [
  { key: "item-a:weight", label: "Weight", section: "Goods", cell: "products:0:weight", kind: "number" },
];
const FIELDS_B: ItemField[] = [
  { key: "item-b:origin", label: "Origin", section: "Direct", cell: "products:1:origin", kind: "text" },
];
const fieldsFor = (itemKey: string) =>
  itemKey === "goods" ? FIELDS_A : itemKey === "direct" ? FIELDS_B : [];

const base = "/api/v1/workbooks/inst-1/2026";
const create = (cookie: string, itemKey: string, h = {}) =>
  call("/api/v1/item-links", "POST", { installationId: "inst-1", year: 2026, itemKey }, cookie, h);

async function mint(cookie: string, itemKey: string, h = {}) {
  const r = await create(cookie, itemKey, h);
  expect(r.status).toBe(201);
  return (await r.json()).token as string;
}

describe("declared processes", () => {
  // A Smart Link for sheet D must show the processes the installation listed in A_InstData,
  // so the holder does not have to discover process 2 by first filling process 1.
  test("reads the A_InstData process and precursor lists from the workbook cells", () => {
    expect(
      declaredBlocks({ "cbam:0:a-e83": "Crude steel", "cbam:0:a-l84": "Rolling", "cbam:0:a-e103": "  ", "cbam:0:a-l102": "Coke" }),
    ).toEqual(["process:1", "process:2", "precursor:1"]);
    expect(declaredBlocks({ "cbam:0:d-l16": "100" })).toEqual([]);
  });
});

describe("item link mapping", () => {
  test("maps item field keys to their workbook cells", () => {
    expect(itemCellPatch(FIELDS_A, { "item-a:weight": "12" })).toEqual({ "products:0:weight": "12" });
  });

  test("null passes through so the cell is cleared", () => {
    expect(itemCellPatch(FIELDS_A, { "item-a:weight": null })).toEqual({ "products:0:weight": null });
  });

  // A key that belongs to another item must never map to a cell, even when it is a real cell key.
  test("rejects keys outside the item and raw workbook cell keys", () => {
    const rejected: Record<string, string>[] = [{ "item-b:origin": "CN" }, { "products:0:weight": "9" }];
    for (const values of rejected) {
      try {
        itemCellPatch(FIELDS_A, values);
        throw new Error("expected rejection");
      } catch (e) {
        expect((e as { code?: string }).code).toBe("UNKNOWN_ITEM_FIELD");
      }
    }
  });
});

describe("item links", () => {
  // (a) The item key is stored on the link so the token is bound to exactly one item.
  test("creating an item link stores the item key and returns a token and path", async () => {
    const owner = await account();
    const r = await create(owner.cookie, "goods");
    expect(r.status).toBe(201);
    const body = await r.json();
    expect(body.token).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(body.path).toBe(`/s/item/${body.token}`);
    const row = await db.item_links.findUnique({ where: { token: body.token } });
    expect(row).toMatchObject({
      item_key: "goods",
      installation_id: "inst-1",
      year: 2026,
      user_id: owner.user.id,
    });
  });

  // An editor may create a link for the company; a stranger may not.
  test("an editor creates the link for the company, a stranger is refused", async () => {
    const owner = await account();
    const member = await account();
    const h = await editorOf(owner, member);
    const r = await create(member.cookie, "goods", h);
    expect(r.status).toBe(201);
    const row = await db.item_links.findUnique({ where: { token: (await r.json()).token } });
    expect(row?.user_id).toBe(owner.user.id);
    expect(row?.created_by).toBe(member.user.id);
    const stranger = await account();
    const refused = await create(stranger.cookie, "goods", { "X-Certrace-Company": owner.user.id });
    expect(refused.status).toBe(403);
  });

  // (b) Resolving returns the item key and installation id; unknown and expired tokens are not found.
  test("resolving a token returns the item key and installation id", async () => {
    const owner = await account();
    const token = await mint(owner.cookie, "goods");
    const r = await call(`/api/v1/item-links/${token}`);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body).toMatchObject({ itemKey: "goods", installationId: "inst-1", year: 2026 });
    expect(body.label).toBe("Goods, CN codes and production routes");
    // The form gets the catalogue fields with their current answers, never the raw cell keys.
    expect(body.fields.length).toBeGreaterThan(0);
    expect(body.fields[0]).toMatchObject({ value: "" });
    expect(body.fields[0].cell).toBeUndefined();
  });

  test("an unknown token returns not-found", async () => {
    const r = await call("/api/v1/item-links/does-not-exist");
    expect(r.status).toBe(404);
    expect((await r.json()).detail.code).toBe("TOKEN_NOT_FOUND");
  });

  test("an expired token returns not-found", async () => {
    const owner = await account();
    const token = await mint(owner.cookie, "goods");
    await db.item_links.update({
      where: { token },
      data: { expires_at: new Date(Date.now() - 1000) },
    });
    const r = await call(`/api/v1/item-links/${token}`);
    expect(r.status).toBe(404);
    expect((await r.json()).detail.code).toBe("TOKEN_NOT_FOUND");
  });

  // (c) A token for item A writes only item A cells. A token for item B cannot write item A cells.
  test("submitting for item A writes only item A cells; item B's token cannot write them", async () => {
    const owner = await account();
    const tokenA = await mint(owner.cookie, "goods");
    const tokenB = await mint(owner.cookie, "direct");

    await submitItemLink(tokenA, { "item-a:weight": "12" }, fieldsFor);
    let wb = await (await call(base, "GET", undefined, owner.cookie)).json();
    expect(wb.cells).toEqual({ "products:0:weight": "12" });

    // try/catch, not `.rejects`: under bun 1.3.14 the `.rejects` form hung here until the test timed out.
    let code: string | undefined;
    try {
      await submitItemLink(tokenB, { "item-a:weight": "99" }, fieldsFor);
    } catch (e) {
      code = (e as { code?: string }).code;
    }
    expect(code).toBe("UNKNOWN_ITEM_FIELD");
    wb = await (await call(base, "GET", undefined, owner.cookie)).json();
    expect(wb.cells).toEqual({ "products:0:weight": "12" });
  });

  test("the public submit endpoint rejects keys not in the item catalogue", async () => {
    const owner = await account();
    const token = await mint(owner.cookie, "goods");
    const r = await call(`/api/v1/item-links/${token}/submit`, "POST", {
      values: { "item-a:weight": "5" },
    });
    expect(r.status).toBe(422);
    expect((await r.json()).detail.code).toBe("UNKNOWN_ITEM_FIELD");
  });

  // A link for an item with no form would open an empty page, so it is never created.
  test("creating a link for an unknown item is refused", async () => {
    const owner = await account();
    const r = await create(owner.cookie, "item-a");
    expect(r.status).toBe(422);
    expect((await r.json()).detail.code).toBe("UNKNOWN_ITEM");
  });

  // The public form writes the answer into the CBAM sheet cell the Fill in form uses.
  test("the public submit endpoint writes a catalogue field into the cbam sheet", async () => {
    const owner = await account();
    const token = await mint(owner.cookie, "goods");
    const field = (await (await call(`/api/v1/item-links/${token}`)).json()).fields[0];
    const r = await call(`/api/v1/item-links/${token}/submit`, "POST", { values: { [field.key]: "7" } });
    expect(r.status).toBe(200);
    const wb = await (await call(base, "GET", undefined, owner.cookie)).json();
    expect(wb.cells).toEqual({ [`cbam:0:${field.key}`]: "7" });
  });
});

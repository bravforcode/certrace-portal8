import { legalVersionIds } from "./fixtures/legal";
import { afterAll, describe, test, expect } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import { reportSpecs } from "../src/modules/reporting/catalogue";
import { sections } from "../src/modules/reporting/sections";
import {
  assumeOwner,
  writeRevision,
  readRecord,
} from "../src/modules/reporting/service";
import { readDocuments } from "../src/modules/reporting/storage";
import type { Shape } from "../src/modules/reporting/shape";
import type { Json } from "../src/lib/json";
const users: string[] = [];
async function call(
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
) {
  return app.handle(
    new Request("http://localhost" + path, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie, origin: "http://localhost:3000" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}
async function account() {
  const res = await call("/api/auth/register", "POST", {
    email: `report-${crypto.randomUUID()}@example.invalid`,
    password: "test-password-123",
    ...(await legalVersionIds()),
    termsAccepted: true,
    privacyAccepted: true,
    marketingOptIn: false,
  });
  expect(res.status).toBe(201);
  const body = await res.json();
  users.push(body.user.id);
  await db.users.update({ where: { id: body.user.id }, data: { ready: true } });
  return {
    id: body.user.id as string,
    cookie: res.headers.get("set-cookie")!.split(";")[0]!,
  };
}
function sample(s: Shape): any {
  if (s.kind === "array") return [];
  if (s.kind === "map") return {};
  if (s.kind === "object")
    return Object.fromEntries(
      Object.entries(s.fields!)
        .filter(([, v]) => !v.optional)
        .map(([k, v]) => [k, sample(v)]),
    );
  if (s.enum) return s.enum[0];
  return s.kind === "boolean" ? false : s.kind === "number" ? 0 : "";
}
const saved = async (
  cookie: string,
  key: string,
  value: unknown,
  revision = 0,
) => {
  const response = await call(
    "/api/v1/reporting/records",
    "PUT",
    { key, value, revision },
    cookie,
  );
  if (response.status !== 200)
    throw Error(`${response.status} ${key}: ${await response.text()}`);
  return response.json();
};
async function fixture(cookie: string) {
  const installation = {
    ...sample(reportSpecs["certrace:installations"]!.item!),
    id: "plant",
    name: "Plant",
    self: true,
    supplierId: "",
    createdAt: "2026-01-01T00:00:00Z",
  };
  await saved(cookie, "certrace:installations", [installation]);
  const workspace = {
    ...sample(reportSpecs["certrace:workspaces"]!.item!),
    id: "ws",
    installationId: "plant",
    installationName: "Plant",
    selfSupplied: true,
    supplierName: "Operator",
    year: 2026,
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    productName: "Steel",
    cnCode: "72083900",
    productionRoute: "Scrap-EAF",
    createdAt: "2026-01-01T00:00:00Z",
  };
  await saved(cookie, "certrace:workspaces", [workspace]);
  const mmd = {
    ...sample(reportSpecs["certrace:workspace-mmd-draft"]!.item!),
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    inputPlan: {
      operatorName: "Operator",
      operatorRegistration: "123",
      operatorAddress: "Bangkok",
      registryId: "123",
      monitoringStart: "2026-01-01",
      additionalFlows: [],
      processes: [
        {
          id: "p1",
          name: "Melting",
          routes: ["Scrap-EAF"],
          steps: ["Melt"],
          products: [
            {
              id: "g1",
              name: "Steel",
              cnCode: "72083900",
              description: "Steel",
              unit: "t",
              benchmark: "",
            },
          ],
          precursorIds: [],
          otherInputs: [],
        },
      ],
    },
  };
  await saved(cookie, "certrace:workspace-mmd-draft", { ws: mmd });
  const monthly = {
    ...sample(reportSpecs["certrace:monthly-data"]!.item!.item!),
    id: "jan",
    workspaceId: "ws",
    month: "2026-01",
    productionTonnes: 0,
    fuels: [
      {
        id: "fuel1",
        fuelType: "natural_gas",
        quantity: 0,
        unit: "GJ",
        efTco2PerGj: 0.0561,
        factorSource: "eu_standard",
      },
    ],
  };
  await saved(cookie, "certrace:monthly-data", { ws: [monthly] });
  const precursor = {
    ...sample(reportSpecs["certrace:precursor-suppliers"]!.item!.item!),
    id: "prec1",
    workspaceId: "ws",
    parentId: null,
    seeTco2ePerT: null,
  };
  await saved(cookie, "certrace:precursor-suppliers", { ws: [precursor] });
  const evidence = {
    ...sample(reportSpecs["certrace:workspace-evidence"]!.item!.item!),
    id: "ev1",
    workspaceId: "ws",
    fileName: "proof.pdf",
    capturedAt: "2026-01-01T00:00:00Z",
  };
  await saved(cookie, "certrace:workspace-evidence", { ws: [evidence] });
  return { installation, workspace, mmd, monthly, precursor, evidence };
}
afterAll(async () => {
  await db.$executeRawUnsafe(
    "DELETE FROM reporting.record_heads WHERE user_id = ANY($1::uuid[])",
    users,
  );
  await db.users.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});
describe("Versioned reporting documents", () => {
  test("internal product transfers persist, reject cycles and cannot cross installation or year", async () => {
    const a = await account();
    const { installation, workspace } = await fixture(a.cookie);
    await saved(
      a.cookie,
      "certrace:installations",
      [installation, { ...installation, id: "other-plant" }],
      1,
    );
    await saved(
      a.cookie,
      "certrace:workspaces",
      [
        workspace,
        { ...workspace, id: "source" },
        {
          ...workspace,
          id: "other-year",
          year: 2025,
          periodStart: "2025-01-01",
          periodEnd: "2025-12-31",
        },
        { ...workspace, id: "other-site", installationId: "other-plant" },
      ],
      1,
    );
    const key = "certrace:internal-precursors";
    const link = {
      id: "transfer",
      workspaceId: "ws",
      sourceWorkspaceId: "source",
      quantityUsedT: 0,
    };
    await saved(a.cookie, key, { ws: [link] });
    for (const sourceWorkspaceId of [
      "ws",
      "missing",
      "other-year",
      "other-site",
    ]) {
      const response = await call(
        "/api/v1/reporting/records",
        "PUT",
        {
          key,
          revision: 1,
          value: { ws: [{ ...link, sourceWorkspaceId }] },
        },
        a.cookie,
      );
      expect(response.status).toBe(422);
    }
    const cycle = await call(
      "/api/v1/reporting/records",
      "PUT",
      {
        key,
        revision: 1,
        value: {
          ws: [link],
          source: [{ ...link, workspaceId: "source", sourceWorkspaceId: "ws" }],
        },
      },
      a.cookie,
    );
    expect(cycle.status).toBe(422);
    const data = await (
      await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
    ).json();
    expect(data.records.find((r: any) => r.key === key)).toMatchObject({
      revision: 1,
      value: { ws: [link] },
    });
  });

  test("private unit costs retain zero and currency inputs and stay isolated to their account", async () => {
    const a = await account(),
      b = await account();
    await fixture(a.cookie);
    const key = "certrace:unit-costs";
    const costs = {
      workspaceId: "ws",
      updatedAt: "2026-10-27T00:00:00Z",
      priceThbPerTonne: 25000,
      electricityThbPerKwh: 0,
      fuelThbPerUnit: { "natural_gas|GJ": 120 },
    };
    await saved(a.cookie, key, { ws: costs });
    const theirs = await (
      await call("/api/v1/account/records", "GET", undefined, b.cookie)
    ).json();
    expect(theirs.records.some((r: any) => r.key === key)).toBe(false);
    expect(
      (
        await call(
          "/api/v1/reporting/records",
          "PUT",
          { key, revision: 0, value: { ws: costs } },
          b.cookie,
        )
      ).status,
    ).toBe(422);
    const mine = await (
      await call("/api/v1/account/records", "GET", undefined, a.cookie)
    ).json();
    expect(mine.records.find((r: any) => r.key === key).value).toEqual({
      ws: costs,
    });
  });

  test("all 65 topics / 276 fields round-trip through HTTP and versioned documents", async () => {
    const a = await account();
    const f = await fixture(a.cookie);
    const inputs: Record<string, any> = {};
    let count = 0;
    for (const section of sections) {
      const scope = section.id.startsWith("0.")
        ? "company:self"
        : section.area === "monthly"
          ? "ws:month:2026-01"
          : section.area === "precursor"
            ? "ws:precursor:prec1"
            : "ws:annual";
      const values: Record<string, string> = {};
      for (const field of section.fields) {
        count++;
        values[field.key] =
          field.kind === "number"
            ? String(("min" in field ? field.min : 0) ?? 0)
            : field.kind === "date"
              ? "2026-01-01"
              : field.kind === "month"
                ? "2026-01"
                : field.kind === "datetime-local"
                  ? "2026-01-01T01:00"
                  : field.kind === "process"
                    ? "p1"
                    : field.kind === "product"
                      ? "g1"
                      : field.kind === "source"
                        ? "fuel:fuel1"
                        : field.kind === "evidence"
                          ? "ev1"
                          : field.kind === "select"
                            ? (field as any).options[0].value
                            : "input " + field.key;
      }
      if (section.id === "0.7") {
        values.operator = "Operator";
        values.exporter = "Operator";
      }
      (inputs[scope] ??= {})[section.id] = {
        applicability: "yes",
        reason: "",
        rows: [{ id: "row-" + section.id, values }],
        updatedAt: "2026-01-01T00:00:00Z",
      };
    }
    expect(count).toBe(276);
    await saved(a.cookie, "certrace:report-inputs:v1", inputs);
    const response = await call(
      "/api/v1/reporting/records",
      "GET",
      undefined,
      a.cookie,
    );
    const records = (await response.json()).records;
    expect(
      records.find((r: any) => r.key === "certrace:report-inputs:v1").value,
    ).toEqual(inputs);
    expect(
      records.find((r: any) => r.key === "certrace:monthly-data").value.ws[0]
        .productionTonnes,
    ).toBe(0);
    expect(
      records.find((r: any) => r.key === "certrace:precursor-suppliers").value
        .ws[0].seeTco2ePerT,
    ).toBeNull();
    expect(
      await db.account_records.count({
        where: { user_id: a.id, key: { in: Object.keys(reportSpecs) } },
      }),
    ).toBe(0);
    // Choose a real process field so this assertion cannot pass on an unrelated unknown key.
    const section = sections.find(
      (s) =>
        !s.id.startsWith("0.") &&
        s.area !== "monthly" &&
        s.area !== "precursor" &&
        s.fields.some((f) => f.kind === "process"),
    )!;
    const field = section.fields.find((f) => f.kind === "process")!;
    const bad = structuredClone(inputs);
    bad["ws:annual"][section.id].rows[0].values[field.key] = "foreign-process";
    expect(
      (
        await call(
          "/api/v1/reporting/records",
          "PUT",
          { key: "certrace:report-inputs:v1", value: bad, revision: 1 },
          a.cookie,
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await call(
          "/api/v1/reporting/records",
          "PUT",
          {
            key: "certrace:workspace-evidence",
            value: { ws: [] },
            revision: 1,
          },
          a.cookie,
        )
      ).status,
    ).toBe(422);
    const badMonth = { ...f.monthly, month: "2025-01" };
    expect(
      (
        await call(
          "/api/v1/reporting/records",
          "PUT",
          {
            key: "certrace:workspaces",
            value: [{ ...f.workspace, year: 2025 }],
            revision: 1,
          },
          a.cookie,
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await call(
          "/api/v1/reporting/records",
          "PUT",
          {
            key: "certrace:monthly-data",
            value: { ws: [badMonth] },
            revision: 1,
          },
          a.cookie,
        )
      ).status,
    ).toBe(422);
  }, 120000);
  test("company and product masters are shared across drafts, versioned, isolated, and protected by FKs", async () => {
    const a = await account(),
      other = await account();
    const f = await fixture(a.cookie);
    await saved(a.cookie, "certrace:profile", {
      companyName: "Operator",
      jurisdiction: "TH",
    });
    const second = { ...f.workspace, id: "ws2" };
    await saved(a.cookie, "certrace:workspaces", [f.workspace, second], 1);
    const plan1 = structuredClone(f.mmd);
    plan1.inputPlan.processes[0].products[0].id = "ws:product:0";
    const plan2 = structuredClone(f.mmd);
    plan2.inputPlan.processes[0].products[0].id = "ws2:product:0";
    await saved(
      a.cookie,
      "certrace:workspace-mmd-draft",
      { ws: plan1, ws2: plan2 },
      1,
    );
    const masters = await (
      await call("/api/v1/master-data", "GET", undefined, a.cookie)
    ).json();
    expect(masters.reports).toHaveLength(1);
    expect(
      masters.organizations.filter((o: any) => o.reference === "self"),
    ).toHaveLength(1);
    const company = masters.organizations.find(
      (o: any) => o.reference === "self",
    );
    let response = await call(
      "/api/v1/master-data/organizations/" + company.id,
      "PATCH",
      {
        revision: company.version,
        fields: { name: "Renamed Operator", address: "New registered address" },
      },
      a.cookie,
    );
    expect(response.status).toBe(200);
    const changed = await response.json();
    expect(
      changed.records.find((r: any) => r.key === "certrace:profile").value
        .companyName,
    ).toBe("Renamed Operator");
    const latest = (
      await (
        await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
      ).json()
    ).records;
    expect(
      latest
        .find((r: any) => r.key === "certrace:workspaces")
        .value.map((w: any) => w.supplierName),
    ).toEqual(["Renamed Operator", "Renamed Operator"]);
    expect(
      latest.find((r: any) => r.key === "certrace:workspace-mmd-draft").value
        .ws2.inputPlan.operatorAddress,
    ).toBe("New registered address");
    expect(
      (
        await call(
          "/api/v1/master-data/organizations/" + company.id,
          "PATCH",
          { revision: company.version, fields: { name: "Stale" } },
          a.cookie,
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await call(
          "/api/v1/master-data/organizations/" + company.id,
          "PATCH",
          { revision: changed.master.version, fields: { name: "Foreign" } },
          other.cookie,
        )
      ).status,
    ).toBe(404);
    const product = masters.products.find((p: any) =>
      p.reference.startsWith("catalog:"),
    );
    response = await call(
      "/api/v1/master-data/products/" + product.id,
      "PATCH",
      {
        revision: product.version,
        fields: { name: "Shared product", cn_code: "72071190" },
      },
      a.cookie,
    );
    expect(response.status).toBe(200);
    const products = await response.json();
    const productPlans = products.records.find(
      (r: any) => r.key === "certrace:workspace-mmd-draft",
    ).value;
    expect(productPlans.ws.inputPlan.processes[0].products[0].name).toBe(
      "Shared product",
    );
    expect(productPlans.ws2.inputPlan.processes[0].products[0].cnCode).toBe(
      "72071190",
    );
    expect(
      products.records
        .find((r: any) => r.key === "certrace:workspaces")
        .value.map((w: any) => w.productName),
    ).toEqual(["Shared product", "Shared product"]);
    await db.$transaction(async (tx) => {
      await assumeOwner(tx, a.id);
      const old = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM reporting.records WHERE user_id=${a.id}::uuid AND key='certrace:workspaces' AND revision=1`;
      const view = (await readDocuments(tx, [old[0]!.id])).get(
        old[0]!.id,
      )! as any[];
      expect(view[0].supplierName).toBe("Operator");
      expect(view[0].productName).toBe("Steel");
      const versions = await tx.$queryRaw<
        { count: bigint }[]
      >`SELECT count(*) FROM masterdata.organization_versions WHERE organization_id=${company.id}::uuid`;
      expect(Number(versions[0]!.count)).toBeGreaterThan(1);
    });
    const beforeFreeze = (
      await (
        await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
      ).json()
    ).records;
    const workspaceRecord = beforeFreeze.find(
      (r: any) => r.key === "certrace:workspaces",
    );
    workspaceRecord.value[1].internalSignoff = {
      name: "Reviewer",
      role: "Manager",
      at: "2026-10-16T00:00:00Z",
    };
    await saved(
      a.cookie,
      "certrace:workspaces",
      workspaceRecord.value,
      workspaceRecord.revision,
    );
    const beforeRename = await (
      await call("/api/v1/master-data", "GET", undefined, a.cookie)
    ).json();
    const currentCompany = beforeRename.organizations.find(
      (r: any) => r.id === company.id,
    );
    expect(
      (
        await call(
          "/api/v1/master-data/organizations/" + company.id,
          "PATCH",
          {
            revision: currentCompany.version,
            fields: { name: "Next Company Name" },
          },
          a.cookie,
        )
      ).status,
    ).toBe(200);
    const afterRename = (
      await (
        await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
      ).json()
    ).records;
    expect(
      afterRename
        .find((r: any) => r.key === "certrace:workspaces")
        .value.map((w: any) => w.supplierName),
    ).toEqual(["Next Company Name", "Renamed Operator"]);
    expect(
      afterRename.find((r: any) => r.key === "certrace:workspace-mmd-draft")
        .value.ws2.inputPlan.operatorName,
    ).toBe("Renamed Operator");
    const finalMasters = await (
      await call("/api/v1/master-data", "GET", undefined, a.cookie)
    ).json();
    expect(
      finalMasters.organizations.find((r: any) => r.id === company.id).fields
        .name,
    ).toBe("Next Company Name");
    // Documents cannot be written under another account, even by direct runtime-role SQL.
    await expect(
      db.$transaction(async (tx) => {
        await assumeOwner(tx, a.id);
        await tx.$executeRaw`INSERT INTO reporting.records(user_id,key,revision,value) VALUES(${other.id}::uuid,'certrace:workspaces',1000,'[]')`;
      }),
    ).rejects.toThrow();
  }, 120000);

  test("account isolation, concurrent revision conflicts, immutable history and direct SQL RLS", async () => {
    const a = await account(),
      b = await account();
    await fixture(a.cookie);
    expect(
      (
        await (
          await call("/api/v1/reporting/records", "GET", undefined, b.cookie)
        ).json()
      ).records,
    ).toEqual([]);
    const payload = {
      key: "certrace:carbon-price",
      value: {
        ws: {
          workspaceId: "ws",
          amountPerTonne: 0,
          currency: "THB",
          instrument: "none",
          recorded: true,
          updatedAt: "2026-01-01T00:00:00Z",
        },
      },
      revision: 0,
    };
    const responses = await Promise.all([
      call("/api/v1/reporting/records", "PUT", payload, a.cookie),
      call("/api/v1/reporting/records", "PUT", payload, a.cookie),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    payload.value.ws.amountPerTonne = 12.3456789;
    payload.revision = 1;
    expect(
      (await call("/api/v1/reporting/records", "PUT", payload, a.cookie))
        .status,
    ).toBe(200);
    const versions = await db.$queryRaw<
      { revision: number; sealed: boolean }[]
    >`SELECT revision,sealed FROM reporting.records WHERE user_id=${a.id}::uuid AND key='certrace:carbon-price' ORDER BY revision`;
    expect(versions).toEqual([
      { revision: 1, sealed: true },
      { revision: 2, sealed: true },
    ]);
    const own = await db.$queryRaw<
      { id: string }[]
    >`SELECT id FROM reporting.records WHERE user_id=${a.id}::uuid LIMIT 1`;
    await db.$transaction(async (tx) => {
      await assumeOwner(tx, b.id);
      const rows = await tx.$queryRaw<
        any[]
      >`SELECT * FROM reporting.records WHERE user_id=${a.id}::uuid`;
      expect(rows).toEqual([]);
    });
    await expect(
      db.$transaction(async (tx) => {
        await assumeOwner(tx, b.id);
        const changed =
          await tx.$executeRaw`UPDATE reporting.records SET value='[]'::jsonb WHERE id=${own[0]!.id}::uuid`;
        expect(changed).toBe(0);
        await tx.$executeRaw`INSERT INTO reporting.records(user_id,key,revision) VALUES(${a.id}::uuid,'attack',1)`;
      }),
    ).rejects.toThrow();
    await expect(
      Promise.resolve(
        db.$executeRaw`UPDATE reporting.records SET sealed=false WHERE id=${own[0]!.id}::uuid`,
      ),
    ).rejects.toThrow();
  }, 120000);
  test("migration preserves values and revisions; unknown fields roll back without loss", async () => {
    const a = await account();
    const installation = {
      ...sample(reportSpecs["certrace:installations"]!.item!),
      id: "legacy",
      name: "Legacy plant",
      createdAt: "2026-01-01T00:00:00Z",
    };
    await db.account_records.create({
      data: {
        user_id: a.id,
        key: "certrace:installations",
        revision: 7,
        value: [installation],
      },
    });
    const res = await call(
      "/api/v1/reporting/records",
      "GET",
      undefined,
      a.cookie,
    );
    expect(res.status).toBe(200);
    expect((await res.json()).records).toEqual([
      { key: "certrace:installations", revision: 7, value: [installation] },
    ]);
    expect(await db.account_records.count({ where: { user_id: a.id } })).toBe(
      0,
    );
    const b = await account();
    await db.account_records.create({
      data: {
        user_id: b.id,
        key: "certrace:installations",
        value: [{ ...installation, unknownImportantField: "keep me" }],
      },
    });
    expect(
      (await call("/api/v1/reporting/records", "GET", undefined, b.cookie))
        .status,
    ).toBe(422);
    expect(await db.account_records.count({ where: { user_id: b.id } })).toBe(
      1,
    );
    const heads = await db.$queryRaw<
      any[]
    >`SELECT * FROM reporting.record_heads WHERE user_id=${b.id}::uuid`;
    expect(heads).toEqual([]);
  }, 120000);
  test("precursor submissions preserve owner fields, keep later drafts private and retain an unavailable-report response", async () => {
    const a = await account();
    const f = await fixture(a.cookie);
    const precursor = {
      ...f.precursor,
      name: "Original producer",
      valueBasis: "actual",
      qtyPerTonneOverride: 1.25,
      contactEmail: "owner-contact@example.invalid",
    };
    const other = { ...f.precursor, id: "prec2", name: "Other producer" };
    await saved(
      a.cookie,
      "certrace:precursor-suppliers",
      { ws: [precursor, other] },
      1,
    );
    await saved(
      a.cookie,
      "certrace:workspace-evidence",
      {
        ws: [
          f.evidence,
          {
            ...f.evidence,
            id: "old-precursor-file",
            fieldKeys: ["precursor:prec1"],
          },
        ],
      },
      1,
    );
    expect(
      (
        await call(
          "/api/v1/declarations/pr-ws-prec1",
          "PUT",
          {
            kind: "workspace",
            supplierView: {
              precursor: {
                workspaceId: "ws",
                node: precursor,
                evidence: [],
                asker: "Operator",
              },
            },
          },
          a.cookie,
        )
      ).status,
    ).toBe(200);
    const { token } = await (
      await call(
        "/api/v1/declarations/pr-ws-prec1/links",
        "POST",
        { supplierId: "prec1" },
        a.cookie,
      )
    ).json();
    const records = async () =>
      (
        await (
          await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
        ).json()
      ).records;
    const rowFrom = (rows: any[]) =>
      rows.find((r: any) => r.key === "certrace:precursor-suppliers").value
        .ws[0];
    const slice = {
      node: {
        id: "prec1",
        name: "Producer response",
        qtyPerTonneOverride: 999,
        contactEmail: "forged@example.invalid",
        supplierResponseReceived: true,
        smartLinkSubmittedAt: "1999-01-01T00:00:00Z",
      },
      evidence: [],
      reportUnavailable: true,
    };
    let response = await call(`/api/v1/links/${token}/state`, "PUT", {
      state: { slice },
    });
    expect(response.status).toBe(200);
    expect(rowFrom(await records()).name).toBe("Original producer");
    let resolved = await (await call(`/api/v1/links/${token}`)).json();
    expect(resolved.state.slice.reportUnavailable).toBe(true);
    const submit = (answer: any) =>
      call(`/api/v1/links/${token}/submit`, "POST", {
        state: { slice: answer },
        attestation: { signatoryName: "Producer", signatoryRole: "Operator" },
        check: null,
      });
    response = await submit(slice);
    expect(response.status).toBe(200);
    let owner = await records();
    let row = rowFrom(owner);
    expect(row.name).toBe("Producer response");
    expect(row.qtyPerTonneOverride).toBe(1.25);
    expect(row.contactEmail).toBe("owner-contact@example.invalid");
    expect(row.supplierResponseReceived).toBe(true);
    expect(row.supplierReportUnavailable).toBe(true);
    expect(row.dataOrigin).toBe("supplier_unverified");
    expect(row.seeTco2ePerT).toBeNull();
    expect(row.smartLinkSubmittedAt).not.toBe("1999-01-01T00:00:00Z");
    expect(
      owner.find((r: any) => r.key === "certrace:precursor-suppliers").value
        .ws[1],
    ).toEqual(other);
    expect(
      owner
        .find((r: any) => r.key === "certrace:workspace-evidence")
        .value.ws.map((r: any) => r.id),
    ).toEqual(["ev1"]);
    const correction = {
      ...slice,
      reportUnavailable: false,
      node: {
        ...slice.node,
        specificEmbeddedDirectTco2PerT: 2,
        specificEmbeddedIndirectTco2PerT: 0.5,
      },
    };
    response = await call(`/api/v1/links/${token}/state`, "PUT", {
      state: { slice: correction },
    });
    expect(response.status).toBe(200);
    row = rowFrom(await records());
    expect(row.supplierReportUnavailable).toBe(true);
    expect(row.seeTco2ePerT).toBeNull();
    response = await submit(correction);
    expect(response.status).toBe(200);
    row = rowFrom(await records());
    expect(row.supplierReportUnavailable).toBe(false);
    expect(row.seeTco2ePerT).toBe(2.5);
    resolved = await (await call(`/api/v1/links/${token}`)).json();
    expect(resolved.state.versions).toHaveLength(2);
    expect(resolved.state.slice.reportUnavailable).toBe(false);
    expect(
      (
        await submit({
          ...correction,
          node: { ...correction.node, id: "prec2" },
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await submit({
          ...correction,
          evidence: [{ ...f.evidence, fileName: "overwrite-other.pdf" }],
        })
      ).status,
    ).toBe(422);
    expect(
      (await (await call(`/api/v1/links/${token}`)).json()).state.versions,
    ).toHaveLength(2);
    // The optional summary is a separate reference form slot. Keep it separate
    // through receipt, and remove only this producer's documents on resubmit.
    const summary = {
      ...f.evidence,
      id: "prec-summary",
      fileName: "summary.pdf",
      fieldKeys: ["precursor:prec1:summary", "precursor:prec2:summary"],
    };
    response = await submit({ ...correction, evidence: [summary] });
    expect(response.status).toBe(200);
    owner = await records();
    let documents = owner.find(
      (r: any) => r.key === "certrace:workspace-evidence",
    ).value.ws;
    expect(documents.map((r: any) => r.id)).toEqual(["ev1", "prec-summary"]);
    expect(documents[1].fieldKeys).toEqual(["precursor:prec1:summary"]);
    resolved = await (await call(`/api/v1/links/${token}`)).json();
    expect(resolved.state.slice.evidence[0].fieldKeys).toEqual([
      "precursor:prec1:summary",
    ]);
    response = await submit({ ...correction, evidence: [] });
    expect(response.status).toBe(200);
    documents = (await records()).find(
      (r: any) => r.key === "certrace:workspace-evidence",
    ).value.ws;
    expect(documents.map((r: any) => r.id)).toEqual(["ev1"]);
  }, 120000);

  test("supplier input drafts are durable and submission updates only the invited workspace/month", async () => {
    const a = await account();
    const f = await fixture(a.cookie);
    await saved(
      a.cookie,
      "certrace:monthly-data",
      {
        ws: [
          f.monthly,
          { ...f.monthly, id: "feb", month: "2026-02", productionTonnes: 300 },
        ],
      },
      1,
    );
    const invitation = {
      workspace: f.workspace,
      installation: f.installation,
      stores: {
        "certrace:monthly-data": [f.monthly],
        "certrace:workspace-mmd-draft": f.mmd,
      },
    };
    expect(
      (
        await call(
          "/api/v1/declarations/ws-ws",
          "PUT",
          {
            kind: "workspace",
            supplierView: {
              ...invitation,
              stores: {
                ...invitation.stores,
                "certrace:monthly-data": [
                  f.monthly,
                  { ...f.monthly, month: "2026-02", id: "other-month" },
                ],
                "certrace:precursor-suppliers": [
                  {
                    id: "other-supplier",
                    smartLinkToken: "private-token",
                    contactEmail: "private@example.invalid",
                  },
                ],
              },
            },
          },
          a.cookie,
        )
      ).status,
    ).toBe(200);
    const minted = await call(
      "/api/v1/declarations/ws-ws/links",
      "POST",
      { supplierId: "ws", month: "2026-01" },
      a.cookie,
    );
    const { token } = await minted.json();
    const firstView = await (await call(`/api/v1/links/${token}`)).json();
    expect(firstView.workspace.stores["certrace:monthly-data"]).toHaveLength(1);
    const expectScoped = (response: unknown) => {
      const json = JSON.stringify(response);
      for (const forbidden of [
        "private-token",
        "private@example.invalid",
        "other-month",
      ])
        expect(json).not.toContain(forbidden);
    };
    expectScoped(firstView);
    const slice = {
      ...invitation,
      stores: {
        ...invitation.stores,
        "certrace:monthly-data": [{ ...f.monthly, productionTonnes: 42 }],
      },
    };
    let response = await call(`/api/v1/links/${token}/state`, "PUT", {
      state: { status: "draft", slice },
    });
    expect(response.status).toBe(200);
    expectScoped(await response.json());
    const raw = await db.smart_links.findUniqueOrThrow({ where: { token } });
    expect((raw.state as any).slice).toBeUndefined();
    response = await call(`/api/v1/links/${token}`);
    expect(response.status).toBe(200);
    expect(
      (await response.json()).state.slice.stores["certrace:monthly-data"][0]
        .productionTonnes,
    ).toBe(42);
    let owner = await (
      await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
    ).json();
    expect(
      owner.records.find((r: any) => r.key === "certrace:monthly-data").value
        .ws[0].productionTonnes,
    ).toBe(0);
    response = await call(`/api/v1/links/${token}/submit`, "POST", {
      state: { slice },
      attestation: { signatoryName: "Supplier", signatoryRole: "Operator" },
      check: null,
    });
    expect(response.status).toBe(200);
    owner = await (
      await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
    ).json();
    const months = owner.records.find(
      (r: any) => r.key === "certrace:monthly-data",
    ).value.ws;
    expect(
      months.find((m: any) => m.month === "2026-01").productionTonnes,
    ).toBe(42);
    expect(
      months.find((m: any) => m.month === "2026-02").productionTonnes,
    ).toBe(300);
    expect(
      owner.records.every((r: any) => !r.key.startsWith("supplier:")),
    ).toBe(true);
    const submittedMonth = months.find((m: any) => m.month === "2026-01");
    expect(submittedMonth.status).toBe("submitted");
    let reviewRecord = owner.records.find(
      (r: any) => r.key === "certrace:month-submissions",
    );
    expect(reviewRecord.value.ws["2026-01"].attestation.fullName).toBe(
      "Supplier",
    );
    expect(reviewRecord.value.ws["2026-01"].history).toHaveLength(1);
    const firstSigned = reviewRecord.value.ws["2026-01"].attestation;

    // A stale tab cannot rewrite submitted figures or submit a second version.
    response = await call(`/api/v1/links/${token}/state`, "PUT", {
      state: { slice },
    });
    expect(response.status).toBe(409);
    response = await call(`/api/v1/links/${token}/submit`, "POST", {
      state: { slice },
      attestation: { signatoryName: "Another", signatoryRole: "Manager" },
    });
    expect(response.status).toBe(409);
    let resolved = await (await call(`/api/v1/links/${token}`)).json();
    const pending = structuredClone(resolved.state.slice);
    pending.stores["certrace:month-submissions"]["2026-01"].editRequest = {
      at: "1999-01-01T00:00:00Z",
      state: "pending",
      reason: "Our meter total needs correcting",
    };
    response = await call(`/api/v1/links/${token}/state`, "PUT", {
      state: { slice: pending },
    });
    expect(response.status).toBe(200);
    owner = await (
      await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
    ).json();
    reviewRecord = owner.records.find(
      (r: any) => r.key === "certrace:month-submissions",
    );
    const request = reviewRecord.value.ws["2026-01"].editRequest;
    expect(request.state).toBe("pending");
    expect(request.at).not.toBe("1999-01-01T00:00:00Z");
    expect(reviewRecord.value.ws["2026-01"].attestation).toEqual(firstSigned);

    // Rejections are visible to the supplier without reopening the figures.
    reviewRecord.value.ws["2026-01"].editRequest = {
      ...request,
      state: "rejected",
      decidedBy: "Owner",
    };
    await saved(
      a.cookie,
      reviewRecord.key,
      reviewRecord.value,
      reviewRecord.revision,
    );
    resolved = await (await call(`/api/v1/links/${token}`)).json();
    expect(
      resolved.state.slice.stores["certrace:month-submissions"]["2026-01"]
        .editRequest.state,
    ).toBe("rejected");
    expect(resolved.state.status).toBe("submitted");

    // A failed revision request must leave both copies closed.
    const revisionPath = `/api/v1/declarations/ws-ws/links/${token}/revision`;
    expect(
      (await call(revisionPath, "POST", { note: "" }, a.cookie)).status,
    ).toBe(422);
    resolved = await (await call(`/api/v1/links/${token}`)).json();
    expect(resolved.state.status).toBe("submitted");
    expect(resolved.state.slice.stores["certrace:monthly-data"][0].status).toBe(
      "submitted",
    );

    // The exporter's current correction is the revision baseline, not the old invitation.
    owner = await (
      await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
    ).json();
    const monthlyRecord = owner.records.find(
      (r: any) => r.key === "certrace:monthly-data",
    );
    monthlyRecord.value.ws.find(
      (m: any) => m.month === "2026-01",
    ).productionTonnes = 55;
    await saved(
      a.cookie,
      monthlyRecord.key,
      monthlyRecord.value,
      monthlyRecord.revision,
    );
    reviewRecord = owner.records.find(
      (r: any) => r.key === "certrace:month-submissions",
    );
    Object.assign(reviewRecord.value.ws["2026-01"], {
      editedByExporter: true,
      attestation: null,
    });
    await saved(
      a.cookie,
      reviewRecord.key,
      reviewRecord.value,
      reviewRecord.revision,
    );
    response = await call(
      revisionPath,
      "POST",
      { note: "Please check the meter", areas: ["production"] },
      a.cookie,
    );
    expect(response.status).toBe(200);
    resolved = await (await call(`/api/v1/links/${token}`)).json();
    expect(resolved.state.status).toBe("revision_requested");
    expect(
      resolved.state.slice.stores["certrace:monthly-data"][0].productionTonnes,
    ).toBe(55);
    expect(resolved.state.slice.stores["certrace:monthly-data"][0].status).toBe(
      "draft",
    );
    expect(
      resolved.state.slice.stores["certrace:month-submissions"]["2026-01"],
    ).toMatchObject({
      state: "changes_requested",
      revisionNote: "Please check the meter",
      revisionAreas: ["production"],
      revisionCarriedEdits: true,
    });
    owner = await (
      await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
    ).json();
    expect(
      owner.records
        .find((r: any) => r.key === "certrace:monthly-data")
        .value.ws.find((m: any) => m.month === "2026-02").productionTonnes,
    ).toBe(300);

    // A supplier cannot forge the owner review or signed history in their slice.
    const revised = resolved.state.slice;
    revised.stores["certrace:monthly-data"][0].productionTonnes = 56;
    Object.assign(revised.stores["certrace:month-submissions"]["2026-01"], {
      state: "confirmed",
      confirmedBy: "forged",
      history: [],
      attestation: { fullName: "forged" },
    });
    response = await call(`/api/v1/links/${token}/submit`, "POST", {
      state: { slice: revised },
      attestation: { signatoryName: "", signatoryRole: "" },
    });
    expect(response.status).toBe(422);
    response = await call(`/api/v1/links/${token}/submit`, "POST", {
      state: { slice: revised },
      attestation: { signatoryName: "Supplier Two", signatoryRole: "Manager" },
    });
    expect(response.status).toBe(200);
    resolved = await (await call(`/api/v1/links/${token}`)).json();
    const resubmitted =
      resolved.state.slice.stores["certrace:month-submissions"]["2026-01"];
    expect(resubmitted.state).toBe("submitted");
    expect(resubmitted.history).toHaveLength(2);
    expect(resubmitted.history[0]).toEqual(firstSigned);
    expect(resubmitted.attestation.fullName).toBe("Supplier Two");
    expect(resubmitted.confirmedBy).toBeUndefined();
    expect(resubmitted.revisionNote).toBeUndefined();

    // Approving an edit request must unlock both copies without asking for a new note.
    resubmitted.editRequest = {
      at: new Date().toISOString(),
      state: "pending",
      reason: "Correct the latest total",
    };
    expect(
      (
        await call(`/api/v1/links/${token}/state`, "PUT", {
          state: { slice: resolved.state.slice },
        })
      ).status,
    ).toBe(200);
    expect(
      (await call(revisionPath, "POST", { action: "approve_edit" }, a.cookie))
        .status,
    ).toBe(200);
    resolved = await (await call(`/api/v1/links/${token}`)).json();
    expect(resolved.state.slice.stores["certrace:monthly-data"][0].status).toBe(
      "draft",
    );
    expect(
      resolved.state.slice.stores["certrace:month-submissions"]["2026-01"]
        .editRequest.state,
    ).toBe("approved");
    expect(
      (await call(revisionPath, "POST", { action: "approve_edit" }, a.cookie))
        .status,
    ).toBe(422);

    response = await call(`/api/v1/links/${token}/state`, "PUT", {
      state: {
        slice: { ...revised, workspace: { ...f.workspace, id: "other" } },
      },
    });
    expect(response.status).toBe(422);
  }, 120000);
  test("frozen report outputs persist as artifacts, and sealed documents reject changes", async () => {
    const a = await account();
    await fixture(a.cookie);
    const output = [
      {
        version: 1,
        createdAt: "2026-01-01T00:00:00Z",
        reason: "Review",
        fingerprint: "abc",
        dataset: { OER: { operator: "Test", value: 0 }, OSER: { total: 0 } },
      },
    ];
    await saved(a.cookie, "certrace:report-snapshots:ws", output);
    const reloaded = await (
      await call("/api/v1/reporting/records", "GET", undefined, a.cookie)
    ).json();
    expect(
      reloaded.records.find(
        (r: any) => r.key === "certrace:report-snapshots:ws",
      ).value,
    ).toEqual(output);
    const record = await db.$queryRaw<
      { id: string }[]
    >`SELECT id FROM reporting.records WHERE user_id=${a.id}::uuid AND key='certrace:workspaces'`;
    await expect(
      db.$transaction(async (tx) => {
        await assumeOwner(tx, a.id);
        await tx.$executeRaw`UPDATE reporting.records SET value=jsonb_set(value,'{0,productName}','"tampered"'::jsonb) WHERE id=${record[0]!.id}::uuid`;
      }),
    ).rejects.toThrow();
  }, 120000);

  test("every concrete core and optional field survives document storage (including ordered arrays)", async () => {
    const a = await account();
    function complete(s: Shape): any {
      if (s.kind === "array")
        return s.item!.kind === "string" && !s.item!.enum
          ? Array.from({ length: 12 }, (_, i) => "ordered " + i)
          : [complete(s.item!)];
      if (s.kind === "map") return { fixture: complete(s.item!) };
      if (s.kind === "object")
        return Object.fromEntries(
          Object.entries(s.fields!).map(([k, v]) => [
            k,
            v.derived === "workspace" ? "fixture" : complete(v),
          ]),
        );
      if (s.nullable) return null;
      if (s.kind === "artifact") return { frozen: true, zero: 0, empty: null };
      if (s.enum) return s.enum[0];
      if (s.kind === "number") return Math.max(s.min ?? 0, 0);
      if (s.kind === "decimalText") return String(Math.max(s.min ?? 0, 0));
      if (s.format === "date") return "2026-01-01";
      if (s.format === "month") return "2026-01";
      return s.kind === "boolean" ? false : "field value";
    }
    await db.$transaction(
      async (tx) => {
        await assumeOwner(tx, a.id);
        for (const [key, spec] of Object.entries(reportSpecs)) {
          const actualKey = key.replace("*", "fixture");
          const value = complete(spec);
          if (key === "certrace:workspaces") {
            value[0].year = 2026;
            value[0].supplierId = "";
          }
          if (key === "certrace:installations") value[0].supplierId = "";
          if (key === "certrace:precursor-versions") {
            const installation = complete(
              reportSpecs["certrace:installations"]!.item!,
            );
            installation.supplierId = "";
            const precursor = complete(
              reportSpecs["certrace:precursor-suppliers"]!.item!.item!,
            );
            precursor.workspaceId = "fixture";
            value.fixture = [
              { ...value.fixture[0], snapshot: installation },
              { ...value.fixture[0], snapshot: precursor },
            ];
          }
          await writeRevision(tx, a.id, actualKey, value, 0);
          const record = await readRecord(tx, a.id, actualKey);
          expect(record?.value).toEqual(value);
        }
      },
      { timeout: 120000 },
    );
  }, 120000);

  test("related report edits commit atomically and a stale member rolls the batch back", async () => {
    const a = await account();
    const f = await fixture(a.cookie);
    const oldMonth = {
      ...f.monthly,
      outputQuantities: [
        {
          processId: "p1",
          productId: "g1",
          route: "Scrap-EAF",
          quantity: 10,
          tonnes: 10,
        },
      ],
    };
    await saved(a.cookie, "certrace:monthly-data", { ws: [oldMonth] }, 1);
    const mmd = structuredClone(f.mmd);
    mmd.inputPlan.processes[0].id = "p2";
    mmd.inputPlan.processes[0].products[0].id = "g2";
    expect(
      (
        await call(
          "/api/v1/reporting/records",
          "PUT",
          {
            key: "certrace:workspace-mmd-draft",
            value: { ws: mmd },
            revision: 1,
          },
          a.cookie,
        )
      ).status,
    ).toBe(422);
    const month = {
      ...oldMonth,
      outputQuantities: [
        {
          processId: "p2",
          productId: "g2",
          route: "Scrap-EAF",
          quantity: 12,
          tonnes: 12,
        },
      ],
    };
    const batch = [
      { key: "certrace:monthly-data", value: { ws: [month] }, revision: 2 },
      { key: "certrace:workspace-mmd-draft", value: { ws: mmd }, revision: 1 },
    ];
    const response = await call(
      "/api/v1/reporting/records/batch",
      "POST",
      { records: batch },
      a.cookie,
    );
    expect(response.status).toBe(200);
    expect((await response.json()).records.map((r: any) => r.revision)).toEqual(
      [3, 2],
    );
    batch[0]!.revision = 3; // The second member is intentionally stale.
    expect(
      (
        await call(
          "/api/v1/reporting/records/batch",
          "POST",
          { records: batch },
          a.cookie,
        )
      ).status,
    ).toBe(409);
    const rows = await db.$queryRaw<
      { revision: number }[]
    >`SELECT revision FROM reporting.record_heads WHERE user_id=${a.id}::uuid AND key='certrace:monthly-data'`;
    expect(rows[0]!.revision).toBe(3);
  }, 120000);
});

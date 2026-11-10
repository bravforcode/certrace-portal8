import { test, expect, type Page } from "@playwright/test";
import { readyUser } from "./ready-user";
const wsId = "relational-report-test";
async function seed(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin,
    api = origin + "/backend",
    headers = { Origin: origin };
  const documents = (await (
    await page.request.get(`${api}/api/auth/legal/documents`)
  ).json()) as { kind: string; id: string }[];
  const versions = {
    termsVersionId: documents.find((d) => d.kind === "terms")!.id,
    privacyVersionId: documents.find((d) => d.kind === "privacy")!.id,
  };
  const registered = await page.request.post(api + "/api/auth/register", {
    headers,
    data: {
      email: `reporting-e2e-${crypto.randomUUID()}@example.invalid`,
      password: "test-password-123",
      ...versions,
      termsAccepted: true,
      privacyAccepted: true,
      marketingOptIn: false,
      firstName: "Report",
      lastName: "Test",
    },
  });
  expect(registered.status()).toBe(201);
  const { user } = await registered.json();
  await readyUser(user.id);
  await page.request.post(api + "/api/auth/onboarded", { headers });
  const installation = {
    id: "test-plant",
    name: "Database Test Plant",
    nameLocal: "",
    self: true,
    supplierId: "",
    street: "",
    economicActivity: "",
    postcode: "",
    poBox: "",
    city: "",
    country: "TH",
    unlocode: "",
    lat: "",
    lng: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    otherGoods: [],
    createdAt: "2026-01-01T00:00:00Z",
  };
  const workspace = {
    id: wsId,
    installationId: installation.id,
    installationName: installation.name,
    productId: "billet",
    productName: "Steel billets",
    cnCode: "72071190",
    productionRoute: "Scrap-EAF",
    year: 2026,
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    declarationIds: [],
    createdAt: "2026-01-01T00:00:00Z",
    selfSupplied: true,
    supplierName: "Database Test Plant",
    internalSignoff: null,
    verifierSignoff: null,
  };
  for (const [key, value] of [
    ["certrace:installations", [installation]],
    ["certrace:workspaces", [workspace]],
  ] as const) {
    const r = await page.request.put(api + "/api/v1/reporting/records", {
      headers,
      data: { key, value, revision: 0 },
    });
    expect(r.status(), await r.text()).toBe(200);
  }
  await page.request.put(api + "/api/v1/account/records/certrace:profile", {
    headers,
    data: {
      revision: 0,
      value: {
        firstName: "Report",
        lastName: "Test",
        companyName: "Database Test Plant",
        sector: "steel",
        jurisdiction: "TH",
        onboarded: true,
      },
    },
  });
  return { api, headers, userId: user.id };
}
function waitForSave(page: Page) {
  return page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      r.url().endsWith("/api/v1/reporting/records/batch") &&
      r.status() === 200,
  );
}
test("report forms persist through PostgreSQL, reload and a separate browser session", async ({
  page,
  browser,
  baseURL,
}, info) => {
  test.skip(
    !baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname),
    "Local database test",
  );
  test.setTimeout(120000);
  const { api, userId } = await seed(page, baseURL!);
  await info.attach("test-user", { body: userId, contentType: "text/plain" });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`/workspaces/${wsId}#input-0.4`);
  const country = page.locator('[id="input-0.4"]');
  await country
    .getByRole("combobox", { name: "Does this apply?" })
    .selectOption("yes");
  await country.getByRole("textbox", { name: "Country (ISO code)" }).fill("TH");
  let saved = waitForSave(page);
  await country.getByRole("button", { name: "Save topic" }).click();
  await saved;
  await page.reload();
  await expect(
    country.getByRole("textbox", { name: "Country (ISO code)" }),
  ).toHaveValue("TH");
  await page.goto(`/workspaces/${wsId}/monthly/2026-03#input-2.3.38`);
  const balance = page.locator('[id="input-2.3.38"]');
  await balance
    .getByRole("combobox", { name: "Does this apply?" })
    .selectOption("yes");
  await balance
    .getByRole("combobox", { name: "Production process" })
    .selectOption(`${wsId}:process:0`);
  for (const label of ["Produced (MWh)", "Consumed (MWh)", "Exported (MWh)"])
    await balance.getByRole("spinbutton", { name: label }).fill("0");
  saved = waitForSave(page);
  await balance.getByRole("button", { name: "Save topic" }).click();
  await saved;
  await page.reload();
  await expect(
    balance.getByRole("spinbutton", { name: "Produced (MWh)" }),
  ).toHaveValue("0");
  await page.goto(`/workspaces/${wsId}/monthly/2026-04#input-2.3.38`);
  await expect(
    balance.getByRole("combobox", { name: "Does this apply?" }),
  ).toHaveValue("");
  const response = await page.request.get(api + "/api/v1/reporting/records");
  expect(response.ok()).toBe(true);
  const { records } = await response.json();
  const inputs = records.find(
    (r: { key: string }) => r.key === "certrace:report-inputs:v1",
  ).value;
  expect(inputs["company:self"]["0.4"].rows[0].values.country).toBe("TH");
  expect(
    inputs[`${wsId}:month:2026-03`]["2.3.38"].rows[0].values.produced,
  ).toBe("0");
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((k) =>
        /report-inputs|monthly-data|workspace-mmd/.test(k),
      ),
    ),
  ).toEqual([]);
  const second = await browser.newContext({
    baseURL,
    storageState: { cookies: await page.context().cookies(), origins: [] },
  });
  try {
    const other = await second.newPage();
    await other.goto(`/workspaces/${wsId}#input-0.4`);
    await expect(
      other
        .locator('[id="input-0.4"]')
        .getByRole("textbox", { name: "Country (ISO code)" }),
    ).toHaveValue("TH");
  } finally {
    await second.close();
  }
  expect(errors).toEqual([]);
});

test("production setup edits update shared company and product masters across reports", async ({
  page,
  baseURL,
}) => {
  test.skip(
    !baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname),
    "Local database test",
  );
  test.setTimeout(120000);
  const { api, headers } = await seed(page, baseURL!);
  const initial = await (
    await page.request.get(api + "/api/v1/reporting/records")
  ).json();
  const ws = initial.records.find(
    (r: { key: string }) => r.key === "certrace:workspaces",
  );
  const secondId = wsId + "-second";
  const created = await page.request.put(api + "/api/v1/reporting/records", {
    headers,
    data: {
      key: ws.key,
      revision: ws.revision,
      value: [...ws.value, { ...ws.value[0], id: secondId }],
    },
  });
  expect(created.status(), await created.text()).toBe(200);
  await page.goto(`/workspaces/${wsId}`);
  await page
    .getByRole("textbox", { name: "Operator legal name", exact: true })
    .fill("Consolidated Company");
  await page
    .getByRole("textbox", { name: "Operator registration number", exact: true })
    .fill("REG-2026");
  await page
    .getByRole("textbox", { name: "Operator address in English", exact: true })
    .fill("Bangkok registered address");
  await page
    .getByRole("textbox", { name: "Product name", exact: true })
    .fill("Consolidated Billets");
  let saved = waitForSave(page);
  await page.getByRole("button", { name: "Save setup", exact: true }).click();
  await saved;
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Operator legal name", exact: true }),
  ).toHaveValue("Consolidated Company");
  await expect(
    page.getByRole("textbox", { name: "Product name", exact: true }),
  ).toHaveValue("Consolidated Billets");
  await page.goto(`/workspaces/${secondId}`);
  await expect(
    page.getByRole("textbox", { name: "Operator legal name", exact: true }),
  ).toHaveValue("Consolidated Company");
  await expect(
    page.getByRole("textbox", { name: "Product name", exact: true }),
  ).toHaveValue("Consolidated Billets");
  saved = waitForSave(page);
  await page.getByRole("button", { name: "Save setup", exact: true }).click();
  await saved;
  await page.reload();
  await expect(
    page.getByRole("textbox", {
      name: "Operator registration number",
      exact: true,
    }),
  ).toHaveValue("REG-2026");
  const result = await (
    await page.request.get(api + "/api/v1/master-data")
  ).json();
  expect(result.reports).toHaveLength(1);
  expect(
    result.organizations.filter(
      (r: { reference: string }) => r.reference === "self",
    ),
  ).toHaveLength(1);
  expect(
    result.products.filter(
      (r: { reference: string }) => r.reference === "catalog:billet",
    ),
  ).toHaveLength(1);
  expect(
    result.products.find(
      (r: { reference: string }) => r.reference === "catalog:billet",
    ).fields.name,
  ).toBe("Consolidated Billets");
  const records = (
    await (await page.request.get(api + "/api/v1/reporting/records")).json()
  ).records;
  expect(
    records.find((r: { key: string }) => r.key === "certrace:profile").value
      .companyName,
  ).toBe("Consolidated Company");
  expect(
    records.find(
      (r: { key: string }) => r.key === "certrace:workspace-mmd-draft",
    ).value[secondId].inputPlan.operatorName,
  ).toBe("Consolidated Company");
});

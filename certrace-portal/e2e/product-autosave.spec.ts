import { expect, test } from "@playwright/test";

const workspace = {
  id: "autosave-product",
  installationId: "TH-AUTOSAVE-01",
  installationName: "Test Plant",
  productId: "billet",
  productName: "Steel billet",
  cnCode: "72071190",
  productionRoute: "scrap_eaf",
  year: 2026,
  periodStart: "2026-01-01",
  periodEnd: "2026-12-31",
  declarationIds: [],
  createdAt: "2026-01-01",
  selfSupplied: true,
  internalSignoff: null,
  verifierSignoff: null,
};

test("carbon price and precursor edits save once and remain editable", async ({
  page,
  baseURL,
}) => {
  test.skip(
    !baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname),
    "Local account regression",
  );
  const user = {
    id: "autosave-user",
    email: "autosave@example.invalid",
    onboarded: true,
    ready: true,
  };
  const records = new Map<string, { value: unknown; revision: number }>([
    ["certrace:workspaces", { value: [workspace], revision: 1 }],
    ["certrace:installations", { value: [], revision: 1 }],
    [
      "certrace:precursor-suppliers",
      {
        value: {
          [workspace.id]: [
            {
              id: "precursor-1",
              workspaceId: workspace.id,
              parentId: null,
              name: "",
              installationName: "",
              country: "TH",
              precursorName: "Pig iron",
              cnCode: "72011011",
              productionRoute: "",
              isScrap: false,
              seeTco2ePerT: null,
              dataOrigin: "default_value",
              monthlyQuantities: [],
              origin: "purchased",
              contactName: "",
              contactEmail: "",
              contactPhone: "",
              valueBasis: "default",
              reportingPeriodBasis: "default_period",
            },
          ],
        },
        revision: 1,
      },
    ],
    [
      "certrace:profile",
      { value: { companyName: "Test Company", onboarded: true }, revision: 1 },
    ],
  ]);
  const writes: string[] = [];
  let saving: string | null = null;
  let failWrites = false;
  await page.route("**/backend/api/auth/me", (route) =>
    route.fulfill({ json: { user } }),
  );
  await page.route("**/backend/api/v1/account/records", (route) =>
    route.fulfill({
      json: {
        records: [...records].map(([key, row]) => ({ key, ...row })),
      },
    }),
  );
  await page.route(
    "**/backend/api/v1/reporting/records/batch",
    async (route) => {
      if (failWrites)
        return route.fulfill({
          status: 503,
          json: { code: "TEMPORARY_ERROR", message: "Save unavailable" },
        });
      const input = route.request().postDataJSON().records as {
        key: string;
        value: unknown;
      }[];
      saving = input[0]?.key ?? null;
      await new Promise((resolve) => setTimeout(resolve, 800));
      const saved = input.map(({ key, value }) => {
        const row = { value, revision: (records.get(key)?.revision ?? 0) + 1 };
        records.set(key, row);
        writes.push(key);
        return { key, ...row };
      });
      saving = null;
      return route.fulfill({ json: { records: saved } });
    },
  );

  await page.goto(`/workspaces/${workspace.id}/carbon-price`);
  const amount = page.getByLabel(/Amount per tCO₂e/);
  await amount.fill("200");
  await expect.poll(() => saving).toBe("certrace:carbon-price");
  await expect(page.getByText("Saving changes…")).toHaveCount(0);
  await expect
    .poll(() => writes.filter((key) => key === "certrace:carbon-price").length)
    .toBe(1);
  await page.waitForTimeout(1500);
  expect(writes.filter((key) => key === "certrace:carbon-price")).toHaveLength(
    1,
  );
  await amount.fill("300");
  await expect
    .poll(() => writes.filter((key) => key === "certrace:carbon-price").length)
    .toBe(2);
  await expect(amount).toHaveValue("300");

  await page.goto(`/workspaces/${workspace.id}/precursors`);
  const quantity = page.getByRole("textbox", {
    name: "Quantity used in the reporting year",
  });
  await expect(quantity).toBeVisible();
  await page.waitForTimeout(800);
  const before = writes.filter(
    (key) => key === "certrace:precursor-suppliers",
  ).length;
  await quantity.fill("12");
  await expect.poll(() => saving).toBe("certrace:precursor-suppliers");
  await expect(page.getByText("Saving changes…")).toHaveCount(0);
  await expect
    .poll(
      () =>
        writes.filter((key) => key === "certrace:precursor-suppliers").length,
    )
    .toBe(before + 1);
  await page.waitForTimeout(1500);
  expect(
    writes.filter((key) => key === "certrace:precursor-suppliers"),
  ).toHaveLength(before + 1);
  await expect(quantity).toHaveValue("12");
  await page
    .getByRole("button", { name: /^Actual value Ask the precursor/ })
    .click();
  await expect(
    page.getByRole("button", { name: /^Actual value Ask the precursor/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(1800);
  const afterSwitch = writes.filter(
    (key) => key === "certrace:precursor-suppliers",
  ).length;
  await page.waitForTimeout(1500);
  expect(
    writes.filter((key) => key === "certrace:precursor-suppliers"),
  ).toHaveLength(afterSwitch);

  failWrites = true;
  await page
    .getByRole("textbox", { name: "Quantity used in the reporting year" })
    .fill("13");
  await expect(
    page.getByRole("button", { name: "Download unsaved changes" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toBeVisible();
});

import { test, expect, type Page } from "@playwright/test";

const installationId = "TH-FLOW-01";
const yearUrl = `/workspaces/installations/${installationId}/periods/2026`;

function seed(page: Page, productIds: string[]) {
  return page.addInitScript(
    ({ id, ids }) => {
      localStorage.setItem(
        "certrace:auth",
        JSON.stringify({
          accessToken: "local-ui-test",
          user: {
            id: "flow-test",
            email: "test@example.invalid",
            onboardingComplete: true,
          },
        }),
      );
      localStorage.setItem("certrace:lang", "en");
      localStorage.setItem(
        "certrace:installations",
        JSON.stringify([
          {
            id,
            name: "Factory A",
            nameLocal: "",
            self: true,
            supplierId: "",
            street: "1 Test Road",
            economicActivity: "Steel rolling",
            postcode: "21150",
            poBox: "",
            city: "Rayong",
            country: "TH",
            unlocode: "THMAT",
            lat: "12.681",
            lng: "101.159",
            contactName: "Tester",
            contactEmail: "test@example.invalid",
            contactPhone: "",
            otherGoods: [],
            createdAt: "2026-01-01",
          },
        ]),
      );
      localStorage.setItem(
        "certrace:reporting-periods",
        JSON.stringify([
          { installationId: id, year: 2026, createdAt: "2026-01-01" },
        ]),
      );
      localStorage.setItem(
        "certrace:workspaces",
        JSON.stringify(
          ids.map((productId, index) => ({
            id: `flow-${index + 1}`,
            installationId: id,
            installationName: "Factory A",
            productId,
            productName:
              productId === "hrc" ? "Hot-rolled coil" : "Reinforcing bar",
            cnCode: productId === "hrc" ? "7208 39 00" : "7214 20 00",
            productionRoute: "rolling_only",
            year: 2026,
            periodStart: "2026-01-01",
            periodEnd: "2026-12-31",
            declarationIds: [],
            createdAt: "2026-01-01",
            selfSupplied: true,
            internalSignoff: null,
            verifierSignoff: null,
          })),
        ),
      );
    },
    { id: installationId, ids: productIds },
  );
}

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== "local");
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] }),
    }),
  );
});

test("opening a year with one record goes straight to the old Setup and Monthly tabs", async ({
  page,
}) => {
  await seed(page, ["hrc"]);
  await page.addInitScript(() =>
    localStorage.setItem(
      "certrace:period-production",
      JSON.stringify({
        "TH-FLOW-01:2026": {
          installationId: "TH-FLOW-01",
          year: 2026,
          updatedAt: "2026-01-01",
          importedWorkspaceIds: [],
          workspaceId: "flow-1",
          processes: [
            {
              id: "old-process",
              name: "Recovered rolling process",
              routes: ["rolling_only"],
              steps: ["Reheat", "Roll"],
              precursorIds: [],
              otherInputs: [],
              products: [
                {
                  id: "old-product",
                  name: "Hot-rolled coil",
                  cnCode: "72083900",
                  description: "Coil",
                  unit: "t",
                  benchmark: "",
                },
              ],
            },
          ],
        },
      }),
    ),
  );
  await page.goto(yearUrl);
  await expect(page).toHaveURL(/\/workspaces\/flow-1$/);
  await expect(
    page.getByRole("link", { name: "Setup", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Workspace sections" })
      .getByRole("link", { name: "Monthly data" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Readiness", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Production setup" }),
  ).toBeVisible();
  await expect(page.getByText("Recovered rolling process")).toBeVisible();
});

test("opening an empty year starts the existing setup flow", async ({
  page,
}) => {
  await seed(page, []);
  await page.goto(yearUrl);
  await expect(page).toHaveURL(
    /\/workspaces\/new\?installationId=TH-FLOW-01&year=2026/,
  );
  await expect(page.getByText("What are we getting verified?")).toBeVisible();
});

test("opening a year with multiple old records uses one workflow and retains their inputs", async ({
  page,
}) => {
  await seed(page, ["hrc", "rebar"]);
  await page.goto(yearUrl);
  await expect(page).toHaveURL(/\/workspaces\/flow-1$/);
  await expect(
    page
      .getByRole("navigation", { name: "Workspace sections" })
      .getByRole("link", { name: "Monthly data" }),
  ).toBeVisible();
  await expect(
    page.locator("summary").filter({ hasText: "Reinforcing bar" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Earlier separate product inputs (1)"),
  ).toBeVisible();
  const merged = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("certrace:workspace-mmd-draft") ?? "{}")[
        "flow-1"
      ]?.inputPlan?.processes?.length,
  );
  expect(merged).toBe(2);
  await page.goto("/workspaces/flow-2/readiness");
  await expect(
    page.getByText(
      "This is an earlier product record. The factory and year have one reporting workflow.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open the reporting year’s readiness" }),
  ).toHaveAttribute("href", "/workspaces/flow-1/readiness");
});

test("adding another product to an existing year does not create another report workflow", async ({
  page,
}) => {
  await seed(page, []);
  await page.goto(yearUrl);
  await expect(page.getByRole("heading", { name: "Which good" })).toBeVisible();
  // Simulate a second tab having started the same year while this wizard was open.
  await page.evaluate(
    (id) =>
      localStorage.setItem(
        "certrace:workspaces",
        JSON.stringify([
          {
            id: "flow-1",
            installationId: id,
            installationName: "Factory A",
            productId: "hrc",
            productName: "Hot-rolled coil",
            cnCode: "7208 39 00",
            productionRoute: "rolling_only",
            year: 2026,
            periodStart: "2026-01-01",
            periodEnd: "2026-12-31",
            declarationIds: [],
            createdAt: "2026-01-01",
            selfSupplied: true,
            internalSignoff: null,
            verifierSignoff: null,
          },
        ]),
      ),
    installationId,
  );
  await page
    .getByRole("textbox", { name: "Search the CBAM catalogue" })
    .fill("7214 20 00");
  await page.getByRole("button", { name: /Reinforcing bar/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("button", { name: "Production route", exact: true })
    .click();
  await page.getByRole("option", { name: /Rolling \/ finishing only/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/workspaces\/flow-1$/);
  const state = await page.evaluate(() => ({
    workspaces: JSON.parse(localStorage.getItem("certrace:workspaces") ?? "[]")
      .length,
    processes: JSON.parse(
      localStorage.getItem("certrace:workspace-mmd-draft") ?? "{}",
    )["flow-1"]?.inputPlan?.processes?.length,
  }));
  expect(state).toEqual({ workspaces: 1, processes: 2 });
});

test("a precursor can be linked to selected products inside production processes", async ({
  page,
}) => {
  await seed(page, ["hrc"]);
  await page.addInitScript(() => {
    if (sessionStorage.getItem("product-links-plan-seeded")) return;
    sessionStorage.setItem("product-links-plan-seeded", "1");
    localStorage.setItem(
      "certrace:workspace-mmd-draft",
      JSON.stringify({
        "flow-1": {
          inputPlan: {
            operatorName: "Factory A",
            operatorRegistration: "TH-1",
            operatorAddress: "Rayong",
            registryId: "",
            monitoringStart: "2026-01-01",
            additionalFlows: [],
            processes: [
              {
                id: "melting",
                name: "Melting",
                routes: ["eaf"],
                steps: ["Melt"],
                precursorIds: [],
                otherInputs: [],
                products: [
                  {
                    id: "billet",
                    name: "Steel billet",
                    cnCode: "72071190",
                    description: "Billet",
                    unit: "t",
                    benchmark: "",
                  },
                  {
                    id: "rebar",
                    name: "Reinforcing bar",
                    cnCode: "72142000",
                    description: "Rebar",
                    unit: "t",
                    benchmark: "",
                  },
                ],
              },
              {
                id: "rolling",
                name: "Rolling",
                routes: ["rolling_only"],
                steps: ["Roll"],
                precursorIds: [],
                otherInputs: [],
                products: [
                  {
                    id: "coil",
                    name: "Hot-rolled coil",
                    cnCode: "72083900",
                    description: "Coil",
                    unit: "t",
                    benchmark: "",
                  },
                ],
              },
            ],
          },
        },
      }),
    );
  });
  await page.goto("/workspaces/flow-1/precursors");
  await page.getByRole("button", { name: "Add precursor source" }).click();
  await expect(page.getByText("Products using this precursor")).toBeVisible();
  await expect(
    page.getByText("Select at least one product that uses this precursor."),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: /Reinforcing bar/ }).check();
  await page.getByRole("checkbox", { name: /Hot-rolled coil/ }).check();
  await page.getByRole("button", { name: "Save source" }).click();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const source = JSON.parse(
          localStorage.getItem("certrace:precursor-suppliers") ?? "{}",
        )["flow-1"]?.[0];
        const plan = JSON.parse(
          localStorage.getItem("certrace:workspace-mmd-draft") ?? "{}",
        )["flow-1"]?.inputPlan;
        return {
          products: source?.consumingProductIds,
          processes: source?.consumingProcessIds,
          setupLinks: plan?.processes.map(
            (process: { precursorIds: string[] }) => process.precursorIds,
          ),
        };
      }),
    )
    .toEqual({
      products: ["rebar", "coil"],
      processes: ["melting", "rolling"],
      setupLinks: [[expect.any(String)], [expect.any(String)]],
    });
  await page.getByRole("button", { name: "Add precursor source" }).click();
  await page.getByRole("checkbox", { name: /Steel billet/ }).check();
  await page.getByRole("button", { name: "Save source" }).click();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const sources =
          JSON.parse(
            localStorage.getItem("certrace:precursor-suppliers") ?? "{}",
          )["flow-1"] ?? [];
        const plan = JSON.parse(
          localStorage.getItem("certrace:workspace-mmd-draft") ?? "{}",
        )["flow-1"]?.inputPlan;
        return {
          sources: sources.length,
          melting: plan?.processes[0].precursorIds.length,
          rolling: plan?.processes[1].precursorIds.length,
        };
      }),
    )
    .toEqual({ sources: 2, melting: 2, rolling: 1 });
  await page.goto("/workspaces/flow-1");
  await expect(
    page.getByRole("link", { name: "Link precursors to products →" }).first(),
  ).toBeVisible();
  await expect(page.getByText(/Reinforcing bar/).first()).toBeVisible();
});

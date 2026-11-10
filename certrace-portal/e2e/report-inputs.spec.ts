import { test, expect } from "@playwright/test";
const WS = "verification-input-test";
const seed = {
  "certrace:auth": JSON.stringify({
    accessToken: "local-ui-test",
    user: {
      id: "ui-test",
      email: "test@example.invalid",
      onboardingComplete: true,
    },
  }),
  "certrace:profile": JSON.stringify({
    firstName: "Test",
    lastName: "Operator",
    companyName: "Factory Test",
    sector: "steel",
    jurisdiction: "TH",
    onboarded: true,
  }),
  "certrace:workspaces": JSON.stringify([
    {
      id: WS,
      installationId: "TH-TEST-01",
      installationName: "Factory A",
      productId: "billet",
      productName: "Steel billets",
      cnCode: "72071190",
      productionRoute: "scrap_eaf",
      year: 2026,
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      declarationIds: [],
      createdAt: "2026-01-01",
      selfSupplied: true,
      supplierName: "Factory Test",
      internalSignoff: null,
      verifierSignoff: null,
    },
  ]),
};

async function start(page: import("@playwright/test").Page, path: string) {
  await page.addInitScript((values) => {
    if (!sessionStorage.getItem("report-seeded")) {
      localStorage.clear();
      for (const [k, v] of Object.entries(values)) localStorage.setItem(k, v);
      localStorage.setItem("certrace:lang", "en");
      sessionStorage.setItem("report-seeded", "1");
    }
  }, seed);
  await page.goto(`/workspaces/${WS}${path}`);
}
test("new numbered input records save, reload, isolate months, and translate", async ({
  page,
}) => {
  await start(page, "");
  const country = page.locator('[id="input-0.4"]');
  await country.locator("summary").click();
  await country
    .getByRole("combobox", { name: "Does this apply?" })
    .selectOption("yes");
  await country.getByRole("textbox", { name: "Country (ISO code)" }).fill("TH");
  await country.getByRole("button", { name: "Save topic" }).click();
  await page.reload();
  await country.locator("summary").click();
  await expect(
    country.getByRole("textbox", { name: "Country (ISO code)" }),
  ).toHaveValue("TH");
  await page.goto(`/workspaces/${WS}/monthly/2026-03#input-2.3.38`);
  const balance = page.locator('[id="input-2.3.38"]');
  await balance
    .getByRole("combobox", { name: "Does this apply?" })
    .selectOption("yes");
  await balance
    .getByRole("combobox", { name: "Production process" })
    .selectOption(`${WS}:process:0`);
  await balance.getByRole("spinbutton", { name: "Produced (MWh)" }).fill("-1");
  await expect(
    balance.getByRole("spinbutton", { name: "Produced (MWh)" }),
  ).toHaveAttribute("aria-invalid", "true");
  for (const label of ["Produced (MWh)", "Consumed (MWh)", "Exported (MWh)"])
    await balance.getByRole("spinbutton", { name: label }).fill("0");
  await balance.getByRole("button", { name: "Save topic" }).click();
  await page.goto(`/workspaces/${WS}/monthly/2026-04#input-2.3.38`);
  await expect(
    balance.getByRole("combobox", { name: "Does this apply?" }),
  ).toHaveValue("");
  await page.evaluate(() => localStorage.setItem("certrace:lang", "th"));
  await page.reload();
  await expect(balance.locator("summary")).toContainText("สมดุลไฟฟ้าผลิตเอง");
  await expect(
    balance.getByRole("combobox", { name: "ใช้กับโรงงานของคุณหรือไม่?" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByTestId("report-fields-monthly")
    .screenshot({ path: "/tmp/certrace-report-inputs-mobile.png" });
});
test("diagram original survives reload and is linked to the plan; report versions retain previous data", async ({
  page,
}) => {
  await start(page, "/mmd");
  const file = page.locator(
    'input[type=file][accept="image/*,application/pdf"]',
  );
  await file.setInputFiles({
    name: "boundary.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3wAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(
    page.getByRole("button", { name: "Download original diagram" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          JSON.parse(localStorage.getItem("certrace:report-inputs:v1") ?? "{}")[
            "verification-input-test:annual"
          ]?.["2.5.11"]?.rows[0]?.values.evidence,
        ),
      ),
    )
    .toBe(true);
  // Wait for the page's normal autosave before navigating.
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.stringify(localStorage).includes("diagramFileId"),
      ),
    )
    .toBe(true);
  await page.reload();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download original diagram" }).click();
  expect((await download).suggestedFilename()).toBe("boundary.png");
  await page.goto(`/workspaces/${WS}/readiness`);
  await page
    .getByRole("textbox", { name: "Version / correction reason" })
    .fill("Initial review");
  await page.getByRole("button", { name: "Save dataset version" }).click();
  await expect(page.getByRole("button", { name: "OER JSON" })).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Version / correction reason" })
    .fill("Second review");
  await page.getByRole("button", { name: "Save dataset version" }).click();
  await expect(page.getByRole("button", { name: "OER JSON" })).toHaveCount(2);
  const versions = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem(
        "certrace:report-snapshots:verification-input-test",
      ) ?? "[]",
    ),
  );
  expect(versions.map((v: { version: number }) => v.version)).toEqual([1, 2]);
  expect(versions[0].reason).toBe("Initial review");
  expect(versions[0].dataset.status).toBe("draft");
  expect(JSON.stringify(versions)).not.toContain("local-ui-test");
});

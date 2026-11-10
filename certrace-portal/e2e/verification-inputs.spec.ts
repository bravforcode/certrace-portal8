import { test, expect } from "@playwright/test";
import { jsPDF } from "jspdf";
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
function pdf(lines: string[]) {
  const doc = new jsPDF();
  lines.forEach((line, i) => doc.text(line, 20, 25 + i * 12));
  return Buffer.from(doc.output("arraybuffer"));
}
test("readiness uploads real PDFs, reviews values, persists pending files and fills monthly inputs", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "local");
  test.setTimeout(120_000);
  page.setDefaultTimeout(15000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning" || m.type() === "error") console.log(m.text());
  });
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], submissions: [], requests: [] }),
    }),
  );
  await page.addInitScript((values) => {
    if (!sessionStorage.getItem("input-test-seeded")) {
      for (const [key, value] of Object.entries(values))
        localStorage.setItem(key, value);
      sessionStorage.setItem("input-test-seeded", "1");
    }
  }, seed);
  await page.goto(`/workspaces/${WS}/readiness`);
  await expect(
    page.getByText("Your input readiness", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: "Choose files" })
      .locator('[data-input-ref="2.5.1"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try sample documents" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Documents", exact: true }),
  ).toHaveCount(0);
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "production-record.pdf",
      mimeType: "application/pdf",
      buffer: pdf([
        "Production report",
        "Reporting period: March 2026",
        "Total production: 1250 tonnes",
      ]),
    });
  const confirm = page.getByRole("button", {
    name: "Confirm 1 documents · fill 1 values",
  });
  await expect(confirm).toBeEnabled({ timeout: 30000 });
  await expect(page.getByText("1,250 t", { exact: true })).toBeVisible();
  // Closing the modal and reloading preserves the original and proposals.
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "Continue review" }).click();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect
    .poll(async () =>
      page.evaluate(
        (id) =>
          JSON.parse(localStorage.getItem("certrace:monthly-data") ?? "{}")[
            id
          ]?.find((m: { month: string }) => m.month === "2026-03")
            ?.productionTonnes,
        WS,
      ),
    )
    .toBe(1250);
  // A second value cannot silently replace the reviewed quantity.
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "corrected-production.pdf",
      mimeType: "application/pdf",
      buffer: pdf([
        "Production report",
        "Reporting period: March 2026",
        "Total production: 1400 tonnes",
      ]),
    });
  await expect(
    page
      .getByText(
        "A value is already entered. Review it and confirm replacement below.",
        { exact: true },
      )
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Confirm / })).toHaveCount(0);
  await page
    .getByRole("checkbox", {
      name: "Replace existing values with the selected values above",
    })
    .click();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await page.goto(`/workspaces/${WS}/monthly/2026-03`);
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Upload documents in Readiness" }),
  ).toBeVisible();
  await expect(
    page.getByText("Installation & monitoring method", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("This month’s activity").locator("..").locator(".."),
  ).toHaveClass(/ring-red-500/);
  await page
    .getByRole("link", { name: "Upload documents in Readiness" })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/workspaces/${WS}/readiness#upload-documents$`),
  );
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "electricity.pdf",
      mimeType: "application/pdf",
      buffer: pdf([
        "Electricity bill",
        "Billing period: March 2026",
        "Total electricity consumed: 75000 kWh",
      ]),
    });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect
    .poll(async () =>
      page.evaluate(
        (id) =>
          JSON.parse(localStorage.getItem("certrace:monthly-data") ?? "{}")[
            id
          ]?.find((m: { month: string }) => m.month === "2026-03")
            ?.electricityMwh,
        WS,
      ),
    )
    .toBe(75);
  await page.goto(`/workspaces/${WS}/monthly/2026-03`);
  await expect(
    page
      .locator("label")
      .filter({ has: page.getByLabel("Electricity MWh", { exact: true }) })
      .locator('[data-input-ref="2.3.17"]'),
  ).toBeVisible();
  await expect(
    page
      .locator("label")
      .filter({ has: page.getByLabel("Production tonnes", { exact: true }) })
      .locator('[data-input-ref="2.3.1"]'),
  ).toBeVisible();
  await page.goto(`/workspaces/${WS}/intake`);
  await expect(page).toHaveURL(
    new RegExp(`/workspaces/${WS}/readiness#upload-documents$`),
  );
  await page.goto(`/workspaces/${WS}`);
  await expect(
    page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Production setup" }) }),
  ).toHaveClass(/ring-red-500/);
  await expect(
    page.getByText("Missing input", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", {
      name: "CBAM Registry installation ID (if assigned)",
    }),
  ).not.toHaveAttribute("aria-invalid", "true");
  await page.screenshot({
    path: "/tmp/certrace-new-input-setup.png",
    fullPage: true,
  });
  await page
    .getByRole("textbox", { name: "Operator legal name", exact: true })
    .fill("Factory Test Limited");
  await expect(
    page
      .locator("label")
      .filter({
        has: page.getByRole("textbox", {
          name: "Operator legal name",
          exact: true,
        }),
      })
      .locator('[data-input-ref="0.1"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Operator legal name", exact: true }),
  ).not.toHaveAttribute("aria-invalid", "true");
  await page
    .getByRole("textbox", { name: "Operator registration number", exact: true })
    .fill("TEST-123");
  await page
    .getByRole("textbox", { name: "Operator address in English", exact: true })
    .fill("88 Test Road, Rayong, Thailand");
  await page
    .getByRole("textbox", { name: "Production steps, in order", exact: true })
    .fill("Melt\nCast");
  await page
    .getByRole("textbox", { name: "Product description", exact: true })
    .fill("Steel billets");
  await page.getByRole("button", { name: "Save setup", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Operator legal name", exact: true }),
  ).toHaveValue("Factory Test Limited");
  await expect(
    page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Production setup" }) }),
  ).not.toHaveClass(/ring-red-500/);
  await expect(page.getByText("Missing input", { exact: true })).toHaveCount(0);
  await page.goto(`/workspaces/${WS}/readiness`);
  await page.screenshot({
    path: "/tmp/certrace-readiness-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("aside")).not.toBeInViewport();
  await page.screenshot({
    path: "/tmp/certrace-readiness-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("language switch translates the new verification input flow", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "local");
  page.setDefaultTimeout(15000);
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], submissions: [], requests: [] }),
    }),
  );
  await page.addInitScript((values) => {
    if (!sessionStorage.getItem("input-test-seeded")) {
      for (const [key, value] of Object.entries(values))
        localStorage.setItem(key, value);
      localStorage.setItem("certrace:lang", "en");
      sessionStorage.setItem("input-test-seeded", "1");
    }
  }, seed);
  await page.goto(`/workspaces/${WS}/readiness`);
  await expect(
    page.getByText("Your input readiness", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Test Operator/ }).click();
  await page.getByRole("button", { name: /ไทย/ }).click();
  await expect(
    page.getByText("ความครบถ้วนของข้อมูล", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("อัปโหลดเอกสารเพื่อช่วยกรอกข้อมูล", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("ม.ค. 2569", { exact: true })).toBeVisible();
  await page.goto(`/workspaces/${WS}`);
  await expect(page.getByText("ตั้งค่าการผลิต", { exact: true })).toBeVisible();
  await expect(
    page.getByText("ข้อมูลที่ยังไม่ได้กรอก", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "ชื่อผู้ดำเนินการตามกฎหมาย" }),
  ).toBeVisible();
  await expect(page.locator('[data-input-ref="0.1"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: "เพิ่มกระบวนการผลิต" }),
  ).toBeVisible();
  await page.goto(`/workspaces/${WS}/monthly/2026-03`);
  await expect(page.getByRole("heading", { name: "มีนาคม 2569" })).toBeVisible();
  await expect(
    page.getByText("ยังไม่มีการส่งข้อมูลของ มีนาคม 2569", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("ข้อมูลโรงงานและวิธีติดตาม", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("กิจกรรมของเดือนนี้", { exact: true })).toBeVisible();
  await expect(
    page.getByText("จัดการแหล่งวัตถุดิบตั้งต้นและปริมาณรายเดือนที่แท็บวัตถุดิบตั้งต้น", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("วัตถุดิบตั้งต้นที่ใช้ในการผลิต", { exact: true }),
  ).toHaveCount(0);
  await page.goto(`/workspaces/${WS}/precursors`);
  await page.getByRole("button", { name: "เพิ่มแหล่งวัตถุดิบตั้งต้น" }).click();
  await expect(
    page.getByRole("radio", { name: "ค่าเริ่มต้นทางการของ EU", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-input-ref="2.4.12"]')).toBeVisible();
  await expect(
    page.getByText("ค่าการปล่อยต้องมาจากรายงานของผู้ผลิต", { exact: false }),
  ).toBeVisible();
  await page.goto(`/workspaces/${WS}/readiness`);
  await page.getByRole("button", { name: /Test Operator/ }).click();
  await page.getByRole("button", { name: /English/ }).click();
  await expect(
    page.getByText("Your input readiness", { exact: true }),
  ).toBeVisible();
});

test("readiness opens the missing economic activity field in red and clears it when answered", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "local");
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], submissions: [], requests: [] }),
    }),
  );
  await page.addInitScript((values) => {
    if (sessionStorage.getItem("economic-activity-seeded")) return;
    sessionStorage.setItem("economic-activity-seeded", "1");
    for (const [key, value] of Object.entries(values))
      localStorage.setItem(key, value);
    localStorage.setItem("certrace:lang", "en");
    localStorage.setItem(
      "certrace:installations",
      JSON.stringify([
        {
          id: "TH-TEST-01",
          name: "Factory A",
          nameLocal: "",
          self: true,
          supplierId: "",
          street: "88 Test Road",
          economicActivity: "",
          postcode: "21150",
          poBox: "",
          city: "Rayong",
          country: "TH",
          unlocode: "THMAT",
          lat: "12.681",
          lng: "101.159",
          contactName: "Test Operator",
          contactEmail: "test@example.invalid",
          contactPhone: "",
          otherGoods: [],
          createdAt: "2026-01-01",
        },
      ]),
    );
    localStorage.setItem(
      "certrace:workspace-mmd-draft",
      JSON.stringify({
        "verification-input-test": {
          inputPlan: {
            operatorName: "Factory Test",
            operatorRegistration: "TEST-123",
            operatorAddress: "88 Test Road",
            registryId: "",
            monitoringStart: "2026-01-01",
            additionalFlows: [],
            processes: [
              {
                id: "process-1",
                name: "Steel billets",
                routes: ["scrap_eaf"],
                steps: ["Melt"],
                precursorIds: [],
                otherInputs: [],
                products: [
                  {
                    id: "product-1",
                    name: "Steel billets",
                    cnCode: "72071190",
                    description: "Steel billets",
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
  }, seed);
  await page.goto(`/workspaces/${WS}/readiness`);
  const setup = page
    .locator(`a[href="/workspaces/${WS}#installation-economic-activity"]`)
    .filter({ hasText: "1. Setup" });
  await expect(setup).toContainText("Economic activity");
  await setup.click();
  const activity = page.locator("#installation-economic-activity");
  await expect(activity).toBeInViewport();
  await expect(activity).toBeEnabled();
  await expect(activity).toHaveAttribute("aria-invalid", "true");
  await expect(activity).toHaveClass(/ring-red-500/);
  await activity.fill("Hot rolling of steel billets");
  await expect(activity).toHaveAttribute("aria-invalid", "false");
  await expect(activity).not.toHaveClass(/ring-red-500/);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.goto(`/workspaces/${WS}/readiness`);
  await expect(page.getByRole("link", { name: /1\. Setup/ })).not.toContainText(
    "Economic activity",
  );
});

test("precursor tab starts empty without fabricated example data", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "local");
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], submissions: [], requests: [] }),
    }),
  );
  await page.addInitScript((values) => {
    if (!sessionStorage.getItem("precursor-demo-seeded")) {
      for (const [key, value] of Object.entries(values))
        localStorage.setItem(key, value);
      localStorage.setItem("certrace:lang", "en");
      sessionStorage.setItem("precursor-demo-seeded", "1");
    }
  }, seed);
  await page.goto(`/workspaces/${WS}/precursors`);
  await expect(
    page.getByRole("heading", { name: "Precursor sources" }),
  ).toBeVisible();
  await expect(
    page.getByText("No precursor sources added yet.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Precursor default example" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("certrace:precursor-suppliers"),
    ),
  ).toBeNull();
  await page.evaluate(() => localStorage.setItem("certrace:lang", "th"));
  await page.reload();
  await expect(
    page.getByText("ยังไม่มีแหล่งวัตถุดิบตั้งต้น", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("ข้อมูลสมมติเท่านั้น")).toHaveCount(0);
});

test("direct precursor source selects a published default and monthly consumption without typing emissions", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "local");
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] }),
    }),
  );
  await page.addInitScript((values) => {
    if (!sessionStorage.getItem("direct-precursor-seeded")) {
      for (const [key, value] of Object.entries(values))
        localStorage.setItem(key, value);
      localStorage.setItem("certrace:lang", "en");
      sessionStorage.setItem("direct-precursor-seeded", "1");
    }
  }, seed);
  await page.goto(`/workspaces/${WS}/precursors`);
  await page.getByRole("button", { name: "Add precursor source" }).click();
  await page
    .getByRole("textbox", { name: "Precursor name" })
    .fill("Steel billet");
  await page.getByRole("textbox", { name: "Exact CN code" }).fill("72071190");
  await expect(
    page.getByRole("radio", { name: "Producer's verified report" }),
  ).toBeChecked();
  await expect(
    page.getByText("Upload producer verification report", { exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "Official EU default value" }).check();
  await expect(
    page.getByText("Upload producer verification report", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Country of production" })
    .selectOption("TH");
  await expect(page.getByText("1.440", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Select this EU value" }).click();
  await expect(
    page.getByRole("spinbutton", {
      name: "Official EU default value (tCO₂e/t)",
    }),
  ).toHaveCount(0);
  await page
    .getByRole("spinbutton", { name: "Steel billets used in 2026-01 (t)" })
    .fill("100");
  await page.getByRole("button", { name: "Save source" }).click();
  await expect(page.getByText("Inputs recorded")).toBeVisible();
  await page.screenshot({
    path: "/tmp/certrace-direct-precursor-source.png",
    fullPage: true,
  });
  const saved = await page.evaluate(
    (id) =>
      JSON.parse(localStorage.getItem("certrace:precursor-suppliers") ?? "{}")[
        id
      ]?.[0],
    WS,
  );
  expect(saved.parentId).toBeNull();
  expect(saved.dataOrigin).toBe("default_value");
  expect(saved.seeTco2ePerT).toBe(1.44);
  expect(saved.defaultValueSourceId).toContain("72071190");
  expect(saved.monthlyQuantities[0].tonnes).toBe(100);
  await page.goto(`/workspaces/${WS}/monthly/2026-01`);
  await expect(
    page.getByText(
      "Precursor sources and monthly tonnes are managed in the Precursors tab.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Precursors used in production" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Open Precursors →" }),
  ).toHaveAttribute("href", `/workspaces/${WS}/precursors`);
  expect(
    await page.evaluate(
      (id) =>
        JSON.parse(
          localStorage.getItem("certrace:precursor-suppliers") ?? "{}",
        )[id]?.[0]?.monthlyQuantities[0]?.tonnes,
      WS,
    ),
  ).toBe(100);
  await page.goto(`/workspaces/${WS}/precursors`);
  await page.getByRole("button", { name: /Steel billet/ }).click();
  await page.getByRole("textbox", { name: "Exact CN code" }).fill("72071114");
  await page.getByRole("button", { name: "Save source" }).click();
  await expect(page.getByText("Needs input")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Select this EU value" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Add a precursor under/i }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText("Steel billet", { exact: true }).first(),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("precursor PDF suggests labelled values for review without saving them automatically", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "local");
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] }),
    }),
  );
  await page.addInitScript((values) => {
    if (!sessionStorage.getItem("precursor-pdf-seeded")) {
      for (const [key, value] of Object.entries(values))
        localStorage.setItem(key, value);
      localStorage.setItem("certrace:lang", "en");
      sessionStorage.setItem("precursor-pdf-seeded", "1");
    }
  }, seed);
  await page.goto(`/workspaces/${WS}/precursors`);
  await page.getByRole("button", { name: "Add precursor source" }).click();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "precursor-report.pdf",
      mimeType: "application/pdf",
      buffer: pdf([
        "CN code: 7207 11 90",
        "Specific embedded direct emissions: 1.23 tCO2e/t",
        "Specific embedded indirect emissions: 0.45 tCO2e/t",
        "Reporting period: 2026-01-01 to 2026-12-31",
      ]),
    });
  await expect(page.getByRole("button", { name: "Use value" })).toHaveCount(5, {
    timeout: 30000,
  });
  expect(
    await page.evaluate(
      (id) =>
        JSON.parse(
          localStorage.getItem("certrace:precursor-suppliers") ?? "{}",
        )[id]?.[0]?.specificEmbeddedDirectTco2PerT,
      WS,
    ),
  ).toBeFalsy();
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: "Use value" }).first().click();
  await expect(page.getByText("1.230", { exact: true })).toBeVisible();
  await expect(page.getByText("0.450", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("spinbutton", {
      name: "Direct emissions (tCO₂e/t)",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Precursor name" })
    .fill("Steel billet");
  await page
    .getByRole("textbox", { name: "Production route / technology" })
    .fill("Electric arc furnace");
  await page
    .getByRole("textbox", { name: "Producer legal name" })
    .fill("Example Steel Co");
  await page
    .getByRole("textbox", { name: "Producing installation" })
    .fill("Example steelworks");
  await page
    .getByRole("combobox", { name: "Country of production" })
    .selectOption("TH");
  await page.getByLabel("Report covers from").fill("2026-01-01");
  await page.getByLabel("Report covers until").fill("2026-12-31");
  await page
    .getByRole("textbox", { name: "Verifier name" })
    .fill("Example verifier");
  await page
    .getByRole("textbox", { name: "Accreditation number" })
    .fill("EX-123");
  await page
    .getByRole("combobox", { name: "Accreditation issuing country" })
    .selectOption("TH");
  await page
    .getByRole("textbox", { name: "Sectoral scope" })
    .fill("Crude steel");
  await page.getByLabel("Report issue date").fill("2027-01-10");
  await page.getByLabel("Accreditation expiry date").fill("2028-01-01");
  await page
    .getByRole("spinbutton", { name: "Steel billets used in 2026-01 (t)" })
    .fill("100");
  await page.getByRole("button", { name: "Save source" }).click();
  await expect(page.getByText("Inputs recorded")).toBeVisible();
});

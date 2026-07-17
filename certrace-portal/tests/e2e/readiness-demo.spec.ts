import { expect, test, type Page } from "@playwright/test";

const LOCAL_DECLARATION_KEY = "certrace:v2:created-declarations";
const LOCAL_DECLARATION_ID = "decl-playwright-local-only";
const LOCAL_SUPPLIER_ID = "supplier-playwright-local-only";

const localDeclaration = {
  id: LOCAL_DECLARATION_ID,
  name: "CBAM 2026 local-only readiness check",
  regulation: "cbam",
  origin: "TH",
  market: "EU",
  sector: "Steel & iron",
  period: "Calendar year 2026",
  periodStart: "2026-01-01",
  periodEnd: "2026-12-31",
  due: "31 Jan 2027",
  dueInDays: 365,
  collectionDeadline: "2027-01-31",
  cbamDeclarationDue: "2027-09-30",
  step: "collect",
  suppliers: [
    {
      id: LOCAL_SUPPLIER_ID,
      name: "Playwright Local Steel",
      ref: "#0003",
      country: "TH",
      material: "Hot-rolled coil",
      progress: 100,
      status: "submitted",
      emissions: "1.75",
      updated: "1d ago",
      critical: true,
    },
  ],
  totalEmbedded: null,
  carbonPricePaid: null,
  kind: "cbam",
  requests: [
    {
      supplierId: LOCAL_SUPPLIER_ID,
      products: [
        {
          productId: "hrc",
          lots: [
            {
              qty: "25",
              unit: "TNE",
              measurement: {
                enteredValue: "25",
                enteredUnit: "TNE",
                canonicalValue: "25",
                canonicalUnit: "TNE",
                conversionRule: "TNE × 1 = TNE",
                precision: { enteredDecimalPlaces: 0, canonicalDecimalPlaces: 0, rounding: "NONE_EXACT" },
                measurementSpecId: "goods-mass",
                regulatoryDataVersion: "EU-CBAM-2026.1",
              },
              from: "2026-01-01",
              to: "2026-12-31",
              notes: "Browser-local Playwright fixture",
            },
          ],
        },
      ],
    },
  ],
  buyer: {
    name: "Playwright EU Importer GmbH",
    eori: "DE123456789012",
    email: "cbam@example.invalid",
  },
  notesToSuppliers: "Use sample data only for this browser-local readiness check.",
};

const exporterState = {
  schemaVersion: 2,
  dataClassification: "readiness_demo",
  legacyUnverifiedQuarantined: false,
  declId: LOCAL_DECLARATION_ID,
  reviews: {
    [LOCAL_SUPPLIER_ID]: {
      decision: "approved",
      decidedVersion: 1,
      reviewers: [],
      comment: "Playwright fixture approval",
      unlockedFields: [],
      unlockedDocs: [],
      decidedAt: 1_780_000_000_000,
    },
  },
  summaryGeneratedAt: 1_780_000_000_000,
  packageGeneratedAt: 1_780_000_000_000,
  packageHash: null,
  dispatch: {
    worksheetDownloadedAt: null,
    checklist: {
      operator_account: false,
      installation_registered: false,
      values_entered: false,
      verifier_report_attached: false,
    },
  },
  signoffs: [
    {
      memberId: "esg",
      requestedAt: 1_780_000_000_000,
      confirmedAt: 1_780_000_000_100,
    },
  ],
  remindersSent: {},
};

function demoToken(declarationId: string, supplierId: string): string {
  return Buffer.from(`${declarationId}|${supplierId}`, "utf8").toString("base64url");
}

async function seedLocalReadinessState(page: Page, includeExporterState = false): Promise<void> {
  // The app intentionally has no backend in this readiness PR. Seed only its
  // versioned, documented browser envelopes so an isolated context can prove
  // that the same URL cannot recover locally-created state on another device.
  await page.addInitScript(
    ({ declarationKey, declaration, stateKey, state }) => {
      window.localStorage.setItem(
        declarationKey,
        JSON.stringify({
          schemaVersion: 2,
          dataClassification: "readiness_demo",
          records: [declaration],
        }),
      );
      if (stateKey && state) window.localStorage.setItem(stateKey, JSON.stringify(state));
    },
    {
      declarationKey: LOCAL_DECLARATION_KEY,
      declaration: localDeclaration,
      stateKey: includeExporterState ? `certrace:v2:exporter:${LOCAL_DECLARATION_ID}` : "",
      state: includeExporterState ? exporterState : null,
    },
  );
}

test("supplier demo follows the existing visual flow and states its browser-local boundary", async ({ page }) => {
  const token = demoToken("cbam-2026-annual-steel", "s6");

  await page.goto(`/s/${token}`);

  await expect(page.getByRole("heading", { name: /needs your carbon data/i })).toBeVisible();
  await expect(page.getByText(/stores progress only in this browser/i)).toBeVisible();
  await expect(page.getByText(/does not .*send email.*work across devices/i)).toBeVisible();

  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.getByRole("heading", { name: /CBAM.*Annual 2026/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Questionnaire", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Documents", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review & submit", exact: true })).toBeVisible();
  await expect(page.getByText(/readiness demo.*browser-local sample data only/i)).toBeVisible();

  await page.getByRole("button", { name: "Questionnaire", exact: true }).click();
  await expect(page.getByText(/^Plant MRV calculation inputs/).first()).toBeVisible();
  await expect(page.getByText("Calculation-based source streams", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Process production activity \(TNE\)/).first()).toBeVisible();
  await expect(page.getByText(/never the commercial shipment quantity/i)).toBeVisible();
});

test("exporter workflow exposes demo links and records reminders without simulated delivery", async ({ page }) => {
  await page.goto("/declarations/cbam-2026-annual-steel");

  const copyDemoLink = page.getByRole("button", { name: /copy .*demo link/i }).first();
  await expect(copyDemoLink).toBeVisible();
  await expect(page.getByText(/same-browser demo links model supplier collection/i)).toBeVisible();
  await expect(page.getByText(/No link is authenticated, emailed or cross-device/i)).toBeVisible();

  const reminder = page.getByRole("button", { name: /record follow-up|remind/i }).first();
  await reminder.click();

  await expect(page.locator("body")).not.toContainText("nudged by email");
  await expect(page.locator("body")).not.toContainText("Reminder sent");
});

test("manual handoff is a worksheet and checklist, never a simulated Registry push", async ({ page }) => {
  await seedLocalReadinessState(page, true);
  await page.goto(`/declarations/${LOCAL_DECLARATION_ID}`);

  const manualHandoff = page.getByRole("button", { name: /Manual handoff/i });
  await expect(manualHandoff).toBeVisible();
  await manualHandoff.click();
  await expect(page.getByText("O3CI manual-entry worksheet", { exact: true })).toBeVisible();
  const downloadWorksheet = page.getByRole("button", { name: "Download manual-entry CSV" });
  await expect(downloadWorksheet).toBeVisible();
  await expect(downloadWorksheet).toBeDisabled();
  await expect(page.getByText(/Local sign-off is incomplete/i)).toBeVisible();
  await expect(page.getByText(/not an O3CI upload/i)).toBeVisible();

  for (const label of ["Operator account", "Installation registered", "Values entered", "Verifier report attached"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }

  const body = page.locator("body");
  await expect(body).not.toContainText("Schema valid for definitive period");
  await expect(body).not.toContainText("Pushed to O3CI");
  await expect(body).not.toContainText("Communication Template sent");
});

test("a browser-local declaration link is unavailable in an isolated context", async ({ page, browser, baseURL }) => {
  if (!baseURL) throw new Error("Playwright baseURL is required for the isolated-context check.");
  await seedLocalReadinessState(page);
  const token = demoToken(LOCAL_DECLARATION_ID, LOCAL_SUPPLIER_ID);
  const path = `/s/${token}`;

  await page.goto(path);
  await expect(page.getByText("Playwright Local Steel", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /needs your carbon data/i })).toBeVisible();

  const isolatedContext = await browser.newContext();
  try {
    const isolatedPage = await isolatedContext.newPage();
    await isolatedPage.goto(new URL(path, baseURL).toString());

    await expect(isolatedPage.getByRole("heading", { name: /demo link is unavailable here/i })).toBeVisible();
    await expect(isolatedPage.getByText(/Demo links resolve only against data available in this browser/i)).toBeVisible();
    await expect(isolatedPage.getByText(/do not work across devices/i)).toBeVisible();
    await expect(isolatedPage.getByText("Playwright Local Steel", { exact: true })).toHaveCount(0);
  } finally {
    await isolatedContext.close();
  }
});

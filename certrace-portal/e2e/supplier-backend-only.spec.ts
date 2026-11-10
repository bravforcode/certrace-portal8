import { test, expect } from "@playwright/test";
import { emptyState } from "../lib/supplier-store";

const legacyToken = Buffer.from("cbam-2026-q2-steel|s1").toString("base64url");
test.beforeEach(async ({ baseURL }) => {
  test.skip(
    !baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname),
    "Local browser regression",
  );
});

test("a rejected legacy token never falls back to a bundled demo request", async ({
  page,
}) => {
  await page.route("**/backend/api/v1/links/**", (route) =>
    route.fulfill({
      status: 404,
      json: { detail: { code: "TOKEN_NOT_FOUND", message: "Unknown link" } },
    }),
  );
  await page.goto(`/s/${legacyToken}`);
  await expect(
    page.getByText("This link looks invalid or expired.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('a[href^="/s/"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Demo links");
});

test("a server failure shows retry instead of opening the local supplier form", async ({
  page,
}) => {
  await page.route("**/backend/api/v1/links/**", (route) =>
    route.fulfill({
      status: 503,
      json: {
        detail: { code: "UNAVAILABLE", message: "Temporarily unavailable" },
      },
    }),
  );
  await page.goto(`/s/${legacyToken}`);
  await expect(
    page.getByText("We couldn't reach the server.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toHaveCount(0);
});

test("supplier edits save through the link API, survive reload and never enter localStorage", async ({
  page,
}) => {
  const token = "backend-only-supplier-response-123456";
  let state = emptyState(token);
  let writes = 0;
  let uploads = 0;
  await page.route("**/backend/api/v1/links/**", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().url().includes("/files?")
    ) {
      uploads++;
      await route.fulfill({
        json: {
          id: "server-evidence-file",
          declarationId: "owned-declaration",
          docId: null,
          filename: "evidence.pdf",
          contentType: "application/pdf",
          sizeBytes: 14,
          sha256: "a".repeat(64),
          uploadedAt: Date.now(),
          uploadedBySupplier: true,
        },
      });
      return;
    }
    if (route.request().method() === "PUT") {
      state = route.request().postDataJSON().state;
      writes++;
      await route.fulfill({ json: state });
      return;
    }
    await route.fulfill({
      json: {
        token,
        declId: "owned-declaration",
        supplierId: "supplier",
        expiresAt: Date.now() + 86400000,
        exporter: { companyName: "Server Company" },
        declaration: {
          name: "Saved request",
          regulation: "cbam",
          origin: "TH",
          market: "EU",
          period: "2026",
          periodEnd: "2026-12-31",
          due: "2027-09-30",
          dueInDays: 100,
          kind: "cbam",
          includedFieldIds: null,
          note: "",
        },
        supplier: {
          name: "Server Supplier",
          ref: "#1",
          country: "TH",
          material: "Steel billet",
          critical: false,
          selfSupplied: false,
        },
        request: {
          products: [
            {
              productId: "billet",
              lots: [
                {
                  qty: 200,
                  unit: "tonnes (t)",
                  from: "2026-01-01",
                  to: "2026-12-31",
                  notes: "",
                },
              ],
            },
          ],
        },
        state,
      },
    });
  });
  await page.goto(`/s/${token}`);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("button", { name: "Questionnaire", exact: true })
    .click();
  const input = page.locator("main input:not([type]):not([disabled])").first();
  await input.fill("Backend-only installation");
  await expect.poll(() => writes).toBeGreaterThan(0);
  expect(Object.values(state.values)).toContain("Backend-only installation");
  await page.reload();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("button", { name: "Questionnaire", exact: true })
    .click();
  await expect(input).toHaveValue("Backend-only installation");
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  await page
    .locator('input[type="file"][aria-label^="Upload "]')
    .first()
    .setInputFiles({
      name: "evidence.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-test-file"),
    });
  await expect.poll(() => uploads).toBe(1);
  await expect
    .poll(() =>
      Object.values(state.docs)
        .flatMap((doc) => doc.files)
        .some((file) => file.fileId === "server-evidence-file"),
    )
    .toBe(true);
  const uploaded = Object.values(state.docs)
    .flatMap((doc) => doc.files)
    .find((file) => file.fileId === "server-evidence-file");
  expect(uploaded?.dataUrl).toBeUndefined();
  expect(uploaded?.name).toBe("evidence.pdf");
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        /certrace:(supplier:|profile$|workspaces$|monthly-data$|precursor-supplier-account$)/.test(
          key,
        ),
      ),
    ),
  ).toEqual([]);
});

test("a server submission receipt has no simulated revision controls", async ({
  page,
}) => {
  const token = "submitted-response-1234567890";
  const state = {
    ...emptyState(token),
    status: "submitted",
    versions: [
      {
        n: 1,
        submittedAt: Date.now(),
        score: 100,
        warnings: 0,
        signedBy: "Server signer",
        signedRole: "Operator",
      },
    ],
  };
  await page.route("**/backend/api/v1/links/**", (route) =>
    route.fulfill({
      json: {
        token,
        declId: "saved",
        supplierId: "supplier",
        expiresAt: Date.now() + 86400000,
        exporter: { companyName: "Server Company" },
        declaration: {
          name: "Saved request",
          regulation: "cbam",
          origin: "TH",
          market: "EU",
          period: "2026",
          periodEnd: "2026-12-31",
          due: "2027-09-30",
          dueInDays: 100,
          kind: "cbam",
          includedFieldIds: null,
          note: "",
        },
        supplier: {
          name: "Server Supplier",
          ref: "#1",
          country: "TH",
          material: "Steel billet",
          critical: false,
          selfSupplied: false,
        },
        request: { products: [] },
        state,
      },
    }),
  );
  await page.goto(`/s/${token}`);
  await expect(
    page.getByText("What happens next", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request revision", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Demo", { exact: true })).toHaveCount(0);
});

test("a completed supplier link can submit despite a saved failed check", async ({
  page,
}) => {
  const token = "supplier-corrected-after-check-123456";
  let state = {
    ...emptyState(token),
    values: { "ironore::direct-emissions": "1" },
    lastCheck: {
      findings: [],
      score: 0,
      critical: 1,
      warnings: 0,
      passes: 0,
      passable: false,
      ranAt: Date.now(),
    },
  };
  let submitted = false;
  await page.route("**/backend/api/v1/links/**", async (route) => {
    if (route.request().method() === "PUT") {
      state = route.request().postDataJSON().state;
      await route.fulfill({ json: state });
      return;
    }
    if (route.request().method() === "POST") {
      submitted = true;
      state = { ...state, status: "submitted" };
      await route.fulfill({ json: state });
      return;
    }
    await route.fulfill({
      json: {
        token,
        declId: "saved",
        supplierId: "supplier",
        expiresAt: Date.now() + 86400000,
        exporter: { companyName: "Server Company" },
        declaration: {
          name: "Corrected request",
          regulation: "cbam",
          origin: "TH",
          market: "EU",
          period: "2026",
          periodEnd: "2026-12-31",
          due: "2027-09-30",
          dueInDays: 100,
          kind: "buyer",
          includedFieldIds: [],
          note: "",
        },
        supplier: {
          name: "Server Supplier",
          ref: "#1",
          country: "TH",
          material: "Iron ore",
          critical: false,
          selfSupplied: false,
        },
        request: { products: [{ productId: "ironore", lots: [] }] },
        state,
      },
    });
  });
  await page.goto(`/s/${token}`);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Run quality check" }).click();
  await page.getByRole("button", { name: "Continue to sign & submit" }).click();
  await page.getByPlaceholder("Your full name").fill("Plant Operator");
  await page.getByPlaceholder("e.g. Sustainability Manager").fill("Manager");
  await page.getByText("I confirm the information is accurate").click();
  await page.getByText("I’ve reviewed the", { exact: false }).click();
  await page.getByRole("button", { name: "Submit anyway" }).click();
  await expect.poll(() => submitted).toBe(true);
});

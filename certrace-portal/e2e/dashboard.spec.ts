import { test, expect } from "@playwright/test";

test.describe("Exporter Dashboard & Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Set authenticated profile in localStorage so we can directly visit dashboard
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "certrace:profile",
        JSON.stringify({
          firstName: "Wasawat",
          lastName: "Kiakittiwong",
          companyName: "Siam Steel Export Co., Ltd.",
          sector: "iron_steel",
          jobTitle: "Export Compliance Director",
          phone: "+66 2 123 4567",
          onboarded: true,
        }),
      );
      window.localStorage.setItem(
        "certrace:auth",
        JSON.stringify({
          accessToken: "mock-session-token",
          user: {
            id: "u-001",
            email: "wasawat@siamsteel.co.th",
            name: "Wasawat Kiakittiwong",
            onboarded: true,
          },
        }),
      );
    });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test("1. Renders executive summit & metrics band without errors", async ({ page }) => {
    await expect(page.locator("body")).toContainText(/Siam Steel Export/i, { timeout: 15_000 });
    // Free trial indicator
    await expect(page.locator("body")).toContainText(/trial/i);
    // Dashboard greeting & overview
    await expect(page.locator("body")).toContainText(/Good (morning|afternoon|evening)|Overview|workspace/i);
  });

  test("2. Navigates to Workspaces via sidebar link", async ({ page }) => {
    const workspacesLink = page.locator('a[href="/workspaces"]').first();
    await expect(workspacesLink).toBeVisible({ timeout: 15_000 });
    await workspacesLink.click();
    await expect(page).toHaveURL(/\/workspaces/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/Workspaces/i);
  });

  test("3. Navigates to Smart Links via sidebar link", async ({ page }) => {
    const smartLinksLink = page.locator('a[href="/smart-links"]').first();
    await expect(smartLinksLink).toBeVisible({ timeout: 15_000 });
    await smartLinksLink.click();
    await expect(page).toHaveURL(/\/smart-links/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/Smart Links/i);
  });

  test("4. Navigates to Reports via sidebar link", async ({ page }) => {
    const reportsLink = page.locator('a[href="/reports"]').first();
    await expect(reportsLink).toBeVisible({ timeout: 15_000 });
    await reportsLink.click();
    await expect(page).toHaveURL(/\/reports/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/Reports/i);
  });

  test("5. Navigates to Carbon Cost via sidebar link", async ({ page }) => {
    const carbonCostLink = page.locator('a[href="/carbon-cost"]').first();
    await expect(carbonCostLink).toBeVisible({ timeout: 15_000 });
    await carbonCostLink.click();
    await expect(page).toHaveURL(/\/carbon-cost/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/Carbon/i);
  });
});

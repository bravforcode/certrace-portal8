import { test, expect } from "@playwright/test";

test.describe("Onboarding User Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to /login and complete sign in to reach onboarding
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("wasawat@siamsteel.co.th");
    await page.locator('input[type="password"]').fill("Password123!");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/onboarding\/setup/, { timeout: 10_000 });
  });

  test("Walks through 4-step onboarding and enters dashboard", async ({ page }) => {
    // Step 0: Welcome
    await expect(page.locator("body")).toContainText(/Good to see you/i);
    const getStartedBtn = page.getByRole("button", { name: /Get started/i });
    await expect(getStartedBtn).toBeVisible();
    await getStartedBtn.click();

    // Step 1: Set up your workspace
    await expect(page.locator("body")).toContainText(/Set up your workspace/i);

    // Verify company name field exists and is populated or editable
    const companyInput = page.locator('input[placeholder*="Siam Steel"]');
    if (await companyInput.isVisible()) {
      await companyInput.fill("Siam Steel Export Co., Ltd.");
    }

    // Fill required contact details (phone and LINE ID)
    const phoneInput = page.locator('input[aria-label="Telephone number"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill("812345678");
    }
    const lineInput = page.locator('input[placeholder*="@your-line-id"]');
    if (await lineInput.isVisible()) {
      await lineInput.fill("@siamsteel");
    }

    // Test language switcher between EN and TH
    const thBtn = page.getByRole("button", { name: "ไทย", exact: true });
    if (await thBtn.isVisible()) {
      await thBtn.click();
      await expect(page.locator("body")).toContainText(/ตั้งค่าพื้นที่ทำงานของคุณ|องค์กรของคุณ/i);

      // Switch back to EN
      const enBtn = page.getByRole("button", { name: "EN", exact: true });
      await enBtn.click();
      await expect(page.locator("body")).toContainText(/Set up your workspace/i);
    }

    // Save and continue to step 2
    const saveBtn = page.getByRole("button", { name: /Save and continue|Saved/i });
    await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
    await saveBtn.click();

    // Step 2: What you get (Value overview)
    await expect(page.locator("body")).toContainText(/Smart Link supplier invite|CBAM calculation engine/i);
    const continueBtn = page.getByRole("button", { name: /Continue/i });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // Step 3: Free trial
    await expect(page.locator("body")).toContainText(/Free trial|The full CBAM workflow/i);
    const goToWorkspaceBtn = page.getByRole("button", { name: /Go to your workspace/i });
    await expect(goToWorkspaceBtn).toBeVisible();
    await goToWorkspaceBtn.click();

    // Verify landing on /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.locator("body")).toContainText(/Dashboard|Year at a glance|Workspace/i);
  });
});

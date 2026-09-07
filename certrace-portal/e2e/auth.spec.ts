import { test, expect } from "@playwright/test";

test.describe("Authentication & Route Guarding", () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean local state
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test("1. Root redirect: unauthenticated user on / is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("h2")).toContainText(/Sign in to continue/i);
  });

  test("2. Sign-in validation: invalid email keeps submit button disabled", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    // Initially disabled
    await expect(submitBtn).toBeDisabled();

    // Invalid email format keeps button disabled
    await emailInput.fill("invalid-email");
    await passwordInput.fill("Short123");
    await expect(submitBtn).toBeDisabled();

    // Valid email and password enables button
    await emailInput.fill("exporter@siamsteel.co.th");
    await passwordInput.fill("SecurePass123!");
    await expect(submitBtn).toBeEnabled();
  });

  test("3. Sign-in flow: submitting valid credentials advances to onboarding setup", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[type="email"]').fill("exporter@siamsteel.co.th");
    await page.locator('input[type="password"]').fill("SecurePass123!");

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // In demo/MVP mode, redirects to onboarding setup
    await expect(page).toHaveURL(/\/onboarding\/setup/, { timeout: 10_000 });
    await expect(page.locator("body")).toContainText(/Welcome back|Good to see you/i);
  });

  test("4. Registration page: shows required fields and terms check", async ({ page }) => {
    await page.goto("/register");

    await expect(page.locator("h2")).toContainText(/Create your account/i);
    await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/last name/i)).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[role="checkbox"]')).toBeVisible();

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Fill in valid data and toggle checkbox
    await page.getByPlaceholder(/first name/i).fill("Jane");
    await page.getByPlaceholder(/last name/i).fill("Doe");
    await page.locator('input[type="email"]').fill("jane.doe@example.com");
    await page.getByPlaceholder(/at least 8 characters/i).fill("SecurePassword123!");
    await page.getByPlaceholder(/re-enter password/i).fill("SecurePassword123!");
    await page.locator('button[role="checkbox"]').click();

    // Now button should be enabled
    await expect(submitBtn).toBeEnabled();
  });

  test("5. Forgot password flow: allows entering email and returns to login", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.locator("h2")).toContainText(/Reset your password/i);
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Test back link to login
    const backToLogin = page.locator('a[href="/login"]');
    await expect(backToLogin).toBeVisible();
    await backToLogin.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

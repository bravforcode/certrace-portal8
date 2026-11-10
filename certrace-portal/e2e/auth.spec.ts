import { test, expect } from "@playwright/test";

test.describe("Authentication & Route Guarding", () => {
  test.beforeEach(async ({ context }) => {
    // Ensure clean state per test
    await context.clearCookies();
  });

  test("1. Root redirect: unauthenticated user on / is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("h2")).toContainText(/Sign in to continue/i);
  });

  test("2. Sign-in validation: invalid email keeps submit button disabled", async ({
    page,
  }) => {
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

  test("3. A returning ready user enters the workspace", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "production",
      "this test mocks the account response on the local app",
    );
    await page.route("**/backend/api/auth/me", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: "{}",
      }),
    );
    await page.route("**/backend/api/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "returning-user",
            email: "exporter@siamsteel.co.th",
            onboarded: true,
            ready: true,
          },
        }),
      }),
    );
    await page.route("**/backend/api/v1/account/records", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ records: [] }),
      }),
    );
    await page.goto("/login");

    await page.locator('input[type="email"]').fill("exporter@siamsteel.co.th");
    await page.locator('input[type="password"]').fill("SecurePass123!");

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test("a ready returning account skips the registration questionnaire", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "production",
      "this test mocks the account response on the local app",
    );
    const user = {
      id: "new-user",
      email: "new@example.com",
      onboarded: false,
      ready: true,
    };
    for (const path of ["me", "login"]) {
      await page.route(`**/backend/api/auth/${path}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user }),
        }),
      );
    }
    await page.route("**/backend/api/v1/account/records", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ records: [] }),
      }),
    );
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(user.email);
    await page.locator('input[type="password"]').fill("test-password-123");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("3b. Production refuses made-up credentials and stays on /login", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "production",
      "only a build with a real backend can refuse",
    );
    await page.goto("/login");

    /* Minted per run, never a fixed address: the demo addresses in the tests
       above have been registered on production by hand, so "made-up" has to
       mean an account nobody can have created. */
    const nobody = `nobody-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    await page.locator('input[type="email"]').fill(`${nobody}@example.com`);
    await page.locator('input[type="password"]').fill(`Not-${nobody}-9!`);
    await page.locator('button[type="submit"]').click();

    // Render's free tier can take most of a minute to wake on the first request.
    await expect(page.locator("body")).toContainText(
      /Email or password is incorrect/i,
      { timeout: 90_000 },
    );
    await expect(page).toHaveURL(/\/login/);
    expect(
      await page.evaluate(() => window.localStorage.getItem("certrace:auth")),
    ).toBeNull();
  });

  test("4. Reference signup stays on one form and records both current policy versions", async ({
    page,
  }) => {
    const pendingUser = {
      id: "new-register",
      email: "jane.doe@example.com",
      onboarded: false,
      ready: false,
    };
    let signedUp = false;
    await page.route("**/backend/api/auth/me", (route) =>
      route.fulfill({
        status: signedUp ? 200 : 401,
        contentType: "application/json",
        body: signedUp ? JSON.stringify({ user: pendingUser }) : "{}",
      }),
    );
    const termsVersionId = "00000000-0000-4000-8000-000000000001";
    const privacyVersionId = "00000000-0000-4000-8000-000000000002";
    await page.route("**/backend/api/auth/legal/documents", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: termsVersionId, kind: "terms" },
          { id: privacyVersionId, kind: "privacy" },
        ]),
      }),
    );
    let registered: Record<string, unknown> | undefined;
    await page.route("**/backend/api/auth/register", (route) => {
      registered = route.request().postDataJSON();
      signedUp = true;
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ user: pendingUser }),
      });
    });
    await page.route("**/backend/api/v1/account/records", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ records: [] }),
      }),
    );
    await page.route("**/backend/api/auth/onboarding/records", (route) =>
      route.fulfill({ json: { records: [] } }),
    );
    await page.route("**/backend/api/v1/reporting/records/batch", (route) => {
      const records = route.request().postDataJSON().records;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          records: records.map((record: { key: string; value: unknown }) => ({
            ...record,
            revision: 1,
          })),
        }),
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/register");

    await expect(page.locator("h2")).toContainText(/Create your account/i);
    await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/last name/i)).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    await page.getByPlaceholder(/first name/i).fill("Jane");
    await page.getByPlaceholder(/last name/i).fill("Doe");
    await page.locator('input[type="email"]').fill("jane.doe@example.com");
    await page
      .getByPlaceholder(/at least 8 characters/i)
      .fill("SecurePassword123!");
    await page
      .getByPlaceholder(/re-enter password/i)
      .fill("SecurePassword123!");
    await expect(submitBtn).toContainText("Create account");
    await expect(submitBtn).toBeDisabled();
    await expect(page.getByRole("checkbox")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", "/legal/terms");
    await expect(
      page.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/legal/privacy");
    await page.getByRole("checkbox").click();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    expect(registered).toMatchObject({
      termsAccepted: true,
      privacyAccepted: true,
      marketingOptIn: false,
      termsVersionId,
      privacyVersionId,
      firstName: "Jane",
      lastName: "Doe",
    });
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByLabel("Company name")).toBeVisible();
    await page.goto("/workspaces");
    await expect(page).toHaveURL(/\/pending$/);
    await page.goto("/onboarding");
    await expect(page.getByLabel("Company name")).toBeVisible();
    await page.route("**/backend/api/auth/login", (route) =>
      route.fulfill({ json: { user: pendingUser } }),
    );
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(pendingUser.email);
    await page.locator('input[type="password"]').fill("SecurePassword123!");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/pending$/);
    await expect(
      page.getByRole("link", { name: "Finish your questions" }),
    ).toHaveCount(0);
    pendingUser.ready = true;
    await page.getByRole("button", { name: "Check status" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("5. Forgot password flow: allows entering email and returns to login", async ({
    page,
  }) => {
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

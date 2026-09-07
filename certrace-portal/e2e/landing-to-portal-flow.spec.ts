import { test, expect } from "@playwright/test";

test.describe("Full End-to-End Journey: certrace.co -> Portal -> Supplier Intake", () => {
  test("should start from certrace.co landing page, navigate into portal, complete onboarding, and open supplier portal", async ({ page, context, baseURL }) => {
    const portalBase = baseURL || "https://portal.certrace.co";
    // 1. Intercept cross-origin link to app.certrace.dev and redirect to current portal
    await context.route("https://app.certrace.dev/**", async (route) => {
      const targetUrl = new URL(route.request().url());
      const localUrl = `${portalBase}${targetUrl.pathname}${targetUrl.search}`;
      await route.fulfill({
        status: 302,
        headers: {
          Location: localUrl,
        },
      });
    });

    // 2. Visit live certrace.co landing page
    await page.goto("https://certrace.co", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Certrace/);

    // Verify Hero headline
    const heroHeading = page.locator("h1");
    await expect(heroHeading).toContainText("Buyers don't wait");

    // Verify key value propositions & metrics
    await expect(page.locator("body")).toContainText("Lower compliance cost per filing");
    await expect(page.locator("body")).toContainText("Fewer staff hours chasing suppliers");

    // Test Language switch to Thai (TH) on certrace.co
    const langBtn = page.locator('button[aria-label="Select language"]').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      const thaiOption = page.getByRole("button", { name: "ไทย", exact: true });
      if (await thaiOption.isVisible()) {
        await thaiOption.click();
        // Thai headline should appear
        await expect(page.locator("h1")).toContainText("ผู้ซื้อไม่รอ");
      }
    }

    // 3. Click "FREE TRIAL" or "LOG IN" from certrace.co header
    const loginLink = page.getByRole("link", { name: /LOG IN|เข้าสู่ระบบ/i }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    // 4. Follow through into Portal Sign-in page
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Welcome back|Sign in/i })).toBeVisible();

    // 5. Sign in as exporter
    await page.fill('input[type="email"]', "wasawat@certrace.com");
    await page.fill('input[type="password"]', "DemoExporter123!");
    await page.getByRole("button", { name: /Sign in|เข้าสู่ระบบ/i }).click();

    // 6. Transition into Portal Dashboard or Onboarding
    await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 15_000 });

    // If redirected to onboarding, step through it to reach dashboard
    if (page.url().includes("/onboarding")) {
      const getStartedBtn = page.getByRole("button", { name: /Get started|เริ่มต้นใช้งาน/i });
      if (await getStartedBtn.isVisible()) {
        await getStartedBtn.click();
      }

      // Step 1: Set up workspace
      const phoneInput = page.locator('input[aria-label="Telephone number"]');
      if (await phoneInput.isVisible()) {
        await phoneInput.fill("812345678");
      }
      const lineInput = page.locator('input[placeholder*="@your-line-id"]');
      if (await lineInput.isVisible()) {
        await lineInput.fill("@wasawat_certrace");
      }

      const saveBtn = page.getByRole("button", { name: /Save and continue|บันทึกและดำเนินการต่อ/i });
      await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
      await saveBtn.click();

      // Step 2: What you get
      await expect(page.locator("body")).toContainText(/Smart Link supplier invite|CBAM calculation engine/i);
      const continueBtn = page.getByRole("button", { name: /Continue|ดำเนินการต่อ/i });
      await expect(continueBtn).toBeVisible();
      await continueBtn.click();

      // Step 3: Free trial
      await expect(page.locator("body")).toContainText(/Free trial|The full CBAM workflow/i);
      const goToWorkspaceBtn = page.getByRole("button", { name: /Go to your workspace|ไปยังพื้นที่ทำงานของคุณ/i });
      await expect(goToWorkspaceBtn).toBeVisible();
      await goToWorkspaceBtn.click();

      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    }

    // 7. Verify we are safely on the Exporter Dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("header")).toContainText(/Wasawat/i);

    // 8. Navigate to Smart Links Hub
    const smartLinksNav = page.locator('aside a[href="/smart-links"]');
    await smartLinksNav.click();
    await page.waitForURL(/\/smart-links/);
    await expect(page.locator("body")).toContainText(/Smart Links/i, { timeout: 15_000 });

    // 9. Open Supplier Portal intake link as an external supplier
    const supplierLinkUrl = `${portalBase}/s/ZGVjLTAwMXxzMQ`;
    await page.goto(supplierLinkUrl);
    await expect(page).toHaveURL(/\/s\/ZGVjLTAwMXxzMQ/);
    await expect(page.locator("body")).toContainText(/Certrace|Supplier/i);

    // Verify Language Switcher works for supplier
    const supplierThBtn = page.getByRole("button", { name: "ไทย", exact: true });
    if (await supplierThBtn.isVisible()) {
      await supplierThBtn.click();
      await expect(page.locator("body")).toContainText(/แบบฟอร์ม|ข้อมูลคาร์บอน/i);
    }
  });
});

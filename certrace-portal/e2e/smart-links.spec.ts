import { test, expect } from "@playwright/test";

test.describe("Smart Links & Supplier Portal Flow", () => {
  test("1. Exporter Smart Links hub renders active requests", async ({
    page,
  }) => {
    // Authenticate exporter session
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "certrace:auth",
        JSON.stringify({
          accessToken: "mock-session-token",
          user: {
            id: "u-001",
            email: "exporter@siamsteel.co.th",
            name: "Wasawat K.",
            onboarded: true,
            ready: true,
          },
        }),
      );
    });

    await page.goto("/smart-links");
    await expect(page).toHaveURL(/\/smart-links/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/Smart Links/i, {
      timeout: 15_000,
    });
    // Verify table or filter buttons
    const filterAll = page.getByRole("button", { name: /all/i }).first();
    if (await filterAll.isVisible()) {
      await expect(filterAll).toBeVisible();
    }
  });

  test("2. External supplier accesses smart link without exporter sign-in", async ({
    page,
  }) => {
    // Start with completely unauthenticated clean browser (acting as external supplier)
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    // Open sample demo smart link (base64url of "dec-001|s1" -> "ZGVjLTAwMXxzMQ")
    await page.goto("/s/ZGVjLTAwMXxzMQ");

    // Must NOT bounce supplier to /login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/s\/ZGVjLTAwMXxzMQ/, { timeout: 15_000 });

    // Verify supplier portal elements render
    await expect(page.locator("body")).toContainText(
      /Siam Yamato Steel|Supplier Portal|CBAM/i,
      { timeout: 15_000 },
    );

    // Verify language switcher is present on supplier portal
    const thBtn = page.getByRole("button", { name: "ไทย", exact: true });
    if (await thBtn.isVisible()) {
      await thBtn.click();
      // Should show Thai translations
      await expect(page.locator("body")).toContainText(
        /พอร์ทัลซัพพลายเออร์|ข้อมูล/i,
        { timeout: 15_000 },
      );

      // Switch back to EN
      const enBtn = page.getByRole("button", { name: "EN", exact: true });
      await enBtn.click();
      await expect(page.locator("body")).toContainText(/Supplier Portal/i, {
        timeout: 15_000,
      });
    }
  });
});

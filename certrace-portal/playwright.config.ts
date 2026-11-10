import { defineConfig, devices } from "@playwright/test";

const defaultBaseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false, // run sequentially to avoid Next.js dev server compiler thrashing
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: defaultBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "en-US",
  },
  projects: [
    {
      name: "local",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: defaultBaseUrl,
        // Use an installed browser when bundled Chromium is unavailable locally.
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "production",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "https://portal.certrace.co",
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});

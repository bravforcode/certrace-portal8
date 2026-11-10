import { test, expect } from "@playwright/test";

test("an unready new account saves registration answers without opening the workspace", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "production",
    "this test mocks the account response on the local app",
  );

  const user = {
    id: "survey-user",
    email: "survey@example.com",
    onboarded: false,
    ready: false,
  };
  let savedProfile: Record<string, unknown> | null = null;
  let onboardedCalls = 0;
  let signedIn = false;
  let failFirstSave = true;
  await page.route("**/backend/api/auth/me", (route) =>
    route.fulfill({
      status: signedIn ? 200 : 401,
      contentType: "application/json",
      body: signedIn ? JSON.stringify({ user }) : "{}",
    }),
  );
  await page.route("**/backend/api/auth/login", (route) => {
    signedIn = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user }),
    });
  });
  await page.route("**/backend/api/auth/onboarded", (route) => {
    onboardedCalls++;
    user.onboarded = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user }),
    });
  });
  await page.route("**/backend/api/v1/account/records", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        records: savedProfile
          ? [{ key: "certrace:profile", value: savedProfile, revision: 1 }]
          : [],
      }),
    }),
  );
  await page.route("**/backend/api/auth/onboarding/records", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          records: savedProfile
            ? [{ key: "certrace:profile", value: savedProfile, revision: 1 }]
            : [],
        }),
      });
    if (failFirstSave) {
      failFirstSave = false;
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ code: "TEMPORARY_ERROR", message: "Try again" }),
      });
    }
    const records = route.request().postDataJSON().records;
    savedProfile =
      records.find(
        (record: { key: string }) => record.key === "certrace:profile",
      )?.value ?? null;
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

  await page.goto("/login");
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill("Password123!");
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/onboarding\/done$/);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByLabel("Company name").fill("Survey Steel Co.");
  await page.getByRole("button", { name: "Primary sector" }).click();
  await page.getByRole("option", { name: /Steel & iron/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Enter your first name").fill("Jane");
  await page.getByPlaceholder("Enter your last name").fill("Doe");
  await page.getByRole("button", { name: "Job title" }).click();
  await page.getByRole("option", { name: "Compliance Manager" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("checkbox", { name: "Simplify CBAM reporting" }).click();
  await page.getByRole("checkbox", { name: "Excel or spreadsheets" }).click();
  await page
    .getByRole("checkbox", { name: "Collecting emissions data" })
    .click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("radio", { name: "1–5", exact: true }).click();
  await page
    .getByRole("radiogroup", { name: /Approximately how many suppliers/ })
    .getByRole("radio", { name: "1–10", exact: true })
    .click();
  await page.getByRole("radio", { name: "1", exact: true }).click();
  await page
    .getByRole("radiogroup", { name: "How many customers do you have?" })
    .getByRole("radio", { name: "1–10", exact: true })
    .click();
  await page.getByRole("radio", { name: "Google Search" }).click();
  await page
    .getByRole("textbox", { name: "Telephone number" })
    .fill("38123456");
  await page.getByPlaceholder("@your-line-id").fill("@survey");
  await page.getByRole("button", { name: "Finish setup" }).click();

  await expect(page.locator('p[role="alert"]')).toContainText(
    "We couldn't save your answers",
  );
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Finish setup" }).click();

  await expect(page).toHaveURL(/\/onboarding\/done/);
  expect(savedProfile).toMatchObject({
    companyName: "Survey Steel Co.",
    goalAchieve: ["Simplify CBAM reporting"],
  });
  expect(onboardedCalls).toBe(1);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/onboarding\/done/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/onboarding\/done/);
  await expect(
    page.getByRole("link", { name: "Finish your questions" }),
  ).toHaveCount(0);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/onboarding\/done/);
});

import { test, expect } from "@playwright/test";
import { readyUser } from "./ready-user";

test("cookie login, browser import, UI edits, reload and second-device persistence", async ({
  page,
  browser,
  request,
  baseURL,
}) => {
  // Run only against a developer's local stack; never create accounts on production.
  test.skip(
    !baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname),
    "Local database integration test",
  );
  const email = `persistence-${crypto.randomUUID()}@example.invalid`;
  const password = "local-test-password-123";
  const origin = new URL(baseURL!).origin;
  const api = `${origin}/backend`;
  const headers = { Origin: origin };
  const documents = (await (
    await request.get(`${api}/api/auth/legal/documents`)
  ).json()) as { kind: string; id: string }[];
  const versions = {
    termsVersionId: documents.find((d) => d.kind === "terms")!.id,
    privacyVersionId: documents.find((d) => d.kind === "privacy")!.id,
  };
  const registered = await request.post(`${api}/api/auth/register`, {
    data: {
      email,
      password,
      firstName: "Persistence",
      lastName: "Test",
      ...versions,
      termsAccepted: true,
      privacyAccepted: true,
      marketingOptIn: false,
    },
    headers,
  });
  expect(registered.status()).toBe(201);
  await readyUser((await registered.json()).user.id);
  expect(
    (await request.post(`${api}/api/auth/onboarded`, { headers })).ok(),
  ).toBeTruthy();

  // Legacy data is tied to this browser, so importing it must be explicit.
  await page.goto("/login");
  await page.evaluate(() =>
    localStorage.setItem(
      "certrace:profile",
      JSON.stringify({
        companyName: "Imported Test Plant",
        firstName: "Persistence",
        lastName: "Test",
        onboarded: true,
      }),
    ),
  );
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Import browser data" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Import browser data" }).click();
  await expect(
    page.getByRole("button", { name: "Import browser data" }),
  ).toHaveCount(0);
  await page.goto("/settings");
  const company = page.getByLabel("Company name", { exact: true });
  await expect(company).toHaveValue("Imported Test Plant");
  await company.fill("Persisted Across Devices");
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/account/records/") &&
      response.status() === 200,
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await saved;
  await page.reload();
  await expect(company).toHaveValue("Persisted Across Devices");
  expect(
    await page.evaluate(() => localStorage.getItem("certrace:profile")),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem("certrace:auth")),
  ).toBeNull();
  expect(
    await page.evaluate(() => document.cookie.includes("certrace_session")),
  ).toBe(false);

  const second = await browser.newContext({ baseURL });
  const otherPage = await second.newPage();
  try {
    await otherPage.goto("/login");
    await otherPage.getByPlaceholder("you@company.com").fill(email);
    await otherPage.locator('input[type="password"]').fill(password);
    await otherPage
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect(otherPage).toHaveURL(/onboarding/);
    await otherPage.goto("/settings");
    await expect(
      otherPage.getByLabel("Company name", { exact: true }),
    ).toHaveValue("Persisted Across Devices");
    const cookies = await second.cookies();
    expect(
      cookies.find((cookie) => cookie.name === "certrace_session")?.httpOnly,
    ).toBe(true);
  } finally {
    await second.close();
  }
});

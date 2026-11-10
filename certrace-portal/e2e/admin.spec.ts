import { test, expect } from "@playwright/test";

test("an admin can see accounts and change onboarding readiness", async ({
  page,
}, info) => {
  test.skip(info.project.name === "production", "uses local API fixtures");
  const admin = {
    id: "admin",
    email: "admin@example.invalid",
    ready: false,
    onboarded: false,
  };
  const customer = {
    id: "00000000-0000-4000-8000-000000000001",
    email: "customer@example.invalid",
    firstName: "Customer",
    lastName: "One",
    companyName: "Example Steel",
    ready: false,
    onboarded: false,
    status: "ACTIVE",
    planId: "trial",
    registeredAt: "2026-10-29T00:00:00.000Z",
  };
  await page.route("**/backend/api/auth/me", (route) =>
    route.fulfill({ json: { user: admin } }),
  );
  await page.route("**/backend/api/v1/account/records", (route) =>
    route.fulfill({ json: { records: [] } }),
  );
  await page.route("**/backend/api/admin/users*", (route) =>
    route.fulfill({ json: { users: [customer], nextCursor: null } }),
  );
  await page.route("**/backend/api/admin/users/*/ready", (route) => {
    expect(route.request().postDataJSON()).toEqual({ ready: true });
    customer.ready = true;
    return route.fulfill({ json: { user: customer } });
  });

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.getByText(customer.email)).toBeVisible();
  await expect(page.getByText("Example Steel")).toBeVisible();
  await page
    .getByRole("button", { name: `Mark ${customer.email} ready` })
    .click();
  await expect(
    page.getByRole("button", { name: `Mark ${customer.email} not ready` }),
  ).toBeVisible();
});

test("a non-admin cannot see the user list", async ({ page }, info) => {
  test.skip(info.project.name === "production", "uses local API fixtures");
  await page.route("**/backend/api/auth/me", (route) =>
    route.fulfill({
      json: {
        user: {
          id: "ordinary",
          email: "ordinary@example.invalid",
          ready: true,
          onboarded: true,
        },
      },
    }),
  );
  await page.route("**/backend/api/v1/account/records", (route) =>
    route.fulfill({ json: { records: [] } }),
  );
  await page.route("**/backend/api/admin/users*", (route) =>
    route.fulfill({
      status: 403,
      json: {
        detail: {
          code: "ADMIN_REQUIRED",
          message: "Admin access is required.",
        },
      },
    }),
  );
  await page.goto("/admin");
  await expect(page.getByText("You do not have admin access.")).toBeVisible();
  await expect(page.getByText("customer@example.invalid")).toHaveCount(0);
});

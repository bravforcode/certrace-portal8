import { test, expect } from "@playwright/test";
import { readyUser } from "./ready-user";

test("Cera preserves no-key answers, follows conversation context and cancels abandoned chats", async ({
  page,
  baseURL,
}) => {
  test.skip(
    !baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname),
    "Local test only",
  );
  const origin = new URL(baseURL!).origin;
  const headers = { Origin: origin };
  const documents = await (
    await page.request.get("/backend/api/auth/legal/documents")
  ).json();
  const registered = await page.request.post("/backend/api/auth/register", {
    headers,
    data: {
      email: `cera-ui-${crypto.randomUUID()}@example.invalid`,
      password: "test-password-123",
      termsVersionId: documents.find(
        (d: { kind: string }) => d.kind === "terms",
      ).id,
      privacyVersionId: documents.find(
        (d: { kind: string }) => d.kind === "privacy",
      ).id,
      termsAccepted: true,
      privacyAccepted: true,
      marketingOptIn: false,
    },
  });
  expect(registered.status()).toBe(201);
  await readyUser((await registered.json()).user.id);
  expect(
    (
      await page.request.post("/backend/api/auth/onboarded", { headers })
    ).status(),
  ).toBe(200);
  await page.goto("/dashboard");
  await page
    .locator('button[aria-label="Cera Intelligence"].cera-pill')
    .click();
  const popup = page.getByRole("dialog", {
    name: "Cera Intelligence",
    exact: true,
  });
  await expect(popup).toBeVisible();
  await page
    .locator('button[aria-label="Cera Intelligence"].cera-pill')
    .click();
  await expect(popup).toHaveCount(0);
  await page
    .locator("nav button")
    .filter({ hasText: "Cera Intelligence" })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Cera (Cera Intelligence)",
    exact: true,
  });
  const composer = dialog.getByRole("textbox", { name: "Message Cera" });
  await composer.fill("What is CBAM?");
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(dialog).toContainText("Carbon Border Adjustment Mechanism");

  const requests: {
    prompt: string;
    history: { role: string; content: string }[];
  }[] = [];
  let release: () => void = () => {};
  const slow = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/backend/api/v1/cera/chat", async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    const waiting = body.prompt === "Summarize my production slowly";
    if (waiting) await slow;
    await route
      .fulfill({
        json: {
          mode: "ai",
          text: waiting
            ? "Abandoned private response"
            : "Plant A recorded 42 tonnes in March 2026.",
        },
      })
      .catch(() => {
        /* An abandoned request can already be cancelled. */
      });
  });
  await composer.fill("Tell me about our March production");
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(dialog).toContainText(
    "Plant A recorded 42 tonnes in March 2026.",
  );
  await composer.fill("Which month is that?");
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1]!.history.at(-1)).toEqual({
    role: "assistant",
    content: "Plant A recorded 42 tonnes in March 2026.",
  });
  await composer.fill("Summarize my production slowly");
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect.poll(() => requests.length).toBe(3);
  await dialog.getByRole("button", { name: "New chat", exact: true }).click();
  release();
  await composer.fill("What is my production?");
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(dialog).toContainText(
    "Plant A recorded 42 tonnes in March 2026.",
  );
  await expect(dialog).not.toContainText("Abandoned private response");
  expect(requests.at(-1)!.history).toEqual([]);
});

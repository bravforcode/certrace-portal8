import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { Pool } = createRequire(
  resolve(__dirname, "../../certrace-backend/package.json"),
)("pg");
type Document = { id: string; kind: string; content: unknown };

test("policy updates require a fresh review, reject a stale form, and preserve acceptance history", async ({
  page,
  baseURL,
}) => {
  test.skip(
    process.env.CERTRACE_LEGAL_E2E !== "1",
    "Requires an explicitly selected disposable database and local API",
  );
  expect(["localhost", "127.0.0.1"]).toContain(new URL(baseURL!).hostname);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  expect(process.env.DATABASE_URL).toBeTruthy();
  const origin = new URL(baseURL!).origin;
  const api = `${origin}/backend/api`;
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  const original: Document[] = (
    await db.query("SELECT * FROM legal_document_versions WHERE is_current")
  ).rows;
  const versions = {
    termsVersionId: original.find((d) => d.kind === "terms")!.id,
    privacyVersionId: original.find((d) => d.kind === "privacy")!.id,
  };
  const headers = { Origin: origin };
  const response = await page.request.post(`${api}/auth/register`, {
    headers,
    data: {
      ...versions,
      email: `legal-browser-${crypto.randomUUID()}@example.invalid`,
      password: "test-password-123",
      termsAccepted: true,
      privacyAccepted: true,
      marketingOptIn: false,
    },
  });
  expect(response.status()).toBe(201);
  const { user } = await response.json();
  const added: string[] = [];
  async function publish(kind: string, version: string) {
    const previous = original.find((d) => d.kind === kind)!;
    const client = await db.connect();
    let next: { id: string; version: string };
    try {
      await client.query("BEGIN");
      await client.query(
        "UPDATE legal_document_versions SET is_current=false WHERE id=$1",
        [previous.id],
      );
      next = (
        await client.query(
          "INSERT INTO legal_document_versions(kind, version, content, is_current) VALUES($1,$2,$3,true) RETURNING id, version",
          [kind, version, JSON.stringify(previous.content)],
        )
      ).rows[0];
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    added.push(next.id);
    return next;
  }
  async function readAndAccept() {
    for (const title of ["Terms of Service", "Privacy Policy"]) {
      const region = page.getByRole("region", {
        name: `${title} document`,
        exact: true,
      });
      await region.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
        element.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      await page
        .getByRole("checkbox", {
          name: `I have read and agree to the ${title}.`,
          exact: true,
        })
        .check();
    }
  }
  try {
    await db.query("UPDATE public.users SET ready=true WHERE id=$1", [user.id]);
    expect(
      (await page.request.post(`${api}/auth/onboarded`, { headers })).ok(),
    ).toBe(true);
    const first = await publish("terms", `browser-terms-${Date.now()}`);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", {
        name: "Review our Terms of Service and Privacy Policy",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(`Version ${first.version}`, { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Accept and continue" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("checkbox", {
        name: "I have read and agree to the Terms of Service.",
        exact: true,
      }),
    ).toBeDisabled();
    await readAndAccept();
    const second = await publish("privacy", `browser-privacy-${Date.now()}`);
    await page.getByRole("button", { name: "Accept and continue" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "legal documents have changed" }),
    ).toContainText("legal documents have changed");
    await expect(
      page.getByText(`Version ${second.version}`, { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Accept and continue" }),
    ).toBeDisabled();
    await readAndAccept();
    const submitted = page.waitForRequest((r) =>
      r.url().endsWith("/auth/legal/accept"),
    );
    await page.getByRole("button", { name: "Accept and continue" }).click();
    expect((await submitted).postDataJSON()).toMatchObject({
      termsVersionId: first.id,
      privacyVersionId: second.id,
    });
    await expect(
      page.getByRole("heading", {
        name: "Review our Terms of Service and Privacy Policy",
      }),
    ).not.toBeVisible();
    expect((await page.request.get(`${api}/v1/account/records`)).ok()).toBe(
      true,
    );
    const records: { source: string; ip_address: string | null }[] = (
      await db.query("SELECT * FROM legal_acceptances WHERE user_id=$1", [
        user.id,
      ])
    ).rows;
    expect(records).toHaveLength(4);
    expect(records.filter((r) => r.source === "renewal")).toHaveLength(2);
    expect(records.every((r) => r.ip_address)).toBe(true);
    await page.goto("/legal/privacy");
    await expect(
      page.getByText(`Version ${second.version}`, { exact: false }),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
  } finally {
    await db.query("DELETE FROM users WHERE id=$1", [user.id]);
    await db.query(
      "DELETE FROM legal_document_versions WHERE id=ANY($1::uuid[])",
      [added],
    );
    await db.query(
      "UPDATE legal_document_versions SET is_current=true WHERE id=ANY($1::uuid[])",
      [original.map((d) => d.id)],
    );
    await db.end();
  }
});

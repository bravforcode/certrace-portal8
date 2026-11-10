import { test, expect } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { fixture } from "../../certrace-backend/test/fixtures/autofill";
import { readyUser } from "./ready-user";

for (const format of ["pdf", "txt"] as const)
  test(`Cera uploads ${format}, proposes cited report fields, and waits for explicit review`, async ({
    page,
    baseURL,
  }) => {
    test.skip(
      !baseURL ||
        !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname),
      "Local browser regression",
    );
    const origin = new URL(baseURL!).origin;
    const headers = { Origin: origin };
    const documents = await (
      await page.request.get("/backend/api/auth/legal/documents")
    ).json();
    const registered = await page.request.post("/backend/api/auth/register", {
      headers,
      data: {
        email: `cera-autofill-${crypto.randomUUID()}@example.invalid`,
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
    const seeded = await page.request.post(
      "/backend/api/v1/reporting/records/batch",
      {
        headers,
        data: { records: fixture().map((r) => ({ ...r, revision: 0 })) },
      },
    );
    expect(seeded.status(), await seeded.text()).toBe(200);

    const id = crypto.randomUUID();
    const proposalId = crypto.randomUUID();
    const run = {
      id,
      status: "review",
      fileId: "transient-source",
      sourceStored: false,
      month: "2026-03",
      monthInferred: format === "txt",
      filename: `source.${format}`,
      error: null,
      result: {
        proposals: [
          {
            id: proposalId,
            target: {
              id: "email",
              key: "certrace:report-inputs:v1",
              path: ["company:self", "0.5", "rows", 0, "values", "email"],
              label: "Operator contact email",
              kind: "string",
              current: "previous@example.com",
              context: "company:self",
              shared: true,
            },
            value: "evidence@example.com",
            original: "evidence@example.com",
            sourceUnit: "",
            page: 1,
            quote: "Operator contact email: evidence@example.com",
            explanation: "Contact email on the report",
            warnings: ["Replaces an existing value."],
            blocked: false,
          },
        ],
        unresolved: [],
        needsVision: [],
      },
    };
    let mappingCalls = 0;
    let applyCalls = 0;
    let storedUploads = 0;
    let textAvailable = true;
    await page.route(
      "**/backend/api/v1/evidence/autofill/**",
      async (route) => {
        const req = route.request();
        const path = new URL(req.url()).pathname;
        if (path.endsWith("/capabilities"))
          return route.fulfill({
            json: {
              available: true,
              textAvailable,
              allowed: true,
              maxPages: 20,
            },
          });
        if (path.endsWith("/runs") && req.method() === "GET")
          return route.fulfill({ json: [] });
        if (path.endsWith("/runs/document") && req.method() === "POST") {
          mappingCalls++;
          const query = new URL(req.url()).searchParams;
          expect(query.get("workspaceId")).toBe("ws");
          expect(query.get("month")).toBe(format === "pdf" ? "2026-03" : null);
          expect(query.get("filename")).toMatch(
            /^(source\.(pdf|txt)|supplement\.txt)$/,
          );
          expect(req.postDataBuffer()?.length).toBeGreaterThan(0);
          return route.fulfill({ json: run });
        }
        if (path.endsWith(`/runs/${id}/apply`)) {
          applyCalls++;
          expect(req.postDataJSON()).toEqual({
            selections: [{ id: proposalId }],
          });
          return route.fulfill({ json: { applied: true } });
        }
        return route.continue();
      },
    );
    await page.route("**/backend/api/v1/account/files/autofill-*", (route) => {
      storedUploads++;
      return route.fulfill({ status: 500 });
    });
    await page.goto("/dashboard");
    await page
      .locator("nav button")
      .filter({ hasText: "Cera Intelligence" })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Cera (Cera Intelligence)",
      exact: true,
    });
    await dialog.getByRole("button", { name: "Smart upload" }).first().click();
    await expect(
      dialog.getByText(
        "Smart upload is on. Add up to 10 files below and press send.",
      ),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Choose files to upload" }),
    ).toBeVisible();
    let buffer: Buffer;
    if (format === "pdf") {
      const pdf = await PDFDocument.create();
      const sheet = pdf.addPage([500, 600]);
      sheet.drawText("Operator contact email: evidence@example.com", {
        x: 30,
        y: 520,
        font: await pdf.embedFont(StandardFonts.Helvetica),
        size: 14,
      });
      buffer = Buffer.from(await pdf.save());
    } else {
      buffer = Buffer.from("Operator contact email: evidence@example.com");
    }
    const selectedFiles = [
      {
        name: `source.${format}`,
        mimeType: format === "pdf" ? "application/pdf" : "text/plain",
        buffer,
      },
      ...(format === "pdf"
        ? [
            {
              name: "supplement.txt",
              mimeType: "text/plain",
              buffer: Buffer.from(
                "Operator contact email: evidence@example.com",
              ),
            },
          ]
        : []),
    ];
    const picker = page.waitForEvent("filechooser");
    await dialog
      .getByRole("button", { name: "Choose files to upload" })
      .click();
    await (await picker).setFiles(selectedFiles);
    await dialog.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      dialog.getByText("I'll detect a clear month from each document;"),
    ).toBeVisible();
    await dialog.getByLabel("Report to autofill").selectOption("ws");
    await expect(dialog.getByLabel("Autofill reporting month")).toHaveCount(1);
    if (format === "pdf")
      await dialog.getByLabel("Autofill reporting month").fill("2026-03");
    await dialog
      .getByRole("button", {
        name: `Read and propose values from ${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"}`,
      })
      .click();
    const card = dialog.getByTestId("report-autofill");
    await expect(card.locator('input[type="file"]')).toHaveCount(0);
    await expect(card.getByText("1 proposals · 0 selected")).toBeVisible();
    if (format === "txt")
      await expect(
        card.getByText(/Reporting month detected: 2026-03/),
      ).toBeVisible();
    expect(mappingCalls).toBe(1);
    expect(applyCalls).toBe(0);
    expect(storedUploads).toBe(0);
    await expect(
      card.getByRole("button", { name: "Apply 0 reviewed values" }),
    ).toBeDisabled();
    await card
      .getByRole("checkbox", { name: "Apply Operator contact email" })
      .check();
    expect(applyCalls).toBe(0);
    await card.getByRole("button", { name: "Apply 1 reviewed values" }).click();
    await expect.poll(() => applyCalls).toBe(1);
    expect(storedUploads).toBe(0);
    if (format === "pdf") {
      await expect(
        dialog.getByText("File 2 of 2: supplement.txt"),
      ).toBeVisible();
      await expect(card.getByText("1 proposals · 0 selected")).toBeVisible();
      expect(mappingCalls).toBe(2);
    } else {
      await expect(dialog.getByText(/Batch finished/)).toBeVisible();
    }
    if (format === "txt") {
      textAvailable = false;
      await dialog
        .locator('input[type="file"]')
        .last()
        .setInputFiles({
          name: "fallback.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Electricity consumed: 120 kWh"),
        });
      await dialog.getByRole("button", { name: "Send", exact: true }).click();
      await expect(dialog.getByText(/Thanks — I've read it/)).toBeVisible();
      expect(await dialog.getByTestId("report-autofill").count()).toBe(0);
    }
    await dialog
      .getByRole("button", { name: "Smart upload", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Choose files to upload" }),
    ).toBeVisible();
    await expect(dialog.getByText(/Batch finished/)).toHaveCount(0);
  });

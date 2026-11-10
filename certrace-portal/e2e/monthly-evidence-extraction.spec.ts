import { test, expect, type Page } from "@playwright/test";
import { emptyMonth } from "../lib/monthly-data";
import { emptyMmd } from "../lib/workspace-mmd";
import type {
  WorkspaceLinkState,
  WorkspaceSlice,
} from "../lib/workspace-link-sync";

const token = "monthly-evidence-test-token";
const ws = "evidence-test-workspace";
const month = "2026-01";
const pdf = Buffer.from(
  "%PDF-1.7\nsynthetic document for extraction regression",
);
test.beforeEach(({ baseURL }) => {
  test.skip(
    !baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname),
    "Local browser regression",
  );
});

async function fixture(
  page: Page,
  options: {
    available?: boolean;
    fail?: boolean;
    readingGate?: Promise<void>;
  } = {},
) {
  const slice: WorkspaceSlice = {
    workspace: {
      id: ws,
      installationId: "test-plant",
      installationName: "Test plant",
      productId: "kaolin",
      productName: "Calcined clay",
      cnCode: "2507 00 80",
      year: 2026,
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      createdAt: "2026-01-01",
      declarationIds: [],
    },
    installation: { id: "test-plant", name: "Test plant", country: "TH" },
    stores: {
      "certrace:monthly-data": [
        {
          ...emptyMonth(ws, month),
          status: "draft",
          productionTonnes: 10,
          electricitySources: [
            {
              id: "grid",
              sourceType: "grid_default",
              mwh: 0,
              factorTco2PerMwh: 0.47,
            },
          ],
        },
      ],
      "certrace:workspace-mmd-draft": emptyMmd("2026-01-01", "2026-12-31"),
      "certrace:workspace-evidence": [],
    },
  };
  const observed = {
    state: { status: "draft", slice } as WorkspaceLinkState,
    extractions: 0,
    capabilities: 0,
    uploads: 0,
  };
  await page.route("**/backend/api/v1/links/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith("/evidence/extraction")) {
      observed.capabilities++;
      await route.fulfill({ json: { available: options.available ?? true } });
    } else if (url.pathname.endsWith("/evidence/extract")) {
      observed.extractions++;
      expect(request.postDataBuffer()).toEqual(pdf);
      expect(request.headers()["x-certrace-account"]).toBeUndefined();
      await options.readingGate;
      await route.fulfill(
        options.fail
          ? {
              status: 503,
              json: {
                detail: {
                  code: "EXTRACTION_FAILED",
                  message: "Document reading is temporarily unavailable.",
                },
              },
            }
          : {
              json: {
                text: JSON.stringify({
                  fields: [
                    {
                      key: "electricity-consumed",
                      value: "123000",
                      unit: "kWh",
                      confidence: 0.95,
                    },
                  ],
                }),
              },
            },
      );
    } else if (url.pathname.endsWith("/files") && request.method() === "POST") {
      observed.uploads++;
      await route.fulfill({
        json: {
          id: `stored-file-${observed.uploads}`,
          declarationId: `ws-${ws}`,
          docId: url.searchParams.get("docId"),
          filename: url.searchParams.get("filename"),
          contentType: "application/pdf",
          sizeBytes: pdf.length,
          sha256: "a".repeat(64),
          uploadedAt: Date.now(),
          uploadedBySupplier: true,
        },
      });
    } else if (url.pathname.endsWith("/state")) {
      observed.state = request.postDataJSON().state;
      await route.fulfill({ json: observed.state });
    } else {
      await route.fulfill({
        json: {
          token,
          kind: "workspace",
          declId: `ws-${ws}`,
          supplierId: ws,
          month,
          exporter: { companyName: "Test exporter" },
          workspace: slice,
          state: observed.state,
        },
      });
    }
  });
  await page.goto(`/w/${token}`);
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  return observed;
}
const card = (page: Page, text: string) =>
  page.locator("div.rounded-xl.border.p-3\\.5").filter({ hasText: text });
async function attach(page: Page, label: string, name: string) {
  await card(page, label)
    .locator('input[type="file"]')
    .setInputFiles({ name, mimeType: "application/pdf", buffer: pdf });
}

test("installation diagrams save as evidence without any extraction request or failure", async ({
  page,
}) => {
  const observed = await fixture(page);
  await attach(
    page,
    "Installation diagram — process flow",
    "installation-diagram.pdf",
  );
  await expect.poll(() => observed.uploads).toBe(1);
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  expect(observed.capabilities).toBe(0);
  expect(observed.extractions).toBe(0);
  await expect(
    page.getByText("Extraction failed", { exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  await expect(card(page, "Installation diagram — process flow")).toContainText(
    "installation-diagram.pdf",
  );
});

test("a bill proposes values, preserves its uploaded original during extraction, and fills only after acceptance", async ({
  page,
}) => {
  let finishReading!: () => void;
  const readingGate = new Promise<void>((resolve) => {
    finishReading = resolve;
  });
  const observed = await fixture(page, { readingGate });
  await attach(
    page,
    "Utility invoice — the electricity bill",
    "electricity-bill.pdf",
  );
  await expect.poll(() => observed.extractions).toBe(1);
  await expect.poll(() => observed.uploads).toBe(1);
  const rows = () =>
    observed.state.slice!.stores["certrace:monthly-data"] as {
      electricityMwh: number;
    }[];
  expect(rows()[0].electricityMwh).toBe(0);
  finishReading();
  const bill = card(page, "Utility invoice — the electricity bill");
  await expect(
    bill.getByText("Proposed values — nothing is written until you accept"),
  ).toBeVisible();
  await bill.getByRole("button", { name: "Edit", exact: true }).click();
  await bill.getByRole("textbox").fill("not-a-reading");
  await bill.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(
    page.getByText("Review this reading", { exact: true }),
  ).toBeVisible();
  expect(rows()[0].electricityMwh).toBe(0);
  await bill.getByRole("textbox").fill("123000");
  await bill.getByRole("button", { name: "Accept", exact: true }).click();
  await expect.poll(() => rows()[0].electricityMwh).toBe(123);
  const evidence = observed.state.slice!.stores[
    "certrace:workspace-evidence"
  ] as {
    serverFileId: string;
    extraction: { fields: { accepted: boolean }[] };
  }[];
  expect(evidence[0].serverFileId).toBe("stored-file-1");
  expect(evidence[0].extraction.fields[0].accepted).toBe(true);
  expect(observed.uploads).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Monthly data", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Electricity MWh", exact: true }),
  ).toHaveValue("123");
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  await expect(
    bill.getByText("electricity-bill.pdf", { exact: true }),
  ).toBeVisible();
  expect(
    await bill.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await bill.screenshot({
    path: "/private/tmp/certrace-extraction-local.jpg",
    animations: "disabled",
  });
});

test("a provider failure keeps the bill saved and allows manual entry", async ({
  page,
}) => {
  const observed = await fixture(page, { fail: true });
  await attach(
    page,
    "Utility invoice — the electricity bill",
    "manual-entry-bill.pdf",
  );
  await expect(
    page.getByText("Extraction failed", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => observed.uploads).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  await expect(
    card(page, "Utility invoice — the electricity bill"),
  ).toContainText("manual-entry-bill.pdf");
});

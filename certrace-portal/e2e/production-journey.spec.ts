import { createHash, randomBytes } from "node:crypto";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { AUGUST_PRODUCTION, fillAugust, signAndSubmitAugust } from "./support/supplier-month";

/* ════════════════════════════════════════════════════════════
   THE MVP LOOP, ON THE REAL DOMAIN (PROJECT_STATUS.md R2 / QA-2)

   mvp-journey.spec.ts walks the same month, but its "link" is base64 in one
   browser's localStorage — it proves the form, not the transport. This one
   proves the transport, against portal.certrace.co and api.certrace.co:

     exporter  signs in for real, opens a workspace's monthly page and presses
               Copy link — the portal publishes the workspace and the server
               mints a token (lib/workspace-link-sync.ts::ensureWorkspaceLink)
     supplier  opens /w/<token> in a SEPARATE browser context with no account
               and no shared storage, fills August, attaches evidence to the
               link, signs and submits through the server
     exporter  reloads the monthly page, which pulls the month back from the
               server, and reads 4,820.5 t / 1 of 12 months
     cleanup   deletes the workspace's declaration, which cascades its link,
               the supplier's answers and the uploaded file (migration 011)

   ── What it deliberately does NOT press ─────────────────────────
   "Send now" registers a reminder subject and marks it sent, and on
   production that mails the supplier (CERTRACE_SUPPLIER_EMAILS=1). A test
   must never write to anyone, so the month's dispatch is seeded locally and
   Copy link — which only mints — is the button pressed. No /reminder-subjects
   route is called anywhere in this file.

   ── Evidence goes up through the API, not the drop zone ─────────
   The supplier's drop zone is still the simulated-detection prototype
   (components/intake/smart-intake.tsx). What has never been exercised on
   production is the server half: POST /links/{token}/files, the bytes landing
   in Postgres, and the exporter reading them back. That is called directly
   here, exactly as lib/api/files.ts::uploadLinkFile calls it.

   ── Running it ──────────────────────────────────────────────────
     E2E_ACCOUNT_EMAIL=… E2E_ACCOUNT_PASSWORD=… npm run test:e2e:prod:journey

   The account must be a real portal account that has finished onboarding
   once. Use one that exists for this — never a customer's, and never the
   credentials in another spec. Without both variables the test is skipped.
   Optional: E2E_API_URL (default https://api.certrace.co).
   ════════════════════════════════════════════════════════════ */

const EMAIL = process.env.E2E_ACCOUNT_EMAIL ?? "";
const PASSWORD = process.env.E2E_ACCOUNT_PASSWORD ?? "";
const API = (process.env.E2E_API_URL ?? "https://api.certrace.co").replace(/\/+$/, "");

const MONTH = "2026-08";
const RUN = randomBytes(8).toString("hex");
const WS = `ws-${RUN}`;
const DOC_ID = `ws-${WS}`; // workspaceDocId() in lib/workspace-link-sync.ts
const SUPPLIER_ID = `sup-${RUN}`;
const INSTALLATION_ID = `E2E-${RUN.toUpperCase()}`;
const INSTALLATION_NAME = `E2E Billet Plant ${RUN.slice(0, 6)}`;
const SIGNER = { name: "E2E Supplier Signatory", role: "Production Manager" };

/* Only example.com addresses: nothing in this run mails anyone, and if that
   ever changed the message would go nowhere. */
const SEED: Record<string, string> = {
  "certrace:supplier-companies": JSON.stringify([{
    id: SUPPLIER_ID, name: `E2E Supplier ${RUN.slice(0, 6)}`, country: "TH",
    contactName: "E2E Contact", contactEmail: "e2e-supplier@example.com", contactPhone: "+66 800000000",
    createdAt: "2026-09-08T02:54:36.071Z",
  }]),
  "certrace:installations": JSON.stringify([{
    id: INSTALLATION_ID, name: INSTALLATION_NAME, nameLocal: "", self: false,
    supplierId: SUPPLIER_ID, street: "1 Test Road", economicActivity: "Electric arc furnace steelmaking and billet casting",
    postcode: "21150", poBox: "", city: "Rayong", country: "TH", unlocode: "THMAT", lat: "12.6810", lng: "101.1590",
    contactName: "E2E Contact", contactEmail: "e2e-supplier@example.com", contactPhone: "+66 800000000",
    otherGoods: [], createdAt: "2026-09-08T02:54:56.341Z",
  }]),
  "certrace:workspaces": JSON.stringify([{
    id: WS, installationId: INSTALLATION_ID, installationName: INSTALLATION_NAME,
    productId: "billet", productName: "Billets (semi-finished)", cnCode: "7207 11 90",
    productionRoute: "scrap_eaf", year: 2026, periodStart: "2026-01-01", periodEnd: "2026-12-31",
    declarationIds: [], createdAt: "2026-09-08T02:55:59.242Z", selfSupplied: false,
    supplierId: SUPPLIER_ID, supplierName: `E2E Supplier ${RUN.slice(0, 6)}`,
    schedule: { dueDay: 15 }, internalSignoff: null, verifierSignoff: null,
  }]),
  // Local only: lets the August card offer Copy link without pressing Send.
  "certrace:month-dispatch": JSON.stringify({
    [WS]: { [MONTH]: { workspaceId: WS, month: MONTH, sentAt: "2026-09-08T02:56:58.645Z",
      lastActionAt: "2026-09-08T02:56:58.645Z", resendCount: 0, reminderCount: 0, dueDay: 15 } },
  }),
};

/* A real, tiny PDF: the server checks the %PDF- magic, not the extension. */
const EVIDENCE = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\n" +
    `% certrace e2e ${RUN}\ntrailer<</Root 1 0 R>>\n%%EOF\n`,
);
const EVIDENCE_NAME = `e2e-natural-gas-invoice-${RUN.slice(0, 6)}.pdf`;

let accessToken: string | null = null;

const bearer = () => ({ Authorization: `Bearer ${accessToken}` });

async function signIn(page: Page): Promise<string> {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  const handle = await page.waitForFunction(
    () => {
      try {
        return JSON.parse(window.localStorage.getItem("certrace:auth") ?? "null")?.accessToken ?? null;
      } catch {
        return null;
      }
    },
    undefined,
    { timeout: 90_000 },
  );
  return (await handle.jsonValue()) as string;
}

/** Wake the API before the clock starts: Render's free tier sleeps. */
async function warm(request: APIRequestContext): Promise<void> {
  const res = await request.get(`${API}/readyz`, { timeout: 120_000 });
  expect(res.status(), "api /readyz").toBe(200);
  expect((await res.json()).databaseConfigured, "api has a database").toBe(true);
}

test.describe("Production MVP loop — real accounts, real links, real files", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "production", "needs a deployed backend; run with --project=production");
    test.skip(!EMAIL || !PASSWORD, "set E2E_ACCOUNT_EMAIL and E2E_ACCOUNT_PASSWORD to a test account");
  });

  test.afterEach(async ({ request }) => {
    if (!accessToken) return;
    // Cascades the link, its saved state and the uploaded file.
    const res = await request.delete(`${API}/api/v1/declarations/${DOC_ID}`, { headers: bearer() });
    expect(res.status(), `cleanup: DELETE ${DOC_ID}`).toBe(204);
    const gone = await request.get(`${API}/api/v1/declarations/${DOC_ID}`, { headers: bearer() });
    expect(gone.status(), "the workspace declaration is gone after cleanup").toBe(404);
  });

  test("exporter mints a month, supplier answers it from another browser, exporter reads it back", async ({ page, browser, request }, testInfo) => {
    test.setTimeout(420_000);
    page.on("pageerror", (e) => console.log("EXPORTER PAGE ERROR:", e.message));
    console.log(`run ${RUN}: workspace ${WS}`);

    await warm(request);

    /* ── 1 · The exporter signs in for real ──────────────────── */
    accessToken = await signIn(page);
    expect(accessToken, "a session token after sign-in").toBeTruthy();

    const me = await request.get(`${API}/api/auth/me`, { headers: bearer() });
    expect(me.status(), "/api/auth/me with the new session").toBe(200);

    /* ── 2 · A workspace on this browser, then Copy link ─────── */
    await page.evaluate((seed) => {
      for (const [k, v] of Object.entries(seed)) window.localStorage.setItem(k, v);
    }, SEED);
    await page.goto(`/workspaces/${WS}/monthly`);
    await expect(page.locator("body")).toContainText("Annual production", { timeout: 30_000 });

    // Only a month that has gone out offers Copy link, and only August was
    // seeded as sent — so there is exactly one, and it is August's.
    const copyLink = page.getByRole("button", { name: "Copy link" });
    await expect(copyLink).toHaveCount(1);
    await copyLink.click();

    const tokenHandle = await page.waitForFunction(
      ([ws, month]) => {
        try {
          return JSON.parse(window.localStorage.getItem("certrace:workspace-server-links") ?? "{}")?.[ws]?.[month] ?? null;
        } catch {
          return null;
        }
      },
      [WS, MONTH] as const,
      { timeout: 60_000 },
    );
    const token = (await tokenHandle.jsonValue()) as string;
    expect(token, "a server-issued token, not the demo's base64").not.toMatch(/^d3N8/);
    console.log(`minted link token (${token.length} chars)`);

    // The server holds the workspace slice and resolves the token publicly.
    const published = await request.get(`${API}/api/v1/declarations/${DOC_ID}`, { headers: bearer() });
    expect(published.status(), "workspace published as a declaration").toBe(200);
    const resolved = await request.get(`${API}/api/v1/links/${token}`);
    expect(resolved.status(), "public resolve of the new link").toBe(200);
    expect((await resolved.json()).kind).toBe("workspace");

    /* ── 3 · The supplier, on "another machine" ──────────────── */
    const supplierContext = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport ?? undefined,
      locale: "en-US",
    });
    try {
      const supplier = await supplierContext.newPage();
      supplier.on("pageerror", (e) => console.log("SUPPLIER PAGE ERROR:", e.message));

      await supplier.goto(`/w/${token}`);
      await fillAugust(supplier, INSTALLATION_NAME);

      // Evidence against the live link — the route a supplier's attachment takes.
      const upload = await request.post(
        `${API}/api/v1/links/${token}/files?filename=${encodeURIComponent(EVIDENCE_NAME)}&docId=e2e-${RUN}`,
        { headers: { "Content-Type": "application/pdf" }, data: EVIDENCE },
      );
      expect(upload.status(), `upload: ${await upload.text()}`).toBe(201);
      const stored = await upload.json();
      expect(stored.sha256).toBe(createHash("sha256").update(EVIDENCE).digest("hex"));

      const submitted = supplier.waitForResponse(
        (r) => r.url().includes(`/api/v1/links/${token}/submit`) && r.request().method() === "POST",
        { timeout: 60_000 },
      );
      await signAndSubmitAugust(supplier, SIGNER);
      const submitResponse = await submitted;
      expect(submitResponse.status(), "server accepted the submit").toBe(200);
      await expect(supplier.locator("body")).toContainText(/Submitted/i, { timeout: 15_000 });

      /* ── 4 · The exporter reads it back ─────────────────────── */
      const state = await request.get(`${API}/api/v1/declarations/${DOC_ID}/submissions/${token}`, { headers: bearer() });
      expect(state.status()).toBe(200);
      const answer = (await state.json()).state;
      expect(answer.status).toBe("submitted");
      expect(answer.versions.at(-1)).toMatchObject({ n: 1, signedBy: SIGNER.name, signedRole: SIGNER.role });

      const files = await request.get(`${API}/api/v1/declarations/${DOC_ID}/files`, { headers: bearer() });
      expect(files.status()).toBe(200);
      const file = (await files.json()).files.find((f: { id: string }) => f.id === stored.id);
      expect(file, "the supplier's upload is listed for the exporter").toBeTruthy();
      const bytes = await request.get(`${API}/api/v1/files/${stored.id}`, { headers: bearer() });
      expect(bytes.status()).toBe(200);
      expect(Buffer.compare(await bytes.body(), EVIDENCE), "same bytes back").toBe(0);

      await page.goto(`/workspaces/${WS}/monthly`);
      await expect(page.locator("body")).toContainText(AUGUST_PRODUCTION, { timeout: 30_000 });
      await expect(page.locator("body")).toContainText(/1\s*\/\s*12/);
    } finally {
      await supplierContext.close();
    }
  });
});

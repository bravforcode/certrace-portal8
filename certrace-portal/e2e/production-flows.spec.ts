import {
  test,
  expect,
  type APIResponse,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* End-to-end coverage of the production flows that cross the portal and the
   backend: registration and approval, password reset, cookie consent, shared
   workbooks, the flow diagram, import, the live check, smart links, convert,
   the factory profile and the trial lock.

   Runs against a local stack only (backend on :8000 with
   CERTRACE_EMAIL_DELIVERY=console, portal dev server on :3000). The backend
   prints every mail as a console object; E2E_MAIL_LOG must point at that
   stdout capture so the tests can read verification codes. */

const { Client } = createRequire(
  resolve(__dirname, "../../certrace-backend/package.json"),
)("pg");

const ORIGIN = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API = `${ORIGIN}/backend`;
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://certrace:certrace-local@127.0.0.1:55432/certrace";
const MAIL_LOG = process.env.E2E_MAIL_LOG ?? "";
const PASSWORD = "e2e-password-123";
const NEW_PASSWORD = "e2e-new-password-456";
const FIXTURE = resolve(__dirname, "fixtures/materials.csv");
const INST = "TH-E2E-PLANT";
const OEM = "TH-E2E-OEM";
const INSTALLATIONS_KEY = "certrace:installations";

if (!MAIL_LOG) {
  throw new Error(
    "set E2E_MAIL_LOG to the backend stdout capture (CERTRACE_EMAIL_DELIVERY=console)",
  );
}

/* ── Helpers ───────────────────────────────────────────────── */

async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();
  try {
    return (await db.query(text, params)).rows as T[];
  } finally {
    await db.end();
  }
}

type Account = { id: string; email: string };

/* Creates a signed-in, approved and onboarded account in this context. The
   session cookie lands in the context's jar, so pages opened in it are signed in. */
async function registerReady(
  context: BrowserContext,
  label: string,
): Promise<Account> {
  const email = `e2e-${label}-${crypto.randomUUID()}@example.invalid`;
  const docs = (await (
    await context.request.get(`${API}/api/auth/legal/documents`)
  ).json()) as { kind: string; id: string }[];
  const registered = await context.request.post(`${API}/api/auth/register`, {
    data: {
      email,
      password: PASSWORD,
      firstName: "E2E",
      lastName: label,
      termsVersionId: docs.find((d) => d.kind === "terms")!.id,
      privacyVersionId: docs.find((d) => d.kind === "privacy")!.id,
      termsAccepted: true,
      privacyAccepted: true,
      marketingOptIn: false,
    },
    headers: { Origin: ORIGIN },
  });
  expect(registered.status()).toBe(201);
  const { user } = (await registered.json()) as { user: { id: string } };
  await sql(
    "UPDATE public.users SET ready=true, approved_at=now(), trial_started_at=now() WHERE id=$1",
    [user.id],
  );
  const onboarded = await context.request.post(`${API}/api/auth/onboarded`, {
    headers: { Origin: ORIGIN },
  });
  expect(onboarded.ok()).toBeTruthy();
  return { id: user.id, email };
}

/* The installation record the Installation tab edits, stored as the account
   record the Settings page reads. A plain seed: the UI is not the subject. */
function installation(id: string) {
  return {
    id,
    name: "E2E Plant",
    nameLocal: "",
    self: true,
    supplierId: "",
    street: "1 Test Road",
    economicActivity: "Steel rolling",
    postcode: "10110",
    poBox: "",
    city: "Bangkok",
    country: "TH",
    unlocode: "THBKK",
    lat: "13.7563",
    lng: "100.5018",
    contactName: "E2E Contact",
    contactEmail: "contact@example.invalid",
    contactPhone: "0812345678",
    otherGoods: [],
    operatorName: "",
    operatorRegistrationNumber: "",
    operatorAddress: "",
    registryId: "",
    monitoring: {
      nonCbamProcesses: "",
      topFuels: "",
      topMaterials: "",
      cems: "",
      cemsDetail: "",
      zeroRatedFuels: "",
      zeroRatedDetail: "",
      heatTrade: "",
      heatDetail: "",
      electricityMixed: "",
      electricityDetail: "",
      onsiteElectricity: "",
      onsiteElectricityDetail: "",
      wasteGases: "",
      wasteGasDetail: "",
      co2Transfer: "",
      co2TransferDetail: "",
      electricityToEu: "",
    },
    createdAt: new Date().toISOString(),
  };
}

async function seedInstallations(
  context: BrowserContext,
  list: ReturnType<typeof installation>[],
) {
  const saved = await context.request.put(
    `${API}/api/v1/account/records/${encodeURIComponent(INSTALLATIONS_KEY)}`,
    { data: { value: list, revision: 0 }, headers: { Origin: ORIGIN } },
  );
  expect(saved.ok(), await saved.text()).toBeTruthy();
}

/* Reads the backend mail capture until a mail to `to` matching `pattern` appears. */
async function waitForMail(to: string, pattern: RegExp, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const log = readFileSync(MAIL_LOG, "utf8");
    const blocks = [
      ...log.matchAll(
        /to: ["']([^"']+)["'],?\s*\n?\s*subject: ["']([^"']*)["'],?\s*\n?\s*text: ["']((?:[^"'\\]|\\.)*)["']/g,
      ),
    ];
    const hit = blocks
      .filter((m) => m[1] === to && pattern.test(m[3] ?? ""))
      .at(-1);
    if (hit) return hit[3] ?? "";
    if (Date.now() > deadline)
      throw new Error(`no mail to ${to} matching ${pattern}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

/* Cookie choice the banner stores. lib/cookie-consent.ts keeps KEY and
   COOKIE_POLICY_VERSION private, so they are copied here; a change there breaks
   this helper, which then shows the banner and fails the tests that rely on it. */
const COOKIE_KEY = "certrace:cookie-prefs";
const COOKIE_POLICY_VERSION = "2026-11-10";

/* A context whose cookie choice is already recorded before any page script
   runs, so the banner never opens and cannot cover the forms. */
async function newSession(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext();
  await context.addInitScript(
    ([key, version]: [string, string]) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          analytics: false,
          marketing: false,
          decidedAt: new Date().toISOString(),
          policyVersion: version,
        }),
      );
    },
    [COOKIE_KEY, COOKIE_POLICY_VERSION] as [string, string],
  );
  return context;
}

async function signInUi(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

/* The sheet tab button, by its visible name. */
const tab = (page: Page, name: RegExp) =>
  page.getByRole("button", { name }).first();

/* Opens a sheet's grid cell by row and column index, then types into it. */
async function typeCell(page: Page, row: number, col: number, value: string) {
  const cell = page.getByRole("row").nth(row).getByRole("gridcell").nth(col);
  await cell.dblclick();
  const input = page.getByRole("grid").locator("input").first();
  await input.fill(value);
  await input.press("Enter");
}

/* A year with no data opens on a start-choice screen; pick a blank start so the sheets show. */
async function startBlankWorkspace(page: Page) {
  const blank = page.getByText("Start from the beginning");
  if (await blank.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await blank.click();
    await page.getByRole("button", { name: /^confirm$/i }).click();
  }
}

/* Makes `editor` an editor of `owner`'s account. */
async function addEditor(ownerId: string, editorId: string) {
  await sql(
    "INSERT INTO masterdata.accounts (id) VALUES ($1) ON CONFLICT DO NOTHING",
    [ownerId],
  );
  await sql(
    "INSERT INTO masterdata.account_members (account_id, user_id, role) VALUES ($1, $2, 'editor') ON CONFLICT DO NOTHING",
    [ownerId, editorId],
  );
}

/* ── 1. Registration, onboarding, approval, trial ─────────── */

test("1. register, onboard, wait for approval, and start the 30-day trial", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const customer = await newSession(browser);
  const page = await customer.newPage();
  const email = `e2e-register-${crypto.randomUUID()}@example.invalid`;

  await page.goto("/register");
  await page.getByPlaceholder("Enter your first name").fill("Nina");
  await page.getByPlaceholder("Enter your last name").fill("Customer");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.getByPlaceholder("At least 8 characters").fill(PASSWORD);
  await page.getByPlaceholder("Re-enter password").fill(PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  // Step 1: organisation.
  await page.getByLabel("Company name").fill("Production Steel Co.");
  await page.getByRole("button", { name: "Primary sector" }).click();
  await page.getByRole("option", { name: /Steel & iron/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: person.
  await page.getByPlaceholder("Enter your first name").fill("Nina");
  await page.getByPlaceholder("Enter your last name").fill("Customer");
  await page.getByRole("button", { name: "Job title" }).click();
  await page.getByRole("option", { name: "Compliance Manager" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: goals.
  await page.getByRole("checkbox", { name: "Simplify CBAM reporting" }).click();
  await page.getByRole("checkbox", { name: "Excel or spreadsheets" }).click();
  await page
    .getByRole("checkbox", { name: "Collecting emissions data" })
    .click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4: sizes and contact.
  await page
    .getByRole("radiogroup", { name: /Approximately how many suppliers/ })
    .getByRole("radio", { name: "1–10", exact: true })
    .click();
  await page
    .getByRole("radiogroup", { name: "How many customers do you have?" })
    .getByRole("radio", { name: "1–10", exact: true })
    .click();
  await page.getByRole("radio", { name: "Google Search" }).click();
  await page.getByRole("textbox", { name: "Telephone number" }).fill("38123456");
  await page.getByPlaceholder("@your-line-id").fill("@production");
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page).toHaveURL(/\/onboarding\/done/);

  // Workspace setup with the factory fields.
  await page.goto("/onboarding/setup");
  await page.getByLabel("Boilers", { exact: true }).fill("3");
  await page.getByLabel("Furnaces", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByText("Free trial")).toBeVisible();

  // Not approved yet: the account waits on /pending.
  await page.goto("/pending");
  await expect(page).toHaveURL(/\/pending$/);

  // The administrator approves from /admin in a second browser.
  const adminContext = await newSession(browser);
  const adminPage = await adminContext.newPage();
  const admin = await registerReady(adminContext, "admin");
  await sql("UPDATE public.users SET is_admin=true WHERE id=$1", [admin.id]);
  await adminPage.goto("/admin");
  await adminPage.getByLabel("Search users").fill(email);
  await adminPage.getByRole("button", { name: `Mark ${email} ready` }).click();
  await expect(
    adminPage.getByRole("button", { name: `Mark ${email} not ready` }),
  ).toBeVisible();
  await adminContext.close();

  // The waiting page polls /me every 30 s and moves on once approved.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 35_000 });
  await expect(page.getByText("30d left")).toBeVisible();
  await customer.close();
});

/* ── 2. Password reset ─────────────────────────────────────── */

test("2. reset a forgotten password from the mail code and sign in with the new one", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await newSession(browser);
  const page = await context.newPage();
  const account = await registerReady(context, "reset");
  await context.clearCookies();

  await page.goto("/forgot-password");
  await page.getByPlaceholder("you@company.com").fill(account.email);
  await page.getByRole("button", { name: "Send reset code" }).click();
  const mail = await waitForMail(account.email, /verification code is \d{6}/);
  const code = /verification code is (\d{6})/.exec(mail)![1]!;

  await page.goto("/reset-password");
  await page.getByPlaceholder("you@company.com").fill(account.email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByPlaceholder("At least 8 characters").fill(NEW_PASSWORD);
  await page.getByPlaceholder("Re-enter password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Set new password" }).click();
  // The reset page stays on the same URL and shows a confirmation with a Sign in button.
  await expect(page.getByText("Password updated.")).toBeVisible({ timeout: 15_000 });

  // The old password is refused on the sign-in form.
  await signInUi(page, account.email, PASSWORD);
  await expect(page.locator("body")).toContainText(
    /Email or password is incorrect/i,
  );

  // The new password works, and the owner is told the password changed.
  await signInUi(page, account.email, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await waitForMail(account.email, /password was changed/);
  await context.close();
});

/* ── 3. Cookie consent ─────────────────────────────────────── */

test("3. the cookie banner hides after a refusal, stays hidden after reload, and records one choice", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await browser.newContext();
  const page = await context.newPage();
  let consentPosts = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/consent/cookies")
    )
      consentPosts++;
  });

  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Accept all" })).toBeVisible();
  await page.getByRole("button", { name: "Reject optional" }).click();
  await expect(page.getByRole("button", { name: "Reject optional" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: "Reject optional" })).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(consentPosts).toBe(1);
  await context.close();
});

/* ── 4. Shared workbook sync ───────────────────────────────── */

test("4. an editor's cell reaches the owner, and the sheet tab goes grey, red, then green", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const ownerContext = await newSession(browser);
  const editorContext = await newSession(browser);
  const owner = await registerReady(ownerContext, "owner");
  const editor = await registerReady(editorContext, "editor");
  await addEditor(owner.id, editor.id);
  await seedInstallations(ownerContext, [installation(INST)]);

  const ownerPage = await ownerContext.newPage();
  const editorPage = await editorContext.newPage();
  const url = `/workspace?installation=${INST}`;
  await ownerPage.goto(url);
  await startBlankWorkspace(ownerPage);
  await editorPage.goto(url);
  await startBlankWorkspace(editorPage);
  await tab(ownerPage, /Process steps/).click();
  await tab(editorPage, /Process steps/).click();

  const ownerTab = tab(ownerPage, /Process steps/);
  await expect(ownerTab.getByRole("img", { name: "Not started" })).toBeVisible();

  // The editor types the step name; the owner sees it without a reload.
  await typeCell(editorPage, 0, 0, "Drawing");
  await expect(
    ownerPage.getByRole("row").nth(0).getByRole("gridcell").nth(0),
  ).toContainText("Drawing", { timeout: 12_000 });
  await expect(ownerTab.getByRole("img", { name: "Missing data" })).toBeVisible({
    timeout: 12_000,
  });

  // Hovering the red tab names the gap: the row is missing "What happens".
  await ownerTab.hover();
  await expect(ownerTab).toHaveAttribute(
    "title",
    /Missing data.*row 1: .*What happens/,
  );

  await typeCell(editorPage, 0, 1, "Wire drawing");
  await expect(ownerTab.getByRole("img", { name: "Complete" })).toBeVisible({
    timeout: 12_000,
  });
  await ownerContext.close();
  await editorContext.close();
});

/* ── 5. Installation tab persists ──────────────────────────── */

test("5. edits on the Installation tab are saved to the installation record", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await newSession(browser);
  const page = await context.newPage();
  await registerReady(context, "installation");
  await seedInstallations(context, [installation(INST)]);

  await page.goto(`/workspace?installation=${INST}`);
  await startBlankWorkspace(page);
  await tab(page, /Installation/).click();
  await page.getByLabel("City", { exact: true }).fill("Chonburi");
  await page.getByLabel("Post code", { exact: true }).fill("20000");
  await page.getByRole("button", { name: /Save/ }).first().click();

  await expect
    .poll(
      async () => {
        const res = await context.request.get(`${API}/api/v1/account/records`, {
          headers: { Origin: ORIGIN },
        });
        const body = (await res.json()) as {
          records: { key: string; value: { id: string; city?: string }[] }[];
        };
        const rec = body.records.find((r) => r.key === INSTALLATIONS_KEY);
        return rec?.value.find((i) => i.id === INST)?.city;
      },
      { timeout: 15_000 },
    )
    .toBe("Chonburi");

  await page.reload();
  await tab(page, /Installation/).click();
  await expect(page.getByLabel("City", { exact: true })).toHaveValue("Chonburi");
  await context.close();
});

/* ── 6. Flow diagram ───────────────────────────────────────── */

test("6. steps and materials added in the flow view show for an editor, and Materials is amber", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const ownerContext = await newSession(browser);
  const editorContext = await newSession(browser);
  const owner = await registerReady(ownerContext, "flow-owner");
  const editor = await registerReady(editorContext, "flow-editor");
  await addEditor(owner.id, editor.id);
  await seedInstallations(ownerContext, [installation(INST)]);

  const ownerPage = await ownerContext.newPage();
  await ownerPage.goto(`/workspace?installation=${INST}&view=flow`);
  await startBlankWorkspace(ownerPage);
  await ownerPage.getByRole("button", { name: "Add step" }).click();
  await ownerPage.getByLabel("Name", { exact: true }).fill("Annealing");
  await ownerPage.getByLabel("What happens here").fill("Heat treatment");
  await ownerPage.getByRole("button", { name: "Save", exact: true }).click();

  await ownerPage.getByRole("button", { name: "Add material" }).click();
  await ownerPage.getByLabel("Step", { exact: true }).selectOption("Annealing");
  await ownerPage.getByLabel("Item", { exact: true }).fill("Zinc");
  await ownerPage.getByLabel("Quantity", { exact: true }).fill("12");
  await ownerPage.getByLabel("Unit", { exact: true }).fill("t");
  await ownerPage.getByRole("button", { name: "Save", exact: true }).click();

  const editorPage = await editorContext.newPage();
  await editorPage.goto(`/workspace?installation=${INST}`);
  await startBlankWorkspace(editorPage);
  await tab(editorPage, /Process steps/).click();
  await expect(editorPage.getByRole("grid")).toContainText("Annealing", {
    timeout: 12_000,
  });
  const materials = tab(editorPage, /Raw materials/);
  await materials.click();
  await expect(editorPage.getByRole("grid")).toContainText("Zinc", {
    timeout: 12_000,
  });
  await expect(materials).toHaveCSS("background-color", "rgb(180, 83, 9)");
  await ownerContext.close();
  await editorContext.close();
});

test.fixme(
  "6b. with the backend stopped the flow edit is queued and replayed on restart",
  async () => {
    /* Needs the test to stop and restart the backend process, which this
       in-process suite cannot do: the spec runs against a server started by
       the developer. Left as a fixme so the gap is visible in reports. */
  },
);

/* ── 7. Import from file ───────────────────────────────────── */

test("7. importing the materials CSV proposes columns and adds three rows marked for review", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await newSession(browser);
  const page = await context.newPage();
  await registerReady(context, "import");
  await seedInstallations(context, [installation(INST)]);

  await page.goto(`/workspace?installation=${INST}`);
  await startBlankWorkspace(page);
  await tab(page, /Raw materials/).click();
  await page.getByRole("button", { name: "Import from file" }).click();
  await page.locator('input[type="file"]').setInputFiles(FIXTURE);
  await expect(page.getByText(/rows read from materials\.csv/)).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Choose the row with the column names.")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByText("Match each column in the file to a column in the sheet."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/3 rows will be added/)).toBeVisible();
  await expect(page.getByText("Imported rows are marked Needs review")).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByText(/Imported 3 rows into Raw materials/)).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    tab(page, /Raw materials/).getByRole("img", { name: "Needs review" }),
  ).toBeVisible();
  await context.close();
});

/* ── 8. Live check ─────────────────────────────────────────── */

test("8. the live check warns on an unbalanced step and grows the precursor estimate with a CN", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await newSession(browser);
  const page = await context.newPage();
  await registerReady(context, "live");
  await seedInstallations(context, [installation(INST)]);

  await page.goto(`/workspace?installation=${INST}`);
  await startBlankWorkspace(page);
  await tab(page, /Raw materials/).click();
  await typeCell(page, 0, 0, "Annealing");
  await typeCell(page, 0, 1, "Steel coil");
  await typeCell(page, 0, 3, "100");
  await typeCell(page, 0, 4, "t");

  await tab(page, /Output/).click();
  await typeCell(page, 0, 0, "Annealing");
  await typeCell(page, 0, 1, "Annealed coil");
  await typeCell(page, 0, 2, "80");
  await typeCell(page, 0, 3, "t");

  const live = page.getByRole("complementary", { name: "Live check" });
  await expect(live.getByText(/differ by 20 %/)).toBeVisible({ timeout: 12_000 });

  const precursors = live
    .locator("dt", { hasText: "Precursors" })
    .locator("xpath=following-sibling::dd[1]");
  const before = Number(((await precursors.textContent()) ?? "0").replace(/[^\d.]/g, ""));

  await tab(page, /Raw materials/).click();
  await typeCell(page, 0, 2, "79.03");
  await expect
    .poll(
      async () =>
        Number(((await precursors.textContent()) ?? "0").replace(/[^\d.]/g, "")),
      { timeout: 12_000 },
    )
    .toBeGreaterThan(before);
  await context.close();
});

/* ── 9. Smart links ────────────────────────────────────────── */

test("9. Request data sends a team invitation for an insider and opens the supplier form for an outsider", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await newSession(browser);
  const page = await context.newPage();
  await registerReady(context, "links");

  await page.goto("/smart-links");
  await page.getByRole("button", { name: "Request data" }).click();
  await page.getByRole("button", { name: /^Yes/ }).click();
  const colleague = `colleague-${crypto.randomUUID()}@example.invalid`;
  await page.getByLabel("Email", { exact: true }).fill(colleague);
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByText(/Invitation (sent|saved)/)).toBeVisible({
    timeout: 15_000,
  });

  await page.goto("/smart-links");
  await page.getByRole("button", { name: "Request data" }).click();
  await page.getByRole("button", { name: /^No\b/ }).click();
  await expect(page).toHaveURL(/\/suppliers\?add=1/);
  await context.close();
});

/* ── 10. Convert on an OEM installation ────────────────────── */

test("10. an OEM installation offers Fill in for precursors, and Convert stays locked until complete", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await newSession(browser);
  const page = await context.newPage();
  await registerReady(context, "convert");
  await seedInstallations(context, [installation(OEM)]);

  await page.goto(`/convert?installation=${OEM}`);
  await page.locator('a[href^="/convert/"]').first().click();
  await expect(page).toHaveURL(/\/convert\/.+installation=TH-E2E-OEM/);

  const fillIn = page.getByRole("link", { name: "Fill in" }).first();
  await expect(fillIn).toBeVisible();
  await fillIn.click();
  await expect(page).toHaveURL(/\/workspace\?.*installation=TH-E2E-OEM/);
  await expect(page.getByRole("grid", { name: /Raw materials/ })).toBeVisible();

  await page.goBack();
  const convert = page.getByRole("button", { name: "Convert to report" });
  await expect(convert).toBeDisabled();
  await expect(convert).toHaveAttribute("aria-describedby", "convert-incomplete");
  await expect(page.locator("#convert-incomplete")).toContainText(/Complete first/);
  await context.close();
});

/* ── 11. Factory profile, map, what-if and opportunity ─────── */

test("11. a factory profile fills the dashboard, and a what-if saves an opportunity that survives reload", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await newSession(browser);
  const page = await context.newPage();
  await registerReady(context, "factory");
  await seedInstallations(context, [installation(INST)]);

  await page.goto(`/workspace?installation=${INST}&view=factory`);
  await startBlankWorkspace(page);
  await page.getByRole("button", { name: "Add process" }).click();
  await page.getByLabel("Name").first().fill("Annealing furnace");
  await page.getByRole("button", { name: "Add source" }).click();
  await page.getByLabel("Name").nth(1).fill("Gas burner");
  await page.getByRole("button", { name: "Add meter or data source" }).click();
  await page.getByLabel("Name").nth(2).fill("Gas meter");

  await page.goto("/dashboard");
  await expect(page.getByText("E2E Plant").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("region", { name: "Factory map" })).toBeVisible();

  await page.goto(`/dashboard?installation=${INST}`);
  await page.getByRole("button", { name: "Save as opportunity" }).click();
  await page.goto("/opportunities");
  await expect(page.getByText(/What-if/).first()).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByText(/What-if/).first()).toBeVisible();
  await context.close();
});

/* ── 12. Trial ended ───────────────────────────────────────── */

test("12. after the trial, writes return TRIAL_ENDED, the upgrade screen shows, and reads still work", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await newSession(browser);
  const page = await context.newPage();
  const account = await registerReady(context, "trial");
  await seedInstallations(context, [installation(INST)]);
  await sql(
    "UPDATE public.users SET trial_started_at = now() - interval '31 days' WHERE id=$1",
    [account.id],
  );
  const year = new Date().getFullYear();

  const write = await context.request.patch(
    `${API}/api/v1/workbooks/${INST}/${year}/cells`,
    {
      data: { cells: { "steps:0:what": "Blocked" } },
      headers: { Origin: ORIGIN },
    },
  );
  expect(write.status()).toBe(403);
  expect(
    ((await write.json()) as { detail: { code: string } }).detail.code,
  ).toBe("TRIAL_ENDED");

  const read: APIResponse = await context.request.get(
    `${API}/api/v1/workbooks/${INST}/${year}`,
    { headers: { Origin: ORIGIN } },
  );
  expect(read.ok()).toBeTruthy();

  await page.goto(`/workspace?installation=${INST}`);
  await startBlankWorkspace(page);
  await tab(page, /Process steps/).click();
  await typeCell(page, 0, 0, "Blocked");
  await expect(page.getByText(/trial has ended/i).first()).toBeVisible({
    timeout: 15_000,
  });
  await context.close();
});

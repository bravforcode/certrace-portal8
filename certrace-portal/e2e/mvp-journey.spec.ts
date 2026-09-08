import { test, expect, type Page } from "@playwright/test";

/* ════════════════════════════════════════════════════════════
   THE MVP JOURNEY — a supplier answers a month, the exporter reads it

   The other specs each prove one screen renders. This one proves the loop the
   product is sold on: a workspace exists, the month goes out as a link, the
   supplier fills it in without an account, and the figures come back as an
   annual production total and a specific-emissions number the exporter sees.

   The estate is seeded through localStorage rather than clicked into being —
   the wizard that creates it is covered elsewhere, and re-driving it here
   would make a failure in the supplier form look like a failure in the wizard.
   ════════════════════════════════════════════════════════════ */

const WS = "ws-e42161a3cfac9dc1";
/* base64url of "ws|<workspace id>|2026-08" — what "Copy link" hands out. */
const TOKEN = "d3N8d3MtZTQyMTYxYTNjZmFjOWRjMXwyMDI2LTA4";

const SEED: Record<string, string> = {
  "certrace:profile": JSON.stringify({
    firstName: "Boat", lastName: "Sriploy", jobTitle: "Head of Export Ops",
    companyName: "Siam Steel Export Co.", sector: "steel", jurisdiction: "TH",
    currency: "THB", unit: "tCO₂e", onboarded: true, phone: "+66 812345678", lineId: "@boat-certrace",
  }),
  "certrace:supplier-companies": JSON.stringify([{
    id: "sup-a3c5e8463b7a9e48", name: "Rayong Billet Works Co.", country: "TH",
    contactName: "Somchai Prasert", contactEmail: "somchai@rayongbillet.co.th", contactPhone: "+66 812345678",
    createdAt: "2026-09-08T02:54:36.071Z",
  }]),
  "certrace:installations": JSON.stringify([{
    id: "TH-RAYONG-01", name: "Rayong Billet Works — Plant 1", nameLocal: "", self: false,
    supplierId: "sup-a3c5e8463b7a9e48", street: "88 Moo 4, Map Ta Phut Industrial Estate",
    economicActivity: "Electric arc furnace steelmaking and billet casting", postcode: "21150", poBox: "",
    city: "Rayong", country: "TH", unlocode: "THMAT", lat: "12.6810", lng: "101.1590",
    contactName: "Somchai Prasert", contactEmail: "somchai@rayongbillet.co.th", contactPhone: "+66 812345678",
    otherGoods: [], createdAt: "2026-09-08T02:54:56.341Z",
  }]),
  "certrace:workspaces": JSON.stringify([{
    id: WS, installationId: "TH-RAYONG-01", installationName: "Rayong Billet Works — Plant 1",
    productId: "billet", productName: "Billets (semi-finished)", cnCode: "7207 11 90",
    productionRoute: "scrap_eaf", year: 2026, periodStart: "2026-01-01", periodEnd: "2026-12-31",
    declarationIds: [], createdAt: "2026-09-08T02:55:59.242Z", selfSupplied: false,
    supplierId: "sup-a3c5e8463b7a9e48", supplierName: "Rayong Billet Works Co.",
    schedule: { dueDay: 15 }, internalSignoff: null, verifierSignoff: null,
  }]),
  "certrace:month-dispatch": JSON.stringify({
    [WS]: { "2026-08": { workspaceId: WS, month: "2026-08", sentAt: "2026-09-08T02:56:58.645Z",
      lastActionAt: "2026-09-08T02:56:58.645Z", resendCount: 0, reminderCount: 0, dueDay: 15 } },
  }),
};

/** The step heading, so a stall is reported as "stuck on X" rather than a timeout. */
async function stepName(page: Page): Promise<string> {
  const body = await page.locator("body").innerText();
  return body.match(/STEP \d OF \d\n([A-Z ]+)/)?.[1] ?? "(unknown)";
}

async function advance(page: Page, label: "Start" | "Continue"): Promise<string> {
  const before = await stepName(page);
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.waitForTimeout(700);
  const after = await stepName(page);
  if (after === before) console.log(`!! ${label} did not leave step "${before}"`);
  return after;
}


async function choose(page: Page, dropdown: string | RegExp, option: RegExp) {
  await page.getByRole("button", { name: dropdown }).first().click();
  await page.getByRole("option", { name: option }).first().click();
  await page.waitForTimeout(300);
}

test("supplier fills a month through the link, and the figures reach the exporter", async ({ page }) => {
  test.setTimeout(180_000);
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

  await page.addInitScript((seed) => {
    for (const [k, v] of Object.entries(seed)) window.localStorage.setItem(k, v as string);
  }, SEED);

  /* ── The supplier's side ─────────────────────────────────── */
  await page.goto(`/w/${TOKEN}`);
  await expect(page.locator("body")).toContainText(/monthly data request/i, { timeout: 20_000 });
  await expect(page.locator("body")).toContainText("August 2026");

  await advance(page, "Start");

  // 2 · Installation — the exporter's record, already filled in.
  await expect(page.locator("input").first()).toHaveValue("Rayong Billet Works — Plant 1");
  await advance(page, "Continue");

  // 3 · Methodology
  await page.getByLabel(/Describe the boundary/).fill(
    "Scrap is charged to the 90 t electric arc furnace, tapped to the ladle furnace and continuously cast into billet. The boundary ends at the cooling bed.",
  );
  await choose(page, "Processes included", /^Melting \(EAF\)/);
  await choose(page, "Processes included", /^Casting/);
  await choose(page, "Fuel types", /^Natural gas/);
  await choose(page, "Electricity supply", /Provincial Electricity Authority/);
  await page.getByLabel(/Electricity metering point/).fill("Main incomer MDB-1, meter PEA 3392011");

  // The instruments behind both figures — a verifier tests the meter, not the number.
  await page.getByRole("button", { name: "Add a fuel instrument" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Add an electricity meter" }).click();
  await page.waitForTimeout(300);

  const params = page.getByRole("textbox", { name: /^Parameter/ });
  const kit = page.getByRole("textbox", { name: /^Instrument/ });
  const names = ["Natural gas volume", "Active energy, main incomer", "Active energy, main incomer"];
  for (let i = 0; i < (await params.count()); i++) {
    await params.nth(i).fill(names[i] ?? "Active energy, main incomer");
    await kit.nth(i).fill(i === 0 ? "Elster RVG G250, tag FT-101" : "PEA meter 3392011, MDB-1");
  }

  const freq = page.getByRole("button", { name: "Reading frequency" });
  for (let i = 0; i < (await freq.count()); i++) {
    await freq.nth(i).click();
    await page.getByRole("option").first().click();
    await page.waitForTimeout(250);
  }
  const cal = page.getByRole("button", { name: "Last calibration date" });
  for (let i = 0; i < (await cal.count()); i++) {
    await cal.nth(i).click();
    await page.waitForTimeout(250);
    await page.getByRole("button", { name: /^1[0-5]$/ }).first().click();
    await page.waitForTimeout(250);
  }

  console.log("methodology ->", await advance(page, "Continue"));

  // 4 · Monthly data
  await page.getByLabel("Production tonnes").fill("4820.5");
  await page.getByLabel("Quantity").first().fill("182400");
  await choose(page, "Factor source", /EU standard value/);
  await page.getByRole("button", { name: "Add source" }).click();
  await page.waitForTimeout(400);
  await page.getByLabel("Electricity MWh").fill("2140");
  console.log("monthly ->", await advance(page, "Continue"));

  // 5 · Precursors — scrap-EAF: nothing bought in.
  console.log("precursors ->", await advance(page, "Continue"));
  // 6 · Documents
  console.log("documents ->", await advance(page, "Continue"));
  // 7 · Check — the quality report over everything above.
  const check = await page.locator("body").innerText();
  console.log("CHECK REPORT:", check.slice(check.indexOf("Completeness"), check.indexOf("Completeness") + 1600));

  /* The engine's arithmetic, from the figures typed above:
       182 400 m³ × 0.0343488 GJ/m³ × 0.0561 tCO₂/GJ = 351.48 tCO₂
       2 140 MWh × 0.47 tCO₂/MWh                     = 1 005.8 tCO₂
       (351.48 + 1005.8) / 4 820.5 t                 = 0.2816 tCO₂e/t   */
  expect(check).toContain("351.48");
  expect(check).toContain("1,005.8");
  expect(check).toContain("0.2816");

  /* Nothing the supplier cannot answer may block them. The installation
     diagram and the quality-assurance reviewer belong to the exporter's half
     of the methodology and are not on this form — they must not appear here.
     (They did, and the month could never be submitted.) */
  expect(check).not.toContain("No installation diagram attached");
  expect(check).not.toContain("no reviewer named");
  expect(check).toContain("Ready to submit");

  await advance(page, "Continue");

  // 8 · Sign — the internal authorisation, then away it goes.
  await page.getByLabel(/Full name/).fill("Somchai Prasert");
  await page.getByLabel(/Role \/ title/).fill("Production Manager");
  const boxes = page.getByRole("checkbox");
  for (let i = 0; i < (await boxes.count()); i++) await boxes.nth(i).check();

  const submit = page.getByRole("button", { name: /Submit August 2026/i });
  await expect(submit).toBeEnabled();
  await submit.click();
  await page.waitForTimeout(1500);
  await expect(page.locator("body")).toContainText(/Submitted/i, { timeout: 15_000 });

  /* ── The exporter's side ─────────────────────────────
     Same browser, which is the whole of the demo's transport. What matters is
     that the month left the supplier's flow as a figure the exporter reads. */
  await page.goto(`/workspaces/${WS}/monthly`);
  await expect(page.locator("body")).toContainText("Annual production", { timeout: 20_000 });
  const exporterView = await page.locator("body").innerText();
  console.log("EXPORTER MONTHLY:", exporterView.slice(0, 900));
  expect(exporterView).toContain("4,820.5");
  expect(exporterView).toMatch(/1 \/ 12/);
});

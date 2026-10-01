import { expect, type Page } from "@playwright/test";

/* ════════════════════════════════════════════════════════════
   THE SUPPLIER'S AUGUST — one month answered through /w/<token>

   Shared by mvp-journey.spec.ts (the demo's browser-local link) and
   production-journey.spec.ts (a server-issued link on the real domain). The
   form is the same in both; only what carries the answers differs, so the
   steps live here once and a change to the form is fixed in one place.

   The figures are chosen so the engine's arithmetic is checkable by hand:
     182 400 m³ × 0.0343488 GJ/m³ × 0.0561 tCO₂/GJ = 351.48 tCO₂
     2 140 MWh × 0.47 tCO₂/MWh                     = 1 005.8 tCO₂
     (351.48 + 1005.8) / 4 820.5 t                 = 0.2816 tCO₂e/t
   ════════════════════════════════════════════════════════════ */

export const AUGUST_PRODUCTION = "4,820.5";

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

/** From the overview to the check report, asserting the engine's figures on the way. */
export async function fillAugust(page: Page, installationName: string): Promise<void> {
  await expect(page.locator("body")).toContainText(/monthly data request/i, { timeout: 30_000 });
  await expect(page.locator("body")).toContainText("August 2026");

  await advance(page, "Start");

  // 2 · Installation — the exporter's record, already filled in.
  await expect(page.locator("input").first()).toHaveValue(installationName);
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
}

/** 8 · Sign — the internal authorisation, then the submit button is pressed. */
export async function signAndSubmitAugust(page: Page, signer: { name: string; role: string }): Promise<void> {
  await page.getByLabel(/Full name/).fill(signer.name);
  await page.getByLabel(/Role \/ title/).fill(signer.role);
  const boxes = page.getByRole("checkbox");
  for (let i = 0; i < (await boxes.count()); i++) await boxes.nth(i).check();

  const submit = page.getByRole("button", { name: /Submit August 2026/i });
  await expect(submit).toBeEnabled();
  await submit.click();
}

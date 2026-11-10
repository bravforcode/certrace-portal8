import { test, expect } from "@playwright/test";
import {
  AUGUST_PRODUCTION,
  fillAugust,
  signAndSubmitAugust,
} from "./support/supplier-month";

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
    firstName: "Boat",
    lastName: "Sriploy",
    jobTitle: "Head of Export Ops",
    companyName: "Siam Steel Export Co.",
    sector: "steel",
    jurisdiction: "TH",
    currency: "THB",
    unit: "tCO₂e",
    onboarded: true,
    phone: "+66 812345678",
    lineId: "@boat-certrace",
  }),
  "certrace:supplier-companies": JSON.stringify([
    {
      id: "sup-a3c5e8463b7a9e48",
      name: "Rayong Billet Works Co.",
      country: "TH",
      contactName: "Somchai Prasert",
      contactEmail: "somchai@rayongbillet.co.th",
      contactPhone: "+66 812345678",
      createdAt: "2026-09-08T02:54:36.071Z",
    },
  ]),
  "certrace:installations": JSON.stringify([
    {
      id: "TH-RAYONG-01",
      name: "Rayong Billet Works — Plant 1",
      nameLocal: "",
      self: false,
      supplierId: "sup-a3c5e8463b7a9e48",
      street: "88 Moo 4, Map Ta Phut Industrial Estate",
      economicActivity: "Electric arc furnace steelmaking and billet casting",
      postcode: "21150",
      poBox: "",
      city: "Rayong",
      country: "TH",
      unlocode: "THMAT",
      lat: "12.6810",
      lng: "101.1590",
      contactName: "Somchai Prasert",
      contactEmail: "somchai@rayongbillet.co.th",
      contactPhone: "+66 812345678",
      otherGoods: [],
      createdAt: "2026-09-08T02:54:56.341Z",
    },
  ]),
  "certrace:workspaces": JSON.stringify([
    {
      id: WS,
      installationId: "TH-RAYONG-01",
      installationName: "Rayong Billet Works — Plant 1",
      productId: "billet",
      productName: "Billets (semi-finished)",
      cnCode: "7207 11 90",
      productionRoute: "scrap_eaf",
      year: 2026,
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      declarationIds: [],
      createdAt: "2026-09-08T02:55:59.242Z",
      selfSupplied: false,
      supplierId: "sup-a3c5e8463b7a9e48",
      supplierName: "Rayong Billet Works Co.",
      schedule: { dueDay: 15 },
      internalSignoff: null,
      verifierSignoff: null,
    },
  ]),
  "certrace:month-dispatch": JSON.stringify({
    [WS]: {
      "2026-08": {
        workspaceId: WS,
        month: "2026-08",
        sentAt: "2026-09-08T02:56:58.645Z",
        lastActionAt: "2026-09-08T02:56:58.645Z",
        resendCount: 0,
        reminderCount: 0,
        dueDay: 15,
      },
    },
  }),
};

test("supplier fills a month through the link, and the figures reach the exporter", async ({
  page,
}, testInfo) => {
  /* The exporter's half of this reads the same browser's stores with no
     session, which only the demo build allows. Production sends that page to
     /login — correctly. production-journey.spec.ts is this loop for real. */
  test.skip(
    testInfo.project.name === "production",
    "demo-only transport; see production-journey.spec.ts",
  );
  test.setTimeout(180_000);
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

  await page.addInitScript((seed) => {
    for (const [k, v] of Object.entries(seed))
      window.localStorage.setItem(k, v as string);
  }, SEED);

  /* ── The supplier's side ─────────────────────────────────── */
  await page.goto(`/w/${TOKEN}`);
  await fillAugust(page, "Rayong Billet Works — Plant 1");
  await signAndSubmitAugust(page, {
    name: "Somchai Prasert",
    role: "Production Manager",
  });
  await page.waitForTimeout(1500);
  await expect(page.locator("body")).toContainText(/Submitted/i, {
    timeout: 15_000,
  });

  /* ── The exporter's side ─────────────────────────────
     Same browser, which is the whole of the demo's transport. What matters is
     that the month left the supplier's flow as a figure the exporter reads. */
  await page.goto(`/workspaces/${WS}/monthly`);
  await expect(page.locator("body")).toContainText("Annual production", {
    timeout: 20_000,
  });
  const exporterView = await page.locator("body").innerText();
  console.log("EXPORTER MONTHLY:", exporterView.slice(0, 900));
  expect(exporterView).toContain(AUGUST_PRODUCTION);
  expect(exporterView).toMatch(/1 \/ 12/);
});

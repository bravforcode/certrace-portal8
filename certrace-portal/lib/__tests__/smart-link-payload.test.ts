/* ════════════════════════════════════════════════════════════
   buildFromPayload — a server-resolved Smart Link → the guided form

   The other half of the round trip the backend's test_smart_links.py proves:
   given exactly the resolve payload that endpoint emits, the portal must
   rebuild this supplier's questionnaire from bundled config alone — no
   fixtures, no network. This holds that seam down. The payload literal below
   mirrors GET /api/v1/links/{token} field for field.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFromPayload } from "../supplier";
import type { LinkResolution } from "../api";
import { emptyState } from "../supplier-store";

const TOKEN = "nxQwYzQvXLGJSLzsAQxW0GCRz94OTpg8nsUjFdn-6Ss";

function resolution(over: Partial<LinkResolution> = {}): LinkResolution {
  return {
    token: TOKEN,
    declId: "cbam-2026-q2-steel",
    supplierId: "d1",
    month: "2026-04",
    expiresAt: 1793630133719,
    exporter: { companyName: "Siam Steel Export Co." },
    declaration: {
      name: "CBAM Q2 2026",
      regulation: "cbam",
      origin: "TH",
      market: "EU",
      period: "Q2 2026",
      periodEnd: "2026-06-30",
      due: "31 Aug 2026",
      dueInDays: 45,
      kind: "cbam",
      includedFieldIds: ["carbon-price"],
      note: "Report at installation level.",
    },
    supplier: {
      name: "Siam Yamato Steel",
      ref: "#0418",
      country: "TH",
      material: "Hot-rolled coil",
      critical: true,
      selfSupplied: false,
    },
    request: {
      products: [
        { productId: "hrc", lots: [{ qty: 200, unit: "tonnes (t)", from: "2026-04-01", to: "2026-05-31", notes: "" }] },
      ],
    },
    state: emptyState(TOKEN),
    ...over,
  };
}

test("builds this supplier's request straight from the resolve payload", () => {
  const req = buildFromPayload(TOKEN, resolution());
  assert.ok(req, "a well-formed payload must resolve to a request");

  // Identity comes from the payload, not a fixture or the local org.
  assert.equal(req.token, TOKEN);
  assert.equal(req.declId, "cbam-2026-q2-steel");
  assert.equal(req.supplierId, "d1");
  assert.equal(req.supplierName, "Siam Yamato Steel");
  assert.equal(req.supplierRef, "#0418");
  assert.equal(req.exporterName, "Siam Steel Export Co.");
  assert.equal(req.critical, true);
  assert.equal(req.selfSupplied, false);

  // Declaration context flows through.
  assert.equal(req.period, "Q2 2026");
  assert.equal(req.periodEnd, "2026-06-30");
  assert.equal(req.deadline, "31 Aug 2026");
  assert.equal(req.dueInDays, 45);
  assert.equal(req.noteToSuppliers, "Report at installation level.");
  assert.equal(req.regulationShort.length > 0, true);

  // The product+lots map to a real catalogue good, and the CBAM checklist +
  // document asks are derived locally (proving no fixtures were needed).
  assert.equal(req.products.length, 1);
  assert.equal(req.products[0].product.id, "hrc");
  assert.equal(req.products[0].totalTonnes, 200);
  assert.ok(req.fields.length > 0, "the CBAM checklist must resolve from config");
  assert.ok(req.documents.length > 0, "the requested documents must resolve from config");

  // A month in the token is the monthly cadence signal.
  assert.equal(req.cadence, "monthly");
  assert.equal(req.month, "2026-04");
});

test("a payload with no declaration slice is treated as an unopenable link", () => {
  assert.equal(buildFromPayload(TOKEN, resolution({ declaration: undefined as never })), null);
});

test("an empty product spec falls back to material-based synthesis", () => {
  // A supplier the exporter mapped but never gave a product spec still gets a
  // form, built from their material — never a blank page.
  const req = buildFromPayload(TOKEN, resolution({ request: { products: [] } }));
  assert.ok(req);
  assert.equal(req.products.length, 1, "synthesised one product from the material");
  assert.ok(req.fields.length > 0);
});

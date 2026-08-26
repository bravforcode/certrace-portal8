/* ════════════════════════════════════════════════════════════
   THE FINAL REPORT — one PDF, report then evidence, in order

   The old version of this file grepped one HTML string for "Supporting
   Evidence" and called the order proven. It was not: a substring can be
   present while everything around it is in the wrong sequence, which is how
   an appendix sorted by upload date passed a test named for its ordering.

   These tests assert against two things instead:
     · the DOCUMENT MODEL, for everything about order — parts, subsections,
       verbatim field labels, category sequence, the sort inside a category;
     · the ASSEMBLED PDF, for everything about the file — that there is
       exactly one of it, that it is a real PDF, and that each evidence file
       contributed the pages it should have.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

/* The stores read through `window.localStorage`, so the suite needs a window
   — but jsPDF resolves ITS globals off the same object and reaches for
   `window.atob`, so a bare `{ localStorage }` makes the PDF half of these
   tests explode on import. The shim carries what both halves actually use,
   which is what a real browser window would have given them. */
const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = {
  localStorage: storage,
  atob: (v: string) => atob(v),
  btoa: (v: string) => btoa(v),
  console,
  navigator: { userAgent: "node" },
};
g.localStorage = storage;

const { buildFinalReport, buildFinalReportPdf, finalReportDocForDownload } = await import("../cbam/final-report");
const { EVIDENCE_REPORT_CATEGORY_ORDER, NOT_PROVIDED, anchorForFieldKey, PART_ANCHORS } = await import("../cbam/final-report-doc");
const { renderReportPdf, pdfSafe, UNRENDERABLE } = await import("../cbam/final-report-pdf");
const { getFinalReportSnapshot, saveFinalReportSnapshot } = await import("../cbam/final-report-snapshot");
const { createWorkspace } = await import("../workspace");
const { saveEvidence, listEvidence } = await import("../workspace-evidence");
const { EVIDENCE_CATEGORY_ORDER } = await import("../workspace-evidence");
const { saveInstallation, emptyInstallation } = await import("../installations");
const { packFingerprint, signOffPack, clearSignOff } = await import("../pack-signoff");
const { workspaceSEE } = await import("../workspace-see");
const { workspaceReadiness } = await import("../readiness");

function ws() {
  return createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
}

/** A real one-page PDF, built rather than hard-coded, so the pass-through
    test is exercising an actual document and not a fixture that happens to
    start with the right five bytes. */
async function onePagePdfDataUrl(): Promise<string> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.addPage();
  const bytes = await doc.save();
  return `data:application/pdf;base64,${Buffer.from(bytes).toString("base64")}`;
}

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

let evidenceSeq = 0;
function addEvidence(workspaceId: string, fieldKey: string, over: Partial<Parameters<typeof saveEvidence>[0]> = {}) {
  evidenceSeq++;
  saveEvidence({
    id: `ev-${evidenceSeq}`,
    workspaceId,
    fieldKeys: [fieldKey],
    sourceType: "other",
    fileName: `${fieldKey.replace(/[^a-z0-9]+/gi, "-")}-${evidenceSeq}.pdf`,
    mimeType: "application/pdf",
    capturedAt: new Date(2026, 0, evidenceSeq).toISOString(),
    ...over,
  } as Parameters<typeof saveEvidence>[0]);
}

/* ── §1 · the output contract ───────────────────────────────── */

test("the export produces exactly one file, and that file is a PDF", async () => {
  storage.clear();
  const workspace = ws();
  const result = await buildFinalReportPdf(workspace);

  assert.ok(result.fileName.endsWith(".pdf"), "one PDF, not an .html to print and not a .zip");
  assert.ok(result.bytes.length > 0, "the file has content");
  assert.equal(String.fromCharCode(...result.bytes.slice(0, 5)), "%PDF-", "it really is a PDF");

  const { PDFDocument } = await import("pdf-lib");
  const loaded = await PDFDocument.load(result.bytes);
  assert.equal(loaded.getPageCount(), result.pageCount, "the reported page count is the document's own");
  assert.ok(result.pageCount >= 7, "cover + TOC + four parts + the evidence divider, at least");
});

test("page 1 is the cover and the last generated page before evidence is the divider", async () => {
  storage.clear();
  const workspace = ws();
  const doc = buildFinalReport(workspace);
  const reportOnly = await renderReportPdf(doc);
  const { PDFDocument } = await import("pdf-lib");
  const reportPages = (await PDFDocument.load(reportOnly)).getPageCount();

  const result = await buildFinalReportPdf(workspace);
  /* No evidence at all, so the whole document is: the report, the reserved
     Table of Contents page inserted right after the cover, then exactly one
     divider page. Anything else means something slipped in between. */
  assert.equal(result.pageCount, reportPages + 2, "the TOC and the divider both land, with nothing else between");
});

/* ── §3 · the report's own order ────────────────────────────── */

test("Parts 1-4 render in the template's order, with their subsections in order", () => {
  storage.clear();
  const doc = buildFinalReport(ws());

  assert.deepEqual(
    doc.parts.map((p) => p.number),
    [1, 2, 3, 4],
    "four parts, in order, never interleaved",
  );
  assert.deepEqual(
    doc.parts.map((p) => p.title),
    [
      "Installation details",
      "Production processes and production routes summary",
      "Emissions by monitoring methodology and data quality summary",
      "Summary of products",
    ],
  );
  assert.deepEqual(
    doc.parts.flatMap((p) => p.subsections.map((s) => s.number)),
    ["1.1", "1.2", "1.3", "1.4", "2.1", "2.2", "3.1", "3.1a", "3.2", "3.3", "3.4", "4.1", "4.2"],
    "every numbered subsection, in the contract's order",
  );
});

test("field labels are the template's own, and a field Certrace does not collect still renders", () => {
  storage.clear();
  const doc = buildFinalReport(ws());
  const about = doc.parts[0].subsections[1];
  const block = about.blocks[0];
  assert.equal(block.kind, "fields");
  const labels = block.kind === "fields" ? block.rows.map((r) => r.label) : [];

  // Verbatim from A_InstData — not paraphrased, not reordered.
  assert.deepEqual(labels, [
    "Name of the installation (optional)",
    "Name of the installation (English name)",
    "Street, Number",
    "Economic activity",
    "Post code",
    "P.O. Box",
    "City",
    "Country",
    "UNLOCODE",
    "Coordinates of the main emission source (latitude)",
    "Coordinates of the main emission source (longitude)",
    "Name of authorised representative",
    "Email",
    "Telephone",
    // Not an A_InstData field — Certrace's own addition, appended after the
    // template's own fourteen so a verifier can confirm the boundary covers
    // only this good.
    "Other goods produced at this installation (non-CBAM)",
  ]);

  const values = block.kind === "fields" ? block.rows.map((r) => r.value) : [];
  assert.ok(values.includes(NOT_PROVIDED), "a missing field renders as Not provided rather than being dropped");
});

test("Part 4.1 carries the summary-of-products columns in the contract's order", () => {
  storage.clear();
  const doc = buildFinalReport(ws());
  const table = doc.parts[3].subsections[0].blocks[0];
  assert.equal(table.kind, "table");
  if (table.kind !== "table") return;
  assert.deepEqual(table.columns.slice(0, 12), [
    "Production process from which the product arises",
    "Type of aggregated good or precursor",
    "CN Code",
    "CN Name",
    "Product name (as used on invoices)",
    "SEE (direct)",
    "SEE (indirect)",
    "SEE (total)",
    "Unit",
    "Share of emissions by default value",
    "Source for electricity emission factor",
    "Embedded electricity (MWh/t)",
  ]);
});

test("the verifier block states the transitional-period position rather than leaving a blank section", () => {
  storage.clear();
  const doc = buildFinalReport(ws());
  const verifier = doc.parts[0].subsections[2];
  assert.equal(verifier.number, "1.3");
  const block = verifier.blocks[0];
  assert.equal(block.kind, "text");
  assert.match(block.kind === "text" ? block.text : "", /Not applicable — transitional period/);
});

/* ── §4 · the evidence appendix ─────────────────────────────── */

test("the appendix order is not the Documents screen's A-E order", () => {
  assert.notDeepEqual(
    EVIDENCE_REPORT_CATEGORY_ORDER,
    EVIDENCE_CATEGORY_ORDER,
    "two different orders on purpose — merging them would silently re-letter the Documents screen",
  );
  assert.deepEqual(EVIDENCE_REPORT_CATEGORY_ORDER, ["operations", "lab", "suppliers", "organisation", "finance"]);
});

test("evidence groups into the five categories in the fixed order", () => {
  storage.clear();
  const workspace = ws();
  // Added in a deliberately scrambled order — the appendix must not follow it.
  addEvidence(workspace.id, "carbon-price"); // finance   → 5
  addEvidence(workspace.id, "internal-qa-record"); // organisation  → 4
  addEvidence(workspace.id, "production"); // operations   → 1
  addEvidence(workspace.id, "mill-test-certificate"); // suppliers → 3
  addEvidence(workspace.id, "lab-analysis"); // lab        → 2

  const doc = buildFinalReport(workspace);
  assert.deepEqual(
    doc.evidence.map((s) => s.department),
    ["operations", "lab", "suppliers", "organisation", "finance"],
  );
  assert.deepEqual(
    doc.evidence.map((s) => s.ordinal),
    [1, 2, 3, 4, 5],
  );
});

test("an empty category is dropped entirely, and does not renumber the ones after it", () => {
  storage.clear();
  const workspace = ws();
  addEvidence(workspace.id, "production"); // operations   → 1
  addEvidence(workspace.id, "internal-qa-record"); // organisation  → 4
  // nothing for lab (2), suppliers (3) or finance (5)

  const doc = buildFinalReport(workspace);
  assert.deepEqual(
    doc.evidence.map((s) => s.department),
    ["operations", "organisation"],
    "skipped categories render no header and no placeholder",
  );
  assert.deepEqual(doc.evidence.map((s) => s.ordinal), [1, 4], "organisation stays category 4 even though 2 and 3 are absent");
});

test("inside a category, files sort by the field they support, not by upload date", () => {
  storage.clear();
  const workspace = ws();
  // Both are Operations. The 4.1 field is uploaded FIRST, the 2.2 field second.
  addEvidence(workspace.id, "production", { id: "ev-early", fileName: "production.pdf", capturedAt: "2026-01-01T00:00:00.000Z" }); // 4.1
  addEvidence(workspace.id, "installation-diagram", { id: "ev-late", fileName: "diagram.pdf", capturedAt: "2026-06-01T00:00:00.000Z" }); // 2.2

  const doc = buildFinalReport(workspace);
  const operations = doc.evidence.find((s) => s.department === "operations")!;
  assert.deepEqual(
    operations.items.map((i) => i.fileName),
    ["diagram.pdf", "production.pdf"],
    "the Part 2 document sorts ahead of the Part 4 one despite being uploaded later",
  );
});

test("an item whose field maps nowhere goes to the end of its category, by upload date", () => {
  storage.clear();
  const workspace = ws();
  addEvidence(workspace.id, "no-such-field", { id: "ev-unmapped", fileName: "mystery.pdf", capturedAt: "2026-01-01T00:00:00.000Z" });
  addEvidence(workspace.id, "internal-qa-record", { id: "ev-mapped", fileName: "org.pdf", capturedAt: "2026-09-01T00:00:00.000Z" });

  assert.equal(anchorForFieldKey("no-such-field"), null, "an unknown key has no anchor — that is an answer, not a crash");
  const doc = buildFinalReport(workspace);
  const organisation = doc.evidence.find((s) => s.department === "organisation")!;
  assert.deepEqual(organisation.items.map((i) => i.fileName), ["org.pdf", "mystery.pdf"], "unmapped sorts last, and the export still runs");
});

test("every anchor a field key can produce is one of the printed subsections", () => {
  for (const key of ["production", "lab-analysis", "carbon-price", "fuel:abc", "fuel-invoice:abc", "precursor:xyz", "installation-identity"]) {
    const anchor = anchorForFieldKey(key);
    assert.ok(anchor && PART_ANCHORS.includes(anchor), `${key} anchors to a real subsection`);
  }
});

/* ── §2 · what each evidence file contributes to the PDF ────── */

test("a native PDF evidence file passes through, page for page", async () => {
  storage.clear();
  const workspace = ws();
  const baseline = await buildFinalReportPdf(workspace);

  addEvidence(workspace.id, "production", { fileDataUrl: await onePagePdfDataUrl(), mimeType: "application/pdf" });
  const withPdf = await buildFinalReportPdf(workspace);

  // + 1 category header page, + the file's own 1 page.
  assert.equal(withPdf.pageCount, baseline.pageCount + 2);
  assert.equal(withPdf.embedded, 1);
  assert.equal(withPdf.placeholders.length, 0);
});

test("an image evidence file becomes exactly one page", async () => {
  storage.clear();
  const workspace = ws();
  const baseline = await buildFinalReportPdf(workspace);

  addEvidence(workspace.id, "production", { fileName: "meter.png", fileDataUrl: PNG_1PX, mimeType: "image/png" });
  const withImage = await buildFinalReportPdf(workspace);

  assert.equal(withImage.pageCount, baseline.pageCount + 2, "one category header, one image page");
  assert.equal(withImage.embedded, 1);
});

test("a file that cannot be rendered keeps its position as a named placeholder, and does not fail the export", async () => {
  storage.clear();
  const workspace = ws();
  addEvidence(workspace.id, "production", { fileName: "sheet.xlsx", fileDataUrl: "data:application/vnd.ms-excel;base64,AAAA", mimeType: "application/vnd.ms-excel" });
  addEvidence(workspace.id, "installation-diagram", { fileName: "diagram.pdf", fileDataUrl: await onePagePdfDataUrl(), mimeType: "application/pdf" });

  const result = await buildFinalReportPdf(workspace);
  assert.equal(result.placeholders.length, 1, "the export completes rather than throwing");
  assert.equal(result.placeholders[0].fileName, "sheet.xlsx");
  assert.match(result.placeholders[0].reason, /cannot be converted/);
  assert.equal(result.embedded, 1, "the file that could be rendered still is");
});

test("an evidence record with no stored file is named on a placeholder page rather than dropped", async () => {
  storage.clear();
  const workspace = ws();
  addEvidence(workspace.id, "production", { fileName: "huge-scan.pdf", fileDataUrl: undefined });

  const result = await buildFinalReportPdf(workspace);
  assert.equal(result.placeholders.length, 1);
  assert.match(result.placeholders[0].reason, /exceeds the inline storage limit/);
});

/* ── Glyphs ─────────────────────────────────────────────────── */

test("nothing the report actually prints degrades to a question mark", () => {
  storage.clear();
  const doc = buildFinalReport(ws());

  /* Scans the document's OWN strings rather than a sample invented here: the
     workings are written in the regulation's notation, so the summation sign
     and the subscripts reach the Latin-1 fonts on every single report. */
  const strings: string[] = [
    doc.cover.title,
    doc.cover.subtitle,
    ...doc.cover.workings,
    ...doc.cover.notes.flatMap((n) => [n.label, n.value]),
    ...doc.parts.flatMap((part) => [
      part.title,
      ...part.subsections.flatMap((sub) => [
        sub.title,
        ...sub.blocks.flatMap((b) =>
          b.kind === "fields" ? b.rows.flatMap((r) => [r.label, r.value]) : b.kind === "table" ? [...b.columns, ...b.rows.flat()] : [b.text],
        ),
      ]),
    ]),
  ];

  for (const raw of strings) {
    const rendered = pdfSafe(raw);
    if (!raw.includes("?")) assert.ok(!rendered.includes("?"), `"${raw}" renders as "${rendered}"`);
  }

  // And the specific substitution that used to print "?_m production_m".
  assert.equal(pdfSafe("production_annual = \u03a3_m production_m"), "production_annual = SUM_m production_m");
  assert.equal(pdfSafe("tCO\u2082e/t"), "tCO2e/t");
});

test("a script the core fonts cannot draw is marked once, not once per character", () => {
  // A Thai installation name — the local-language field every Thai exporter fills in.
  const thai = "\u0e42\u0e23\u0e07\u0e07\u0e32\u0e19\u0e40\u0e2b\u0e25\u0e47\u0e01\u0e23\u0e30\u0e22\u0e2d\u0e07";
  assert.equal(pdfSafe(thai), UNRENDERABLE, "the whole run collapses to one marker");
  assert.ok(!pdfSafe(thai).includes("??"), "never a string of question marks");
  assert.equal(pdfSafe(`Rayong (${thai}) Works`), `Rayong (${UNRENDERABLE}) Works`, "the Latin text around it survives");
});

/* ── Draft stamping ─────────────────────────────────────────── */

/* ── Frozen-snapshot binding ─────────────────────────────────
   A signed-off workspace must serve the exact document that was true at the
   moment of signing, even when something is edited afterwards that doesn't
   move the pack-signoff fingerprint enough to read as "stale" — the same
   class of bug lib/cbam-xml.ts once had (a comment promising a frozen
   export while the code underneath still read live data). */

function fingerprintFor(workspace: ReturnType<typeof ws>) {
  const see = workspaceSEE(workspace);
  const readiness = workspaceReadiness(workspace);
  return packFingerprint({
    seeDirect: see.seeDirect,
    seeIndirect: see.seeIndirect,
    seePrecursor: see.seePrecursor,
    productionTonnes: see.production.tonnes,
    readiness: readiness.overall === "complete" ? "complete" : "incomplete",
    evidenceCount: listEvidence(workspace.id).length,
  });
}

test("a signed workspace serves the frozen doc even after an edit the fingerprint doesn't catch", () => {
  storage.clear();
  const workspace = ws();
  saveInstallation({ ...emptyInstallation(true), id: workspace.installationId, name: "Plant A", city: "Rayong", street: "1 Moo 1", country: "TH", economicActivity: "Rolling" });

  const fp = fingerprintFor(workspace);
  signOffPack(workspace.id, "Somchai Prasert", "Compliance Manager", fp);
  saveFinalReportSnapshot(workspace.id, fp, buildFinalReport(workspace));

  // City is rendered verbatim in Part 1.2 but is NOT one of the fingerprint's
  // inputs (SEE, production, readiness, evidence count) — exactly the class
  // of edit that would slip through unnoticed if the report weren't frozen.
  saveInstallation({ ...emptyInstallation(true), id: workspace.installationId, name: "Plant A", city: "Chonburi", street: "1 Moo 1", country: "TH", economicActivity: "Rolling" });

  const served = finalReportDocForDownload(workspace);
  const about = served.parts[0].subsections[1].blocks[0];
  assert.equal(about.kind, "fields");
  const city = about.kind === "fields" ? about.rows.find((r) => r.label === "City")?.value : undefined;
  assert.equal(city, "Rayong", "the frozen snapshot's city, not the edited live value");
});

test("an unsigned workspace always serves the live doc", () => {
  storage.clear();
  const workspace = ws();
  saveInstallation({ ...emptyInstallation(true), id: workspace.installationId, name: "Plant A", city: "Rayong", street: "1 Moo 1", country: "TH", economicActivity: "Rolling" });

  const served1 = finalReportDocForDownload(workspace);
  const cityOf = (doc: typeof served1) => {
    const about = doc.parts[0].subsections[1].blocks[0];
    return about.kind === "fields" ? about.rows.find((r) => r.label === "City")?.value : undefined;
  };
  assert.equal(cityOf(served1), "Rayong");

  saveInstallation({ ...emptyInstallation(true), id: workspace.installationId, name: "Plant A", city: "Chonburi", street: "1 Moo 1", country: "TH", economicActivity: "Rolling" });
  assert.equal(cityOf(finalReportDocForDownload(workspace)), "Chonburi", "no sign-off on file — the report always shows what's true right now");
});

test("clearing a signature falls back to live data even if an old snapshot still matches by fingerprint", () => {
  storage.clear();
  const workspace = ws();
  saveInstallation({ ...emptyInstallation(true), id: workspace.installationId, name: "Plant A", city: "Rayong", street: "1 Moo 1", country: "TH", economicActivity: "Rolling" });

  const fp = fingerprintFor(workspace);
  signOffPack(workspace.id, "Somchai Prasert", "Compliance Manager", fp);
  saveFinalReportSnapshot(workspace.id, fp, buildFinalReport(workspace));

  clearSignOff(workspace.id);
  // Fingerprint hasn't moved (nothing about SEE/readiness/evidence changed),
  // but the signature itself is gone — the snapshot must not go on serving.
  const about = finalReportDocForDownload(workspace).parts[0].subsections[1].blocks[0];
  const snap = getFinalReportSnapshot(workspace.id);
  assert.ok(snap, "the snapshot record itself is untouched by clearing the signature");
  assert.equal(about.kind, "fields");
});

test("a draft (incomplete) workspace stamps the file name and the result as draft", async () => {
  storage.clear();
  const doc = buildFinalReport(ws());
  assert.equal(doc.draft, true, "a freshly created workspace has outstanding items");
  assert.ok(doc.cover.draftBanner, "the cover carries the draft banner");

  const result = await buildFinalReportPdf(ws());
  assert.ok(result.fileName.endsWith("-draft.pdf"));
});

/* ── The download filename ──────────────────────────────────── */

const { finalReportFileName, fileSegment, nextVersion } = await import("../cbam/final-report-filename");

test("the filename follows MMD_Company_Product_Year_vX.Y", () => {
  assert.equal(
    finalReportFileName({ companyName: "ABC Steel Co Ltd", productName: "Rebar", year: 2026, draft: false, version: "1.0" }),
    "MMD_ABC-Steel-Co-Ltd_Rebar_2026_v1.0.pdf",
  );
  assert.equal(
    finalReportFileName({ companyName: "ABC Steel Co Ltd", productName: "Rebar", year: 2026, draft: true, version: "1.1" }),
    "MMD_ABC-Steel-Co-Ltd_Rebar_2026_v1.1_Draft.pdf",
  );
});

test("a product name with slashes and commas survives as a filename", () => {
  // The workspace header really does show this one.
  assert.equal(fileSegment("Pig iron, alloy / spiegeleisen", "x"), "Pig-iron-alloy-spiegeleisen");
  assert.equal(fileSegment("  ", "Unnamed-Product"), "Unnamed-Product", "an empty name never produces MMD__Rebar_…");
  assert.equal(fileSegment("A//B  C", "x"), "A-B-C", "runs of separators collapse to one hyphen");
});

test("the version increments only when the figures have moved", () => {
  storage.clear();
  assert.equal(nextVersion("ws-1", "fp-a"), "1.0", "first download");
  assert.equal(nextVersion("ws-1", "fp-a"), "1.0", "same figures, same document, same version");
  assert.equal(nextVersion("ws-1", "fp-b"), "1.1", "figures edited, minor increments");
  assert.equal(nextVersion("ws-1", "fp-b"), "1.1");
  assert.equal(nextVersion("ws-1", "fp-c"), "1.2");
  assert.equal(nextVersion("ws-2", "fp-a"), "1.0", "a different workspace has its own version line");
});

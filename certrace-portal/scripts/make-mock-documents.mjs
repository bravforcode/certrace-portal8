/* ════════════════════════════════════════════════════════════
   MOCK DOCUMENTS FOR THE SMART INTAKE PROTOTYPE

   node scripts/make-mock-documents.mjs

   Writes fictional sample documents — every company, meter, address and
   number below is invented, and every page carries a SAMPLE watermark — as:

     mock-documents/src/<name>.html     the source, readable in a browser
     public/mock-documents/<name>.pdf   printed by headless Chrome
     public/mock-documents/index.json   the list the "Try sample documents"
                                        button fetches

   Each PDF carries what the mock detector should "read" from it as base64url
   JSON in its Keywords metadata (prefix `certrace-mock:`), which is how
   lib/smart-intake.ts returns realistic values without a model. Edit the
   `payload` beside a document and re-run to change what gets detected.

   Needs Chrome (or Edge — set CHROME=path) for printing; Thai text renders
   with the Windows system fonts (Leelawadee UI / Tahoma).
   ════════════════════════════════════════════════════════════ */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PDFDocument } from "pdf-lib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "mock-documents", "src");
const outDir = join(root, "public", "mock-documents");
mkdirSync(srcDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const CHROME =
  process.env.CHROME ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ].find((p) => existsSync(p));
if (!CHROME) throw new Error("No Chrome/Edge found — set CHROME=/path/to/chrome");

const EXPORTER = {
  th: "บริษัท ตัวอย่างเหล็กไทย จำกัด",
  en: "Sample Thai Steel Co., Ltd.",
  addr: "99/9 หมู่ 9 นิคมอุตสาหกรรมตัวอย่าง ต.ตัวอย่าง อ.เมือง จ.ระยอง 21000",
  addrEn: "99/9 Moo 9, Sample Industrial Estate, Mueang, Rayong 21000, Thailand",
};

const css = `
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Leelawadee UI", Tahoma, "Segoe UI", sans-serif; color: #1b1b1b; font-size: 11pt; margin: 0; position: relative; }
  .wm { position: fixed; top: 38%; left: 0; right: 0; text-align: center; transform: rotate(-24deg); font-size: 54pt; color: rgba(200,0,0,.09); font-weight: 700; letter-spacing: .06em; pointer-events: none; }
  .banner { border: 1px dashed #c00; color: #a00; font-size: 8.5pt; padding: 4px 8px; margin-bottom: 14px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1b1b1b; padding-bottom: 10px; margin-bottom: 14px; }
  .brand { font-size: 15pt; font-weight: 700; }
  .muted { color: #666; font-size: 9pt; }
  h1 { font-size: 16pt; margin: 0 0 4px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #bbb; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f1f1ee; font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin: 10px 0; }
  .big { font-size: 20pt; font-weight: 700; }
  .box { border: 1px solid #1b1b1b; padding: 10px 12px; margin: 10px 0; }
  .sign { margin-top: 36px; display: flex; justify-content: space-between; }
  .sign div { width: 42%; border-top: 1px solid #555; padding-top: 4px; text-align: center; font-size: 9pt; }
  .scan { filter: blur(.55px) contrast(.9); transform: rotate(.8deg); background: #f4f1e8; padding: 8px; }
`;

const page = (title, body, { scan = false } = {}) => `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head>
<body><div class="wm">SAMPLE · ตัวอย่าง</div><div class="${scan ? "scan" : ""}">
<div class="banner">เอกสารตัวอย่างสมมติสำหรับทดสอบระบบ Certrace เท่านั้น — ข้อมูลทั้งหมดไม่มีอยู่จริง · FICTIONAL SAMPLE DOCUMENT FOR PROTOTYPE TESTING ONLY</div>
${body}</div></body></html>`;

const f = (key, value, unit, confidence) => ({ key, value, ...(unit ? { unit } : {}), confidence });

/* ── The documents ─────────────────────────────────────────────── */
const DOCS = [
  {
    name: "01-electricity-bill-2026-03",
    title: "ใบแจ้งค่าไฟฟ้า มีนาคม 2569",
    html: page(
      "Electricity bill March 2026",
      `<header><div><div class="brand">การไฟฟ้าตัวอย่างส่วนภูมิภาค</div><div class="muted">Sample Regional Electricity Authority (fictional)</div></div>
       <div style="text-align:right"><h1>ใบแจ้งค่าไฟฟ้า</h1><div class="muted">Electricity Bill · เลขที่ SEA-6903-0041127</div></div></header>
       <div class="grid">
         <div><b>ผู้ใช้ไฟฟ้า</b><br>${EXPORTER.th}<br><span class="muted">${EXPORTER.addr}</span></div>
         <div><b>หมายเลขผู้ใช้ไฟฟ้า</b> 020-118-7745<br><b>หมายเลขมิเตอร์</b> SMP-7781204<br><b>ประเภท</b> 4.2 กิจการขนาดใหญ่ (TOU)</div>
         <div><b>ประจำเดือน</b> มีนาคม 2569 (March 2026)</div>
         <div><b>รอบการอ่าน</b> 01/03/2569 – 31/03/2569</div>
       </div>
       <table><tr><th>รายการ</th><th class="num">เลขอ่านครั้งก่อน</th><th class="num">เลขอ่านครั้งนี้</th><th class="num">หน่วย (kWh)</th></tr>
         <tr><td>On-Peak</td><td class="num">1,204,880</td><td class="num">1,437,560</td><td class="num">232,680</td></tr>
         <tr><td>Off-Peak</td><td class="num">905,210</td><td class="num">1,085,330</td><td class="num">180,120</td></tr>
         <tr><th>รวมหน่วยที่ใช้ (Total consumption)</th><th></th><th></th><th class="num">412,800</th></tr></table>
       <table><tr><td>ค่าพลังงานไฟฟ้า</td><td class="num">1,511,248.00</td></tr><tr><td>ค่า Ft</td><td class="num">81,734.40</td></tr>
         <tr><td>ค่าบริการ</td><td class="num">312.24</td></tr><tr><td>ภาษีมูลค่าเพิ่ม 7%</td><td class="num">111,510.62</td></tr>
         <tr><th>รวมเงินที่ต้องชำระ (บาท)</th><th class="num">1,704,805.26</th></tr></table>
       <p class="muted">กำหนดชำระภายใน 15 เมษายน 2569</p>`,
    ),
    payload: {
      subject: "electricity_bill",
      subjectConfidence: 0.97,
      month: "2026-03",
      monthConfidence: 0.98,
      issuer: "การไฟฟ้าตัวอย่างส่วนภูมิภาค",
      summary: "Electricity bill for March 2026 — 412,800 kWh on meter SMP-7781204.",
      fields: [
        f("billing-period-start", "2026-03-01", null, 0.96),
        f("billing-period-end", "2026-03-31", null, 0.96),
        f("electricity-consumed", "412800", "kWh", 0.95),
        f("meter-number", "SMP-7781204", null, 0.93),
        f("total-amount", "1704805.26", "THB", 0.94),
        f("supplier-name", "การไฟฟ้าตัวอย่างส่วนภูมิภาค", null, 0.9),
      ],
    },
  },
  {
    name: "02-electricity-bill-2026-04-scan",
    title: "ใบแจ้งค่าไฟฟ้า เมษายน 2569 (สแกน)",
    scan: true,
    html: page(
      "Electricity bill April 2026 (scan)",
      `<header><div><div class="brand">การไฟฟ้าตัวอย่างส่วนภูมิภาค</div><div class="muted">Sample Regional Electricity Authority (fictional)</div></div>
       <div style="text-align:right"><h1>ใบแจ้งค่าไฟฟ้า</h1><div class="muted">เลขที่ SEA-6904-00?1127</div></div></header>
       <div class="grid"><div><b>ผู้ใช้ไฟฟ้า</b><br>${EXPORTER.th}</div><div><b>หมายเลขมิเตอร์</b> SMP-7781204</div>
         <div><b>ประจำเดือน</b> เมษายน 2569</div><div><b>รอบการอ่าน</b> 01/04/2569 – 30/04/2569</div></div>
       <table><tr><th>รายการ</th><th class="num">หน่วย (kWh)</th></tr><tr><td>On-Peak</td><td class="num">221,3?0</td></tr>
         <tr><td>Off-Peak</td><td class="num">177,1?0</td></tr><tr><th>รวมหน่วยที่ใช้</th><th class="num">398,45<span style="opacity:.35">0</span></th></tr></table>
       <p style="font-family:'Segoe Script',cursive;color:#1a3fa0;font-size:14pt;transform:rotate(-4deg)">จ่ายแล้ว 12/5 — ตรวจแล้ว ✓ 398,450?</p>
       <table><tr><th>รวมเงินที่ต้องชำระ (บาท)</th><th class="num">1,64?,210.88</th></tr></table>`,
      { scan: true },
    ),
    payload: {
      subject: "electricity_bill",
      subjectConfidence: 0.91,
      month: "2026-04",
      monthConfidence: 0.88,
      issuer: "การไฟฟ้าตัวอย่างส่วนภูมิภาค",
      summary: "Scanned electricity bill for April 2026. Several digits are smudged; the total kWh is partly obscured and a handwritten note repeats it with a question mark.",
      fields: [
        f("billing-period-start", "2026-04-01", null, 0.86),
        f("billing-period-end", "2026-04-30", null, 0.86),
        f("electricity-consumed", "398450", "kWh", 0.64),
        f("meter-number", "SMP-7781204", null, 0.82),
        f("total-amount", "1640210.88", "THB", 0.41),
      ],
    },
  },
  {
    name: "03-natural-gas-invoice-2026-03",
    title: "ใบแจ้งหนี้ก๊าซธรรมชาติ มีนาคม 2569",
    html: page(
      "Natural gas invoice March 2026",
      `<header><div><div class="brand">บริษัท ก๊าซตัวอย่างพลังงาน จำกัด</div><div class="muted">Sample Gas Energy Co., Ltd. (fictional) · Tax ID 0-0000-00000-00-0</div></div>
       <div style="text-align:right"><h1>ใบแจ้งหนี้ / ใบกำกับภาษี</h1><div class="muted">Invoice No. SGE-26-03-00871 · 02/04/2026</div></div></header>
       <div class="grid"><div><b>ลูกค้า / Customer</b><br>${EXPORTER.en}<br><span class="muted">${EXPORTER.addrEn}</span></div>
         <div><b>จุดส่งก๊าซ / Delivery point</b> RY-DP-014<br><b>มาตรวัด / Meter</b> GFM-22-0391<br><b>Period</b> 01/03/2026 – 31/03/2026</div></div>
       <table><tr><th>Description</th><th class="num">Quantity</th><th>Unit</th><th class="num">Heating value</th><th class="num">Amount (THB)</th></tr>
         <tr><td>ก๊าซธรรมชาติ (Natural gas) — pipeline supply</td><td class="num">185,400</td><td>Sm³</td><td class="num">36.2 MJ/Sm³</td><td class="num">2,317,500.00</td></tr>
         <tr><td>ค่าบริการส่งก๊าซ</td><td></td><td></td><td></td><td class="num">46,350.00</td></tr>
         <tr><td>VAT 7%</td><td></td><td></td><td></td><td class="num">165,469.50</td></tr>
         <tr><th colspan="4">Total</th><th class="num">2,529,319.50</th></tr></table>`,
    ),
    payload: {
      subject: "fuel_invoice",
      subjectConfidence: 0.95,
      month: "2026-03",
      monthConfidence: 0.95,
      fuelType: "natural_gas",
      issuer: "บริษัท ก๊าซตัวอย่างพลังงาน จำกัด",
      summary: "Natural gas invoice for March 2026 — 185,400 Sm³ delivered at RY-DP-014.",
      fields: [
        f("billing-period-start", "2026-03-01", null, 0.94),
        f("billing-period-end", "2026-03-31", null, 0.94),
        f("fuel-quantity", "185400", "m3", 0.93),
        f("ncv", "36.2", "MJ/m3", 0.84),
        f("total-amount", "2529319.50", "THB", 0.95),
        f("supplier-name", "บริษัท ก๊าซตัวอย่างพลังงาน จำกัด", null, 0.92),
      ],
    },
  },
  {
    name: "04-diesel-delivery-note-2026-04",
    title: "ใบส่งสินค้าน้ำมันดีเซล เมษายน 2569",
    html: page(
      "Diesel delivery note April 2026",
      `<header><div><div class="brand">หจก. ขนส่งน้ำมันตัวอย่าง</div><div class="muted">Sample Fuel Logistics LP (fictional)</div></div>
       <div style="text-align:right"><h1>ใบส่งสินค้า</h1><div class="muted">Delivery Note DN-69-04-0213 · 18/04/2569</div></div></header>
       <div class="grid"><div><b>ส่งถึง</b><br>${EXPORTER.th}<br><span class="muted">ถังเก็บน้ำมัน T-02 (โรงรีด)</span></div>
         <div><b>ทะเบียนรถ</b> 70-0000 ระยอง<br><b>พนักงานขับรถ</b> นายสมมติ ตัวอย่าง</div></div>
       <table><tr><th>สินค้า</th><th class="num">จำนวน</th><th>หน่วย</th></tr>
         <tr><td>น้ำมันดีเซล B7 (Diesel)</td><td class="num">12,000</td><td>ลิตร</td></tr></table>
       <div class="sign"><div>ผู้ส่งสินค้า</div><div>ผู้รับสินค้า</div></div>`,
    ),
    payload: {
      subject: "fuel_invoice",
      subjectConfidence: 0.9,
      month: "2026-04",
      monthConfidence: 0.92,
      fuelType: "diesel",
      issuer: "หจก. ขนส่งน้ำมันตัวอย่าง",
      summary: "Delivery note for 12,000 litres of diesel B7 on 18 April 2026. No price on the note.",
      fields: [f("delivery-date", "2026-04-18", null, 0.9), f("fuel-quantity", "12000", "l", 0.89), f("supplier-name", "หจก. ขนส่งน้ำมันตัวอย่าง", null, 0.86)],
    },
  },
  {
    name: "05-erp-production-export-2026-03",
    title: "ERP production export March 2026",
    html: page(
      "ERP production export March 2026",
      `<header><div><div class="brand">${EXPORTER.en}</div><div class="muted">ERP report · MM-PROD-017 · generated 01/04/2026 08:14</div></div>
       <div style="text-align:right"><h1>Monthly Production Summary</h1><div class="muted">Plant RY-01 · Period 2026-03</div></div></header>
       <table><tr><th>Date range</th><th>Material</th><th>Description</th><th class="num">Good output (kg)</th><th class="num">Scrap (kg)</th></tr>
         <tr><td>01–10/03</td><td>HRC-2.0</td><td>Hot-rolled coil 2.0 mm</td><td class="num">2,811,300</td><td class="num">41,200</td></tr>
         <tr><td>11–20/03</td><td>HRC-2.0</td><td>Hot-rolled coil 2.0 mm</td><td class="num">2,905,700</td><td class="num">38,900</td></tr>
         <tr><td>21–31/03</td><td>HRC-3.0</td><td>Hot-rolled coil 3.0 mm</td><td class="num">2,703,500</td><td class="num">44,100</td></tr>
         <tr><th colspan="3">Total</th><th class="num">8,420,500</th><th class="num">124,200</th></tr></table>
       <p class="muted">Converted: 8,420.5 t good output. CN 7208 39 00.</p>`,
    ),
    payload: {
      subject: "production",
      subjectConfidence: 0.96,
      month: "2026-03",
      monthConfidence: 0.97,
      issuer: EXPORTER.en,
      summary: "ERP production summary for March 2026 — 8,420.5 t of hot-rolled coil.",
      fields: [f("production-tonnes", "8420.5", "t", 0.96), f("scrap-tonnes", "124.2", "t", 0.9), f("cn-code", "7208 39 00", null, 0.88)],
    },
  },
  {
    name: "06-gas-flowmeter-calibration-certificate",
    title: "Calibration certificate GFM-22-0391",
    html: page(
      "Calibration certificate",
      `<header><div><div class="brand">Sample Metrology Laboratory Co., Ltd.</div><div class="muted">Fictional ISO/IEC 17025 laboratory · Cert. No. SML-CAL-26-00118</div></div>
       <div style="text-align:right"><h1>Calibration Certificate</h1><div class="muted">Issued 12 January 2026</div></div></header>
       <div class="grid"><div><b>Customer</b><br>${EXPORTER.en}</div><div><b>Instrument</b> Ultrasonic gas flow meter<br><b>Serial</b> GFM-22-0391<br><b>Range</b> 0–900 Sm³/h</div>
         <div><b>Date of calibration</b> 2026-01-12</div><div><b>Recommended next calibration</b> 2027-01-12</div></div>
       <table><tr><th class="num">Reference (Sm³/h)</th><th class="num">Indicated</th><th class="num">Error %</th><th class="num">U (k=2) %</th></tr>
         <tr><td class="num">150.0</td><td class="num">150.4</td><td class="num">+0.27</td><td class="num">0.35</td></tr>
         <tr><td class="num">450.0</td><td class="num">449.1</td><td class="num">−0.20</td><td class="num">0.30</td></tr>
         <tr><td class="num">800.0</td><td class="num">801.2</td><td class="num">+0.15</td><td class="num">0.30</td></tr></table>
       <div class="box">Result: within ±0.5 % maximum permissible error. Traceable to national measurement standards.</div>
       <div class="sign"><div>Calibrated by</div><div>Approved by</div></div>`,
    ),
    payload: {
      subject: "calibration",
      subjectConfidence: 0.94,
      monthConfidence: 0,
      issuer: "Sample Metrology Laboratory Co., Ltd.",
      summary: "Calibration certificate for gas flow meter GFM-22-0391, calibrated 12 January 2026, next due 12 January 2027.",
      fields: [f("instrument-serial", "GFM-22-0391", null, 0.95), f("calibration-date", "2026-01-12", null, 0.94), f("next-calibration-due", "2027-01-12", null, 0.9)],
    },
  },
  {
    name: "07-mill-test-certificate-slab-2026-03",
    title: "Mill test certificate EN 10204 3.1",
    html: page(
      "Mill test certificate",
      `<header><div><div class="brand">Sample Upstream Steel Mill PLC</div><div class="muted">Fictional supplier · Installation ID TH-SAMPLE-0007</div></div>
       <div style="text-align:right"><h1>Inspection Certificate</h1><div class="muted">EN 10204 Type 3.1 · MTC-2603-4471 · 22/03/2026</div></div></header>
       <div class="grid"><div><b>Purchaser</b> ${EXPORTER.en}</div><div><b>PO</b> PO-26-0312 · <b>Delivery</b> DO-88120</div>
         <div><b>Product</b> Steel slab 220 × 1250 mm</div><div><b>Grade</b> SS400 · <b>Heat No.</b> H26-03117</div></div>
       <table><tr><th>Heat</th><th class="num">Pieces</th><th class="num">Net mass (t)</th><th class="num">C %</th><th class="num">Mn %</th><th class="num">Si %</th></tr>
         <tr><td>H26-03117</td><td class="num">24</td><td class="num">250.000</td><td class="num">0.16</td><td class="num">0.72</td><td class="num">0.21</td></tr></table>
       <div class="box">Production route: EAF (scrap based). We hereby certify the material described has been tested and complies with the order.</div>`,
    ),
    payload: {
      subject: "mill_test_certificate",
      subjectConfidence: 0.93,
      month: "2026-03",
      monthConfidence: 0.82,
      issuer: "Sample Upstream Steel Mill PLC",
      summary: "EN 10204 3.1 certificate for 250 t of SS400 slab, heat H26-03117, delivered March 2026.",
      fields: [f("heat-number", "H26-03117", null, 0.94), f("net-mass", "250", "t", 0.92), f("production-route", "EAF (scrap based)", null, 0.83)],
    },
  },
  {
    name: "08-office-supplies-receipt",
    title: "ใบเสร็จรับเงิน เครื่องเขียน",
    html: page(
      "Office supplies receipt",
      `<header><div><div class="brand">ร้านเครื่องเขียนตัวอย่าง</div><div class="muted">Sample Stationery Shop (fictional)</div></div>
       <div style="text-align:right"><h1>ใบเสร็จรับเงิน</h1><div class="muted">เลขที่ 000517 · 05/03/2569</div></div></header>
       <table><tr><th>รายการ</th><th class="num">จำนวน</th><th class="num">ราคา</th></tr>
         <tr><td>กระดาษ A4 80 แกรม</td><td class="num">10 รีม</td><td class="num">1,250.00</td></tr>
         <tr><td>หมึกพิมพ์</td><td class="num">2</td><td class="num">1,780.00</td></tr>
         <tr><th colspan="2">รวม</th><th class="num">3,030.00</th></tr></table>`,
    ),
    payload: {
      subject: "unrelated",
      subjectConfidence: 0.92,
      month: "2026-03",
      monthConfidence: 0.7,
      issuer: "ร้านเครื่องเขียนตัวอย่าง",
      summary: "Receipt for paper and printer ink. Nothing on it relates to emissions, energy or production.",
      fields: [],
    },
  },

  /* ── Supplier Portal (/s/) samples: what an exporter asks a supplier for ── */
  {
    name: "09-cbam-communication-sheet-2026-q2",
    title: "CBAM communication sheet Q2 2026",
    html: page(
      "CBAM communication sheet",
      `<header><div><div class="brand">Sample Thai Metal Works Co., Ltd.</div><div class="muted">Fictional supplier · Installation TH-SAMPLE-MW03</div></div>
       <div style="text-align:right"><h1>CBAM Communication</h1><div class="muted">Embedded emissions of goods supplied · v2 template</div></div></header>
       <div class="grid"><div><b>Operator</b> Sample Thai Metal Works Co., Ltd.<br><b>Installation</b> Chonburi Plant 2</div>
         <div><b>Reporting period</b> 2026-04-01 – 2026-06-30<br><b>Prepared for</b> ${EXPORTER.en}</div></div>
       <table><tr><th>CN code</th><th>Good</th><th>Route</th><th class="num">Direct SEE (tCO₂e/t)</th><th class="num">Indirect SEE (tCO₂e/t)</th><th>Method</th></tr>
         <tr><td>7208 39 00</td><td>Hot-rolled coil</td><td>EAF</td><td class="num">1.62</td><td class="num">0.31</td><td>Actual</td></tr></table>
       <div class="box">Electricity emission factor: grid (TH), 0.399 tCO₂/MWh · Precursors: purchased slab, SEE 1.38 tCO₂e/t (verified)</div>
       <div class="sign"><div>Prepared by</div><div>Authorised signatory</div></div>`,
    ),
    payload: {
      subject: "cbam_communication",
      subjectConfidence: 0.94,
      month: "2026-06",
      monthConfidence: 0.6,
      issuer: "Sample Thai Metal Works Co., Ltd.",
      summary: "CBAM communication sheet for hot-rolled coil, Q2 2026 — direct 1.62 and indirect 0.31 tCO₂e/t on actual data.",
      fields: [
        f("reporting-period", "2026-04-01 – 2026-06-30", null, 0.95),
        f("cn-code", "7208 39 00", null, 0.93),
        f("direct-emissions", "1.62", "tCO2e/t", 0.92),
        f("indirect-emissions", "0.31", "tCO2e/t", 0.9),
        f("production-route", "EAF", null, 0.85),
      ],
    },
  },
  {
    name: "10-certificate-of-origin-2026-05",
    title: "Certificate of Origin May 2026",
    scan: true,
    html: page(
      "Certificate of Origin",
      `<header><div><div class="brand">Sample Chamber of Commerce (fictional)</div><div class="muted">หอการค้าตัวอย่าง</div></div>
       <div style="text-align:right"><h1>Certificate of Origin</h1><div class="muted">No. SMP-TH-2026-004471</div></div></header>
       <div class="grid"><div><b>1. Exporter</b><br>Sample Thai Metal Works Co., Ltd., Chonburi, Thailand</div><div><b>2. Consignee</b><br>${EXPORTER.en}</div>
         <div><b>3. Country of origin</b> Thailand</div><div><b>4. Issued</b> 14/05/2026</div></div>
       <table><tr><th>Marks</th><th>Description of goods</th><th>HS code</th><th class="num">Quantity</th></tr>
         <tr><td>SMW-0526</td><td>Hot-rolled steel coil, non-alloy</td><td>7208.3?</td><td class="num">250.000 t</td></tr></table>
       <p style="font-family:'Segoe Script',cursive;color:#1a3fa0;font-size:13pt;transform:rotate(-3deg)">certified — ตรวจแล้ว</p>`,
      { scan: true },
    ),
    payload: {
      subject: "certificate_of_origin",
      subjectConfidence: 0.91,
      month: "2026-05",
      monthConfidence: 0.88,
      issuer: "Sample Chamber of Commerce",
      summary: "Certificate of Origin SMP-TH-2026-004471 for 250 t of hot-rolled coil, issued 14 May 2026. Part of the HS code is smudged.",
      fields: [
        f("certificate-number", "SMP-TH-2026-004471", null, 0.9),
        f("country-of-origin", "Thailand", null, 0.96),
        f("issue-date", "2026-05-14", null, 0.88),
        f("cn-code", "7208 39", null, 0.62),
      ],
    },
  },
  {
    name: "11-verification-statement-2025",
    title: "Verification statement 2025",
    html: page(
      "Verification statement",
      `<header><div><div class="brand">Sample Verification Services Ltd.</div><div class="muted">Fictional accredited verifier · Accreditation SAMPLE-AB-0192</div></div>
       <div style="text-align:right"><h1>Verification Statement</h1><div class="muted">Issued 02 March 2026</div></div></header>
       <div class="grid"><div><b>Operator</b> Sample Thai Metal Works Co., Ltd.</div><div><b>Installation</b> Chonburi Plant 2 · TH-SAMPLE-MW03</div>
         <div><b>Reporting period</b> 2025-01-01 – 2025-12-31</div><div><b>Scope</b> Iron &amp; steel — embedded emissions</div></div>
       <div class="box"><b>Opinion:</b> Reasonable assurance — unmodified. The emissions report is free from material misstatement.</div>
       <table><tr><th>Good</th><th class="num">Verified direct SEE</th><th class="num">Verified indirect SEE</th></tr>
         <tr><td>Hot-rolled coil (7208 39 00)</td><td class="num">1.60 tCO₂e/t</td><td class="num">0.30 tCO₂e/t</td></tr></table>
       <div class="sign"><div>Lead verifier</div><div>Independent reviewer</div></div>`,
    ),
    payload: {
      subject: "precursor_verification",
      subjectConfidence: 0.87,
      month: "2026-03",
      monthConfidence: 0.5,
      issuer: "Sample Verification Services Ltd.",
      summary: "Verification statement for reporting year 2025 — reasonable assurance, unmodified opinion.",
      fields: [
        f("verifier-name", "Sample Verification Services Ltd.", null, 0.9),
        f("opinion", "Reasonable assurance — unmodified", null, 0.84),
        f("issue-date", "2026-03-02", null, 0.9),
        f("reporting-period", "2025-01-01 – 2025-12-31", null, 0.92),
      ],
    },
  },
];

/* Which sample set each document belongs to — the workspace intake loads
   "workspace", the Supplier Portal intake loads "supplier". An electricity
   bill and the office receipt ride along in the supplier set as documents the
   exporter did not ask for. */
const SETS = {
  "01-electricity-bill-2026-03": ["workspace", "supplier"],
  "07-mill-test-certificate-slab-2026-03": ["workspace", "supplier"],
  "08-office-supplies-receipt": ["workspace", "supplier"],
  "09-cbam-communication-sheet-2026-q2": ["supplier"],
  "10-certificate-of-origin-2026-05": ["supplier"],
  "11-verification-statement-2025": ["supplier"],
};

const b64url = (s) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const index = [];
for (const doc of DOCS) {
  const htmlPath = join(srcDir, `${doc.name}.html`);
  const pdfPath = join(outDir, `${doc.name}.pdf`);
  writeFileSync(htmlPath, doc.html, "utf8");

  execFileSync(
    CHROME,
    ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href],
    { stdio: "ignore" },
  );

  const pdf = await PDFDocument.load(readFileSync(pdfPath));
  pdf.setTitle(`${doc.title} (SAMPLE)`);
  pdf.setSubject("Fictional sample document for the Certrace smart intake prototype");
  pdf.setKeywords([`certrace-mock:${b64url(JSON.stringify({ v: 1, ...doc.payload }))}`]);
  pdf.setProducer("scripts/make-mock-documents.mjs");
  writeFileSync(pdfPath, await pdf.save());

  index.push({ file: `${doc.name}.pdf`, title: doc.title, sets: SETS[doc.name] ?? ["workspace"] });
  console.log("wrote", `public/mock-documents/${doc.name}.pdf`);
}
writeFileSync(join(outDir, "index.json"), JSON.stringify(index, null, 2));
console.log("wrote public/mock-documents/index.json");

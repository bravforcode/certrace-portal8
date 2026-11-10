import { expect, test } from "bun:test";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createCanvas } from "@napi-rs/canvas";
import JSZip from "jszip";
import {
  ocrDocument,
  readDocumentPages,
  SPREADSHEET_TYPE,
} from "../src/modules/cera/document-ocr";
import { readUpload } from "../src/modules/files/service";

test("DeepSeek OCR 2 keeps Thai and English evidence and uses the separate Novita key", async () => {
  const previous = process.env.NOVITA_API_KEY;
  process.env.NOVITA_API_KEY = "test-ocr-key";
  try {
    const pages = await ocrDocument(
      Buffer.from([137, 80, 78, 71]),
      "image/png",
      (async (url, init) => {
        expect(String(url)).toBe(
          "https://api.novita.ai/openai/v1/chat/completions",
        );
        expect(new Headers(init?.headers).get("authorization")).toBe(
          "Bearer test-ocr-key",
        );
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe("deepseek/deepseek-ocr-2");
        expect(body.messages[0].content[0].image_url.url).toContain(
          "data:image/png;base64,",
        );
        expect(body.messages[0].content[1].text).toContain(
          "Convert the document to markdown",
        );
        return Response.json({
          choices: [
            { message: { content: "ปริมาณไฟฟ้า 1,200 kWh\nProduction: 42 t" } },
          ],
        });
      }) as typeof fetch,
    );
    expect(pages).toEqual([
      { page: 1, text: "ปริมาณไฟฟ้า 1,200 kWh\nProduction: 42 t" },
    ]);
  } finally {
    if (previous === undefined) delete process.env.NOVITA_API_KEY;
    else process.env.NOVITA_API_KEY = previous;
  }
});

test("a scanned PDF page is rendered before DeepSeek OCR 2 receives an image", async () => {
  const previous = process.env.NOVITA_API_KEY;
  process.env.NOVITA_API_KEY = "test-ocr-key";
  try {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([300, 400]);
    const scan = createCanvas(260, 80);
    const ctx = scan.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 260, 80);
    ctx.fillStyle = "black";
    ctx.font = "20px sans-serif";
    ctx.fillText("Electricity 120 kWh", 10, 45);
    const image = await pdf.embedPng(scan.toBuffer("image/png"));
    page.drawImage(image, { x: 20, y: 300, width: 260, height: 80 });
    const pages = await ocrDocument(
      Buffer.from(await pdf.save()),
      "application/pdf",
      (async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        expect(
          body.messages[0].content[0].image_url.url.startsWith(
            "data:image/png;base64,",
          ),
        ).toBe(true);
        return Response.json({
          choices: [{ message: { content: "Electricity 120 kWh" } }],
        });
      }) as typeof fetch,
    );
    expect(pages).toEqual([{ page: 1, text: "Electricity 120 kWh" }]);
  } finally {
    if (previous === undefined) delete process.env.NOVITA_API_KEY;
    else process.env.NOVITA_API_KEY = previous;
  }
});

test("a text-bearing PDF uses its readable text layer without an OCR call", async () => {
  const previous = process.env.NOVITA_API_KEY;
  process.env.NOVITA_API_KEY = "test-ocr-key";
  try {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText("Monthly production register for March 2026", {
      x: 40,
      y: 740,
      font,
    });
    page.drawText(
      "Finished product produced 4,820.5 t for the selected product report",
      {
        x: 40,
        y: 710,
        font,
      },
    );
    const pages = await ocrDocument(
      Buffer.from(await pdf.save()),
      "application/pdf",
      (async () => {
        throw Error("OCR must not be called for readable PDF text");
      }) as unknown as typeof fetch,
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]?.text).toContain("Finished product produced 4,820.5 t");
  } finally {
    if (previous === undefined) delete process.env.NOVITA_API_KEY;
    else process.env.NOVITA_API_KEY = previous;
  }
});

test("OCR rejects unavailable and unsupported documents before transport", async () => {
  const previous = process.env.NOVITA_API_KEY;
  delete process.env.NOVITA_API_KEY;
  try {
    await expect(
      ocrDocument(Buffer.from("x"), "application/pdf"),
    ).rejects.toMatchObject({ code: "OCR_UNAVAILABLE" });
    await expect(
      ocrDocument(Buffer.from("x"), "application/zip"),
    ).rejects.toMatchObject({ code: "OCR_FILE_TYPE" });
  } finally {
    if (previous !== undefined) process.env.NOVITA_API_KEY = previous;
  }
});

test("OCR reports a rejected Novita key without exposing the provider response", async () => {
  const previous = process.env.NOVITA_API_KEY;
  process.env.NOVITA_API_KEY = "test-ocr-key";
  try {
    await expect(
      ocrDocument(Buffer.from([137, 80, 78, 71]), "image/png", (async (
        _url,
        _init,
      ) =>
        Response.json(
          { error: { message: "private provider response" } },
          { status: 401 },
        )) as typeof fetch),
    ).rejects.toMatchObject({
      code: "OCR_AUTH",
      message: "Document reading is unavailable. Please contact support.",
    });
  } finally {
    if (previous === undefined) delete process.env.NOVITA_API_KEY;
    else process.env.NOVITA_API_KEY = previous;
  }
});

test("text-bearing Word and PowerPoint files keep Thai text without OCR calls", async () => {
  const word = new JSZip();
  word.file("[Content_Types].xml", "types");
  word.file(
    "word/document.xml",
    "<w:document><w:t>ไฟฟ้า &amp; gas</w:t><w:t>120 kWh</w:t></w:document>",
  );
  const wordBytes = Buffer.from(
    await word.generateAsync({ type: "nodebuffer" }),
  );
  const wordUpload = await readUpload(
    new Request("http://localhost/upload", {
      method: "POST",
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      body: wordBytes,
    }),
  );
  expect(wordUpload.data.equals(wordBytes)).toBe(true);
  expect(
    await readDocumentPages(
      wordBytes,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
  ).toEqual([{ page: 1, text: "ไฟฟ้า & gas 120 kWh" }]);
  const slides = new JSZip();
  slides.file("[Content_Types].xml", "types");
  slides.file("ppt/slides/slide1.xml", "<p:sp><a:t>สไลด์ 1</a:t></p:sp>");
  expect(
    await readDocumentPages(
      Buffer.from(await slides.generateAsync({ type: "nodebuffer" })),
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ),
  ).toEqual([{ page: 1, text: "สไลด์ 1" }]);
});

test("plain text and spreadsheet cells reach the mapper with their original Thai values", async () => {
  expect(
    await readDocumentPages(Buffer.from("ไฟฟ้า 120 kWh"), "text/plain"),
  ).toEqual([{ page: 1, text: "ไฟฟ้า 120 kWh" }]);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("มีนาคม 2026");
  sheet.getCell("A1").value = "Electricity consumed";
  sheet.getCell("B1").value = 120;
  sheet.getCell("C1").value = "kWh";
  const data = Buffer.from(await workbook.xlsx.writeBuffer());
  const upload = await readUpload(
    new Request("http://localhost/upload", {
      method: "POST",
      headers: { "content-type": SPREADSHEET_TYPE },
      body: data,
    }),
  );
  expect(upload.content_type).toBe(SPREADSHEET_TYPE);
  const pages = await readDocumentPages(upload.data, SPREADSHEET_TYPE);
  expect(pages).toHaveLength(1);
  expect(pages[0]!.text).toContain("Sheet: มีนาคม 2026");
  expect(pages[0]!.text).toContain(
    "A1: Electricity consumed | B1: 120 | C1: kWh",
  );
});

test("Office reading rejects dishonest ZIP sizes before document parsing", async () => {
  const zip = new JSZip();
  zip.file("word/document.xml", "<w:t>valid</w:t>");
  zip.file("unused.bin", Buffer.alloc(1024 * 1024));
  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  const central = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  bytes.writeUInt32LE(1, central + 24);
  await expect(
    readDocumentPages(
      bytes,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
  ).rejects.toMatchObject({ status: 422 });
});

test("spreadsheet expansion is capped across all entries", async () => {
  const zip = new JSZip();
  for (const name of ["a", "b"]) zip.file(name, Buffer.alloc(6 * 1024 * 1024));
  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  await expect(
    readDocumentPages(bytes, SPREADSHEET_TYPE),
  ).rejects.toMatchObject({ code: "DOCUMENT_LIMIT" });
});

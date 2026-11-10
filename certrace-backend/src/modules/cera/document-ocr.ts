import { ApiError, fail } from "../../lib/errors";
import type { PageReading } from "../evidence/autofill-types";

export const OCR_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);
export const OFFICE_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
export const TEXT_TYPES = new Set([
  "text/plain",
  "text/csv",
  "text/tab-separated-values",
  "text/markdown",
  "application/json",
]);
export const SPREADSHEET_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const ocrConfigured = () => Boolean(process.env.NOVITA_API_KEY?.trim());
export const ocrModel = () =>
  process.env.CERTRACE_OCR_MODEL?.trim() || "deepseek/deepseek-ocr-2";

async function ocrImage(
  data: Buffer,
  mediaType: "image/png" | "image/jpeg",
  page: number,
  fetchImpl: typeof fetch,
): Promise<PageReading> {
  let response: Response;
  try {
    response = await fetchImpl(
      "https://api.novita.ai/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NOVITA_API_KEY!.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ocrModel(),
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType};base64,${data.toString("base64")}`,
                  },
                },
                {
                  type: "text",
                  text: "<|grounding|>Convert the document to markdown.",
                },
              ],
            },
          ],
          temperature: 0,
          top_k: 0,
          max_tokens: 4096,
          stream: false,
        }),
        signal: AbortSignal.timeout(60_000),
      },
    );
  } catch {
    fail(503, "OCR_FAILED", "Document reading failed. Please retry.");
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      fail(
        503,
        "OCR_AUTH",
        "Document reading is unavailable. Please contact support.",
      );
    if (response.status === 402)
      fail(
        503,
        "OCR_CREDIT",
        "Document reading is unavailable. Please contact support.",
      );
    if (response.status === 429)
      fail(
        503,
        "OCR_RATE_LIMIT",
        "Document reading is busy. Retry the document later.",
      );
    if (response.status === 400 || response.status === 404)
      fail(
        503,
        "OCR_REQUEST",
        "Document reading failed. Please contact support.",
      );
    fail(
      503,
      "OCR_FAILED",
      "Document reading failed. Please retry or contact support.",
    );
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    fail(503, "OCR_FAILED", "Document reading failed. Please retry.");
  }
  const content = (
    payload as { choices?: { message?: { content?: unknown } }[] }
  )?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim())
    fail(422, "OCR_EMPTY", "No readable text was found in this document.");
  const text = content.replace(/<\|(?:ref|\/ref|det|\/det)\|>/g, "").trim();
  if (!text)
    fail(422, "OCR_EMPTY", "No readable text was found in this document.");
  return { page, text };
}

/** Read a bounded part of a document. The original bytes and OCR response are not logged or persisted here. */
export async function ocrDocument(
  data: Buffer,
  mediaType: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PageReading[]> {
  if (!OCR_TYPES.has(mediaType))
    fail(422, "OCR_FILE_TYPE", "Use PDF, PNG or JPEG.");
  if (!ocrConfigured())
    fail(503, "OCR_UNAVAILABLE", "Document reading is not configured.");
  if (mediaType !== "application/pdf")
    return [
      await ocrImage(
        data,
        mediaType as "image/png" | "image/jpeg",
        1,
        fetchImpl,
      ),
    ];
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("@napi-rs/canvas");
  const task = pdfjs.getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
  });
  try {
    const pdf = await task.promise;
    const readings: PageReading[] = [];
    let length = 0;
    for (let index = 1; index <= Math.min(pdf.numPages, 20); index++) {
      const page = await pdf.getPage(index);
      let embeddedText = "";
      try {
        const content = await page.getTextContent();
        embeddedText = content.items
          .flatMap((item) =>
            "str" in item && item.str.trim() ? [item.str.trim()] : [],
          )
          .join("\n");
      } catch {
        // A damaged text layer can still be read from the rendered page.
      }
      let reading: PageReading;
      if (embeddedText.length >= 80) {
        reading = { page: index, text: embeddedText };
      } else {
        const bounds = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: Math.min(2, 1800 / Math.max(bounds.width, bounds.height)),
        });
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        await page.render({
          canvas: canvas as unknown as HTMLCanvasElement,
          canvasContext: canvas.getContext(
            "2d",
          ) as unknown as CanvasRenderingContext2D,
          viewport,
        }).promise;
        reading = await ocrImage(
          canvas.toBuffer("image/png"),
          "image/png",
          index,
          fetchImpl,
        );
      }
      length += reading.text.length;
      if (length > 60_000)
        fail(
          422,
          "OCR_TOO_LONG",
          "The first 20 pages contain too much text. Use a shorter document.",
        );
      readings.push(reading);
      page.cleanup();
    }
    if (!readings.length)
      fail(422, "OCR_EMPTY", "No readable pages were found in this document.");
    return readings;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) throw error;
    fail(422, "OCR_INVALID", "This PDF could not be read.");
  } finally {
    await task.destroy();
  }
}

// Give downstream parsers only the entries that passed the actual byte budget.
// In particular ExcelJS must never reopen the original, untrusted archive.
async function readOfficeArchive(data: Buffer, byteLimit: number) {
  const { ZipReader, Uint8ArrayReader } = await import("@zip.js/zip.js");
  const JSZip = (await import("jszip")).default;
  const reader = new ZipReader(new Uint8ArrayReader(data), {
    useWebWorkers: false,
  });
  const archive = new JSZip();
  let remaining = byteLimit;
  let entries = 0;
  try {
    for await (const entry of reader.getEntriesGenerator()) {
      if (++entries > 2000 || entry.uncompressedSize > remaining)
        fail(422, "DOCUMENT_LIMIT", "Use a smaller Office document.");
      if (entry.directory) continue;
      const chunks: Buffer[] = [];
      await entry.getData(
        new WritableStream<Uint8Array>({
          write(chunk) {
            if (chunk.byteLength > remaining)
              fail(422, "DOCUMENT_LIMIT", "Use a smaller Office document.");
            remaining -= chunk.byteLength;
            chunks.push(Buffer.from(chunk));
          },
        }),
        { checkSignature: true },
      );
      archive.file(entry.filename, Buffer.concat(chunks), {
        createFolders: false,
      });
    }
    return archive;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    fail(422, "DOCUMENT_INVALID", "This Office document could not be read.");
  } finally {
    await reader.close();
  }
}

export async function readDocumentPages(
  data: Buffer,
  mediaType: string,
): Promise<PageReading[]> {
  if (OCR_TYPES.has(mediaType)) return ocrDocument(data, mediaType);
  if (OFFICE_TYPES.has(mediaType)) {
    const archive = await readOfficeArchive(data, 50 * 1024 * 1024);
    const word = mediaType.includes("wordprocessingml");
    const names = word
      ? ["word/document.xml"]
      : Object.keys(archive.files)
          .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
          .sort(
            (a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]),
          )
          .slice(0, 20);
    const readings: PageReading[] = [];
    let length = 0;
    for (const name of names) {
      const entry = archive.file(name);
      if (!entry) continue;
      const xml = await entry.async("string");
      const parts = [
        ...xml.matchAll(
          word
            ? /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g
            : /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g,
        ),
      ].map((match) =>
        match[1]!.replace(
          /&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi,
          (entity) => {
            const named: Record<string, string> = {
              "&amp;": "&",
              "&lt;": "<",
              "&gt;": ">",
              "&quot;": '"',
              "&apos;": "'",
            };
            if (entity[1] !== "#") return named[entity.toLowerCase()] ?? entity;
            const hex = entity[2]?.toLowerCase() === "x";
            const code = Number.parseInt(
              entity.slice(hex ? 3 : 2, -1),
              hex ? 16 : 10,
            );
            return Number.isInteger(code) && code >= 0 && code <= 0x10ffff
              ? String.fromCodePoint(code)
              : entity;
          },
        ),
      );
      const text = parts.join(" ").trim();
      length += text.length;
      if (length > 60_000)
        fail(422, "DOCUMENT_TOO_LONG", "Use a shorter Office document.");
      readings.push({ page: readings.length + 1, text });
    }
    if (!readings.some((page) => page.text))
      fail(
        422,
        "DOCUMENT_EMPTY",
        "No readable text was found. Export image-only Office files as PDF for OCR.",
      );
    return readings;
  }
  if (mediaType === SPREADSHEET_TYPE) {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const archive = await readOfficeArchive(data, 10 * 1024 * 1024);
    const checked = await archive.generateAsync({
      type: "nodebuffer",
      compression: "STORE",
    });
    try {
      // ExcelJS declares an older Buffer shape; Bun's Buffer is compatible at runtime.
      await workbook.xlsx.load(
        checked as unknown as Parameters<typeof workbook.xlsx.load>[0],
      );
    } catch {
      fail(422, "SPREADSHEET_INVALID", "This spreadsheet could not be read.");
    }
    if (!workbook.worksheets.length || workbook.worksheets.length > 20)
      fail(422, "SPREADSHEET_LIMIT", "Use a workbook with 1–20 sheets.");
    const pages: PageReading[] = [];
    let total = 0;
    let valueCount = 0;
    for (const [index, sheet] of workbook.worksheets.entries()) {
      if (sheet.rowCount > 2000 || sheet.columnCount > 50)
        fail(
          422,
          "SPREADSHEET_LIMIT",
          "Use up to 2,000 rows and 50 columns per sheet.",
        );
      const lines = [`Sheet: ${sheet.name}`];
      for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
        const row = sheet.getRow(rowNumber);
        if (!row.hasValues) continue;
        const cells: string[] = [];
        row.eachCell({ includeEmpty: false }, (cell) => {
          const value = cell.value;
          const text =
            value instanceof Date
              ? value.toISOString().slice(0, 10)
              : typeof value === "string" ||
                  typeof value === "number" ||
                  typeof value === "boolean"
                ? String(value)
                : "";
          if (text) {
            cells.push(`${cell.address}: ${text}`);
            valueCount++;
          }
        });
        if (cells.length) lines.push(cells.join(" | "));
      }
      const text = lines.join("\n");
      total += text.length;
      if (total > 60_000)
        fail(
          422,
          "SPREADSHEET_LIMIT",
          "Use a smaller spreadsheet for one reading.",
        );
      pages.push({ page: index + 1, text });
    }
    if (!valueCount)
      fail(
        422,
        "DOCUMENT_EMPTY",
        "No readable values were found in this workbook.",
      );
    return pages;
  }
  if (!TEXT_TYPES.has(mediaType))
    fail(422, "DOCUMENT_FILE_TYPE", "This document type cannot be read.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(data);
  } catch {
    fail(422, "DOCUMENT_ENCODING", "Use a UTF-8 text file.");
  }
  if (!text.trim())
    fail(422, "DOCUMENT_EMPTY", "No readable text was found in this file.");
  if (text.length > 60_000)
    fail(422, "DOCUMENT_TOO_LONG", "Use a shorter text document.");
  return [{ page: 1, text }];
}

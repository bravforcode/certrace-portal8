/* A minimal .xlsx writer, in the browser and with no dependency.

   An .xlsx is a zip of SpreadsheetML parts. This writes the five the format needs
   (content types, package rels, workbook, workbook rels, one part per sheet) and
   packages them with the ZIP writer in lib/zip.ts. Cells are inline strings or
   numbers, never formulas: a text value that starts with = + - @ is still text,
   so a spreadsheet opened by a verifier cannot run it.

   Not a general-purpose writer: no styles, no shared strings, no formulas, no
   merged cells. The reader that checks it is lib/workbook/xlsx.ts. */

import { buildZip, type ZipEntry } from "./zip";

/** A cell: text, a finite number, or null for an empty cell. */
export type XlsxCell = string | number | null;
export type XlsxSheet = { name: string; rows: XlsxCell[][] };

const FORBIDDEN_IN_NAME = /[[\]:*?/\\]/g;
const MAX_NAME = 31;

/** A sheet name Excel accepts: no []:*?/\, at most 31 characters, never blank. */
export function safeSheetName(raw: string): string {
  const cleaned = raw
    .replace(FORBIDDEN_IN_NAME, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^'+|'+$/g, "")
    .trim();
  const name = (cleaned || "Sheet").slice(0, MAX_NAME).trim();
  return name || "Sheet";
}

/* XML 1.0 cannot carry these control characters at all. */
const XML_INVALID = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const esc = (s: string) =>
  s
    .replace(XML_INVALID, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** A-1-style column letters for a zero-based column index. */
function columnLetters(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function cellXml(ref: string, value: XlsxCell): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    // A non-finite number has no spreadsheet form; it is left empty rather than written wrong.
    return Number.isFinite(value) ? `<c r="${ref}"><v>${value}</v></c>` : "";
  }
  if (value === "") return "";
  // Every text value is an inline string, so nothing here can become a formula.
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

function sheetXml(rows: XlsxCell[][]): string {
  const body = rows
    .map((row, r) => {
      const cells = row.map((v, c) => cellXml(`${columnLetters(c)}${r + 1}`, v)).join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${body}</sheetData></worksheet>`
  );
}

/** The .xlsx package for these sheets, in order. The first sheet opens first. */
export function buildXlsx(sheets: XlsxSheet[]): Uint8Array {
  if (sheets.length === 0) throw new Error("A workbook needs at least one sheet.");
  const names = sheets.map((s) => safeSheetName(s.name));

  const overrides = sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    overrides +
    `</Types>`;

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const sheetEntries = names
    .map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets>${sheetEntries}</sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join("") +
    `</Relationships>`;

  const enc = new TextEncoder();
  const entries: ZipEntry[] = [
    { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
    { name: "_rels/.rels", data: enc.encode(rootRels) },
    { name: "xl/workbook.xml", data: enc.encode(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(workbookRels) },
    ...sheets.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: enc.encode(sheetXml(s.rows)),
    })),
  ];
  return buildZip(entries);
}

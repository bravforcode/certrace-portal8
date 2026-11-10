import { config } from "../../lib/config";
import { fail } from "../../lib/errors";
import { hash } from "../../lib/security";
import type { uploaded_files } from "../../generated/prisma/client";
import { readFileContent, type FileContent } from "./storage";
export const allowed = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "text/csv": ".csv",
  "text/plain": ".txt",
  "text/tab-separated-values": ".tsv",
  "text/markdown": ".md",
  "application/json": ".json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
};
export const safeName = (name: string) =>
  (name.normalize("NFKD").replaceAll("\\", "/").split("/").at(-1) ?? "upload")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 120) || "upload";
function officeArchive(bytes: Buffer, prefix: "xl/" | "word/" | "ppt/") {
  const end = bytes.lastIndexOf(Buffer.from([80, 75, 5, 6]));
  if (end < 0 || end + 22 > bytes.length) return false;
  let offset = bytes.readUInt32LE(end + 16);
  const count = bytes.readUInt16LE(end + 10),
    names: string[] = [];
  let uncompressed = 0;
  if (count > 2000) return false;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50)
      return false;
    uncompressed += bytes.readUInt32LE(offset + 24);
    if (uncompressed > (prefix === "xl/" ? 10 : 50) * 1024 * 1024) return false;
    const length = bytes.readUInt16LE(offset + 28),
      extra = bytes.readUInt16LE(offset + 30),
      comment = bytes.readUInt16LE(offset + 32);
    if (offset + 46 + length + extra + comment > bytes.length) return false;
    names.push(bytes.subarray(offset + 46, offset + 46 + length).toString());
    offset += 46 + length + extra + comment;
  }
  return (
    names.includes("[Content_Types].xml") &&
    names.some((n) => n.startsWith(prefix))
  );
}
export async function readUpload(request: Request) {
  const contentType =
    request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ??
    "";
  if (Number(request.headers.get("content-length")) > config.maxUploadBytes)
    fail(413, "FILE_TOO_LARGE", "This file exceeds the upload limit.");
  const reader = request.body?.getReader(),
    chunks: Uint8Array[] = [];
  let length = 0;
  if (reader)
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > config.maxUploadBytes) {
        await reader.cancel();
        fail(413, "FILE_TOO_LARGE", "This file exceeds the upload limit.");
      }
      chunks.push(value);
    }
  const data = Buffer.concat(chunks);
  if (!data.length) fail(422, "FILE_EMPTY", "That upload had no content.");
  if (!(contentType in allowed))
    fail(
      422,
      "FILE_TYPE_NOT_ALLOWED",
      "Use PDF, PNG, JPEG, DOCX, PPTX, TXT, CSV, TSV, Markdown, JSON or XLSX.",
    );
  const matches =
    contentType === "application/pdf"
      ? data.subarray(0, 5).toString() === "%PDF-"
      : contentType === "image/png"
        ? data
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : contentType === "image/jpeg"
          ? data.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
          : contentType.endsWith("sheet")
            ? officeArchive(data, "xl/")
            : contentType.endsWith("wordprocessingml.document")
              ? officeArchive(data, "word/")
              : contentType.endsWith("presentationml.presentation")
                ? officeArchive(data, "ppt/")
                : !data.includes(0) &&
                  (() => {
                    try {
                      new TextDecoder("utf-8", { fatal: true }).decode(data);
                      return true;
                    } catch {
                      return false;
                    }
                  })();
  if (!matches)
    fail(
      422,
      "FILE_CONTENT_MISMATCH",
      "The contents do not match the file type.",
    );
  return { data, content_type: contentType, sha256: hash(data) };
}
export const metadata = (row: uploaded_files) => ({
  id: row.id,
  declarationId: row.declaration_id,
  docId: row.doc_id,
  filename: row.filename,
  contentType: row.content_type,
  sizeBytes: Number(row.size_bytes),
  sha256: row.sha256,
  uploadedAt: +row.created_at,
  uploadedBySupplier: row.uploaded_via_token !== null,
});
export async function download(
  row: FileContent & {
    content_type: string;
    filename: string;
  },
) {
  return new Response(new Uint8Array(await readFileContent(row)), {
    headers: {
      "Content-Type": row.content_type,
      "Content-Disposition": `attachment; filename="${safeName(row.filename)}"`,
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

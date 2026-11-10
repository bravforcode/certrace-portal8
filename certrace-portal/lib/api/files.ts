/* ════════════════════════════════════════════════════════════
   EVIDENCE FILES — where the certificate itself goes

   Until this existed, a supplier's certificate was read into a base64 data
   URL and carried inside the answer blob in their own browser's
   localStorage. Anything past ~1.5 MB kept its name and size and lost its
   contents (lib/cbam/evidence.ts, INLINE_BYTES_LIMIT). Most real mill
   certificates are larger than that, so the one document a verifier would ask
   for was the one the portal threw away.

   These calls put the bytes on the server instead, and leave a reference
   behind in the state that used to hold the whole file.

   ── Two audiences, and the token is not a session ─────────────
   The exporter uploads against a declaration they own, authenticated. The
   supplier uploads against a Smart Link and has no account at all, so those
   calls pass `auth: false` for the same reason `resolve` and `submit` do: if
   the exporter opens the link in their own browser, their credential must not
   travel to a route that has to work without one.

   ── The upload is the raw file ────────────────────────────────
   Not JSON, not multipart. The name travels in the query string and the type
   in the Content-Type header, which is what the browser already knows about
   the File — and what the server checks the bytes against before storing it.
   ════════════════════════════════════════════════════════════ */

import { request } from "./http";
import { api, result } from "./client";
import { decode } from "./decode";
import { isStoredFile } from "./validators.js";

/** What the server says about a stored file. Never its storage key: that is
    the address of the object, and a client that learns one will use it. */
export type StoredFile = {
  id: string;
  declarationId: string;
  /** the requested document slot this answers, when it answers one */
  docId: string | null;
  filename: string;
  contentType: string;
  sizeBytes: number;
  /** sha-256 computed where the bytes landed, not in the browser */
  sha256: string;
  uploadedAt: number | null;
  uploadedBySupplier: boolean;
};

export type UploadLimits = {
  maxBytes: number;
  allowedContentTypes: string[];
  allowedExtensions: string[];
};

/** What will be accepted, so a 40 MB scan can be refused at the file picker
    rather than after it has been sent. Public: a supplier has no session. */
export const uploadLimits = (): Promise<UploadLimits> =>
  result(api(false).api.v1.uploads.limits.get());

/* A browser gives an empty `type` for a file it does not recognise, and the
   server refuses an upload with no declared type rather than guessing. Saying
   so here — with the extension in the message — is more use than the generic
   refusal that would come back.

   Note that both upload functions are `async` rather than promise-returning
   expressions, so this throw arrives as a rejection like every other failure.
   A function that throws synchronously for one bad input and rejects for the
   rest has to be caught twice, and the second catch is the one nobody writes. */
function contentTypeOf(file: File): string {
  const declared = (file.type || "").trim();
  if (declared) return declared;
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "";
  throw new Error(
    `This browser did not recognise ${extension ? `.${extension}` : "that"} files, so it cannot say what type to send. ` +
      `Re-save it as a PDF, or upload it from a device that knows the type.`,
  );
}

const query = (filename: string, docId?: string): string => {
  const params = new URLSearchParams({ filename });
  if (docId) params.set("docId", docId);
  return params.toString();
};

/** The exporter's own upload, against a declaration they own. */
export async function uploadDeclarationFile(
  declarationId: string,
  file: File,
  docId?: string,
): Promise<StoredFile> {
  const contentType = contentTypeOf(file);
  return decode(
    await request<unknown>(
      `/api/v1/declarations/${encodeURIComponent(declarationId)}/files?${query(file.name, docId)}`,
      { method: "POST", rawBody: file, contentType },
    ),
    isStoredFile,
  );
}

export const listDeclarationFiles = (
  declarationId: string,
): Promise<{ files: StoredFile[] }> =>
  result(
    api()
      .api.v1.declarations({
        declaration_id: encodeURIComponent(declarationId),
      })
      .files.get(),
  );

export const downloadFile = (fileId: string): Promise<Blob> =>
  request<Blob>(`/api/v1/files/${encodeURIComponent(fileId)}`, {
    responseType: "blob",
  });

export const deleteFile = (fileId: string): Promise<void> =>
  request<void>(`/api/v1/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
  });

/** The supplier's upload, against a live Smart Link and nothing else. */
export async function uploadLinkFile(
  token: string,
  file: File,
  docId?: string,
): Promise<StoredFile> {
  const contentType = contentTypeOf(file);
  return decode(
    await request<unknown>(
      `/api/v1/links/${encodeURIComponent(token)}/files?${query(file.name, docId)}`,
      {
        method: "POST",
        rawBody: file,
        contentType,
        auth: false,
        timeoutMs: 120_000,
      },
    ),
    isStoredFile,
  );
}

export const listLinkFiles = (
  token: string,
): Promise<{ files: StoredFile[] }> =>
  result(
    api(false)
      .api.v1.links({ token: encodeURIComponent(token) })
      .files.get(),
  );

export const downloadLinkFile = (
  token: string,
  fileId: string,
): Promise<Blob> =>
  request<Blob>(
    `/api/v1/links/${encodeURIComponent(token)}/files/${encodeURIComponent(fileId)}`,
    {
      responseType: "blob",
      auth: false,
    },
  );

/* ── Handing the file to the person looking at it ──────────────
   A stored file cannot be a plain href: the exporter's route needs an
   Authorization header, which a link element cannot send. So the bytes are
   fetched and handed over as an object URL, and the URL is revoked after the
   click — one left behind pins the whole file in memory for the life of the
   tab, which for evidence is exactly the size of file worth not pinning. */
export function saveBlobAs(blob: Blob, filename: string): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  /* One turn of the event loop: Safari has not finished reading the URL when
     click() returns, and revoking synchronously cancels the download. */
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
